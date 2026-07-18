# Scrum-like project-management method

This repository uses a lightweight, one-day-sprint workflow. The method exists to make work explicit, small, reviewable, measurable, and recoverable without turning project management into a second product.

## Responsibility split

Project-management rules have three layers:

1. `METHOD.md` defines shared concepts, meanings, invariants, and lifecycle ownership.
2. `schemas/` defines exact reusable data shapes and calculations.
3. `skills/` defines how to perform an operation.

`PROCESSES.md` connects the operations for human readers. `GSTACK.md` defines the boundary with optional installed gstack workflows. Neither file overrides this method, the schemas, or an owning skill.

An operational skill may add safeguards and procedural detail, but it must not redefine a shared concept or schema. If artifacts materially disagree, stop and report the conflict instead of silently choosing a convenient interpretation.

## Sources of truth

The method (this package: `METHOD.md`, `schemas/`, `skills/`, `PROCESSES.md`, `GSTACK.md`)
lives under `.claude/skills/a-team/`; the project data it operates on lives under `scrum/`
at the repository root.

| Artifact | Responsibility |
| --- | --- |
| `scrum/backlog.md` | Ordered current work inventory and priority |
| `scrum/sprint.md` | Active sprint commitment and live sprint state |
| `scrum/tickets/*.md` | Durable work contracts and ticket lifecycle state |
| `scrum/metrics/events.jsonl` | Append-only lifecycle and token event history |
| `scrum/metrics/summary.json` | Replaceable metric report derived from canonical records |
| `scrum/sprints/*.md` | Closed sprint archives |
| `scrum/retros/*.md` | Retrospective observations and experiments |
| `schemas/*.md` | Exact shared shapes, enums, and formulas |
| `skills/*/SKILL.md` | Operational procedures |
| `PROCESSES.md` | Human-readable workflow map |
| `GSTACK.md` | External gstack integration boundary |

Repository artifacts, not chat history, are authoritative. Derived reports never override their source records.

External workflows may provide discovery, plans, implementation, findings, verification, or shipping evidence. They cannot set Scrum priority, commitment, lifecycle state, readiness, acceptance, closure, or metrics; only the owning Scrum operation may do that.

## Sprint

A sprint is one goal-scoped commitment with one explicit sprint goal. Its length is set by the goal, not the calendar: a sprint stays active until `close-sprint` closes it. Keep sprints short — the goal should be the smallest coherent demonstrable outcome.

- **Committed work** is the smallest coherent set the team expects to finish while preserving the Definition of Done.
- **Stretch work** is optional capacity. It must never be used to make the committed scope appear smaller after the fact.
- A ticket belongs to at most one active sprint.
- Starting work does not silently add it to a sprint; sprint commitment is a separate operation.
- Scope changes remain visible in the sprint record and event history.
- `sprint.md` exists only for an active sprint; successful closure archives the full snapshot under `sprints/` and removes `sprint.md`.

Closed sprint results use the canonical values in `schemas/sprint.md`:

- `done`: the sprint goal was achieved and demonstrated;
- `partial`: useful work was completed, but the sprint goal was not fully achieved;
- `failed`: the sprint produced no acceptable goal-level result;
- `cancelled`: the sprint was deliberately stopped because the goal became invalid or lower priority.

Stretch completion is reported separately from committed velocity.

## Work hierarchy

- **Initiative or epic**: a multi-sprint outcome too broad or uncertain for direct execution. It is not committed to a sprint and receives no completed velocity directly.
- **Ticket**: one independently verifiable outcome small enough for a sprint. Each ticket has one durable identifier.
- **Execution step**: a temporary implementation or investigation step inside a ticket. It receives no story points and is not a backlog item unless it becomes independently valuable work.

## Ticket states

The canonical states are:

| State | Meaning |
| --- | --- |
| `backlog` | Captured but not yet ready to start |
| `ready` | Refined and satisfies the Definition of Ready |
| `in_progress` | Actively owned and being implemented |
| `blocked` | Cannot make meaningful progress because of a recorded impediment |
| `review` | Implementation is submitted with verification evidence and awaits acceptance |
| `done` | Accepted and satisfies the Definition of Done |
| `parked` | Intentionally paused without claiming completion |
| `rejected` | Explicitly declined or invalidated work |

