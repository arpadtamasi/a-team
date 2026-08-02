# Kotta UI — UX Redesign Spec

> **Superseded as the board's specification.** The board now implements the Kotta
> Console v2 design, vendored at `design/kotta/Kotta Console v2.dc.html` with its
> Modernist design system in `design/kotta/_ds/`. That file is the specification for
> layout, wording and behaviour; this document is kept for the reasoning that led to
> it and is stale wherever the two disagree. Captures of the shipped board are the
> `v2-*.png` files in `ui/spec-assets/`.

Audience: a design agent producing the next iteration of the local Kotta web UI.
This is a UX spec, not a visual style guide. Layout, hierarchy, and flows are binding;
colors, type, and ornamentation are the designer's to propose — subordinate to the UX.

---

## 1. What this product is

Kotta is a repository-native dispatch system for human–AI development teams. All
state lives as markdown/YAML files in the repo (`.kotta/`); the CLI is the only
mutator; the UI is a local, single-operator control surface served by `kotta ui`.

**The core value is NOT "a ticket board."** It is the pipeline:

```
finding  →  ticket  →  package  →  run
(cheap,     (validated,  (batch the   (hand the batch
agent-scale  executable   related      to the machine,
intake)      contract)    work)        watch it, review it)
```

- **Finding** — an observation (from an agent or a human). Explicitly *not* a task.
  Sits in an inbox until a human dispositions it (reject / turn into a ticket).
- **Ticket** — an executable contract: outcome, scope, acceptance, verification.
  Lifecycle `backlog → ready → active → review → done`, where directory = state.
- **Package** — the launch unit: a set of tickets with execution semantics
  (sequential / parallel / dependency-aware, parallelism N, stop_on_failure).
  This is what the operator "hands to the machine in one go."
- **Run** — active execution: claims, feature branches, isolated git worktrees,
  agents working, evidence coming back for review.

**Second core value: truthful, derived state.** The UI never stores or invents
state. Everything shown is derived from canonical files + git (claims, worktrees,
branches). If the UI ever disagrees with the repo, that is a product-breaking bug.
The design must make provenance visible, not hide it.

## 2. The user

One operator (developer/PM hybrid) working locally with 1–N coding agents
(Codex, Claude Code). Sessions are short and frequent: glance, decide, dispatch,
walk away, come back. Secondary "user": the agents themselves read the same files;
the UI must never show the operator something an agent can't also derive.

The operator's three standing questions, in priority order:

1. **What needs ME right now?** (findings to triage, reviews to accept, blocked work)
2. **What is the machine doing?** (active runs, per-ticket progress, failures)
3. **What can I launch next?** (ready tickets, packages worth composing/starting)

## 3. Problems with the current UI (v0)

The current implementation (`ui/src/App.tsx`) is a single scrolling page styled as
an editorial poster. Concrete UX failures to fix:

1. **Everything on one screen.** Findings, packages, and a 5-column kanban stack
   vertically; no stage has room, and the pipeline reads as three unrelated
   widgets rather than one flow.
2. **Design-first, UX-second.** Numbered section labels ("01 / 02 / 03"),
   decorative eyebrows ("CONTEXT SEAL", "MIGRATION CONTROL ROOM"), staggered
   card animations. Ornament outranks information.
3. **Chat is buried.** The agent chat only exists inside a ticket drawer, behind
   a click, in a cramped side panel — although talking to agents is a primary
   verb, arguably *the* primary verb.
4. **The package is not a launch unit in the UI.** Packages are cards with a
   progress bar and a member-editor. There is no "launch," no execution-mode
   display, no run monitor. The climax of the product is missing.
5. **No run/execution view at all.** Active worktrees, claims, branches, agent
   activity are invisible. (This session literally found drift the UI could not
   have shown: tickets sitting "ready" while worktrees held finished work.)
6. **Migration-mode remnants** (legacy lanes, split audit, migration stamps)
   leak into the default experience and confuse the mental model.
7. **The kanban treats all five states as equal columns**, though backlog/ready
   are shaping concerns, active/review are run concerns, and done is archive.

### 3.1 v0 screenshots (reference, not template)

Screenshots of the current UI live in `ui/spec-assets/`, captured 2026-07-26
against this repository's own live workspace:

- `01-full-page.png` — the entire single-page layout (Findings → Packages → board)
- `02-ticket-drawer-chat.png` — ticket drawer, chat view, empty-thread state
- `03-ticket-drawer-brief.png` — ticket drawer, Brief view (contract sections)
- `04-package-drawer.png` — package drawer for an active package (membership locked)

