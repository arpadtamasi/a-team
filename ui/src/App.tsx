import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
type Finding = { id: string; title: string; status: "new" | "resolved"; finding_type: string; severity: string; confidence: string; discovered_during?: string | null; sections: Record<string, string> };
type Workspace = { project: string; migration: Migration | null; tickets: Ticket[]; packages: Package[]; findings: Finding[] };
type Agent = "codex" | "claude";
type ChatMessage = { id: string; role: "user" | "assistant"; agent?: Agent; body: string; streaming?: boolean };
type Thread = { agent: Agent; draft: string; messages: ChatMessage[]; threadId: string | null };
type AgentAvailability = Record<Agent, boolean>;
type TransitionError = { ticketId: string; title: string; issues: string[] };
type FocusView = "all" | "needs-you" | "active" | "blocked" | "unpackaged" | "ready-candidates";
type SourceReference = { id?: string; path?: string };
type SourceDocument = { path: string; title: string; id: string | null; content: string };
type MarkdownNode = { type: string; value?: string; url?: string; children?: MarkdownNode[] };

const ENTITY_PATTERN = /\b(?:O-\d+(?:\.\d+)?|T-\d+|F-\d+|P-\d+)\b/g;

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
      if (entityId) return <button type="button" className="markdown-link markdown-link--entity" onClick={() => onEntity(entityId)}>{children}</button>;
      if (/\.md(?:#.*)?$/i.test(href)) return <button type="button" className="markdown-link markdown-link--source" onClick={() => onSource({ path: href.split("#")[0] })}>{children}</button>;
      if (/^https?:|^mailto:/.test(href)) return <a href={href} target="_blank" rel="noreferrer noopener">{children}</a>;
      return <span>{children}</span>;
    } }}
  >{normalizeMarkdown(value)}</ReactMarkdown></div>;
}

const STATUSES: Array<{ id: Status; label: string; short: string }> = [
  { id: "backlog", label: "Backlog", short: "Unshaped" }, { id: "ready", label: "Ready", short: "Executable" },
  { id: "active", label: "Active", short: "In flight" }, { id: "review", label: "Review", short: "Evidence" },
  { id: "done", label: "Done", short: "Resolved" },
];

