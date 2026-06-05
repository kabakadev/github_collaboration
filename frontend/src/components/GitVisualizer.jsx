// GitVisualizer.jsx
import { useGitStore } from "../store/useGitStore";
import { layoutGraph } from "../engine/graphLayout";

const LANE_COLORS = [
  "#7dd3fc",
  "#fca5a5",
  "#86efac",
  "#fcd34d",
  "#c4b5fd",
  "#f9a8d4",
];

export default function GitVisualizer() {
  const repo = useGitStore((s) => s.repo);
  const { nodes, edges, labels, width, height } = layoutGraph(repo);
  const headId = repo.branches[repo.HEAD];

  // map commit id -> lane color via its y position
  const laneOf = (y) => Math.round((y - 50) / 80);

  return (
    <div className="visualizer">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ maxHeight: 340 }}
        role="img"
        aria-label="Commit graph"
      >
        {/* edges first, so nodes sit on top */}
        {edges.map((e, i) => {
          const color = LANE_COLORS[laneOf(e.to.y) % LANE_COLORS.length];
          // curved path when lanes differ, straight when same lane
          const d =
            e.from.y === e.to.y
              ? `M ${e.from.x} ${e.from.y} L ${e.to.x} ${e.to.y}`
              : `M ${e.from.x} ${e.from.y} C ${(e.from.x + e.to.x) / 2} ${
                  e.from.y
                }, ${(e.from.x + e.to.x) / 2} ${e.to.y}, ${e.to.x} ${e.to.y}`;
          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={e.isMerge ? "#fbbf24" : color}
              strokeWidth={e.isMerge ? 3 : 2}
              strokeDasharray={e.isMerge ? "6 4" : "0"}
              opacity={0.7}
            />
          );
        })}

        {/* commit nodes */}
        {nodes.map((n) => {
          const color = LANE_COLORS[laneOf(n.y) % LANE_COLORS.length];
          const isHead = n.id === headId;
          const isMerge = n.commit.parents.length > 1;
          return (
            <g
              key={n.id}
              className="commit-node"
              style={{ transformOrigin: `${n.x}px ${n.y}px` }}
            >
              {isHead && (
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={16}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  <animate
                    attributeName="r"
                    values="14;18;14"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle
                cx={n.x}
                cy={n.y}
                r={11}
                fill={isMerge ? "#fbbf24" : color}
                stroke="#0b1020"
                strokeWidth={2}
              />
              <text
                x={n.x}
                y={n.y + 32}
                textAnchor="middle"
                fontSize="10"
                fill="#94a3b8"
              >
                {n.commit.id.slice(0, 5)}
              </text>
              <title>
                {n.commit.message} — {n.commit.author}
              </title>
            </g>
          );
        })}

        {/* branch labels */}
        {labels.map((l, i) => (
          <g key={i}>
            <rect
              x={l.node.x - 30}
              y={l.node.y - 38}
              width={60}
              height={18}
              rx={9}
              fill={l.isHead ? "#22c55e" : "#1e293b"}
              stroke={l.isHead ? "#86efac" : "#475569"}
            />
            <text
              x={l.node.x}
              y={l.node.y - 25}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#fff"
            >
              {l.isHead ? "● " : ""}
              {l.name}
            </text>
          </g>
        ))}
      </svg>

      <style>{`
        .visualizer {
          background: radial-gradient(circle at 30% 20%, #131a2e, #0b1020);
          border: 1px solid #1e293b;
          border-radius: 12px;
          padding: 8px;
          overflow-x: auto;
        }
        .commit-node circle:nth-child(2) { animation: pop .35s ease-out; }
        @keyframes pop {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
