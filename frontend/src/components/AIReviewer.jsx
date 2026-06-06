// AIReviewer.jsx
// Tier 4 — AI Code Reviewer.
// Reads the last commit from the store, diffs it against its parent,
// sends both to the FastAPI /review endpoint, and renders Gemini's feedback
// as a structured PR-review-style card.

import { useState } from "react";
import { useGitStore } from "../store/useGitStore";

const API =
  "https://github-collaboration-4jpfpdm6v-iankabaka1-gmailcoms-projects.vercel.app";

function diffSummary(before, after) {
  const bLines = (before || "").split("\n");
  const aLines = (after || "").split("\n");
  const added = aLines.filter((l) => !bLines.includes(l)).length;
  const removed = bLines.filter((l) => !aLines.includes(l)).length;
  return { added, removed };
}

export default function AIReviewer() {
  const repo = useGitStore((s) => s.repo);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const emit = useGitStore((s) => s._emit);

  const headId = repo.branches[repo.HEAD];
  const headCommit = headId ? repo.commits[headId] : null;
  const parentId = headCommit?.parents?.[0];
  const parentCommit = parentId ? repo.commits[parentId] : null;

  const before = parentCommit?.fileSnapshot ?? "";
  const after = headCommit?.fileSnapshot ?? "";
  const { added, removed } = diffSummary(before, after);

  async function requestReview() {
    if (!headCommit) return;
    setLoading(true);
    setFeedback(null);
    setError("");

    try {
      const res = await fetch(`${API}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commit_message: headCommit.message,
          before,
          after,
          author: headCommit.author,
        }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setFeedback(data);
      emit("ai_review");
    } catch (e) {
      setError(
        e.message.includes("fetch")
          ? "Can't reach the backend. Make sure FastAPI is running on link"
          : e.message
      );
    } finally {
      setLoading(false);
    }
  }

  if (!headCommit) {
    return (
      <div className="reviewer reviewer--empty">
        <span className="rev-icon">🤖</span>
        <p>Make a commit first, then request a review.</p>
      </div>
    );
  }

  return (
    <div className="reviewer">
      <div className="reviewer-head">
        <div className="rev-title-row">
          <span className="rev-icon">🤖</span>
          <div>
            <h3 className="rev-title">AI Code Review</h3>
            <p className="rev-sub">Your senior engineer is standing by</p>
          </div>
        </div>

        {/* commit summary strip */}
        <div className="commit-strip">
          <span className="commit-msg">"{headCommit.message}"</span>
          <div className="diff-counts">
            {added > 0 && <span className="added">+{added}</span>}
            {removed > 0 && <span className="removed">-{removed}</span>}
          </div>
        </div>

        <button
          className={`review-btn ${loading ? "loading" : ""}`}
          onClick={requestReview}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" /> Reviewing…
            </>
          ) : (
            "Request review ›"
          )}
        </button>
      </div>

      {error && (
        <div className="rev-error">
          <span>⚠</span> {error}
        </div>
      )}

      {feedback && (
        <div className="review-card">
          <div className="review-section summary">
            <span className="section-label">TLDR</span>
            <p>{feedback.summary}</p>
          </div>
          <div className="review-section praise">
            <span className="section-label">✓ What you did well</span>
            <p>{feedback.praise}</p>
          </div>
          <div className="review-section suggestion">
            <span className="section-label">↗ One thing to improve</span>
            <p>{feedback.suggestion}</p>
          </div>
          <div className="review-section concept">
            <span className="section-label">💡 Engineering concept</span>
            <p>{feedback.concept}</p>
          </div>
        </div>
      )}

      <style>{`
        .reviewer {
          background: #0b1020;
          border: 1px solid #1e293b;
          border-radius: 12px;
          padding: 18px;
          margin-top: 16px;
        }
        .reviewer--empty {
          display: flex; align-items: center; gap: 10px;
          color: #475569; font-size: 13px;
        }
        .reviewer--empty .rev-icon { font-size: 20px; }
        .reviewer-head { display: flex; flex-direction: column; gap: 12px; }
        .rev-title-row { display: flex; align-items: center; gap: 12px; }
        .rev-icon { font-size: 22px; }
        .rev-title { margin: 0; font-size: 15px; font-weight: 600; }
        .rev-sub { margin: 0; font-size: 12px; color: #64748b; }

        .commit-strip {
          display: flex; align-items: center; justify-content: space-between;
          background: #060912; border: 1px solid #1e293b; border-radius: 8px;
          padding: 8px 12px; gap: 12px;
        }
        .commit-msg {
          font-size: 13px; color: #94a3b8;
          font-family: 'JetBrains Mono', monospace;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .diff-counts { display: flex; gap: 6px; flex-shrink: 0; }
        .added   { font-size: 12px; color: #22c55e; font-weight: 600; font-family: monospace; }
        .removed { font-size: 12px; color: #fca5a5; font-weight: 600; font-family: monospace; }

        .review-btn {
          align-self: flex-start;
          background: #1e293b; color: #e2e8f0;
          border: 1px solid #334155; border-radius: 8px;
          padding: 9px 18px; cursor: pointer; font-size: 13px; font-weight: 500;
          display: flex; align-items: center; gap: 8px;
          transition: border-color .15s, background .15s;
        }
        .review-btn:hover:not(:disabled) { border-color: #7dd3fc; background: #0d1a2d; }
        .review-btn:disabled { opacity: .6; cursor: not-allowed; }
        .review-btn.loading { color: #64748b; }

        .spinner {
          width: 12px; height: 12px; border-radius: 50%;
          border: 2px solid #334155; border-top-color: #7dd3fc;
          display: inline-block;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .rev-error {
          margin-top: 10px; padding: 10px 14px; border-radius: 8px;
          background: rgba(252,165,165,.08); border: 1px solid #7f1d1d;
          color: #fca5a5; font-size: 13px; display: flex; gap: 8px;
        }

        .review-card {
          margin-top: 14px;
          border: 1px solid #1e293b; border-radius: 10px; overflow: hidden;
          animation: fadeUp .35s ease-out;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .review-section {
          padding: 14px 16px;
          border-left: 3px solid transparent;
          border-bottom: 1px solid #1e293b;
        }
        .review-section:last-child { border-bottom: none; }
        .review-section p { margin: 6px 0 0; font-size: 13px; line-height: 1.7; color: #cbd5e1; }

        .review-section.summary    { border-left-color: #7dd3fc; background: rgba(125,211,252,.04); }
        .review-section.praise     { border-left-color: #22c55e; background: rgba(34,197,94,.04); }
        .review-section.suggestion { border-left-color: #fbbf24; background: rgba(251,191,36,.04); }
        .review-section.concept    { border-left-color: #c4b5fd; background: rgba(196,181,253,.04); }

        .section-label {
          font-size: 10px; font-weight: 600; letter-spacing: .08em;
          text-transform: uppercase; color: #64748b;
        }
        .review-section.summary    .section-label { color: #7dd3fc; }
        .review-section.praise     .section-label { color: #22c55e; }
        .review-section.suggestion .section-label { color: #fbbf24; }
        .review-section.concept    .section-label { color: #c4b5fd; }
      `}</style>
    </div>
  );
}