function snippet(value?: string, length = 150): string {
  const plain = (value ?? "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<https?:\/\/[^>]+>/g, "link")
    .replace(/^\s*[-+*]\s+/gm, "")
    .replace(/[`*_#>|~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > length ? `${plain.slice(0, length).trim()}…` : plain;
}

function Stat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return <div className={`stat ${accent ? "stat--accent" : ""}`}><strong>{value}</strong><span>{label}</span></div>;
}

function TicketCard({ ticket, index, onOpen, onReady, readyBusy }: { ticket: Ticket; index: number; onOpen: (ticket: Ticket) => void; onReady: (ticket: Ticket) => void; readyBusy: boolean }) {
  return <article className={`ticket-card priority-${ticket.priority}`} style={{ "--delay": `${Math.min(index, 12) * 28}ms` } as CSSProperties}>
    <button className="ticket-card__open" onClick={() => onOpen(ticket)}>
      <div className="ticket-card__top"><span className="ticket-id">{ticket.id}</span>{ticket.migration && ticket.migration.legacy_id !== ticket.id && <span className="legacy-id">← {ticket.migration.legacy_id}</span>}</div>
      <h3>{ticket.title}</h3><p>{snippet(ticket.sections.outcome)}</p>
      <div className="ticket-card__labels"><span>{ticket.migration?.lane ?? ticket.types[0]}</span>{ticket.migration?.split && <span className="label-split">split</span>}{ticket.migration?.status_correction && <span className="label-corrected">corrected</span>}{ticket.migration?.ready_candidate && ticket.status === "backlog" && <span className="label-ready">ready?</span>}{ticket.blocked && <span className="label-blocked">blocked</span>}</div>
    </button>
    {ticket.status === "backlog" && <footer className="ticket-card__actions"><button className="ticket-card__ready" disabled={readyBusy} onClick={() => onReady(ticket)}>{readyBusy ? "Checking…" : "Validate → Ready"}</button></footer>}
  </article>;
}

function EmptyColumn({ status }: { status: Status }) {
  const copy: Record<Status, string> = { backlog: "No unscheduled work.", ready: "Human approval has not moved any migrated ticket here yet.", active: "No claims or worktrees were imported.", review: "Migration never invents review evidence.", done: "No resolved work." };
  return <div className="empty-column"><span>∅</span><p>{copy[status]}</p></div>;
}

async function postJson(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json() as Record<string, unknown>;
  if (!response.ok || result.ok === false) throw new Error(typeof result.error === "string" ? result.error : `Request failed (HTTP ${response.status}).`);
  return result;
}

function FindingsSection({ findings, onRefresh, onEntity, onSource }: { findings: Finding[]; onRefresh: () => Promise<void>; onEntity: (id: string) => void; onSource: (reference: SourceReference) => void }) {
  const [capturing, setCapturing] = useState(false);
  const [title, setTitle] = useState(""); const [evidence, setEvidence] = useState(""); const [type, setType] = useState("product");
  const [busy, setBusy] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  const open = findings.filter((finding) => finding.status === "new");
  const capture = async () => {
    setBusy("new"); setError(null);
    try { await postJson("/api/finding", { title, evidence, type }); setTitle(""); setEvidence(""); setCapturing(false); await onRefresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { setBusy(null); }
  };
  const resolve = async (findingId: string, disposition: "create-ticket" | "reject") => {
    setBusy(findingId); setError(null);
    try { await postJson("/api/finding/resolve", { findingId, disposition }); await onRefresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { setBusy(null); }
  };
  return <section className="findings-section">
    <div className="section-label"><span>01</span><h2>Findings inbox</h2><p>Evidence awaiting human disposition — not tasks yet.</p></div>
    <div className="findings-toolbar"><div><b>{open.length}</b><span>OPEN OBSERVATIONS</span></div><button onClick={() => setCapturing((value) => !value)}>{capturing ? "Cancel" : "+ Capture finding"}</button></div>
    {capturing && <div className="finding-form"><label><span>TYPE</span><select value={type} onChange={(event) => setType(event.target.value)}><option value="product">Product</option><option value="bug">Bug</option><option value="risk">Risk</option><option value="technical">Technical</option></select></label><label><span>TITLE</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What did you notice?" /></label><label className="finding-form__evidence"><span>EVIDENCE</span><textarea value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Concrete observation, reproduction, log, or source…" /></label><button disabled={!title.trim() || !evidence.trim() || busy === "new"} onClick={() => void capture()}>{busy === "new" ? "Saving…" : "Save to inbox"}</button></div>}
    {error && <p className="inline-error">{error}</p>}
    {open.length ? <div className="finding-strip">{open.map((finding) => <article id={`entity-${finding.id}`} className="finding-card" key={finding.id}><header><b>{finding.id}</b><span>{finding.finding_type} · {finding.severity}</span></header><h3>{finding.title}</h3><MarkdownContent className="finding-card__evidence" value={finding.sections.evidence || finding.sections.observation || "—"} onEntity={onEntity} onSource={onSource} />{finding.discovered_during && <small>DISCOVERED DURING <button className="inline-entity" onClick={() => onEntity(finding.discovered_during!)}>{finding.discovered_during}</button></small>}<footer><button disabled={busy === finding.id} onClick={() => void resolve(finding.id, "reject")}>Reject</button><button disabled={busy === finding.id} onClick={() => void resolve(finding.id, "create-ticket")}>Create ticket →</button></footer></article>)}</div> : <div className="findings-empty"><b>INBOX ZERO</b><span>No unresolved findings. Agents can add evidence here without expanding ticket scope.</span></div>}
  </section>;
}

function PackageDrawer({ pkg, tickets, onClose, onRefresh, onEntity, onSource }: { pkg: Package | null; tickets: Ticket[]; onClose: () => void; onRefresh: (packageId?: string) => Promise<void>; onEntity: (id: string) => void; onSource: (reference: SourceReference) => void }) {
  const creating = pkg === null;
  const [title, setTitle] = useState(""); const [goal, setGoal] = useState(""); const [kind, setKind] = useState("batch");
  const [busy, setBusy] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  useEffect(() => { const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose(); window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [onClose]);
  const create = async () => {
    setBusy("create"); setError(null);
    try { const result = await postJson("/api/package", { title, goal, kind }); const data = result.data as { id?: string } | undefined; await onRefresh(data?.id); }
    catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { setBusy(null); }
  };
  const changeMembership = async (ticketId: string, action: "add" | "remove") => {
    if (!pkg) return; setBusy(ticketId); setError(null);
    try { await postJson("/api/package/tickets", { packageId: pkg.id, ticketId, action }); await onRefresh(pkg.id); }
    catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { setBusy(null); }
  };
  const members = pkg ? tickets.filter((ticket) => pkg.tickets.includes(ticket.id)) : [];
  const available = pkg ? tickets.filter((ticket) => !pkg.tickets.includes(ticket.id)) : [];
  return <div className="drawer-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="drawer drawer--package" role="dialog" aria-modal="true" aria-label={creating ? "Create package" : `Manage ${pkg.id}`}><button className="drawer__close" onClick={onClose}>×</button><div className="drawer__eyebrow"><span>{creating ? "NEW PACKAGE" : pkg.id}</span><span>{creating ? "BACKLOG DRAFT" : pkg.status}</span></div><h2>{creating ? "Create an outcome container" : pkg.title}</h2>
    {creating ? <div className="package-form"><label><span>TITLE</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Release slice, milestone, batch…" /></label><label><span>KIND</span><select value={kind} onChange={(event) => setKind(event.target.value)}><option value="batch">Batch</option><option value="milestone">Milestone</option><option value="mission">Mission</option><option value="sprint">Sprint</option></select></label><label><span>GOAL</span><textarea value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="What shared outcome does this package produce?" /></label><button disabled={!title.trim() || busy === "create"} onClick={() => void create()}>{busy === "create" ? "Creating…" : "Create package"}</button></div> : <><MarkdownContent className="drawer__lead drawer__markdown" value={pkg.sections.goal || "—"} onEntity={onEntity} onSource={onSource} />{pkg.status !== "backlog" && <div className="package-lock"><b>MEMBERSHIP LOCKED</b><span>Only backlog packages can be reshaped.</span></div>}<section><h4>Included tickets · {members.length}</h4><div className="package-ticket-list">{members.length ? members.map((ticket) => <article key={ticket.id}><div><button className="inline-entity" onClick={() => onEntity(ticket.id)}>{ticket.id}</button><span>{ticket.status}</span><p>{ticket.title}</p></div>{pkg.status === "backlog" && <button disabled={busy === ticket.id} onClick={() => void changeMembership(ticket.id, "remove")}>Remove</button>}</article>) : <p className="package-list-empty">No tickets yet. Add the work that shares this outcome.</p>}</div></section>{pkg.status === "backlog" && <section><h4>Available tickets · {available.length}</h4><div className="package-ticket-list package-ticket-list--available">{available.map((ticket) => <article key={ticket.id}><div><button className="inline-entity" onClick={() => onEntity(ticket.id)}>{ticket.id}</button><span>{ticket.status}</span><p>{ticket.title}</p></div><button disabled={busy === ticket.id} onClick={() => void changeMembership(ticket.id, "add")}>+ Add</button></article>)}</div></section>}</>}
    {error && <p className="inline-error">{error}</p>}
  </aside></div>;
}

function Drawer({ ticket, onClose, packageTitle, thread, agents, onThreadChange, onWorkspaceRefresh, onEntity, onSource }: { ticket: Ticket; onClose: () => void; packageTitle?: string; thread: Thread; agents: AgentAvailability; onThreadChange: (thread: Thread) => void; onWorkspaceRefresh: () => Promise<void>; onEntity: (id: string) => void; onSource: (reference: SourceReference) => void }) {
  const [view, setView] = useState<"chat" | "brief">("chat");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const controllersRef = useRef(new Set<AbortController>());
  useEffect(() => { const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose(); window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [onClose]);
  useEffect(() => { if (view === "chat") window.setTimeout(() => inputRef.current?.focus(), 80); }, [view, ticket.id]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [thread.messages]);
  useEffect(() => () => { controllersRef.current.forEach((controller) => controller.abort()); controllersRef.current.clear(); }, []);

  const send = async () => {
    const prompt = thread.draft.trim();
    if (!prompt || !agents[thread.agent] || thread.messages.some((message) => message.streaming)) return;
    const userMessage: ChatMessage = { id: `${Date.now()}-user`, role: "user", body: prompt };
    const assistantId = `${Date.now()}-assistant`;
    let assistantBody = "";
    let activeThreadId = thread.threadId;
    const controller = new AbortController();
    controllersRef.current.add(controller);
    onThreadChange({ ...thread, draft: "", messages: [...thread.messages, userMessage, { id: assistantId, role: "assistant", agent: thread.agent, body: "", streaming: true }] });
    const update = (streaming: boolean) => onThreadChange({ ...thread, threadId: activeThreadId, draft: "", messages: [...thread.messages, userMessage, { id: assistantId, role: "assistant", agent: thread.agent, body: assistantBody, streaming }] });
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, signal: controller.signal, body: JSON.stringify({ ticketId: ticket.id, agent: thread.agent, threadId: thread.threadId, message: prompt }) });
      if (!response.ok || !response.body) throw new Error(`Chat request failed (HTTP ${response.status}).`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const consume = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line) as { type: string; threadId?: string; delta?: string; message?: string };
        if (event.type === "thread" && event.threadId) activeThreadId = event.threadId;
        if (event.type === "delta" && event.delta) { assistantBody += event.delta; update(true); }
        if (event.type === "error") throw new Error(event.message ?? "Agent response failed.");
      };
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        lines.forEach(consume);
        if (done) break;
      }
      consume(buffer);
      update(false);
      await onWorkspaceRefresh();
    } catch (error) {
      if (!controller.signal.aborted) {
        assistantBody = assistantBody || `Could not get a response: ${error instanceof Error ? error.message : String(error)}`;
        update(false);
      }
    } finally {
      controllersRef.current.delete(controller);
    }
  };
  const onInputKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); send(); }
  };

  const running = thread.messages.some((message) => message.streaming);
  return <div className="drawer-layer drawer-layer--ticket" role="presentation">
    <aside className="drawer drawer--ticket" role="dialog" aria-modal="false" aria-label={`${ticket.id} workspace`}>
      <header className="ticket-drawer__header">
        <div className="drawer__eyebrow"><span>{ticket.id}</span><span>{ticket.status}</span><i>LOCAL THREAD</i></div>
        <button className="drawer__close" onClick={onClose} aria-label="Close ticket">×</button>
        <h2>{ticket.title}</h2>
        <nav className="drawer-tabs" aria-label="Ticket views"><button className={view === "chat" ? "is-active" : ""} onClick={() => setView("chat")}>Chat <b>{thread.messages.length || ""}</b></button><button className={view === "brief" ? "is-active" : ""} onClick={() => setView("brief")}>Brief</button></nav>
      </header>
      {view === "chat" ? <div className="chat-shell">
        <div className="chat-scroll" ref={scrollRef}>
          {thread.messages.length === 0 ? <div className="chat-empty">
            <div className="context-seal"><span>{ticket.id}</span><i>CONTEXT ATTACHED</i></div>
            <h3>Start where the work is.</h3><p>This thread already knows the ticket, repository, status and acceptance contract.</p>
            <div className="prompt-starters"><button onClick={() => onThreadChange({ ...thread, draft: "Investigate this ticket and propose the smallest safe implementation." })}>Investigate &amp; propose</button><button onClick={() => onThreadChange({ ...thread, draft: "Start implementing this ticket. Tell me when you need a decision." })}>Start implementation</button></div>
          </div> : <div className="message-list">{thread.messages.map((message) => <article key={message.id} className={`message message--${message.role}`}>
            <header>{message.role === "user" ? <><span>YOU</span><time>NOW</time></> : <><span className={`agent-dot agent-dot--${message.agent}`} /> <span>{message.agent}</span>{message.streaming && <i>WORKING</i>}</>}</header>
            <div className="message__body"><MarkdownContent value={message.body} onEntity={onEntity} onSource={onSource} />{message.streaming && <span className="stream-cursor" />}</div>
          </article>)}</div>}
        </div>
        <div className="composer-wrap">
          <div className="agent-switch" aria-label="Choose agent"><span>ROUTE TO</span><button disabled={running || !agents.codex} className={thread.agent === "codex" ? "is-active" : ""} onClick={() => onThreadChange({ ...thread, agent: "codex" })}><i className="agent-dot agent-dot--codex" />Codex</button><button title={agents.claude ? "Route this thread to Claude" : "Claude Code CLI is not connected"} disabled={running || !agents.claude} className={thread.agent === "claude" ? "is-active" : ""} onClick={() => onThreadChange({ ...thread, agent: "claude" })}><i className="agent-dot agent-dot--claude" />Claude {!agents.claude && <em>not connected</em>}</button></div>
          <div className="composer"><textarea ref={inputRef} value={thread.draft} onChange={(event) => onThreadChange({ ...thread, draft: event.target.value })} onKeyDown={onInputKeyDown} placeholder={`Message ${thread.agent} about ${ticket.id}…`} rows={3} /><footer><span>Ticket context attached</span><button onClick={send} disabled={!thread.draft.trim() || thread.messages.some((message) => message.streaming)}>Send <kbd>⌘↵</kbd></button></footer></div>
          <p className="prototype-note"><b>LIVE · WRITE</b> Workspace access · shared local sign-in</p>
        </div>
      </div> : <div className="brief-scroll">
        {ticket.migration && <div className="source-stamp"><span>LEGACY SOURCE</span><strong>{ticket.migration.legacy_id}</strong><small>{ticket.migration.legacy_status} · {ticket.migration.backlog_section} · {ticket.migration.lane}</small></div>}
        <section><h4>Outcome</h4><MarkdownContent value={ticket.sections.outcome || "—"} onEntity={onEntity} onSource={onSource} /></section><section><h4>Scope</h4><MarkdownContent value={ticket.sections.scope || "—"} onEntity={onEntity} onSource={onSource} /></section>
        <section><h4>Acceptance</h4><MarkdownContent value={ticket.sections.acceptance || "—"} onEntity={onEntity} onSource={onSource} /></section><section><h4>Verification</h4><MarkdownContent value={ticket.sections.verification || "—"} onEntity={onEntity} onSource={onSource} /></section>
        <dl className="fact-grid"><div><dt>Type</dt><dd>{ticket.types.join(", ")}</dd></div><div><dt>Profiles</dt><dd>{ticket.profiles.join(", ") || "none"}</dd></div><div><dt>Priority</dt><dd>{ticket.priority}</dd></div><div><dt>Risk</dt><dd>{ticket.risk}</dd></div><div><dt>Package</dt><dd>{packageTitle ?? "—"}</dd></div><div><dt>Depends on</dt><dd>{ticket.depends_on?.join(", ") || "none"}</dd></div></dl>
        {ticket.migration?.status_correction && <div className="correction-callout"><b>STATUS CORRECTION</b><p>{ticket.migration.status_correction}</p></div>}
        {ticket.status === "backlog" && ticket.migration?.ready_candidate && <div className="ready-callout"><b>READY CANDIDATE</b><p>The evidence looks complete, but migration cannot grant human approval.</p></div>}
      </div>}
    </aside>
  </div>;
}

function SourceDrawer({ reference, onClose, onEntity, onSource }: { reference: SourceReference; onClose: () => void; onEntity: (id: string) => void; onSource: (reference: SourceReference) => void }) {
  const [document, setDocument] = useState<SourceDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (reference.id) params.set("id", reference.id);
    if (reference.path) params.set("path", reference.path);
    setDocument(null); setError(null);
    fetch(`/api/source?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as SourceDocument & { ok?: boolean; error?: string };
        if (!response.ok || result.ok === false) throw new Error(result.error ?? `Source lookup failed (HTTP ${response.status}).`);
        setDocument(result);
      })
      .catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : String(reason)); });
    return () => controller.abort();
  }, [reference.id, reference.path]);
  useEffect(() => { const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose(); window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [onClose]);
  return <div className="drawer-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <aside className="drawer drawer--source" role="dialog" aria-modal="true" aria-label="Historical source">
      <button className="drawer__close" onClick={onClose} aria-label="Close source">×</button>
      <div className="drawer__eyebrow"><span>READ-ONLY SOURCE</span>{document?.id && <span>{document.id}</span>}</div>
      {error ? <div className="source-document__error"><b>SOURCE UNAVAILABLE</b><p>{error}</p></div> : document ? <>
        <h2>{document.title}</h2><p className="source-document__path">{document.path}</p>
        <MarkdownContent value={document.content} onEntity={onEntity} onSource={onSource} className="source-document__body" />
      </> : <div className="source-document__loading"><span />Reading historical contract…</div>}
    </aside>
  </div>;
}

