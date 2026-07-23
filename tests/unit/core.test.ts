import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { branchName } from "../../src/commands/ticket.js";
import { planPackageWaves } from "../../src/commands/package.js";
import { validateClaim } from "../../src/core/claim.js";
import { nextId } from "../../src/filesystem/entities.js";
import { createDecision } from "../../src/commands/decision.js";
import { decisionDraftFromSource, nextDecisionId, renderDecision, validateDecision } from "../../src/core/decision.js";

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

  test("allocates, validates, and renders durable decision records", () => {
    const root = mkdtempSync(join(tmpdir(), "a-team-decision-core-"));
    mkdirSync(join(root, ".a-team/decisions"), { recursive: true });
    writeFileSync(join(root, ".a-team/decisions/D-002-existing.md"), "");
    expect(nextDecisionId(root)).toBe("D-003");

    const draft = decisionDraftFromSource(
      "---\ntitle: Adopt blue-green cutover\n---\n## Decision\n\nUse blue-green.\n\n## Context\n\nAvoid downtime.\n\n## Consequences\n\nOperate two stacks during cutover.\n",
      "D-003",
      "2026-07-23",
    );
    expect(validateDecision(draft)).toEqual([]);
    expect(renderDecision(draft)).toContain("id: D-003");
    expect(decisionDraftFromSource(
      "---\ntitle: Dated decision\ndate: 2026-07-22\n---\n## Decision\n\nYes.\n\n## Context\n\nNeeded.\n\n## Consequences\n\nKnown.\n",
      "D-004",
      "2026-07-23",
    ).date).toBe("2026-07-22");
    expect(validateDecision({ ...draft, date: "2026-02-30", context: "" })).toEqual([
      expect.objectContaining({ code: "INVALID_DECISION_DATE" }),
      expect.objectContaining({ code: "MISSING_DECISION_SECTION", message: expect.stringContaining("Context") }),
    ]);
  });

  test("rejects a duplicate decision without changing the existing record", () => {
    const root = mkdtempSync(join(tmpdir(), "a-team-decision-duplicate-"));
    mkdirSync(join(root, ".a-team/decisions"), { recursive: true });
    const source = join(root, "decision.md");
    writeFileSync(source, "---\ntitle: Cut over\n---\n## Decision\n\nProceed.\n\n## Context\n\nReady.\n\n## Consequences\n\nMonitor.\n");
    createDecision({ from: source, id: "D-001", approved: true }, root);
    const canonical = join(root, ".a-team/decisions/D-001-cut-over.md");
    const before = readFileSync(canonical, "utf8");
    expect(() => createDecision({ from: source, id: "D-001", approved: true }, root)).toThrow("already exists");
    expect(readFileSync(canonical, "utf8")).toBe(before);
  });
});
