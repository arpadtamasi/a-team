import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { readWorkspace } from "../../src/commands/ui.js";

describe("one&a migration UI data", () => {
  const migrationWorkspace = resolve("examples/oneanda-migration/.a-team");

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
    const workspace = readWorkspace(resolve("examples/demo-project/.a-team"));

    expect(workspace.migration).toBeNull();
    expect(workspace.tickets).toHaveLength(4);
    expect(workspace.tickets.every((ticket) => ticket.migration === null)).toBe(true);
  });
});
