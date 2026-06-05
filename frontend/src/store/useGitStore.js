// useGitStore.js
// Zustand store wrapping the pure git engine. The UI talks ONLY to this store;
// the store owns the repo object and emits skill-tracker events on milestones.

import { create } from "zustand";
import * as git from "../engine/gitEngine";

export const useGitStore = create((set, get) => ({
  repo: git.createRepo({ author: "you" }),
  pendingConflict: null, // set when a merge needs manual resolution
  events: [], // milestone events the Skill Tracker listens to
  toast: null, // transient message for the UI

  _emit(type) {
    set((s) => ({ events: [...s.events, { type, at: Date.now() }] }));
  },
  _notify(msg) {
    set({ toast: msg });
  },
  clearToast() {
    set({ toast: null });
  },

  setWorkingFile(text) {
    set((s) => ({ repo: { ...s.repo, workingFile: text } }));
  },

  stage() {
    set((s) => ({ repo: git.stage(s.repo) }));
    get()._notify("Changes staged.");
  },

  commit(message) {
    try {
      const repo = git.commit(get().repo, message);
      set({ repo });
      get()._emit("commit");
      if (get().events.filter((e) => e.type === "commit").length === 1) {
        get()._emit("first_commit");
      }
      get()._notify(`Committed: "${message}"`);
    } catch (e) {
      get()._notify(e.message);
    }
  },

  branch(name) {
    try {
      set((s) => ({ repo: git.branch(s.repo, name) }));
      get()._emit("branch");
      get()._notify(`Branch "${name}" created.`);
    } catch (e) {
      get()._notify(e.message);
    }
  },

  checkout(name) {
    try {
      set((s) => ({ repo: git.checkout(s.repo, name) }));
      get()._notify(`Switched to "${name}".`);
    } catch (e) {
      get()._notify(e.message);
    }
  },

  merge(otherBranch) {
    try {
      const result = git.merge(get().repo, otherBranch);
      if (result.status === "conflict") {
        set({ pendingConflict: result });
        get()._notify("Merge conflict — resolve it in the playground.");
        return;
      }
      set({ repo: result.repo });
      get()._emit("merge");
      get()._notify(`Merged ${otherBranch} (${result.status}).`);
    } catch (e) {
      get()._notify(e.message);
    }
  },

  resolveConflict(resolvedText) {
    const c = get().pendingConflict;
    if (!c) return;
    const repo = git.resolveMerge(get().repo, {
      ourId: c.ourId,
      theirId: c.theirId,
      otherBranch: c.otherBranch,
      resolvedText,
    });
    set({ repo, pendingConflict: null });
    get()._emit("merge");
    get()._emit("conflict_resolved");
    get()._notify("Conflict resolved & merged. Nicely done.");
  },

  reset() {
    set({
      repo: git.createRepo({ author: "you" }),
      pendingConflict: null,
      events: [],
      toast: "Repo reset.",
    });
  },
}));
