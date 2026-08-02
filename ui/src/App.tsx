import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  branch?: string | null; pull_request?: string | null; updated_at?: string | null; sections: Record<string, string>;
  migration?: { legacy_id: string; legacy_title: string; lane: string; legacy_status: string; backlog_section: string; story_points: number | null; ready_candidate: boolean; split: boolean; status_correction?: string | null; source_file: string } | null;
};
type Package = {
  id: string; title: string; status: string; kind: string; tickets: string[]; sections: Record<string, string>;
  execution?: { mode?: string; parallelism?: number; stop_on_failure?: boolean };
  coordinator?: { branch?: string; base_branch?: string; base_commit?: string; cleaned_at?: string | null } | null;
};

/** A done package that still records an uncleaned coordinator branch is awaiting `a-team package finalize`. */
function coordinatorLabel(p: Package): { text: string; tone: string } | null {
  const branch = p.coordinator?.branch;
  if (!branch) return null;
  if (p.status !== "done") return { text: branch, tone: "tag-neutral" };
  return p.coordinator?.cleaned_at ? { text: "coordinator cleaned", tone: "tag-neutral" } : { text: "cleanup pending", tone: "tag-warn" };
}
type Finding = { id: string; title: string; status: "new" | "resolved"; finding_type: string; severity: string; confidence: string; discovered_during?: string | null; resolution?: string; became?: string | null; sections: Record<string, string> };
type Diagnostic = { entity: string; id: string; worktree: string; message: string };
export type Workspace = { project: string; migration: Migration | null; tickets: Ticket[]; packages: Package[]; findings: Finding[]; diagnostics?: Diagnostic[] };
type Agent = "codex" | "claude";
type AgentAvailability = Record<Agent, boolean>;
type Stage = "inbox" | "shape" | "packages" | "run" | "done";
type SourceReference = { id?: string; path?: string };
type SourceDocument = { path: string; title: string; id: string | null; content: string };
type MarkdownNode = { type: string; value?: string; url?: string; children?: MarkdownNode[] };
type ChatMessage = { id: string; role: "user" | "assistant"; agent?: Agent; body: string; streaming?: boolean };
type Thread = { scope: string; kind: ThreadKind; agent: Agent; draft: string; messages: ChatMessage[]; threadId: string | null };
type ThreadKind = "workspace" | "ticket" | "package" | "finding";

/* Identity is mixed for good (D-010): sequential ids stay, minted ones are `<type>-<26 char ULID>`. */
const MINTED_BODY = "[0-9a-hjkmnp-tv-z]{26}";
const ENTITY_SOURCE = `(?:O-\\d+(?:\\.\\d+)?|[TFP]-\\d+|[TFP]-${MINTED_BODY})`;
const ENTITY_PATTERN = new RegExp(`\\b${ENTITY_SOURCE}\\b`, "g");
const MINTED_ID = new RegExp(`^[TFPD]-${MINTED_BODY}$`);
/* Show a short id tail rather than 26 characters of ULID (D-003); it is the file's suffix too. */
function displayId(id: string): string {
  return MINTED_ID.test(id) ? `${id.slice(0, id.indexOf("-") + 1)}${id.slice(-8)}` : id;
}
const entityTitles = new Map<string, string>();
function entityLabel(id: string): string {
  const title = entityTitles.get(id);
  return title ? `${id} — ${title}` : id;
}
const GAP = "[backend-gap]";
/* Reporting leaves the workspace: the board never writes a report, it hands off to GitHub. */
const BUG_REPORT_URL = "https://github.com/arpadtamasi/a-team/issues/new?template=bug.yml";

