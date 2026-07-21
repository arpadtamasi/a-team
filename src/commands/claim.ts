import { existsSync, readFileSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { findRepositoryRoot } from "../filesystem/workspace.js";
import { git } from "../git/git.js";
import { validateClaim } from "../core/claim.js";

interface LocatedClaim { path: string; worktree: string; data: Record<string, unknown> }

function allWorktrees(root: string): string[] {
  return git(root, ["worktree", "list", "--porcelain"]).split(/\r?\n/).filter((line) => line.startsWith("worktree ")).map((line) => line.slice(9));
}

function claims(root: string): LocatedClaim[] {
  return allWorktrees(root).flatMap((worktree) => {
    const directory = join(worktree, ".a-team/claims");
    if (!existsSync(directory)) return [];
    return readdirSync(directory).filter((name) => name.endsWith(".yaml")).map((name) => ({ path: join(directory, name), worktree, data: parse(readFileSync(join(directory, name), "utf8")) as Record<string, unknown> }));
  });
}

export function listClaims() {
  const root = findRepositoryRoot();
  return { ok: true, command: "claim list", data: { claims: claims(root).map(({ data, worktree }) => ({ ...data, located_in: worktree, valid: validateClaim(data).length === 0 })) } };
}

export function releaseClaim(id: string, force: boolean) {
  if (!force) throw new Error("Claim release is a recovery operation. Re-run with --force after checking the worktree.");
  const root = findRepositoryRoot();
  const located = claims(root).find(({ data }) => String(data.ticket) === id);
  if (!located) throw new Error(`Claim for ${id} was not found.`);
  const errors = validateClaim(located.data);
  if (errors.length) throw new Error(`Claim for ${id} is invalid: ${errors.join(", ")}. Repair it before release.`);
  if (git(located.worktree, ["status", "--porcelain"])) throw new Error(`Worktree ${located.worktree} has uncommitted changes; the claim was not released.`);
  unlinkSync(located.path);
  return { ok: true, command: "claim release", data: { id, warning: "The branch and worktree were preserved for manual recovery." } };
}