`done`, `parked`, and `rejected` are terminal for the current work contract. New work discovered after terminal closure should normally receive a new ticket unless a correction is required to repair project-management history.

State changes must be made through the owning operation, update the durable ticket record, and append the matching event. A state value alone is not evidence that its transition requirements were satisfied.

### Lifecycle ownership

| Transition or operation | Owning skill |
| --- | --- |
| idea or finding → captured backlog ticket | `capture-work` |
| `backlog` → `ready` | `refine-ticket` |
| commit ready tickets to the sprint | `plan-sprint` |
| `ready` → `in_progress` | `start-ticket` |
| `ready`, `in_progress`, or `review` ↔ `blocked` | `block-ticket` |
| `in_progress` → `review` | `submit-review` |
| assess `review`; `review` → `in_progress` for rework | `review-ticket` |
| `review` → `done` | `close-ticket` |
| `backlog`, `ready`, `in_progress`, `blocked`, or `review` → `parked` or `rejected` | `disposition-ticket` |
| append-only historical correction and approved materialized-state reconciliation | `reconcile-history` |
| close and archive the active sprint | `close-sprint` |
| produce a retrospective | `retro` |
| read-only process guidance and routing | `howto` |
| read-only status reporting | `report-status` |
| lifecycle-read-only metric reporting and derived-summary refresh | `report-metrics` |

`parked` and `rejected` are explicit non-delivery dispositions. They preserve ticket history, contribute no completed velocity, and may not rewrite accepted `done` work. Later continuation uses a new linked ticket rather than reopening the terminal contract.

Historical corrections are append-only and use `event_corrected` through `reconcile-history`. They require inspectable evidence and explicit approval, preserve the original raw line, and may never invent missing history or optimize metrics. Derived reports apply the deterministic effective-event rules in `schemas/events.md`.

## Definition of Ready

A ticket may enter `ready` only when all of the following are true:

- exactly one intended outcome is explicit;
- scope and exclusions are clear enough to prevent material reinterpretation during implementation;
- acceptance criteria are observable and testable;
- dependencies and known blockers are recorded;
- verification steps are defined;
- the ticket is small enough for one sprint, or has been split;
- the scope is not an unbounded collection of unrelated work;
- story points have been assigned using the shared scale;
- the ticket document satisfies `schemas/ticket.md`.

If meaningful product, architecture, research, or measurement decisions remain unresolved, the ticket is not ready.

## Story points

Use the Fibonacci scale `1, 2, 3, 5, 8, 13` for relative effort, uncertainty, and integration risk. Story points are not hours and must not be converted into time promises.

Repository anchors:

- `1`: a local, well-understood change with an obvious verification path;
- `2`: a small, self-contained change following an existing pattern;
- `3`: a controlled multi-step change crossing a few components, with clear expected behavior and verification;
- `5`: a substantial but independently closable ticket involving meaningful uncertainty, analysis, regression risk, or measurement work;
- `8`: not ready for a sprint; decompose it or run a smaller spike;
- `13`: epic-level or insufficiently understood work.

Re-estimation is allowed before work starts when refinement reveals new information. After work starts, preserve the committed estimate so velocity is not rewritten retrospectively; capture the learning in the retrospective instead.

## Definition of Done

A ticket may enter `done` only when:

- every acceptance criterion is satisfied or explicitly resolved;
- the requested implementation or artifact exists;
- required verification has actually run and its evidence is recorded;
- review has accepted the work and no blocking finding remains;
- no known regression is hidden and scope creep was not silently included;
- relevant documentation and durable decisions are current;
- the result and remaining limitations are recorded;
- the change is ready to merge or already merged, according to the ticket;
- lifecycle, session, event, and token records are complete as far as the tools expose them;
- discovered out-of-scope work has been handled according to the repository-wide found-work rule in `AGENTS.md`;
- the ticket record satisfies `schemas/ticket.md`.

Passing a command, generating code, or writing a self-assessment is not by itself proof of completion.

Review findings use three shared severities:

