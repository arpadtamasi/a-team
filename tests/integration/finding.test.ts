import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");
const run = (cwd: string, args: string[]) => {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as Record<string, unknown>;
};

describe("finding disposition", () => {
  test("keeps a finding separate until a human resolves it into backlog work", () => {
    const root = mkdtempSync(join(tmpdir(), "kotta-finding-"));
    execFileSync("git", ["init", "-b", "main"], { cwd: root });
    writeFileSync(join(root, "README.md"), "fixture\n");
    run(root, ["init"]);
    const created = run(root, ["finding", "new", "--title", "Divergent permission checks", "--type", "inconsistency", "--evidence", "src/a.ts and src/b.ts differ"]) as { ok: boolean; data: { id: string; path: string } };
    expect(created.ok).toBe(true);
    const findingId = created.data.id;
    expect(findingId).toMatch(/^F-[0-9a-hjkmnp-tv-z]{26}$/);
    expect(basename(created.data.path)).toBe(`divergent-permission-checks-${findingId.slice(-8)}.md`);
    expect(run(root, ["finding", "validate", findingId])).toMatchObject({ ok: true });
    const resolved = run(root, ["finding", "resolve", findingId, "--disposition", "create-ticket", "--approve"]) as { ok: boolean; data: { ticketId: string } };
    expect(resolved.ok).toBe(true);
    const ticketId = resolved.data.ticketId;
    expect(ticketId).toMatch(/^T-[0-9a-hjkmnp-tv-z]{26}$/);
    expect(existsSync(join(root, ".kotta/findings/resolved", basename(created.data.path)))).toBe(true);
    const ticket = join(root, ".kotta/backlog", `divergent-permission-checks-${ticketId.slice(-8)}.md`);
    expect(readFileSync(ticket, "utf8")).toContain(`source_finding: ${findingId}`);
  });
});
