import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { DEFAULT_UI_PORT, UI_OPEN_COMMAND_ENV, resolveOpenCommand, uiCommand } from "../../src/commands/ui.js";

const cli = resolve("dist/cli/index.js");
const HOST = "127.0.0.1";
const servers: Server[] = [];
const children: ChildProcess[] = [];

/**
 * Stand-in for the desktop's URL handler. It records the argument it was handed,
 * so the tests prove the handover without any browser ever being involved.
 */
const OPENER_DOUBLE = `#!/usr/bin/env node
import { appendFileSync } from "node:fs";
appendFileSync(process.env.OPENER_RECORD, process.argv[2] + "\\n");
`;

const close = (server: Server) => new Promise<void>((done) => { server.listening ? server.close(() => done()) : done(); });

afterEach(async () => {
  vi.restoreAllMocks();
  for (const child of children.splice(0)) child.kill();
  for (const server of servers.splice(0)) await close(server);
});

function initializedRepository(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `kotta-ui-open-${label}-`));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("node", [cli, "init", "--json"], { cwd: root });
  return root;
}

/** Collects an opener double's calls; `fails` makes the handover itself fail. */
function recordingOpener(fails = false) {
  const urls: string[] = [];
  return {
    urls,
    open: async (url: string): Promise<void> => {
      urls.push(url);
      if (fails) throw new Error("no browser handler is registered");
    },
  };
}

/** Runs the UI with a doubled opener, keeping its stdout out of the test report. */
async function runUi(root: string, options: { port?: number; json?: boolean; open?: boolean }, opener: (url: string) => Promise<void>) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => { stdout.push(String(chunk)); return true; });
  vi.spyOn(process.stderr, "write").mockImplementation((chunk: unknown) => { stderr.push(String(chunk)); return true; });
  const server = await uiCommand({ workspace: root, host: HOST, ...options }, opener);
  servers.push(server);
  return { server, stdout: stdout.join(""), stderr: stderr.join("") };
}

/**
 * Makes the default port busy. A null blocker with `busy` still set means another
 * process already holds 4311 — the fallback path is exercised either way.
 */
const holdDefaultPort = () => new Promise<{ blocker: Server | null; busy: boolean }>((done) => {
  const server = createServer(() => {});
  server.once("error", (error: NodeJS.ErrnoException) => done({ blocker: null, busy: error.code === "EADDRINUSE" }));
  server.listen(DEFAULT_UI_PORT, HOST, () => { servers.push(server); done({ blocker: server, busy: true }); });
});

describe("kotta ui browser handover", () => {
  test("hands the actual served url to the opener once the server listens", async () => {
    const opener = recordingOpener();
    const { server, stdout } = await runUi(initializedRepository("served"), { port: 0 }, opener.open);
    const port = (server.address() as { port: number }).port;

    expect(opener.urls).toEqual([`http://${HOST}:${port}`]);
    expect(stdout).toContain(`Kotta UI: http://${HOST}:${port}`);
    expect(server.listening).toBe(true);
  });

  test("a port chosen by fallback is the one that gets opened", async () => {
    const { blocker, busy } = await holdDefaultPort();
    if (!busy) return; // This machine cannot bind 4311 at all, so there is no fallback to observe.
    const opener = recordingOpener();
    const { server } = await runUi(initializedRepository("fallback"), {}, opener.open);
    const port = (server.address() as { port: number }).port;

    expect(port).toBeGreaterThan(DEFAULT_UI_PORT);
    expect(opener.urls).toEqual([`http://${HOST}:${port}`]);
    if (blocker) expect(blocker.listening).toBe(true);
  });

  test("--no-open starts the server and opens nothing", async () => {
    const opener = recordingOpener();
    const { server, stdout } = await runUi(initializedRepository("no-open"), { port: 0, open: false }, opener.open);

    expect(opener.urls).toEqual([]);
    expect(server.listening).toBe(true);
    expect(stdout).toContain("Kotta UI: http://");
  });

  test("--json opens nothing, because that mode is for automation", async () => {
    const opener = recordingOpener();
    const { server, stdout } = await runUi(initializedRepository("json"), { port: 0, json: true }, opener.open);

    expect(opener.urls).toEqual([]);
    expect(server.listening).toBe(true);
    expect((JSON.parse(stdout) as { ok: boolean }).ok).toBe(true);
  });

  test("a failing opener warns and leaves the server and the exit status alone", async () => {
    const before = process.exitCode;
    const opener = recordingOpener(true);
    const { server, stdout, stderr } = await runUi(initializedRepository("failing"), { port: 0 }, opener.open);
    const port = (server.address() as { port: number }).port;

    expect(opener.urls).toEqual([`http://${HOST}:${port}`]);
    expect(stderr).toContain(`Warning: could not open http://${HOST}:${port} in a browser (no browser handler is registered).`);
    expect(stdout).toContain(`Kotta UI: http://${HOST}:${port}`);
    expect(server.listening).toBe(true);
    expect(process.exitCode).toBe(before);
    expect((await fetch(`http://${HOST}:${port}/api/agents`)).ok).toBe(true);
  });
});

