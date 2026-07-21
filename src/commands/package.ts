import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { findRepositoryRoot, regenerateIndex } from "../filesystem/workspace.js";
import { findTicket, nextId } from "../filesystem/entities.js";
import { parseMarkdown, renderMarkdown, sections } from "../core/markdown.js";
import { assertClean, git } from "../git/git.js";
import { slugify, startTicket } from "./ticket.js";

interface PackageData {
  id: string;
  status: string;
  tickets: string[];
  execution: { mode: string; parallelism: number; stop_on_failure: boolean };
  [key: string]: unknown;
}

export function findPackage(root: string, id: string) {
  for (const state of ["backlog", "ready", "active", "done"]) {
    const directory = join(root, ".a-team/packages", state);
    if (!existsSync(directory)) continue;
    const filename = readdirSync(directory).find((name) => name.startsWith(`${id}-`) && name.endsWith(".md"));
    if (filename) return { state, filename, path: join(directory, filename) };
  }
  throw new Error(`Package ${id} was not found.`);
}

function ticketDependencies(root: string, ids: string[]): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const id of ids) {
    const ticket = findTicket(root, id);
    const entity = parseMarkdown(readFileSync(ticket.path, "utf8"));
    const dependencies = Array.isArray(entity.data.depends_on) ? entity.data.depends_on.map(String) : [];
    for (const dependency of dependencies) findTicket(root, dependency);
    result.set(id, dependencies);
  }
  return result;
}

export function planPackageWaves(ids: string[], dependencies: Map<string, string[]>): string[][] {
  const remaining = new Set(ids);
  const completed = new Set<string>();
  const waves: string[][] = [];
  while (remaining.size) {
    const wave = [...remaining].filter((id) => (dependencies.get(id) ?? []).filter((dependency) => remaining.has(dependency) || completed.has(dependency)).every((dependency) => completed.has(dependency)));
    if (!wave.length) throw new Error(`Dependency cycle detected among: ${[...remaining].join(", ")}.`);
    waves.push(wave);
    for (const id of wave) { remaining.delete(id); completed.add(id); }
  }
  return waves;
}

export function newPackage(options: { title: string; kind: string; goal?: string }, repositoryRoot?: string) {
  const root = repositoryRoot ?? findRepositoryRoot();
  const allowedKinds = ["sprint", "milestone", "batch", "mission"];
  if (!allowedKinds.includes(options.kind)) throw new Error(`Unknown package kind '${options.kind}'.`);
  const title = options.title.trim();
  if (!title) throw new Error("Package title is required.");
  const id = nextId(root, "package");
  const filename = `${id}-${slugify(title)}.md`;
  const directory = join(root, ".a-team/packages/backlog");
  mkdirSync(directory, { recursive: true });
  const now = new Date().toISOString().slice(0, 10);
  const data = {
    id, kind: options.kind, title, status: "backlog", tickets: [],
    execution: { mode: "dependency-aware", parallelism: 2, stop_on_failure: true },
    authority: { may_start_tickets: false, may_merge: false, may_close_tickets: false, may_close_package: false },
    created_at: now, updated_at: now,
  };
  const content = `# ${id} — ${title}\n\n## Goal\n\n${options.goal?.trim() || "Describe the shared outcome."}\n\n## Completion\n\nAll member tickets satisfy their acceptance contracts.\n\n## Execution notes\n\nMembership and ordering are coordinated by a human.\n`;
  const path = join(directory, filename);
  writeFileSync(path, renderMarkdown(data, content));
  regenerateIndex(root);
  return { ok: true, command: "package new", data: { id, path } };
}

export function updatePackageTickets(id: string, ticketId: string, action: "add" | "remove", repositoryRoot?: string) {
  const root = repositoryRoot ?? findRepositoryRoot();
  const pkg = findPackage(root, id);
  if (pkg.state !== "backlog") throw new Error(`Package ${id} membership can only change while it is in backlog.`);
  const ticket = findTicket(root, ticketId);
  const ticketEntity = parseMarkdown(readFileSync(ticket.path, "utf8"));
  const currentPackage = typeof ticketEntity.data.package === "string" ? ticketEntity.data.package : null;
  if (action === "add" && currentPackage && currentPackage !== id) throw new Error(`Ticket ${ticketId} already belongs to ${currentPackage}. Remove it there first.`);
  const entity = parseMarkdown(readFileSync(pkg.path, "utf8"));
  const tickets = Array.isArray(entity.data.tickets) ? entity.data.tickets.map(String) : [];
  if (action === "add" && !tickets.includes(ticketId)) tickets.push(ticketId);
  if (action === "remove") {
    const index = tickets.indexOf(ticketId);
    if (index < 0) throw new Error(`Ticket ${ticketId} is not in package ${id}.`);
    tickets.splice(index, 1);
  }
  entity.data.tickets = tickets;
  entity.data.updated_at = new Date().toISOString().slice(0, 10);
  ticketEntity.data.package = action === "add" ? id : null;
  ticketEntity.data.updated_at = new Date().toISOString().slice(0, 10);
  writeFileSync(pkg.path, renderMarkdown(entity.data, entity.content));
  writeFileSync(ticket.path, renderMarkdown(ticketEntity.data, ticketEntity.content));
  regenerateIndex(root);
  return { ok: true, command: `package ${action}`, data: { id, ticketId, tickets } };
}

