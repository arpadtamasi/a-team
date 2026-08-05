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

**The core value is NOT "a contract board."** It is the pipeline:

```
observation  →  contract  →  batch  →  run
(cheap,     (validated,  (batch the   (hand the batch
agent-scale  executable   related      to the machine,
intake)      contract)    work)        watch it, review it)
```

- **Observation** — an observation (from an agent or a human). Explicitly *not* a task.
  Sits in an inbox until a human dispositions it (reject / turn into a contract).
- **Contract** — an executable contract: outcome, scope, acceptance, verification.
  Lifecycle `backlog → defined → active → review → done`, where directory = state.
- **Batch** — the launch unit: a set of contracts with execution semantics
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

1. **What needs ME right now?** (observations to triage, reviews to accept, blocked work)
2. **What is the machine doing?** (active runs, per-contract progress, failures)
3. **What can I launch next?** (defined contracts, batches worth composing/starting)

## 3. Problems with the current UI (v0)

The current implementation (`ui/src/App.tsx`) is a single scrolling page styled as
an editorial poster. Concrete UX failures to fix:

1. **Everything on one screen.** Observations, batches, and a 5-column kanban stack
   vertically; no stage has room, and the pipeline reads as three unrelated
   widgets rather than one flow.
2. **Design-first, UX-second.** Numbered section labels ("01 / 02 / 03"),
   decorative eyebrows ("CONTEXT SEAL", "MIGRATION CONTROL ROOM"), staggered
   card animations. Ornament outranks information.
3. **Chat is buried.** The agent chat only exists inside a contract drawer, behind
   a click, in a cramped side panel — although talking to agents is a primary
   verb, arguably *the* primary verb.
4. **The batch is not a launch unit in the UI.** Batches are cards with a
   progress bar and a member-editor. There is no "launch," no execution-mode
   display, no run monitor. The climax of the product is missing.
5. **No run/execution view at all.** Active worktrees, claims, branches, agent
   activity are invisible. (This session literally found drift the UI could not
   have shown: contracts sitting "defined" while worktrees held finished work.)
6. **Migration-mode remnants** (legacy lanes, split audit, migration stamps)
   leak into the default experience and confuse the mental model.
7. **The kanban treats all five states as equal columns**, though backlog/defined
   are shaping concerns, active/review are run concerns, and done is archive.

### 3.1 v0 screenshots (reference, not template)

Screenshots of the current UI live in `ui/spec-assets/`, captured 2026-07-26
against this repository's own live workspace:

- `01-full-page.png` — the entire single-page layout (Observations → Batches → board)
- `02-contract-drawer-chat.png` — contract drawer, chat view, empty-thread state
- `03-contract-drawer-brief.png` — contract drawer, Brief view (contract sections)
- `04-batch-drawer.png` — batch drawer for an active batch (membership locked)

**They are evidence for §3 and a reference for real content density (contract
title lengths, section sizes, entity counts). Do NOT inherit their visual
language, layout, or single-page structure — §4 replaces it.** One thing v0
does get right and must be preserved: contract state is resolved from live
worktrees (in the shots, T-012 shows Active and T-013 Review because their
worktrees exist — even while a stale generated index still said "defined").
That truth-from-derivation behavior is the §7 foundation.

## 4. Information architecture (binding)

Replace the single page with **four stages + a persistent attention layer**.
Navigation mirrors the pipeline left-to-right. Suggested: slim left rail or top
tabs — designer's choice, but order and grouping are fixed:

