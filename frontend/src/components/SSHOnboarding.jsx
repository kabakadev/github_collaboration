// SSHOnboarding.jsx
// Level 0 — "Forge Your Identity"
// A four-step guided stepper that teaches SSH key setup as a game level.
// Each step has validation that must pass before the student can proceed.
// Steps: 1 keygen  2 copy pubkey  3 paste into fake GitHub  4 verify connection

import { useState, useEffect, useRef } from "react";
import { useGitStore } from "../store/useGitStore";

const FAKE_PUBKEY =
  "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGk7KQxlEZrP8mNiXqW2vY9oHsRtCbFdUeJpLzMnOqWs you@collab-playground";

const STEPS = [
  {
    id: "keygen",
    title: "Forge your key",
    subtitle: "Generate an SSH key pair in your terminal",
    icon: "⚒",
  },
  {
    id: "copy",
    title: "Reveal the public key",
    subtitle: "Copy the public half — this is what you share",
    icon: "📋",
  },
  {
    id: "github",
    title: "Add to GitHub",
    subtitle: "Paste it into the simulated GitHub settings",
    icon: "🐙",
  },
  {
    id: "verify",
    title: "Verify the connection",
    subtitle: "Confirm GitHub recognizes your key",
    icon: "✓",
  },
];

// ─── Step 1: keygen ─────────────────────────────────────────────────────────
function StepKeygen({ onPass }) {
  const [typed, setTyped] = useState("");
  const [ran, setRan] = useState(false);
  const [output, setOutput] = useState([]);
  const correct =
    typed.trim() === 'ssh-keygen -t ed25519 -C "you@collab-playground"';

  function runCommand() {
    if (!correct) return;
    setRan(true);
    const lines = [
      "Generating public/private ed25519 key pair.",
      "Enter file in which to save the key (/home/you/.ssh/id_ed25519): [Enter]",
      "Enter passphrase (empty for no passphrase): [Enter]",
      "Enter same passphrase again: [Enter]",
      "Your identification has been saved in /home/you/.ssh/id_ed25519",
      "Your public key has been saved in /home/you/.ssh/id_ed25519.pub",
      "The key fingerprint is:",
      "SHA256:xK9mPqLzR2vN8bYwCdJtHfUeOsSaGiXnElMk3pQ you@collab-playground",
      "",
      "The key's randomart image is:",
      "+--[ED25519 256]--+",
      "|      .ooo.      |",
      "|     . +*+o      |",
      "|    . =.B=..     |",
      "|   . = B.=+      |",
      "|    o S.B+..     |",
      "|     . =.= .     |",
      "|      . + o      |",
      "|         .       |",
      "|                 |",
      "+----[SHA256]-----+",
    ];
    lines.forEach((l, i) =>
      setTimeout(() => setOutput((o) => [...o, l]), i * 60)
    );
    setTimeout(onPass, lines.length * 60 + 600);
  }

  return (
    <div className="step-body">
      <p className="step-desc">
        SSH keys work like a lock and key. You keep the <em>private</em> key
        secret. You give GitHub the <em>public</em> key. They match — you're in.
        Run this command in your real terminal to generate both:
      </p>
      <div className="cmd-hint">
        <code>ssh-keygen -t ed25519 -C "you@collab-playground"</code>
      </div>
      <p className="step-desc" style={{ marginTop: 12 }}>
        Type the command below to practice — exact match required:
      </p>
      <div className="terminal-input-row">
        <span className="prompt">$</span>
        <input
          className="terminal-input"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runCommand()}
          spellCheck={false}
          autoComplete="off"
          placeholder="type the command…"
          disabled={ran}
        />
        {correct && !ran && <span className="hint-ok">↵ Enter</span>}
      </div>
      {output.length > 0 && (
        <div className="terminal-out">
          {output.map((l, i) => (
            <div key={i} className="out-line">
              {l || "\u00A0"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 2: copy pubkey ────────────────────────────────────────────────────
function StepCopy({ onPass }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  function reveal() {
    setRevealed(true);
  }

  function copy() {
    navigator.clipboard?.writeText(FAKE_PUBKEY).catch(() => {});
    setCopied(true);
    setTimeout(onPass, 700);
  }

  return (
    <div className="step-body">
      <p className="step-desc">
        Your public key lives in <code>~/.ssh/id_ed25519.pub</code>. You can
        print it with <code>cat</code> — the output is what you'll give to
        GitHub. It always starts with <code>ssh-ed25519</code> and ends with
        your email.
      </p>
      {!revealed && (
        <div className="terminal-input-row">
          <span className="prompt">$</span>
          <button className="terminal-btn" onClick={reveal}>
            cat ~/.ssh/id_ed25519.pub
          </button>
        </div>
      )}
      {revealed && (
        <>
          <div className="pubkey-box">
            <span className="pubkey-text">{FAKE_PUBKEY}</span>
          </div>
          <button
            className={`copy-btn ${copied ? "copied" : ""}`}
            onClick={copy}
            disabled={copied}
          >
            {copied ? "✓ Copied!" : "Copy to clipboard"}
          </button>
          <p className="step-desc" style={{ marginTop: 10, fontSize: 12 }}>
            <strong>Only ever share the .pub file.</strong> The private key (
            <code>id_ed25519</code>, no extension) never leaves your machine.
          </p>
        </>
      )}
    </div>
  );
}

// ─── Step 3: simulated GitHub settings ──────────────────────────────────────
function StepGitHub({ onPass }) {
  const [pasted, setPasted] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function save() {
    const val = pasted.trim();
    if (!val.startsWith("ssh-")) {
      setError(
        "That doesn't look like an SSH key — it should start with ssh-ed25519 or ssh-rsa."
      );
      return;
    }
    if (val.length < 60) {
      setError("Key looks too short. Make sure you copied the full line.");
      return;
    }
    setError("");
    setSaved(true);
    setTimeout(onPass, 1000);
  }

  return (
    <div className="step-body">
      <div className="fake-github">
        <div className="gh-titlebar">
          <div className="gh-dots">
            <span />
            <span />
            <span />
          </div>
          <div className="gh-url">github.com / settings / keys</div>
        </div>
        <div className="gh-body">
          <div className="gh-sidebar">
            <div className="gh-nav-item">Profile</div>
            <div className="gh-nav-item">Account</div>
            <div className="gh-nav-item active">SSH and GPG keys</div>
            <div className="gh-nav-item">Emails</div>
          </div>
          <div className="gh-content">
            <div className="gh-section-title">SSH keys</div>
            {!saved ? (
              <>
                <div className="gh-field-label">Title</div>
                <input
                  className="gh-input"
                  defaultValue="My dev machine"
                  readOnly
                />
                <div className="gh-field-label">Key type</div>
                <select className="gh-input" defaultValue="auth">
                  <option value="auth">Authentication key</option>
                </select>
                <div className="gh-field-label">Key</div>
                <textarea
                  className="gh-textarea"
                  placeholder="Paste your public key here — starts with ssh-ed25519"
                  value={pasted}
                  onChange={(e) => {
                    setPasted(e.target.value);
                    setError("");
                  }}
                />
                {error && <div className="gh-error">{error}</div>}
                <button className="gh-btn" onClick={save}>
                  Add SSH key
                </button>
              </>
            ) : (
              <div className="gh-success-row">
                <span className="gh-key-icon">🔑</span>
                <div>
                  <div className="gh-key-title">My dev machine</div>
                  <div className="gh-key-meta">
                    ED25519 · Added just now · Never used
                  </div>
                </div>
                <span className="gh-check">✓</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="step-desc" style={{ marginTop: 12, fontSize: 12 }}>
        In real GitHub:{" "}
        <strong>Settings → SSH and GPG keys → New SSH key</strong>. Paste your
        public key, give it a name, and save.
      </p>
    </div>
  );
}

// ─── Step 4: verify ──────────────────────────────────────────────────────────
function StepVerify({ onPass }) {
  const [ran, setRan] = useState(false);
  const [lines, setLines] = useState([]);
  const emit = useGitStore((s) => s._emit);

  function runVerify() {
    setRan(true);
    const output = [
      "$ ssh -T git@github.com",
      "The authenticity of host 'github.com (140.82.121.4)' can't be established.",
      "ED25519 key fingerprint is SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UoiS2A.",
      "Are you sure you want to continue connecting? yes",
      "Warning: Permanently added 'github.com' (ED25519) to the list of known hosts.",
      "Hi you! You've successfully authenticated, but GitHub does not provide shell access.",
    ];
    output.forEach((l, i) =>
      setTimeout(() => {
        setLines((prev) => [...prev, l]);
        if (i === output.length - 1) {
          setTimeout(() => {
            emit("ssh_verified");
            onPass();
          }, 700);
        }
      }, i * 110)
    );
  }

  return (
    <div className="step-body">
      <p className="step-desc">
        One last check. SSH to GitHub — it won't give you a shell, but it will
        confirm your key is recognized. The line{" "}
        <code>"Hi you! You've successfully authenticated"</code> is the green
        light.
      </p>
      {!ran && (
        <div className="terminal-input-row">
          <span className="prompt">$</span>
          <button className="terminal-btn" onClick={runVerify}>
            ssh -T git@github.com
          </button>
        </div>
      )}
      {lines.length > 0 && (
        <div className="terminal-out">
          {lines.map((l, i) => (
            <div
              key={i}
              className={`out-line ${
                l.includes("successfully") ? "success-line" : ""
              }`}
            >
              {l}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shell ───────────────────────────────────────────────────────────────────
export default function SSHOnboarding({ onComplete }) {
  const [current, setCurrent] = useState(0);
  const [passed, setPassed] = useState([]);
  const emit = useGitStore((s) => s._emit);

  function pass() {
    setPassed((p) => [...p, current]);
    if (current === STEPS.length - 1) {
      emit("ssh_verified");
      setTimeout(onComplete, 800);
    } else {
      setCurrent((c) => c + 1);
    }
  }

  const stepComponents = [
    <StepKeygen onPass={pass} />,
    <StepCopy onPass={pass} />,
    <StepGitHub onPass={pass} />,
    <StepVerify onPass={pass} />,
  ];

  return (
    <div className="ssh-shell">
      <div className="ssh-header">
        <div className="ssh-title-row">
          <span className="ssh-badge">LEVEL 0</span>
          <h2 className="ssh-title">Forge Your Identity</h2>
        </div>
        <p className="ssh-sub">
          Before you can collaborate, GitHub needs to know who you are. SSH keys
          are how you prove it — no password, no OAuth pop-up, just
          cryptography.
        </p>
      </div>

      {/* step pills */}
      <div className="step-pills">
        {STEPS.map((s, i) => {
          const done = passed.includes(i);
          const active = current === i;
          return (
            <div
              key={s.id}
              className={`pill ${done ? "done" : active ? "active" : "locked"}`}
            >
              <span className="pill-icon">{done ? "✓" : s.icon}</span>
              <span className="pill-label">{s.title}</span>
              {i < STEPS.length - 1 && <span className="pill-sep">›</span>}
            </div>
          );
        })}
      </div>

      {/* active step card */}
      <div className="step-card">
        <div className="step-card-head">
          <span className="step-num">
            Step {current + 1} of {STEPS.length}
          </span>
          <h3 className="step-card-title">{STEPS[current].title}</h3>
          <p className="step-card-sub">{STEPS[current].subtitle}</p>
        </div>
        {stepComponents[current]}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Syne:wght@600;700&display=swap');

        .ssh-shell {
          font-family: 'Syne', system-ui, sans-serif;
          background: #060912;
          border: 1px solid #1e293b;
          border-radius: 16px;
          padding: 28px 28px 32px;
          margin-top: 16px;
          color: #e2e8f0;
        }
        .ssh-header { margin-bottom: 24px; }
        .ssh-title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .ssh-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 600; letter-spacing: .12em;
          background: #22c55e; color: #04130a;
          padding: 3px 8px; border-radius: 4px;
        }
        .ssh-title { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -.02em; }
        .ssh-sub { margin: 0; color: #64748b; font-size: 14px; line-height: 1.6; font-family: system-ui, sans-serif; }

        /* step pills */
        .step-pills {
          display: flex; align-items: center; gap: 0;
          margin-bottom: 20px; flex-wrap: wrap; gap: 4px;
        }
        .pill {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-family: system-ui, sans-serif;
          padding: 5px 10px; border-radius: 999px;
          transition: .2s;
        }
        .pill.done   { background: rgba(34,197,94,.12); color: #22c55e; border: 1px solid #14532d; }
        .pill.active { background: rgba(125,211,252,.1); color: #7dd3fc; border: 1px solid #0c4a6e; }
        .pill.locked { background: #0b1020; color: #475569; border: 1px solid #1e293b; }
        .pill-sep { color: #334155; margin-left: 4px; }

        /* step card */
        .step-card {
          background: #0b1020; border: 1px solid #1e293b;
          border-radius: 12px; overflow: hidden;
        }
        .step-card-head {
          padding: 18px 20px 14px;
          border-bottom: 1px solid #1e293b;
          background: #0d1526;
        }
        .step-num { font-size: 11px; color: #475569; font-family: 'JetBrains Mono', monospace; letter-spacing: .06em; }
        .step-card-title { margin: 4px 0 2px; font-size: 17px; font-weight: 700; }
        .step-card-sub { margin: 0; font-size: 13px; color: #64748b; font-family: system-ui, sans-serif; }

        .step-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
        .step-desc {
          margin: 0; font-size: 13px; line-height: 1.7; color: #94a3b8;
          font-family: system-ui, sans-serif;
        }
        .step-desc code, .step-desc em {
          font-family: 'JetBrains Mono', monospace; font-size: 12px;
          color: #7dd3fc; font-style: normal;
        }
        .cmd-hint {
          background: #060912; border: 1px solid #1e293b; border-radius: 8px;
          padding: 10px 14px;
        }
        .cmd-hint code { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #22c55e; }

        /* terminal row */
        .terminal-input-row { display: flex; align-items: center; gap: 8px; }
        .prompt { font-family: 'JetBrains Mono', monospace; color: #22c55e; font-size: 14px; }
        .terminal-input {
          flex: 1; background: #060912; color: #22c55e; border: 1px solid #1e293b;
          border-radius: 6px; padding: 8px 10px;
          font-family: 'JetBrains Mono', monospace; font-size: 13px;
          outline: none; caret-color: #22c55e;
        }
        .terminal-input:focus { border-color: #22c55e44; }
        .terminal-input::placeholder { color: #334155; }
        .terminal-btn {
          background: #0b1020; color: #22c55e; border: 1px solid #1e293b;
          border-radius: 6px; padding: 8px 14px; cursor: pointer;
          font-family: 'JetBrains Mono', monospace; font-size: 13px;
          transition: .15s;
        }
        .terminal-btn:hover { border-color: #22c55e44; background: #060912; }
        .hint-ok { font-size: 11px; color: #22c55e; font-family: 'JetBrains Mono', monospace; }

        /* terminal output */
        .terminal-out {
          background: #020408; border: 1px solid #0f172a; border-radius: 8px;
          padding: 12px 14px;
          font-family: 'JetBrains Mono', monospace; font-size: 12px;
          line-height: 1.8; color: #94a3b8;
          max-height: 220px; overflow-y: auto;
        }
        .out-line { white-space: pre-wrap; }
        .success-line { color: #22c55e; font-weight: 600; }

        /* pubkey */
        .pubkey-box {
          background: #020408; border: 1px solid #0f172a; border-radius: 8px;
          padding: 12px 14px; word-break: break-all;
          font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #7dd3fc;
        }
        .copy-btn {
          align-self: flex-start;
          background: #1e293b; color: #e2e8f0; border: 1px solid #334155;
          border-radius: 8px; padding: 8px 16px; cursor: pointer; font-size: 13px; transition: .2s;
        }
        .copy-btn.copied { background: #22c55e; color: #04130a; border-color: #22c55e; }

        /* fake github */
        .fake-github {
          border: 1px solid #1e293b; border-radius: 10px; overflow: hidden;
          font-family: system-ui, sans-serif;
        }
        .gh-titlebar {
          background: #010409; border-bottom: 1px solid #1e293b;
          padding: 8px 14px; display: flex; align-items: center; gap: 10px;
        }
        .gh-dots { display: flex; gap: 5px; }
        .gh-dots span { width: 10px; height: 10px; border-radius: 50%; background: #334155; }
        .gh-url { font-size: 12px; color: #475569; font-family: 'JetBrains Mono', monospace; }
        .gh-body { display: flex; min-height: 280px; }
        .gh-sidebar {
          width: 160px; flex-shrink: 0; background: #0b1020;
          border-right: 1px solid #1e293b; padding: 12px 0;
        }
        .gh-nav-item {
          padding: 6px 16px; font-size: 13px; color: #64748b; cursor: pointer;
        }
        .gh-nav-item.active { color: #e2e8f0; background: #1e293b; border-right: 2px solid #22c55e; }
        .gh-content { flex: 1; padding: 16px 18px; display: flex; flex-direction: column; gap: 8px; }
        .gh-section-title { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
        .gh-field-label { font-size: 12px; color: #94a3b8; font-weight: 500; }
        .gh-input {
          background: #060912; color: #e2e8f0; border: 1px solid #1e293b;
          border-radius: 6px; padding: 6px 10px; font-size: 13px; width: 100%;
        }
        .gh-textarea {
          background: #060912; color: #e2e8f0; border: 1px solid #1e293b;
          border-radius: 6px; padding: 8px 10px; font-size: 12px; width: 100%;
          min-height: 80px; resize: vertical;
          font-family: 'JetBrains Mono', monospace;
        }
        .gh-textarea:focus { outline: none; border-color: #22c55e44; }
        .gh-btn {
          align-self: flex-start; background: #22c55e; color: #04130a;
          border: none; border-radius: 6px; padding: 7px 16px;
          font-weight: 600; font-size: 13px; cursor: pointer; transition: .15s;
        }
        .gh-btn:hover { background: #16a34a; }
        .gh-error { font-size: 12px; color: #fca5a5; background: rgba(252,165,165,.08); padding: 6px 10px; border-radius: 6px; }
        .gh-success-row {
          display: flex; align-items: center; gap: 12px;
          background: rgba(34,197,94,.07); border: 1px solid #14532d;
          border-radius: 8px; padding: 12px 14px;
        }
        .gh-key-icon { font-size: 20px; }
        .gh-key-title { font-size: 14px; font-weight: 600; }
        .gh-key-meta { font-size: 12px; color: #64748b; }
        .gh-check { margin-left: auto; color: #22c55e; font-size: 18px; font-weight: 700; }
      `}</style>
    </div>
  );
}
