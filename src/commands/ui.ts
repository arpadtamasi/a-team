import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createServer, type ServerResponse } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { parse } from "yaml";
import { sections } from "../core/markdown.js";

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
  return { workspace, project: migration?.project ?? config.project?.name ?? "A-Team workspace", migration, tickets, packages, generatedAt: new Date().toISOString() };
}

function json(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(value));
}

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
};

export async function uiCommand(options: { workspace: string; port: number; host: string; json?: boolean }): Promise<void> {
  const initial = readWorkspace(options.workspace);
  const staticRoot = fileURLToPath(new URL("../../ui-dist", import.meta.url));
  if (!existsSync(join(staticRoot, "index.html"))) throw new Error("UI assets are missing. Run npm run build first.");
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    if (url.pathname === "/api/workspace") {
      try { json(response, 200, readWorkspace(initial.workspace)); }
      catch (error) { json(response, 500, { error: error instanceof Error ? error.message : String(error) }); }
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
  const url = `http://${options.host}:${options.port}`;
  process.stdout.write(options.json ? `${JSON.stringify({ ok: true, command: "ui", data: { url, workspace: initial.workspace } })}\n` : `A-Team UI: ${url}\nWorkspace: ${initial.workspace}\nPress Ctrl+C to stop.\n`);
}