function MigrationPanel({ migration, onClose, onEntity, onSource }: { migration: Migration; onClose: () => void; onEntity: (id: string) => void; onSource: (reference: SourceReference) => void }) {
  return <div className="drawer-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <aside className="drawer drawer--migration" role="dialog" aria-modal="true" aria-label="Migration decisions">
      <button className="drawer__close" onClick={onClose} aria-label="Close migration notes">×</button><div className="drawer__eyebrow"><span>MIGRATION LOG</span><span>{migration.split_audit.length} decisions</span></div>
      <h2>Where the old board changed shape</h2><p className="drawer__lead">Source truth is preserved. Compound work becomes packages or independent tickets; nothing is silently promoted to Ready.</p>
      <div className="split-list">{migration.split_audit.map((split) => <article key={split.legacy_id}><div><button className="inline-entity" onClick={() => onEntity(split.legacy_id)}>{split.legacy_id}</button><span>{split.disposition}</span></div><MarkdownContent value={split.reason} onEntity={onEntity} onSource={onSource} /><div className="split-list__targets">{split.targets.length ? split.targets.map((target) => <button key={target} className="inline-entity" onClick={() => onEntity(target)}>{target}</button>) : <span>→ package</span>}</div></article>)}</div>
    </aside>
  </div>;
}

