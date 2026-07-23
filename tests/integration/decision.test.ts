import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");

function run(cwd: string, args: string[], env?: NodeJS.ProcessEnv) {
  return spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8", env: { ...process.env, ...env } });
}

function initialize(): string {
  const root = mkdtempSync(join(tmpdir(), "a-team-decision-"));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("node", [cli, "init", "--json"], { cwd: root });
  return root;
}

const validSource = "---\ntitle: Adopt blue-green cutover\n---\n## Decision\n\nUse a blue-green cutover.\n\n## Context\n\nThe release cannot tolerate downtime.\n\n## Consequences\n\nOperate two stacks until verification completes.\n";

describe("durable decision CLI", () => {
  test("exposes create and completes init → create → validate → inspect", () => {
    const root = initialize();
    const help = execFileSync("node", [cli, "--help"], { cwd: root, encoding: "utf8" });
    expect(help).toContain("decision");
    const source = join(root, "cutover.md");
    writeFileSync(source, validSource);

    const created = run(root, ["decision", "create", "--from", source, "--approve"]);
    expect(created.status).toBe(0);
    expect(JSON.parse(created.stdout)).toMatchObject({
      ok: true,
      command: "decision create",
      data: { id: "D-001", path: expect.stringContaining(".a-team/decisions/D-001-adopt-blue-green-cutover.md") },
    });
    const canonical = join(root, ".a-team/decisions/D-001-adopt-blue-green-cutover.md");
    expect(readFileSync(canonical, "utf8")).toContain("## Consequences");
    const humanSource = join(root, "second.md");
    writeFileSync(humanSource, validSource.replace("Adopt blue-green cutover", "Keep rollback window"));
    const human = execFileSync("node", [cli, "decision", "create", "--from", humanSource, "--approve"], { cwd: root, encoding: "utf8" });
    expect(human).toContain("Recorded decision D-002 at");
    expect(human).toContain(".a-team/decisions/D-002-keep-rollback-window.md");

    const validation = run(root, ["validate"]);
    expect(validation.status).toBe(0);
    expect(JSON.parse(validation.stdout)).toMatchObject({ ok: true, data: { decisions: 2 } });
    expect(readdirSync(join(root, ".a-team/decisions")).sort()).toEqual([
      "D-001-adopt-blue-green-cutover.md",
      "D-002-keep-rollback-window.md",
    ]);
  });

  test("rejects missing approval, invalid and malformed input without canonical state", () => {
    const root = initialize();
    const missing = join(root, "missing.md");
    const malformed = join(root, "malformed.md");
    writeFileSync(missing, "---\ntitle: Incomplete\n---\n## Decision\n\nProceed.\n");
    writeFileSync(malformed, "---\ntitle: [\n---\n## Decision\n\nProceed.\n");
    for (const args of [
      ["decision", "create", "--from", missing],
      ["decision", "create", "--from", missing, "--approve"],
      ["decision", "create", "--from", malformed, "--approve"],
      ["decision", "create", "--from", missing, "--id", "../escape", "--approve"],
    ]) {
      const result = run(root, args);
      expect(result.status).toBe(1);
      expect(JSON.parse(result.stdout)).toMatchObject({ ok: false, errors: [expect.objectContaining({ code: "COMMAND_FAILED" })] });
    }
    expect(readdirSync(join(root, ".a-team/decisions"))).toEqual([]);
  });

  test("cleans the candidate after an injected pre-publication failure and safely retries", () => {
    const root = initialize();
    const source = join(root, "cutover.md");
    writeFileSync(source, validSource);
    const failed = run(root, ["decision", "create", "--from", source, "--id", "D-007", "--approve"], {
      A_TEAM_TEST_FAIL_DECISION_BEFORE_RENAME: "1",
    });
    expect(failed.status).toBe(1);
    expect(failed.stdout).toContain("Injected decision write failure");
    expect(readdirSync(join(root, ".a-team/decisions"))).toEqual([]);

    expect(run(root, ["decision", "create", "--from", source, "--id", "D-007", "--approve"]).status).toBe(0);
    expect(existsSync(join(root, ".a-team/decisions/D-007-adopt-blue-green-cutover.md"))).toBe(true);
  });

  test("workspace validation reports malformed canonical decision records", () => {
    const root = initialize();
    writeFileSync(join(root, ".a-team/decisions/D-001-broken.md"), "---\nid: D-001\ntitle: [\n---\n");
    const result = run(root, ["validate"]);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([expect.objectContaining({ code: "MALFORMED_DECISION" })]),
    });
  });

  test("workspace validation reports duplicate decision identities", () => {
    const root = initialize();
    const first = validSource.replace("title: Adopt blue-green cutover", "id: D-001\ntitle: First");
    const second = first.replace("title: First", "title: Second");
    writeFileSync(join(root, ".a-team/decisions/D-001-first.md"), first);
    writeFileSync(join(root, ".a-team/decisions/D-001-second.md"), second);
    const result = run(root, ["validate"]);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      errors: expect.arrayContaining([expect.objectContaining({ code: "DUPLICATE_DECISION_ID" })]),
    });
  });
});
