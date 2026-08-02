import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { createInterface } from "node:readline";
import { basename, dirname, extname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { parse } from "yaml";
import { sections } from "../core/markdown.js";
import { findTicket, idFromFilename } from "../filesystem/entities.js";
import { FINDING_ID, PACKAGE_ID, TICKET_ID } from "../core/identity.js";
import { newFinding, resolveFinding } from "./finding.js";
import { newPackage, updatePackageTickets } from "./package.js";
import { readyTicket } from "./ticket.js";
import { ENV_PREFIX, readEnv } from "../core/env.js";
import { WORKSPACE_DIRECTORIES, hasWorkspace, workspaceDirectoryName } from "../filesystem/workspace.js";

const TICKET_STATES = ["backlog", "ready", "active", "review", "done"];
const PACKAGE_STATES = ["backlog", "ready", "active", "done"];

function git(root: string, args: string[]): { ok: boolean; out: string } {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  return { ok: result.status === 0, out: result.stdout ?? "" };
}
function listMdFromRef(root: string, ref: string, directory: string, subpath: string): string[] {
  const result = git(root, ["ls-tree", "-r", "--name-only", ref, `${directory}/${subpath}`]);
  return result.ok ? result.out.split("\n").map((line) => line.trim()).filter((line) => line.endsWith(".md")) : [];
}
function readMdFromRef(root: string, ref: string, repoPath: string): string | null {
  const result = git(root, ["show", `${ref}:${repoPath}`]);
  return result.ok ? result.out : null;
}
function uncommittedMdAdds(root: string, directory: string): string[] {
  const result = git(root, ["status", "--porcelain", "--", directory]);
  if (!result.ok) return [];
  return result.out.split("\n").filter(Boolean)
    .filter((line) => { const flag = line.slice(0, 2); return flag === "??" || flag.includes("A"); })
    .map((line) => line.slice(3).trim()).filter((path) => path.endsWith(".md"));
}

// One rev-parse resolves everything the base-ref decision needs: the base commit hash (cache key),
// the repo toplevel and the current branch. A failed call (no git repo, missing base) means "no base ref".
function baseRefInfo(root: string, base: string): { commit: string; toplevel: string; branch: string } | null {
  const result = git(root, ["rev-parse", `${base}^{commit}`, "--show-toplevel", "--abbrev-ref", "HEAD"]);
  if (!result.ok) return null;
  const [commit, toplevel, branch] = result.out.split("\n").map((line) => line.trim());
  return commit && toplevel && branch ? { commit, toplevel, branch } : null;
}

// Minimal ustar reader for `git archive` output: regular files only, pax path records honored.
function parseTar(archive: Buffer): Map<string, string> {
  const files = new Map<string, string>();
  const field = (block: Buffer, start: number, length: number): string => {
    const raw = block.subarray(start, start + length);
    const nul = raw.indexOf(0);
    return (nul === -1 ? raw : raw.subarray(0, nul)).toString("utf8");
  };
  let offset = 0;
  let paxPath: string | null = null;
  while (offset + 512 <= archive.length) {
    const block = archive.subarray(offset, offset + 512);
    if (block.every((byte) => byte === 0)) break;
    const size = Number.parseInt(field(block, 124, 12).trim() || "0", 8);
    const typeflag = String.fromCharCode(block[156] ?? 0);
    const content = archive.subarray(offset + 512, offset + 512 + size);
    offset += 512 + Math.ceil(size / 512) * 512;
    if (typeflag === "x" || typeflag === "X") {
      const record = /(?:^|\n)\d+ path=([^\n]*)\n/.exec(content.toString("utf8"));
      if (record?.[1]) paxPath = record[1];
      continue;
    }
    if (typeflag !== "0" && typeflag !== "\0") continue; // pax global headers, directories, links
    const prefix = field(block, 345, 155);
    const name = field(block, 0, 100);
    files.set(paxPath ?? (prefix ? `${prefix}/${name}` : name), content.toString("utf8"));
    paxPath = null;
  }
  return files;
}

// In-process snapshot of the workspace directory at the base commit, read with a single `git archive`
// subprocess and cached on the commit hash: identical hash between reloads means no batch read. (T-029)
let refSnapshotCache: { key: string; files: Map<string, string> } | null = null;
function refSnapshot(root: string, commit: string, directory: string): Map<string, string> | null {
  const key = `${resolve(root)}\0${commit}\0${directory}`;
  if (refSnapshotCache?.key === key) return refSnapshotCache.files;
  const result = spawnSync("git", ["archive", "--format=tar", commit, "--", directory], { cwd: root, maxBuffer: 256 * 1024 * 1024 });
  if (result.status !== 0 || !Buffer.isBuffer(result.stdout)) {
    const detail = (result.stderr ?? "").toString().trim() || "unknown error";
    process.stderr.write(`kotta ui: batch read of ${directory} at ${commit} failed (${detail}); falling back to per-file git reads.\n`);
    return null;
  }
  refSnapshotCache = { key, files: parseTar(result.stdout) };
  return refSnapshotCache.files;
}

function sectionObject(content: string): Record<string, string> {
  return Object.fromEntries([...sections(content)].map(([key, value]) => [key, value.trim()]));
}

/**
 * Where the board reads from: the workspace directory, the repository root above it, and the
 * repo-relative directory name Git plumbing must use. `--workspace` may name either the repository
 * root or the workspace directory itself, under either name (`.kotta` or `.a-team`, T-020).
 */
export function resolveWorkspaceLocation(workspaceOption: string): { workspace: string; projectRoot: string; directory: string } {
  const candidate = resolve(workspaceOption);
  const named = (WORKSPACE_DIRECTORIES as readonly string[]).includes(basename(candidate));
  const projectRoot = named ? dirname(candidate) : candidate;
  if (named || hasWorkspace(candidate)) {
    // A symlinked bridge between the two names points at one real directory; resolving to the real
    // name keeps `git archive`/`ls-tree` — which see a symlink as a link, not as a tree — working.
    const directory = workspaceDirectoryName(projectRoot);
    return { workspace: join(projectRoot, directory), projectRoot, directory };
  }
  return { workspace: candidate, projectRoot: candidate, directory: basename(candidate) };
}

export function readWorkspace(workspaceOption: string) {
  const { workspace, projectRoot, directory: workspaceDirectory } = resolveWorkspaceLocation(workspaceOption);
  if (!existsSync(join(workspace, "config.yaml"))) throw new Error(`No Kotta workspace found at ${workspace}.`);
  const config = parse(readFileSync(join(workspace, "config.yaml"), "utf8")) as { project?: { name?: string }; git?: { base_branch?: string } };
  const base = config.git?.base_branch ?? "main";
  // Read from the base ref only when this workspace IS a git repo root with that ref; otherwise (non-git
  // fixtures, example dirs, a nested/uncommitted workspace) fall back to reading the working tree directly.
  const baseInfo = baseRefInfo(projectRoot, base);
  const useBase = baseInfo !== null && resolve(baseInfo.toplevel) === resolve(projectRoot);
  const onBase = useBase && baseInfo.branch === base;
  // Batched, cached ref-side content (T-029): one archive subprocess per base commit, memory-cached on
  // its hash. null (batch failure) falls back to the legacy per-file ls-tree/show path, loudly.
  const refFiles = useBase ? refSnapshot(projectRoot, baseInfo.commit, workspaceDirectory) : null;
  // Working-tree state is never cached: one status call per reload, filtered per subpath below.
  const uncommittedAdds = onBase ? uncommittedMdAdds(projectRoot, workspaceDirectory) : [];
  const migrationPath = join(workspace, "migration.json");
  const migration = existsSync(migrationPath) ? JSON.parse(readFileSync(migrationPath, "utf8")) as { project?: string; tickets?: Array<{ id: string; [key: string]: unknown }> } : null;
  const migrationById = new Map((migration?.tickets ?? []).map((ticket) => [ticket.id, ticket]));

  // Derive the baseline entity set from the configured base ref (git plumbing, no checkout), so it does
  // not change when another process checks out a different branch in the primary working tree. When the
  // primary dir IS on the base branch, union its uncommitted workspace additions so freshly-created intake
  // shows immediately. Active worktrees are overlaid per ticket below. (T-016 / D-001)
  const readMd = (repoPath: string, fromRef: boolean): string =>
    (fromRef ? (refFiles?.get(repoPath) ?? readMdFromRef(projectRoot, base, repoPath)) : readFileSync(join(projectRoot, repoPath), "utf8")) ?? "";
  const listRefMd = (subpath: string): string[] => refFiles
    ? [...refFiles.keys()].filter((path) => path.startsWith(`${workspaceDirectory}/${subpath}/`) && path.endsWith(".md"))
    : listMdFromRef(projectRoot, base, workspaceDirectory, subpath);
  const gather = (states: readonly string[], sub: (state: string) => string) => {
    const entries: Array<{ state: string; repoPath: string; fromRef: boolean }> = [];
    const seen = new Set<string>();
    for (const state of states) {
      const subpath = sub(state);
      if (useBase) {
        for (const path of listRefMd(subpath)) if (!seen.has(path)) { seen.add(path); entries.push({ state, repoPath: path, fromRef: true }); }
        for (const path of uncommittedAdds.filter((candidate) => candidate.startsWith(`${workspaceDirectory}/${subpath}/`))) if (!seen.has(path)) { seen.add(path); entries.push({ state, repoPath: path, fromRef: false }); }
      } else {
        const dir = join(workspace, subpath);
        if (existsSync(dir)) for (const name of readdirSync(dir).filter((entry) => entry.endsWith(".md"))) {
          const path = `${workspaceDirectory}/${subpath}/${name}`;
          if (!seen.has(path)) { seen.add(path); entries.push({ state, repoPath: path, fromRef: false }); }
        }
      }
    }
    return entries.sort((left, right) => basename(left.repoPath).localeCompare(basename(right.repoPath)));
  };
  const parseEntity = (entry: { state: string; repoPath: string; fromRef: boolean }): Record<string, unknown> => {
    const parsed = matter(readMd(entry.repoPath, entry.fromRef));
    return { ...parsed.data, status: entry.state, filename: basename(entry.repoPath), sections: sectionObject(parsed.content) };
  };

  const diagnostics: Array<{ entity: "ticket"; id: string; worktree: string; message: string }> = [];

  // Tickets: base-ref baseline, overlaid per id by any live worktree (in-flight truth from .worktrees/<id>).
  // Identity comes from the frontmatter: a minted entity's filename carries only its short id suffix.
  const ticketBase = new Map<string, Record<string, unknown>>();
  for (const entry of gather(TICKET_STATES, (state) => state)) {
    const parsed = parseEntity(entry);
    const id = String(parsed.id ?? idFromFilename(basename(entry.repoPath)) ?? "");
    if (id && !ticketBase.has(id)) ticketBase.set(id, parsed);
  }
  const tickets = [...ticketBase].map(([id, baseline]) => {
    const worktree = join(projectRoot, ".worktrees", id);
    if (existsSync(worktree)) {
      try {
        const location = findTicket(worktree, id);
        const parsed = matter(readFileSync(location.path, "utf8"));
        if (String(parsed.data.id) !== id) throw new Error(`Ticket metadata id '${String(parsed.data.id)}' does not match ${id}.`);
        return { ...parsed.data, status: location.state, filename: location.filename, sections: sectionObject(parsed.content), migration: migrationById.get(id) ?? null, worktree: worktree };
      } catch (error) {
        diagnostics.push({ entity: "ticket", id, worktree: worktree, message: error instanceof Error ? error.message : String(error) });
      }
    }
    return { ...baseline, migration: migrationById.get(id) ?? null };
  });
  const packages = gather(PACKAGE_STATES, (state) => `packages/${state}`).map(parseEntity);
  const findings = gather(["new", "resolved"], (state) => `findings/${state}`).map(parseEntity);
  // Decisions are cross-cutting and stateless — one directory, no state dirs — so they carry a date
  // instead of a status. They come out of the same cached snapshot: no extra subprocess. (T-029)
  const decisions = gather(["decisions"], () => "decisions").map((entry) => {
    const parsed = matter(readMd(entry.repoPath, entry.fromRef));
    const date = parsed.data.date;
    return {
      id: String(parsed.data.id ?? basename(entry.repoPath).replace(/\.md$/, "")),
      title: String(parsed.data.title ?? ""),
      date: date instanceof Date ? date.toISOString().slice(0, 10) : date === undefined ? null : String(date),
      filename: basename(entry.repoPath),
      sections: sectionObject(parsed.content),
    };
  });
  return { workspace, project: migration?.project ?? config.project?.name ?? "Kotta workspace", migration, tickets, packages, findings, decisions, diagnostics, generatedAt: new Date().toISOString() };
}

function json(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(value));
}

