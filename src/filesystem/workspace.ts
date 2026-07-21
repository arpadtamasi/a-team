import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
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
  const workspace = join(root, ".a-team");
  if (existsSync(workspace)) {
    throw new Error(".a-team already exists; initialization preserves existing files.");
  }

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
  writeFileSync(join(workspace, "README.md"), "# A-Team workspace\n\nRepository files are canonical. Use the `a-team` CLI to change state.\n");
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

  return { root, created };
}

export function renderEmptyIndex(): string {
  return `# A-Team Status

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
  const workspace = join(root, ".a-team");
  if (!existsSync(workspace)) return;
  const entries = (directory: string, prefix: string) => {
    const path = join(workspace, directory);
    if (!existsSync(path)) return [];
    return readdirSync(path).filter((name) => name.startsWith(prefix) && name.endsWith(".md")).sort().map((name) => `- ${name.replace(/\.md$/, "")}`);
  };
  const section = (title: string, lines: string[]) => `## ${title}\n\n${lines.length ? lines.join("\n") : "None."}`;
  writeFileSync(join(workspace, "index.md"), `# A-Team Status\n\n> Generated file. Do not edit manually.\n\n${[
    section("Ready packages", entries("packages/ready", "P-")),
    section("Active packages", entries("packages/active", "P-")),
    section("Ready tickets", entries("ready", "T-")),
    section("Active tickets", entries("active", "T-")),
    section("Review", entries("review", "T-")),
    section("Blocked", []),
    section("New findings", entries("findings/new", "F-")),
  ].join("\n\n")}\n`);
}
