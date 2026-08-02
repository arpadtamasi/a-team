import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* ══ Kotta Console v2 ═══════════════════════════════════
   The board reads. Every state change happens through the CLI, so nothing here
   posts: the only request this module makes is GET /api/workspace.
   Layout, wording and behaviour come from design/kotta/Kotta Console v2.dc.html;
   every colour, space and radius comes from the Modernist tokens in styles.css. */

/* ── Types ───────────────────────────────────────────── */
type Status = "backlog" | "ready" | "active" | "review" | "done";
type Migration = {
  project: string;
  legacy_ticket_count: number;
  migrated_ticket_count: number;
  ready_candidate_count: number;
  package_count: number;
  split_audit: Array<{ legacy_id: string; disposition: string; reason: string; targets: string[] }>;
};
type Ticket = {
  id: string; title: string; status: Status; types: string[]; profiles: string[]; priority: string; risk: string;
  package: string | null; depends_on: string[]; blocks?: string[]; blocked?: boolean; resolution?: string;
  source_finding?: string | null; assigned_agent?: string | null; worktree?: string | null;
  branch?: string | null; pull_request?: string | null; created_at?: string | null; updated_at?: string | null; sections: Record<string, string>;
  migration?: { legacy_id: string; legacy_title: string; lane: string; legacy_status: string; backlog_section: string; story_points: number | null; ready_candidate: boolean; split: boolean; status_correction?: string | null; source_file: string } | null;
};
type Package = {
  id: string; title: string; status: string; kind: string; tickets: string[]; sections: Record<string, string>;
  created_at?: string | null; updated_at?: string | null;
  execution?: { mode?: string; parallelism?: number; stop_on_failure?: boolean };
  coordinator?: { branch?: string; base_branch?: string; base_commit?: string; cleaned_at?: string | null } | null;
};
type Finding = {
  id: string; title: string; status: "new" | "resolved"; finding_type: string; severity: string; confidence: string;
  discovered_during?: string | null; created_at?: string | null; resolution?: string; became?: string | null; sections: Record<string, string>;
};
type Decision = { id: string; title: string; date: string | null; sections: Record<string, string> };
type Diagnostic = { entity: string; id: string; worktree: string; message: string };
export type Workspace = {
  project: string; workspace?: string; migration: Migration | null;
  tickets: Ticket[]; packages: Package[]; findings: Finding[]; decisions?: Decision[]; diagnostics?: Diagnostic[];
};

/** The rail's five destinations. `running` is an overlay over any of them, not a sixth destination. */
export type View = "home" | "observations" | "contracts" | "batches" | "decisions";

/* Reporting leaves the workspace: the board never writes a report, it hands off to GitHub. */
const BUG_REPORT_URL = "https://github.com/arpadtamasi/kotta/issues/new?template=bug.yml";
/* The one request the board makes. Named so a test can assert nothing else is ever called. */
export const WORKSPACE_ENDPOINT = "/api/workspace";
/* Stored state is `ready`; the board says `defined`, as the design does. Renaming the stored value is P-004. */
const DEFINED: Status = "ready";
const CONTRACT_STATES: Status[] = ["backlog", "ready", "active", "review", "done"];

/* Identity is mixed for good (D-010): sequential ids stay, minted ones are `<type>-<26 char ULID>`. */
const MINTED_BODY = "[0-9a-hjkmnp-tv-z]{26}";
const ENTITY_SOURCE = `(?:O-\\d+(?:\\.\\d+)?|[TFPD]-\\d+|[TFPD]-${MINTED_BODY})`;
const ENTITY_PATTERN = new RegExp(`\\b${ENTITY_SOURCE}\\b`, "g");
const MINTED_ID = new RegExp(`^[TFPD]-${MINTED_BODY}$`);
/* Non-global twin of ENTITY_PATTERN: `.test` on a /g regex carries lastIndex between calls. */
const ID_TEST = new RegExp(`^${ENTITY_SOURCE}$`);

/** The short tail of a minted id — the part a human can still recognise (D-003). */
export function displayId(id: string): string {
  return MINTED_ID.test(id) ? `${id.slice(0, id.indexOf("-") + 1)}${id.slice(-8)}` : id;
}
const entityTitles = new Map<string, string>();
/** Human reference is the title; the raw id rides along for recall (D-003, D-01kz1yqm…). */
function entityLabel(id: string): string {
  const title = entityTitles.get(id);
  return title ? `${title} · ${id}` : id;
}
function titleOf(id: string): string | null {
  return entityTitles.get(id) ?? null;
}
function stampSuffix(id: string): "t" | "f" | "p" | "d" {
  if (/^P-/.test(id)) return "p";
  if (/^F-/.test(id)) return "f";
  if (/^D-/.test(id)) return "d";
  return "t"; // T- and legacy O-
}

