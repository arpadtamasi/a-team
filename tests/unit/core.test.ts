import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { branchName } from "../../src/commands/ticket.js";
import { planPackageWaves } from "../../src/commands/package.js";
import { validateClaim } from "../../src/core/claim.js";
import { nextId } from "../../src/filesystem/entities.js";

describe("core deterministic rules", () => {
  test("generates stable branch names from ticket type and title", () => {
    expect(branchName("performance", "T-018", "Faster export: P95 ≤ 2s")).toBe("perf/T-018-faster-export-p95-2s");
  });

  test("plans dependency waves and rejects cycles", () => {
    expect(planPackageWaves(["T-001", "T-002", "T-003"], new Map([
      ["T-001", []], ["T-002", ["T-001"]], ["T-003", []],
    ]))).toEqual([["T-001", "T-003"], ["T-002"]]);
    expect(() => planPackageWaves(["T-001", "T-002"], new Map([
      ["T-001", ["T-002"]], ["T-002", ["T-001"]],
    ]))).toThrow("Dependency cycle detected");
  });

  test("does not reuse the highest canonical identifier", () => {
    const root = mkdtempSync(join(tmpdir(), "a-team-id-"));
    mkdirSync(join(root, ".a-team/backlog"), { recursive: true });
    mkdirSync(join(root, ".a-team/done"), { recursive: true });
    writeFileSync(join(root, ".a-team/backlog/T-002-two.md"), "");
    writeFileSync(join(root, ".a-team/done/T-009-nine.md"), "");
    expect(nextId(root, "ticket")).toBe("T-010");
  });

  test("validates the complete claim contract", () => {
    expect(validateClaim({ ticket: "T-014", agent: "codex", branch: "feat/T-014-export", worktree: ".worktrees/T-014", started_at: "2026-07-21T10:15:00+02:00" })).toEqual([]);
    expect(validateClaim({ ticket: "O-107", agent: "codex", branch: "feat/O-107-audit", worktree: ".worktrees/O-107", started_at: "2026-07-21T10:15:00+02:00" })).toEqual([]);
    expect(validateClaim({ ticket: "bad" })).toEqual([
      "ticket must match T-001 or an imported O-1 identifier", "agent is required", "branch is required", "worktree is required", "started_at must be an ISO timestamp",
    ]);
  });
});
