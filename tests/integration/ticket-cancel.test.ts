import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");

function run(repository: string, args: string[]): Record<string, unknown> {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd: repository, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function fail(repository: string, args: string[]) {
  return spawnSync("node", [cli, ...args, "--json"], { cwd: repository, encoding: "utf8" });
}

function git(repository: string, ...args: string[]): void {
  execFileSync("git", args, { cwd: repository });
}

function fixture(prefix: string): string {
  const repository = mkdtempSync(join(tmpdir(), prefix));
  git(repository, "init", "-b", "main");
  git(repository, "config", "user.name", "A-Team Test");
  git(repository, "config", "user.email", "test@example.com");
  writeFileSync(join(repository, "README.md"), "fixture\n");
  git(repository, "add", ".");
  git(repository, "commit", "-m", "initial");
  run(repository, ["init"]);
  return repository;
}

describe("ticket cancel", () => {
  test("cancels a backlog ticket as duplicate into done and validates green", () => {
    const repository = fixture("a-team-cancel-backlog-");
    run(repository, ["ticket", "new", "--title", "Duplicate work", "--type", "feature"]);
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture ticket");

    const cancelled = run(repository, ["ticket", "cancel", "T-001", "--resolution", "duplicate", "--approve"]);
    expect(cancelled).toMatchObject({ ok: true, command: "ticket cancel", data: { id: "T-001", resolution: "duplicate" } });

    const done = join(repository, ".a-team/done/T-001-duplicate-work.md");
    expect(existsSync(done)).toBe(true);
    expect(existsSync(join(repository, ".a-team/backlog/T-001-duplicate-work.md"))).toBe(false);
    const content = readFileSync(done, "utf8");
    expect(content).toContain("status: done");
    expect(content).toContain("resolution: duplicate");
    expect(run(repository, ["ticket", "validate", "T-001"])).toMatchObject({ ok: true, data: { id: "T-001", state: "done" } });
  });

  test("cancels a ready ticket and rejects cancel on an active ticket", () => {
    const repository = fixture("a-team-cancel-ready-");
    run(repository, ["ticket", "new", "--title", "Obsolete plan", "--type", "feature"]);
    run(repository, ["ticket", "ready", "T-001", "--approve"]);
    git(repository, "add", ".");
    git(repository, "commit", "-m", "ready ticket");
    expect(run(repository, ["ticket", "cancel", "T-001", "--resolution", "obsolete", "--approve"])).toMatchObject({ ok: true, command: "ticket cancel", data: { id: "T-001", resolution: "obsolete" } });
    expect(existsSync(join(repository, ".a-team/done/T-001-obsolete-plan.md"))).toBe(true);

    run(repository, ["ticket", "new", "--title", "Active work", "--type", "feature"]);
    run(repository, ["ticket", "ready", "T-002", "--approve"]);
    git(repository, "add", ".");
    git(repository, "commit", "-m", "ready second ticket");
    run(repository, ["ticket", "start", "T-002", "--agent", "codex"]);
    const worktree = join(repository, ".worktrees/T-002");
    const refused = fail(worktree, ["ticket", "cancel", "T-002", "--resolution", "cancelled", "--approve"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout).toContain("can only be cancelled from backlog or ready");
    expect(existsSync(join(worktree, ".a-team/active/T-002-active-work.md"))).toBe(true);
  });

  test("rejects cancel without --approve and leaves the ticket in place", () => {
    const repository = fixture("a-team-cancel-approve-");
    run(repository, ["ticket", "new", "--title", "Needs approval", "--type", "feature"]);
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture ticket");
    const refused = fail(repository, ["ticket", "cancel", "T-001", "--resolution", "cancelled"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout).toContain("Human cancel approval is required");
    expect(existsSync(join(repository, ".a-team/backlog/T-001-needs-approval.md"))).toBe(true);
    expect(existsSync(join(repository, ".a-team/done/T-001-needs-approval.md"))).toBe(false);
  });

  test("does not require review evidence for a cancelled done ticket but still requires it for completed", () => {
    const repository = fixture("a-team-cancel-evidence-");
    run(repository, ["ticket", "new", "--title", "Cancelled path", "--type", "feature"]);
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture ticket");
    run(repository, ["ticket", "cancel", "T-001", "--resolution", "cancelled", "--approve"]);
    const cancelledPath = join(repository, ".a-team/done/T-001-cancelled-path.md");
    expect(readFileSync(cancelledPath, "utf8")).not.toContain("## Review evidence");
    expect(run(repository, ["ticket", "validate", "T-001"])).toMatchObject({ ok: true, data: { state: "done" } });

    const completed = readFileSync(cancelledPath, "utf8")
      .replace("id: T-001", "id: T-002")
      .replace("resolution: cancelled", "resolution: completed")
      .replace("# T-001", "# T-002");
    mkdirSync(join(repository, ".a-team/done"), { recursive: true });
    writeFileSync(join(repository, ".a-team/done/T-002-completed-path.md"), completed);
    const report = fail(repository, ["ticket", "validate", "T-002"]);
    expect(report.status).not.toBe(0);
    expect(report.stdout).toContain("MISSING_REVIEW_EVIDENCE");
  });

  test("rejects an unknown resolution", () => {
    const repository = fixture("a-team-cancel-resolution-");
    run(repository, ["ticket", "new", "--title", "Bad resolution", "--type", "feature"]);
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture ticket");
    const refused = fail(repository, ["ticket", "cancel", "T-001", "--resolution", "wontfix", "--approve"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout).toContain("Cancel resolution must be one of");
    expect(existsSync(join(repository, ".a-team/backlog/T-001-bad-resolution.md"))).toBe(true);
  });
});