/* ── Markdown + entity links ─────────────────────────── */
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
function MarkdownContent({ value, onEntity, onSource, className = "" }: { value: string; onEntity: (id: string) => void; onSource: (reference: SourceReference) => void; className?: string }) {
  return <div className={`markdown-body ${className}`.trim()}><ReactMarkdown
    remarkPlugins={[remarkGfm, remarkEntityLinks]}
    urlTransform={(url) => /^(?:https?:|mailto:|#|entity:)/.test(url) || /(?:^|\/)tickets\/.*\.md(?:#.*)?$/i.test(url) ? url : "#"}
    components={{ a: ({ href = "", children }) => {
      const label = String(children);
      const entityId = href.startsWith("entity:") ? href.slice(7) : label.match(ENTITY_PATTERN)?.[0];
      if (entityId) return <button type="button" className={`inline-entity ent-${stampSuffix(entityId)}`} title={entityLabel(entityId)} onClick={() => onEntity(entityId)}>{children}</button>;
      if (/\.md(?:#.*)?$/i.test(href)) return <button type="button" className="inline-entity" onClick={() => onSource({ path: href.split("#")[0] })}>{children}</button>;
      if (/^https?:|^mailto:/.test(href)) return <a href={href} target="_blank" rel="noreferrer noopener">{children}</a>;
      return <span>{children}</span>;
    } }}
  >{normalizeMarkdown(value)}</ReactMarkdown></div>;
}

function snippet(value?: string, length = 150): string {
  const plain = (value ?? "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<https?:\/\/[^>]+>/g, "link").replace(/^\s*[-+*]\s+/gm, "")
    .replace(/[`*_#>|~]/g, "").replace(/\s+/g, " ").trim();
  return plain.length > length ? `${plain.slice(0, length).trim()}…` : plain;
}
async function postJson(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json() as Record<string, unknown>;
  if (!response.ok || result.ok === false) throw new Error(typeof result.error === "string" ? result.error : `Request failed (HTTP ${response.status}).`);
  return result;
}

/* ── Derived helpers ─────────────────────────────────── */
const stateOf = (t: Ticket): Status | "blocked" => (t.blocked ? "blocked" : t.status);
const dependsLabel = (t: Ticket) => (t.depends_on?.length ? `depends_on ${t.depends_on.join(", ")}` : "no deps");
const pkgParallelism = (p: Package) => p.execution?.parallelism ?? 2;
const pkgMode = (p: Package) => p.execution?.mode ?? "dependency-aware";
const pkgStop = (p: Package) => p.execution?.stop_on_failure ?? true;
function relativeTime(iso?: string | null): string {
  if (!iso) return "—";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "—";
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.round(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.round(secs / 3600)}h ago`;
  return `${Math.round(secs / 86400)}d ago`;
}
const pkgModeSummary = (p: Package) => `${pkgMode(p)} · parallelism ${pkgParallelism(p)} · ${pkgStop(p) ? "stop on failure" : "continue on failure"}`;

function computeWaves(members: Ticket[], includeDone = false): Ticket[][] {
  const memberIds = new Set(members.map((t) => t.id));
  const placed = new Set<string>();
  let pool = includeDone ? [...members] : members.filter((t) => t.status !== "done");
  if (!pool.length) pool = [...members];
  const waves: Ticket[][] = [];
  let guard = 0;
  while (pool.length && guard++ < 12) {
    const layer = pool.filter((t) => (t.depends_on ?? []).every((d) => !memberIds.has(d) || placed.has(d) || members.find((m) => m.id === d)?.status === "done"));
    const wave = layer.length ? layer : pool.slice(0, 1);
    wave.forEach((t) => placed.add(t.id));
    waves.push(wave);
    pool = pool.filter((t) => !wave.includes(t));
  }
  return waves;
}

function waveLabel(wave: Ticket[]): string {
  const done = wave.filter((t) => t.status === "done").length;
  const open = wave.length - done;
  if (!done) return `${open} parallel`;
  if (!open) return `${done} done`;
  return `${open} parallel · ${done} done`;
}

function WaveGraph({ members, onEntity }: { members: Ticket[]; onEntity: (id: string) => void }) {
  const waves = computeWaves(members, true);
  if (waves.length === 0) return <div className="pane-empty" style={{ padding: 0 }}>No members to sequence.</div>;
  return <div className="graph scroll">
    {waves.map((wave, wi) => <div key={wi} className="graph__col">
      <div className="graph__wave">
        <div className="graph__wave-label">wave {wi + 1} · {waveLabel(wave)}</div>
        {wave.map((t) => <button type="button" key={t.id} className={`graph__node node-${stateOf(t)}`} style={{ textAlign: "left", cursor: "pointer" }} onClick={() => onEntity(t.id)}>
          <div className="graph__node-id"><span className="eid stamp-t">{t.id}</span><StateChip ticket={t} /></div>
          <div className="graph__node-short">{t.title.split(" ").slice(0, 6).join(" ")}…</div>
        </button>)}
      </div>
      {wi < waves.length - 1 && <div className="graph__arrow">→</div>}
    </div>)}
  </div>;
}

/* ── Small presentational bits ───────────────────────── */
/* Display label only — the stored status stays `ready` until the rename ticket lands. */
const stateLabel = (s: Status | "blocked") => (s === "ready" ? "defined" : s);
function StateChip({ ticket }: { ticket: Ticket }) {
  const s = stateOf(ticket);
  return <span className={`state state-${s}`}>{stateLabel(s)}</span>;
}
function ClaimDot({ agent }: { agent?: string }) {
  const cls = agent === "codex" ? "dot-codex" : agent === "claude" ? "dot-claude" : "dot-none";
  return <span className={`dot ${cls}`} />;
}
// Entity-type stamp: ticket=blue · finding=amber · package=purple · workspace=ink
function stampSuffix(id: string): "t" | "f" | "p" | "ws" {
  if (id === "workspace") return "ws";
  if (/^P-/.test(id)) return "p";
  if (/^F-/.test(id)) return "f";
  return "t"; // T- and legacy O-
}
function kindStampSuffix(kind: ThreadKind): "t" | "f" | "p" | "ws" {
  return kind === "workspace" ? "ws" : kind === "package" ? "p" : kind === "finding" ? "f" : "t";
}
function Eid({ id, onClick, dark, label }: { id: string; onClick?: () => void; dark?: boolean; label?: string }) {
  const cls = `eid stamp-${stampSuffix(id)}${dark ? " on-dark" : ""}`;
  const text = label ?? displayId(id);
  return onClick
    ? <button type="button" className={cls} title={entityLabel(id)} onClick={onClick}>{text}</button>
    : <span className={cls} title={entityLabel(id)}>{text}</span>;
}

/* ══ Stage rail ═════════════════════════════════════════ */
/* The mark is a staff: three rules, one red head standing on the middle one.
   Reversed here — the rail is ink, so the ground is paper. See assets/brand. */
function BrandMark() {
  return <svg className="rail__mark" viewBox="0 0 30 30" aria-hidden="true" focusable="false">
    <rect width="30" height="30" fill="#f3f2f2" />
    <g fill="#201e1d">
      <rect y="8" width="30" height="2" />
      <rect y="14" width="30" height="2" />
      <rect y="20" width="30" height="2" />
    </g>
    <rect x="16" y="12" width="6" height="6" fill="#ec3013" />
  </svg>;
}

function Rail({ project, stage, counts, onStage, onShortcuts, refreshed }: {
  project: string; stage: Stage; counts: Record<Stage, number>; onStage: (s: Stage) => void; onShortcuts: () => void; refreshed: number;
}) {
  const items: Array<{ id: Stage; label: string; sub: string; step: string }> = [
    { id: "inbox", label: "Inbox", sub: "observations", step: "01" },
    { id: "shape", label: "Shape", sub: "contracts", step: "02" },
    { id: "packages", label: "Packages", sub: "batches", step: "03" },
    { id: "run", label: "Run", sub: "execution", step: "04" },
    { id: "done", label: "Done", sub: "archive", step: "—" },
  ];
  return <nav className="rail">
    <div className="rail__head">
      <div className="rail__brand"><BrandMark /><span className="rail__brand-name">Kotta</span></div>
      <div className="kicker">workspace</div>
      <div className="rail__ws">{project}</div>
    </div>
    <div className="rail__group">pipeline</div>
    {items.map((item) => <button key={item.id} type="button" className={`rail__item ${stage === item.id ? "is-active" : ""}`} onClick={() => onStage(item.id)}>
      <span className="rail__item-step">{item.step}</span>
      <span className="rail__item-label"><b>{item.label}</b><span>{item.sub}</span></span>
      <span className="rail__badge">{counts[item.id]}</span>
    </button>)}
    <div className="rail__foot">
      <button type="button" className="rail__shortcuts" onClick={onShortcuts}><span className="rail__key">?</span> shortcuts</button>
      <a className="rail__report" href={BUG_REPORT_URL} target="_blank" rel="noreferrer noopener" aria-label="Report a bug — opens the A-Team issue form on GitHub">
        <span className="rail__key" aria-hidden="true">!</span> Report a bug <span aria-hidden="true">↗</span>
      </a>
      <div className="rail__report-note">Opens GitHub. Nothing from this workspace is sent — you write and submit the report there.</div>
      <div className="rail__stamps">
        <div className="kicker">entity stamps</div>
        <div className="rail__stamps-row">
          <span className="eid stamp-f on-dark">F-###</span>
          <span className="eid stamp-t on-dark">T-###</span>
          <span className="eid stamp-p on-dark">P-###</span>
        </div>
      </div>
      <div className="rail__meta">derived from filesystem<br />refreshed {refreshed}s ago · poll 1.5s<br /><code>.a-team/</code></div>
    </div>
  </nav>;
}

/* ══ Needs-you strip ═══════════════════════════════════ */
function NeedsStrip({ items, running, ready, onSearch }: {
  items: Array<{ n: number; label: string; dest: string; hot?: boolean; go: () => void }>;
  running: number; ready: number; onSearch: () => void;
}) {
  const empty = items.every((item) => item.n === 0);
  return <div className="needs">
    <div className="needs__label"><div className="kicker">attention</div><b>Needs you</b></div>
    {empty
      ? <div className="needs__empty"><b>Nothing needs you.</b><span>{running} running · {ready} defined and waiting</span></div>
      : <div className="needs__items">{items.map((item) => <button key={item.label} type="button" className={`needs__item ${item.n === 0 ? "is-zero" : ""} ${item.hot && item.n ? "is-hot" : ""}`} onClick={item.go}>
        <span className="needs__item-n">{item.n}</span>
        <span className="needs__item-txt"><b>{item.label}</b><span>→ {item.dest}</span></span>
      </button>)}</div>}
    <button type="button" className="needs__search" onClick={onSearch}><span className="rail__key">/</span> search</button>
  </div>;
}

/* ══ Inbox stage ═══════════════════════════════════════ */
function InboxStage({ workspace, onRefresh, onEntity, onSource, onDiscuss, cursor }: {
  workspace: Workspace; onRefresh: () => Promise<void>; onEntity: (id: string) => void; onSource: (r: SourceReference) => void; onDiscuss: (id: string) => void; cursor: number;
}) {
  const [capturing, setCapturing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [title, setTitle] = useState(""); const [evidence, setEvidence] = useState(""); const [type, setType] = useState("product"); const [during, setDuring] = useState("");
  const [busy, setBusy] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  const open = workspace.findings.filter((f) => f.status === "new");
  const resolved = workspace.findings.filter((f) => f.status === "resolved");

  const capture = async () => {
    setBusy("new"); setError(null);
    try { await postJson("/api/finding", { title, evidence, type, ...(during.trim() ? { discoveredDuring: during.trim() } : {}) }); setTitle(""); setEvidence(""); setDuring(""); setCapturing(false); await onRefresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { setBusy(null); }
  };
  const resolve = async (findingId: string, disposition: "create-ticket" | "reject") => {
    setBusy(findingId); setError(null);
    try { await postJson("/api/finding/resolve", { findingId, disposition }); await onRefresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { setBusy(null); }
  };
  const sevClass = (sev: string) => (sev === "high" ? "sev-high" : sev === "medium" ? "sev-medium" : "sev-low");

  return <div>
    <div className="stage__head">
      <div style={{ flex: 1, minWidth: 0 }}><h2>Inbox</h2><p>Observations awaiting human disposition — not tasks. Reject, or promote to a contract.</p></div>
      <div className="stage__head-aside">
        <div className="stat-inline"><div className="kicker">intake · open vs resolved</div><div className="mono">{open.length} open / {resolved.length} dispositioned</div></div>
        <button type="button" className="btn btn-primary" onClick={() => setCapturing((v) => !v)}>{capturing ? "Cancel" : "+ Capture finding"}</button>
      </div>
    </div>
    {capturing && <div className="capture">
      <div className="capture__col">
        <div className="field"><label>Title</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="One observation, stated plainly" /></div>
        <div className="field"><label>Evidence (markdown)</label><textarea className="input" value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="What was observed, where, and how it was reproduced" /></div>
      </div>
      <div className="capture__col">
        <div className="field"><label>Type</label><select className="input" value={type} onChange={(e) => setType(e.target.value)}><option value="product">product</option><option value="bug">bug</option><option value="risk">risk</option><option value="technical">technical</option></select></div>
        <div className="field"><label>Discovered during (optional)</label><input className="input mono" value={during} onChange={(e) => setDuring(e.target.value)} placeholder="T-012" /></div>
        <button type="button" className="btn btn-primary" style={{ justifyContent: "flex-start" }} disabled={!title.trim() || !evidence.trim() || busy === "new"} onClick={() => void capture()}>{busy === "new" ? "Saving…" : "Capture →"}</button>
        <div className="capture__note">POST /api/finding · writes .a-team/findings/new/</div>
      </div>
    </div>}
    {error && <div style={{ padding: "0 22px" }}><p className="inline-error">{error}</p></div>}
    <div className="inbox__bar"><b>Open observations</b><span className="count">{open.length}</span><span className="path">.a-team/findings/new/</span></div>
    {open.length === 0 && <div className="pane-empty" style={{ padding: "8px 22px 22px" }}>Inbox zero. Agents can add evidence here without expanding ticket scope.</div>}
    {open.map((f, i) => {
      const isOpen = openId === f.id;
      return <article id={`entity-${f.id}`} key={f.id} className={`finding-row ${i === cursor ? "is-cursor" : ""}`}>
        <div className="finding-row__grid">
          <button type="button" className="finding-row__id" onClick={() => setOpenId(isOpen ? null : f.id)}><span className="caret">{isOpen ? "▾" : "▸"}</span><span className="eid stamp-f">{f.id}</span></button>
          <div style={{ minWidth: 0 }}>
            <button type="button" className="finding-row__title" onClick={() => setOpenId(isOpen ? null : f.id)}>{f.title}</button>
            <div className="finding-row__meta">
              <span className="tag tag-neutral">{f.finding_type}</span>
              <span className={`tag ${sevClass(f.severity)}`}>sev {f.severity}</span>
              {f.confidence && <span className="mono" style={{ opacity: .6 }}>conf {f.confidence}</span>}
              {f.discovered_during && <span style={{ display: "flex", gap: 5, alignItems: "center" }}><span style={{ opacity: .6 }}>during</span><Eid id={f.discovered_during} onClick={() => onEntity(f.discovered_during!)} /></span>}
              <span className="mono" style={{ opacity: .45 }}>.a-team/findings/new/</span>
            </div>
            {isOpen && <div className="finding-row__evidence"><div className="kicker">evidence</div><MarkdownContent value={f.sections.evidence || f.sections.observation || "—"} onEntity={onEntity} onSource={onSource} /></div>}
          </div>
          <div className="finding-row__actions">
            <button type="button" className="btn btn-secondary btn-sm" disabled={busy === f.id} onClick={() => void resolve(f.id, "reject")}>Reject</button>
            <button type="button" className="btn btn-primary btn-sm" disabled={busy === f.id} onClick={() => void resolve(f.id, "create-ticket")}>Create ticket →</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onDiscuss(f.id)}>Discuss</button>
          </div>
        </div>
      </article>;
    })}
    <div className="history">
      <button type="button" className="history__toggle" onClick={() => setHistoryOpen((v) => !v)}>
        <span className="caret">{historyOpen ? "▾" : "▸"}</span> Dispositioned history <span className="mono" style={{ opacity: .5 }}>{resolved.length}</span>
        <span className="path">.a-team/findings/resolved/</span>
      </button>
      {historyOpen && <div style={{ padding: "0 22px 16px" }}>
        {resolved.length === 0 ? <div className="pane-empty">Nothing dispositioned yet.</div> : <table className="table">
          <thead><tr><th style={{ width: 76 }}>id</th><th>title</th><th style={{ width: 120 }}>disposition</th><th style={{ width: 120 }}>became</th></tr></thead>
          <tbody>{resolved.map((r) => <tr key={r.id}>
            <td className="mono" style={{ fontWeight: 600 }}>{r.id}</td>
            <td>{r.title}</td>
            <td><span className="tag tag-neutral">{r.resolution || "resolved"}</span></td>
            <td className="mono">{r.became ? <Eid id={r.became} onClick={() => onEntity(r.became!)} /> : "—"}</td>
          </tr>)}</tbody>
        </table>}
      </div>}
    </div>
  </div>;
}

/* ══ Shape stage ═══════════════════════════════════════ */
type ValidationState = { status: "checking" | "fail" | "ok"; issues?: Array<{ field: string; text: string }> };
function ShapeStage({ workspace, packageMap, validated, onValidate, onEntity, onDiscuss, cursor }: {
  workspace: Workspace; packageMap: Map<string, Package>; validated: Record<string, ValidationState>; onValidate: (t: Ticket) => void; onEntity: (id: string) => void; onDiscuss: (id: string) => void; cursor: number;
}) {
  const backlog = workspace.tickets.filter((t) => t.status === "backlog");
  const ready = workspace.tickets.filter((t) => t.status === "ready");
  const readyByPkg = new Map<string, Ticket[]>();
  const unpackaged: Ticket[] = [];
  ready.forEach((t) => { if (t.package) { const arr = readyByPkg.get(t.package) ?? []; arr.push(t); readyByPkg.set(t.package, arr); } else unpackaged.push(t); });

  return <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
    <div className="stage__head">
      <div style={{ flex: 1 }}><h2>Shape</h2><p>Turn items into executable contracts. Directory is the state — validation moves the file.</p></div>
      <span className="hint">v to validate the focused ticket</span>
    </div>
    <div className="shape">
      <div className="shape__pane shape__pane--left">
        <div className="subhead"><b>Backlog</b><span className="count dark">{backlog.length}</span><span className="note">unshaped</span><span className="path">tickets/backlog/</span></div>
        {backlog.length === 0 && <div className="pane-empty">No unshaped work.</div>}
        {backlog.map((t, i) => {
          const v = validated[t.id];
          return <div key={t.id} className={`tk-row ${i === cursor ? "is-cursor" : ""}`}>
            <div className="tk-row__top"><Eid id={t.id} onClick={() => onEntity(t.id)} /><span className="tk-row__title">{t.title}</span></div>
            <div className="tk-row__meta">
              <span className="tag tag-neutral">{t.types[0] ?? "ticket"}</span>
              <span className="mono">P{t.priority} · risk {t.risk}</span>
              <span className={`pkg-chip ${t.package ? "is-packaged" : "is-unpackaged"}`}>{t.package ?? "unpackaged"}</span>
              <span className="mono" style={{ opacity: .55 }}>{dependsLabel(t)}</span>
              <span className="tk-row__actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onDiscuss(t.id)}>Shape with agent</button>
                <button type="button" className="btn btn-primary btn-sm" disabled={v?.status === "checking"} onClick={() => onValidate(t)}>{v?.status === "checking" ? "Checking…" : "Validate → Defined"}</button>
              </span>
            </div>
            {v?.status === "fail" && v.issues && <div className="callout-fail">
              <div className="kicker">validation failed · POST /api/ticket/ready</div>
              {v.issues.map((iss, k) => <div className="issue" key={k}><span className="mono">{iss.field}</span><span>{iss.text}</span></div>)}
            </div>}
            {v?.status === "ok" && <div className="callout-ok">✓ moved → tickets/ready/{t.id.toLowerCase()}.md</div>}
          </div>;
        })}
      </div>
      <div className="shape__pane">
        <div className="subhead"><b>Defined</b><span className="count accent">{ready.length}</span><span className="note">executable · grouped by package</span><span className="path">tickets/ready/</span></div>
        {ready.length === 0 && <div className="pane-empty">Human approval has not moved any ticket here yet.</div>}
        {[...readyByPkg.entries()].map(([pkgId, rows]) => <div key={pkgId} className="ready-group">
          <div className="ready-group__head"><Eid id={pkgId} /><span style={{ fontSize: 12, fontWeight: 600 }}>{packageMap.get(pkgId)?.title ?? "Package"}</span><span className="note">{rows.length} defined</span></div>
          {rows.map((t) => <div key={t.id} className="tk-row">
            <div className="tk-row__top"><Eid id={t.id} onClick={() => onEntity(t.id)} /><span className="tk-row__title">{t.title}</span></div>
            <div className="tk-row__meta"><span className="tag tag-neutral">{t.types[0] ?? "ticket"}</span><span className="mono">P{t.priority} · risk {t.risk}</span><span className="mono" style={{ opacity: .55 }}>{dependsLabel(t)}</span>
              <span className="tk-row__actions"><button type="button" className="btn btn-secondary btn-sm" onClick={() => onDiscuss(t.id)}>Discuss</button></span></div>
          </div>)}
        </div>)}
        {unpackaged.length > 0 && <div className="ready-group">
          <div className="ready-group__head is-unpackaged"><span className="mono">—</span><span style={{ fontSize: 12, fontWeight: 600 }}>Unpackaged and defined</span><span className="note">a decision waiting to happen</span></div>
          {unpackaged.map((t) => <div key={t.id} className="tk-row">
            <div className="tk-row__top"><Eid id={t.id} onClick={() => onEntity(t.id)} /><span className="tk-row__title">{t.title}</span></div>
            <div className="tk-row__meta"><span className="tag tag-neutral">{t.types[0] ?? "ticket"}</span><span className="mono">P{t.priority} · risk {t.risk}</span><span className="mono" style={{ opacity: .55 }}>{dependsLabel(t)}</span>
              <span className="tk-row__actions"><button type="button" className="btn btn-secondary btn-sm" onClick={() => onDiscuss(t.id)}>Discuss</button></span></div>
          </div>)}
        </div>}
      </div>
    </div>
  </div>;
}

/* ══ Packages stage ════════════════════════════════════ */
function PackagesStage({ workspace, ticketMap, selected, onSelect, onEntity, onSource, onDiscuss, onRefresh }: {
  workspace: Workspace; ticketMap: Map<string, Ticket>; selected: string | null; onSelect: (id: string) => void; onEntity: (id: string) => void; onSource: (r: SourceReference) => void; onDiscuss: (id: string) => void; onRefresh: (pkgId?: string) => Promise<void>;
}) {
  const [preflight, setPreflight] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(""); const [goal, setGoal] = useState(""); const [kind, setKind] = useState("batch");
  const packages = workspace.packages;
  const active = packages.find((p) => p.id === selected) ?? packages[0] ?? null;

  const create = async () => {
    setBusy("create"); setError(null);
    try { const result = await postJson("/api/package", { title, goal, kind }); const data = result.data as { id?: string } | undefined; setTitle(""); setGoal(""); setCreating(false); await onRefresh(data?.id); }
    catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { setBusy(null); }
  };
  const membership = async (pkgId: string, ticketId: string, action: "add" | "remove") => {
    setBusy(ticketId); setError(null);
    try { await postJson("/api/package/tickets", { packageId: pkgId, ticketId, action }); await onRefresh(pkgId); }
    catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { setBusy(null); }
  };

  const detail = () => {
    if (!active) return <div className="pane-empty">No packages yet. Create an outcome container to batch related work.</div>;
    const members = active.tickets.map((id) => ticketMap.get(id)).filter(Boolean) as Ticket[];
    const waves = computeWaves(members);
    const locked = active.status !== "backlog";
    const backlogMembers = members.filter((t) => t.status === "backlog");
    const allReady = members.length > 0 && members.every((t) => ["ready", "done"].includes(t.status));
    const launchable = allReady && active.status === "backlog";
    const launchReason = active.status === "active" ? "Already running — see Run. Launch is disabled while a run is in flight."
      : active.status === "done" ? "Package is done. Its members are archived in Done."
        : members.length === 0 ? "No members yet. Add defined tickets before launch."
          : `${backlogMembers.length} member ticket${backlogMembers.length === 1 ? "" : "s"} still in backlog. Validate them in Shape before launch.`;
    const available = workspace.tickets.filter((t) => !active.tickets.includes(t.id) && t.status !== "done");

    return <div className="pkg-detail">
      <div className="pkg-detail__head">
        <div className="pkg-detail__head-top">
          <Eid id={active.id} />
          <span className="tag tag-neutral">{active.kind} · {active.status}</span>
          <span className="path">.a-team/packages/{active.status}/{active.id.toLowerCase()}.md</span>
        </div>
        <h2>{active.title}</h2>
        <div className="markdown-body goal"><MarkdownContent value={active.sections.goal || "—"} onEntity={onEntity} onSource={onSource} /></div>
      </div>
      {error && <p className="inline-error" style={{ margin: "10px 22px" }}>{error}</p>}
      <div className="pkg-body">
        <div className="pkg-body__main">
          <div className="pkg-block">
            <div className="pkg-block__head"><b>Execution order</b><span>derived from depends_on · columns run in parallel</span></div>
            <WaveGraph members={members} onEntity={onEntity} />
          </div>
          <div className="pkg-block" style={{ borderBottom: 0 }}>
            <div className="pkg-block__head"><b>Members</b><span className="mono">{members.length} tickets</span>
              {!locked && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCreating(false)}>Edit membership below</button>}
            </div>
            {locked && <div className="locked-banner"><b>Membership locked</b> — package is {active.status}. Only backlog packages can add or remove tickets.</div>}
            <table className="table">
              <thead><tr><th style={{ width: 70 }}>id</th><th>title</th><th style={{ width: 90 }}>state</th><th style={{ width: 130 }}>depends on</th>{!locked && <th style={{ width: 90 }} />}</tr></thead>
              <tbody>{members.map((t) => <tr key={t.id}>
                <td><Eid id={t.id} onClick={() => onEntity(t.id)} /></td>
                <td style={{ lineHeight: 1.3 }}>{t.title}</td>
                <td><StateChip ticket={t} /></td>
                <td className="mono" style={{ fontSize: 11.5, opacity: .7 }}>{t.depends_on?.join(", ") || "—"}</td>
                {!locked && <td><button type="button" className="btn btn-secondary btn-sm" disabled={busy === t.id} onClick={() => void membership(active.id, t.id, "remove")}>Remove</button></td>}
              </tr>)}
              {members.length === 0 && <tr><td colSpan={locked ? 4 : 5} className="muted">No tickets yet. Add the work that shares this outcome.</td></tr>}
              </tbody>
            </table>
            {!locked && available.length > 0 && <div style={{ marginTop: 14 }}>
              <div className="pkg-block__head"><b>Available</b><span className="mono">{available.length}</span></div>
              <table className="table">
                <tbody>{available.map((t) => <tr key={t.id}>
                  <td style={{ width: 70 }}><Eid id={t.id} /></td>
                  <td style={{ lineHeight: 1.3 }}>{t.title}</td>
                  <td style={{ width: 90 }}><StateChip ticket={t} /></td>
                  <td style={{ width: 90 }}><button type="button" className="btn btn-secondary btn-sm" disabled={busy === t.id} onClick={() => void membership(active.id, t.id, "add")}>+ Add</button></td>
                </tr>)}</tbody>
              </table>
            </div>}
          </div>
        </div>
        <div className="pkg-side">
          <div className="pkg-side__block">
            <h5>Execution settings</h5>
            <div className="setting-row"><span className="k">mode</span><span className="v">{pkgMode(active)}</span></div>
            <div className="setting-row"><span className="k">parallelism</span><span className="v">{pkgParallelism(active)}</span></div>
            <div className="setting-row"><span className="k">stop_on_failure</span><span className="v">{String(pkgStop(active))}</span></div>
            <div className="pkg-side__note">Read from package frontmatter. {locked ? "Editable only while the package is in backlog." : "Editable now — this package is still in backlog."}</div>
          </div>
          <div className="launch">
            <h5>Launch</h5>
            {launchable ? <>
              <p>All {members.length} members are defined and validated. Hand the batch to the machine.</p>
              <button type="button" className="btn btn-primary btn-block" onClick={() => setPreflight((v) => !v)}>▶ Launch package</button>
            </> : <>
              <button type="button" className="btn btn-primary btn-block" disabled>▶ Launch package</button>
              <div className="launch__block">{launchReason}</div>
            </>}
            <div className="gap-note">
              <div className="kicker">{GAP}</div>
              <div>No launch endpoint yet. Pre-flight ends in a copy-paste command for an agent session, never a dead end.</div>
            </div>
          </div>
        </div>
      </div>
      {preflight && launchable && <div className="preflight">
        <div className="preflight__head"><b>Pre-flight · {active.id}</b><span className="gap-badge">{GAP}</span><button type="button" className="btn btn-secondary btn-sm" style={{ marginLeft: "auto" }} onClick={() => setPreflight(false)}>Close ✕</button></div>
        <div className="preflight__grid">
          <div>
            <div className="kicker" style={{ opacity: .5, marginBottom: 6 }}>what will run</div>
            {waves.map((wave, wi) => <div key={wi} className="preflight__wave"><span className="w">wave {wi + 1}</span><span className="ids">{wave.map((t) => t.id).join(", ")}<span style={{ fontWeight: 400, opacity: .6 }}> · {wave.length > 1 ? `${wave.length} agents in parallel` : "single agent"}</span></span></div>)}
            <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.5, opacity: .75 }}>Each ticket gets an isolated git worktree and a feature branch; a claim file records the agent. {members.length} branches, max {pkgParallelism(active)} concurrent.</div>
          </div>
          <div>
            <div className="kicker" style={{ opacity: .5, marginBottom: 6 }}>run this in an agent session</div>
            <div className="codeblock">{`/execute-package ${active.id}\n# dependency-aware · parallelism ${pkgParallelism(active)} · isolated worktrees`}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => void navigator.clipboard?.writeText(`/execute-package ${active.id}`)}>Copy command</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onDiscuss(active.id)}>Send to package thread</button>
            </div>
          </div>
        </div>
      </div>}
    </div>;
  };

  return <div className="packages">
    <div className="pkg-list">
      <div className="subhead"><b>Packages</b><span className="count dark">{packages.length}</span><button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => setCreating((v) => !v)}>{creating ? "Cancel" : "+ New"}</button></div>
      {creating && <div style={{ padding: 14, borderBottom: "2px solid var(--line)", display: "grid", gap: 10 }}>
        <div className="field"><label>Title</label><input className="input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Release slice, milestone…" /></div>
        <div className="field"><label>Kind</label><select className="input" value={kind} onChange={(e) => setKind(e.target.value)}><option value="batch">batch</option><option value="milestone">milestone</option><option value="mission">mission</option><option value="sprint">sprint</option></select></div>
        <div className="field"><label>Goal</label><textarea className="input" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What shared outcome does this package produce?" /></div>
        <button type="button" className="btn btn-primary" disabled={!title.trim() || busy === "create"} onClick={() => void create()}>{busy === "create" ? "Creating…" : "Create package"}</button>
      </div>}
      {packages.map((p) => {
        const members = p.tickets.map((id) => ticketMap.get(id));
        const done = members.filter((t) => t?.status === "done").length;
        const coordinator = coordinatorLabel(p);
        return <button key={p.id} type="button" className={`pkg-list__item ${active?.id === p.id ? "is-active" : ""}`} onClick={() => onSelect(p.id)}>
          <div className="pkg-list__top"><Eid id={p.id} /><span className="tag tag-neutral">{p.status}</span>{coordinator && <span className={`tag ${coordinator.tone}`}>{coordinator.text}</span>}<span className="frac">{done}/{p.tickets.length}</span></div>
          <div className="pkg-list__title">{p.title}</div>
          <div className="progress"><i style={{ width: `${p.tickets.length ? (done / p.tickets.length) * 100 : 0}%` }} /></div>
          <div className="pkg-list__mode">{pkgModeSummary(p)}</div>
        </button>;
      })}
    </div>
    {detail()}
  </div>;
}

/* ══ Run stage ═════════════════════════════════════════ */
function RunRow({ ticket, diagnostic, expanded, onToggle, onEntity, onSource, onDiscuss, cursor }: {
  ticket: Ticket; diagnostic?: Diagnostic; expanded: boolean; onToggle: () => void; onEntity: (id: string) => void; onSource: (r: SourceReference) => void; onDiscuss: (id: string) => void; cursor: boolean;
}) {
  const s = stateOf(ticket);
  return <div className={`run-row ${s === "review" ? "is-review" : ""} ${cursor ? "is-cursor" : ""}`}>
    <button type="button" className="run-row__btn run-cols" onClick={onToggle}>
      <span className="run-row__id"><span className="caret">{expanded ? "▾" : "▸"}</span><span className="eid stamp-t">{ticket.id}</span></span>
      <span className="run-row__title">{ticket.title}</span>
      <span><StateChip ticket={ticket} /></span>
      <span className="run-row__claim"><ClaimDot /><span className="gap-badge" style={{ borderStyle: "dashed" }}>claim ?</span></span>
      <span className="run-row__mono" style={{ opacity: .7 }}>{ticket.branch || "—"}</span>
      <span className="run-row__mono" style={{ opacity: .55 }}>{diagnostic ? diagnostic.worktree : "—"}</span>
      <span className="run-row__mono" style={{ opacity: .6 }}>{relativeTime(ticket.updated_at)}</span>
    </button>
    {expanded && <div className="run-row__detail">
      <div className="run-row__cols">
        <div>
          <div className="kicker">acceptance contract</div>
          {ticket.sections.acceptance ? <MarkdownContent value={ticket.sections.acceptance} onEntity={onEntity} onSource={onSource} /> : <div className="muted" style={{ fontSize: 12.5 }}>No acceptance block on this contract.</div>}
        </div>
        <div>
          <div className="kicker">verification</div>
          {ticket.sections.verification ? <MarkdownContent value={ticket.sections.verification} onEntity={onEntity} onSource={onSource} /> : <div className="muted" style={{ fontSize: 12.5 }}>No verification block yet — agent is still working.</div>}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 10 }}>
            {ticket.pull_request && <a className="mono" style={{ fontSize: 11.5 }} href={/^https?:/.test(ticket.pull_request) ? ticket.pull_request : undefined} target="_blank" rel="noreferrer noopener">{ticket.pull_request}</a>}
            {ticket.branch && <span className="mono" style={{ fontSize: 11.5, opacity: .6 }}>{ticket.branch}</span>}
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onDiscuss(ticket.id)}>Open thread</button>
          </div>
        </div>
      </div>
      {s === "review" && <div className="review-actions">
        <button type="button" className="btn btn-primary btn-sm" disabled>Accept → done</button>
        <button type="button" className="btn btn-secondary btn-sm" disabled>Request changes</button>
        <span className="gap-badge">{GAP}</span>
        <span className="code-inline">a-team ticket accept {ticket.id}</span>
        <span style={{ fontSize: 11.5, opacity: .6 }}>— no review endpoint yet; the UI hands you the exact command.</span>
      </div>}
      {ticket.blocked && <div className="blocked-note"><b style={{ textTransform: "uppercase", letterSpacing: ".07em", fontSize: 10.5 }}>Blocked</b> — {ticket.resolution || "waiting on a dependency or decision."}</div>}
    </div>}
  </div>;
}