type JsonRpcMessage = { id?: number; method?: string; result?: unknown; error?: { message?: string }; params?: Record<string, unknown> };

class CodexAppServer {
  private readonly process: ChildProcessWithoutNullStreams;
  private readonly pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
  private readonly listeners = new Map<string, Set<(message: JsonRpcMessage) => void>>();
  private readonly threadTickets = new Map<string, string>();
  private nextId = 1;
  readonly ready: Promise<void>;

  constructor(private readonly cwd: string) {
    this.process = spawn("codex", ["app-server"], { cwd, stdio: ["pipe", "pipe", "pipe"] });
    createInterface({ input: this.process.stdout }).on("line", (line) => this.receive(line));
    this.process.stderr.on("data", (chunk) => {
      const message = String(chunk).trim();
      if (message) process.stderr.write(`[codex app-server] ${message}\n`);
    });
    this.process.on("error", (error) => this.failAll(error));
    this.process.on("exit", (code) => this.failAll(new Error(`Codex app-server exited with code ${code ?? "unknown"}.`)));
    this.ready = this.request("initialize", { clientInfo: { name: "kotta_pm", title: "Kotta PM", version: "0.1.0" } }).then(() => {
      this.notify("initialized", {});
    });
  }

  private send(message: unknown): void {
    this.process.stdin.write(`${JSON.stringify(message)}\n`);
  }

