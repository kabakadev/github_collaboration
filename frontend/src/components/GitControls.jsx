// GitControls.jsx
import { useState } from "react";
import { useGitStore } from "../store/useGitStore";

export default function GitControls() {
  const repo = useGitStore((s) => s.repo);
  const { setWorkingFile, stage, commit, branch, checkout, merge } =
    useGitStore();
  const [msg, setMsg] = useState("");
  const [branchName, setBranchName] = useState("");

  const branches = Object.keys(repo.branches);
  const dirty = repo.staged !== null;

  return (
    <div className="controls">
      <label className="lbl">
        Working file <span className="head">on {repo.HEAD}</span>
      </label>
      <textarea
        className="file-edit"
        value={repo.workingFile}
        onChange={(e) => setWorkingFile(e.target.value)}
        spellCheck={false}
      />

      <div className="row">
        <button className="btn ghost" onClick={stage}>
          {dirty ? "✓ staged" : "git add"}
        </button>
        <input
          className="inp"
          placeholder="commit message"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />
        <button
          className="btn primary"
          disabled={!dirty || !msg.trim()}
          onClick={() => {
            commit(msg.trim());
            setMsg("");
          }}
        >
          commit
        </button>
      </div>

      <div className="row">
        <input
          className="inp"
          placeholder="new branch name"
          value={branchName}
          onChange={(e) => setBranchName(e.target.value)}
        />
        <button
          className="btn"
          disabled={!branchName.trim()}
          onClick={() => {
            branch(branchName.trim());
            setBranchName("");
          }}
        >
          branch
        </button>
      </div>

      <div className="row wrap">
        <span className="lbl">checkout:</span>
        {branches.map((b) => (
          <button
            key={b}
            className={`chip ${repo.HEAD === b ? "active" : ""}`}
            onClick={() => checkout(b)}
          >
            {b}
          </button>
        ))}
      </div>

      <div className="row wrap">
        <span className="lbl">merge into {repo.HEAD}:</span>
        {branches
          .filter((b) => b !== repo.HEAD)
          .map((b) => (
            <button key={b} className="chip merge" onClick={() => merge(b)}>
              ⤵ {b}
            </button>
          ))}
      </div>

      <style>{`
        .controls { display: flex; flex-direction: column; gap: 10px; }
        .lbl { font-size: 12px; color: #94a3b8; letter-spacing: .04em; text-transform: uppercase; }
        .head { color: #22c55e; }
        .file-edit {
          width: 100%; min-height: 110px; resize: vertical;
          background: #0b1020; color: #e2e8f0; border: 1px solid #1e293b;
          border-radius: 8px; padding: 10px; font-family: 'JetBrains Mono', monospace;
          font-size: 13px; line-height: 1.5;
        }
        .row { display: flex; gap: 8px; align-items: center; }
        .row.wrap { flex-wrap: wrap; }
        .inp {
          flex: 1; background: #0b1020; color: #e2e8f0; border: 1px solid #1e293b;
          border-radius: 8px; padding: 8px 10px; font-size: 13px;
        }
        .btn {
          background: #1e293b; color: #e2e8f0; border: 1px solid #334155;
          border-radius: 8px; padding: 8px 14px; cursor: pointer; font-size: 13px;
          white-space: nowrap; transition: .15s;
        }
        .btn:hover:not(:disabled) { border-color: #64748b; }
        .btn:disabled { opacity: .4; cursor: not-allowed; }
        .btn.primary { background: #22c55e; color: #04130a; border-color: #22c55e; font-weight: 600; }
        .btn.ghost { color: #fbbf24; }
        .chip {
          background: #0b1020; color: #cbd5e1; border: 1px solid #334155;
          border-radius: 999px; padding: 5px 12px; cursor: pointer; font-size: 12px;
        }
        .chip.active { background: #22c55e; color: #04130a; border-color: #22c55e; font-weight: 600; }
        .chip.merge { color: #fbbf24; border-color: #78350f; }
      `}</style>
    </div>
  );
}