function RunStage({ workspace, packageMap, ticketMap, onEntity, onSource, onDiscuss, onOpenMigration, driftOpen, setDriftOpen }: {
  workspace: Workspace; packageMap: Map<string, Package>; ticketMap: Map<string, Ticket>; onEntity: (id: string) => void; onSource: (r: SourceReference) => void; onDiscuss: (id: string) => void; onOpenMigration: () => void; driftOpen: boolean; setDriftOpen: (v: boolean) => void;
}) {
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const diagnostics = workspace.diagnostics ?? [];
  const diagById = new Map(diagnostics.map((d) => [d.id, d]));
  const runTickets = workspace.tickets.filter((t) => ["active", "review"].includes(t.status) || t.blocked);
  const activeCount = runTickets.filter((t) => t.status === "active" && !t.blocked).length;
  const reviewCount = runTickets.filter((t) => t.status === "review").length;
  const blockedCount = runTickets.filter((t) => t.blocked).length;

  const runPackages = workspace.packages.filter((p) => p.status === "active" || runTickets.some((t) => t.package === p.id));
  const firstRunPkg = runPackages.find((p) => p.tickets.some((id) => runTickets.some((t) => t.id === id)))?.id ?? null;
  const looseTickets = runTickets.filter((t) => !t.package);
  const migrationCount = workspace.tickets.filter((t) => t.migration?.split).length;

  const renderRow = (t: Ticket) => <RunRow key={t.id} ticket={t} diagnostic={diagById.get(t.id)} expanded={openRow === t.id} onToggle={() => setOpenRow(openRow === t.id ? null : t.id)} onEntity={onEntity} onSource={onSource} onDiscuss={onDiscuss} cursor={false} />;

  return <div>
    <div className="stage__head">
      <div style={{ flex: 1 }}><h2>Run</h2><p>What the machine is doing. Claims, branches and worktrees are read from git.</p></div>
      <div className="run__counts">
        <span><b>{activeCount}</b> active</span><span><b>{reviewCount}</b> review</span><span><b>{blockedCount}</b> blocked</span>
        <span className={diagnostics.length ? "hot" : ""}><b>{diagnostics.length}</b> drift</span>
      </div>
    </div>

    {diagnostics.length > 0 && <div className="drift">
      <div className="drift__bar">
        <b>State drift · {diagnostics.length}</b>
        <span className="desc"><Eid id={diagnostics[0].id} /> — {diagnostics[0].message}</span>
        <button type="button" className="btn btn-danger btn-sm" style={{ marginLeft: "auto" }} onClick={() => setDriftOpen(!driftOpen)}>{driftOpen ? "Hide" : "Inspect"}</button>
      </div>
      {driftOpen && <div className="drift__detail">
        {diagnostics.map((d) => <div key={d.id} className="drift__cmp" style={{ marginBottom: 10 }}>
          <div>
            <div className="kicker">canonical files say</div>
            <div className="drift__kv"><span className="k">ticket</span><span className="v"><Eid id={d.id} /></span></div>
            <div className="drift__kv"><span className="k">state</span><span className="v">{ticketMap.get(d.id)?.status ?? "—"}</span></div>
          </div>
          <div>
            <div className="kicker git">git says</div>
            <div className="drift__kv"><span className="k">worktree</span><span className="v git mono">{d.worktree}</span></div>
            <div className="drift__kv"><span className="k">detail</span><span className="v git">{d.message}</span></div>
          </div>
        </div>)}
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, opacity: .7 }}>The UI will not pick a story. Reconcile with the CLI:</span>
          <span className="code-inline">a-team ticket reconcile {diagnostics[0].id}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onDiscuss("workspace")}>Discuss in thread</button>
        </div>
      </div>}
    </div>}

    {runPackages.length === 0 && looseTickets.length === 0 && <div className="pane-empty" style={{ padding: "24px 22px" }}>Nothing is running. Launch a defined package from Packages.</div>}

    {runPackages.map((p) => {
      const members = p.tickets.map((id) => ticketMap.get(id)).filter((t): t is Ticket => Boolean(t));
      const rows = members.filter((t) => ["active", "review"].includes(t.status) || Boolean(t.blocked));
      if (rows.length === 0) return null;
      const done = members.filter((t) => t.status === "done").length;
      const selected = (selectedPkg ?? firstRunPkg) === p.id;
      return <div key={p.id} className={`run-pkg ${selected ? "is-selected" : ""}`}>
        <button type="button" className="run-pkg__head" onClick={() => setSelectedPkg(p.id)}>
          <span className="caret">{selected ? "▾" : "▸"}</span>
          <Eid id={p.id} dark /><span className="title">{p.title}</span><span className="mode">{pkgModeSummary(p)}</span>
          <span className="right">
            <span className="progress-txt">{done}/{p.tickets.length} done · {rows.filter((t) => t.status === "active").length} active · {rows.filter((t) => t.status === "review").length} review</span>
            <span className="ghost-btn" role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); onDiscuss(p.id); }} onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onDiscuss(p.id); } }}>Package thread</span>
          </span>
        </button>
        {selected && <div className="run-pkg__graph">
          <div className="pkg-block__head"><b>Execution order</b><span>derived from depends_on · columns run in parallel</span></div>
          <WaveGraph members={members} onEntity={onEntity} />
        </div>}
        <div className="run-head-row run-cols"><span>id</span><span>ticket</span><span>state</span><span>claim</span><span>branch</span><span>worktree</span><span>activity</span></div>
        {rows.map(renderRow)}
      </div>;
    })}

    {looseTickets.length > 0 && <div>
      <div className="loose__head"><b>Loose work</b><span>Active outside any package — no batch semantics, no stop-on-failure.</span></div>
      <div className="run-head-row run-cols"><span>id</span><span>ticket</span><span>state</span><span>claim</span><span>branch</span><span>worktree</span><span>activity</span></div>
      {looseTickets.map(renderRow)}
    </div>}

    {workspace.migration && migrationCount > 0 && <div className="migration-bar">
      <span className="badge">migration mode</span>
      <span>{migrationCount} ticket{migrationCount === 1 ? "" : "s"} carry a split stamp from the legacy lanes. Kept out of the default flow.</span>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenMigration}>Open split-audit log →</button>
    </div>}
  </div>;
}

