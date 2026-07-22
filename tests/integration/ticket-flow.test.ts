import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");

function run(repository: string, args: string[]): Record<string, unknown> {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd: repository, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function git(repository: string, ...args: string[]): void {
  execFileSync("git", args, { cwd: repository });
}

describe("ticket execution vertical slice", () => {
  test("defines a complete backlog ticket through the canonical CLI", () => {
    const repository = mkdtempSync(join(tmpdir(), "a-team-define-"));
    git(repository, "init", "-b", "main");
    writeFileSync(join(repository, "README.md"), "fixture\n");
    run(repository, ["init"]);
    run(repository, ["ticket", "new", "--title", "Release CLI", "--type", "feature", "--profile", "workflow"]);
    run(repository, ["ticket", "new", "--title", "Publish site", "--type", "feature"]);
    const definition = join(repository, "T-001-definition.md");
    writeFileSync(definition, `---
id: T-001
priority: high
risk: high
depends_on: []
blocks: [T-002]
---
# T-001 — Release CLI

## Outcome

The CLI is publicly installable.

## Actors

Maintainer and user.

## Initial state

The package is unpublished.

## States

Tested, published, verified.

## Transitions

Tests move the package to publish; verification moves it to done.

## Triggers

A protected version tag.

## Permissions

Only the release environment can publish.

## Error paths

Failure leaves the previous version current.

## Cancellation path

Cancellation before publish is safe.

## Retry and duplicate-action behaviour

Retries never overwrite an existing version.

## Audit and notification expectations

The release run records the version and commit.

## Scope

Publish the CLI.

## Non-goals

Build the website.

## Acceptance

- A clean install succeeds.

## Verification

- Run the clean-install canary.

## Constraints

Use the public npm registry.

## Open decisions

None.

## Execution notes

None.
`);

    expect(run(repository, ["ticket", "define", "T-001", "--from", definition])).toMatchObject({ ok: true, command: "ticket define", data: { id: "T-001" } });
    const ticket = join(repository, ".a-team/backlog/T-001-release-cli.md");
    expect(readFileSync(ticket, "utf8")).toContain("priority: high");
    expect(readFileSync(ticket, "utf8")).toContain("blocks:\n  - T-002");
    expect(run(repository, ["ticket", "ready", "T-001", "--approve"])).toMatchObject({ ok: true, command: "ticket ready" });
  });

  test("rejects unsupported definition metadata without changing the ticket", () => {
    const repository = mkdtempSync(join(tmpdir(), "a-team-define-reject-"));
    git(repository, "init", "-b", "main");
    writeFileSync(join(repository, "README.md"), "fixture\n");
    run(repository, ["init"]);
    run(repository, ["ticket", "new", "--title", "Safe definition", "--type", "feature"]);
    const ticket = join(repository, ".a-team/backlog/T-001-safe-definition.md");
    const before = readFileSync(ticket, "utf8");
    const definition = join(repository, "invalid-definition.md");
    writeFileSync(definition, "---\nid: T-001\nstatus: ready\n---\n## Outcome\n\nUnsafe.\n");
    const result = spawnSync("node", [cli, "ticket", "define", "T-001", "--from", definition, "--json"], { cwd: repository, encoding: "utf8" });
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain("Unsupported definition fields: status");
    expect(readFileSync(ticket, "utf8")).toBe(before);
  });

  test("moves a valid profiled ticket to ready and starts it in an isolated worktree", () => {
    const repository = mkdtempSync(join(tmpdir(), "a-team-flow-"));
    git(repository, "init", "-b", "main");
    git(repository, "config", "user.name", "A-Team Test");
    git(repository, "config", "user.email", "test@example.com");
    writeFileSync(join(repository, "README.md"), "fixture\n");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "initial");

    run(repository, ["init"]);
    const created = run(repository, ["ticket", "new", "--title", "Ship export", "--type", "feature", "--profile", "workflow"]);
    expect(created).toMatchObject({ ok: true, command: "ticket new", data: { id: "T-001" } });

    const ticket = join(repository, ".a-team/backlog/T-001-ship-export.md");
    writeFileSync(ticket, readFileSync(ticket, "utf8").replace(
      "Describe the observable outcome.",
      "Users can export filtered courses.\n\n## Actors\n\nCourse administrator.\n\n## Initial state\n\nA filtered course list is visible.\n\n## States\n\nReady and exported.\n\n## Transitions\n\nReady to exported.\n\n## Triggers\n\nExport action.\n\n## Permissions\n\nCourse export permission.\n\n## Error paths\n\nAn actionable error is shown.\n\n## Cancellation path\n\nCancellation leaves the list unchanged.\n\n## Retry and duplicate-action behaviour\n\nRetry is safe and duplicate actions are ignored.\n\n## Audit and notification expectations\n\nThe export is audited; no notification is sent.",
    ).replace("- Define an observable condition.", "- A filtered export file is produced.")
      .replace("- Explain how acceptance will be checked.", "- Run the export integration test."));

    expect(run(repository, ["ticket", "ready", "T-001", "--approve"])).toMatchObject({ ok: true, command: "ticket ready" });
    git(repository, "add", ".");
    git(repository, "commit", "-m", "define ready ticket");

    const started = run(repository, ["ticket", "start", "T-001", "--agent", "codex"]);
    expect(started).toMatchObject({ ok: true, command: "ticket start", data: { branch: "feat/T-001-ship-export" } });
    const worktree = join(repository, ".worktrees/T-001");
    expect(existsSync(join(worktree, ".a-team/active/T-001-ship-export.md"))).toBe(true);
    expect(readFileSync(join(worktree, ".a-team/claims/T-001.yaml"), "utf8")).toContain("agent: codex");
    expect(run(worktree, ["status"])).toMatchObject({ ok: true, data: { activeTickets: ["T-001"] } });
    expect(run(repository, ["claim", "list"])).toMatchObject({ ok: true, data: { claims: [{ ticket: "T-001", agent: "codex" }] } });
  });
});
