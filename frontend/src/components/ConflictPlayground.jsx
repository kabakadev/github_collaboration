// ConflictPlayground.jsx
// Tier 2 — the Collaboration Playground. Consumes the pendingConflict the engine
// produces and gives students a guided, safe way to resolve it: accept ours,
// accept theirs, keep both, or hand-edit. Then completes the merge.

import { useState, useEffect, useMemo } from "react";
import { useGitStore } from "../store/useGitStore";

// Parse the conflict-marked text into segments so we can render it richly.
function parseConflict(text) {
  const lines = text.split("\n");
  const segments = [];
  let mode = "clean"; // clean | ours | theirs
  let buf = { clean: [], ours: [], theirs: [] };

  const flushClean = () => {
    if (buf.clean.length) {
      segments.push({ type: "clean", lines: buf.clean });
      buf.clean = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith("<<<<<<<")) {
      flushClean();
      mode = "ours";
      buf.ours = [];
      buf.theirs = [];
    } else if (line.startsWith("=======")) {
      mode = "theirs";
    } else if (line.startsWith(">>>>>>>")) {
      segments.push({ type: "conflict", ours: buf.ours, theirs: buf.theirs });
      mode = "clean";
    } else {
      if (mode === "clean") buf.clean.push(line);
      else if (mode === "ours") buf.ours.push(line);
      else buf.theirs.push(line);
    }
  }
  flushClean();
  return segments;
}

