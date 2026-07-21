import { useEffect, useMemo, useState, type CSSProperties } from "react";

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
  package: string | null; depends_on: string[]; blocked?: boolean; resolution?: string; sections: Record<string, string>;
  migration?: { legacy_id: string; legacy_title: string; lane: string; legacy_status: string; backlog_section: string; story_points: number | null; ready_candidate: boolean; split: boolean; status_correction?: string | null; source_file: string };
};
type Package = { id: string; title: string; status: string; kind: string; tickets: string[]; sections: Record<string, string> };
type Workspace = { project: string; migration: Migration | null; tickets: Ticket[]; packages: Package[] };

const STATUSES: Array<{ id: Status; label: string; short: string }> = [
  { id: "backlog", label: "Backlog", short: "Unshaped" }, { id: "ready", label: "Ready", short: "Executable" },
  { id: "active", label: "Active", short: "In flight" }, { id: "review", label: "Review", short: "Evidence" },
  { id: "done", label: "Done", short: "Resolved" },
];

function snippet(value?: string, length = 150): string {
  const plain = (value ?? "").replace(/[`*_#>|]/g, "").replace(/\s+/g, " ").trim();
  return plain.length > length ? `${plain.slice(0, length).trim()}…` : plain;
}

function Stat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return <div className={`stat ${accent ? "stat--accent" : ""}`}><strong>{value}</strong><span>{label}</span></div>;
}

function TicketCard({ ticket, index, onOpen }: { ticket: Ticket; index: number; onOpen: (ticket: Ticket) => void }) {
  return <button className={`ticket-card priority-${ticket.priority}`} style={{ "--delay": `${Math.min(index, 12) * 28}ms` } as CSSProperties} onClick={() => onOpen(ticket)}>
    <div className="ticket-card__top"><span className="ticket-id">{ticket.id}</span>{ticket.migration && <span className="legacy-id">← {ticket.migration.legacy_id}</span>}</div>
    <h3>{ticket.title}</h3><p>{snippet(ticket.sections.outcome)}</p>
    <div className="ticket-card__labels"><span>{ticket.migration?.lane ?? ticket.types[0]}</span>{ticket.migration?.split && <span className="label-split">split</span>}{ticket.migration?.status_correction && <span className="label-corrected">corrected</span>}{ticket.migration?.ready_candidate && ticket.status === "backlog" && <span className="label-ready">ready?</span>}{ticket.blocked && <span className="label-blocked">blocked</span>}</div>
  </button>;
}

function EmptyColumn({ status }: { status: Status }) {
  const copy: Record<Status, string> = { backlog: "No unscheduled work.", ready: "Human approval has not moved any migrated ticket here yet.", active: "No claims or worktrees were imported.", review: "Migration never invents review evidence.", done: "No resolved work." };
  return <div className="empty-column"><span>∅</span><p>{copy[status]}</p></div>;
}

function Drawer({ ticket, onClose, packageTitle }: { ticket: Ticket; onClose: () => void; packageTitle?: string }) {
  useEffect(() => { const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose(); window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [onClose]);
  return <div className="drawer-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <aside className="drawer" role="dialog" aria-modal="true" aria-label={`${ticket.id} details`}>
      <button className="drawer__close" onClick={onClose} aria-label="Close ticket details">×</button>
      <div className="drawer__eyebrow"><span>{ticket.id}</span><span>{ticket.status}</span></div><h2>{ticket.title}</h2>
      {ticket.migration && <div className="source-stamp"><span>LEGACY SOURCE</span><strong>{ticket.migration.legacy_id}</strong><small>{ticket.migration.legacy_status} · {ticket.migration.backlog_section} · {ticket.migration.lane}</small></div>}
      <section><h4>Outcome</h4><p>{ticket.sections.outcome}</p></section><section><h4>Scope</h4><p>{snippet(ticket.sections.scope, 700)}</p></section>
      <section><h4>Acceptance</h4><p>{snippet(ticket.sections.acceptance, 700)}</p></section><section><h4>Verification</h4><p>{snippet(ticket.sections.verification, 700)}</p></section>
      <dl className="fact-grid"><div><dt>Type</dt><dd>{ticket.types.join(", ")}</dd></div><div><dt>Profiles</dt><dd>{ticket.profiles.join(", ") || "none"}</dd></div><div><dt>Priority</dt><dd>{ticket.priority}</dd></div><div><dt>Risk</dt><dd>{ticket.risk}</dd></div><div><dt>Package</dt><dd>{packageTitle ?? "—"}</dd></div><div><dt>Depends on</dt><dd>{ticket.depends_on?.join(", ") || "none"}</dd></div></dl>
      {ticket.migration?.status_correction && <div className="correction-callout"><b>STATUS CORRECTION</b><p>{ticket.migration.status_correction}</p></div>}
      {ticket.status === "backlog" && ticket.migration?.ready_candidate && <div className="ready-callout"><b>READY CANDIDATE</b><p>The evidence looks complete, but migration cannot grant human approval.</p></div>}
    </aside>
  </div>;
}

function MigrationPanel({ migration, onClose }: { migration: Migration; onClose: () => void }) {
  return <div className="drawer-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <aside className="drawer drawer--migration" role="dialog" aria-modal="true" aria-label="Migration decisions">
      <button className="drawer__close" onClick={onClose} aria-label="Close migration notes">×</button><div className="drawer__eyebrow"><span>MIGRATION LOG</span><span>{migration.split_audit.length} decisions</span></div>
      <h2>Where the old board changed shape</h2><p className="drawer__lead">Source truth is preserved. Compound work becomes packages or independent tickets; nothing is silently promoted to Ready.</p>
      <div className="split-list">{migration.split_audit.map((split) => <article key={split.legacy_id}><div><strong>{split.legacy_id}</strong><span>{split.disposition}</span></div><p>{split.reason}</p><code>{split.targets.length ? split.targets.join(" · ") : "→ package"}</code></article>)}</div>
    </aside>
  </div>;
}

export function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null); const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(""); const [lane, setLane] = useState("all"); const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null); const [showMigration, setShowMigration] = useState(false);
  useEffect(() => { fetch("/api/workspace").then((response) => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))).then(setWorkspace).catch((reason) => setError(String(reason))); }, []);
  const lanes = useMemo(() => [...new Set((workspace?.tickets ?? []).map((ticket) => ticket.migration?.lane).filter(Boolean) as string[])].sort(), [workspace]);
  const packageMap = new Map((workspace?.packages ?? []).map((pkg) => [pkg.id, pkg]));
  const filtered = useMemo(() => {
    const packageTickets = selectedPackage ? new Set(packageMap.get(selectedPackage)?.tickets ?? []) : null;
    return (workspace?.tickets ?? []).filter((ticket) => {
      const needle = query.toLowerCase().trim();
      const searchable = `${ticket.id} ${ticket.title} ${ticket.migration?.legacy_id} ${ticket.sections.outcome}`.toLowerCase();
      return (!needle || searchable.includes(needle)) && (lane === "all" || ticket.migration?.lane === lane) && (!packageTickets || packageTickets.has(ticket.id));
    });
  }, [workspace, query, lane, selectedPackage]);
  if (error) return <main className="fatal"><b>UI LOAD FAILED</b><p>{error}</p></main>;
  if (!workspace) return <main className="loading"><span>A</span><p>Reading canonical files…</p></main>;
  const migration = workspace.migration; const isMigration = migration !== null;
  const done = workspace.tickets.filter((ticket) => ticket.status === "done").length;
  const backlog = workspace.tickets.filter((ticket) => ticket.status === "backlog").length;
  const inFlight = workspace.tickets.filter((ticket) => ticket.status === "active" || ticket.status === "review").length;
  return <div className="app-shell">
    <header className={`masthead ${isMigration ? "" : "masthead--native"}`}><div className="brand-mark"><span>A</span><small>TEAM</small></div><div className="masthead__title"><p>{isMigration ? "MIGRATION CONTROL ROOM" : "A-TEAM CONTROL ROOM"} · LOCAL FILESYSTEM</p><h1>{workspace.project}</h1></div>{migration && <button className="migration-button" onClick={() => setShowMigration(true)}><span>{migration.split_audit.length}</span> shape decisions ↗</button>}</header>
    <section className="ledger" aria-label={isMigration ? "Migration statistics" : "Workspace statistics"}><div className="ledger__intro">{isMigration ? <><span>IMPORT SNAPSHOT / 21 JUL 2026</span><p>Legacy Scrum translated into executable work contracts. Source workspace untouched.</p></> : <><span>CURRENT WORKSPACE</span><p>Repository-native work contracts read directly from the canonical A-Team directories.</p></>}</div>{migration ? <><Stat value={migration.legacy_ticket_count} label="legacy sources" /><Stat value={migration.migrated_ticket_count} label="atomic tickets" accent /><Stat value={migration.ready_candidate_count} label="ready candidates" /></> : <><Stat value={workspace.tickets.length} label="tickets" accent /><Stat value={backlog} label="backlog" /><Stat value={inFlight} label="in flight" /></>}<Stat value={done} label="resolved" /></section>
    <section className="packages-section"><div className="section-label"><span>01</span><h2>{isMigration ? "Proposed packages" : "Packages"}</h2><p>Outcome containers, not extra lifecycle states.</p></div><div className="package-strip">{workspace.packages.map((pkg) => { const completed = pkg.tickets.filter((id) => workspace.tickets.find((ticket) => ticket.id === id)?.status === "done").length; return <button key={pkg.id} className={`package-card status-${pkg.status} ${selectedPackage === pkg.id ? "is-selected" : ""}`} onClick={() => setSelectedPackage(selectedPackage === pkg.id ? null : pkg.id)}><div><span>{pkg.id}</span><span>{pkg.kind} · {pkg.status}</span></div><h3>{pkg.title}</h3><p>{snippet(pkg.sections.goal, 90)}</p><footer><b>{completed}/{pkg.tickets.length}</b><span><i style={{ width: `${pkg.tickets.length ? completed / pkg.tickets.length * 100 : 0}%` }} /></span></footer></button>; })}</div></section>
    <section className="board-section"><div className="board-heading"><div className="section-label"><span>02</span><h2>Execution board</h2><p>Directory = lifecycle state.</p></div><div className="filters"><label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search T-042, O-38, title…" /></label><label><span>LANE</span><select value={lane} onChange={(event) => setLane(event.target.value)}><option value="all">All lanes</option>{lanes.map((item) => <option key={item}>{item}</option>)}</select></label>{(query || lane !== "all" || selectedPackage) && <button className="clear-filter" onClick={() => { setQuery(""); setLane("all"); setSelectedPackage(null); }}>clear ×</button>}</div></div>
      <div className="board-summary"><b>{filtered.length}</b> visible tickets {selectedPackage && <span>inside {selectedPackage} · {packageMap.get(selectedPackage)?.title}</span>}</div>
      <div className="board">{STATUSES.map((status) => { const tickets = filtered.filter((ticket) => ticket.status === status.id); return <section className={`board-column column-${status.id}`} key={status.id}><header><div><span>{status.label}</span><small>{status.short}</small></div><b>{tickets.length}</b></header><div className="ticket-stack">{tickets.length ? tickets.map((ticket, index) => <TicketCard key={ticket.id} ticket={ticket} index={index} onOpen={setSelectedTicket} />) : <EmptyColumn status={status.id} />}</div></section>; })}</div>
    </section>
    <footer className="page-footer"><span>FILESYSTEM IS CANONICAL</span><p>{isMigration ? "No database · no invented Ready approvals · source workspace unchanged" : "No database · lifecycle state follows canonical directories"}</p><code>{migration ? `${migration.legacy_ticket_count} legacy sources / ${workspace.tickets.length} resulting tickets` : `${workspace.tickets.length} tickets / ${workspace.packages.length} packages`}</code></footer>
    {selectedTicket && <Drawer ticket={selectedTicket} onClose={() => setSelectedTicket(null)} packageTitle={selectedTicket.package ? packageMap.get(selectedTicket.package)?.title : undefined} />}{showMigration && migration && <MigrationPanel migration={migration} onClose={() => setShowMigration(false)} />}
  </div>;
}