export function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null); const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(""); const [lane, setLane] = useState("all"); const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [focus, setFocus] = useState<FocusView>("all");
  const [packageEditor, setPackageEditor] = useState<string | "new" | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null); const [showMigration, setShowMigration] = useState(false);
  const [sourceReference, setSourceReference] = useState<SourceReference | null>(null);
  const [threads, setThreads] = useState<Record<string, Thread>>({});
  const [agents, setAgents] = useState<AgentAvailability>({ codex: false, claude: false });
  const [transitioningTicketId, setTransitioningTicketId] = useState<string | null>(null);
  const [transitionError, setTransitionError] = useState<TransitionError | null>(null);
  const closeTicket = () => { setThreads((current) => Object.fromEntries(Object.entries(current).map(([id, item]) => [id, { ...item, messages: item.messages.map((message) => ({ ...message, streaming: false })) }]))); setSelectedTicket(null); };
  const refreshWorkspace = useCallback(async (fatal = false) => {
    try {
      const response = await fetch("/api/workspace");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const next = await response.json() as Workspace;
      setWorkspace(next);
      setSelectedTicket((current) => current ? next.tickets.find((ticket) => ticket.id === current.id) ?? current : null);
      setError(null);
    } catch (reason) {
      if (fatal) setError(String(reason));
    }
  }, []);
  useEffect(() => {
    void refreshWorkspace(true);
    const timer = window.setInterval(() => void refreshWorkspace(false), 1_500);
    return () => window.clearInterval(timer);
  }, [refreshWorkspace]);
  useEffect(() => { fetch("/api/agents").then((response) => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))).then(setAgents).catch(() => setAgents({ codex: false, claude: false })); }, []);
  const promoteToReady = async (ticket: Ticket) => {
    if (ticket.status !== "backlog") return;
    setTransitionError(null);
    setTransitioningTicketId(ticket.id);
    try {
      const response = await fetch("/api/ticket/ready", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ticketId: ticket.id }) });
      const result = await response.json() as { ok?: boolean; errors?: Array<{ code?: string; message?: string }> };
      if (!response.ok || result.ok === false) {
        const issues = result.errors?.map((issue) => issue.message || issue.code || "Ready validation failed.") ?? ["Ready validation failed."];
        setTransitionError({ ticketId: ticket.id, title: ticket.title, issues });
      }
    } catch (reason) {
      setTransitionError({ ticketId: ticket.id, title: ticket.title, issues: [reason instanceof Error ? reason.message : String(reason)] });
    } finally {
      await refreshWorkspace(false);
      setTransitioningTicketId(null);
    }
  };
  const lanes = useMemo(() => [...new Set((workspace?.tickets ?? []).map((ticket) => ticket.migration?.lane).filter(Boolean) as string[])].sort(), [workspace]);
  const packageMap = new Map((workspace?.packages ?? []).map((pkg) => [pkg.id, pkg]));
  const openEntity = useCallback((id: string) => {
    const ticket = workspace?.tickets.find((item) => item.id === id || item.migration?.legacy_id === id);
    if (ticket) { setSourceReference(null); setSelectedTicket(ticket); return; }
    const pkg = workspace?.packages.find((item) => item.id === id);
    if (pkg) { setSourceReference(null); setPackageEditor(pkg.id); return; }
    const finding = workspace?.findings.find((item) => item.id === id);
    if (finding) {
      setSourceReference(null);
      window.setTimeout(() => document.getElementById(`entity-${finding.id}`)?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" }), 30);
      return;
    }
    setSourceReference({ id });
  }, [workspace]);
  const filtered = useMemo(() => {
    const packageTickets = selectedPackage ? new Set(packageMap.get(selectedPackage)?.tickets ?? []) : null;
    return (workspace?.tickets ?? []).filter((ticket) => {
      const needle = query.toLowerCase().trim();
      const searchable = `${ticket.id} ${ticket.title} ${ticket.migration?.legacy_id} ${ticket.sections.outcome}`.toLowerCase();
      const focusMatch = focus === "all"
        || (focus === "active" && ["active", "review"].includes(ticket.status))
        || (focus === "blocked" && Boolean(ticket.blocked))
        || (focus === "unpackaged" && !ticket.package && ticket.status !== "done")
        || (focus === "ready-candidates" && ticket.status === "backlog" && Boolean(ticket.migration?.ready_candidate))
        || (focus === "needs-you" && (ticket.status === "review" || Boolean(ticket.blocked) || (ticket.status === "backlog" && Boolean(ticket.migration?.ready_candidate))));
      return (!needle || searchable.includes(needle)) && (lane === "all" || ticket.migration?.lane === lane) && (!packageTickets || packageTickets.has(ticket.id)) && focusMatch;
    });
  }, [workspace, query, lane, selectedPackage, focus]);
  if (error) return <main className="fatal"><b>UI LOAD FAILED</b><p>{error}</p></main>;
  if (!workspace) return <main className="loading"><span>A</span><p>Reading canonical files…</p></main>;
  const migration = workspace.migration; const isMigration = migration !== null;
  const done = workspace.tickets.filter((ticket) => ticket.status === "done").length;
  const backlog = workspace.tickets.filter((ticket) => ticket.status === "backlog").length;
  const inFlight = workspace.tickets.filter((ticket) => ticket.status === "active" || ticket.status === "review").length;
  return <div className="app-shell">
    <header className={`masthead ${isMigration ? "" : "masthead--native"}`}><div className="brand-mark"><span>A</span><small>TEAM</small></div><div className="masthead__title"><p>{isMigration ? "MIGRATION CONTROL ROOM" : "A-TEAM CONTROL ROOM"} · LOCAL FILESYSTEM</p><h1>{workspace.project}</h1></div>{migration && <button className="migration-button" onClick={() => setShowMigration(true)}><span>{migration.split_audit.length}</span> shape decisions ↗</button>}</header>
    <section className="ledger" aria-label={isMigration ? "Migration statistics" : "Workspace statistics"}><div className="ledger__intro">{isMigration ? <><span>IMPORT SNAPSHOT / 21 JUL 2026</span><p>Legacy Scrum translated into executable work contracts. Source workspace untouched.</p></> : <><span>CURRENT WORKSPACE</span><p>Repository-native work contracts read directly from the canonical A-Team directories.</p></>}</div>{migration ? <><Stat value={migration.legacy_ticket_count} label="legacy sources" /><Stat value={migration.migrated_ticket_count} label="atomic tickets" accent /><Stat value={migration.ready_candidate_count} label="ready candidates" /></> : <><Stat value={workspace.tickets.length} label="tickets" accent /><Stat value={backlog} label="backlog" /><Stat value={inFlight} label="in flight" /></>}<Stat value={done} label="resolved" /></section>
    <FindingsSection findings={workspace.findings} onRefresh={() => refreshWorkspace(false)} onEntity={openEntity} onSource={setSourceReference} />
    <section className="packages-section"><div className="section-label"><span>02</span><h2>{isMigration ? "Proposed packages" : "Packages"}</h2><p>Outcome containers, not extra lifecycle states.</p></div><div className="package-toolbar"><button onClick={() => setPackageEditor("new")}>+ New package</button></div><div className="package-strip">{workspace.packages.map((pkg) => { const completed = pkg.tickets.filter((id) => workspace.tickets.find((ticket) => ticket.id === id)?.status === "done").length; return <article key={pkg.id} className={`package-card status-${pkg.status} ${selectedPackage === pkg.id ? "is-selected" : ""}`}><button className="package-card__open" onClick={() => setSelectedPackage(selectedPackage === pkg.id ? null : pkg.id)}><div><span>{pkg.id}</span><span>{pkg.kind} · {pkg.status}</span></div><h3>{pkg.title}</h3><p>{snippet(pkg.sections.goal, 90)}</p><footer><b>{completed}/{pkg.tickets.length}</b><span><i style={{ width: `${pkg.tickets.length ? completed / pkg.tickets.length * 100 : 0}%` }} /></span></footer></button><button className="package-card__manage" onClick={() => setPackageEditor(pkg.id)}>Manage members →</button></article>; })}</div></section>
    <section className="board-section"><div className="board-heading"><div className="section-label"><span>03</span><h2>Execution board</h2><p>Directory = lifecycle state.</p></div><div className="filters"><label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search T-042, O-38, title…" /></label><label><span>LANE</span><select value={lane} onChange={(event) => setLane(event.target.value)}><option value="all">All lanes</option>{lanes.map((item) => <option key={item}>{item}</option>)}</select></label>{(query || lane !== "all" || selectedPackage || focus !== "all") && <button className="clear-filter" onClick={() => { setQuery(""); setLane("all"); setSelectedPackage(null); setFocus("all"); }}>clear ×</button>}</div></div>
      <nav className="focus-rail" aria-label="Quick workspace views">{([
        ["all", "All work", workspace.tickets.length],
        ["needs-you", "Needs you", workspace.findings.filter((finding) => finding.status === "new").length + workspace.tickets.filter((ticket) => ticket.status === "review" || ticket.blocked || (ticket.status === "backlog" && ticket.migration?.ready_candidate)).length],
        ["active", "Active", workspace.tickets.filter((ticket) => ["active", "review"].includes(ticket.status)).length],
        ["blocked", "Blocked", workspace.tickets.filter((ticket) => ticket.blocked).length],
        ["unpackaged", "Unpackaged", workspace.tickets.filter((ticket) => !ticket.package && ticket.status !== "done").length],
        ["ready-candidates", "Ready candidates", workspace.tickets.filter((ticket) => ticket.status === "backlog" && ticket.migration?.ready_candidate).length],
      ] as Array<[FocusView, string, number]>).map(([id, label, count]) => <button key={id} className={focus === id ? "is-active" : ""} onClick={() => setFocus(id)}><span>{label}</span><b>{count}</b></button>)}</nav>
      <div className="board-summary"><b>{filtered.length}</b> visible tickets {selectedPackage && <span>inside {selectedPackage} · {packageMap.get(selectedPackage)?.title}</span>}</div>
      <div className="board">{STATUSES.map((status) => { const tickets = filtered.filter((ticket) => ticket.status === status.id); return <section className={`board-column column-${status.id}`} key={status.id}><header><div><span>{status.label}</span><small>{status.short}</small></div><b>{tickets.length}</b></header><div className="ticket-stack">{tickets.length ? tickets.map((ticket, index) => <TicketCard key={ticket.id} ticket={ticket} index={index} onOpen={setSelectedTicket} onReady={(item) => void promoteToReady(item)} readyBusy={transitioningTicketId === ticket.id} />) : <EmptyColumn status={status.id} />}</div></section>; })}</div>
    </section>
    <footer className="page-footer"><span>FILESYSTEM IS CANONICAL</span><p>{isMigration ? "No database · no invented Ready approvals · source workspace unchanged" : "No database · lifecycle state follows canonical directories"}</p><code>{migration ? `${migration.legacy_ticket_count} legacy sources / ${workspace.tickets.length} resulting tickets` : `${workspace.tickets.length} tickets / ${workspace.packages.length} packages`}</code></footer>
    {transitionError && <aside className="transition-error" role="alert"><button onClick={() => setTransitionError(null)} aria-label="Dismiss validation error">×</button><span>STAYED IN BACKLOG · {transitionError.ticketId}</span><h3>{transitionError.title}</h3><p>Ready validation found unresolved work:</p><ul>{transitionError.issues.map((issue, index) => <li key={`${issue}-${index}`}>{issue}</li>)}</ul></aside>}
    {selectedTicket && <Drawer ticket={selectedTicket} onClose={closeTicket} packageTitle={selectedTicket.package ? packageMap.get(selectedTicket.package)?.title : undefined} thread={threads[selectedTicket.id] ?? { agent: "codex", draft: "", messages: [], threadId: null }} agents={agents} onThreadChange={(next) => { const ticketId = selectedTicket.id; setThreads((current) => ({ ...current, [ticketId]: next })); }} onWorkspaceRefresh={() => refreshWorkspace(false)} onEntity={openEntity} onSource={setSourceReference} />}{showMigration && migration && <MigrationPanel migration={migration} onClose={() => setShowMigration(false)} onEntity={openEntity} onSource={setSourceReference} />}{packageEditor && <PackageDrawer pkg={packageEditor === "new" ? null : packageMap.get(packageEditor) ?? null} tickets={workspace.tickets} onClose={() => setPackageEditor(null)} onRefresh={async (packageId) => { await refreshWorkspace(false); if (packageId) setPackageEditor(packageId); }} onEntity={openEntity} onSource={setSourceReference} />}{sourceReference && <SourceDrawer reference={sourceReference} onClose={() => setSourceReference(null)} onEntity={openEntity} onSource={setSourceReference} />}
  </div>;
}
