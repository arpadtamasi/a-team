import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");
const run = (cwd: string, args: string[]) => {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as Record<string, unknown>;
};

describe("finding disposition", () => {
  test("keeps a finding separate until a human resolves it into backlog work", () => {
    const root = mkdtempSync(join(tmpdir(), "a-team-finding-"));
    execFileSync("git", ["init", "-b", "main"], { cwd: root });
    writeFileSync(join(root, "README.md"), "fixture\n");
    run(root, ["init"]);
    expect(run(root, ["finding", "new", "--title", "Divergent permission checks", "--type", "inconsistency", "--evidence", "src/a.ts and src/b.ts differ"])).toMatchObject({ ok: true, data: { id: "F-001" } });
    expect(run(root, ["finding", "validate", "F-001"])).toMatchObject({ ok: true });
    expect(run(root, ["finding", "resolve", "F-001", "--disposition", "create-ticket", "--approve"])).toMatchObject({ ok: true, data: { ticketId: "T-001" } });
    expect(existsSync(join(root, ".a-team/findings/resolved/F-001-divergent-permission-checks.md"))).toBe(true);
    const ticket = join(root, ".a-team/backlog/T-001-divergent-permission-checks.md");
    expect(readFileSync(ticket, "utf8")).toContain("source_finding: F-001");
  });
});