/* ══ Done stage ════════════════════════════════════════ */
export function DoneStage({ workspace, onEntity }: { workspace: Workspace; onEntity: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const done = workspace.tickets.filter((t) => t.status === "done");
  const filtered = done.filter((t) => { const n = query.toLowerCase().trim(); return !n || `${t.id} ${t.title} ${t.migration?.legacy_id ?? ""}`.toLowerCase().includes(n); });
  return <div>
    <div className="stage__head">
      <div style={{ flex: 1 }}><h2>Done</h2><p>Archive. Searchable, read-only, provenance intact.</p></div>
      <input className="input" style={{ maxWidth: 300 }} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search T-042, O-38, title…" />
    </div>
    <div className="done-wrap">
      {filtered.length === 0 ? <div className="pane-empty" style={{ padding: 0 }}>No resolved work{query ? " matches your search" : ""}.</div> : <table className="table">
        <thead><tr><th style={{ width: 70 }}>id</th><th>title</th><th style={{ width: 100 }}>type</th><th style={{ width: 90 }}>package</th><th style={{ width: 120 }}>resolution</th></tr></thead>
        <tbody>{filtered.map((t) => <tr key={t.id}>
          <td><Eid id={t.id} onClick={() => onEntity(t.id)} /></td>
          <td style={{ lineHeight: 1.3 }}>{t.title}</td>
          <td><span className="tag tag-neutral">{t.types[0] ?? "ticket"}</span></td>
          <td>{t.package ? <Eid id={t.package} onClick={() => onEntity(t.package!)} /> : "—"}</td>
          <td style={{ opacity: .7, fontSize: 12 }}>{t.resolution || "resolved"}</td>
        </tr>)}</tbody>
      </table>}
    </div>
  </div>;
}

/* ══ Chat dock ═════════════════════════════════════════ */
function ChatDock({ open, setOpen, threads, order, activeId, setActiveId, agents, onDraft, onAgent, onStarter, onSend, onEntity, onSource, status }: {
  open: boolean; setOpen: (v: boolean) => void; threads: Record<string, Thread>; order: string[]; activeId: string; setActiveId: (id: string) => void; agents: AgentAvailability;
  onDraft: (id: string, draft: string) => void; onAgent: (id: string, agent: Agent) => void; onStarter: (id: string, prompt: string) => void; onSend: (id: string) => void; onEntity: (id: string) => void; onSource: (r: SourceReference) => void; status: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const active = threads[activeId];
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [active?.messages]);
  const meta = active ? threadMeta(active.scope, active.kind) : null;
  const running = active?.messages.some((m) => m.streaming) ?? false;
  const chip = (scope: string, kind: ThreadKind) => (kind === "workspace" ? "WORKSPACE" : scope);
  const dotFor = (t: Thread) => (t.messages.some((m) => m.streaming) ? "codex" : t.agent);

  if (!open) return <div className="dock-collapsed">
    <button type="button" className="dock-collapsed__toggle" onClick={() => setOpen(true)}><span className="mono">▲</span> Chat dock</button>
    <div className="dock-collapsed__pills scroll">{order.map((id) => { const t = threads[id]; if (!t) return null; return <button key={id} type="button" className={`dock-pill ${id === activeId ? "is-active" : ""}`} onClick={() => { setActiveId(id); setOpen(true); }}><span className={`eid stamp-${kindStampSuffix(t.kind)} on-dark`}>{chip(t.scope, t.kind)}</span><span style={{ opacity: .65 }}>{t.agent}</span></button>; })}</div>
    <span className="dock-collapsed__status">{status}</span>
  </div>;

  const onKey = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSend(activeId); } };

  return <div className="dock">
    <div className="dock__threads">
      <div className="dock__threads-head"><b>Threads</b><button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>Collapse ▼</button></div>
      <div className="dock__threads-list scroll">{order.map((id) => { const t = threads[id]; if (!t) return null; const m = threadMeta(t.scope, t.kind); const last = t.messages[t.messages.length - 1];
        return <button key={id} type="button" className={`dock-thread ${id === activeId ? "is-active" : ""}`} onClick={() => setActiveId(id)}>
          <div className="dock-thread__top"><span className={`dock-thread__chip eid stamp-${kindStampSuffix(t.kind)}`}>{chip(t.scope, t.kind)}</span><span className="dock-thread__level">{t.kind}</span><span className={`dot dot-${dotFor(t)}`} style={{ marginLeft: "auto" }} /></div>
          <div className="dock-thread__title">{m.title}</div>
          <div className="dock-thread__preview">{last ? snippet(last.body, 60) || "…" : m.starters[0]}</div>
        </button>; })}</div>
      <div className="dock__gap"><div className="kicker">{GAP}</div><div>Threads are in-memory today. Spec: persist per entity under .a-team/threads/.</div></div>
    </div>
    <div className="dock__conv">
      {active && meta && <>
        <div className="dock__conv-head">
          <span className={`chip eid stamp-${kindStampSuffix(active.kind)}`}>{chip(active.scope, active.kind)}</span><span className="title">{meta.title}</span><span className="ctx">{meta.context}</span>
          <span className="dock__route">
            <span className="kicker">route to</span>
            <button type="button" className={`route-btn ${active.agent === "codex" ? "is-active" : ""}`} disabled={running || !agents.codex} onClick={() => onAgent(activeId, "codex")}><span className="dot dot-codex" />codex</button>
            <button type="button" className={`route-btn ${active.agent === "claude" ? "is-active" : ""}`} disabled={running || !agents.claude} onClick={() => onAgent(activeId, "claude")}><span className="dot dot-claude" />claude {!agents.claude && <em>off</em>}</button>
          </span>
        </div>
        <div className="dock__msgs scroll" ref={scrollRef}>
          {active.messages.map((m) => <div key={m.id} className="dock-msg">
            <div className={`dock-msg__who ${m.role === "user" ? "operator" : "agent"}`}>{m.role === "user" ? "operator" : (m.agent ?? "agent")}</div>
            <div className={`dock-msg__body ${m.role === "user" ? "operator" : ""}`}><MarkdownContent value={m.body} onEntity={onEntity} onSource={onSource} className={m.role === "user" ? "" : ""} />{m.streaming && <span className="stream-caret">▍</span>}</div>
          </div>)}
          {active.messages.length === 0 && <div className="dock-starters">{meta.starters.map((s) => <button key={s} type="button" className="btn btn-secondary btn-sm" onClick={() => onStarter(activeId, s)}>{s}</button>)}</div>}
        </div>
        <div className="dock__composer">
          <div className="dock__composer-main">
            <textarea className="input" value={active.draft} onChange={(e) => onDraft(activeId, e.target.value)} onKeyDown={onKey} placeholder={meta.placeholder} />
            <div className="dock__composer-meta"><span>{meta.contextNote}</span><span className="mono">⌘↵ send</span></div>
          </div>
          <button type="button" className="btn btn-primary" style={{ padding: "11px 16px" }} disabled={!active.draft.trim() || running} onClick={() => onSend(activeId)}>Send</button>
        </div>
      </>}
    </div>
  </div>;
}

