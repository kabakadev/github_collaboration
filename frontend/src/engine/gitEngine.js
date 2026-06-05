// gitEngine.js
// A simulated Git engine. No real git, no filesystem — just pure functions
// transforming a plain repo object. This is the foundation everything renders off.
//
//   Repo   = { commits: {}, branches: {}, HEAD: branchName, workingFile, staged }
//   Commit = { id, parents: [], message, author, fileSnapshot, timestamp }

let _counter = 0;
function makeId() {
  _counter += 1;
  // short, git-like hash feel
  return (
    _counter.toString(16).padStart(2, "0") +
    Math.random().toString(16).slice(2, 6)
  );
}

export function createRepo({ author = "you" } = {}) {
  const rootId = makeId();
  const root = {
    id: rootId,
    parents: [],
    message: "Initial commit",
    author,
    fileSnapshot: "# README\n",
    timestamp: Date.now(),
  };
  return {
    commits: { [rootId]: root },
    branches: { main: rootId }, // branch name -> commit id it points at
    HEAD: "main", // name of the currently checked-out branch
    workingFile: root.fileSnapshot, // the file the user is editing
    staged: null, // staged content, or null if nothing staged
    author,
  };
}

// --- helpers ---------------------------------------------------------------

export function headCommitId(repo) {
  return repo.branches[repo.HEAD];
}

export function headCommit(repo) {
  return repo.commits[headCommitId(repo)];
}

// Walk parents back to root, returning commits newest-first.
export function logFrom(repo, commitId) {
  const out = [];
  const seen = new Set();
  const stack = [commitId];
  while (stack.length) {
    const id = stack.pop();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const c = repo.commits[id];
    if (!c) continue;
    out.push(c);
    c.parents.forEach((p) => stack.push(p));
  }
  return out.sort((a, b) => b.timestamp - a.timestamp);
}

// --- commands (each returns a NEW repo object) -----------------------------

export function stage(repo) {
  return { ...repo, staged: repo.workingFile };
}

export function commit(repo, message) {
  if (repo.staged === null) {
    throw new Error("Nothing staged. Run stage() first.");
  }
  const id = makeId();
  const parent = headCommitId(repo);
  const c = {
    id,
    parents: [parent],
    message: message || "Update",
    author: repo.author,
    fileSnapshot: repo.staged,
    timestamp: Date.now(),
  };
  return {
    ...repo,
    commits: { ...repo.commits, [id]: c },
    branches: { ...repo.branches, [repo.HEAD]: id },
    staged: null,
  };
}

export function branch(repo, name) {
  if (repo.branches[name]) throw new Error(`Branch "${name}" already exists.`);
  return {
    ...repo,
    branches: { ...repo.branches, [name]: headCommitId(repo) },
  };
}

export function checkout(repo, name) {
  if (!repo.branches[name]) throw new Error(`No branch "${name}".`);
  const target = repo.commits[repo.branches[name]];
  return {
    ...repo,
    HEAD: name,
    workingFile: target.fileSnapshot,
    staged: null,
  };
}

// Find the most recent common ancestor of two commits (for 3-way merge).
function mergeBase(repo, aId, bId) {
  const ancestors = new Set();
  let stack = [aId];
  while (stack.length) {
    const id = stack.pop();
    if (!id || ancestors.has(id)) continue;
    ancestors.add(id);
    repo.commits[id].parents.forEach((p) => stack.push(p));
  }
  stack = [bId];
  const seen = new Set();
  while (stack.length) {
    const id = stack.pop();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    if (ancestors.has(id)) return id; // first common ancestor we hit
    repo.commits[id].parents.forEach((p) => stack.push(p));
  }
  return null;
}

// Attempt to merge `otherBranch` into HEAD.
// Returns either { repo, status: "clean" | "fast-forward" }
// or { status: "conflict", conflictText, ours, theirs, base } for the UI to resolve.
export function merge(repo, otherBranch) {
  const ourId = headCommitId(repo);
  const theirId = repo.branches[otherBranch];
  if (!theirId) throw new Error(`No branch "${otherBranch}".`);

  const baseId = mergeBase(repo, ourId, theirId);

  // Fast-forward: our commit is the base, just move our pointer forward.
  if (baseId === ourId) {
    const their = repo.commits[theirId];
    return {
      status: "fast-forward",
      repo: {
        ...repo,
        branches: { ...repo.branches, [repo.HEAD]: theirId },
        workingFile: their.fileSnapshot,
        staged: null,
      },
    };
  }

  const ours = repo.commits[ourId].fileSnapshot;
  const theirs = repo.commits[theirId].fileSnapshot;
  const base = baseId ? repo.commits[baseId].fileSnapshot : "";

  // Naive line-based 3-way merge.
  const result = threeWayMerge(base, ours, theirs);

  if (!result.hasConflict) {
    const id = makeId();
    const c = {
      id,
      parents: [ourId, theirId],
      message: `Merge ${otherBranch} into ${repo.HEAD}`,
      author: repo.author,
      fileSnapshot: result.merged,
      timestamp: Date.now(),
    };
    return {
      status: "clean",
      repo: {
        ...repo,
        commits: { ...repo.commits, [id]: c },
        branches: { ...repo.branches, [repo.HEAD]: id },
        workingFile: result.merged,
        staged: null,
      },
    };
  }

  // Conflict: hand the marked-up text back for the playground UI to resolve.
  return {
    status: "conflict",
    conflictText: result.merged,
    ours,
    theirs,
    base,
    otherBranch,
    ourId,
    theirId,
  };
}

// Complete a merge after the user resolves a conflict in the UI.
export function resolveMerge(
  repo,
  { ourId, theirId, otherBranch, resolvedText }
) {
  const id = makeId();
  const c = {
    id,
    parents: [ourId, theirId],
    message: `Merge ${otherBranch} into ${repo.HEAD} (conflicts resolved)`,
    author: repo.author,
    fileSnapshot: resolvedText,
    timestamp: Date.now(),
  };
  return {
    ...repo,
    commits: { ...repo.commits, [id]: c },
    branches: { ...repo.branches, [repo.HEAD]: id },
    workingFile: resolvedText,
    staged: null,
  };
}

// --- the merge algorithm ---------------------------------------------------
// Deliberately simple & line-based: good enough to teach, easy to reason about.
function threeWayMerge(base, ours, theirs) {
  const b = base.split("\n");
  const o = ours.split("\n");
  const t = theirs.split("\n");

  // If one side equals base, the other side wins cleanly.
  if (ours === base) return { hasConflict: false, merged: theirs };
  if (theirs === base) return { hasConflict: false, merged: ours };
  if (ours === theirs) return { hasConflict: false, merged: ours };

  // Otherwise both changed — produce conflict markers, line-aligned.
  const max = Math.max(o.length, t.length);
  const lines = [];
  let conflict = false;
  for (let i = 0; i < max; i++) {
    const ol = o[i] ?? "";
    const tl = t[i] ?? "";
    if (ol === tl) {
      lines.push(ol);
    } else {
      conflict = true;
      lines.push("<<<<<<< HEAD");
      if (ol !== "") lines.push(ol);
      lines.push("=======");
      if (tl !== "") lines.push(tl);
      lines.push(">>>>>>> incoming");
    }
  }
  return { hasConflict: conflict, merged: lines.join("\n") };
}
