import { execFileSync, spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");

function run(cwd: string, args: string[], env?: NodeJS.ProcessEnv) {
  return spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8", env: { ...process.env, ...env } });
}

function runAsync(cwd: string, args: string[], env?: NodeJS.ProcessEnv): Promise<{ status: number | null; stdout: string; stderr: string }> {
  const child = spawn("node", [cli, ...args, "--json"], { cwd, env: { ...process.env, ...env } });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8").on("data", (chunk: string) => { stdout += chunk; });
  child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk; });
  return new Promise((resolvePromise) => child.on("close", (status) => resolvePromise({ status, stdout, stderr })));
}

async function waitForCandidate(root: string): Promise<void> {
  const directory = join(root, ".a-team/decisions");
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (readdirSync(directory).some((name) => name.startsWith(".D-001-") && name.endsWith(".tmp"))) return;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 10));
  }
  throw new Error("Timed out waiting for the first decision writer to reach publication.");
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
    const createdData = (JSON.parse(created.stdout) as { ok: boolean; command: string; data: { id: string; path: string } });
    expect(createdData).toMatchObject({ ok: true, command: "decision create" });
    expect(createdData.data.id).toMatch(/^D-[0-9a-hjkmnp-tv-z]{26}$/);
    expect(createdData.data.path).toContain(`.a-team/decisions/${createdData.data.id}.md`);
    expect(readFileSync(createdData.data.path, "utf8")).toContain("## Consequences");
    const humanSource = join(root, "second.md");
    writeFileSync(humanSource, validSource.replace("Adopt blue-green cutover", "Keep rollback window"));
    const human = execFileSync("node", [cli, "decision", "create", "--from", humanSource, "--approve"], { cwd: root, encoding: "utf8" });
    expect(human).toMatch(/Recorded decision D-[0-9a-hjkmnp-tv-z]{26} at/);

    const validation = run(root, ["validate"]);
    expect(validation.status).toBe(0);
    expect(JSON.parse(validation.stdout)).toMatchObject({ ok: true, data: { decisions: 2 } });
    const recorded = readdirSync(join(root, ".a-team/decisions")).sort();
    expect(recorded).toHaveLength(2);
    for (const name of recorded) expect(name).toMatch(/^D-[0-9a-hjkmnp-tv-z]{26}\.md$/);
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
      A_TEAM_TEST_FAIL_DECISION_BEFORE_PUBLISH: "1",
    });
    expect(failed.status).toBe(1);
    expect(failed.stdout).toContain("Injected decision write failure");
    expect(readdirSync(join(root, ".a-team/decisions"))).toEqual([]);

    expect(run(root, ["decision", "create", "--from", source, "--id", "D-007", "--approve"]).status).toBe(0);
    expect(existsSync(join(root, ".a-team/decisions/D-007.md"))).toBe(true);
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

  test("atomically reserves an id across concurrent writers with different titles", async () => {
    const root = initialize();
    const firstSource = join(root, "first.md");
    const secondSource = join(root, "second.md");
    writeFileSync(firstSource, validSource.replace("Adopt blue-green cutover", "First title"));
    writeFileSync(secondSource, validSource.replace("Adopt blue-green cutover", "Second title"));

    const first = runAsync(root, ["decision", "create", "--from", firstSource, "--id", "D-001", "--approve"], {
      A_TEAM_TEST_DECISION_PUBLISH_DELAY_MS: "3000",
    });
    await waitForCandidate(root);
    const second = await runAsync(root, ["decision", "create", "--from", secondSource, "--id", "D-001", "--approve"]);
    const delayed = await first;

    expect(second.status).toBe(0);
    expect(delayed.status).toBe(1);
    expect(delayed.stdout).toContain("Decision D-001 already exists");
    expect(readdirSync(join(root, ".a-team/decisions"))).toEqual(["D-001.md"]);
    const canonical = readFileSync(join(root, ".a-team/decisions/D-001.md"), "utf8");
    expect(canonical).toContain("title: Second title");
    expect(canonical).not.toContain("title: First title");
  });
});
