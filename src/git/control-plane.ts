import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { readWorkspaceConfig } from "../core/config.js";
import { workspaceDirectoryName } from "../filesystem/workspace.js";
import { assertClean, git } from "./git.js";

interface WorktreeEntry {
  path: string;
  branch: string | null;
}

/** Parse `git worktree list --porcelain` without depending on human formatting. */
export function linkedWorktreeEntries(root: string): WorktreeEntry[] {
  const entries: WorktreeEntry[] = [];
  let current: WorktreeEntry | null = null;
  for (const line of git(root, ["worktree", "list", "--porcelain"]).split(/\r?\n/)) {
    if (line.startsWith("worktree ")) {
      current = { path: line.slice(9), branch: null };
      entries.push(current);
    } else if (current && line.startsWith("branch ")) {
      current.branch = line.slice(7);
    }
  }
  return entries;
}

/**
 * Canonical Kotta state lives in the worktree that has the configured base branch checked out.
 * A feature worktree may read its own code, but every live state mutation is routed here.
 */
export function controlPlaneRoot(root: string): string {
  const { baseBranch } = readWorkspaceConfig(root);
  const reference = `refs/heads/${baseBranch}`;
  const matches = linkedWorktreeEntries(root).filter((entry) => entry.branch === reference);
  if (matches.length === 1) return resolve(matches[0].path);
  if (matches.length > 1) throw new Error(`Configured control branch '${baseBranch}' is checked out in more than one worktree; Kotta cannot choose a canonical writer.`);
  throw new Error(`Configured control branch '${baseBranch}' has no checked-out control worktree. Check it out, then retry; Kotta never writes live state into a feature worktree.`);
}

function commonGitDirectory(root: string): string {
  const value = git(root, ["rev-parse", "--git-common-dir"]);
  return isAbsolute(value) ? value : resolve(root, value);
}

function ownerIsAlive(path: string): boolean {
  try {
    const owner = JSON.parse(readFileSync(path, "utf8")) as { pid?: unknown };
    const pid = Number(owner.pid);
    if (!Number.isInteger(pid) || pid <= 0) return false;
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

const pause = (milliseconds: number): void => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
};

export interface MutationOptions {
  timeoutMs?: number;
  requireClean?: boolean;
}

/** Serialize writers from every linked worktree and recover locks left by dead processes. */
export function withControlPlaneMutation<T>(root: string, action: (controlRoot: string) => T, options: MutationOptions = {}): T {
  const controlRoot = controlPlaneRoot(root);
  const lock = resolve(commonGitDirectory(root), "kotta-mutation.lock");
  const ownerPath = resolve(lock, "owner.json");
  const deadline = Date.now() + (options.timeoutMs ?? 2_000);
  while (true) {
    try {
      mkdirSync(lock);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      let abandoned = false;
      try { abandoned = existsSync(ownerPath) ? !ownerIsAlive(ownerPath) : Date.now() - statSync(lock).mtimeMs > 5_000; }
      catch (inspectionError) {
        if ((inspectionError as NodeJS.ErrnoException).code === "ENOENT") continue;
        throw inspectionError;
      }
      if (abandoned) {
        rmSync(lock, { recursive: true, force: true });
        continue;
      }
      if (Date.now() >= deadline) throw new Error(`Kotta control plane is busy at ${controlRoot}. Retry the same command; no state was changed.`);
      pause(25);
    }
  }
  writeFileSync(ownerPath, `${JSON.stringify({ pid: process.pid, started_at: new Date().toISOString(), root: controlRoot })}\n`);
  try {
    if (options.requireClean !== false) assertClean(controlRoot);
    return action(controlRoot);
  } finally {
    rmSync(lock, { recursive: true, force: true });
  }
}

/** Commit only canonical workspace state after a validated mutation. */
export function commitControlState(controlRoot: string, message: string): boolean {
  const directory = workspaceDirectoryName(controlRoot);
  if (!git(controlRoot, ["status", "--porcelain", "--", directory])) return false;
  git(controlRoot, ["add", directory]);
  git(controlRoot, ["commit", "-m", message]);
  return true;
}