/* ══ Overlays ══════════════════════════════════════════ */
function ShortcutSheet({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    ["g i / g s", "Jump to Inbox / Shape"], ["g p / g r", "Jump to Packages / Run"], ["g d", "Jump to Done"],
    ["j / k", "Move down / up the current list"], ["v", "Validate the focused backlog ticket"],
    ["c", "Toggle the chat dock"], ["/", "Jump to Done search"], ["?", "This sheet"], ["esc", "Close overlays"],
  ];
  return <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="sheet">
      <div className="sheet__head"><b>Keyboard</b><span>Every shortcut has a clickable equivalent.</span><button type="button" onClick={onClose}>✕</button></div>
      <div className="sheet__body">{shortcuts.map(([keys, what]) => <div key={keys} className="kb-row"><span className="keys">{keys}</span><span className="what">{what}</span></div>)}</div>
    </div>
  </div>;
}

function SourceDrawer({ reference, onClose, onEntity, onSource }: { reference: SourceReference; onClose: () => void; onEntity: (id: string) => void; onSource: (r: SourceReference) => void }) {
  const [document, setDocument] = useState<SourceDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (reference.id) params.set("id", reference.id);
    if (reference.path) params.set("path", reference.path);
    setDocument(null); setError(null);
    fetch(`/api/source?${params}`, { signal: controller.signal })
      .then(async (response) => { const result = await response.json() as SourceDocument & { ok?: boolean; error?: string }; if (!response.ok || result.ok === false) throw new Error(result.error ?? `Source lookup failed (HTTP ${response.status}).`); setDocument(result); })
      .catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : String(reason)); });
    return () => controller.abort();
  }, [reference.id, reference.path]);
  useEffect(() => { const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [onClose]);
  return <div className="overlay overlay--right" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <aside className="drawer scroll" role="dialog" aria-modal="true" aria-label="Historical source" style={{ position: "relative" }}>
      <button type="button" className="btn btn-secondary btn-icon drawer__close" onClick={onClose} aria-label="Close">✕</button>
      <div className="drawer__eyebrow"><span className="tag tag-outline">read-only source</span>{document?.id && <span>{document.id}</span>}</div>
      {error ? <div className="inline-error"><b>SOURCE UNAVAILABLE</b><p style={{ margin: "6px 0 0" }}>{error}</p></div>
        : document ? <><h2>{document.title}</h2><p className="drawer__path">{document.path}</p><MarkdownContent value={document.content} onEntity={onEntity} onSource={onSource} /></>
          : <div className="boot" style={{ height: "auto", marginTop: 40 }}><div className="boot__spin" /><div className="boot__mark">Reading historical contract…</div></div>}
    </aside>
  </div>;
}

