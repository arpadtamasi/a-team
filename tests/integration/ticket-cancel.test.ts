import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
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

function newTicket(repository: string, title: string): { id: string; path: string } {
  return (run(repository, ["ticket", "new", "--title", title, "--type", "feature"]) as { data: { id: string; path: string } }).data;
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
    const ticket = newTicket(repository, "Duplicate work");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture ticket");

    const cancelled = run(repository, ["ticket", "cancel", ticket.id, "--resolution", "duplicate", "--approve"]);
    expect(cancelled).toMatchObject({ ok: true, command: "ticket cancel", data: { id: ticket.id, resolution: "duplicate" } });

    const done = join(repository, ".a-team/done", basename(ticket.path));
    expect(existsSync(done)).toBe(true);
    expect(existsSync(ticket.path)).toBe(false);
    const content = readFileSync(done, "utf8");
    expect(content).toContain("status: done");
    expect(content).toContain("resolution: duplicate");
    expect(run(repository, ["ticket", "validate", ticket.id])).toMatchObject({ ok: true, data: { id: ticket.id, state: "done" } });
  });

  test("cancels a ready ticket and rejects cancel on an active ticket", () => {
    const repository = fixture("a-team-cancel-ready-");
    const obsolete = newTicket(repository, "Obsolete plan");
    run(repository, ["ticket", "ready", obsolete.id, "--approve"]);
    git(repository, "add", ".");
    git(repository, "commit", "-m", "ready ticket");
    expect(run(repository, ["ticket", "cancel", obsolete.id, "--resolution", "obsolete", "--approve"])).toMatchObject({ ok: true, command: "ticket cancel", data: { id: obsolete.id, resolution: "obsolete" } });
    expect(existsSync(join(repository, ".a-team/done", basename(obsolete.path)))).toBe(true);

    const active = newTicket(repository, "Active work");
    run(repository, ["ticket", "ready", active.id, "--approve"]);
    git(repository, "add", ".");
    git(repository, "commit", "-m", "ready second ticket");
    run(repository, ["ticket", "start", active.id, "--agent", "codex"]);
    const worktree = join(repository, ".worktrees", active.id);
    const refused = fail(worktree, ["ticket", "cancel", active.id, "--resolution", "cancelled", "--approve"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout).toContain("can only be cancelled from backlog or ready");
    expect(existsSync(join(worktree, ".a-team/active", basename(active.path)))).toBe(true);
  });

  test("rejects cancel without --approve and leaves the ticket in place", () => {
    const repository = fixture("a-team-cancel-approve-");
    const ticket = newTicket(repository, "Needs approval");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture ticket");
    const refused = fail(repository, ["ticket", "cancel", ticket.id, "--resolution", "cancelled"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout).toContain("Human cancel approval is required");
    expect(existsSync(ticket.path)).toBe(true);
    expect(existsSync(join(repository, ".a-team/done", basename(ticket.path)))).toBe(false);
  });

  test("does not require review evidence for a cancelled done ticket but still requires it for completed", () => {
    const repository = fixture("a-team-cancel-evidence-");
    const ticket = newTicket(repository, "Cancelled path");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture ticket");
    run(repository, ["ticket", "cancel", ticket.id, "--resolution", "cancelled", "--approve"]);
    const cancelledPath = join(repository, ".a-team/done", basename(ticket.path));
    expect(readFileSync(cancelledPath, "utf8")).not.toContain("## Review evidence");
    expect(run(repository, ["ticket", "validate", ticket.id])).toMatchObject({ ok: true, data: { state: "done" } });

    // A hand-written sequential ticket must stay resolvable next to the minted one (D-010).
    const completed = readFileSync(cancelledPath, "utf8")
      .replace(`id: ${ticket.id}`, "id: T-901")
      .replace("resolution: cancelled", "resolution: completed")
      .replace(`# ${ticket.id}`, "# T-901");
    mkdirSync(join(repository, ".a-team/done"), { recursive: true });
    writeFileSync(join(repository, ".a-team/done/T-901-completed-path.md"), completed);
    const report = fail(repository, ["ticket", "validate", "T-901"]);
    expect(report.status).not.toBe(0);
    expect(report.stdout).toContain("MISSING_REVIEW_EVIDENCE");
  });

  test("rejects an unknown resolution", () => {
    const repository = fixture("a-team-cancel-resolution-");
    const ticket = newTicket(repository, "Bad resolution");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture ticket");
    const refused = fail(repository, ["ticket", "cancel", ticket.id, "--resolution", "wontfix", "--approve"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout).toContain("Cancel resolution must be one of");
    expect(existsSync(ticket.path)).toBe(true);
  });
});