  private request(method: string, params: unknown): Promise<unknown> {
    const id = this.nextId++;
    return new Promise((resolvePromise, reject) => {
      this.pending.set(id, { resolve: resolvePromise, reject });
      this.send({ method, id, params });
    });
  }

  private notify(method: string, params: unknown): void {
    this.send({ method, params });
  }

  private receive(line: string): void {
    let message: JsonRpcMessage;
    try { message = JSON.parse(line) as JsonRpcMessage; }
    catch { return; }
    if (typeof message.id === "number") {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message ?? "Codex request failed."));
      else pending.resolve(message.result);
      return;
    }
    const threadId = typeof message.params?.threadId === "string" ? message.params.threadId : null;
    if (threadId) this.listeners.get(threadId)?.forEach((listener) => listener(message));
  }

  private failAll(error: Error): void {
    this.pending.forEach((pending) => pending.reject(error));
    this.pending.clear();
  }

  async chat(scopeId: string, existingThreadId: string | null, prompt: string, onEvent: (event: Record<string, unknown>) => void): Promise<void> {
    await this.ready;
    let threadId = existingThreadId && this.threadTickets.get(existingThreadId) === scopeId ? existingThreadId : null;
    let isNew = false;
    if (!threadId) {
      const result = await this.request("thread/start", { cwd: this.cwd, approvalPolicy: "never", sandbox: "workspace-write", serviceName: "kotta-pm" }) as { thread?: { id?: string } };
      threadId = result.thread?.id ?? null;
      if (!threadId) throw new Error("Codex did not return a thread id.");
      this.threadTickets.set(threadId, scopeId);
      isNew = true;
    }
    onEvent({ type: "thread", threadId });
    const instruction = "You are inside the Kotta PM ticket chat. You may inspect and modify files inside the current workspace when the user asks you to implement or change something. Stay within the selected ticket's scope, avoid destructive operations, and report the files and verification performed. If you discover evidence-backed work outside this ticket's scope, do not silently expand the ticket and do not create another ticket: capture it as a Kotta finding with the canonical CLI so a human can disposition it.";
    const input = isNew ? `${prompt}\n\n${instruction}` : prompt;

    await new Promise<void>(async (resolvePromise, reject) => {
      const timeout = setTimeout(() => reject(new Error("Codex response timed out.")), 180_000);
      const finish = (error?: Error) => {
        clearTimeout(timeout);
        this.listeners.get(threadId!)?.delete(listener);
        error ? reject(error) : resolvePromise();
      };
      const listener = (message: JsonRpcMessage) => {
        if (message.method === "item/agentMessage/delta" && typeof message.params?.delta === "string") onEvent({ type: "delta", delta: message.params.delta });
        if (message.method === "error" && message.params?.willRetry === false) {
          const detail = message.params.error as { message?: string } | undefined;
          finish(new Error(detail?.message ?? "Codex turn failed."));
        }
        if (message.method === "turn/completed") {
          const turn = message.params?.turn as { status?: string; error?: { message?: string } } | undefined;
          turn?.status === "failed" ? finish(new Error(turn.error?.message ?? "Codex turn failed.")) : finish();
        }
      };
      const listeners = this.listeners.get(threadId!) ?? new Set();
      listeners.add(listener);
      this.listeners.set(threadId!, listeners);
      try {
        await this.request("turn/start", { threadId, input: [{ type: "text", text: input, text_elements: [] }] });
      } catch (error) {
        finish(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  close(): void {
    this.process.kill();
  }
}

async function requestBody(request: IncomingMessage, limit = 100_000): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > limit) throw new Error("Request body is too large.");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
}

function commandAvailable(command: string): boolean {
  return spawnSync(command, ["--version"], { stdio: "ignore" }).status === 0;
}

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
};

export const DEFAULT_UI_PORT = 4311;
export const UI_PORT_RETRY_BOUND = 20;
const MAX_PORT = 65535;

/** The handover seam: tests point this at a harmless binary so no suite ever launches a browser. */
export const UI_OPEN_COMMAND_ENV = `${ENV_PREFIX}UI_OPEN_COMMAND`;

/** Hands a URL to the desktop; rejects when the handover itself failed. */
export type BrowserOpener = (url: string) => Promise<void>;

/** The platform command that hands a URL to whatever browser the desktop already prefers. */
export function resolveOpenCommand(platform: NodeJS.Platform = process.platform): { command: string; args: string[] } {
  const override = readEnv("UI_OPEN_COMMAND")?.trim();
  if (override) return { command: override, args: [] };
  if (platform === "darwin") return { command: "open", args: [] };
  // `start` is a shell builtin, and its first quoted argument is the window title, not the URL.
  if (platform === "win32") return { command: "cmd", args: ["/c", "start", ""] };
  return { command: "xdg-open", args: [] };
}

/** Unreferenced so a handover that never exits cannot outlive the server it announced. */
const openInBrowser: BrowserOpener = (url) => new Promise<void>((settle, fail) => {
  const { command, args } = resolveOpenCommand();
  const child = spawn(command, [...args, url], { stdio: "ignore" });
  child.once("error", (error) => fail(new Error(`${command}: ${error.message}`)));
  child.once("close", (status) => (status === 0 || status === null ? settle() : fail(new Error(`${command} exited with ${status}.`))));
  child.unref();
});

/** 0 stays legal: it asks the OS for an ephemeral port, which callers and tests rely on. */
export function validateUiPort(port: number): void {
  if (!Number.isInteger(port) || port < 0 || port > MAX_PORT) throw new Error(`--port must be an integer between 0 and ${MAX_PORT}; got '${port}'.`);
}

export function isAddressInUse(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | null)?.code === "EADDRINUSE";
}