function MigrationDrawer({ migration, onClose, onEntity, onSource }: { migration: Migration; onClose: () => void; onEntity: (id: string) => void; onSource: (r: SourceReference) => void }) {
  useEffect(() => { const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [onClose]);
  return <div className="overlay overlay--right" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <aside className="drawer scroll" role="dialog" aria-modal="true" aria-label="Migration decisions" style={{ position: "relative" }}>
      <button type="button" className="btn btn-secondary btn-icon drawer__close" onClick={onClose} aria-label="Close">✕</button>
      <div className="drawer__eyebrow"><span className="tag tag-outline">migration log</span><span>{migration.split_audit.length} decisions</span></div>
      <h2>Where the old board changed shape</h2>
      <p style={{ opacity: .75, marginTop: -8 }}>Source truth is preserved. Compound work becomes packages or independent tickets; nothing is silently promoted to Defined.</p>
      <section style={{ borderTop: 0 }}>{migration.split_audit.map((split) => <div key={split.legacy_id} className="split-item">
        <div className="split-item__top"><button type="button" className="inline-entity mono" onClick={() => onEntity(split.legacy_id)}>{split.legacy_id}</button><span className="disp">{split.disposition}</span></div>
        <MarkdownContent value={split.reason} onEntity={onEntity} onSource={onSource} />
        <div className="split-item__targets">{split.targets.length ? split.targets.map((t) => <button key={t} type="button" className="inline-entity mono" onClick={() => onEntity(t)}>{t}</button>) : <span style={{ color: "var(--accent-400)" }}>→ package</span>}</div>
      </div>)}</section>
    </aside>
  </div>;
}

/* ── Entity detail drawer ────────────────────────────── */
const ID_SPLIT = new RegExp(`(\\b${ENTITY_SOURCE}\\b)`, "g");
const ID_TEST = new RegExp(`^${ENTITY_SOURCE}$`);
function titleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}
function InlineIds({ text, onEntity }: { text: string; onEntity: (id: string) => void }) {
  return <>{text.split(ID_SPLIT).map((part, i) => ID_TEST.test(part)
    ? <button key={i} type="button" className="inline-entity mono" title={entityLabel(part)} onClick={() => onEntity(part)}>{displayId(part)}</button>
    : part)}</>;
}
function EntityDrawer({ id, workspace, onClose, onEntity, onSource, onDiscuss }: {
  id: string; workspace: Workspace; onClose: () => void; onEntity: (id: string) => void; onSource: (r: SourceReference) => void; onDiscuss: (id: string) => void;
}) {
  useEffect(() => { const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [onClose]);
  const ticket = workspace.tickets.find((t) => t.id === id);
  const pkg = workspace.packages.find((p) => p.id === id);
  const finding = workspace.findings.find((f) => f.id === id);
  const entity = ticket ?? pkg ?? finding;
  if (!entity) return null;
  const kind = ticket ? "ticket" : pkg ? "package" : "finding";
  const drift = (workspace.diagnostics ?? []).filter((d) => d.id === entity.id);
  const chips: Array<[string, string]> = [];
  if (ticket) {
    chips.push(["status", ticket.status], ["priority", `P·${ticket.priority}`], ["risk", ticket.risk]);
    if (ticket.types?.length) chips.push(["type", ticket.types.join(", ")]);
    chips.push(["package", ticket.package ?? "unpackaged"]);
    if (ticket.depends_on?.length) chips.push(["depends on", ticket.depends_on.join(" ")]);
    if (ticket.branch) chips.push(["branch", ticket.branch]);
    if (ticket.blocked) chips.push(["blocked", "yes"]);
    if (ticket.resolution) chips.push(["resolution", ticket.resolution]);
  } else if (finding) {
    chips.push(["status", finding.status], ["type", finding.finding_type], ["severity", finding.severity], ["confidence", finding.confidence]);
    if (finding.discovered_during) chips.push(["discovered during", finding.discovered_during]);
    if (finding.became) chips.push(["became", finding.became]);
    if (finding.resolution) chips.push(["disposition", finding.resolution]);
  } else if (pkg) {
    chips.push(["status", pkg.status], ["kind", pkg.kind], ["members", (pkg.tickets ?? []).join(" ") || "—"]);
    if (pkg.execution?.mode) chips.push(["execution", `${pkg.execution.mode} · parallelism ${pkg.execution.parallelism ?? "?"} · ${pkg.execution.stop_on_failure ? "stop on failure" : "continue on failure"}`]);
  }
  return <div className="overlay overlay--right" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <aside className="drawer scroll" role="dialog" aria-modal="true" aria-label={`${kind} detail`} style={{ position: "relative" }}>
      <button type="button" className="btn btn-secondary btn-icon drawer__close" onClick={onClose} aria-label="Close">✕</button>
      <div className="drawer__eyebrow"><span className="tag tag-outline">{kind}</span><span className="mono">{entity.id}</span></div>
      <h2 style={{ marginTop: 4 }}>{entity.title}</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "12px 0 4px" }}>
        {chips.map(([k, v]) => <span key={k} className="tag tag-neutral" style={{ fontWeight: 500 }}><span style={{ opacity: .55 }}>{k}: </span><InlineIds text={v} onEntity={onEntity} /></span>)}
      </div>
      {drift.length > 0 && <div className="callout-fail" style={{ marginTop: 10 }}><div className="kicker">state drift</div>{drift.map((d, i) => <div key={i} className="mono" style={{ fontSize: 12.5 }}>{d.message} · {d.worktree}</div>)}</div>}
      {Object.entries(entity.sections ?? {}).map(([name, body]) => body && body.trim()
        ? <section key={name}><div className="kicker">{titleCase(name)}</div><MarkdownContent value={body} onEntity={onEntity} onSource={onSource} /></section>
        : null)}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onDiscuss(entity.id)}>Discuss</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onSource({ id: entity.id })}>Raw source</button>
      </div>
    </aside>
  </div>;
}

