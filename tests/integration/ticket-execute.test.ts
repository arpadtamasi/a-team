import { execFileSync, spawn, spawnSync, type SpawnSyncReturns } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");

/**
 * Deterministic stand-in for a real agent binary. It records exactly what the
 * command handed it — argv, cwd and the prompt on stdin — so the tests can prove
 * the fresh-context contract without ever spawning `claude` or `codex`.
 */
const DOUBLE = `#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

let stdin = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) stdin += chunk;
writeFileSync(process.env.DOUBLE_RECORD, JSON.stringify({ argv: process.argv.slice(2), cwd: process.cwd(), stdin }));

const mode = process.env.DOUBLE_MODE ?? "commit";
if (mode === "empty") process.exit(0);
if (mode === "fail") {
  process.stderr.write("double: refusing to implement\\n");
  process.exit(3);
}
if (mode === "hang") {
  writeFileSync(process.env.DOUBLE_MARKER, "running");
  setInterval(() => {}, 1000);
} else {
  writeFileSync("agent-output.txt", "implemented by the double\\n");
  execFileSync("git", ["add", "-A"], { cwd: process.cwd() });
  execFileSync("git", ["commit", "-m", "feat: double implementation"], { cwd: process.cwd() });
  process.stdout.write("double: implemented\\n");
}
`;

function git(repository: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd: repository, encoding: "utf8" }).trim();
}

function cliRun(repository: string, args: string[], environment: Record<string, string> = {}): SpawnSyncReturns<string> {
  return spawnSync("node", [cli, ...args], { cwd: repository, encoding: "utf8", env: { ...process.env, ...environment } });
}

function json(result: SpawnSyncReturns<string>): Record<string, unknown> {
  return JSON.parse(result.stdout) as Record<string, unknown>;
}

function expectOk(result: SpawnSyncReturns<string>): Record<string, unknown> {
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return json(result);
}

interface Fixture {
  repository: string;
  id: string;
  double: string;
  record: string;
  marker: string;
}

function fixture(label: string, options: { ready?: boolean } = {}): Fixture {
  const repository = mkdtempSync(join(tmpdir(), `kotta-execute-${label}-`));
  git(repository, "init", "-b", "main");
  git(repository, "config", "user.name", "Kotta Test");
  git(repository, "config", "user.email", "test@example.com");
  writeFileSync(join(repository, "README.md"), "fixture\n");
  expectOk(cliRun(repository, ["init", "--json"]));
  const id = (expectOk(cliRun(repository, ["ticket", "new", "--title", "Ship the exporter", "--type", "feature", "--json"])) as { data: { id: string } }).data.id;
  const definition = join(repository, "definition.md");
  writeFileSync(definition, `# ${id} — Ship the exporter

## Outcome

Exports run.

## Scope

One exporter.

## Non-goals

Nothing else.

## Acceptance

- Exporter produces a file.

## Verification

- Run it.

## Constraints

None.

## Open decisions

None.

## Execution notes

None.
`);
  expectOk(cliRun(repository, ["ticket", "define", id, "--from", definition, "--json"]));
  if (options.ready !== false) expectOk(cliRun(repository, ["ticket", "ready", id, "--approve", "--json"]));
  git(repository, "add", "-A");
  git(repository, "commit", "-m", "fixture");

  const tools = mkdtempSync(join(tmpdir(), `kotta-agent-${label}-`));
  const double = join(tools, "agent-double.mjs");
  writeFileSync(double, DOUBLE);
  chmodSync(double, 0o755);
  return { repository, id, double, record: join(tools, "record.json"), marker: join(tools, "marker") };
}

function agentEnvironment(fixtureUnderTest: Fixture, mode: string): Record<string, string> {
  return { KOTTA_AGENT_COMMAND: fixtureUnderTest.double, DOUBLE_RECORD: fixtureUnderTest.record, DOUBLE_MODE: mode, DOUBLE_MARKER: fixtureUnderTest.marker };
}

function claimPath(repository: string, id: string): string {
  return join(repository, ".worktrees", id, ".kotta/claims", `${id}.yaml`);
}

