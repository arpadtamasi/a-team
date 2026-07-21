import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { findRepositoryRoot, regenerateIndex } from "../filesystem/workspace.js";
import { findTicket } from "../filesystem/entities.js";
import { parseMarkdown, renderMarkdown, sections } from "../core/markdown.js";
import { assertClean, git } from "../git/git.js";
import { startTicket } from "./ticket.js";

interface PackageData {
  id: string;
  status: string;
  tickets: string[];
  execution: { mode: string; parallelism: number; stop_on_failure: boolean };
  [key: string]: unknown;
}

function findPackage(root: string, id: string) {
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

export function validatePackage(id: string) {
  const root = findRepositoryRoot();
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
