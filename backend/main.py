# main.py
# CollabPlayground backend
# Endpoints:
#   POST /review       — sends a commit diff to Gemini, returns pedagogical feedback
#   POST /validate-key — checks if a pasted SSH public key is well-formed
#
# Run: fastapi dev main.py
# Needs: GEMINI_API_KEY in .env

import os
import re
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel("gemini-2.5-flash")

app = FastAPI(title="CollabPlayground API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── /review ──────────────────────────────────────────────────────────────────

class ReviewRequest(BaseModel):
    commit_message: str
    before: str          # file content before the commit
    after: str           # file content after the commit
    author: str = "student"


class ReviewResponse(BaseModel):
    summary: str         # one-line takeaway
    praise: str          # something genuinely good
    suggestion: str      # one concrete improvement
    concept: str         # a Git/engineering concept this commit illustrates
    raw: str             # full Gemini response for debugging


REVIEW_PROMPT = """You are a friendly, encouraging senior software engineer doing a first code review
for a junior developer. Your tone is warm, direct, and pedagogical — like a mentor, not a grader.
Never use bullet points. Write in short paragraphs. Be specific, not generic.

The student made a commit with this message: "{message}"

Here is what changed:

BEFORE:
{before}

AFTER:
{after}

Respond with ONLY valid JSON matching this exact shape — no markdown fences, no preamble:
{{
  "summary": "one sentence: the most important thing to take away from this commit",
  "praise": "one sentence: something genuinely good about what they did (be specific)",
  "suggestion": "one or two sentences: one concrete thing they could improve or think about next time",
  "concept": "one sentence: a Git or software engineering concept this commit is a good example of"
}}"""


@app.post("/review", response_model=ReviewResponse)
async def review_commit(req: ReviewRequest):
    prompt = REVIEW_PROMPT.format(
        message=req.commit_message,
        before=req.before or "(empty file)",
        after=req.after or "(empty file)",
    )

    try:
        result = model.generate_content(prompt)
        raw = result.text.strip()

        # strip any accidental ```json fences Gemini sometimes adds
        raw_clean = re.sub(r"^```(?:json)?\s*", "", raw)
        raw_clean = re.sub(r"\s*```$", "", raw_clean).strip()

        parsed = json.loads(raw_clean)

        return ReviewResponse(
            summary=parsed.get("summary", ""),
            praise=parsed.get("praise", ""),
            suggestion=parsed.get("suggestion", ""),
            concept=parsed.get("concept", ""),
            raw=raw,
        )

    except json.JSONDecodeError:
        # Gemini returned something we can't parse — surface raw as summary
        return ReviewResponse(
            summary=raw[:300] if raw else "No response from model.",
            praise="",
            suggestion="",
            concept="",
            raw=raw,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── /validate-key ────────────────────────────────────────────────────────────

class KeyRequest(BaseModel):
    key: str


class KeyResponse(BaseModel):
    valid: bool
    key_type: str | None
    message: str


VALID_PREFIXES = ["ssh-ed25519", "ssh-rsa", "ssh-ecdsa", "ecdsa-sha2-nistp256"]


@app.post("/validate-key", response_model=KeyResponse)
async def validate_key(req: KeyRequest):
    key = req.key.strip()
    parts = key.split()

    if len(parts) < 2:
        return KeyResponse(valid=False, key_type=None,
                           message="Key looks incomplete — make sure you copied the full line.")

    prefix = parts[0]
    if prefix not in VALID_PREFIXES:
        return KeyResponse(valid=False, key_type=None,
                           message=f"Unrecognised key type '{prefix}'. Expected ssh-ed25519 or ssh-rsa.")

    # base64 body should be reasonably long
    if len(parts[1]) < 40:
        return KeyResponse(valid=False, key_type=prefix,
                           message="The key body looks too short — did you copy the whole line?")

    return KeyResponse(valid=True, key_type=prefix,
                       message=f"Valid {prefix} key ✓")


# ── health ───────────────────────────────────────────────────────────────────

@app.get("/")
async def health():
    return {"status": "ok", "service": "collab-playground-api"}