/* ── Time ────────────────────────────────────────────── */
function parseDate(value?: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(parsed) ? null : parsed;
}
export function daysSince(value?: string | null, now = Date.now()): number | null {
  const then = parseDate(value);
  return then === null ? null : Math.max(0, Math.floor((now - then) / 86_400_000));
}
function relativeTime(iso?: string | null): string {
  const then = parseDate(iso);
  if (then === null) return "—";
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.round(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.round(secs / 3600)}h ago`;
  return `${Math.round(secs / 86400)}d ago`;
}

/* ── Markdown + entity links ─────────────────────────── */
type MarkdownNode = { type: string; value?: string; url?: string; children?: MarkdownNode[] };
function remarkEntityLinks() {
  return (tree: MarkdownNode) => {
    const visit = (node: MarkdownNode) => {
      if (!node.children || node.type === "link" || node.type === "code" || node.type === "inlineCode") return;
      node.children = node.children.flatMap((child) => {
        if (child.type !== "text" || !child.value) { visit(child); return [child]; }
        const pieces: MarkdownNode[] = [];
        let cursor = 0;
        for (const match of child.value.matchAll(ENTITY_PATTERN)) {
          const index = match.index ?? 0;
          if (index > cursor) pieces.push({ type: "text", value: child.value.slice(cursor, index) });
          pieces.push({ type: "link", url: `entity:${match[0]}`, children: [{ type: "text", value: match[0] }] });
          cursor = index + match[0].length;
        }
        if (!pieces.length) return [child];
        if (cursor < child.value.length) pieces.push({ type: "text", value: child.value.slice(cursor) });
        return pieces;
      });
    };
    visit(tree);
  };
}
function normalizeMarkdown(value: string): string {
  return value.replace(/([^\n])(?=#{2,4}\s)/g, "$1\n\n");
}
/** In prose an entity reads as its title, with the id kept for recall (D-01kz1yqm…). */
export function MarkdownContent({ value, onEntity }: { value: string; onEntity: (id: string) => void }) {
  return <div className="prose"><ReactMarkdown
    remarkPlugins={[remarkGfm, remarkEntityLinks]}
    urlTransform={(url) => (/^(?:https?:|mailto:|#|entity:)/.test(url) ? url : "#")}
    components={{ a: ({ href = "", children }) => {
      const label = String(children);
      const entityId = href.startsWith("entity:") ? href.slice(7) : label.match(ENTITY_PATTERN)?.[0];
      if (entityId) {
        const known = titleOf(entityId);
        return <button type="button" className={`ref ref-${stampSuffix(entityId)}`} title={entityLabel(entityId)} onClick={() => onEntity(entityId)}>
          {known ?? entityId}{known ? <span className="ref__tail">{displayId(entityId)}</span> : null}
        </button>;
      }
      if (/^https?:|^mailto:/.test(href)) return <a href={href} target="_blank" rel="noreferrer noopener">{children}</a>;
      return <span>{children}</span>;
    } }}
  >{normalizeMarkdown(value)}</ReactMarkdown></div>;
}

/* ── Derivation of everything the board shows ────────── */
export type Queue = { key: string; count: number; label: string; ask: string; age: number | null; view: View; filter?: Status };
export type Contradiction = {
  key: string; kind: string; subject: string; subjectId: string | null; title: string;
  leftLabel: string; left: string[]; rightLabel: string; right: string[]; command: string; action: string; view: View;
};
export type MenuItem = { id: string; title: string; batch: string | null; why: string; command: string };

export type Board = {
  tickets: Ticket[]; packages: Package[]; findings: Finding[]; decisions: Decision[];
  ticketById: Map<string, Ticket>; packageById: Map<string, Package>; findingById: Map<string, Finding>;
  undisposed: Finding[]; inReview: Ticket[]; closable: Package[]; defined: Ticket[]; running: Ticket[]; activeBatches: Package[];
  queues: Queue[]; queueTotal: number; contradictions: Contradiction[]; menu: MenuItem[];
};

const isDone = (t?: Ticket) => t?.status === "done";

/** Everything the three bands, the rail counts and the header stats are derived from. */
export function readBoard(workspace: Workspace): Board {
  const tickets = workspace.tickets ?? [];
  const packages = workspace.packages ?? [];
  const findings = workspace.findings ?? [];
  const decisions = workspace.decisions ?? [];
  const ticketById = new Map(tickets.map((t) => [t.id, t]));
  const packageById = new Map(packages.map((p) => [p.id, p]));
  const findingById = new Map(findings.map((f) => [f.id, f]));
  // Every surface names an entity by its title, so the title index is part of reading the board.
  entityTitles.clear();
  for (const entity of [...tickets, ...packages, ...findings, ...decisions]) entityTitles.set(entity.id, entity.title);

  // The three queues are exactly where the CLI refuses without --approve.
  const undisposed = findings.filter((f) => f.status === "new");
  const inReview = tickets.filter((t) => t.status === "review");
  const closable = packages.filter((p) => p.status !== "done" && p.tickets.length > 0 && p.tickets.every((id) => isDone(ticketById.get(id))));
  // The backlog menu is deliberately NOT a queue: a defined contract is an option, not a debt.
  const defined = tickets.filter((t) => t.status === DEFINED);
  const running = tickets.filter((t) => t.status === "active");
  const activeBatches = packages.filter((p) => p.status === "active" || p.tickets.some((id) => ticketById.get(id)?.status === "active"));

  const oldest = (values: Array<string | null | undefined>) => values.reduce<number | null>((max, value) => {
    const age = daysSince(value);
    return age === null ? max : Math.max(max ?? 0, age);
  }, null);

  const queues: Queue[] = [
    { key: "observations", count: undisposed.length, label: "Observations without a disposition", ask: "yes / no · then it is gone", age: oldest(undisposed.map((f) => f.created_at)), view: "observations" },
    { key: "review", count: inReview.length, label: "Contracts waiting for review", ask: "accept, or request changes", age: oldest(inReview.map((t) => t.updated_at)), view: "contracts", filter: "review" },
    { key: "batches", count: closable.length, label: "Batches waiting to be closed", ask: "every member is done", age: oldest(closable.map((p) => p.updated_at)), view: "batches" },
  ];

  const label = (id: string) => titleOf(id) ?? id;
  const contradictions: Contradiction[] = [];
  // 1. Files and git disagree about the same contract — the board shows both and picks neither.
  for (const diagnostic of workspace.diagnostics ?? []) {
    const ticket = ticketById.get(diagnostic.id);
    contradictions.push({
      key: `drift:${diagnostic.id}`, kind: "state drift", subject: label(diagnostic.id), subjectId: diagnostic.id,
      title: "A live worktree disagrees with the committed contract",
      leftLabel: "files say", left: [`state: ${stateLabel(ticket?.status ?? "unknown")}`, `.kotta/${ticket?.status ?? "?"}/`],
      rightLabel: "git says", right: [diagnostic.worktree, diagnostic.message],
      command: "kotta validate", action: "Open contract", view: "contracts",
    });
  }
  // 2. A recorded link with nothing behind it. `kotta validate` reports the same ones it can see.
  const dangling = (from: string, field: string, target: string, kind: string) => contradictions.push({
    key: `dangling:${from}:${field}:${target}`, kind: "dangling reference", subject: label(from), subjectId: from,
    title: `${field} points at ${kind} that is not on disk`,
    leftLabel: "frontmatter says", left: [`${field}: ${target}`],
    rightLabel: "disk says", right: ["no such file", "the link is recorded, the entity is gone"],
    command: "kotta validate", action: "Open contract", view: "contracts",
  });
  for (const ticket of tickets) {
    if (ticket.source_finding && !findingById.has(ticket.source_finding)) dangling(ticket.id, "source_finding", ticket.source_finding, "an observation");
    if (ticket.package && !packageById.has(ticket.package)) dangling(ticket.id, "package", ticket.package, "a batch");
    for (const field of ["depends_on", "blocks"] as const) {
      for (const reference of ticket[field] ?? []) if (!ticketById.has(reference)) dangling(ticket.id, field, reference, "a contract");
    }
  }
  for (const pkg of packages) for (const member of pkg.tickets) if (!ticketById.has(member)) dangling(pkg.id, "tickets", member, "a contract");
  for (const finding of findings) if (finding.became && !ticketById.has(finding.became)) dangling(finding.id, "became", finding.became, "a contract");
  // 3. Membership recorded on one side only: two files describe the same relationship differently.
  for (const ticket of tickets) {
    const pkg = ticket.package ? packageById.get(ticket.package) : null;
    if (pkg && !pkg.tickets.includes(ticket.id)) contradictions.push({
      key: `member:${ticket.id}`, kind: "membership", subject: label(ticket.id), subjectId: ticket.id,
      title: "The contract claims a batch that does not list it",
      leftLabel: "the contract says", left: [`package: ${pkg.id}`],
      rightLabel: "the batch says", right: [`tickets: ${pkg.tickets.length ? pkg.tickets.map(displayId).join(", ") : "—"}`],
      command: `kotta package validate ${pkg.id}`, action: "See batches", view: "batches",
    });
  }
  for (const pkg of packages) for (const member of pkg.tickets) {
    const ticket = ticketById.get(member);
    if (ticket && ticket.package !== pkg.id) contradictions.push({
      key: `member:${pkg.id}:${member}`, kind: "membership", subject: label(pkg.id), subjectId: pkg.id,
      title: "The batch lists a contract that belongs elsewhere",
      leftLabel: "the batch says", left: [`tickets: … ${displayId(member)}`],
      rightLabel: "the contract says", right: [`package: ${ticket.package ?? "null"}`],
      command: `kotta package validate ${pkg.id}`, action: "See batches", view: "batches",
    });
  }

  const menu: MenuItem[] = defined.map((ticket) => {
    const waiting = (ticket.depends_on ?? []).filter((id) => !isDone(ticketById.get(id)));
    const unblocks = (ticket.blocks ?? []).length;
    return {
      id: ticket.id, title: ticket.title, batch: ticket.package,
      why: waiting.length ? `waits on ${waiting.map((id) => titleOf(id) ?? displayId(id)).join(", ")}`
        : unblocks ? `unblocks ${unblocks} other${unblocks === 1 ? "" : "s"}` : "no blockers",
      command: `kotta ticket execute ${ticket.id} --agent codex`,
    };
  });

  return {
    tickets, packages, findings, decisions, ticketById, packageById, findingById,
    undisposed, inReview, closable, defined, running, activeBatches,
    queues, queueTotal: undisposed.length + inReview.length + closable.length, contradictions, menu,
  };
}

/* ── Small presentational bits ───────────────────────── */
/* Display label only — the stored status stays `ready` until the rename ticket lands. */
export const stateLabel = (s: string) => (s === "ready" ? "defined" : s);
function StateTag({ state }: { state: string }) {
  return <span className={`tag state state-${state}`}>{stateLabel(state)}</span>;
}
function ClaimDot({ agent }: { agent?: string | null }) {
  const cls = agent === "codex" ? "dot-codex" : agent === "claude" ? "dot-claude" : "dot-none";
  return <span className={`dot ${cls}`} aria-hidden="true" />;
}
/** The small monospace id marker the design puts beside a title. Never the label on its own. */
function Tail({ id }: { id: string }) {
  return <span className={`tail tail-${stampSuffix(id)}`}>{displayId(id)}</span>;
}
/** A row that opens an entity: the title is the accessible name, the id rides in `title`. */
function EntityButton({ id, className, children, onOpen }: { id: string; className: string; children: ReactNode; onOpen: (id: string) => void }) {
  return <button type="button" className={className} title={entityLabel(id)} onClick={() => onOpen(id)}>{children}</button>;
}
function CopyCommand({ command, label = "Copy" }: { command: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return <span className="cmd">
    <code>{command}</code>
    <button type="button" className="btn btn-ghost btn-sm" aria-label={`Copy command: ${command}`} onClick={() => {
      void navigator.clipboard?.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_200);
    }}>{copied ? "Copied" : label}</button>
  </span>;
}
function Placeholder({ rows = 3, label }: { rows?: number; label: string }) {
  return <div className="ph" role="status" aria-live="polite">
    <span className="visually-hidden">{label}</span>
    {Array.from({ length: rows }, (_, i) => <span key={i} className="ph__row" aria-hidden="true" />)}
  </div>;
}

/* ══ The mark ══════════════════════════════════════════
   A staff: three rules with the red note-head standing ON the middle one, never
   between two. Four rules above 24px, three below, two below 18px (Kotta Logo). */
export function BrandMark({ size = 22 }: { size?: number }) {
  const rules = size >= 24 ? 4 : size >= 18 ? 3 : 2;
  const step = 6, top = (30 - (rules - 1) * step) / 2 - 1;
  const lines = Array.from({ length: rules }, (_, i) => top + i * step);
  const head = lines[Math.min(rules - 1, Math.floor((rules - 1) / 2) + (rules % 2 === 0 ? 1 : 0))];
  return <svg className="mark" width={size} height={size} viewBox="0 0 30 30" aria-hidden="true" focusable="false">
    <rect width="30" height="30" className="mark__ground" />
    {lines.map((y) => <rect key={y} y={y} width="30" height="2" className="mark__rule" />)}
    <rect x="16" y={head - 2} width="6" height="6" className="mark__head" />
  </svg>;
}

/* ══ The rail ══════════════════════════════════════════ */
export function Rail({ view, onView, board, running, onWatch, refreshed }: {
  view: View; onView: (v: View) => void; board: Board | null; running: boolean; onWatch: () => void; refreshed: number;
}) {
  const chain: Array<{ id: View; step: string; label: string; sub: string; count: number | null }> = [
    { id: "observations", step: "01", label: "Observations", sub: "new information", count: board ? board.undisposed.length : null },
    { id: "contracts", step: "02", label: "Contracts", sub: "tickets", count: board ? board.tickets.length : null },
    { id: "batches", step: "03", label: "Batches", sub: "sequencing", count: board ? board.packages.length : null },
  ];
  const runningCount = board ? board.running.length : 0;
  const batchCount = board ? board.activeBatches.length : 0;
  return <nav className="rail" aria-label="Board sections">
    <div className="rail__head">
      <BrandMark />
      <h1 className="rail__brand">KOTTA</h1>
      <span className="rail__version">v2</span>
    </div>
    <button type="button" className={`rail__home ${view === "home" ? "is-active" : ""}`} aria-current={view === "home" ? "page" : undefined} onClick={() => onView("home")}>
      <span className="rail__home-label">Home</span>
      <span className="rail__count">{board ? board.queueTotal : "—"}</span>
    </button>
    <div className="rail__group">derivation chain</div>
    {chain.map((item) => <button key={item.id} type="button" className={`rail__item ${view === item.id ? "is-active" : ""}`}
      aria-current={view === item.id ? "page" : undefined} onClick={() => onView(item.id)}>
      <span className="rail__step">{item.step}</span>
      <span className="rail__label"><b>{item.label}</b><span>{item.sub}</span></span>
      <span className="rail__count">{item.count ?? "—"}</span>
    </button>)}
    <div className="rail__group rail__group--cross">cross-cutting</div>
    <button type="button" className={`rail__item ${view === "decisions" ? "is-active" : ""}`}
      aria-current={view === "decisions" ? "page" : undefined} onClick={() => onView("decisions")}>
      <span className="rail__step">·</span>
      <span className="rail__label"><b>Decisions</b><span>quoted, not staged</span></span>
      <span className="rail__count">{board ? board.decisions.length : "—"}</span>
    </button>
    <div className="rail__foot">
      <button type="button" className={`rail__watch ${running ? "is-live" : ""}`} onClick={onWatch}>
        <span className="rail__watch-top">
          <span className={`pulse ${running ? "is-live" : ""}`} aria-hidden="true" />
          Running
          <span className="rail__count rail__count--watch">{runningCount}</span>
        </span>
        <span className="rail__watch-sub">
          {runningCount
            ? `${runningCount} contract${runningCount === 1 ? "" : "s"} under way in ${batchCount} batch${batchCount === 1 ? "" : "es"} · Watch →`
            : "Nothing is running · Watch →"}
        </span>
      </button>
      <a className="rail__report" href={BUG_REPORT_URL} target="_blank" rel="noreferrer noopener" aria-label="Report a bug — opens the Kotta issue form on GitHub">
        <span className="rail__key" aria-hidden="true">!</span> Report a bug <span aria-hidden="true">↗</span>
      </a>
      <div className="rail__report-note">Opens GitHub. Nothing from this workspace is sent — you write and submit the report there.</div>
      <div className="rail__meta">read from frontmatter · no per-file git<br />refreshed {refreshed}s ago</div>
    </div>
  </nav>;
}

/* ══ Header ════════════════════════════════════════════ */
function initials(project: string): string {
  const words = project.split(/[\s\-_/]+/).filter(Boolean);
  return (words.length > 1 ? words.slice(0, 2).map((w) => w[0]).join("") : project.slice(0, 2)).toUpperCase();
}
export function TopBar({ workspace, board, onHelp, onRefresh, refreshed }: {
  workspace: Workspace | null; board: Board | null; onHelp: () => void; onRefresh: () => void; refreshed: number;
}) {
  const project = workspace?.project ?? "workspace";
  const stats: Array<{ label: string; value: string; hot?: boolean }> = [
    { label: "waiting on you", value: board ? String(board.queueTotal) : "—", hot: Boolean(board?.queueTotal) },
    { label: "running", value: board ? `${board.running.length} in ${board.activeBatches.length} batch${board.activeBatches.length === 1 ? "" : "es"}` : "—" },
    { label: "defined and ready", value: board ? String(board.defined.length) : "—" },
    { label: "contradictions", value: board ? String(board.contradictions.length) : "—", hot: Boolean(board?.contradictions.length) },
  ];
  return <header className="top">
    <div className="top__ws">
      <span className="top__mark">{initials(project)}</span>
      <span className="top__ws-text">
        <span className="top__ws-name">{project}</span>
        <span className="top__ws-path">{workspace?.workspace ?? ".kotta/"}{typeof window !== "undefined" && window.location.port ? ` · port ${window.location.port}` : ""}</span>
      </span>
    </div>
    <div className="top__stats">
      {stats.map((stat) => <div key={stat.label} className="top__stat">
        <span className="top__stat-label">{stat.label}</span>
        <span className={`top__stat-value ${stat.hot ? "is-hot" : ""}`}>{stat.value}</span>
      </div>)}
    </div>
    <button type="button" className="top__action" onClick={onRefresh}>
      <span className="top__key" aria-hidden="true">↻</span> Refresh <span className="top__ago">{refreshed}s</span>
    </button>
    <button type="button" className="top__action" onClick={onHelp}><span className="top__key" aria-hidden="true">?</span> CLI</button>
  </header>;
}

/* ══ Running strip ═════════════════════════════════════ */
function RunningStrip({ board, onWatch, onOpen }: { board: Board; onWatch: () => void; onOpen: (id: string) => void }) {
  if (!board.running.length) return null;
  return <section className="live" aria-label="Running now">
    <div className="live__label"><span className="pulse is-live" aria-hidden="true" /> Running</div>
    <div className="live__items scroll" tabIndex={0} role="group" aria-label="Contracts running now">
      {board.running.map((ticket) => <EntityButton key={ticket.id} id={ticket.id} className="live__item" onOpen={onOpen}>
        <span className="live__item-title">{ticket.title}</span>
        <Tail id={ticket.id} />
        <span className="live__item-meta">{ticket.assigned_agent ?? "no claim"} · {relativeTime(ticket.updated_at)}</span>
      </EntityButton>)}
    </div>
    <button type="button" className="live__watch" onClick={onWatch}>Watch →</button>
  </section>;
}

/* ══ Home ══════════════════════════════════════════════ */
function BandHead({ id, title, children, tone }: { id: string; title: string; children: ReactNode; tone?: "alarm" }) {
  return <div className={`band__head ${tone === "alarm" ? "band__head--alarm" : ""}`}>
    <h2 id={id}>{title}</h2>
    <p>{children}</p>
  </div>;
}

export function HomeView({ workspace, board, error, onView, onOpen, onRetry }: {
  workspace: Workspace | null; board: Board | null; error: string | null;
  onView: (view: View, filter?: Status) => void; onOpen: (id: string) => void; onRetry: () => void;
}) {
  const loading = !board && !error;
  const emptyWorkspace = Boolean(board && !board.tickets.length && !board.findings.length && !board.packages.length);
  return <div className="home">
    <section className="band" aria-labelledby="band-waiting">
      <BandHead id="band-waiting" title="Waiting on you">
        Exactly where the CLI refuses without <code>--approve</code>. Queues are meant to be emptied — and they age.
      </BandHead>
      <div className="band__body">
        {loading && <Placeholder label="Reading the workspace…" />}
        {error && <BandError error={error} onRetry={onRetry} />}
        {board && !board.queueTotal && <p className="band__empty">Nothing waiting to decide. Every observation has a disposition, no contract sits in review, no batch is waiting to be closed.</p>}
        {board && board.queueTotal > 0 && board.queues.map((queue) => <button key={queue.key} type="button"
          className={`queue ${queue.count ? "" : "is-zero"}`} onClick={() => onView(queue.view, queue.filter)}>
          <span className="queue__top">
            <span className={`queue__n ${queue.age !== null && queue.age > 30 ? "is-hot" : ""}`}>{queue.count}</span>
            <span className="queue__label">{queue.label}</span>
          </span>
          <span className="queue__meta">
            <span className="queue__ask">{queue.ask}</span>
            <span className={`queue__age ${queue.age !== null && queue.age > 30 ? "is-hot" : ""}`}>{queue.age === null ? "no date on record" : `oldest ${queue.age}d`}</span>
          </span>
          {queue.age !== null && <span className="queue__bar"><span className={queue.age > 30 ? "is-hot" : ""} style={{ width: `${Math.min(100, (queue.age / 45) * 100)}%` }} /></span>}
        </button>)}
      </div>
      <p className="band__foot">The library is still behind the menu on the left — browsing did not go away, it just stopped being the opening screen.</p>
    </section>

    <section className="band band--alarm" aria-labelledby="band-contradictions">
      <BandHead id="band-contradictions" title="Doesn't add up" tone="alarm">
        Two sources disagree, or the data contradicts its own definition. The board will not pick a story.
      </BandHead>
      <div className="band__body">
        {loading && <Placeholder label="Reading the workspace…" />}
        {error && <BandError error={error} onRetry={onRetry} />}
        {board && !board.contradictions.length && <p className="band__empty">Nothing contradictory. Every recorded link resolves, and no worktree disagrees with its contract.</p>}
        {board?.contradictions.map((item) => <article key={item.key} className="contra">
          <div className="contra__top">
            <span className="contra__kind">{item.kind}</span>
            {item.subjectId
              ? <EntityButton id={item.subjectId} className="contra__subject" onOpen={onOpen}>{item.subject}<Tail id={item.subjectId} /></EntityButton>
              : <span className="contra__subject">{item.subject}</span>}
          </div>
          <h3 className="contra__title">{item.title}</h3>
          <div className="contra__cmp">
            <div>
              <div className="contra__side">{item.leftLabel}</div>
              {item.left.map((line, i) => <div key={i} className="contra__line">{line}</div>)}
            </div>
            <div className="contra__right">
              <div className="contra__side">{item.rightLabel}</div>
              {item.right.map((line, i) => <div key={i} className="contra__line">{line}</div>)}
            </div>
          </div>
          <div className="contra__foot">
            <CopyCommand command={item.command} />
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onView(item.view)}>{item.action}</button>
          </div>
        </article>)}
      </div>
    </section>

    <section className="band" aria-labelledby="band-menu">
      <BandHead id="band-menu" title="What runs next?">
        A menu, not a debt. {board ? board.defined.length : "—"} defined contracts are executable today — the question is which one, not whether you approve.
      </BandHead>
      <div className="band__body">
        {loading && <Placeholder label="Reading the workspace…" />}
        {error && <BandError error={error} onRetry={onRetry} />}
        {board && !board.menu.length && <p className="band__empty">
          Nothing defined to run. {emptyWorkspace
            ? "This workspace is empty — write the first contract with the CLI:"
            : "Shape a backlog contract until it validates, then define it:"}
          <br /><code>{emptyWorkspace ? 'kotta ticket new --title "…" --type feature' : "kotta ticket ready <id> --approve"}</code>
        </p>}
        {board?.menu.map((item, index) => <div key={item.id} className={`menu ${index === 0 ? "is-first" : ""}`}>
          <div className="menu__top">
            <EntityButton id={item.id} className="menu__title" onOpen={onOpen}>{item.title}</EntityButton>
            <Tail id={item.id} />
          </div>
          <div className="menu__meta">
            <span className={`tag ${item.batch ? "tag-neutral" : "tag-outline"}`}>{item.batch ? titleOf(item.batch) ?? item.batch : "no batch"}</span>
            <span className="menu__why">{item.why}</span>
          </div>
          <div className="menu__run">
            <CopyCommand command={item.command} label="Run next →" />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onOpen(item.id)}>Chain →</button>
          </div>
        </div>)}
        {board && board.menu.length > 0 && <button type="button" className="band__more" onClick={() => onView("contracts", DEFINED)}>See all {board.defined.length} defined →</button>}
      </div>
      {board && board.menu.length > 0 && <p className="band__foot">If these sat in the queue, the opening screen would show a {board.defined.length}-item debt every morning that is not a debt.</p>}
    </section>
  </div>;
}

function BandError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return <div className="band__error" role="alert">
    <b>The workspace could not be read.</b>
    <p>Tried <code>GET {WORKSPACE_ENDPOINT}</code> — {error}</p>
    <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>Retry</button>
  </div>;
}

/* ══ Observations ══════════════════════════════════════ */
type ObsFilter = "waiting" | "dispositioned" | "all";
export function ObservationsView({ board, filter, onFilter, onOpen }: {
  board: Board; filter: ObsFilter; onFilter: (f: ObsFilter) => void; onOpen: (id: string) => void;
}) {
  const waiting = board.undisposed;
  const rows = board.findings.filter((f) => (filter === "all" ? true : filter === "waiting" ? f.status === "new" : f.status === "resolved"));
  const filters: Array<{ key: ObsFilter; label: string; count: number }> = [
    { key: "waiting", label: "waiting", count: waiting.length },
    { key: "dispositioned", label: "dispositioned", count: board.findings.length - waiting.length },
    { key: "all", label: "all", count: board.findings.length },
  ];
  return <div className="view">
    <div className="view__head">
      <div>
        <div className="view__step">01 · new information</div>
        <h2>Observations</h2>
        <p>What was noticed, from outside or from inside a run. Each one waits for one yes/no — and stales.</p>
      </div>
      <div className="view__note">stored as <b>finding</b> on disk<br />rename → observation is a migration</div>
    </div>
    <div className="filters">
      <span className="filters__label">disposition</span>
      {filters.map((f) => <button key={f.key} type="button" className={`filter ${filter === f.key ? "is-active" : ""}`}
        aria-pressed={filter === f.key} onClick={() => onFilter(f.key)}>{f.label}<span>{f.count}</span></button>)}
      <span className="filters__path">.kotta/findings/</span>
    </div>
    {rows.length === 0 && <p className="view__empty">Nothing here — the {filter} list is empty.</p>}
    {rows.map((finding) => {
      const age = daysSince(finding.created_at);
      return <EntityButton key={finding.id} id={finding.id} className={`obs ${age !== null && age > 30 ? "is-stale" : ""}`} onOpen={onOpen}>
        <span className="obs__title">{finding.title}</span>
        <span className="obs__meta">
          <Tail id={finding.id} />
          <span className="tag tag-neutral">{finding.finding_type}</span>
          <span className={`tag sev-${finding.severity}`}>sev {finding.severity}</span>
          {finding.discovered_during && <span className="obs__during">seen during {titleOf(finding.discovered_during) ?? displayId(finding.discovered_during)}</span>}
          <span className={`obs__age ${age !== null && age > 30 ? "is-hot" : ""}`}>{age === null ? "no date" : `${age} days old`}</span>
          {finding.became && <span className="obs__became">→ {titleOf(finding.became) ?? displayId(finding.became)}</span>}
        </span>
      </EntityButton>;
    })}
    <p className="view__foot">{rows.length} shown · disposition writes the file and it leaves this list.</p>
  </div>;
}

/* ══ Contracts ═════════════════════════════════════════ */
export function ContractsView({ board, filter, onFilter, query, onQuery, onOpen }: {
  board: Board; filter: Status | "all"; onFilter: (f: Status | "all") => void; query: string; onQuery: (q: string) => void; onOpen: (id: string) => void;
}) {
  const needle = query.trim().toLowerCase();
  const rows = board.tickets
    .filter((t) => (filter === "all" ? true : t.status === filter))
    .filter((t) => !needle || `${t.id} ${t.title}`.toLowerCase().includes(needle));
  const count = (state: Status) => board.tickets.filter((t) => t.status === state).length;
  const filters: Array<{ key: Status | "all"; label: string; count: number }> = [
    { key: "all", label: "all", count: board.tickets.length },
    ...CONTRACT_STATES.map((state) => ({ key: state, label: stateLabel(state), count: count(state) })),
  ];
  return <div className="view">
    <div className="view__head">
      <div>
        <div className="view__step">02 · tickets</div>
        <h2>Contracts</h2>
        <p>One entity, five states. Done is a filter value here, not a place of its own.</p>
      </div>
      <label className="view__search">
        <span className="visually-hidden">Search contracts by title or id</span>
        <input className="input" value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search title or id…" />
      </label>
    </div>
    <div className="filters">
      <span className="filters__label">state</span>
      {filters.map((f) => <button key={f.key} type="button" className={`filter ${filter === f.key ? "is-active" : ""}`}
        aria-pressed={filter === f.key} onClick={() => onFilter(f.key)}>{f.label}<span>{f.count}</span></button>)}
      <span className="filters__path">.kotta/&lt;state&gt;/</span>
    </div>
    <div className="ctr__head" aria-hidden="true"><span>contract</span><span>state</span><span>came from</span><span>batch</span><span>claim</span></div>
    {rows.length === 0 && <p className="view__empty">No contract matches this filter{needle ? " and search" : ""}.</p>}
    {rows.map((ticket) => <EntityButton key={ticket.id} id={ticket.id} className="ctr" onOpen={onOpen}>
      <span className="ctr__title">{ticket.title}<Tail id={ticket.id} /></span>
      <span><StateTag state={ticket.blocked ? "blocked" : ticket.status} /></span>
      <span className="ctr__from">{ticket.source_finding ? titleOf(ticket.source_finding) ?? displayId(ticket.source_finding) : "—"}</span>
      <span className="ctr__batch">{ticket.package ? titleOf(ticket.package) ?? displayId(ticket.package) : "—"}</span>
      <span className="ctr__claim"><ClaimDot agent={ticket.assigned_agent} />{ticket.assigned_agent ?? "—"}</span>
    </EntityButton>)}
    <p className="view__foot">Showing {rows.length} of {board.tickets.length} · state comes from the directory the file lives in.</p>
  </div>;
}

/* ══ Batches ═══════════════════════════════════════════ */
export function BatchesView({ board, onOpen }: { board: Board; onOpen: (id: string) => void }) {
  return <div className="view">
    <div className="view__head">
      <div>
        <div className="view__step">03 · sequencing</div>
        <h2>Batches</h2>
        <p>Things that must be solved together — a module, or a clean-up. Reason, not calendar.</p>
      </div>
      <div className="view__note">{board.packages.length} batches · {board.activeBatches.length} active<br />grouped by reason, not by calendar</div>
    </div>
    {board.packages.length === 0 && <p className="view__empty">No batch on disk. A batch is written with <code>kotta package new</code>.</p>}
    <div className="cards">
      {board.packages.map((pkg) => {
        const members = pkg.tickets.map((id) => board.ticketById.get(id)).filter((t): t is Ticket => Boolean(t));
        const done = members.filter((t) => t.status === "done").length;
        const total = pkg.tickets.length;
        return <EntityButton key={pkg.id} id={pkg.id} className={`card-batch ${pkg.status === "active" ? "is-active" : ""}`} onOpen={onOpen}>
          <span className="card-batch__top">
            <StateTag state={pkg.status} />
            <span className="card-batch__frac">{done}/{total}</span>
          </span>
          <span className="card-batch__title">{pkg.title}<Tail id={pkg.id} /></span>
          <span className="bar"><span style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></span>
          <span className="card-batch__why">{firstLine(pkg.sections.goal) || "No goal recorded."}</span>
          <span className="card-batch__mode">{pkg.execution?.mode ?? "dependency-aware"} · parallelism {pkg.execution?.parallelism ?? 2}</span>
        </EntityButton>;
      })}
    </div>
  </div>;
}
function firstLine(value?: string): string {
  return (value ?? "").split("\n").map((line) => line.trim()).find(Boolean) ?? "";
}

/* ══ Decisions ═════════════════════════════════════════ */
export function DecisionsView({ board, onOpen }: { board: Board; onOpen: (id: string) => void }) {
  const decisions = [...board.decisions].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || b.id.localeCompare(a.id));
  return <div className="view">
    <div className="view__head">
      <div>
        <h2>Decisions</h2>
        <p>Not a stage in the chain — but not a flat list either. A decision can be narrowed or continued by a later one, and reading it alone then gives the wrong answer.</p>
      </div>
      <div className="view__note">.kotta/decisions/<br />never deleted, only narrowed</div>
    </div>
    {decisions.length === 0 && <p className="view__empty">No decision recorded yet. One is written with <code>kotta decision create --from &lt;file&gt; --approve</code>.</p>}
    {decisions.map((decision) => {
      const referenced = [...new Set((decision.sections.decision ?? "").match(new RegExp(`\\bD-(?:\\d+|${MINTED_BODY})\\b`, "g")) ?? [])].filter((id) => id !== decision.id);
      return <EntityButton key={decision.id} id={decision.id} className="dec" onOpen={onOpen}>
        <span className="dec__date">{decision.date ?? "—"}</span>
        <span className="dec__body">
          <span className="dec__title">{decision.title}<Tail id={decision.id} /></span>
          {referenced.length > 0 && <span className="dec__refs">reads with {referenced.map((id) => titleOf(id) ?? displayId(id)).join(" · ")}</span>}
        </span>
      </EntityButton>;
    })}
    <p className="view__foot">A decision is cross-cutting: it is quoted in the brief of everything that references it, together with whatever narrows or continues it. Nothing here is a stage, and nothing here is ever deleted.</p>
  </div>;
}

/* ══ Derivation ════════════════════════════════════════
   `came from` and `goes with` name their target by title; a link with nothing behind
   it is drawn as `dangling reference` — the one place a bare id is the message. */
type Link = { id: string; title: string | null; note?: string };
function Dangling({ field, id }: { field: string; id: string }) {
  return <div className="dangling">
    <div className="dangling__kind">dangling reference</div>
    <div className="dangling__text"><code>{field}: {id}</code> — no such entity on disk. The link is recorded but the file is gone.</div>
  </div>;
}
function LinkRow({ link, onOpen }: { link: Link; onOpen: (id: string) => void }) {
  return <EntityButton id={link.id} className="deriv__link" onOpen={onOpen}>
    <span className="deriv__link-title">{link.title ?? displayId(link.id)}</span>
    <Tail id={link.id} />
    {link.note && <span className="deriv__link-note">{link.note}</span>}
  </EntityButton>;
}

export function DerivationPanel({ id, board, onOpen }: { id: string; board: Board; onOpen: (id: string) => void }) {
  const ticket = board.ticketById.get(id);
  const pkg = board.packageById.get(id);
  const finding = board.findingById.get(id);

  // came from
  let came: ReactNode = <p className="deriv__none">Nothing records where this came from.</p>;
  if (ticket) {
    const source = ticket.source_finding;
    came = !source
      ? <p className="deriv__none">No <code>source_finding</code> recorded — written straight as a contract.</p>
      : board.findingById.has(source)
        ? <LinkRow link={{ id: source, title: titleOf(source), note: `disposition: contract · ${board.findingById.get(source)?.finding_type}` }} onOpen={onOpen} />
        : <Dangling field="source_finding" id={source} />;
  } else if (finding) {
    const during = finding.discovered_during;
    came = !during
      ? <p className="deriv__none">Not discovered during a contract — reported straight into the queue.</p>
      : board.ticketById.has(during)
        ? <LinkRow link={{ id: during, title: titleOf(during), note: "seen during this contract" }} onOpen={onOpen} />
        : <Dangling field="discovered_during" id={during} />;
  } else if (pkg) {
    came = <p className="deriv__none">A batch is written, not derived — it groups contracts by reason.</p>;
  }

  // goes with
  let goes: ReactNode = <p className="deriv__none">Nothing else goes with this.</p>;
  if (ticket) {
    const batch = ticket.package;
    const target = batch ? board.packageById.get(batch) : null;
    goes = !batch
      ? <p className="deriv__none">Not in a batch — nothing else has to be solved together with it.</p>
      : !target
        ? <Dangling field="package" id={batch} />
        : <>
          <LinkRow link={{ id: target.id, title: target.title, note: firstLine(target.sections.goal) }} onOpen={onOpen} />
          <div className="deriv__siblings">
            {target.tickets.filter((member) => member !== ticket.id).map((member) => {
              const sibling = board.ticketById.get(member);
              return sibling
                ? <EntityButton key={member} id={member} className="deriv__sibling" onOpen={onOpen}>
                  <span>{sibling.title}</span><StateTag state={sibling.status} />
                </EntityButton>
                : <div key={member} className="deriv__sibling"><Dangling field="tickets" id={member} /></div>;
            })}
          </div>
        </>;
  } else if (finding) {
    const became = finding.became;
    goes = !became
      ? <p className="deriv__none">No contract was written from this yet.</p>
      : board.ticketById.has(became)
        ? <LinkRow link={{ id: became, title: titleOf(became), note: "became this contract" }} onOpen={onOpen} />
        : <Dangling field="became" id={became} />;
  } else if (pkg) {
    goes = <div className="deriv__siblings">
      {pkg.tickets.length === 0 && <p className="deriv__none">No member contracts.</p>}
      {pkg.tickets.map((member) => {
        const sibling = board.ticketById.get(member);
        return sibling
          ? <EntityButton key={member} id={member} className="deriv__sibling" onOpen={onOpen}>
            <span>{sibling.title}</span><StateTag state={sibling.status} />
          </EntityButton>
          : <div key={member} className="deriv__sibling"><Dangling field="tickets" id={member} /></div>;
      })}
    </div>;
  }

  return <section className="deriv" aria-label="Derivation">
    <div className="deriv__head"><b>Derivation</b><span>what it came from, what it goes with</span></div>
    <div className="deriv__block">
      <div className="deriv__kicker">came from</div>
      {came}
    </div>
    <div className="deriv__arrow" aria-hidden="true">↓</div>
    <div className="deriv__block deriv__block--self">
      <div className="deriv__kicker">this</div>
      <div className="deriv__self">{titleOf(id) ?? id}<Tail id={id} /></div>
    </div>
    <div className="deriv__arrow" aria-hidden="true">↓</div>
    <div className="deriv__block">
      <div className="deriv__kicker">goes with</div>
      {goes}
    </div>
  </section>;
}

/* ══ Entity drawer ═════════════════════════════════════ */
/** Escape closes, focus enters on open and returns to the invoking row on close. */
function useDialog(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const invoker = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      close.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      invoker?.focus?.();
    };
  }, []);
  return ref;
}
function titleCase(value: string): string {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function EntityDrawer({ id, workspace, board, onClose, onOpen }: {
  id: string; workspace: Workspace; board: Board; onClose: () => void; onOpen: (id: string) => void;
}) {
  const ref = useDialog(onClose);
  const ticket = board.ticketById.get(id);
  const pkg = board.packageById.get(id);
  const finding = board.findingById.get(id);
  const decision = board.decisions.find((d) => d.id === id);
  const entity = ticket ?? pkg ?? finding ?? decision;
  const kind = ticket ? "contract" : pkg ? "batch" : finding ? "observation" : decision ? "decision" : "entity";
  const drift = (workspace.diagnostics ?? []).filter((d) => d.id === id);

  const fields: Array<[string, string]> = [];
  if (ticket) {
    fields.push(["state", stateLabel(ticket.status)], ["source_finding", ticket.source_finding ?? "—"], ["package", ticket.package ?? "—"],
      ["claim", ticket.assigned_agent ?? "—"], ["branch", ticket.branch ?? "—"], ["priority", ticket.priority], ["risk", ticket.risk]);
    if (ticket.depends_on?.length) fields.push(["depends_on", ticket.depends_on.join(" ")]);
    if (ticket.resolution) fields.push(["resolution", ticket.resolution]);
    if (ticket.migration?.legacy_id) fields.push(["legacy id", ticket.migration.legacy_id]);
  } else if (finding) {
    fields.push(["state", finding.status], ["type", finding.finding_type], ["severity", finding.severity], ["confidence", finding.confidence],
      ["discovered_during", finding.discovered_during ?? "—"], ["became", finding.became ?? "—"], ["created", finding.created_at ?? "—"]);
  } else if (pkg) {
    fields.push(["state", pkg.status], ["kind", pkg.kind], ["members", String(pkg.tickets.length)],
      ["mode", pkg.execution?.mode ?? "dependency-aware"], ["parallelism", String(pkg.execution?.parallelism ?? 2)]);
  } else if (decision) {
    fields.push(["date", decision.date ?? "—"]);
  }

  return <div className="scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="drawer scroll" role="dialog" aria-modal="true" aria-label={`${kind}: ${entity?.title ?? id}`} tabIndex={-1} ref={ref}>
      <div className="drawer__bar">
        <span className="tag tag-outline">{kind}</span>
        <Tail id={id} />
        <button type="button" className="drawer__close" onClick={onClose}>Close · esc</button>
      </div>
      {!entity
        ? <div className="drawer__gone"><Dangling field="reference" id={id} /></div>
        : <>
          <h2 className="drawer__title">{entity.title}</h2>
          {drift.length > 0 && <div className="drawer__drift" role="alert">
            <div className="dangling__kind">state drift</div>
            {drift.map((d, i) => <div key={i} className="contra__line">{d.message} · {d.worktree}</div>)}
          </div>}
          <dl className="drawer__fields">
            {fields.map(([key, value]) => <div key={key}>
              <dt>{key}</dt>
              <dd>{ID_TEST.test(value) && titleOf(value) ? <>{titleOf(value)} <Tail id={value} /></> : value}</dd>
            </div>)}
          </dl>
          <DerivationPanel id={id} board={board} onOpen={onOpen} />
          {Object.entries(entity.sections ?? {}).map(([name, body]) => body && body.trim()
            ? <section key={name} className="drawer__section">
              <div className="drawer__section-head">{titleCase(name)}</div>
              <MarkdownContent value={body} onEntity={onOpen} />
            </section>
            : null)}
        </>}
    </div>
  </div>;
}

/* ══ The run ═══════════════════════════════════════════ */
export function RunOverlay({ board, onClose, onOpen }: { board: Board; onClose: () => void; onOpen: (id: string) => void }) {
  const ref = useDialog(onClose);
  const recent = [...board.tickets]
    .filter((t) => t.updated_at)
    .sort((a, b) => (parseDate(b.updated_at) ?? 0) - (parseDate(a.updated_at) ?? 0))
    .slice(0, 12);
  return <div className="run" role="dialog" aria-modal="true" aria-label="The run" tabIndex={-1} ref={ref}>
    <div className="run__bar">
      <span className="pulse is-live" aria-hidden="true" />
      <h2>The run</h2>
      <span className="run__note">Read-only. Nothing here edits anything.</span>
      <button type="button" className="run__close" onClick={onClose}>Close · esc</button>
    </div>
    <div className="run__body">
      <div className="run__batches scroll">
        {board.activeBatches.length === 0 && board.running.length === 0 && <p className="run__empty">Nothing is running. A batch starts with <code>kotta package start &lt;id&gt;</code>, a single contract with <code>kotta ticket execute &lt;id&gt; --agent codex</code>.</p>}
        {board.activeBatches.map((pkg) => {
          const members = pkg.tickets.map((id) => board.ticketById.get(id)).filter((t): t is Ticket => Boolean(t));
          const done = members.filter((t) => t.status === "done").length;
          const rows = members.filter((t) => t.status === "active" || t.status === "review");
          return <section key={pkg.id} className="run__batch">
            <div className="run__batch-head">
              <h3>{pkg.title}</h3>
              <Tail id={pkg.id} />
              <span className="run__progress">{done}/{pkg.tickets.length}</span>
              <span className="bar bar--dark"><span style={{ width: `${pkg.tickets.length ? (done / pkg.tickets.length) * 100 : 0}%` }} /></span>
            </div>
            {rows.map((ticket) => <EntityButton key={ticket.id} id={ticket.id} className="run__row" onOpen={onOpen}>
              <span className="run__row-title">{ticket.title}</span>
              <StateTag state={ticket.status} />
              <span className="run__row-claim"><ClaimDot agent={ticket.assigned_agent} />{ticket.assigned_agent ?? "no claim"} · {ticket.branch ?? "no branch"}</span>
              <span className="run__row-act">{relativeTime(ticket.updated_at)}</span>
            </EntityButton>)}
          </section>;
        })}
        {board.running.filter((t) => !t.package).length > 0 && <section className="run__batch">
          <div className="run__batch-head"><h3>Outside every batch</h3></div>
          {board.running.filter((t) => !t.package).map((ticket) => <EntityButton key={ticket.id} id={ticket.id} className="run__row" onOpen={onOpen}>
            <span className="run__row-title">{ticket.title}</span>
            <StateTag state={ticket.status} />
            <span className="run__row-claim"><ClaimDot agent={ticket.assigned_agent} />{ticket.assigned_agent ?? "no claim"} · {ticket.branch ?? "no branch"}</span>
            <span className="run__row-act">{relativeTime(ticket.updated_at)}</span>
          </EntityButton>)}
        </section>}
        <p className="run__foot">Nothing on this screen can be edited. Planning happens on the other side — home, the chain, the menu.</p>
      </div>
      <div className="run__side">
        <div className="run__side-head">Latest movements</div>
        <div className="run__ticker scroll">
          {recent.map((ticket) => <div key={ticket.id} className="run__tick">
            <span className="run__tick-time">{relativeTime(ticket.updated_at)}</span>
            <span className="run__tick-text">{stateLabel(ticket.status)} · {ticket.title}</span>
          </div>)}
          {recent.length === 0 && <p className="run__empty">No dated movement on record.</p>}
          <p className="run__side-note">Derived from <code>updated_at</code> in the frontmatter — the board reads state, not an event stream.</p>
        </div>
      </div>
    </div>
  </div>;
}

/* ══ The CLI sheet ═════════════════════════════════════ */
export function CliSheet({ onClose }: { onClose: () => void }) {
  const ref = useDialog(onClose);
  const groups: Array<{ label: string; rows: Array<[string, string]> }> = [
    { label: "observations", rows: [
      ["kotta finding new --title … --type …", "record what was noticed"],
      ["kotta finding resolve <id> --disposition … --approve", "reject it, or turn it into a contract"],
    ] },
    { label: "contracts", rows: [
      ["kotta ticket ready <id> --approve", "backlog → defined; validates the contract"],
      ["kotta ticket execute <id> --agent codex", "run a defined contract in a fresh context"],
      ["kotta ticket close <id> --approve", "review → done"],
    ] },
    { label: "batches", rows: [
      ["kotta package start <id>", "start it; claims and worktrees per member"],
      ["kotta package close <id> --approve", "every member is done"],
    ] },
    { label: "decisions and checks", rows: [
      ["kotta decision create --from <file> --approve", "record one; it gets quoted where referenced"],
      ["kotta validate", "what does not add up, exactly as the board shows it"],
    ] },
  ];
  return <div className="scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="sheet" role="dialog" aria-modal="true" aria-label="The CLI does the writing" tabIndex={-1} ref={ref}>
      <div className="sheet__head">
        <b>The CLI does the writing</b>
        <button type="button" className="drawer__close" onClick={onClose}>Close · esc</button>
      </div>
      <p className="sheet__lede">This board reads. Every state change happens through one of these — nothing on a row writes.</p>
      {groups.map((group) => <div key={group.label} className="sheet__group">
        <div className="sheet__kicker">{group.label}</div>
        {group.rows.map(([command, what]) => <div key={command} className="sheet__row"><code>{command}</code><span>{what}</span></div>)}
      </div>)}
      <div className="sheet__keys"><span>? — this sheet</span><span>w — watch the run</span><span>esc — close</span></div>
    </div>
  </div>;
}

/* ══ App ═══════════════════════════════════════════════ */
export function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("home");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [refreshed, setRefreshed] = useState(0);
  const [contractFilter, setContractFilter] = useState<Status | "all">("all");
  const [obsFilter, setObsFilter] = useState<ObsFilter>("waiting");
  const [query, setQuery] = useState("");

  /* One request, always the same one: the board never posts. A failed read keeps the last
     good data on screen and says what failed — a refresh preserves view and drawer. */
  const refresh = useCallback(async () => {
    try {
      const response = await fetch(WORKSPACE_ENDPOINT);
      if (!response.ok) throw new Error(`the server answered HTTP ${response.status}`);
      setWorkspace(await response.json() as Workspace);
      setRefreshed(0);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  }, []);
  useEffect(() => { void refresh(); const timer = window.setInterval(() => void refresh(), 1_500); return () => window.clearInterval(timer); }, [refresh]);
  useEffect(() => { const t = window.setInterval(() => setRefreshed((r) => (r + 1) % 600), 1_000); return () => window.clearInterval(t); }, []);

  const board = useMemo(() => (workspace ? readBoard(workspace) : null), [workspace]);

  const goto = useCallback((next: View, filter?: Status) => {
    setView(next);
    setWatching(false);
    if (filter) setContractFilter(filter);
    if (next === "observations") setObsFilter("waiting");
  }, []);

  // `?` opens the CLI sheet, `w` the run. Overlays own Escape themselves, so it is not handled here.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /input|textarea|select/i.test(target.tagName)) return;
      if (event.key === "?") { event.preventDefault(); setHelpOpen((v) => !v); }
      else if (event.key === "w") { event.preventDefault(); setWatching((v) => !v); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return <div className="app">
    <Rail view={view} onView={goto} board={board} running={Boolean(board?.running.length)} onWatch={() => setWatching(true)} refreshed={refreshed} />
    <div className="content">
      <TopBar workspace={workspace} board={board} onHelp={() => setHelpOpen(true)} onRefresh={() => void refresh()} refreshed={refreshed} />
      {board && <RunningStrip board={board} onWatch={() => setWatching(true)} onOpen={setDetailId} />}
      {workspace && error && <div className="banner" role="alert">
        <b>Last read failed.</b> Tried <code>GET {WORKSPACE_ENDPOINT}</code> — {error}. Showing the last good read.
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refresh()}>Retry</button>
      </div>}
      <main className="stage scroll">
        {view === "home" && <HomeView workspace={workspace} board={board} error={workspace ? null : error} onView={goto} onOpen={setDetailId} onRetry={() => void refresh()} />}
        {view !== "home" && !board && <div className="view"><Placeholder rows={6} label="Reading the workspace…" />
          {error && <BandError error={error} onRetry={() => void refresh()} />}</div>}
        {view === "observations" && board && <ObservationsView board={board} filter={obsFilter} onFilter={setObsFilter} onOpen={setDetailId} />}
        {view === "contracts" && board && <ContractsView board={board} filter={contractFilter} onFilter={setContractFilter} query={query} onQuery={setQuery} onOpen={setDetailId} />}
        {view === "batches" && board && <BatchesView board={board} onOpen={setDetailId} />}
        {view === "decisions" && board && <DecisionsView board={board} onOpen={setDetailId} />}
      </main>
    </div>
    {watching && board && <RunOverlay board={board} onClose={() => setWatching(false)} onOpen={(id) => { setWatching(false); setDetailId(id); }} />}
    {detailId && workspace && board && <EntityDrawer id={detailId} workspace={workspace} board={board} onClose={() => setDetailId(null)} onOpen={setDetailId} />}
    {helpOpen && <CliSheet onClose={() => setHelpOpen(false)} />}
  </div>;
}