- **blocker**: acceptance, correctness, safety, data integrity, or required evidence fails; closure is forbidden;
- **important**: material maintainability, usability, or non-critical correctness issue that needs an explicit disposition;
- **minor**: non-blocking improvement or polish.

## Research and measurement invariants

Keep these distinct:

1. hypothesis;
2. implementation;
3. measurement;
4. interpretation;
5. product decision.

A measurement-backed claim is complete only after the defined harness has run and its output is recorded in the required research artifact. Negative results are valid and must not be rewritten as support for the hypothesis.

Before comparing results, verify comparability of the cases or dataset, judge, rubric, schema, repetition protocol, build conditions, and known variance. A sentinel or guard set supports claims only within its demonstrated coverage. “No regression” means that no regression was detected in the covered cases.

Where the consuming repository defines project-specific research-logging requirements (for example in its `AGENTS.md`), they remain part of the Definition of Done.

## Events and token accounting

Lifecycle history is append-only. Operations must append events conforming to `schemas/events.md`; edits to current-state files do not replace the event history. Every consumer preserves the raw audit view and interprets lifecycle or token facts through the deterministic effective view. Re-running an operation must be semantically idempotent and must not create duplicate lifecycle events.

Token usage is append-only and follows `schemas/tokens.md`. Record observed provider totals, preserve provider-reported categories separately, and do not invent or prorate unavailable counts. Token-derived ratios may combine records only within one declared scope and only when their provider totals are compatible.

## Metrics

Metrics describe the demonstrated workflow; they are not targets to game. Exact formulas, boundary rules, aggregation rules, and coverage calculations live only in `schemas/metrics.md`.

### Flow metrics

- **Lead time**: elapsed time from capture to accepted completion.
- **Cycle time**: elapsed time from first start to accepted completion, including recorded blocked intervals.
- **Refinement time**: elapsed time from capture until the ticket becomes ready.
- **Queue time**: elapsed time from readiness until first start.
- **Review time**: elapsed time from first review entry until accepted completion.
- **Blocked time**: elapsed time inside closed blocked intervals.

### Delivery metrics

- **Throughput**: count of tickets accepted as `done` in the reporting period.
- **Committed velocity**: story points of committed tickets accepted as `done` in the sprint.
- **Stretch velocity**: story points of stretch tickets accepted as `done` in the sprint.
- **Commitment reliability**: completed committed points relative to sprint-start committed points.
- **Carry-over rate**: unfinished sprint-start committed tickets relative to all sprint-start committed tickets.
- **First-pass acceptance rate**: tickets accepted in their first review round relative to all reviewed tickets.
- **Rolling velocity**: median committed velocity over the latest 10 closed sprints, or all available closed sprints when fewer exist.

Incomplete tickets contribute zero completed points. Story points are never split by percentage complete. Carryover preserves the original ticket and estimate and is recommitted explicitly in a later sprint.

### Token-derived metrics

- **Total reported tokens**: compatible provider-reported total tokens in scope.
- **Tokens per completed ticket**: compatible reported tokens relative to completed tickets in the same scope.
- **Tokens per completed point**: total tokens relative to completed points in the same scope.
- **Environment token ratio**: environment-purpose tokens relative to all compatible tokens in scope.
- **Review token ratio**: review-purpose tokens relative to all compatible tokens in scope.
- **Rework token ratio**: rework-purpose tokens relative to all compatible tokens in scope.

Every report states its period, included records, unavailable values, exclusions, and coverage. Missing timestamps, story points, token counts, open blocked intervals, or incompatible provider totals must remain visible; they must not silently become zero.

## Method governance

A method change is a behavior change, even when it edits only Markdown. It must:

- identify the source-of-truth layer being changed;
- update every affected skill or schema reference;
- preserve or deliberately migrate existing records;
- validate lifecycle ownership, state names, event names, token categories, formulas, and links;
- avoid changing live ticket, backlog, sprint, or runtime state unless that state change is the explicit task;
- record material durable decisions in the repository decision log when the consuming repository requires it.

Keep concepts here, reusable exact contracts in `schemas/`, and execution procedures in their owning skills.