**They are evidence for §3 and a reference for real content density (ticket
title lengths, section sizes, entity counts). Do NOT inherit their visual
language, layout, or single-page structure — §4 replaces it.** One thing v0
does get right and must be preserved: ticket state is resolved from live
worktrees (in the shots, T-012 shows Active and T-013 Review because their
worktrees exist — even while a stale generated index still said "ready").
That truth-from-derivation behavior is the §7 foundation.

## 4. Information architecture (binding)

Replace the single page with **four stages + a persistent attention layer**.
Navigation mirrors the pipeline left-to-right. Suggested: slim left rail or top
tabs — designer's choice, but order and grouping are fixed:

```
┌──────────────────────────────────────────────────────────────┐
│  [workspace name]   Inbox · Shape · Packages · Run   (Done)  │  ← stages
├──────────────────────────────────────────────────────────────┤
│  Needs-you strip (global, always visible, count-badged)      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                     current stage view                       │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Chat dock (global, collapsible, context-aware)              │
└──────────────────────────────────────────────────────────────┘
```

### 4.1 Needs-you strip (the attention layer)

Always visible, one row, answers question #1 without navigation. Items, each a
count + one-click jump:

- Findings awaiting disposition → Inbox
- Tickets in review (evidence waiting for accept/reject) → Run
- Blocked tickets → Run
- Failed / stalled runs → Run
- State-drift warnings (see §7) → wherever the drift is

Empty state is a feature: "Nothing needs you — N tickets running, M ready."

### 4.2 Stage: Inbox (findings)

Purpose: disposition observations in seconds, keep the intake cheap.

- List of `new` findings, newest first: id, title, type, severity, confidence,
  `discovered_during` link, evidence preview (expandable, markdown).
- Per-item verbs: **Reject** · **Create ticket →** (existing API), and
  **Discuss** — opens the chat dock pre-loaded with the finding context.
- Capture form (title, type, evidence) — keep current fields, keep it light.
- Resolved findings collapse into a history section, not deleted from view.
- Metric worth showing: findings dispositioned vs. arriving (intake health).

### 4.3 Stage: Shape (backlog → ready)

Purpose: turn raw items into executable contracts.

- Two panes: **Backlog** (unshaped) and **Ready** (validated, waiting to be
  packaged/launched).
- Ticket rows, not cards: id, title, type/profile chips, priority/risk, package
  membership (or "unpackaged" chip), depends_on.
- Primary verb on a backlog ticket: **Validate → Ready** (existing API). On
  failure, show the validator's issues inline on the row — the current
  toast-in-the-corner pattern loses the context.
- Secondary verb: **Shape with agent** — chat dock with the ticket attached,
  seeded prompts ("tighten acceptance", "split this", "fill verification").
- Ready pane groups by package; unpackaged ready tickets are visually flagged
  (they are launchable-but-unbatched — a decision waiting to happen).

### 4.4 Stage: Packages (composition + launch)

Purpose: batch related work and hand it to the machine. This screen is the
product's climax — invest here.

- Package list: id, kind, status, member count, completion, execution mode
  summary (`dependency-aware · parallelism 2 · stop on failure`).
- Package detail (master–detail, not a modal drawer):
  - goal (markdown), member tickets with live status,
  - dependency graph of members (even a simple topological column layout is
    enough — the operator must see what runs in parallel vs. sequenced),
  - execution settings (mode, parallelism, stop_on_failure) — read from
    frontmatter; editable only while the package is in backlog,
  - membership editing (existing add/remove API) while in backlog, with the
    current "membership locked after backlog" rule made visible.
- **Launch.** A prominent, deliberate action on a ready package. v1 may not have
  a backend endpoint for this (execution is started via the `execute-package`
  skill in an agent session); design it anyway:
  - enabled state = all member tickets ready, no validation errors;
  - shows a pre-flight summary (what will run, in what order, how parallel);
  - if the backend can't start runs yet, the button produces the exact
    copy-paste command / agent instruction — the UX must still end in "go",
    not in a dead end. Mark this **[backend-gap]**.

### 4.5 Stage: Run (execution + review)

Purpose: watch the machine work; accept or reject what comes back.

- Organized **by package run**, not by kanban column. Each running package is a
  block; its member tickets are rows with: status (active/review/blocked/done),
  claim (agent name), branch, worktree path, last activity.
- Ticket row expands to: acceptance contract vs. evidence (for review state),
  PR link, and its chat thread.
- Review verbs: **Accept** / **Request changes** — if no API exists, same
  [backend-gap] pattern as Launch: surface the exact next command.
- Independent (non-package) active tickets appear in their own "loose work"
  block.
- Done packages/tickets roll into **Done** (an archive stage or filter —
  low-priority screen; a searchable list is enough).

### 4.6 Chat dock (the built-in chats)

Chat is a global surface, not a drawer feature. One dock, three context levels:

1. **Workspace thread** — PM-level: "what should I do next", "summarize state",
   "draft a finding". No entity attached.
