import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");
const invoke = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
const run = (cwd: string, args: string[]) => {
  const result = invoke(cwd, args);
  if (result.status !== 0) throw new Error(result.stdout || result.stderr);
  return JSON.parse(result.stdout) as Record<string, unknown>;
};
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd });

function repository(): string {
  const root = mkdtempSync(join(tmpdir(), "a-team-safety-"));
  git(root, "init", "-b", "main"); git(root, "config", "user.name", "A-Team Test"); git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n"); git(root, "add", "."); git(root, "commit", "-m", "initial");
  run(root, ["init"]);
  return root;
}

function completeTemplate(root: string, path: string): void {
  writeFileSync(path, readFileSync(path, "utf8").replace("Describe the observable outcome.", "The result is observable.").replace("- Define an observable condition.", "- The result exists.").replace("- Explain how acceptance will be checked.", "- Run the integration test."));
}

describe("mutation safety", () => {
  test("unknown profiles cannot move a ticket out of backlog", () => {
    const root = repository();
    run(root, ["ticket", "new", "--title", "Unsafe ticket", "--type", "feature", "--profile", "invented"]);
    const backlog = join(root, ".a-team/backlog/T-001-unsafe-ticket.md");
    completeTemplate(root, backlog);
    const result = invoke(root, ["ticket", "ready", "T-001", "--approve"]);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({ ok: false });
    expect(existsSync(backlog)).toBe(true);
    expect(existsSync(join(root, ".a-team/ready/T-001-unsafe-ticket.md"))).toBe(false);
  });

  test("dirty repositories and duplicate starts are rejected without reusing a worktree", () => {
    const root = repository();
    run(root, ["ticket", "new", "--title", "Safe start", "--type", "feature"]);
    const backlog = join(root, ".a-team/backlog/T-001-safe-start.md");
    completeTemplate(root, backlog);
    run(root, ["ticket", "ready", "T-001", "--approve"]);
    git(root, "add", "."); git(root, "commit", "-m", "ready");
    writeFileSync(join(root, "dirty.txt"), "pending\n");
    expect(invoke(root, ["ticket", "start", "T-001", "--agent", "codex"]).status).toBe(1);
    expect(existsSync(join(root, ".worktrees/T-001"))).toBe(false);
    unlinkSync(join(root, "dirty.txt"));
    run(root, ["ticket", "start", "T-001", "--agent", "codex"]);
    expect(invoke(root, ["ticket", "start", "T-001", "--agent", "other"]).status).toBe(1);
  });
});