/** Explicit ports are tried once; an omitted port walks upwards from `start` within the retry bound. */
export function uiPortCandidates(requested?: number, start = DEFAULT_UI_PORT): number[] {
  if (requested !== undefined) return [requested];
  const candidates: number[] = [];
  for (let index = 0; index < UI_PORT_RETRY_BOUND; index += 1) {
    const candidate = start + index;
    if (candidate > MAX_PORT) break;
    candidates.push(candidate);
  }
  return candidates;
}

function listenOnce(server: Server, host: string, port: number): Promise<void> {
  return new Promise<void>((resolvePromise, reject) => {
    const onError = (error: Error) => { server.removeListener("listening", onListening); reject(error); };
    const onListening = () => { server.removeListener("error", onError); resolvePromise(); };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });
}

/** Binds `server`, falling back to the next port only for EADDRINUSE on an omitted `--port`. */
export async function bindUiServer(server: Server, host: string, requested?: number, start = DEFAULT_UI_PORT): Promise<{ port: number; fallback: boolean }> {
  if (requested !== undefined) validateUiPort(requested);
  const candidates = uiPortCandidates(requested, start);
  for (const candidate of candidates) {
    try {
      await listenOnce(server, host, candidate);
      // An explicit 0 asks for an ephemeral port, so report what the OS actually gave us.
      const bound = (server.address() as { port: number } | null)?.port ?? candidate;
      return { port: bound, fallback: requested === undefined && candidate !== start };
    } catch (error) {
      if (!isAddressInUse(error)) throw error;
      if (requested !== undefined) throw new Error(`Port ${requested} on ${host} is already in use. Stop the process holding it, or run 'kotta ui' without --port to take the next free port.`);
    }
  }
  const last = candidates[candidates.length - 1] ?? start;
  throw new Error(`Ports ${start}-${last} on ${host} are all in use. Free one of them, or run 'kotta ui --port <port>' with a port you know is free.`);
}