/* ── Thread metadata (seeded context + starters) ─────── */
function threadMeta(scope: string, kind: ThreadKind): { title: string; context: string; placeholder: string; contextNote: string; starters: string[] } {
  if (kind === "workspace") return { title: "What should I do next?", context: "no entity attached · repo context", placeholder: "Ask about the whole workspace…", contextNote: "Workspace context", starters: ["Summarize state", "What should I do next?", "Draft a finding"] };
  if (kind === "package") return { title: scope, context: "package goal + members", placeholder: `Message about ${scope}…`, contextNote: "Package context — members, execution mode", starters: ["What belongs together?", "Plan the launch", "Intervene in the run"] };
  if (kind === "finding") return { title: scope, context: "finding evidence", placeholder: `Discuss ${scope}…`, contextNote: "Finding context — evidence, provenance", starters: ["Is this a real bug?", "Draft a ticket from this", "What's the smallest fix?"] };
  return { title: scope, context: "ticket contract + repo", placeholder: `Message about ${scope}…`, contextNote: "Ticket context attached — contract, branch, worktree", starters: ["Investigate & propose", "Start implementation", "Tighten acceptance"] };
}
function scopeKind(id: string): ThreadKind {
  if (id === "workspace") return "workspace";
  if (/^P-/.test(id)) return "package";
  if (/^F-/.test(id)) return "finding";
  return "ticket";
}

