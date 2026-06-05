// SkillTracker.jsx
// Tier 3 — the Skill Tracker. Listens to the milestone events the store already
// emits and lights up badges. Maps to a real junior-dev progression so the
// achievements feel like resume-credible skills, not arbitrary points.

import { useGitStore } from "../store/useGitStore";

// Each badge: an id, the event(s) that unlock it, and how many times needed.
const BADGES = [
  {
    id: "first_commit",
    icon: "✍",
    title: "First Commit",
    desc: "You recorded your first snapshot.",
    event: "first_commit",
    need: 1,
  },
  {
    id: "brancher",
    icon: "🌿",
    title: "Brancher",
    desc: "Created a branch to work in parallel.",
    event: "branch",
    need: 1,
  },
  {
    id: "merger",
    icon: "🔀",
    title: "Merger",
    desc: "Combined two branches together.",
    event: "merge",
    need: 1,
  },
  {
    id: "conflict_resolver",
    icon: "⚔",
    title: "Conflict Resolver",
    desc: "Resolved a merge conflict by hand.",
    event: "conflict_resolved",
    need: 1,
  },
  {
    id: "committed",
    icon: "🔥",
    title: "Committed",
    desc: "Made 5 commits. Building the habit.",
    event: "commit",
    need: 5,
  },
  {
    id: "peacemaker",
    icon: "🕊",
    title: "Peacemaker",
    desc: "Resolved 3 conflicts. A true collaborator.",
    event: "conflict_resolved",
    need: 3,
  },
];

export default function SkillTracker() {
  const events = useGitStore((s) => s.events);

  const count = (type) => events.filter((e) => e.type === type).length;

  const earned = BADGES.map((b) => ({
    ...b,
    have: count(b.event),
    unlocked: count(b.event) >= b.need,
  }));

  const unlockedCount = earned.filter((b) => b.unlocked).length;
  const pct = Math.round((unlockedCount / BADGES.length) * 100);

  return (
    <div className="tracker">
      <div className="tk-head">
        <h3>Skill Tracker</h3>
        <span className="tk-count">
          {unlockedCount}/{BADGES.length}
        </span>
      </div>

      <div className="tk-bar">
        <div className="tk-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="badges">
        {earned.map((b) => (
          <div
            key={b.id}
            className={`badge ${b.unlocked ? "on" : "off"}`}
            title={b.desc}
          >
            <div className="badge-icon">{b.unlocked ? b.icon : "🔒"}</div>
            <div className="badge-text">
              <div className="badge-title">{b.title}</div>
              <div className="badge-desc">
                {b.unlocked
                  ? b.desc
                  : b.need > 1
                  ? `${b.have}/${b.need} — ${b.desc}`
                  : b.desc}
              </div>
            </div>
            {b.unlocked && <div className="badge-check">✓</div>}
          </div>
        ))}
      </div>

      <style>{`
        .tracker {
          background: #0b1020; border: 1px solid #1e293b; border-radius: 12px;
          padding: 18px; margin-top: 16px;
        }
        .tk-head { display: flex; justify-content: space-between; align-items: baseline; }
        .tk-head h3 { margin: 0; font-size: 15px; letter-spacing: -.01em; }
        .tk-count { font-size: 13px; color: #22c55e; font-weight: 600; font-variant-numeric: tabular-nums; }
        .tk-bar { height: 6px; background: #1e293b; border-radius: 999px; margin: 12px 0 16px; overflow: hidden; }
        .tk-fill { height: 100%; background: linear-gradient(90deg, #22c55e, #86efac); border-radius: 999px; transition: width .5s ease; }
        .badges { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
        .badge {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          border-radius: 10px; border: 1px solid #1e293b; position: relative;
          transition: .3s;
        }
        .badge.on { background: rgba(34,197,94,.07); border-color: #14532d; }
        .badge.off { opacity: .5; }
        .badge.on { animation: glow .6s ease-out; }
        @keyframes glow {
          0% { box-shadow: 0 0 0 0 rgba(34,197,94,.5); }
          100% { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
        }
        .badge-icon { font-size: 22px; width: 32px; text-align: center; flex-shrink: 0; }
        .badge-title { font-size: 13px; font-weight: 600; color: #e2e8f0; }
        .badge-desc { font-size: 11px; color: #64748b; line-height: 1.4; }
        .badge-check {
          position: absolute; top: 8px; right: 10px; color: #22c55e;
          font-size: 12px; font-weight: 700;
        }
      `}</style>
    </div>
  );
}
