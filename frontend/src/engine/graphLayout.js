// graphLayout.js
// Turns the flat commits object into positioned nodes + edges for the SVG visualizer.
// Each branch gets a horizontal "lane"; commits flow left-to-right by time.

export function layoutGraph(repo) {
  const commits = Object.values(repo.commits).sort(
    (a, b) => a.timestamp - b.timestamp
  );

  // Assign each commit a column index by topological order (time works fine here).
  const col = {};
  commits.forEach((c, i) => {
    col[c.id] = i;
  });

  // Assign lanes (rows). Walk each branch tip back; first branch to claim a
  // commit owns its lane. This keeps a branch on a consistent row.
  const lane = {};
  const branchNames = Object.keys(repo.branches);
  branchNames.forEach((name, laneIndex) => {
    let id = repo.branches[name];
    while (id != null && lane[id] === undefined) {
      lane[id] = laneIndex;
      const c = repo.commits[id];
      id = c.parents[0]; // follow first parent down the lane
    }
  });
  // Any commit not yet assigned (e.g. second parent of a merge) → lane 0.
  commits.forEach((c) => {
    if (lane[c.id] === undefined) lane[c.id] = 0;
  });

  const COL_W = 90;
  const LANE_H = 80;
  const PAD = 50;

  const nodes = commits.map((c) => ({
    id: c.id,
    x: PAD + col[c.id] * COL_W,
    y: PAD + lane[c.id] * LANE_H,
    commit: c,
  }));

  const pos = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const edges = [];
  commits.forEach((c) => {
    c.parents.forEach((pid) => {
      if (pos[pid]) {
        edges.push({
          from: pos[pid],
          to: pos[c.id],
          isMerge: c.parents.length > 1,
        });
      }
    });
  });

  // Branch labels sit on the tip commit of each branch.
  const labels = branchNames
    .map((name) => ({
      name,
      node: pos[repo.branches[name]],
      isHead: repo.HEAD === name,
    }))
    .filter((l) => l.node);

  const width = PAD * 2 + (commits.length - 1) * COL_W + 40;
  const height = PAD * 2 + (branchNames.length - 1) * LANE_H + 40;

  return {
    nodes,
    edges,
    labels,
    width: Math.max(width, 400),
    height: Math.max(height, 200),
  };
}
