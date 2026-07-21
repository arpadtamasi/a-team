import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createInterface } from "node:readline";
import { basename, dirname, extname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { parse } from "yaml";
import { sections } from "../core/markdown.js";
import { newFinding, resolveFinding } from "./finding.js";
import { newPackage, updatePackageTickets } from "./package.js";
import { readyTicket } from "./ticket.js";

const TICKET_STATES = ["backlog", "ready", "active", "review", "done"];
const PACKAGE_STATES = ["backlog", "ready", "active", "done"];

function markdownFiles(directory: string): string[] {
  return existsSync(directory) ? readdirSync(directory).filter((name) => name.endsWith(".md")).sort() : [];
}

function sectionObject(content: string): Record<string, string> {
  return Object.fromEntries([...sections(content)].map(([key, value]) => [key, value.trim()]));
}

export function readWorkspace(workspaceOption: string) {
  const candidate = resolve(workspaceOption);
  const workspace = existsSync(join(candidate, ".a-team")) ? join(candidate, ".a-team") : candidate;
  if (!existsSync(join(workspace, "config.yaml"))) throw new Error(`No A-Team workspace found at ${workspace}.`);
  const config = parse(readFileSync(join(workspace, "config.yaml"), "utf8")) as { project?: { name?: string } };
  const migrationPath = join(workspace, "migration.json");
  const migration = existsSync(migrationPath) ? JSON.parse(readFileSync(migrationPath, "utf8")) as { project?: string; tickets?: Array<{ id: string; [key: string]: unknown }> } : null;
  const migrationById = new Map((migration?.tickets ?? []).map((ticket) => [ticket.id, ticket]));
  const tickets = TICKET_STATES.flatMap((state) => markdownFiles(join(workspace, state)).map((filename) => {
    const parsed = matter(readFileSync(join(workspace, state, filename), "utf8"));
    return { ...parsed.data, status: state, filename, sections: sectionObject(parsed.content), migration: migrationById.get(String(parsed.data.id)) ?? null };
  }));
  const packages = PACKAGE_STATES.flatMap((state) => markdownFiles(join(workspace, "packages", state)).map((filename) => {
    const parsed = matter(readFileSync(join(workspace, "packages", state, filename), "utf8"));
    return { ...parsed.data, status: state, filename, sections: sectionObject(parsed.content) };
  })).sort((left, right) => left.filename.localeCompare(right.filename));
  const findings = ["new", "resolved"].flatMap((state) => markdownFiles(join(workspace, "findings", state)).map((filename) => {
    const parsed = matter(readFileSync(join(workspace, "findings", state, filename), "utf8"));
    return { ...parsed.data, status: state, filename, sections: sectionObject(parsed.content) };
  })).sort((left, right) => left.filename.localeCompare(right.filename));
  return { workspace, project: migration?.project ?? config.project?.name ?? "A-Team workspace", migration, tickets, packages, findings, generatedAt: new Date().toISOString() };
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
    this.ready = this.request("initialize", { clientInfo: { name: "a_team_pm", title: "A-Team PM", version: "0.1.0" } }).then(() => {
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
      const result = await this.request("thread/start", { cwd: this.cwd, approvalPolicy: "never", sandbox: "workspace-write", serviceName: "a-team-pm" }) as { thread?: { id?: string } };
      threadId = result.thread?.id ?? null;
      if (!threadId) throw new Error("Codex did not return a thread id.");
      this.threadTickets.set(threadId, scopeId);
      isNew = true;
    }
    onEvent({ type: "thread", threadId });
    const instruction = "You are inside the A-Team PM ticket chat. You may inspect and modify files inside the current workspace when the user asks you to implement or change something. Stay within the selected ticket's scope, avoid destructive operations, and report the files and verification performed. If you discover evidence-backed work outside this ticket's scope, do not silently expand the ticket and do not create another ticket: capture it as an A-Team finding with the canonical CLI so a human can disposition it.";
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

export async function uiCommand(options: { workspace: string; port: number; host: string; json?: boolean }): Promise<void> {
  const initial = readWorkspace(options.workspace);
  const projectRoot = basename(initial.workspace) === ".a-team" ? dirname(initial.workspace) : initial.workspace;
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
        if (!/^(?:T-\d{3,}|O-\d+(?:\.\d+)?)$/.test(ticketId)) throw new Error("A valid ticket id is required.");
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
        if (!/^P-\d{3,}$/.test(packageId) || !/^(?:T-\d{3,}|O-\d+(?:\.\d+)?)$/.test(ticketId)) throw new Error("Valid package and ticket ids are required.");
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
        if (!/^(?:F-\d{3,}|O-\d+)$/.test(findingId)) throw new Error("A valid finding id is required.");
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
  await new Promise<void>((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(options.port, options.host, resolvePromise);
  });
  server.on("close", () => codex?.close());
  const url = `http://${options.host}:${options.port}`;
  process.stdout.write(options.json ? `${JSON.stringify({ ok: true, command: "ui", data: { url, workspace: initial.workspace } })}\n` : `A-Team UI: ${url}\nWorkspace: ${initial.workspace}\nPress Ctrl+C to stop.\n`);
}