/* ══ App ═══════════════════════════════════════════════ */
export function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("inbox");
  const [cursor, setCursor] = useState(0);
  const [agents, setAgents] = useState<AgentAvailability>({ codex: false, claude: false });
  const [refreshed, setRefreshed] = useState(0);
  const [validated, setValidated] = useState<Record<string, ValidationState>>({});
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [sourceReference, setSourceReference] = useState<SourceReference | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showMigration, setShowMigration] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [driftOpen, setDriftOpen] = useState(false);
  // dock
  const [dockOpen, setDockOpen] = useState(false);
  const [threads, setThreads] = useState<Record<string, Thread>>({ workspace: { scope: "workspace", kind: "workspace", agent: "claude", draft: "", messages: [], threadId: null } });
  const [threadOrder, setThreadOrder] = useState<string[]>(["workspace"]);
  const [activeThread, setActiveThread] = useState("workspace");
  const controllersRef = useRef(new Set<AbortController>());
  const pendingKey = useRef<string | null>(null);

  const refreshWorkspace = useCallback(async (fatal = false) => {
    try {
      const response = await fetch("/api/workspace");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setWorkspace(await response.json() as Workspace);
      setRefreshed(0);
      setError(null);
    } catch (reason) { if (fatal) setError(String(reason)); }
  }, []);
  useEffect(() => { void refreshWorkspace(true); const timer = window.setInterval(() => void refreshWorkspace(false), 1_500); return () => window.clearInterval(timer); }, [refreshWorkspace]);
  useEffect(() => { const t = window.setInterval(() => setRefreshed((r) => (r + 1) % 60), 1_000); return () => window.clearInterval(t); }, []);
  useEffect(() => { fetch("/api/agents").then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))).then(setAgents).catch(() => setAgents({ codex: false, claude: false })); }, []);
  useEffect(() => () => { controllersRef.current.forEach((c) => c.abort()); controllersRef.current.clear(); }, []);

  const ticketMap = useMemo(() => new Map((workspace?.tickets ?? []).map((t) => [t.id, t])), [workspace]);
  const packageMap = useMemo(() => new Map((workspace?.packages ?? []).map((p) => [p.id, p])), [workspace]);
  useMemo(() => {
    entityTitles.clear();
    (workspace?.tickets ?? []).forEach((t) => entityTitles.set(t.id, t.title));
    (workspace?.packages ?? []).forEach((p) => entityTitles.set(p.id, p.title));
    (workspace?.findings ?? []).forEach((f) => entityTitles.set(f.id, f.title));
  }, [workspace]);

  const openThread = useCallback((scope: string) => {
    const kind = scopeKind(scope);
    setThreads((current) => current[scope] ? current : { ...current, [scope]: { scope, kind, agent: kind === "ticket" ? "codex" : "claude", draft: "", messages: [], threadId: null } });
    setThreadOrder((order) => order.includes(scope) ? order : [...order, scope]);
    setActiveThread(scope);
    setDockOpen(true);
  }, []);

  const openEntity = useCallback((id: string) => {
    const ticket = workspace?.tickets.find((t) => t.id === id || t.migration?.legacy_id === id);
    if (ticket) { setSourceReference(null); setDetailId(ticket.id); return; }
    const pkg = workspace?.packages.find((p) => p.id === id);
    if (pkg) { setSourceReference(null); setDetailId(pkg.id); return; }
    const finding = workspace?.findings.find((f) => f.id === id);
    if (finding) { setSourceReference(null); setDetailId(finding.id); return; }
    setSourceReference({ id });
  }, [workspace]);

  const validate = useCallback(async (ticket: Ticket) => {
    setValidated((v) => ({ ...v, [ticket.id]: { status: "checking" } }));
    try {
      const response = await fetch("/api/ticket/ready", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ticketId: ticket.id }) });
      const result = await response.json() as { ok?: boolean; errors?: Array<{ code?: string; message?: string }> };
      if (!response.ok || result.ok === false) {
        const issues = (result.errors ?? []).map((e) => ({ field: e.code || "ready", text: e.message || e.code || "Definition check failed." }));
        setValidated((v) => ({ ...v, [ticket.id]: { status: "fail", issues: issues.length ? issues : [{ field: "ready", text: "Definition check failed." }] } }));
      } else setValidated((v) => ({ ...v, [ticket.id]: { status: "ok" } }));
    } catch (reason) {
      setValidated((v) => ({ ...v, [ticket.id]: { status: "fail", issues: [{ field: "error", text: reason instanceof Error ? reason.message : String(reason) }] } }));
    } finally { await refreshWorkspace(false); }
  }, [refreshWorkspace]);

  const setDraft = (id: string, draft: string) => setThreads((c) => ({ ...c, [id]: { ...c[id], draft } }));
  const setThreadAgent = (id: string, agent: Agent) => setThreads((c) => ({ ...c, [id]: { ...c[id], agent } }));
  const applyStarter = (id: string, prompt: string) => setThreads((c) => ({ ...c, [id]: { ...c[id], draft: prompt } }));

  const sendMessage = useCallback(async (scope: string) => {
    const thread = threads[scope];
    if (!thread) return;
    const prompt = thread.draft.trim();
    if (!prompt || thread.messages.some((m) => m.streaming)) return;
    const userMessage: ChatMessage = { id: `${Date.now()}-user`, role: "user", body: prompt };

    if (thread.kind !== "ticket") {
      const note = `**${GAP}** ${thread.kind}-level chat isn't wired to an agent yet — ticket threads stream for real.\n\nTo act on this now, open a ticket thread, or run in an agent session:\n\n\`\`\`\n${thread.kind === "package" ? `/execute-package ${scope}` : thread.kind === "finding" ? `a-team finding show ${scope}` : "a-team --help"}\n\`\`\``;
      setThreads((c) => ({ ...c, [scope]: { ...c[scope], draft: "", messages: [...c[scope].messages, userMessage, { id: `${Date.now()}-a`, role: "assistant", agent: thread.agent, body: note }] } }));
      return;
    }

    const assistantId = `${Date.now()}-assistant`;
    let assistantBody = "";
    let activeThreadId = thread.threadId;
    const controller = new AbortController();
    controllersRef.current.add(controller);
    const push = (streaming: boolean) => setThreads((c) => ({ ...c, [scope]: { ...c[scope], threadId: activeThreadId, draft: "", messages: [...thread.messages, userMessage, { id: assistantId, role: "assistant", agent: thread.agent, body: assistantBody, streaming }] } }));
    push(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, signal: controller.signal, body: JSON.stringify({ ticketId: scope, agent: thread.agent, threadId: thread.threadId, message: prompt }) });
      if (!response.ok || !response.body) throw new Error(`Chat request failed (HTTP ${response.status}).`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const consume = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line) as { type: string; threadId?: string; delta?: string; message?: string };
        if (event.type === "thread" && event.threadId) activeThreadId = event.threadId;
        if (event.type === "delta" && event.delta) { assistantBody += event.delta; push(true); }
        if (event.type === "error") throw new Error(event.message ?? "Agent response failed.");
      };
      while (true) { const { done, value } = await reader.read(); buffer += decoder.decode(value, { stream: !done }); const lines = buffer.split("\n"); buffer = lines.pop() ?? ""; lines.forEach(consume); if (done) break; }
      consume(buffer); push(false); await refreshWorkspace(false);
    } catch (err) {
      if (!controller.signal.aborted) { assistantBody = assistantBody || `Could not get a response: ${err instanceof Error ? err.message : String(err)}`; push(false); }
    } finally { controllersRef.current.delete(controller); }
  }, [threads, refreshWorkspace]);

  // keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /input|textarea|select/i.test(target.tagName)) return;
      const k = e.key;
      if (pendingKey.current === "g") { pendingKey.current = null; const map: Record<string, Stage> = { i: "inbox", s: "shape", p: "packages", r: "run", d: "done" }; if (map[k]) { e.preventDefault(); setStage(map[k]); setCursor(0); } return; }
      if (k === "g") { pendingKey.current = "g"; return; }
      if (k === "?") { e.preventDefault(); setShortcutsOpen((v) => !v); }
      else if (k === "c") { e.preventDefault(); setDockOpen((v) => !v); }
      else if (k === "/") { e.preventDefault(); setStage("done"); }
      else if (k === "j" || k === "k") { e.preventDefault(); setCursor((c) => Math.max(0, c + (k === "j" ? 1 : -1))); }
      else if (k === "Escape") { setShortcutsOpen(false); setSourceReference(null); setShowMigration(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (error) return <main className="boot boot--fatal"><b>UI load failed</b><p>{error}</p></main>;
  if (!workspace) return <main className="boot"><div className="boot__spin" /><div className="boot__mark">Reading canonical files…</div></main>;

  const newFindings = workspace.findings.filter((f) => f.status === "new");
  const backlog = workspace.tickets.filter((t) => t.status === "backlog");
  const ready = workspace.tickets.filter((t) => t.status === "ready");
  const runTickets = workspace.tickets.filter((t) => ["active", "review"].includes(t.status) || t.blocked);
  const reviewTickets = workspace.tickets.filter((t) => t.status === "review");
  const blockedTickets = workspace.tickets.filter((t) => t.blocked);
  const done = workspace.tickets.filter((t) => t.status === "done");
  const diagnostics = workspace.diagnostics ?? [];

  const counts: Record<Stage, number> = { inbox: newFindings.length, shape: backlog.length + ready.length, packages: workspace.packages.length, run: runTickets.length, done: done.length };

  const needs = [
    { n: newFindings.length, label: "Findings to disposition", dest: "Inbox", go: () => setStage("inbox") },
    { n: reviewTickets.length, label: "Review waiting", dest: "Run", go: () => setStage("run") },
    { n: blockedTickets.length, label: "Blocked", dest: "Run", go: () => setStage("run") },
    { n: diagnostics.length, label: "State drift", dest: "Run", hot: true, go: () => { setStage("run"); setDriftOpen(true); } },
  ];

  return <div className="app">
    <Rail project={workspace.project} stage={stage} counts={counts} onStage={setStage} onShortcuts={() => setShortcutsOpen(true)} refreshed={refreshed} />
    <div className="content">
      <NeedsStrip items={needs} running={runTickets.filter((t) => !t.blocked).length} ready={ready.length} onSearch={() => setStage("done")} />
      <main className="stage scroll">
        {stage === "inbox" && <InboxStage workspace={workspace} onRefresh={() => refreshWorkspace(false)} onEntity={openEntity} onSource={setSourceReference} onDiscuss={openThread} cursor={cursor} />}
        {stage === "shape" && <ShapeStage workspace={workspace} packageMap={packageMap} validated={validated} onValidate={(t) => void validate(t)} onEntity={openEntity} onDiscuss={openThread} cursor={cursor} />}
        {stage === "packages" && <PackagesStage workspace={workspace} ticketMap={ticketMap} selected={selectedPackage} onSelect={setSelectedPackage} onEntity={openEntity} onSource={setSourceReference} onDiscuss={openThread} onRefresh={async (id) => { await refreshWorkspace(false); if (id) setSelectedPackage(id); }} />}
        {stage === "run" && <RunStage workspace={workspace} packageMap={packageMap} ticketMap={ticketMap} onEntity={openEntity} onSource={setSourceReference} onDiscuss={openThread} onOpenMigration={() => setShowMigration(true)} driftOpen={driftOpen} setDriftOpen={setDriftOpen} />}
        {stage === "done" && <DoneStage workspace={workspace} onEntity={openEntity} />}
      </main>
      <ChatDock open={dockOpen} setOpen={setDockOpen} threads={threads} order={threadOrder} activeId={activeThread} setActiveId={setActiveThread} agents={agents}
        onDraft={setDraft} onAgent={setThreadAgent} onStarter={applyStarter} onSend={(id) => void sendMessage(id)} onEntity={openEntity} onSource={setSourceReference}
        status={threads[activeThread]?.messages.some((m) => m.streaming) ? `${threads[activeThread].agent} streaming` : "idle"} />
    </div>
    {shortcutsOpen && <ShortcutSheet onClose={() => setShortcutsOpen(false)} />}
    {sourceReference && <SourceDrawer reference={sourceReference} onClose={() => setSourceReference(null)} onEntity={openEntity} onSource={setSourceReference} />}
    {detailId && <EntityDrawer id={detailId} workspace={workspace} onClose={() => setDetailId(null)} onEntity={openEntity} onSource={setSourceReference} onDiscuss={openThread} />}
    {showMigration && workspace.migration && <MigrationDrawer migration={workspace.migration} onClose={() => setShowMigration(false)} onEntity={openEntity} onSource={setSourceReference} />}
  </div>;
}