export function validatePackage(id: string, repositoryRoot?: string) {
  const root = repositoryRoot ?? findRepositoryRoot();
  const pkg = findPackage(root, id);
  const entity = parseMarkdown(readFileSync(pkg.path, "utf8"));
  const data = entity.data as PackageData;
  const errors: Array<{ code: string; message: string }> = [];
  if (String(data.id) !== id) errors.push({ code: "ID_MISMATCH", message: "Package identifier does not match the requested id." });
  if (String(data.status) !== pkg.state) errors.push({ code: "STATE_MISMATCH", message: `Package status must match directory '${pkg.state}'.` });
  const body = sections(entity.content);
  for (const heading of ["Goal", "Completion", "Execution notes"]) if (!body.get(heading.toLowerCase())?.trim()) errors.push({ code: "MISSING_SECTION", message: `Missing or empty section: ${heading}.` });
  let waves: string[][] = [];
  try {
    const ids = Array.isArray(data.tickets) ? data.tickets.map(String) : [];
    if (!ids.length) throw new Error("Package must contain at least one ticket.");
    waves = planPackageWaves(ids, ticketDependencies(root, ids));
  } catch (error) {
    errors.push({ code: "DEPENDENCY_ERROR", message: error instanceof Error ? error.message : String(error) });
  }
  return { ok: errors.length === 0, command: "package validate", data: { id, state: pkg.state, waves }, errors };
}

export function startPackage(id: string, agent: string) {
  const root = findRepositoryRoot();
  const validation = validatePackage(id);
  if (!validation.ok) throw new Error(validation.errors.map((error) => error.message).join("\n"));
  const currentBranch = git(root, ["branch", "--show-current"]);
  if (["main", "master", "develop"].includes(currentBranch)) throw new Error("Package execution requires a coordinator branch; protected branches cannot be modified.");
  assertClean(root);
  const pkg = findPackage(root, id);
  if (!['ready', 'active'].includes(pkg.state)) throw new Error(`Package ${id} must be ready or active before start.`);
  const entity = parseMarkdown(readFileSync(pkg.path, "utf8"));
  const data = entity.data as PackageData;
  const ids = data.tickets.map(String);
  const dependencies = ticketDependencies(root, ids);
  const done = new Set(ids.filter((ticketId) => findTicket(root, ticketId).state === "done"));
  const ready = ids.filter((ticketId) => findTicket(root, ticketId).state === "ready");
  let executable = ready.filter((ticketId) => (dependencies.get(ticketId) ?? []).every((dependency) => findTicket(root, dependency).state === "done"));
  if (data.execution.mode === "sequential") executable = executable.slice(0, 1);
  executable = executable.slice(0, Math.max(1, Number(data.execution.parallelism ?? 1)));
  const started: string[] = [];
  const failures: Array<{ id: string; message: string }> = [];
  for (const ticketId of executable) {
    try { startTicket(ticketId, agent); started.push(ticketId); }
    catch (error) {
      failures.push({ id: ticketId, message: error instanceof Error ? error.message : String(error) });
      if (data.execution.stop_on_failure !== false) throw error;
    }
  }
  if (pkg.state === "ready") {
    data.status = "active";
    data.updated_at = new Date().toISOString().slice(0, 10);
    const directory = join(root, ".a-team/packages/active");
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, pkg.filename), renderMarkdown(data as Record<string, unknown>, entity.content));
    unlinkSync(pkg.path);
    regenerateIndex(root);
    git(root, ["add", ".a-team"]);
    git(root, ["commit", "-m", `chore(a-team): start package ${id}`]);
  }
  return { ok: failures.length === 0, command: "package start", data: { id, started, waiting: ids.filter((ticketId) => !started.includes(ticketId) && !done.has(ticketId)), failures } };
}

export function packageStatus(id: string) {
  const root = findRepositoryRoot();
  const pkg = findPackage(root, id);
  const entity = parseMarkdown(readFileSync(pkg.path, "utf8"));
  const ids = Array.isArray(entity.data.tickets) ? entity.data.tickets.map(String) : [];
  const tickets = ids.map((ticketId) => {
    const worktree = join(root, ".worktrees", ticketId);
    if (existsSync(worktree)) {
      try { return { id: ticketId, state: findTicket(worktree, ticketId).state, worktree }; } catch { /* fall through */ }
    }
    return { id: ticketId, state: findTicket(root, ticketId).state };
  });
  return { ok: true, command: "package status", data: { id, status: pkg.state, tickets } };
}
