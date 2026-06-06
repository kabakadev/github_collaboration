# CollabPlayground

> **Zero to Collaborator** — Gamifying mastery of professional software development workflows.

A full-stack web application built for a hackathon that teaches Git collaboration through gameplay. The parts beginners quit on — SSH key setup, merge conflicts, the first push — become guided levels instead of silent dead-ends.

**Live app:** https://github-collaboration-by44.vercel.app  
**Backend API:** https://collab-playground-api.onrender.com

---

## Table of Contents

- [What It Is](#what-it-is)
- [Features](#features)
- [The Core Idea](#the-core-idea)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Frontend Guide](#frontend-guide)
- [Backend Guide](#backend-guide)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Architecture Decisions](#architecture-decisions)
- [Known Limitations](#known-limitations)

---

## What It Is

CollabPlayground is a gamified Git learning environment. Students practice real software engineering workflows — SSH setup, committing, branching, merging, and resolving conflicts — in a safe, visual, browser-based sandbox.

There is no real Git running. The entire Git world is simulated as plain JavaScript objects that pure functions transform. Every "commit" adds an entry to an in-memory object. Every "merge" runs a 3-way merge algorithm in the browser. This makes the app deterministic, fast, and impossible to break permanently — there is always a reset button.

---

## Features

### Level 0 — Forge Your Identity (SSH Onboarding)

A four-step guided stepper that teaches SSH key generation as a game level:

1. Type the exact `ssh-keygen` command — fake terminal animates the real output
2. Run `cat ~/.ssh/id_ed25519.pub` to reveal and copy the public key
3. Paste it into a simulated GitHub Settings page with real format validation
4. Run `ssh -T git@github.com` and see the authentication success message

The `skip — already set up SSH` button in the header lets returning users bypass this level.

### Live Git Visualizer

An animated SVG commit graph that updates in real time as students work:

- Each circle is a commit, each horizontal row is a branch
- The pulsing white ring marks HEAD — where you currently are
- Green pill labels the current branch, grey pills label others
- Gold dashed lines and amber nodes indicate merge commits
- Hover any node to see the commit message and author

### Collaboration Playground (Conflict Resolution)

When two branches change the same line, the control panel is replaced by a guided conflict resolver:

- Blue side = HEAD (yours), red side = incoming branch
- Each clash shows **Take Yours / Take Theirs / Keep Both** buttons
- The chosen side stays visible, the rejected side greys out
- A green stripe marks each resolved clash
- The Resolve button stays disabled until every conflict is addressed
- An **edit by hand** mode drops to a raw textarea for manual resolution
- The **⚔ practice conflict** button in the header triggers a pre-built conflict instantly

### AI Code Reviewer

After making a commit, students can request a Gemini-powered review:

- Diffs HEAD against its parent automatically
- Sends the commit message and both file snapshots to the FastAPI backend
- Returns four structured fields rendered as a PR-review card:
  - **TLDR** (blue) — the one-sentence takeaway
  - **What you did well** (green) — specific praise
  - **One thing to improve** (amber) — a concrete suggestion
  - **Engineering concept** (purple) — a Git/software concept this commit illustrates

### Skill Tracker Dashboard

A persistent progress panel that awards badges as milestones are hit:

| Badge             | Trigger                                  |
| ----------------- | ---------------------------------------- |
| First Commit      | Make 1 commit                            |
| Brancher          | Create a branch                          |
| Merger            | Complete a merge                         |
| Conflict Resolver | Resolve 1 conflict                       |
| Committed         | Make 5 commits (shows live counter)      |
| Peacemaker        | Resolve 3 conflicts (shows live counter) |

Badges survive practice-conflict resets. Only **⟲ reset repo** clears them.

---

## The Core Idea

Most platforms treat environment setup as a boring prerequisite. CollabPlayground flips it: **the frustrating parts become the first boss fights.**

The number-one beginner dropout point — SSH key generation, finding the public key, pasting it into GitHub settings — is turned into a guided, validated, animated quest. Students can't skip a step silently. Every step has a success state they recognise.

The Collaboration Playground extends this to merge conflicts. Instead of a wall of `<<<<<<< HEAD` markers in a terminal, students see a clear side-by-side comparison with explicit choices. The UI teaches that a conflict is Git asking a question it can't answer — not an error.

---

## Tech Stack

### Frontend

- **React 18 + Vite** — fast dev server, instant hot reload
- **Zustand** — global state store wrapping the Git engine
- **Hand-rolled SVG** — the commit graph is pure SVG, no graph library needed
- **No external UI library** — all components written from scratch

### Backend

- **FastAPI** — async Python web framework
- **Gemini 2.5 Flash** — Google's AI model via `google-generativeai`
- **python-dotenv** — environment variable loading

### Deployment

- **Frontend** → Vercel (auto-deploys on push to `main`)
- **Backend** → Render (free tier, scales to zero when idle)

---

## Project Structure

```
github_playground/              ← repo root
├── frontend/
│   ├── src/
│   │   ├── App.jsx             ← app shell, SSH gate, layout
│   │   ├── engine/
│   │   │   ├── gitEngine.js    ← pure Git simulation (commit, branch, merge, checkout)
│   │   │   └── graphLayout.js  ← positions commits into SVG lanes
│   │   ├── store/
│   │   │   └── useGitStore.js  ← Zustand store, emits skill-tracker events
│   │   └── components/
│   │       ├── GitVisualizer.jsx       ← animated SVG commit graph
│   │       ├── GitControls.jsx         ← working file editor + git action panel
│   │       ├── ConflictPlayground.jsx  ← merge conflict resolver
│   │       ├── SSHOnboarding.jsx       ← Level 0 four-step stepper
│   │       ├── AIReviewer.jsx          ← Gemini review card
│   │       └── SkillTracker.jsx        ← badges dashboard
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── backend/
│   ├── main.py                 ← FastAPI app (POST /review, POST /validate-key, GET /)
│   ├── requirements.txt        ← minimal: fastapi, uvicorn, google-generativeai, python-dotenv, pydantic
│   └── .env.example            ← template for secrets
├── docs/
│   ├── PROJECT_PLAN.md         ← original hackathon plan and timeline
│   ├── TEAM_GUIDE.md           ← teammate onboarding and testing guide
│   └── commit-graph-legend.svg ← annotated diagram of the commit graph UI
└── README.md                   ← this file
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- A Gemini API key (free tier at [aistudio.google.com](https://aistudio.google.com))

### 1. Clone the repo

```bash
git clone git@github.com:iankabaka/github_playground.git
cd github_playground
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`. The frontend works fully without the backend — the AI reviewer will show an error if the backend isn't running, but everything else is client-side.

### 3. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

fastapi dev main.py             # runs on http://localhost:8000
```

### 4. Verify both are running

- Frontend: `http://localhost:5173` — you should see the SSH onboarding screen
- Backend: `http://localhost:8000` — should return `{"status":"ok","service":"collab-playground-api"}`

---

## Frontend Guide

### The simulated Git engine

`src/engine/gitEngine.js` contains the entire Git simulation as pure functions. Every function takes a repo object and returns a new one — no mutation, no side effects.

```js
// Repo shape
{
  commits: { [id]: { id, parents, message, author, fileSnapshot, timestamp } },
  branches: { [name]: commitId },
  HEAD: branchName,
  workingFile: string,
  staged: string | null,
  author: string,
}

// Available functions
createRepo({ author })
stage(repo)
commit(repo, message)
branch(repo, name)
checkout(repo, name)
merge(repo, otherBranch)       // returns { status, repo } or { status: 'conflict', ... }
resolveMerge(repo, { ourId, theirId, otherBranch, resolvedText })
logFrom(repo, commitId)
headCommitId(repo)
headCommit(repo)
```

### The Zustand store

`src/store/useGitStore.js` wraps the engine and exposes actions to the UI. It also emits milestone events that the Skill Tracker listens to:

```
first_commit, commit, branch, merge, conflict_resolved, ssh_verified, ai_review
```

These fire automatically — no manual wiring needed when adding new badges.

### Adding a new badge

Open `src/components/SkillTracker.jsx` and add an entry to the `BADGES` array:

```js
{
  id: "my_badge",
  icon: "🎯",
  title: "My Badge",
  desc: "What the student did to earn it.",
  event: "event_name",   // must match an event emitted by the store
  need: 1,               // how many times the event must fire
}
```

---

## Backend Guide

### Endpoints

#### `POST /review`

Sends a commit diff to Gemini 2.5 Flash and returns structured pedagogical feedback.

**Request body:**

```json
{
  "commit_message": "add login form",
  "before": "# file content before",
  "after": "# file content after",
  "author": "student"
}
```

**Response:**

```json
{
  "summary": "one-sentence takeaway",
  "praise": "what they did well",
  "suggestion": "one concrete improvement",
  "concept": "a Git or engineering concept this illustrates",
  "raw": "full Gemini response for debugging"
}
```

#### `POST /validate-key`

Checks whether a pasted SSH public key is well-formed.

**Request body:**

```json
{ "key": "ssh-ed25519 AAAA..." }
```

**Response:**

```json
{
  "valid": true,
  "key_type": "ssh-ed25519",
  "message": "Valid ssh-ed25519 key ✓"
}
```

#### `GET /`

Health check. Returns `{"status": "ok"}`.

### Gemini rate limits (free tier)

| Model                 | RPM | RPD  |
| --------------------- | --- | ---- |
| gemini-2.5-flash      | 10  | 500  |
| gemini-2.5-flash-lite | 15  | 1000 |

A 429 error means you've hit the requests-per-minute limit — wait 60 seconds and retry. For a demo, warm the backend up before going on stage (Render's free tier cold-starts after 15 minutes of inactivity).

To switch models, change one line in `backend/main.py`:

```python
model = genai.GenerativeModel("gemini-2.5-flash")
```

---

## Deployment

### Frontend (Vercel)

1. Import the repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Framework preset auto-detects as Vite
4. Add environment variable: `VITE_API_URL` = your Render backend URL
5. Deploy — subsequent pushes to `main` auto-deploy

### Backend (Render)

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect the GitHub repo
3. Set **Root Directory** to `backend`
4. **Build Command:** `pip install -r requirements.txt`
5. **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variable: `GEMINI_API_KEY` = your key
7. Deploy

The `$PORT` variable is required — Render assigns the port dynamically.

---

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable       | Description | Default                 |
| -------------- | ----------- | ----------------------- |
| `VITE_API_URL` | Backend URL | `http://localhost:8000` |

### Backend (`backend/.env`)

| Variable         | Description           | Required |
| ---------------- | --------------------- | -------- |
| `GEMINI_API_KEY` | Google Gemini API key | Yes      |

Get a Gemini key at [aistudio.google.com](https://aistudio.google.com). The free tier is sufficient for development and demos.

**Never commit `.env` files.** They are gitignored by default. Use `.env.example` as a template.

---

## Architecture Decisions

**Why simulate Git instead of running it?**  
Running a real `git` binary requires filesystem access, auth management, and makes the state hard to inspect and reset. Simulating it as plain JS objects means the visualizer updates instantly, conflicts are deterministic, and the entire state can be dumped to JSON for debugging. It also means the app runs entirely in the browser for Tier 1–3 features.

**Why keep the Git engine client-side?**  
The engine is pure logic — no I/O, no network. Keeping it in React state means zero latency between an action and the visualizer update. The backend only handles what genuinely needs a server: the Gemini API call (to keep the key secret) and future WebSocket multiplayer.

**Why Zustand over Redux or Context?**  
Zustand is minimal and doesn't require wrapping the component tree in providers. The store is a single object with actions — simple to read, simple to test.

**Why hand-roll the commit graph instead of using React Flow?**  
Fewer dependencies, total control over the animation, and the graph is simple enough (left-to-right lanes) that a few hundred lines of SVG is cleaner than configuring a library.

**Why FastAPI over Express or Flask?**  
Python has first-class support for the Gemini SDK. FastAPI is async by default (important for external API calls) and auto-generates API docs. Flask would work too but FastAPI is faster to get running with type-safe request/response models.

---

## Known Limitations

- **Git simulation is intentionally simplified.** The 3-way merge algorithm is line-based and naive. Real Git handles binary files, renames, and complex hunks — this does not. It's a teaching tool, not a Git replacement.
- **No persistence.** Repo state lives in React state and is lost on page refresh. This is by design for the hackathon scope — a future version could persist to localStorage or a backend.
- **Gemini free tier quota.** At 10 RPM, rapid repeated review requests will hit a 429. Wait 60 seconds.
- **Render cold starts.** The free tier backend spins down after 15 minutes idle. The first request after inactivity takes ~30 seconds. Hit the health endpoint before a demo.
- **Co-op multiplayer not implemented.** The architecture doc and store events are designed to support it (WebSocket room endpoint is stubbed), but it was scoped out of the hackathon build.