describe("the opener the ui resolves", () => {
  test("each platform gets the command that hands a url to its desktop", () => {
    vi.stubEnv(UI_OPEN_COMMAND_ENV, "");
    expect(resolveOpenCommand("darwin")).toEqual({ command: "open", args: [] });
    expect(resolveOpenCommand("linux")).toEqual({ command: "xdg-open", args: [] });
    expect(resolveOpenCommand("win32")).toEqual({ command: "cmd", args: ["/c", "start", ""] });
    vi.unstubAllEnvs();
  });

  test("the environment override replaces the platform command on every platform", () => {
    vi.stubEnv(UI_OPEN_COMMAND_ENV, "/tmp/opener-double");
    for (const platform of ["darwin", "linux", "win32"] as NodeJS.Platform[]) {
      expect(resolveOpenCommand(platform)).toEqual({ command: "/tmp/opener-double", args: [] });
    }
    vi.unstubAllEnvs();
  });
});

describe("kotta ui browser handover through the CLI", () => {
  test("documents --no-open in help", () => {
    const help = execFileSync("node", [cli, "ui", "--help"], { encoding: "utf8" }).replace(/\s+/g, " ");
    expect(help).toContain("--no-open Print the URL without opening it in the default browser");
  });

  test("the started process hands the printed url to the substituted opener, and --no-open hands over nothing", async () => {
    const root = initializedRepository("cli");
    const double = join(root, "opener-double.mjs");
    const record = join(root, "opened.txt");
    writeFileSync(double, OPENER_DOUBLE);
    chmodSync(double, 0o755);
    const environment = { ...process.env, [UI_OPEN_COMMAND_ENV]: double, OPENER_RECORD: record };

    const opened = await startUi(root, ["--port", "0"], environment);
    const url = opened.line.replace("Kotta UI: ", "").trim();
    expect(url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    await waitFor(() => existsSync(record));
    expect(readFileSync(record, "utf8").trim().split("\n")).toEqual([url]);

    const suppressed = await startUi(root, ["--port", "0", "--no-open"], environment);
    expect(suppressed.line).toMatch(/^Kotta UI: http:\/\/127\.0\.0\.1:\d+$/);
    await new Promise((done) => { setTimeout(done, 500); });
    expect(readFileSync(record, "utf8").trim().split("\n")).toEqual([url]);
  });
});

/** Resolves with the first stdout line the UI prints, leaving the process alive. */
function startUi(cwd: string, args: string[], environment: NodeJS.ProcessEnv): Promise<{ line: string; child: ChildProcess }> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn("node", [cli, "ui", ...args], { cwd, stdio: ["ignore", "pipe", "pipe"], env: environment });
    children.push(child);
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => reject(new Error(`Timed out. stdout: ${stdout} stderr: ${stderr}`)), 10_000);
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
      const line = stdout.split("\n").find(Boolean);
      if (!line) return;
      clearTimeout(timeout);
      resolvePromise({ line, child });
    });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on("exit", (code) => { if (code && !stdout.trim()) { clearTimeout(timeout); reject(new Error(`UI exited with ${code}. stderr: ${stderr}`)); } });
  });
}

async function waitFor(condition: () => boolean, timeout = 5_000): Promise<void> {
  const deadline = Date.now() + timeout;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error("Condition was never met.");
    await new Promise((done) => { setTimeout(done, 50); });
  }
}
