import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { findRepositoryRoot, regenerateIndex } from "../filesystem/workspace.js";
import { findTicket, nextId, resolveEffectiveTicket } from "../filesystem/entities.js";
import { parseMarkdown, renderMarkdown, sections } from "../core/markdown.js";
import { readWorkspaceConfig } from "../core/config.js";
import { assertClean, git } from "../git/git.js";
import { branchExists, classifyBaseUpdate, classifyIntegration, coordinatorBranchName, linkedWorktrees, type CleanupState, type CoordinatorMetadata } from "../git/coordinator.js";
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

export function newPackage(options: { title: string; kind: string; goal?: string; parallelism?: number }, repositoryRoot?: string) {
  const root = repositoryRoot ?? findRepositoryRoot();
  const allowedKinds = ["sprint", "milestone", "batch", "mission"];
  if (!allowedKinds.includes(options.kind)) throw new Error(`Unknown package kind '${options.kind}'.`);
  const title = options.title.trim();
  if (!title) throw new Error("Package title is required.");
  const parallelism = options.parallelism ?? 2;
  if (!Number.isInteger(parallelism) || parallelism < 1) throw new Error("Package parallelism must be a positive integer.");
  const id = nextId(root, "package");
  const filename = `${id}-${slugify(title)}.md`;
  const directory = join(root, ".a-team/packages/backlog");
  mkdirSync(directory, { recursive: true });
  const now = new Date().toISOString().slice(0, 10);
  const data = {
    id, kind: options.kind, title, status: "backlog", tickets: [],
    execution: { mode: "dependency-aware", parallelism, stop_on_failure: true },
    authority: { create_findings: true, create_subtickets: false, reorder_independent_tickets: false, change_scope: false },
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

export function readyPackage(id: string, approved: boolean, repositoryRoot?: string) {
  const root = repositoryRoot ?? findRepositoryRoot();
  const pkg = findPackage(root, id);
  if (pkg.state !== "backlog") throw new Error(`Package ${id} must be in backlog before ready.`);
  if (!approved) throw new Error("Human ready approval is required. Re-run with --approve after reviewing package scope and ordering.");
  const validation = validatePackage(id, root);
  if (!validation.ok) throw new Error(validation.errors.map((error) => error.message).join("\n"));
  const entity = parseMarkdown(readFileSync(pkg.path, "utf8"));
  const ticketIds = Array.isArray(entity.data.tickets) ? entity.data.tickets.map(String) : [];
  const dependencies = ticketDependencies(root, ticketIds);
  const invalidStates = ticketIds.filter((ticketId) => !["backlog", "ready", "done"].includes(findTicket(root, ticketId).state));
  if (invalidStates.length) throw new Error(`Package tickets must be backlog, ready, or done before package readiness: ${invalidStates.join(", ")}.`);
  const unreadyFrontier = ticketIds.filter((ticketId) => {
    if (findTicket(root, ticketId).state !== "backlog") return false;
    return (dependencies.get(ticketId) ?? []).every((dependency) => findTicket(root, dependency).state === "done");
  });
  if (unreadyFrontier.length) throw new Error(`Every currently executable package ticket must be ready: ${unreadyFrontier.join(", ")}.`);
  entity.data.status = "ready";
  entity.data.updated_at = new Date().toISOString().slice(0, 10);
  const directory = join(root, ".a-team/packages/ready");
  mkdirSync(directory, { recursive: true });
  const destination = join(directory, pkg.filename);
  writeFileSync(destination, renderMarkdown(entity.data, entity.content));
  unlinkSync(pkg.path);
  regenerateIndex(root);
  return { ok: true, command: "package ready", data: { id, path: destination } };
}

/** Resolves the coordinator branch the package must run on, creating or adopting it when safe. */
function establishCoordinator(root: string, id: string, data: PackageData): { action: "created" | "resumed" | "adopted"; coordinator: CoordinatorMetadata } {
  const config = readWorkspaceConfig(root);
  const branch = coordinatorBranchName(id);
  const currentBranch = git(root, ["branch", "--show-current"]);
  const recorded = (data.coordinator ?? null) as CoordinatorMetadata | null;
  if (recorded?.branch) {
    if (currentBranch !== recorded.branch) throw new Error(`Package ${id} coordinates on '${recorded.branch}' but the checkout is on '${currentBranch}'. Run 'git switch ${recorded.branch}' before starting; coordinator metadata is never overwritten from another branch.`);
    return { action: "resumed", coordinator: recorded };
  }
  if (currentBranch === branch) {
    const baseCommit = branchExists(root, config.baseBranch) ? git(root, ["merge-base", branch, config.baseBranch]) : git(root, ["rev-parse", "HEAD"]);
    return { action: "adopted", coordinator: { branch, base_branch: config.baseBranch, base_commit: baseCommit, cleaned_at: null } };
  }
  if (currentBranch !== config.baseBranch) throw new Error(`Package ${id} must start from the configured base branch '${config.baseBranch}' or from its coordinator branch '${branch}'; the checkout is on '${currentBranch || "a detached HEAD"}'.`);
  if (branchExists(root, branch)) throw new Error(`Branch '${branch}' already exists while package ${id} records no coordinator. Switch to it to adopt it, or delete it first; start never overwrites an existing branch.`);
  const baseCommit = git(root, ["rev-parse", "HEAD"]);
  git(root, ["switch", "-c", branch]);
  return { action: "created", coordinator: { branch, base_branch: config.baseBranch, base_commit: baseCommit, cleaned_at: null } };
}

export function startPackage(id: string, agent: string) {
  const root = findRepositoryRoot();
  const validation = validatePackage(id);
  if (!validation.ok) throw new Error(validation.errors.map((error) => error.message).join("\n"));
  assertClean(root);
  const pkg = findPackage(root, id);
  if (!['ready', 'active'].includes(pkg.state)) throw new Error(`Package ${id} must be ready or active before start.`);
  const entity = parseMarkdown(readFileSync(pkg.path, "utf8"));
  const data = entity.data as PackageData;
  const { action: coordinatorAction, coordinator } = establishCoordinator(root, id, data);
  const ids = data.tickets.map(String);
  const dependencies = ticketDependencies(root, ids);
  const done = new Set(ids.filter((ticketId) => findTicket(root, ticketId).state === "done"));
  // A started ticket lives in its own worktree; the root checkout still shows it as ready, so ask the effective state.
  const ready = ids.filter((ticketId) => resolveEffectiveTicket(root, ticketId, (ticket) => ticket.state).value === "ready");
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
  if (coordinatorAction !== "resumed") data.coordinator = { ...coordinator };
  if (pkg.state === "ready" || coordinatorAction !== "resumed") {
    const activating = pkg.state === "ready";
    if (activating) data.status = "active";
    data.updated_at = new Date().toISOString().slice(0, 10);
    const directory = join(root, ".a-team/packages", activating ? "active" : pkg.state);
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, pkg.filename), renderMarkdown(data as Record<string, unknown>, entity.content));
    if (activating) unlinkSync(pkg.path);
    regenerateIndex(root);
    git(root, ["add", ".a-team"]);
    git(root, ["commit", "-m", `chore(a-team): start package ${id}`]);
  }
  return {
    ok: failures.length === 0,
    command: "package start",
    data: { id, started, waiting: ids.filter((ticketId) => !started.includes(ticketId) && !done.has(ticketId)), failures, coordinator: { branch: coordinator.branch, base_branch: coordinator.base_branch, action: coordinatorAction } },
  };
}