/** Returns the listening server so callers — tests above all — can shut it down. */
export async function uiCommand(options: { workspace: string; port?: number; host: string; json?: boolean; open?: boolean }, open: BrowserOpener = openInBrowser): Promise<Server> {
  const initial = readWorkspace(options.workspace);
  const projectRoot = resolveWorkspaceLocation(options.workspace).projectRoot;
  const agents = { codex: commandAvailable("codex"), claude: commandAvailable("claude") };
  let codex: CodexAppServer | null = null;
  const staticRoot = fileURLToPath(new URL("../../ui-dist", import.meta.url));
  if (!existsSync(join(staticRoot, "index.html"))) throw new Error("UI assets are missing. Run npm run build first.");
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    if (url.pathname === "/api/workspace") {
      try { json(response, 200, readWorkspace(initial.workspace)); }
      catch (error) { json(response, 500, { error: error instanceof Error ? error.message : String(error) }); }
      return;
    }
    if (url.pathname === "/api/agents") {
      json(response, 200, agents);
      return;
    }
    if (url.pathname === "/api/source" && request.method === "GET") {
      try {
        const requestedId = url.searchParams.get("id")?.trim() ?? "";
        let sourceFile = url.searchParams.get("path")?.trim() ?? "";
        if (requestedId && !sourceFile) {
          const migrationPath = join(initial.workspace, "migration.json");
          if (existsSync(migrationPath)) {
            const migration = JSON.parse(readFileSync(migrationPath, "utf8")) as Record<string, unknown>;
            const records = ["tickets", "findings", "excluded_terminal"].flatMap((key) => Array.isArray(migration[key]) ? migration[key] as Array<Record<string, unknown>> : []);
            const record = records.find((candidate) => candidate.id === requestedId || candidate.legacy_id === requestedId);
            if (typeof record?.source_file === "string") sourceFile = record.source_file;
          }
        }
        sourceFile = sourceFile.replace(/^source:/, "").replace(/^\/+/, "");
        if (!sourceFile) throw new Error(`No historical source is recorded for ${requestedId || "this reference"}.`);
        let target = resolve(projectRoot, sourceFile);
        if (!existsSync(target) && sourceFile.startsWith("tickets/")) target = resolve(projectRoot, "scrum", sourceFile);
        const projectRelative = relative(projectRoot, target);
        if (!projectRelative || projectRelative.startsWith("..") || projectRelative.includes("\0") || extname(target) !== ".md") throw new Error("Only Markdown sources inside the project can be opened.");
        if (!existsSync(target) || !statSync(target).isFile()) throw new Error(`Source file not found: ${sourceFile}`);
        const parsed = matter(readFileSync(target, "utf8"));
        json(response, 200, { ok: true, path: projectRelative, title: parsed.data.title ?? basename(target), id: parsed.data.id ?? (requestedId || null), content: parsed.content.trim() });
      } catch (error) {
        json(response, 404, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
      return;
    }
    if (url.pathname === "/api/chat" && request.method === "POST") {
      response.writeHead(200, { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", connection: "keep-alive", "x-content-type-options": "nosniff" });
      const event = (value: Record<string, unknown>) => response.write(`${JSON.stringify(value)}\n`);
      try {
        const body = await requestBody(request);
        const ticketId = typeof body.ticketId === "string" ? body.ticketId : "";
        const message = typeof body.message === "string" ? body.message.trim() : "";
        const agent = body.agent === "claude" ? "claude" : "codex";
        const threadId = typeof body.threadId === "string" ? body.threadId : null;
        const workspace = readWorkspace(initial.workspace);
        const ticket = (workspace.tickets as unknown as Array<{ id: string; title: string; status: string; sections: Record<string, string> }>).find((candidate) => candidate.id === ticketId);
        if (!ticket || !message) throw new Error("A valid ticket and non-empty message are required.");
        if (agent === "claude") throw new Error("Claude Code is not connected on this machine yet.");
        if (!agents.codex) throw new Error("Codex is not installed or not available on PATH.");
        codex ??= new CodexAppServer(projectRoot);
        const context = `Selected ticket: ${ticket.id} — ${ticket.title}\nStatus: ${ticket.status}\nOutcome: ${ticket.sections.outcome ?? "—"}\nScope: ${ticket.sections.scope ?? "—"}\nAcceptance: ${ticket.sections.acceptance ?? "—"}\nVerification: ${ticket.sections.verification ?? "—"}\n\nUser message: ${message}`;
        await codex.chat(ticket.id, threadId, context, event);
        event({ type: "done" });
      } catch (error) {
        event({ type: "error", message: error instanceof Error ? error.message : String(error) });
      } finally {
        response.end();
      }
      return;
    }
    if (url.pathname === "/api/ticket/ready" && request.method === "POST") {
      try {
        const body = await requestBody(request);
        const ticketId = typeof body.ticketId === "string" ? body.ticketId : "";
        if (!TICKET_ID.test(ticketId)) throw new Error("A valid ticket id is required.");
        json(response, 200, readyTicket(ticketId, true, projectRoot));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        json(response, 409, { ok: false, errors: message.split("\n").filter(Boolean).map((line) => {
          const separator = line.indexOf(":");
          return separator > 0 ? { code: line.slice(0, separator), message: line.slice(separator + 1).trim() } : { code: "TRANSITION_REJECTED", message: line };
        }) });
      }
      return;
    }
    if (url.pathname === "/api/package" && request.method === "POST") {
      try {
        const body = await requestBody(request);
        const title = typeof body.title === "string" ? body.title.trim() : "";
        const kind = typeof body.kind === "string" ? body.kind : "batch";
        const goal = typeof body.goal === "string" ? body.goal : undefined;
        json(response, 201, newPackage({ title, kind, goal }, projectRoot));
      } catch (error) {
        json(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
      return;
    }
    if (url.pathname === "/api/package/tickets" && request.method === "POST") {
      try {
        const body = await requestBody(request);
        const packageId = typeof body.packageId === "string" ? body.packageId : "";
        const ticketId = typeof body.ticketId === "string" ? body.ticketId : "";
        const action = body.action === "remove" ? "remove" : "add";
        if (!PACKAGE_ID.test(packageId) || !TICKET_ID.test(ticketId)) throw new Error("Valid package and ticket ids are required.");
        json(response, 200, updatePackageTickets(packageId, ticketId, action, projectRoot));
      } catch (error) {
        json(response, 409, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
      return;
    }
    if (url.pathname === "/api/finding" && request.method === "POST") {
      try {
        const body = await requestBody(request);
        const title = typeof body.title === "string" ? body.title.trim() : "";
        const type = typeof body.type === "string" ? body.type : "product";
        const evidence = typeof body.evidence === "string" ? body.evidence.trim() : "";
        const discoveredDuring = typeof body.discoveredDuring === "string" ? body.discoveredDuring : undefined;
        if (!title || !evidence) throw new Error("Finding title and evidence are required.");
        json(response, 201, newFinding({ title, type, evidence, discoveredDuring }, projectRoot));
      } catch (error) {
        json(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
      return;
    }
    if (url.pathname === "/api/finding/resolve" && request.method === "POST") {
      try {
        const body = await requestBody(request);
        const findingId = typeof body.findingId === "string" ? body.findingId : "";
        const disposition = body.disposition === "create-ticket" ? "create-ticket" : "reject";
        if (!FINDING_ID.test(findingId)) throw new Error("A valid finding id is required.");
        json(response, 200, resolveFinding(findingId, disposition, true, projectRoot));
      } catch (error) {
        json(response, 409, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
      return;
    }
    const requested = url.pathname === "/" ? "index.html" : url.pathname.replace(/^\/+/, "");
    const path = normalize(join(staticRoot, requested));
    const safePath = path.startsWith(staticRoot) && existsSync(path) && statSync(path).isFile() ? path : join(staticRoot, "index.html");
    response.writeHead(200, { "content-type": MIME[extname(safePath)] ?? "application/octet-stream", "cache-control": "no-store" });
    createReadStream(safePath).pipe(response);
  });
  const { port, fallback } = await bindUiServer(server, options.host, options.port);
  server.on("close", () => codex?.close());
  const url = `http://${options.host}:${port}`;
  const note = fallback ? `Port ${DEFAULT_UI_PORT} was busy; selected ${port}.\n` : "";
  process.stdout.write(options.json
    ? `${JSON.stringify({ ok: true, command: "ui", data: { url, host: options.host, port, workspace: initial.workspace, fallback } })}\n`
    : `Kotta UI: ${url}\nWorkspace: ${initial.workspace}\n${note}Press Ctrl+C to stop.\n`);
  // --json is for automation, so it never steals focus. A failed handover is a note, not a startup failure.
  if (!options.json && options.open !== false) {
    try {
      await open(url);
    } catch (error) {
      process.stderr.write(`Warning: could not open ${url} in a browser (${error instanceof Error ? error.message : String(error)}). Open it yourself.\n`);
    }
  }
  return server;
}
