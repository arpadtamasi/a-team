import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { readWorkspace } from "../../src/commands/ui.js";

describe("one&a migration UI data", () => {
  const migrationWorkspace = resolve("examples/oneanda-migration/.kotta");

  test.skipIf(!existsSync(migrationWorkspace))("preserves the reviewed source count without treating a guess as a target", () => {
    const workspace = readWorkspace(migrationWorkspace);

    expect(workspace.migration).toMatchObject({
      legacy_ticket_count: 112,
      migrated_ticket_count: 113,
      package_count: 6,
    });
    expect(workspace.tickets).toHaveLength(113);
    expect(workspace.packages).toHaveLength(6);
    expect(workspace.tickets.find((ticket) => ticket.id === "T-001")).toMatchObject({ status: "done" });
    expect(workspace.packages.find((pkg) => pkg.id === "P-001")).toMatchObject({
      status: "done",
      tickets: ["T-054", "T-055"],
    });
    expect(workspace.migration?.split_audit.map((entry: { legacy_id: string }) => entry.legacy_id)).toEqual([
      "O-1",
      "O-9",
      "O-38",
    ]);
  });

  test("keeps native workspaces free of migration metadata", () => {
    const workspace = readWorkspace(resolve("examples/demo-project/.kotta"));

    expect(workspace.migration).toBeNull();
    expect(workspace.tickets).toHaveLength(4);
    expect(workspace.tickets.every((ticket) => ticket.migration === null)).toBe(true);
  });
});

describe("worktree-aware UI data", () => {
  function ticket(id: string, status: string, metadata = "") {
    return `---
id: ${id}
title: Effective ticket
status: ${status}
types: [bug]
profiles: [bug]
${metadata}---
# ${id} — Effective ticket

## Outcome

The effective state is visible.
`;
  }

  // Legacy-name fixture on purpose (T-020): the board must read a `.a-team/` workspace unchanged.
  function workspaceFixture() {
    const root = mkdtempSync(join(tmpdir(), "kotta-ui-data-"));
    mkdirSync(join(root, ".a-team/ready"), { recursive: true });
    writeFileSync(join(root, ".a-team/config.yaml"), "version: 1\nproject:\n  name: fixture\n");
    writeFileSync(join(root, ".a-team/ready/T-008-effective-ticket.md"), ticket("T-008", "ready"));
    return root;
  }

  test("uses the active worktree ticket once with its execution metadata", () => {
    const root = workspaceFixture();
    mkdirSync(join(root, ".worktrees/T-008/.a-team/active"), { recursive: true });
    writeFileSync(join(root, ".worktrees/T-008/.a-team/active/T-008-effective-ticket.md"), ticket(
      "T-008",
      "active",
      "branch: fix/T-008-effective-ticket\nassigned_agent: codex\n",
    ));

    const workspace = readWorkspace(root);

    expect(workspace.tickets.filter((candidate) => candidate.id === "T-008")).toEqual([
      expect.objectContaining({
        id: "T-008",
        status: "active",
        branch: "fix/T-008-effective-ticket",
        assigned_agent: "codex",
      }),
    ]);
    expect(workspace.diagnostics).toEqual([]);
  });

  test("retains the coordinator ticket when no worktree directory exists", () => {
    const workspace = readWorkspace(workspaceFixture());

    expect(workspace.tickets).toEqual([expect.objectContaining({ id: "T-008", status: "ready" })]);
    expect(workspace.diagnostics).toEqual([]);
  });

  test("falls back without duplication when the ticket worktree is stale", () => {
    const root = workspaceFixture();
    mkdirSync(join(root, ".worktrees/T-008/.a-team/active"), { recursive: true });

    const workspace = readWorkspace(root);

    expect(workspace.tickets).toEqual([expect.objectContaining({ id: "T-008", status: "ready" })]);
    expect(workspace.diagnostics).toEqual([
      expect.objectContaining({ entity: "ticket", id: "T-008", worktree: join(root, ".worktrees/T-008") }),
    ]);
  });

  test("falls back when worktree ticket metadata is malformed", () => {
    const root = workspaceFixture();
    mkdirSync(join(root, ".worktrees/T-008/.a-team/active"), { recursive: true });
    writeFileSync(join(root, ".worktrees/T-008/.a-team/active/T-008-effective-ticket.md"), ticket("T-999", "active"));

    const workspace = readWorkspace(root);

    expect(workspace.tickets).toEqual([expect.objectContaining({ id: "T-008", status: "ready" })]);
    expect(workspace.diagnostics[0]?.message).toContain("does not match T-008");
  });
});