describe("ticket execute (T-035 / D-009)", () => {
  test("runs a ready ticket in a fresh agent context and returns implemented work", () => {
    const context = fixture("happy");
    const { repository, id } = context;
    const result = cliRun(repository, ["ticket", "execute", id, "--agent", "claude", "--json"], agentEnvironment(context, "commit"));
    const data = (expectOk(result) as { ok: boolean; data: Record<string, unknown> }).data;
    const worktree = join(repository, ".worktrees", id);

    expect(json(result)).toMatchObject({ ok: true, command: "ticket execute" });
    expect(data).toMatchObject({ id, state: "implemented", ticketState: "active", agent: "claude", agentCommand: context.double, branch: `feat/${id}-ship-the-exporter`, context: "fresh", inheritContext: null, exitCode: 0, uncommittedChanges: false });
    expect(String(data.worktree)).toContain(join(".worktrees", id));
    expect(Number(data.briefTokens)).toBeGreaterThan(0);
    expect(Number(data.briefSections)).toBeGreaterThan(1);

    // Acceptance 1: claim, branch, worktree and committed work exist.
    expect(existsSync(claimPath(repository, id))).toBe(true);
    expect(readFileSync(join(worktree, "agent-output.txt"), "utf8")).toContain("implemented by the double");
    expect(git(worktree, "log", "--oneline", "-1")).toContain("feat: double implementation");
    expect(git(worktree, "status", "--porcelain")).toBe("");
    expect(expectOk(cliRun(worktree, ["status", "--json"]))).toMatchObject({ data: { activeTickets: [id] } });

    // Acceptance 2: the agent's input is the brief and nothing else.
    const recorded = JSON.parse(readFileSync(context.record, "utf8")) as { argv: string[]; cwd: string; stdin: string };
    const brief = (expectOk(cliRun(worktree, ["ticket", "brief", id, "--json"])) as { data: { brief: string; tokens: number } }).data;
    expect(recorded.stdin).toBe(brief.brief);
    expect(recorded.argv).toEqual(["-p"]);
    expect(recorded.cwd.endsWith(join(".worktrees", id))).toBe(true);
    expect(recorded.stdin).not.toContain("Context inheritance");
    expect(Number(data.briefTokens)).toBe(brief.tokens);
  });

  test("human output names the brief size, the agent, the branch and the worktree", () => {
    const context = fixture("output");
    const { repository, id } = context;
    const result = cliRun(repository, ["ticket", "execute", id, "--agent", "codex"], agentEnvironment(context, "commit"));
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(`kotta ticket execute ${id}: implemented`);
    expect(result.stdout).toMatch(/brief:\s+~\d+ tokens/);
    expect(result.stdout).toContain(`agent:    codex (command: ${context.double})`);
    expect(result.stdout).toContain(`branch:   feat/${id}-ship-the-exporter`);
    expect(result.stdout).toContain(join(".worktrees", id));
    expect(result.stdout).toContain("fresh (D-009 default)");
    const recorded = JSON.parse(readFileSync(context.record, "utf8")) as { argv: string[] };
    expect(recorded.argv).toEqual(["exec", "-"]);
  });

  test("a non-zero agent exit is agent-failed and preserves the execution context", () => {
    const context = fixture("failing");
    const { repository, id } = context;
    const result = cliRun(repository, ["ticket", "execute", id, "--agent", "claude", "--json"], agentEnvironment(context, "fail"));
    expect(result.status).not.toBe(0);
    expect(json(result)).toMatchObject({ ok: false, data: { state: "agent-failed", exitCode: 3, ticketState: "active" }, errors: [{ code: "AGENT_FAILED" }] });
    expect(existsSync(claimPath(repository, id))).toBe(true);
    expect(existsSync(join(repository, ".worktrees", id))).toBe(true);
    expect(existsSync(join(repository, ".worktrees", id, ".kotta/review"))).toBe(false);
  });

  test("an empty agent result is agent-failed", () => {
    const context = fixture("empty");
    const { repository, id } = context;
    const result = cliRun(repository, ["ticket", "execute", id, "--agent", "claude", "--json"], agentEnvironment(context, "empty"));
    expect(result.status).not.toBe(0);
    expect(json(result)).toMatchObject({ ok: false, data: { state: "agent-failed", exitCode: 0 } });
    expect(String((json(result) as { data: { reason: string } }).data.reason)).toContain("no output");
    expect(existsSync(claimPath(repository, id))).toBe(true);
  });

  test("retry after a failure reuses the existing execution context instead of creating a second one", () => {
    const context = fixture("retry");
    const { repository, id } = context;
    expect(cliRun(repository, ["ticket", "execute", id, "--agent", "claude", "--json"], agentEnvironment(context, "fail")).status).not.toBe(0);

    const duplicate = cliRun(repository, ["ticket", "execute", id, "--agent", "claude", "--json"], agentEnvironment(context, "commit"));
    expect(duplicate.status).not.toBe(0);
    expect(duplicate.stdout).toContain("refuses to start a second agent");
    expect(existsSync(join(context.record))).toBe(true);
    expect((JSON.parse(readFileSync(context.record, "utf8")) as { stdin: string }).stdin.length).toBeGreaterThan(0);

    const resumed = cliRun(repository, ["ticket", "execute", id, "--resume", "--json"], agentEnvironment(context, "commit"));
    const data = (expectOk(resumed) as { data: Record<string, unknown> }).data;
    expect(data).toMatchObject({ state: "implemented", resumed: true, agent: "claude" });
    expect(git(repository, "worktree", "list").split("\n").filter((line) => line.includes(id)).length).toBe(1);
  });

  test("a second execute on a claimed ticket refuses and starts no second agent", () => {
    const context = fixture("duplicate");
    const { repository, id } = context;
    expectOk(cliRun(repository, ["ticket", "execute", id, "--agent", "claude", "--json"], agentEnvironment(context, "commit")));
    const firstRecord = readFileSync(context.record, "utf8");

    const second = cliRun(repository, ["ticket", "execute", id, "--agent", "claude", "--json"], agentEnvironment(context, "commit"));
    expect(second.status).not.toBe(0);
    expect(json(second)).toMatchObject({ ok: false, errors: [{ code: "COMMAND_FAILED" }] });
    expect(second.stdout).toContain("already has an execution context");
    expect(readFileSync(context.record, "utf8")).toBe(firstRecord);
  });

  test("refuses a non-ready ticket, a dirty repository and a missing agent command without mutating anything", () => {
    const backlog = fixture("backlog", { ready: false });
    const notReady = cliRun(backlog.repository, ["ticket", "execute", backlog.id, "--agent", "claude", "--json"], agentEnvironment(backlog, "commit"));
    expect(notReady.status).not.toBe(0);
    expect(notReady.stdout).toContain("must be ready before execute");
    expect(existsSync(join(backlog.repository, ".worktrees", backlog.id))).toBe(false);
    expect(existsSync(backlog.record)).toBe(false);

    const dirty = fixture("dirty");
    writeFileSync(join(dirty.repository, "scratch.txt"), "uncommitted\n");
    const dirtyResult = cliRun(dirty.repository, ["ticket", "execute", dirty.id, "--agent", "claude", "--json"], agentEnvironment(dirty, "commit"));
    expect(dirtyResult.status).not.toBe(0);
    expect(dirtyResult.stdout).toContain("Repository is dirty");
    expect(existsSync(join(dirty.repository, ".worktrees", dirty.id))).toBe(false);
    expect(existsSync(dirty.record)).toBe(false);

    const missing = fixture("missing-agent");
    const missingResult = cliRun(missing.repository, ["ticket", "execute", missing.id, "--agent", "claude", "--json"], { ...agentEnvironment(missing, "commit"), KOTTA_AGENT_COMMAND: join(missing.repository, "no-such-agent") });
    expect(missingResult.status).not.toBe(0);
    expect(missingResult.stdout).toContain("Agent command not found");
    expect(missingResult.stdout).toContain("No execution context was created");
    expect(existsSync(join(missing.repository, ".worktrees", missing.id))).toBe(false);
    expect(git(missing.repository, "branch", "--list")).toBe("* main");
    expect(git(missing.repository, "status", "--porcelain")).toBe("");

    const unknownAgent = cliRun(missing.repository, ["ticket", "execute", missing.id, "--agent", "no-such-agent-t035", "--json"], { DOUBLE_RECORD: missing.record });
    expect(unknownAgent.status).not.toBe(0);
    expect(unknownAgent.stdout).toContain("Agent command not found");
    expect(existsSync(join(missing.repository, ".worktrees", missing.id))).toBe(false);
  });

  test("--inherit-context demands a reason and logs it when granted", () => {
    const context = fixture("inherit");
    const { repository, id } = context;
    const withoutReason = cliRun(repository, ["ticket", "execute", id, "--agent", "claude", "--inherit-context", "", "--json"], agentEnvironment(context, "commit"));
    expect(withoutReason.status).not.toBe(0);
    expect(withoutReason.stdout).toContain("--inherit-context requires a reason");
    expect(existsSync(join(repository, ".worktrees", id))).toBe(false);

    const missingValue = cliRun(repository, ["ticket", "execute", id, "--agent", "claude", "--inherit-context"], agentEnvironment(context, "commit"));
    expect(missingValue.status).not.toBe(0);
    expect(missingValue.stderr).toContain("--inherit-context");

    const reason = "F-032 hotfix shares the coordinator's incident context";
    const granted = cliRun(repository, ["ticket", "execute", id, "--agent", "claude", "--inherit-context", reason], agentEnvironment(context, "commit"));
    expect(granted.status).toBe(0);
    expect(granted.stdout).toContain(`INHERITED — ${reason}`);
    const recorded = JSON.parse(readFileSync(context.record, "utf8")) as { stdin: string };
    expect(recorded.stdin).toContain("## Context inheritance (explicit exception to D-009)");
    expect(recorded.stdin).toContain(`Reason: ${reason}`);
  });

  test("ticket start names execute as the next step", () => {
    const context = fixture("start");
    const { repository, id } = context;
    const human = cliRun(repository, ["ticket", "start", id, "--agent", "claude"]);
    expect(human.status).toBe(0);
    expect(human.stdout).toContain(`kotta ticket execute ${id} --resume`);
    expect(human.stdout).toContain("fresh agent context");
    const state = expectOk(cliRun(repository, ["claim", "list", "--json"])) as { data: { claims: { ticket: string }[] } };
    expect(state.data.claims.map((claim) => claim.ticket)).toEqual([id]);

    const resumed = expectOk(cliRun(repository, ["ticket", "execute", id, "--resume", "--json"], agentEnvironment(context, "commit"))) as { data: Record<string, unknown> };
    expect(resumed.data).toMatchObject({ state: "implemented", resumed: true, agent: "claude" });
  });

  test("an interrupt leaves the claim and worktree in place and names the manual decision", async () => {
    const context = fixture("cancel");
    const { repository, id } = context;
    const child = spawn("node", [cli, "ticket", "execute", id, "--agent", "claude", "--json"], { cwd: repository, env: { ...process.env, ...agentEnvironment(context, "hang") } });
    let stdout = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => { stdout += chunk; });
    child.stderr.resume();
    const exit = new Promise<number | null>((settle) => child.on("close", (code) => settle(code)));

    const deadline = Date.now() + 10_000;
    while (!existsSync(context.marker) && Date.now() < deadline) await new Promise((wake) => setTimeout(wake, 50));
    expect(existsSync(context.marker)).toBe(true);
    child.kill("SIGINT");
    expect(await exit).not.toBe(0);

    const result = JSON.parse(stdout) as { ok: boolean; data: { state: string }; errors: { code: string; message: string }[] };
    expect(result).toMatchObject({ ok: false, data: { state: "cancelled" }, errors: [{ code: "EXECUTION_CANCELLED" }] });
    expect(result.errors[0].message).toContain(`kotta claim release ${id} --force`);
    expect(existsSync(claimPath(repository, id))).toBe(true);
    expect(existsSync(join(repository, ".worktrees", id))).toBe(true);
  });
});
