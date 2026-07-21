import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");
const run = (cwd: string, args: string[]) => {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as Record<string, unknown>;
};
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });

describe("review and close", () => {
  test("records evidence, merges, and safely releases execution resources", () => {
    const root = mkdtempSync(join(tmpdir(), "a-team-close-"));
    git(root, "init", "-b", "main");
    git(root, "config", "user.name", "A-Team Test");
    git(root, "config", "user.email", "test@example.com");
    writeFileSync(join(root, "README.md"), "fixture\n");
    git(root, "add", "."); git(root, "commit", "-m", "initial");
    run(root, ["init"]);
    run(root, ["ticket", "new", "--title", "Document flow", "--type", "documentation"]);
    const path = join(root, ".a-team/backlog/T-001-document-flow.md");
    writeFileSync(path, readFileSync(path, "utf8").replace("Describe the observable outcome.", "The flow is documented.").replace("- Define an observable condition.", "- Documentation describes the flow.").replace("- Explain how acceptance will be checked.", "- Read the rendered documentation."));
    run(root, ["ticket", "ready", "T-001", "--approve"]);
    git(root, "add", "."); git(root, "commit", "-m", "ready ticket");
    run(root, ["ticket", "start", "T-001", "--agent", "codex"]);
    const worktree = join(root, ".worktrees/T-001");
    writeFileSync(join(worktree, "flow.md"), "# Flow\n");
    git(worktree, "add", "."); git(worktree, "commit", "-m", "docs: document flow");

    expect(run(worktree, ["ticket", "review", "T-001", "--evidence", "flow.md renders and was inspected", "--pull-request", "PR-1"])).toMatchObject({ ok: true, command: "ticket review" });
    git(root, "merge", "--no-ff", "docs/T-001-document-flow", "-m", "merge ticket");
    const pending = join(worktree, "pending.txt");
    writeFileSync(pending, "uncommitted\n");
    const refused = spawnSync("node", [cli, "ticket", "close", "T-001", "--approve", "--json"], { cwd: root, encoding: "utf8" });
    expect(refused.status).toBe(1);
    expect(existsSync(join(root, ".a-team/review/T-001-document-flow.md"))).toBe(true);
    expect(existsSync(join(root, ".a-team/claims/T-001.yaml"))).toBe(true);
    unlinkSync(pending);
    expect(run(root, ["ticket", "close", "T-001", "--approve"])).toMatchObject({ ok: true, command: "ticket close" });

    expect(existsSync(join(root, ".a-team/done/T-001-document-flow.md"))).toBe(true);
    expect(existsSync(join(root, ".a-team/claims/T-001.yaml"))).toBe(false);
    expect(existsSync(worktree)).toBe(false);
    expect(git(root, "branch", "--list", "docs/T-001-document-flow").trim()).toBe("");
  });
});