interface CoordinatorInspection {
  state: CleanupState;
  branch: string | null;
  baseBranch: string;
  currentBranch: string;
  legacy: boolean;
  integration: ReturnType<typeof classifyIntegration> | null;
  baseUpdate: ReturnType<typeof classifyBaseUpdate> | null;
  blockers: string[];
}

/** Single source of truth for coordinator lifecycle: Git and the worktree decide, metadata only records. */
function inspectCoordinator(root: string, id: string, packageState: string, data: PackageData): CoordinatorInspection {
  const config = readWorkspaceConfig(root);
  const currentBranch = git(root, ["branch", "--show-current"]);
  const recorded = (data.coordinator ?? null) as CoordinatorMetadata | null;
  const conventional = coordinatorBranchName(id);
  const legacy = !recorded?.branch && branchExists(root, conventional);
  const branch = recorded?.branch ?? (legacy ? conventional : null);
  const baseBranch = recorded?.base_branch ?? config.baseBranch;
  const base = { state: "unstarted" as CleanupState, branch, baseBranch, currentBranch, legacy, integration: null, baseUpdate: null, blockers: [] as string[] };
  if (recorded?.cleaned_at) return { ...base, state: "cleaned" };
  if (!branch) return base;
  if (!branchExists(root, branch)) return { ...base, state: "cleaned" };
  if (packageState !== "done") return { ...base, state: "active" };

  const integration = classifyIntegration(root, branch, baseBranch);
  if (!integration.integrated) return { ...base, integration, state: "done-unintegrated" };

  const blockers: string[] = [];
  if (git(root, ["status", "--porcelain"])) blockers.push(`The working tree at ${root} has pending changes; commit or remove them before cleanup.`);
  const ticketIds = Array.isArray(data.tickets) ? data.tickets.map(String) : [];
  // Claims are written inside the ticket's worktree, so check there as well as in the coordinator checkout.
  const claimed = ticketIds.filter((ticketId) => [join(root, ".a-team/claims", `${ticketId}.yaml`), join(root, ".worktrees", ticketId, ".a-team/claims", `${ticketId}.yaml`)].some((path) => existsSync(path)));
  if (claimed.length) blockers.push(`Active claims remain for ${claimed.join(", ")}; close or release them before cleanup.`);
  const linked = linkedWorktrees(root);
  const ticketWorktrees = linked.filter((entry) => ticketIds.some((ticketId) => entry.path.endsWith(`/${ticketId}`)));
  if (ticketWorktrees.length) blockers.push(`Ticket worktrees are still linked: ${ticketWorktrees.map((entry) => entry.path).join(", ")}.`);
  const elsewhere = linked.filter((entry) => entry.branch === branch || entry.branch === baseBranch);
  if (elsewhere.length) blockers.push(`Another worktree holds ${elsewhere.map((entry) => `${entry.branch} (${entry.path})`).join(", ")}; cleanup would fight it.`);
  const baseUpdate = branchExists(root, baseBranch) ? classifyBaseUpdate(root, baseBranch) : null;
  if (!baseUpdate) blockers.push(`The configured base branch '${baseBranch}' does not exist locally.`);
  if (baseUpdate?.kind === "diverged") blockers.push(`Local '${baseBranch}' (${baseUpdate.local.slice(0, 7)}) and its remote (${baseUpdate.remote.slice(0, 7)}) have diverged; reconcile them manually — cleanup never resets or rebases.`);

  if (blockers.length) {
    const state: CleanupState = baseUpdate?.kind === "diverged" ? "blocked-diverged" : blockers[0].includes("pending changes") ? "blocked-dirty" : "blocked-in-use";
    return { ...base, integration, baseUpdate, blockers, state };
  }
  return { ...base, integration, baseUpdate, state: "cleanup-pending" };
}