export default function ConflictPlayground() {
  const conflict = useGitStore((s) => s.pendingConflict);
  const resolveConflict = useGitStore((s) => s.resolveConflict);

  const segments = useMemo(
    () => (conflict ? parseConflict(conflict.conflictText) : []),
    [conflict]
  );

  // Per-conflict-segment choice: 'ours' | 'theirs' | 'both' | null
  const [choices, setChoices] = useState({});
  const [manual, setManual] = useState(null); // manual override text, or null
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    setChoices({});
    setManual(null);
    setShowManual(false);
  }, [conflict]);

  if (!conflict) return null;

  const conflictIndices = segments
    .map((s, i) => (s.type === "conflict" ? i : null))
    .filter((i) => i !== null);

  const allChosen = conflictIndices.every((i) => choices[i]);

  // Build the resolved text from choices (or the manual override).
  function buildResolved() {
    if (manual !== null) return manual;
    const out = [];
    segments.forEach((seg, i) => {
      if (seg.type === "clean") {
        out.push(...seg.lines);
      } else {
        const choice = choices[i];
        if (choice === "ours") out.push(...seg.ours);
        else if (choice === "theirs") out.push(...seg.theirs);
        else if (choice === "both") out.push(...seg.ours, ...seg.theirs);
      }
    });
    return out.join("\n");
  }

  const pick = (i, which) => setChoices((c) => ({ ...c, [i]: which }));

  return (
    <div className="conflict-pg">
      <div className="cp-head">
        <h2>⚔ Merge Conflict</h2>
        <p>
          <code>{conflict.otherBranch}</code> and your branch both changed the
          same lines. Git can't decide — that's your job. Pick a side for each
          clash, or keep both.
        </p>
      </div>

      <div className="legend">
        <span className="dot ours" /> HEAD (yours)
        <span className="dot theirs" /> {conflict.otherBranch} (incoming)
      </div>

      {!showManual && (
        <div className="merge-view">
          {segments.map((seg, i) =>
            seg.type === "clean" ? (
              seg.lines.map((l, j) => (
                <div className="ln clean" key={`${i}-${j}`}>
                  <span className="gutter" />
                  <code>{l || "\u00A0"}</code>
                </div>
              ))
            ) : (
              <div className="clash" key={i} data-resolved={!!choices[i]}>
                <div className="clash-bar">
                  <span>Conflict #{conflictIndices.indexOf(i) + 1}</span>
                  <div className="picks">
                    <button
                      className={choices[i] === "ours" ? "on ours" : ""}
                      onClick={() => pick(i, "ours")}
                    >
                      Take yours
                    </button>
                    <button
                      className={choices[i] === "theirs" ? "on theirs" : ""}
                      onClick={() => pick(i, "theirs")}
                    >
                      Take theirs
                    </button>
                    <button
                      className={choices[i] === "both" ? "on both" : ""}
                      onClick={() => pick(i, "both")}
                    >
                      Keep both
                    </button>
                  </div>
                </div>
                <div
                  className={`side ours ${
                    choices[i] && choices[i] !== "ours" && choices[i] !== "both"
                      ? "muted"
                      : ""
                  }`}
                >
                  {seg.ours.map((l, j) => (
                    <div className="ln" key={j}>
                      <span className="gutter">+</span>
                      <code>{l || "\u00A0"}</code>
                    </div>
                  ))}
                </div>
                <div
                  className={`side theirs ${
                    choices[i] &&
                    choices[i] !== "theirs" &&
                    choices[i] !== "both"
                      ? "muted"
                      : ""
                  }`}
                >
                  {seg.theirs.map((l, j) => (
                    <div className="ln" key={j}>
                      <span className="gutter">+</span>
                      <code>{l || "\u00A0"}</code>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {showManual && (
        <textarea
          className="manual-edit"
          value={manual ?? buildResolved()}
          onChange={(e) => setManual(e.target.value)}
          spellCheck={false}
        />
      )}

      <div className="cp-actions">
        <button
          className="link"
          onClick={() => {
            if (!showManual) setManual(buildResolved());
            setShowManual((v) => !v);
          }}
        >
          {showManual ? "← back to guided picker" : "edit by hand instead"}
        </button>
        <button
          className="resolve"
          disabled={!showManual && !allChosen}
          onClick={() => resolveConflict(buildResolved())}
        >
          {showManual || allChosen
            ? "✓ Resolve & complete merge"
            : `Pick all ${conflictIndices.length} conflict(s)`}
        </button>
      </div>

      <style>{`
        .conflict-pg {
          background: #0b1020; border: 1px solid #78350f; border-radius: 12px;
          padding: 20px; margin-top: 16px;
        }
        .cp-head h2 { margin: 0 0 6px; font-size: 18px; color: #fbbf24; }
        .cp-head p { margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6; }
        .cp-head code { color: #fbbf24; background: #1e293b; padding: 1px 6px; border-radius: 4px; }
        .legend { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #94a3b8; margin: 14px 0; }
        .legend .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-left: 10px; }
        .dot.ours { background: #7dd3fc; }
        .dot.theirs { background: #fca5a5; }
        .merge-view {
          font-family: 'JetBrains Mono', monospace; font-size: 13px;
          border: 1px solid #1e293b; border-radius: 8px; overflow: hidden;
        }
        .ln { display: flex; align-items: stretch; }
        .ln .gutter { width: 28px; flex-shrink: 0; text-align: center; color: #475569; background: #060912; }
        .ln code { padding: 2px 10px; white-space: pre-wrap; word-break: break-word; }
        .ln.clean code { color: #cbd5e1; }
        .clash { border-top: 1px solid #1e293b; border-bottom: 1px solid #1e293b; }
        .clash[data-resolved="true"] { box-shadow: inset 3px 0 0 #22c55e; }
        .clash-bar {
          display: flex; justify-content: space-between; align-items: center;
          background: #1a1206; padding: 6px 10px; font-size: 11px; color: #fbbf24;
        }
        .picks { display: flex; gap: 6px; }
        .picks button {
          background: #0b1020; color: #94a3b8; border: 1px solid #334155;
          border-radius: 6px; padding: 3px 10px; cursor: pointer; font-size: 11px;
        }
        .picks button.on.ours { background: #7dd3fc; color: #04222e; border-color: #7dd3fc; }
        .picks button.on.theirs { background: #fca5a5; color: #2e0404; border-color: #fca5a5; }
        .picks button.on.both { background: #86efac; color: #04130a; border-color: #86efac; }
        .side.ours { background: rgba(125,211,252,.06); }
        .side.theirs { background: rgba(252,165,165,.06); }
        .side.ours .gutter { color: #7dd3fc; }
        .side.theirs .gutter { color: #fca5a5; }
        .side.muted { opacity: .3; filter: grayscale(1); }
        .manual-edit {
          width: 100%; min-height: 160px; resize: vertical; margin-top: 4px;
          background: #060912; color: #e2e8f0; border: 1px solid #334155;
          border-radius: 8px; padding: 12px; font-family: 'JetBrains Mono', monospace;
          font-size: 13px; line-height: 1.6;
        }
        .cp-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
        .link { background: none; border: none; color: #64748b; cursor: pointer; font-size: 12px; text-decoration: underline; }
        .resolve {
          background: #22c55e; color: #04130a; border: none; border-radius: 8px;
          padding: 10px 18px; font-weight: 600; cursor: pointer; font-size: 13px;
        }
        .resolve:disabled { background: #1e293b; color: #475569; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
