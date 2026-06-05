// App.jsx
import { useEffect, useState } from "react";
import GitVisualizer from "./components/GitVisualizer";
import GitControls from "./components/GitControls";
import ConflictPlayground from "./components/ConflictPlayground";
import SkillTracker from "./components/SkillTracker";
import SSHOnboarding from "./components/SSHOnboarding";
import AIReviewer from "./components/AIReviewer";
import { useGitStore } from "./store/useGitStore";

export default function App() {
  const toast = useGitStore((s) => s.toast);
  const clearToast = useGitStore((s) => s.clearToast);
  const reset = useGitStore((s) => s.reset);
  const pendingConflict = useGitStore((s) => s.pendingConflict);
  const setupPracticeConflict = useGitStore((s) => s.setupPracticeConflict);

  // SSH onboarding gate: starts open unless the user has completed or skipped it
  const [sshDone, setSshDone] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 2600);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!sshDone) {
    return (
      <div className="app">
        <header>
          <h1>
            Collab<span>Playground</span>
          </h1>
          <button className="reset" onClick={() => setSshDone(true)}>
            skip — already set up SSH ›
          </button>
        </header>
        <SSHOnboarding onComplete={() => setSshDone(true)} />
        <style>{appStyles}</style>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>
          Collab<span>Playground</span>
        </h1>
        <div className="header-btns">
          <button className="reset" onClick={() => setSshDone(false)}>
            ⚿ SSH setup
          </button>
          <button className="reset" onClick={setupPracticeConflict}>
            ⚔ practice conflict
          </button>
          <button className="reset" onClick={reset}>
            ⟲ reset repo
          </button>
        </div>
      </header>

      <p className="tagline">
        Zero to Collaborator — learn Git by playing with it.
      </p>

      <section className="graph-section">
        <GitVisualizer />
      </section>

      {pendingConflict ? (
        <ConflictPlayground />
      ) : (
        <section className="controls-section">
          <GitControls />
        </section>
      )}

      <AIReviewer />
      <SkillTracker />

      {toast && <div className="toast">{toast}</div>}

      <style>{appStyles}</style>
    </div>
  );
}

const appStyles = `
  :root { font-family: 'Outfit', system-ui, sans-serif; }
  * { box-sizing: border-box; }
  body { margin: 0; }
  .app {
    max-width: 880px; margin: 0 auto; padding: 28px 20px 80px;
    background: #060912; min-height: 100vh; color: #e2e8f0;
  }
  header { display: flex; justify-content: space-between; align-items: center; }
  .header-btns { display: flex; gap: 8px; }
  h1 { font-size: 26px; margin: 0; letter-spacing: -.02em; }
  h1 span { color: #22c55e; }
  .tagline { color: #64748b; font-size: 14px; margin: 4px 0 22px; }
  .reset {
    background: transparent; color: #64748b; border: 1px solid #1e293b;
    border-radius: 8px; padding: 6px 12px; cursor: pointer; font-size: 12px;
  }
  .reset:hover { color: #7dd3fc; border-color: #0c4a6e; }
  .graph-section { margin-bottom: 22px; }
  .controls-section {
    background: #0b1020; border: 1px solid #1e293b;
    border-radius: 12px; padding: 18px;
  }
  .toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: #1e293b; color: #e2e8f0; padding: 12px 20px;
    border-radius: 10px; border: 1px solid #334155; font-size: 13px;
    box-shadow: 0 8px 30px rgba(0,0,0,.5); animation: rise .3s ease-out;
  }
  @keyframes rise { from { opacity: 0; transform: translate(-50%, 12px); } to { opacity: 1; transform: translate(-50%, 0); } }
`;