2. **Ticket threads** — the current per-ticket chat (context: ticket contract +
   repo). Reached from any ticket row's "Discuss/Shape" verb, or from the dock's
   thread list.
3. **Package threads** — coordinator-level: composition ("what belongs
   together"), launch, and mid-run intervention.

Dock behavior:

- Collapsible bottom or side dock; expanded state coexists with the stage view
  (operator watches the board while talking). Full-screen takeover is wrong.
- Thread list with entity chips (T-012, P-003…) + agent identity per thread.
- Agent routing per thread (Codex / Claude), availability from `/api/agents`,
  streaming as today. Entity ids in messages stay clickable (existing
  `entity:` link behavior) and navigate to the right stage/detail.
- Seeded prompt starters per context (keep the current two for tickets; add
  package- and workspace-level starters).
- **[backend-gap]** Threads are currently in-memory client state, lost on
  reload. Spec requires persistent threads (per entity, on disk, since the
  filesystem is canonical) — flag it, design as if it exists.

## 5. What the design must express (principles)

1. **Pipeline before everything.** A newcomer should read the nav and understand
   the model: observations become contracts, contracts become batches, batches
   run. The IA is the onboarding.
2. **Truth and provenance.** Every entity shows where it lives: file path,
   directory-derived status, branch, worktree, claim. A subtle "derived from
   filesystem · refreshed Ns ago" indicator beats the current footer slogan.
3. **Density over poster.** This is an operator tool: rows, tables, monospace
   ids, tight vertical rhythm. No staggered entrance animations, no numbered
   editorial section labels, no decorative seals.
4. **Verbs on the object.** Every entity carries its 1–2 legal next actions
   inline (disposition, validate, launch, accept). Illegal actions are visible
   but disabled with the reason ("membership locked: package is active").
5. **The machine is a colleague.** Agent presence (who holds which claim, who
   is streaming in which thread) is first-class visual information.
6. **Keyboard-first is welcome** (j/k row nav, `/` search, `g i`/`g s`/`g p`/
   `g r` stage jumps) but progressive — nothing may be keyboard-only.

## 6. Data & API reality (what exists today)

- `GET /api/workspace` — full workspace JSON (tickets, packages, findings,
  optional migration block); UI polls every 1.5 s. Fields: see types in
  `ui/src/App.tsx` (Ticket, Package, Finding, Workspace).
- `GET /api/agents` — `{ codex: boolean, claude: boolean }`.
- `POST /api/chat` — `{ ticketId, agent, threadId, message }`, NDJSON stream of
  `{type: "thread"|"delta"|"error"}`. Ticket-scoped only today; workspace- and
  package-scoped chat is **[backend-gap]**.
- `POST /api/finding` (capture), `POST /api/finding/resolve`
  (`create-ticket` | `reject`).
- `POST /api/package` (create), `POST /api/package/tickets` (add/remove).
- `POST /api/ticket/ready` (validate → ready; returns validation issues).
- `GET /api/source?id|path` — read-only markdown of any canonical file.
- **[backend-gap]** No endpoints yet for: launch/run control, review
  accept/reject, claims/worktree/branch introspection, persistent chat threads,
  drift detection. Design the surfaces; mark them; the frontend contract they
  imply becomes the backend backlog.

Migration mode (`workspace.migration != null`) still exists: keep it as a
clearly-separated overlay/badge on affected tickets plus one entry point to the
split-audit log — it must not shape the default IA.

## 7. State-drift surfacing (small but existential)

When derived signals disagree — e.g. a ticket's directory says `ready` but a
worktree/claim exists for it — the UI must show a drift warning on the entity
and in the needs-you strip, never silently pick one story. **[backend-gap]** for
the detection API; the design must reserve the slot.

## 8. Non-goals

- No database, no remote hosting, no multi-user auth (local, single operator).
- No redesign of the CLI, skills, or file formats.
- No mobile layout (desktop-first; usable ≥ 1280 px is enough).
- Do not build a generic kanban clone — Linear exists; this is a dispatch
  console.

## 9. Acceptance for the design deliverable

1. IA matches §4: four stages + needs-you strip + chat dock.
2. Every current capability (finding capture/disposition, validate→ready,
   package CRUD + membership, ticket chat, source viewing, migration audit)
   has a home in the new IA — nothing silently dropped.
3. Every [backend-gap] surface is designed and visibly marked in the deliverable
   so the frontend can ship with graceful "here's the command" fallbacks.
4. The three operator questions in §2 are each answerable within one glance or
   one click from any screen.
5. Screens delivered: Inbox, Shape, Packages (list + detail with launch
   pre-flight), Run (with review flow), chat dock in collapsed/expanded/
   streaming states, needs-you strip populated + empty, drift-warning state.
