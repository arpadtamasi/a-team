import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import matter from "gray-matter";
import { stringify } from "yaml";

const sourceRoot = resolve(process.argv[2] ?? "/Users/rp/Dev/ezchops/oneanda");
const demoRoot = resolve(process.argv[3] ?? "examples/oneanda-migration");
const workspace = join(demoRoot, ".a-team");
const ticketSource = join(sourceRoot, "scrum/tickets");
const backlogSource = join(sourceRoot, "scrum/backlog.md");

if (!existsSync(ticketSource) || !existsSync(backlogSource)) {
  throw new Error(`Legacy Scrum workspace not found under ${sourceRoot}`);
}

const headings = (content) => {
  const matches = [...content.matchAll(/^##\s+(.+?)\s*\n([\s\S]*?)(?=^##\s+|\s*$)/gm)];
  return new Map(matches.map((match) => [match[1].trim().toLowerCase(), match[2].trim()]));
};

const cleanText = (value, fallback) => value?.trim() || fallback;
const slugify = (value) => value.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);
const legacyNumber = (id) => Number(id.replace(/^O-/, ""));
const today = "2026-07-21";

const backlogMeta = new Map();
let section = "Later";
for (const line of readFileSync(backlogSource, "utf8").split(/\r?\n/)) {
  const sectionMatch = /^##\s+(Now|Next|Later|Completed)/.exec(line);
  if (sectionMatch) section = sectionMatch[1];
  const ticketMatch = /^- \[(O-\d+)\s+—/.exec(line);
  if (!ticketMatch) continue;
  const priority = /\((P[0-3])(?:,|\))/.exec(line)?.[1] ?? null;
  backlogMeta.set(ticketMatch[1], { section, priority, compact: line });
}

const legacyTickets = readdirSync(ticketSource)
  .filter((name) => /^O-\d+.*\.md$/.test(name))
  .map((filename) => {
    const parsed = matter(readFileSync(join(ticketSource, filename), "utf8"));
    return {
      filename,
      data: parsed.data,
      content: parsed.content,
      sections: headings(parsed.content),
      backlog: backlogMeta.get(String(parsed.data.id)) ?? { section: "Later", priority: null, compact: "" },
    };
  })
  .sort((a, b) => legacyNumber(String(a.data.id)) - legacyNumber(String(b.data.id)));

const splitDefinitions = {
  "O-9": [
    ["Compose sessions from task graph and history", "Generate the next practice session from task-graph rules and the projected player history, with an auditable recommendation lifecycle and bounded session budget."],
    ["Validate the coach composer with 50+ personas", "Run a reproducible persona evaluation and publish the failure taxonomy and decision evidence."],
  ],
  "O-38": [
    ["Extract Practice screen controller", "Move Practice orchestration into a testable controller without redesigning the screen."],
    ["Move Flutter infrastructure behind typed gateways", "Introduce the smallest session, take, summary, and feedback gateway seams, then remove direct infrastructure globals from the affected screens."],
  ],
};

const expanded = [];
const splitAudit = [];
for (const legacy of legacyTickets) {
  const legacyId = String(legacy.data.id);
  if (legacyId === "O-1") {
    splitAudit.push({
      legacy_id: legacyId,
      disposition: "package",
      reason: "The source refinement already created and completed O-53 and O-54 for the release-blocking outcomes; later catalog, Android, privacy, and product follow-ups do not block this completed package.",
      target_legacy: ["O-53", "O-54"],
      targets: [],
    });
    continue;
  }
  const splits = splitDefinitions[legacyId];
  if (!splits) {
    expanded.push({ legacy, title: String(legacy.data.title), outcome: legacy.sections.get("outcome"), splitIndex: null });
    continue;
  }
  const targets = [];
  for (let index = 0; index < splits.length; index += 1) {
    expanded.push({ legacy, title: splits[index][0], outcome: splits[index][1], splitIndex: index + 1 });
    targets.push(index);
  }
  splitAudit.push({ legacy_id: legacyId, disposition: "split", reason: "The source contract explicitly combines independently demonstrable outcomes with different verification paths.", targets });
}

if (legacyTickets.length !== 112) {
  throw new Error(`The reviewed source snapshot contained 112 tickets, but the workspace now contains ${legacyTickets.length}; inspect the new source state before regenerating.`);
}

const idMap = new Map();
expanded.forEach((item, index) => {
  item.id = `T-${String(index + 1).padStart(3, "0")}`;
  const legacyId = String(item.legacy.data.id);
  idMap.set(legacyId, [...(idMap.get(legacyId) ?? []), item.id]);
});
for (const audit of splitAudit) {
  audit.targets = audit.target_legacy
    ? audit.target_legacy.flatMap((legacyId) => idMap.get(legacyId) ?? [])
    : idMap.get(audit.legacy_id) ?? [];
  delete audit.target_legacy;
}

const packageDefinitions = [
  { id: "P-001", kind: "milestone", status: "done", title: "TestFlight release readiness", goal: "Make the beta honest, private, observable, and submittable.", legacy: ["O-53", "O-54"] },
  { id: "P-002", kind: "mission", status: "backlog", title: "Coach composer and learning loop", goal: "Turn measured practice history into an explainable next session.", legacy: ["O-9", "O-100", "O-101", "O-106", "O-107", "O-108", "O-109"] },
  { id: "P-003", kind: "batch", status: "backlog", title: "Flutter surface decomposition", goal: "Make the three large player surfaces independently testable without a redesign.", legacy: ["O-38"] },
  { id: "P-004", kind: "milestone", status: "backlog", title: "Recommendation acceptance loop", goal: "Generate, explain, accept, and safely persist coach recommendations.", legacy: ["O-2", "O-31", "O-32", "O-33", "O-34", "O-35", "O-96", "O-104", "O-111"] },
  { id: "P-005", kind: "mission", status: "backlog", title: "Scoring trust", goal: "Make every displayed score measurable, interpretable, and safe under missing audio.", legacy: ["O-10", "O-69", "O-70", "O-73", "O-74", "O-75", "O-78", "O-82", "O-83", "O-84", "O-90", "O-91"] },
  { id: "P-006", kind: "batch", status: "backlog", title: "English product consistency", goal: "Keep interface, coach output, voice, and generated practice content in the selected language.", legacy: ["O-94", "O-96", "O-97", "O-99", "O-103", "O-104", "O-105", "O-110", "O-111", "O-112"] },
];

const ticketPackages = new Map();
for (const pkg of packageDefinitions) {
  pkg.tickets = pkg.legacy.flatMap((legacyId) => idMap.get(legacyId) ?? []);
  for (const ticketId of pkg.tickets) if (!ticketPackages.has(ticketId)) ticketPackages.set(ticketId, pkg.id);
}

const profileFor = (legacy) => {
  const type = String(legacy.data.type ?? "other");
  if (type === "bug") return ["bug"];
  if (["research", "decision"].includes(type)) return ["discovery"];
  if (type === "operations") return ["workflow"];
  if (type === "feature" && ["app", "gtm"].includes(String(legacy.data.lane ?? ""))) return ["ui"];
  return [];
};

const profileSections = (profile, item) => {
  const why = cleanText(item.legacy.sections.get("why"), item.outcome);
  const outcome = cleanText(item.outcome, String(item.legacy.data.title));
  const blocks = {
    bug: [
      ["Actual behaviour", why], ["Expected behaviour", outcome], ["Reproduction steps", "Use the concrete evidence and reproduction described in the migrated legacy contract."],
      ["Environment", `one&a · ${item.legacy.data.lane || "cross-cutting"} lane`], ["Frequency", "Preserve the observed frequency from the source evidence; measure again before implementation."],
      ["Impact", why], ["Regression-test expectation", "Add a deterministic regression at the closest public seam."],
    ],
    discovery: [
      ["Decision to be supported", outcome], ["Research question", why], ["Hypotheses", "The source contract contains the current evidence and competing explanations."],
      ["Method", "Inspect repository evidence, run the smallest representative measurement, and record uncertainty."], ["Time or depth limit", "Stop when the stated decision can be made with explicit confidence."],
      ["Expected output", "A decision-ready evidence note and the smallest follow-up ticket set."], ["Decision criterion", "The product owner can choose without inventing missing evidence."],
    ],
    workflow: [
      ["Actors", "Player, coach, operator, and the responsible delivery agent where applicable."], ["Initial state", why], ["States", "Use only the states already present in the product and this ticket contract."],
      ["Transitions", outcome], ["Triggers", "The user or operational action described by the source contract."], ["Permissions", "Preserve existing authorization and privacy boundaries."],
      ["Error paths", "Failures remain visible and retryable without silent partial completion."], ["Cancellation path", "Cancellation leaves canonical repository and product state valid."],
      ["Retry and duplicate-action behaviour", "Retries are idempotent or explicitly rejected."], ["Audit and notification expectations", "Record material state changes; notify only the actor who can respond."],
    ],
    ui: [
      ["User goal", outcome], ["Entry point", `The existing ${item.legacy.data.lane || "product"} surface named in the source contract.`], ["Default state", why],
      ["Loading state", "Keep the current context visible while work is pending."], ["Empty state", "Explain why no content exists and provide the next valid action."], ["Error state", "Show an actionable error without discarding user input."],
      ["Success state", outcome], ["Disabled state", "Unavailable actions remain visibly disabled with an accessible explanation."], ["Responsive behaviour", "Preserve hierarchy from phone through desktop web."],
      ["Keyboard and focus behaviour", "All actions are keyboard reachable and focus follows state changes predictably."], ["Accessibility expectations", "Labels, contrast, focus, and semantics meet the platform baseline."],
      ["Visual reference", "Use the existing one&a product language; the migration does not authorize a redesign."],
    ],
  };
  return (blocks[profile] ?? []).map(([title, body]) => `## ${title}\n\n${body}`).join("\n\n");
};

const statusOverrides = new Map([
  ["O-2", { state: "done", resolution: "completed", reason: "Confirmed complete by the product owner during A-Team migration review on 2026-07-21; the legacy Scrum status is stale." }],
]);

const mapStatus = (legacyStatus, legacyId) => {
  if (statusOverrides.has(legacyId)) return statusOverrides.get(legacyId);
  if (legacyStatus === "done") return { state: "done", resolution: "completed" };
  if (legacyStatus === "rejected") return { state: "done", resolution: "obsolete" };
  return { state: "backlog", resolution: null };
};

const priorityMap = { P0: "critical", P1: "high", P2: "medium", P3: "low" };
const migrationRecords = [];

rmSync(demoRoot, { recursive: true, force: true });
for (const directory of ["backlog", "ready", "active", "review", "done", "findings/new", "findings/resolved", "packages/backlog", "packages/ready", "packages/active", "packages/done", "profiles", "claims", "decisions"]) {
  mkdirSync(join(workspace, directory), { recursive: true });
}
for (const filename of readdirSync(resolve("profiles")).filter((name) => name.endsWith(".yaml"))) {
  cpSync(resolve("profiles", filename), join(workspace, "profiles", filename));
}

for (const item of expanded) {
  const legacy = item.legacy;
  const legacyId = String(legacy.data.id);
  const status = mapStatus(String(legacy.data.status), legacyId);
  const profiles = profileFor(legacy);
  const dependencies = [...new Set([...(legacy.sections.get("dependencies") ?? "").matchAll(/O-\d+/g)].flatMap((match) => idMap.get(match[0]) ?? []))];
  const openQuestions = cleanText(legacy.sections.get("open questions"), "None.");
  const hasBlockingQuestions = openQuestions !== "None.";
  const acceptance = cleanText(legacy.sections.get("acceptance criteria"), `- The outcome is observable: ${cleanText(item.outcome, item.title)}`);
  const verification = cleanText(legacy.sections.get("verification"), "- Verify the observable outcome against the source evidence and the affected product seam.");
  const scope = cleanText(legacy.sections.get("scope") ?? legacy.sections.get("scope notes") ?? legacy.sections.get("known context") ?? legacy.sections.get("context"), cleanText(legacy.sections.get("why"), "The migrated source contract defines the bounded scope."));
  const nonGoals = cleanText(legacy.sections.get("out of scope"), "No additional non-goals were stated in the legacy contract.");
  const reviewEvidence = status.state === "done" ? `\n\n## Review evidence\n\n${status.reason ?? cleanText(legacy.sections.get("result"), `Legacy ${legacy.data.status} state preserved during migration preview.`)}` : "";
  const bodyProfiles = profiles.map((profile) => profileSections(profile, item)).filter(Boolean).join("\n\n");
  const content = `# ${item.id} — ${item.title}\n\n## Outcome\n\n${cleanText(item.outcome, item.title)}\n\n## Scope\n\n${scope}\n\n## Non-goals\n\n${nonGoals}\n\n## Acceptance\n\n${acceptance}\n\n## Verification\n\n${verification}\n\n## Constraints\n\nMigrated from ${legacyId}; lane: ${legacy.data.lane || "cross-cutting"}; legacy status: ${legacy.data.status}.\n\n## Open decisions\n\n${openQuestions}\n\n${bodyProfiles ? `${bodyProfiles}\n\n` : ""}${reviewEvidence}\n\n## Execution notes\n\nMigration preview only. Source: scrum/tickets/${legacy.filename}. No product implementation or human ready approval is implied.\n`;
  const createdAt = String(legacy.data.created_at ?? today).slice(0, 10);
  const data = {
    id: item.id,
    title: item.title,
    status: status.state,
    origin: "imported",
    types: [String(legacy.data.type ?? "other")],
    profiles,
    priority: priorityMap[legacy.backlog.priority] ?? "medium",
    risk: String(legacy.data.type) === "bug" ? "high" : "medium",
    package: ticketPackages.get(item.id) ?? null,
    depends_on: dependencies,
    blocks: [],
    branch: null,
    pull_request: null,
    created_at: createdAt,
    updated_at: today,
    ...(status.resolution ? { resolution: status.resolution } : {}),
    ...(legacy.data.status === "parked" ? { blocked: true, blocked_reason: "Legacy work was parked; human reactivation is required." } : {}),
  };
  const filename = `${item.id}-${slugify(item.title)}.md`;
  writeFileSync(join(workspace, status.state, filename), matter.stringify(content, data));
  migrationRecords.push({
    id: item.id,
    legacy_id: legacyId,
    legacy_title: String(legacy.data.title),
    title: item.title,
    lane: legacy.data.lane || "cross-cutting",
    legacy_status: legacy.data.status,
    status: status.state,
    backlog_section: legacy.backlog.section,
    story_points: legacy.data.story_points ?? null,
    priority_source: legacy.backlog.priority,
    ready_candidate: status.state === "backlog" && !hasBlockingQuestions && acceptance.length > 20 && verification.length > 20 && legacy.data.status !== "parked",
    status_correction: status.reason ?? null,
    split: item.splitIndex !== null,
    source_file: `scrum/tickets/${legacy.filename}`,
  });
}

for (const pkg of packageDefinitions) {
  const data = {
    id: pkg.id, kind: pkg.kind, title: pkg.title, status: pkg.status, tickets: pkg.tickets,
    execution: { mode: "dependency-aware", parallelism: 2, stop_on_failure: true },
    authority: { create_findings: true, create_subtickets: false, reorder_independent_tickets: true, change_scope: false },
    created_at: today, updated_at: today,
  };
  const content = `# ${pkg.id} — ${pkg.title}\n\n## Goal\n\n${pkg.goal}\n\n## Completion\n\nEvery referenced ticket is accepted and done; obsolete items have an explicit disposition.\n\n## Execution notes\n\nMigration preview package. Ordering remains dependency-aware and requires human commitment before execution.\n`;
  writeFileSync(join(workspace, "packages", pkg.status, `${pkg.id}-${slugify(pkg.title)}.md`), matter.stringify(content, data));
}

const statusCounts = migrationRecords.reduce((counts, ticket) => ({ ...counts, [ticket.status]: (counts[ticket.status] ?? 0) + 1 }), {});
const metadata = {
  project: "one&a",
  source_workspace: sourceRoot,
  source_snapshot: "main @ 2026-07-21",
  generated_at: `${today}T12:00:00+02:00`,
  legacy_ticket_count: legacyTickets.length,
  migrated_ticket_count: migrationRecords.length,
  package_count: packageDefinitions.length,
  status_counts: statusCounts,
  ready_candidate_count: migrationRecords.filter((ticket) => ticket.ready_candidate).length,
  split_audit: splitAudit,
  tickets: migrationRecords,
  packages: packageDefinitions.map(({ legacy, ...pkg }) => pkg),
};
writeFileSync(join(workspace, "migration.json"), `${JSON.stringify(metadata, null, 2)}\n`);
writeFileSync(join(workspace, "config.yaml"), stringify({
  version: 1,
  project: { name: "one&a migration preview" },
  workflow: { require_human_ready_approval: true, require_human_done_approval: true, allow_agent_findings: true, allow_agent_ready_tickets: false },
  git: { base_branch: "main", protected_branches: ["main", "master", "develop"], worktrees: "auto", worktree_root: ".worktrees", branch_pattern: "{prefix}/{id}-{slug}" },
  packages: { default_parallelism: 2, stop_on_failure: true },
  validation: { strict: true, reject_unknown_profiles: true, require_verification_for_ready: true, require_review_evidence_for_done: true },
}));
writeFileSync(join(workspace, "README.md"), "# one&a A-Team migration preview\n\nGenerated from the legacy Scrum files without modifying the source workspace.\n");
writeFileSync(join(workspace, "index.md"), `# A-Team Status\n\n> Generated migration preview. Do not edit manually.\n\n- ${metadata.migrated_ticket_count} atomic tickets from ${metadata.legacy_ticket_count} legacy sources\n- ${metadata.package_count} proposed packages\n- ${metadata.ready_candidate_count} backlog tickets have enough evidence to discuss readiness\n`);
writeFileSync(join(demoRoot, "README.md"), `# one&a migration UI fixture\n\nGenerated from \`${sourceRoot}/scrum\`. Source files remain untouched.\n\nRun:\n\n\`\`\`bash\nnpm run build\nnode dist/cli/index.js ui --workspace ${workspace} --port 4311\n\`\`\`\n`);

console.log(JSON.stringify({ ok: true, source: legacyTickets.length, migrated: migrationRecords.length, packages: packageDefinitions.length, output: workspace }, null, 2));
