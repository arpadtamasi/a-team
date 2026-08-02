import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";

const DIRECTORIES = [
  "backlog",
  "ready",
  "active",
  "review",
  "done",
  "findings/new",
  "findings/resolved",
  "packages/backlog",
  "packages/ready",
  "packages/active",
  "packages/done",
  "profiles",
  "claims",
  "decisions",
];

/** The workspace directory name `init` creates (T-020 / D-006). */
export const WORKSPACE_DIRECTORY = ".kotta";

/** The pre-rename name. Still read, never created: an existing workspace is never migrated by the CLI. */
export const LEGACY_WORKSPACE_DIRECTORY = ".a-team";

/** Discovery order: the new name wins, the legacy name keeps every existing workspace working. */
export const WORKSPACE_DIRECTORIES = [WORKSPACE_DIRECTORY, LEGACY_WORKSPACE_DIRECTORY] as const;

function isWorkspaceDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function isSymbolicLink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * The workspace directory name inside `root`: `.kotta` when it is there, `.a-team` otherwise (D-006).
 *
 * A symlinked candidate loses to a real sibling directory. During the transition a project bridges the
 * two names with `ln -s`, and only the real directory is a tracked tree in Git — the UI reads state
 * through `git archive`/`ls-tree`, which see a symlink as a link entry, not as the files behind it.
 * Resolving to the real name keeps both symlink directions readable.
 */
export function workspaceDirectoryName(root: string): string {
  const present = WORKSPACE_DIRECTORIES.filter((name) => isWorkspaceDirectory(join(root, name)));
  if (present.length === 0) return LEGACY_WORKSPACE_DIRECTORY;
  return present.find((name) => !isSymbolicLink(join(root, name))) ?? present[0];
}

/** Absolute path inside the discovered workspace directory of `root`. */
export function workspacePath(root: string, ...segments: string[]): string {
  return join(root, workspaceDirectoryName(root), ...segments);
}

/** True when `root` holds a workspace under either name. */
export function hasWorkspace(root: string): boolean {
  return WORKSPACE_DIRECTORIES.some((name) => isWorkspaceDirectory(join(root, name)));
}

/** Both names, for the "no workspace here" messages — the reader may be on either side of the rename. */
export const WORKSPACE_DIRECTORY_LABEL = WORKSPACE_DIRECTORIES.join(" or ");

export interface InitOptions {
  root?: string;
  projectName?: string;
}

export function findRepositoryRoot(start = process.cwd()): string {
  let current = resolve(start);
  while (true) {
    if (existsSync(join(current, ".git"))) return current;
    const parent = resolve(current, "..");
    if (parent === current) throw new Error("Not inside a Git repository. Run git init first.");
    current = parent;
  }
}

export function initializeWorkspace(options: InitOptions = {}): { root: string; created: string[] } {
  const root = options.root ?? findRepositoryRoot();
  // A repository that already carries either name is initialized: `init` never migrates one to the other.
  const existingName = WORKSPACE_DIRECTORIES.find((name) => existsSync(join(root, name)));
  if (existingName) {
    throw new Error(`${existingName} already exists; initialization preserves existing files.`);
  }
  const workspace = join(root, WORKSPACE_DIRECTORY);

  const created: string[] = [];
  for (const directory of DIRECTORIES) {
    const path = join(workspace, directory);
    mkdirSync(path, { recursive: true });
    created.push(path);
  }

  const config = {
    version: 1,
    project: { name: options.projectName ?? basename(root) },
    workflow: {
      require_human_ready_approval: true,
      require_human_done_approval: true,
      allow_agent_findings: true,
      allow_agent_ready_tickets: false,
    },
    git: {
      base_branch: "main",
      protected_branches: ["main", "master", "develop"],
      worktrees: "auto",
      worktree_root: ".worktrees",
      branch_pattern: "{prefix}/{id}-{slug}",
    },
    packages: { default_parallelism: 2, stop_on_failure: true },
    validation: {
      strict: true,
      reject_unknown_profiles: true,
      require_verification_for_ready: true,
      require_review_evidence_for_done: true,
    },
  };

  writeFileSync(join(workspace, "config.yaml"), stringify(config));
  writeFileSync(
    join(workspace, "README.md"),
    "# Kotta workspace\n\nRepository files are canonical. Use the `kotta` CLI to change state.\n\nCreate durable human decisions from a reviewed Markdown draft with `kotta decision create --from <draft.md> --approve`; do not edit `decisions/` directly. Canonical records use identity-only filenames such as `D-001.md`.\n",
  );
  writeFileSync(join(workspace, "index.md"), renderEmptyIndex());
  const bundledProfiles = fileURLToPath(new URL("../../profiles", import.meta.url));
  if (existsSync(bundledProfiles)) {
    for (const filename of readdirSync(bundledProfiles).filter((name) => name.endsWith(".yaml"))) {
      copyFileSync(join(bundledProfiles, filename), join(workspace, "profiles", filename));
    }
  }

  const gitignore = join(root, ".gitignore");
  const existing = existsSync(gitignore) ? readFileSync(gitignore, "utf8") : "";
  if (!existing.split(/\r?\n/).includes(".worktrees/")) {
    writeFileSync(gitignore, `${existing}${existing && !existing.endsWith("\n") ? "\n" : ""}.worktrees/\n`);
  }
  ensureIndexMergeAttribute(root);

  return { root, created };
}

/** The merge attribute for a workspace under `directory`; the name moved with the rename (T-020). */
export function indexMergeAttribute(directory: string): string {
  return `${directory}/index.md merge=union`;
}

export const INDEX_MERGE_ATTRIBUTE = indexMergeAttribute(WORKSPACE_DIRECTORY);

/**
 * `index.md` is a generated projection, so two branches that each add an entity have no real
 * disagreement about it. The union driver takes both sides instead of raising a conflict; the next
 * write regenerates the file from disk, so nothing stale survives.
 */
export function ensureIndexMergeAttribute(root: string): void {
  const attribute = indexMergeAttribute(workspaceDirectoryName(root));
  const path = join(root, ".gitattributes");
  const existing = existsSync(path) ? readFileSync(path, "utf8") : "";
  if (existing.split(/\r?\n/).includes(attribute)) return;
  writeFileSync(path, `${existing}${existing && !existing.endsWith("\n") ? "\n" : ""}${attribute}\n`);
}

export function renderEmptyIndex(): string {
  return `# Kotta Status

> Generated file. Do not edit manually.

## Ready packages

## Active packages

## Ready tickets

## Active tickets

## Review

## Blocked

## New findings
`;
}

export function regenerateIndex(root: string): void {
  const workspace = workspacePath(root);
  if (!existsSync(workspace)) return;
  const entries = (directory: string) => {
    const path = join(workspace, directory);
    if (!existsSync(path)) return [];
    return readdirSync(path).filter((name) => name.endsWith(".md")).sort().map((name) => `- ${name.replace(/\.md$/, "")}`);
  };
  const section = (title: string, lines: string[]) => `## ${title}\n\n${lines.length ? lines.join("\n") : "None."}`;
  writeFileSync(join(workspace, "index.md"), `# Kotta Status\n\n> Generated file. Do not edit manually.\n\n${[
    section("Ready packages", entries("packages/ready")),
    section("Active packages", entries("packages/active")),
    section("Ready tickets", entries("ready")),
    section("Active tickets", entries("active")),
    section("Review", entries("review")),
    section("Blocked", []),
    section("New findings", entries("findings/new")),
  ].join("\n\n")}\n`);
}
