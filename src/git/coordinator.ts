import { git } from "./git.js";

export interface CoordinatorMetadata {
  branch: string;
  base_branch: string;
  base_commit: string;
  worktree?: string | null;
  cleaned_at?: string | null;
}

/** Every batch coordinates on a deterministic branch name; nothing infers a different one. */
export function coordinatorBranchName(batchId: string): string {
  return `coord/${batchId}`;
}

export type IntegrationEvidence =
  | { integrated: true; via: "local-base" | "remote-base"; ref: string }
  | { integrated: false; reason: "unmerged"; checked: string[] };

export type BaseUpdate =
  | { kind: "current" }
  | { kind: "ahead" }
  | { kind: "fast-forward"; from: string; to: string; remote: string }
  | { kind: "diverged"; local: string; remote: string }
  | { kind: "no-remote" };

export type CleanupState =
  | "unstarted"
  | "active"
  | "done-unintegrated"
  | "cleanup-pending"
  | "cleaned"
  | "blocked-dirty"
  | "blocked-diverged"
  | "blocked-in-use";

export function branchExists(root: string, branch: string): boolean {
  try {
    git(root, ["rev-parse", "--verify", "--quiet", `refs/heads/${branch}`]);
    return true;
  } catch { return false; }
}

export function remoteBranchRef(root: string, base: string): string | null {
  for (const ref of [`refs/remotes/origin/${base}`]) {
    try {
      git(root, ["rev-parse", "--verify", "--quiet", ref]);
      return ref.replace("refs/remotes/", "");
    } catch { /* not fetched here */ }
  }
  return null;
}

function isAncestor(root: string, ancestor: string, descendant: string): boolean {
  try {
    git(root, ["merge-base", "--is-ancestor", ancestor, descendant]);
    return true;
  } catch { return false; }
}

/** Integration is proven only by ancestry — never by branch naming or a merge message. */
export function classifyIntegration(root: string, coordinatorBranch: string, base: string): IntegrationEvidence {
  const checked: string[] = [];
  if (branchExists(root, base)) {
    checked.push(base);
    if (isAncestor(root, coordinatorBranch, base)) return { integrated: true, via: "local-base", ref: base };
  }
  const remote = remoteBranchRef(root, base);
  if (remote) {
    checked.push(remote);
    if (isAncestor(root, coordinatorBranch, remote)) return { integrated: true, via: "remote-base", ref: remote };
  }
  return { integrated: false, reason: "unmerged", checked };
}

/** Classifies how the local base relates to its remote-tracking ref; only fast-forward is actionable. */
export function classifyBaseUpdate(root: string, base: string): BaseUpdate {
  const remote = remoteBranchRef(root, base);
  if (!remote) return { kind: "no-remote" };
  const local = git(root, ["rev-parse", base]);
  const target = git(root, ["rev-parse", remote]);
  if (local === target) return { kind: "current" };
  if (isAncestor(root, base, remote)) return { kind: "fast-forward", from: local, to: target, remote };
  // Local commits the remote has not seen yet are normal here — Kotta commits its own state locally.
  if (isAncestor(root, remote, base)) return { kind: "ahead" };
  return { kind: "diverged", local, remote: target };
}

/** Lists worktrees other than `root` together with the branch each has checked out. */
export function linkedWorktrees(root: string): Array<{ path: string; branch: string | null }> {
  const output = git(root, ["worktree", "list", "--porcelain"]);
  const entries: Array<{ path: string; branch: string | null }> = [];
  let path: string | null = null;
  let branch: string | null = null;
  const flush = () => { if (path && path !== root) entries.push({ path, branch }); path = null; branch = null; };
  for (const line of output.split(/\r?\n/)) {
    if (line.startsWith("worktree ")) { flush(); path = line.slice("worktree ".length); }
    else if (line.startsWith("branch ")) branch = line.slice("branch ".length).replace("refs/heads/", "");
    else if (line === "detached") branch = null;
  }
  flush();
  return entries;
}
