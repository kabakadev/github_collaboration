// App.jsx
import { useEffect } from "react";
import GitVisualizer from "./components/GitVisualizer";
import GitControls from "./components/GitControls";
import { useGitStore } from "./store/useGitStore";

export default function App() {
  const toast = useGitStore((s) => s.toast);
  const clearToast = useGitStore((s) => s.clearToast);
  const reset = useGitStore((s) => s.reset);
  const pendingConflict = useGitStore((s) => s.pendingConflict);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 2600);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  return (
    <div className="app">
      <header>
        <h1>
          Collab<span>Playground</span>
        </h1>
        <button className="reset" onClick={reset}>
          ⟲ reset repo
        </button>
      </header>

      <p className="tagline">
        Zero to Collaborator — learn Git by playing with it. (Tier 1: engine +
        visualizer)
      </p>

      <section className="graph-section">
        <GitVisualizer />
        {pendingConflict && (
          <div className="conflict-banner">
            ⚠ Merge conflict pending — the Collaboration Playground (Tier 2)
            resolves this.
          </div>
        )}
      </section>

      <section className="controls-section">
        <GitControls />
      </section>

      {toast && <div className="toast">{toast}</div>}

      <style>{`
        :root { font-family: 'Outfit', system-ui, sans-serif; }
        * { box-sizing: border-box; }
        body { margin: 0; }
        .app {
          max-width: 880px; margin: 0 auto; padding: 28px 20px 80px;
          background: #060912; min-height: 100vh; color: #e2e8f0;
        }
        header { display: flex; justify-content: space-between; align-items: center; }
        h1 { font-size: 26px; margin: 0; letter-spacing: -.02em; }
        h1 span { color: #22c55e; }
        .tagline { color: #64748b; font-size: 14px; margin: 4px 0 22px; }
        .reset {
          background: transparent; color: #64748b; border: 1px solid #1e293b;
          border-radius: 8px; padding: 6px 12px; cursor: pointer; font-size: 12px;
        }
        .reset:hover { color: #fca5a5; border-color: #7f1d1d; }
        .graph-section { margin-bottom: 22px; }
        .conflict-banner {
          margin-top: 10px; padding: 10px 14px; border-radius: 8px;
          background: #2a1206; border: 1px solid #78350f; color: #fbbf24; font-size: 13px;
        }
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
      `}</style>
    </div>
  );
}
