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

function newContract(repository: string, title: string): { id: string; path: string } {
  return (run(repository, ["contract", "new", "--title", title, "--type", "feature"]) as { data: { id: string; path: string } }).data;
}

function fixture(prefix: string): string {
  const repository = mkdtempSync(join(tmpdir(), prefix));
  git(repository, "init", "-b", "main");
  git(repository, "config", "user.name", "Kotta Test");
  git(repository, "config", "user.email", "test@example.com");
  writeFileSync(join(repository, "README.md"), "fixture\n");
  git(repository, "add", ".");
  git(repository, "commit", "-m", "initial");
  run(repository, ["init"]);
  return repository;
}

describe("contract cancel", () => {
  test("cancels a backlog contract as duplicate into done and validates green", () => {
    const repository = fixture("kotta-cancel-backlog-");
    const contract = newContract(repository, "Duplicate work");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture contract");

    const cancelled = run(repository, ["contract", "cancel", contract.id, "--resolution", "duplicate", "--approve"]);
    expect(cancelled).toMatchObject({ ok: true, command: "contract cancel", data: { id: contract.id, resolution: "duplicate" } });

    const done = join(repository, ".kotta/done", basename(contract.path));
    expect(existsSync(done)).toBe(true);
    expect(existsSync(contract.path)).toBe(false);
    const content = readFileSync(done, "utf8");
    expect(content).toContain("status: done");
    expect(content).toContain("resolution: duplicate");
    expect(run(repository, ["contract", "validate", contract.id])).toMatchObject({ ok: true, data: { id: contract.id, state: "done" } });
  });

  test("cancels a defined contract and rejects cancel on an active contract", () => {
    const repository = fixture("kotta-cancel-defined-");
    const obsolete = newContract(repository, "Obsolete plan");
    run(repository, ["contract", "sign", obsolete.id, "--approve"]);
    git(repository, "add", ".");
    git(repository, "commit", "-m", "defined contract");
    expect(run(repository, ["contract", "cancel", obsolete.id, "--resolution", "obsolete", "--approve"])).toMatchObject({ ok: true, command: "contract cancel", data: { id: obsolete.id, resolution: "obsolete" } });
    expect(existsSync(join(repository, ".kotta/done", basename(obsolete.path)))).toBe(true);

    const active = newContract(repository, "Active work");
    run(repository, ["contract", "sign", active.id, "--approve"]);
    git(repository, "add", ".");
    git(repository, "commit", "-m", "defined second contract");
    run(repository, ["contract", "start", active.id, "--agent", "codex"]);
    const worktree = join(repository, ".worktrees", active.id);
    const refused = fail(worktree, ["contract", "cancel", active.id, "--resolution", "cancelled", "--approve"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout).toContain("can only be cancelled from backlog or defined");
    expect(existsSync(join(repository, ".kotta/active", basename(active.path)))).toBe(true);
    expect(existsSync(join(worktree, ".kotta/active", basename(active.path)))).toBe(false);
  });

  test("rejects cancel without --approve and leaves the contract in place", () => {
    const repository = fixture("kotta-cancel-approve-");
    const contract = newContract(repository, "Needs approval");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture contract");
    const refused = fail(repository, ["contract", "cancel", contract.id, "--resolution", "cancelled"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout).toContain("Human cancel approval is required");
    expect(existsSync(contract.path)).toBe(true);
    expect(existsSync(join(repository, ".kotta/done", basename(contract.path)))).toBe(false);
  });

  test("does not require review evidence for a cancelled done contract but still requires it for completed", () => {
    const repository = fixture("kotta-cancel-evidence-");
    const contract = newContract(repository, "Cancelled path");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture contract");
    run(repository, ["contract", "cancel", contract.id, "--resolution", "cancelled", "--approve"]);
    const cancelledPath = join(repository, ".kotta/done", basename(contract.path));
    expect(readFileSync(cancelledPath, "utf8")).not.toContain("## Review evidence");
    expect(run(repository, ["contract", "validate", contract.id])).toMatchObject({ ok: true, data: { state: "done" } });

    // A hand-written sequential contract must stay resolvable next to the minted one (D-010).
    const completed = readFileSync(cancelledPath, "utf8")
      .replace(`id: ${contract.id}`, "id: T-901")
      .replace("resolution: cancelled", "resolution: completed")
      .replace(`# ${contract.id}`, "# T-901");
    mkdirSync(join(repository, ".kotta/done"), { recursive: true });
    writeFileSync(join(repository, ".kotta/done/T-901-completed-path.md"), completed);
    const report = fail(repository, ["contract", "validate", "T-901"]);
    expect(report.status).not.toBe(0);
    expect(report.stdout).toContain("MISSING_REVIEW_EVIDENCE");
  });

  test("rejects an unknown resolution", () => {
    const repository = fixture("kotta-cancel-resolution-");
    const contract = newContract(repository, "Bad resolution");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture contract");
    const refused = fail(repository, ["contract", "cancel", contract.id, "--resolution", "wontfix", "--approve"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout).toContain("Cancel resolution must be one of");
    expect(existsSync(contract.path)).toBe(true);
  });
});
