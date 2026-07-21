import { mkdirSync, readdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml, stringify } from "yaml";
import { findRepositoryRoot, regenerateIndex } from "../filesystem/workspace.js";
import { findTicket, nextId } from "../filesystem/entities.js";
import { parseMarkdown, renderMarkdown, sections } from "../core/markdown.js";
import { assertValid, validateTicketFile } from "../core/validation.js";
import { BRANCH_PREFIXES } from "../core/profiles.js";
import { assertClean, assertSafeWorktreePath, git } from "../git/git.js";

export function slugify(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export function branchName(type: string, id: string, title: string): string {
  return `${BRANCH_PREFIXES[type] ?? "feat"}/${id}-${slugify(title)}`;
}

export function newTicket(options: { title: string; type: string; profiles: string[] }, repositoryRoot?: string) {
  const root = repositoryRoot ?? findRepositoryRoot();
  const id = nextId(root, "ticket");
  const slug = slugify(options.title);
  const filename = `${id}-${slug}.md`;
  const path = join(root, ".a-team/backlog", filename);
  const now = new Date().toISOString().slice(0, 10);
  const data = { id, title: options.title, status: "backlog", origin: "human", types: [options.type], profiles: options.profiles, priority: "medium", risk: "medium", package: null, depends_on: [], blocks: [], branch: null, pull_request: null, created_at: now, updated_at: now };
  const profileSections = options.profiles.flatMap((profile) => profileHeadings(profile)).map((heading) => `## ${heading}\n\nDescribe ${heading.toLowerCase()}.`).join("\n\n");
  const content = `# ${id} — ${options.title}\n\n## Outcome\n\nDescribe the observable outcome.\n\n${profileSections ? `${profileSections}\n\n` : ""}## Scope\n\nDescribe what is included.\n\n## Non-goals\n\nDescribe what is excluded.\n\n## Acceptance\n\n- Define an observable condition.\n\n## Verification\n\n- Explain how acceptance will be checked.\n\n## Constraints\n\nNone.\n\n## Open decisions\n\nNone.\n\n## Execution notes\n\nNone.\n`;
  writeFileSync(path, renderMarkdown(data, content));
  regenerateIndex(root);
  return { ok: true, command: "ticket new", data: { id, path } };
}

function profileHeadings(profile: string): string[] {
  const requirements: Record<string, string[]> = {
    workflow: ["Actors", "Initial state", "States", "Transitions", "Triggers", "Permissions", "Error paths", "Cancellation path", "Retry and duplicate-action behaviour", "Audit and notification expectations"],
    ui: ["User goal", "Entry point", "Default state", "Loading state", "Empty state", "Error state", "Success state", "Disabled state", "Responsive behaviour", "Keyboard and focus behaviour", "Accessibility expectations", "Visual reference"],
    performance: ["Measured baseline", "Target value", "Measurement environment", "Workload and data volume", "Aggregation or percentile", "Permitted variance", "Regression limits", "Before/after verification"],
    metric: ["Decision supported by the metric", "Exact semantic definition", "Numerator and denominator", "Unit of analysis", "Time window", "Segmentation", "Source events or tables", "Exclusions", "Validation cases"],
    bug: ["Actual behaviour", "Expected behaviour", "Reproduction steps", "Environment", "Frequency", "Impact", "Regression-test expectation"],
    refactor: ["Current structural problem", "Demonstrated cost or risk", "Behavioural invariants", "Target structural property", "Excluded redesign", "Behaviour-preserving verification"],
    discovery: ["Decision to be supported", "Research question", "Hypotheses", "Method", "Time or depth limit", "Expected output", "Decision criterion"],
  };
  return requirements[profile] ?? [];
}

export function validateTicket(id: string) {
  const root = findRepositoryRoot();
  const ticket = findTicket(root, id);
  const report = validateTicketFile(ticket.path);
  return { ok: report.valid, command: "ticket validate", data: { id, state: ticket.state }, errors: report.errors };
}

export function readyTicket(id: string, approved: boolean, repositoryRoot?: string) {
  const root = repositoryRoot ?? findRepositoryRoot();
  const ticket = findTicket(root, id);
  if (ticket.state !== "backlog") throw new Error(`Ticket ${id} must be in backlog before ready.`);
  if (!approved) throw new Error("Human ready approval is required. Re-run with --approve after reviewing intent and trade-offs.");
  const entity = parseMarkdown(readFileSync(ticket.path, "utf8"));
  const dependencies = Array.isArray(entity.data.depends_on) ? entity.data.depends_on.map(String) : [];
  for (const dependency of dependencies) findTicket(root, dependency);
  entity.data.status = "ready";
  entity.data.updated_at = new Date().toISOString().slice(0, 10);
  const destination = join(root, ".a-team/ready", ticket.filename);
  writeFileSync(destination, renderMarkdown(entity.data, entity.content));
  try {
    assertValid(validateTicketFile(destination, "ready"));
  } catch (error) {
    unlinkSync(destination);
    throw error;
  }
  unlinkSync(ticket.path);
  regenerateIndex(root);
  return { ok: true, command: "ticket ready", data: { id, path: destination } };
}

export function startTicket(id: string, agent: string) {
  const root = findRepositoryRoot();
  const ticket = findTicket(root, id);
  if (ticket.state !== "ready") throw new Error(`Ticket ${id} must be ready before start.`);
  assertValid(validateTicketFile(ticket.path, "ready"));
  assertClean(root);
  const claimInBase = join(root, ".a-team/claims", `${id}.yaml`);
  if (existsSync(claimInBase)) throw new Error(`Ticket ${id} already has a claim.`);
  const entity = parseMarkdown(readFileSync(ticket.path, "utf8"));
  const dependencies = Array.isArray(entity.data.depends_on) ? entity.data.depends_on.map(String) : [];
  const incomplete = dependencies.filter((dependency) => findTicket(root, dependency).state !== "done");
  if (incomplete.length) throw new Error(`Unresolved dependencies: ${incomplete.join(", ")}. Complete them before starting ${id}.`);
  const title = String(entity.data.title);
  const type = Array.isArray(entity.data.types) ? String(entity.data.types[0]) : String(entity.data.type ?? "feature");
  const branch = branchName(type, id, title);
  const worktreeRelative = `.worktrees/${id}`;
  const worktree = join(root, worktreeRelative);
  assertSafeWorktreePath(worktree);
  if (git(root, ["branch", "--list", branch])) throw new Error(`Branch already exists: ${branch}`);
  git(root, ["worktree", "add", worktree, "-b", branch, "HEAD"]);
  const worktreeTicket = findTicket(worktree, id);
  const active = join(worktree, ".a-team/active", worktreeTicket.filename);
  mkdirSync(join(worktree, ".a-team/active"), { recursive: true });
  mkdirSync(join(worktree, ".a-team/claims"), { recursive: true });
  const activeEntity = parseMarkdown(readFileSync(worktreeTicket.path, "utf8"));
  activeEntity.data.status = "active";
  activeEntity.data.branch = branch;
  activeEntity.data.assigned_agent = agent;
  activeEntity.data.updated_at = new Date().toISOString().slice(0, 10);
  writeFileSync(active, renderMarkdown(activeEntity.data, activeEntity.content));
  unlinkSync(worktreeTicket.path);
  const claim = { ticket: id, agent, branch, worktree: worktreeRelative, started_at: new Date().toISOString() };
  writeFileSync(join(worktree, ".a-team/claims", `${id}.yaml`), stringify(claim));
  regenerateIndex(worktree);
  git(worktree, ["add", ".a-team"]);
  git(worktree, ["commit", "-m", `chore(a-team): start ${id}`]);
  return { ok: true, command: "ticket start", data: { id, branch, worktree } };
}

export function reviewTicket(id: string, evidence: string, pullRequest?: string) {
  const root = findRepositoryRoot();
  const ticket = findTicket(root, id);
  if (ticket.state !== "active") throw new Error(`Ticket ${id} must be active before review.`);
  assertClean(root);
  const entity = parseMarkdown(readFileSync(ticket.path, "utf8"));
  entity.data.status = "review";
  entity.data.pull_request = pullRequest ?? null;
  entity.data.updated_at = new Date().toISOString().slice(0, 10);
  const acceptance = sections(entity.content).get("acceptance")?.split(/\r?\n/).map((line) => /^\s*[-*]\s+(.+)/.exec(line)?.[1]).filter((line): line is string => Boolean(line)) ?? [];
  const profileChecks = (Array.isArray(entity.data.profiles) ? entity.data.profiles.map(String) : []).flatMap((profile) => {
    const path = join(root, ".a-team/profiles", `${profile}.yaml`);
    if (!existsSync(path)) return [];
    const definition = parseYaml(readFileSync(path, "utf8")) as { done_checks?: unknown[] };
    return (definition.done_checks ?? []).map((check) => `${profile}: ${String(check)}`);
  });
  const checks = [...acceptance, ...profileChecks];
  const safeEvidence = evidence.replaceAll("|", "\\|").replaceAll("\n", " ");
  const evidenceRows = (checks.length ? checks : ["Ticket acceptance criteria"]).map((check) => `| ${check.replaceAll("|", "\\|")} | ${safeEvidence} |`).join("\n");
  const reviewEvidence = `\n\n## Review evidence\n\n| Acceptance condition | Evidence |\n|---|---|\n${evidenceRows}\n\n### Verification performed\n\n${evidence}\n\n### Deviations\n\nNone.\n\n### Findings created\n\nNone.\n\n### Known concerns\n\nNone.\n`;
  const destinationDirectory = join(root, ".a-team/review");
  mkdirSync(destinationDirectory, { recursive: true });
  const destination = join(destinationDirectory, ticket.filename);
  writeFileSync(destination, renderMarkdown(entity.data, `${entity.content.trimEnd()}${reviewEvidence}`));
  unlinkSync(ticket.path);
  regenerateIndex(root);
  git(root, ["add", ".a-team"]);
  git(root, ["commit", "-m", `chore(a-team): submit ${id} for review`]);
  return { ok: true, command: "ticket review", data: { id, pullRequest: pullRequest ?? null } };
}

export function closeTicket(id: string, approved: boolean) {
  const root = findRepositoryRoot();
  const ticket = findTicket(root, id);
  if (ticket.state !== "review") throw new Error(`Ticket ${id} must be in review before close.`);
  if (!approved) throw new Error("Human done approval is required. Re-run with --approve after acceptance verification.");
  assertClean(root);
  const entity = parseMarkdown(readFileSync(ticket.path, "utf8"));
  const branch = String(entity.data.branch ?? "");
  if (!branch) throw new Error(`Ticket ${id} has no execution branch.`);
  const merged = git(root, ["branch", "--merged", "HEAD"]).split(/\r?\n/).map((line) => line.replace(/^[*+]?\s*/, "")).includes(branch);
  if (!merged) throw new Error(`Branch ${branch} is not merged into the current branch.`);
  const worktree = join(root, ".worktrees", id);
  if (existsSync(worktree) && git(worktree, ["status", "--porcelain"])) throw new Error(`Worktree ${worktree} contains uncommitted changes; refusing cleanup.`);
  entity.data.status = "done";
  entity.data.resolution = "completed";
  entity.data.updated_at = new Date().toISOString().slice(0, 10);
  const doneDirectory = join(root, ".a-team/done");
  mkdirSync(doneDirectory, { recursive: true });
  const destination = join(doneDirectory, ticket.filename);
  writeFileSync(destination, renderMarkdown(entity.data, entity.content));
  unlinkSync(ticket.path);
  const claimPath = join(root, ".a-team/claims", `${id}.yaml`);
  if (existsSync(claimPath)) unlinkSync(claimPath);
  updateContainingPackage(root, id);
  regenerateIndex(root);
  if (existsSync(worktree)) {
    git(root, ["worktree", "remove", worktree]);
  }
  git(root, ["branch", "-d", branch]);
  git(root, ["add", ".a-team"]);
  git(root, ["commit", "-m", `chore(a-team): close ${id}`]);
  return { ok: true, command: "ticket close", data: { id, resolution: "completed" } };
}

export function reopenTicket(id: string, approved: boolean) {
  const root = findRepositoryRoot();
  const ticket = findTicket(root, id);
  if (!["review", "done"].includes(ticket.state)) throw new Error(`Ticket ${id} can only reopen from review or done.`);
  if (!approved) throw new Error("Human approval is required to reopen terminal or reviewed work.");
  const entity = parseMarkdown(readFileSync(ticket.path, "utf8"));
  entity.data.status = "backlog";
  entity.data.resolution = null;
  entity.data.branch = null;
  entity.data.pull_request = null;
  entity.data.updated_at = new Date().toISOString().slice(0, 10);
  const directory = join(root, ".a-team/backlog");
  mkdirSync(directory, { recursive: true });
  const destination = join(directory, ticket.filename);
  writeFileSync(destination, renderMarkdown(entity.data, entity.content));
  unlinkSync(ticket.path);
  regenerateIndex(root);
  return { ok: true, command: "ticket reopen", data: { id, state: "backlog" } };
}

function updateContainingPackage(root: string, ticketId: string): void {
  const directory = join(root, ".a-team/packages/active");
  if (!existsSync(directory)) return;
  for (const filename of readdirSync(directory).filter((name) => name.startsWith("P-") && name.endsWith(".md"))) {
    const path = join(directory, filename);
    const entity = parseMarkdown(readFileSync(path, "utf8"));
    const tickets = Array.isArray(entity.data.tickets) ? entity.data.tickets.map(String) : [];
    if (!tickets.includes(ticketId)) continue;
    entity.data.updated_at = new Date().toISOString().slice(0, 10);
    if (tickets.every((id) => findTicket(root, id).state === "done")) {
      entity.data.status = "done";
      const done = join(root, ".a-team/packages/done");
      mkdirSync(done, { recursive: true });
      writeFileSync(join(done, filename), renderMarkdown(entity.data, entity.content));
      unlinkSync(path);
    } else {
      writeFileSync(path, renderMarkdown(entity.data, entity.content));
    }
  }
}