```
┌──────────────────────────────────────────────────────────────┐
│  [workspace name]   Inbox · Shape · Batches · Run   (Done)  │  ← stages
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

- Observations awaiting disposition → Inbox
- Contracts in review (evidence waiting for accept/reject) → Run
- Blocked contracts → Run
- Failed / stalled runs → Run
- State-drift warnings (see §7) → wherever the drift is

Empty state is a feature: "Nothing needs you — N contracts running, M defined."

### 4.2 Stage: Inbox (observations)

Purpose: disposition observations in seconds, keep the intake cheap.

- List of `new` observations, newest first: id, title, type, severity, confidence,
  `discovered_during` link, evidence preview (expandable, markdown).
- Per-item verbs: **Reject** · **Create contract →** (existing API), and
  **Discuss** — opens the chat dock pre-loaded with the observation context.
- Capture form (title, type, evidence) — keep current fields, keep it light.
- Resolved observations collapse into a history section, not deleted from view.
- Metric worth showing: observations dispositioned vs. arriving (intake health).

### 4.3 Stage: Shape (backlog → defined)

Purpose: turn raw items into executable contracts.

- Two panes: **Backlog** (unshaped) and **Ready** (validated, waiting to be
  batchd/launched).
- Contract rows, not cards: id, title, type/profile chips, priority/risk, batch
  membership (or "unbatchd" chip), depends_on.
- Primary verb on a backlog contract: **Validate → Ready** (existing API). On
  failure, show the validator's issues inline on the row — the current
  toast-in-the-corner pattern loses the context.
- Secondary verb: **Shape with agent** — chat dock with the contract attached,
  seeded prompts ("tighten acceptance", "split this", "fill verification").
- Ready pane groups by batch; unbatchd defined contracts are visually flagged
  (they are launchable-but-unbatched — a decision waiting to happen).

### 4.4 Stage: Batches (composition + launch)

Purpose: batch related work and hand it to the machine. This screen is the
product's climax — invest here.

- Batch list: id, kind, status, member count, completion, execution mode
  summary (`dependency-aware · parallelism 2 · stop on failure`).
- Batch detail (master–detail, not a modal drawer):
  - goal (markdown), member contracts with live status,
  - dependency graph of members (even a simple topological column layout is
    enough — the operator must see what runs in parallel vs. sequenced),
  - execution settings (mode, parallelism, stop_on_failure) — read from
    frontmatter; editable only while the batch is in backlog,
  - membership editing (existing add/remove API) while in backlog, with the
    current "membership locked after backlog" rule made visible.
- **Launch.** A prominent, deliberate action on a defined batch. v1 may not have
  a backend endpoint for this (execution is started via the `execute-batch`
  skill in an agent session); design it anyway:
  - enabled state = all member contracts defined, no validation errors;
  - shows a pre-flight summary (what will run, in what order, how parallel);
  - if the backend can't start runs yet, the button produces the exact
    copy-paste command / agent instruction — the UX must still end in "go",
    not in a dead end. Mark this **[backend-gap]**.

### 4.5 Stage: Run (execution + review)

Purpose: watch the machine work; accept or reject what comes back.

- Organized **by batch run**, not by kanban column. Each running batch is a
  block; its member contracts are rows with: status (active/review/blocked/done),
  claim (agent name), branch, worktree path, last activity.
- Contract row expands to: acceptance contract vs. evidence (for review state),
  PR link, and its chat thread.
- Review verbs: **Accept** / **Request changes** — if no API exists, same
  [backend-gap] pattern as Launch: surface the exact next command.
- Independent (non-batch) active contracts appear in their own "loose work"
  block.
- Done batches/contracts roll into **Done** (an archive stage or filter —
  low-priority screen; a searchable list is enough).

### 4.6 Read-only activity timeline

The board is not a second chat surface. Entity drawers reconstruct visible messages, lifecycle
events and approval outcomes from the canonical control branch, with no composer, retry, prepare,
approve or reject controls. Pending approvals say that they are waiting in the calling host chat.
The caller-chat MCP tools own structured actions and human elicitation; the board only refreshes the
result.

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
4. **State, not verbs.** Every entity shows its legal next state and why it may be blocked, but
   mutation controls stay in the calling chat rather than on the board.
5. **The machine is a colleague.** Agent presence (who holds which claim, who
   is streaming in which thread) is first-class visual information.
6. **Keyboard-first is welcome** (j/k row nav, `/` search, `g i`/`g s`/`g p`/
   `g r` stage jumps) but progressive — nothing may be keyboard-only.

## 6. Data & API reality

- `GET /api/workspace` — full workspace JSON (contracts, batches, observations,
  optional migration block); UI polls every 1.5 s. Fields: see types in
  `ui/src/App.tsx` (Contract, Batch, Observation, Workspace).
- `GET /api/agents` — `{ codex: boolean, claude: boolean }`.
- Every non-GET/HEAD request returns `405`; historical chat, approval, observation and batch write
  routes are intentionally unavailable from the board.
- `kotta mcp` owns structured caller-chat tools and delegates lifecycle mutations to the same
  validated domain services as the CLI.
- `GET /api/source?id|path` — read-only markdown of any canonical file.
- Launch/run control remains a CLI/orchestrator action. Claims, worktrees, lifecycle state,
  persistent chat and drift diagnostics are included in the workspace response.

Migration mode (`workspace.migration != null`) still exists: keep it as a
clearly-separated overlay/badge on affected contracts plus one entry point to the
split-audit log — it must not shape the default IA.

## 7. State-drift surfacing (small but existential)

When derived signals disagree — e.g. a contract's directory says `defined` but a
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
2. Every canonical state and history capability has a board view; write capabilities live in the
   calling-chat MCP tools and never appear as board controls.
3. Every [backend-gap] surface is designed and visibly marked in the deliverable
   so the frontend can ship with graceful "here's the command" fallbacks.
4. The three operator questions in §2 are each answerable within one glance or
   one click from any screen.
5. Screens delivered: Inbox, Shape, Batches (list + detail), Run, read-only entity activity,
   needs-you strip populated + empty, and drift-warning state.
