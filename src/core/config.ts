import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

export interface WorkspaceConfig {
  baseBranch: string;
  protectedBranches: string[];
}

const DEFAULTS: WorkspaceConfig = { baseBranch: "main", protectedBranches: ["main", "master", "develop"] };

/** Reads the git section of .a-team/config.yaml, falling back to the values `init` writes. */
export function readWorkspaceConfig(root: string): WorkspaceConfig {
  const path = join(root, ".a-team/config.yaml");
  if (!existsSync(path)) return { ...DEFAULTS };
  const parsed = parse(readFileSync(path, "utf8")) as { git?: { base_branch?: unknown; protected_branches?: unknown } } | null;
  const baseBranch = typeof parsed?.git?.base_branch === "string" && parsed.git.base_branch.trim() ? parsed.git.base_branch.trim() : DEFAULTS.baseBranch;
  const configured = Array.isArray(parsed?.git?.protected_branches) ? parsed.git.protected_branches.map(String) : DEFAULTS.protectedBranches;
  // The base branch is protected whether or not the operator listed it.
  return { baseBranch, protectedBranches: [...new Set([...configured, baseBranch])] };
}