export function packageStatus(id: string) {
  const root = findRepositoryRoot();
  const pkg = findPackage(root, id);
  const entity = parseMarkdown(readFileSync(pkg.path, "utf8"));
  const data = entity.data as PackageData;
  const ids = Array.isArray(entity.data.tickets) ? entity.data.tickets.map(String) : [];
  const tickets = ids.map((ticketId) => {
    const effective = resolveEffectiveTicket(root, ticketId, (ticket) => ticket.state);
    return { id: ticketId, state: effective.value, ...(effective.worktree ? { worktree: effective.worktree } : {}) };
  });
  const inspection = inspectCoordinator(root, id, pkg.state, data);
  return {
    ok: true,
    command: "package status",
    data: {
      id, status: pkg.state, tickets,
      coordinator: {
        state: inspection.state, branch: inspection.branch, base_branch: inspection.baseBranch, current_branch: inspection.currentBranch,
        legacy: inspection.legacy, cleanup_pending: inspection.state === "cleanup-pending",
        integration: inspection.integration, base_update: inspection.baseUpdate, blockers: inspection.blockers,
      },
    },
  };
}

/** Opt-in, post-integration cleanup. Every precondition is recomputed here; nothing is forced. */
export function finalizePackage(id: string, repositoryRoot?: string) {
  const root = repositoryRoot ?? findRepositoryRoot();
  const pkg = findPackage(root, id);
  const entity = parseMarkdown(readFileSync(pkg.path, "utf8"));
  const data = entity.data as PackageData;
  if (pkg.state !== "done") throw new Error(`Package ${id} is ${pkg.state}; coordinator cleanup runs only after the package is done.`);
  const inspection = inspectCoordinator(root, id, pkg.state, data);
  const actions: string[] = [];

  if (inspection.state === "cleaned" || inspection.state === "unstarted") {
    // Re-running after success, or a package that never had a branch to clean: both are no-ops.
    if (!(data.coordinator as CoordinatorMetadata | null)?.cleaned_at && inspection.branch) recordCleaned(root, pkg.path, entity, data, id);
    return { ok: true, command: "package finalize", data: { id, state: "cleaned" as CleanupState, branch: inspection.branch, actions, evidence: inspection.integration } };
  }
  if (inspection.state === "done-unintegrated") {
    const checked = inspection.integration?.integrated === false ? inspection.integration.checked : [];
    throw new Error(`Coordinator branch '${inspection.branch}' is not an ancestor of ${checked.length ? checked.join(" or ") : `'${inspection.baseBranch}'`}. Merge it first; cleanup never deletes unmerged work.`);
  }
  if (inspection.blockers.length) throw new Error([`Coordinator cleanup for ${id} is blocked (${inspection.state}):`, ...inspection.blockers.map((blocker) => `- ${blocker}`)].join("\n"));
  if (inspection.legacy) actions.push(`adopted-legacy-branch:${inspection.branch}`);

  const branch = inspection.branch as string;
  if (inspection.currentBranch !== inspection.baseBranch) {
    git(root, ["switch", inspection.baseBranch]);
    actions.push(`switched-to:${inspection.baseBranch}`);
  }
  if (inspection.baseUpdate?.kind === "fast-forward") {
    git(root, ["merge", "--ff-only", inspection.baseUpdate.remote]);
    actions.push(`fast-forwarded:${inspection.baseBranch}`);
  }
  // -d refuses an unmerged branch on its own; it is the second proof after the ancestry check.
  git(root, ["branch", "-d", branch]);
  actions.push(`deleted-local-branch:${branch}`);
  recordCleaned(root, pkg.path, entity, data, id);
  return { ok: true, command: "package finalize", data: { id, state: "cleaned" as CleanupState, branch, actions, evidence: inspection.integration } };
}

function recordCleaned(root: string, path: string, entity: { content: string }, data: PackageData, id: string) {
  const existing = (data.coordinator ?? null) as CoordinatorMetadata | null;
  data.coordinator = { branch: existing?.branch ?? coordinatorBranchName(id), base_branch: existing?.base_branch ?? readWorkspaceConfig(root).baseBranch, base_commit: existing?.base_commit ?? "", cleaned_at: new Date().toISOString().slice(0, 10) };
  data.updated_at = new Date().toISOString().slice(0, 10);
  writeFileSync(path, renderMarkdown(data as Record<string, unknown>, entity.content));
  regenerateIndex(root);
  git(root, ["add", ".a-team"]);
  git(root, ["commit", "-m", `chore(a-team): finalize package ${id}`]);
}
