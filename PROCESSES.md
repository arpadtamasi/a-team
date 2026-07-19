# Scrum process guide

## Overview

Scrum is this repository's control plane; gstack is an optional expert workflow layer. A sprint is one goal-scoped commitment, and a ticket is one independently verifiable outcome. Repository artifacts, not chat or private local files, are authoritative.

Shared definitions and ownership are in [`METHOD.md`](METHOD.md), exact shapes in [`schemas/`](schemas/), operational procedures in [`skills/`](skills/), and the external-workflow boundary in [`GSTACK.md`](GSTACK.md). Repository-wide working rules remain in [`AGENTS.md`](../../../AGENTS.md).

When the next operation is unclear, [`howto`](skills/howto/SKILL.md) explains the shortest legal route without changing state.

## Core lifecycle

```text
uninitialized repository
→ init-workspace
→ idea, request, defect, or finding
→ capture-work
→ optional product discovery (office-hours / CEO review)
→ refine-ticket
→ optional technical planning (autoplan / engineering review)
→ ready
→ plan-sprint
→ start-ticket
→ implementation or investigation
→ submit-review
→ review-ticket + optional specialist review / QA / security
→ optional rework loop
→ optional gstack ship
→ close-ticket
→ close-sprint
→ retro
```

Product discovery can occur before or during refinement. Technical planning can occur once the product outcome is stable. QA can also run during implementation when it is ticket-required verification. gstack never performs the Scrum transitions shown above.

## Process catalogue

| Process | Trigger and purpose | Owner / allowed input | Result | Human gate, optional support, common refusal |
| --- | --- | --- | --- | --- |
| Initialize workspace | Create the minimum canonical Scrum control plane before the first ticket | [`init-workspace`](skills/init-workspace/SKILL.md); repository with no Scrum artifacts | Empty `backlog.md`, tracked ticket directory, empty event log | Creates no work or sprint. Refuses partial infrastructure, legacy-backlog migration, or reinitialization over data. |
| Capture work | A new request or concrete finding needs durable identity | [`capture-work`](skills/capture-work/SKILL.md); no ticket yet | New unestimated `backlog` ticket and event | Capture must be intended or required by the Boy Scout rule; gstack findings are candidates until grounded and captured. Refuses duplicates or missing canonical infrastructure. |
| Refine ticket | Make one outcome clear, bounded, estimable, and verifiable | [`refine-ticket`](skills/refine-ticket/SKILL.md); normally `backlog`, explicit reassessment of not-yet-started `ready` | `ready` plus estimate/event, or documented readiness gaps | Product decisions and material ready-scope changes require approval. May consume office hours, CEO, autoplan, or engineering input. Refuses unresolved decisions or work sized `8`/`13`. |
| Decompose epic | A captured outcome is too broad or contains independent value | `refine-ticket`, then `capture-work` for explicitly authorized children; parent `backlog` | Vertical child candidates; only qualifying children become `ready` | Child creation is explicit. Refuses technical-layer splits with no independent outcome. |
| Plan sprint | Decide the sprint goal and commitment | [`plan-sprint`](skills/plan-sprint/SKILL.md); `ready` tickets only; clean committed Git baseline | Approved active `sprint.md` and `sprint_started`, both naming the baseline SHA | Exact proposal needs human approval. Refuses a dirty tree, second active sprint, or incoherent goal. Commit the PM-only sprint diff before work starts. |
| Start ticket | Claim committed work and start cycle time | [`start-ticket`](skills/start-ticket/SKILL.md); committed `ready`; clean Git tree with committed sprint state | `in_progress`, session, branch claim when real, `ticket_started` | Refuses when the baseline is not an ancestor of `HEAD` or the exact sprint file/event is not committed. Branch creation needs separate authority. |
| Implement ticket | Produce the contracted candidate | Coding agent or human; `in_progress` | Code, research, decision, or other ticket artifact plus verification | Scope is the approved ticket. `/investigate` may support root-cause work. Discovered unrelated work is captured, not silently implemented. |
| Submit review | Hand off a real candidate with implementation evidence | [`submit-review`](skills/submit-review/SKILL.md); `in_progress` | `review`, first `review_at`, handoff event | Requires candidate and ticket-required checks. Refuses missing evidence or unresolved blocker. |
| Review ticket | Judge the candidate against contract and DoD | [`review-ticket`](skills/review-ticket/SKILL.md); `review` | Findings and closure eligibility, or authorized rework | gstack `/review`, `/qa`, and security evidence may support it. Rework needs explicit direction or actual repair. Refuses invented or stale evidence. |
| Rework | Resolve blocking/important review findings | `review-ticket` owns `review → in_progress`; then implementation and `submit-review` | New candidate and review round; first timestamps preserved | Must not rewrite first-pass history. Refuses rework event without substantive rework. |
| Block / unblock | Record or resolve a real impediment | [`block-ticket`](skills/block-ticket/SKILL.md); `ready`, `in_progress`, or `review` ↔ `blocked` | Open or closed blocked period and event | Ordinary uncertainty is refinement, not blocking. Refuses vague blockers or unsupported resolution. |
| Disposition | Stop work without claiming delivery | [`disposition-ticket`](skills/disposition-ticket/SKILL.md); `backlog`, `ready`, `in_progress`, `blocked`, or `review` | terminal `parked` or `rejected` | Explicit decision, reason, and provenance required. Later continuation is a new linked ticket. |
| Investigate | Reproduce and explain a defect before fixing it | Optional gstack `/investigate`; usually within an authorized `in_progress` ticket | Root-cause evidence, hypothesis tests, possibly an authorized fix | Does not change Scrum state. A workflow `BLOCKED` maps to Scrum blocking only for a real ticket impediment. |
| QA | Exercise behavior and collect functional evidence | Optional gstack `/qa`; implementation or review phase | QA report, screenshots, defects, verification, and authorized fixes when using its mutating mode | Does not accept or close. Mutating fixes stay inside ticket scope; findings need Scrum classification/capture. |
| Ship | Perform required technical delivery actions | Optional gstack `/ship`; normally after accepted review evidence | Checks, commits, push, PR/MR, or supported delivery evidence | External/destructive gates still apply. Does not close tickets or sprints. Refuses unresolved ship gates. |
| Close ticket | Record accepted delivery | [`close-ticket`](skills/close-ticket/SKILL.md); `review` | `done`, result, metrics, and `ticket_done` | Requires closure authority and complete DoD evidence; `/ship` success alone is insufficient. |
| Close sprint | Demonstrate and archive the sprint goal | [`close-sprint`](skills/close-sprint/SKILL.md); one active sprint | closed archive, result, metrics, event; `sprint.md` removed | Needs evidence or a result decision that cannot be inferred. No partial points. gstack cannot close it. |
| Sprint retro | Improve the next sprint cycle | [`retro`](skills/retro/SKILL.md); closed sprint evidence | one proposed or approved operating change and retro record | Exact change needs human approval; gstack retro is optional input. |
| Periodic retro | Find repeated cross-sprint patterns | `retro`; several closed sprints | trend analysis and prioritized proposals; at most the accepted change is official | Small samples and correlations stay qualified. No independent method edits. |
| Process how-to | Explain which operation applies and how to request it | [`howto`](skills/howto/SKILL.md); any state, read-only | one recommended owner, prerequisites, approval gate, and next request | Does not perform transitions or duplicate status reporting. Refuses to guess through artifact conflicts. |
| Status report | Show current sprint, work, blockers, ownership, and next ready | [`report-status`](skills/report-status/SKILL.md); any state, read-only | snapshot only | May reference relevant gstack artifacts/workflow results but never mutates them. Refuses to fill gaps from memory. |
| Metrics report | Recalculate delivery and token measures | [`report-metrics`](skills/report-metrics/SKILL.md); valid events/tickets/archives | deterministic `summary.json` and report | gstack telemetry is not input unless represented by valid Scrum events. Refuses ambiguous source data rather than guessing. |
| Reconcile history | Correct proven event-history errors append-only | [`reconcile-history`](skills/reconcile-history/SKILL.md); erroneous historical record | `event_corrected` and approved materialized repairs | Explicit approval and inspectable evidence required. Never invents history or optimizes metrics. |
| Report A-Team issue | Send package feedback to the public upstream repository without duplication | [`report-issue`](skills/report-issue/SKILL.md); a concrete A-Team problem or request | Existing matching issue link, or one new issue in `arpadtamasi/a-team` | Searches open and closed issues first. Does not create Scrum state, modify existing issues, or report to another repository. |

## Workflow variants

### Small, clear bug

`capture → refine → plan → start → reproduce with a test → implement → submit → review → close`.

Use `/investigate` only when root cause is unclear and `/qa` when behavior needs additional functional evidence.

### Ambiguous product feature

`capture → optional /office-hours or /plan-ceo-review → refine → optional /plan-eng-review or /autoplan → plan sprint → execute → review → optional ship → close`.

Discovery output informs the contract; it does not schedule or silently expand it.

### Research or measurement ticket

`capture hypothesis → refine cases, harness, judge, protocol, repetitions, and expected artifact → plan → execute measurement → interpret positive or negative evidence → review protocol and evidence → close`.

Keep hypothesis, implementation, measurement, interpretation, and decision separate.

### Production defect requiring investigation

`capture or approved urgent handling → refine the incident outcome → optional /investigate → implement the smallest safe fix → review and QA → ship → close`.

Urgency does not waive ticket evidence, review, or shipping approvals.

### Large epic

`capture epic → discovery → propose vertical decomposition → explicitly capture children → refine children independently → commit only ready children`.

The epic receives no completed velocity directly.

### Carried-over ticket

Close the sprint with the ticket's current state and next prerequisite. Cycle time and `started_at` do not reset; unfinished points count as zero; points are never split. If selected the next day, the continuing ticket is explicitly recommitted while preserving its original lifecycle history.

### Scope change after `ready`

Preserve the current contract, record the proposed delta, and obtain explicit approval. A not-yet-started ticket may be reassessed by `refine-ticket`; update it only if the complete revised contract still passes DoR. Otherwise capture a linked replacement/follow-up, and disposition the old ticket if it should stop. For `in_progress` or `review`, keep the active contract and create follow-up work unless the human explicitly stops it. Never rewrite completed work or historical events. See [`GSTACK.md`](GSTACK.md#scope-changes).

## State transitions

| From | To | Owner | Condition |
| --- | --- | --- | --- |
| none | `backlog` | `capture-work` | Work is faithfully captured and not duplicated |
| `backlog` | `ready` | `refine-ticket` | Full Definition of Ready and `1`/`2`/`3`/`5` estimate |
| `ready` | `in_progress` | `start-ticket` | Ticket is committed, dependency-safe, and unclaimed |
| `ready`, `in_progress`, or `review` | `blocked` | `block-ticket` | A concrete impediment prevents meaningful progress |
| `blocked` | prior `ready`, `in_progress`, or `review` | `block-ticket` | Resolution evidence exists |
| `in_progress` | `review` | `submit-review` | Candidate and required implementation evidence exist |
| `review` | `in_progress` | `review-ticket` | Rework is explicitly authorized or actually begins |
| `review` | `done` | `close-ticket` | Review accepted and Definition of Done passes |
| `backlog`, `ready`, `in_progress`, `blocked`, or `review` | `parked` or `rejected` | `disposition-ticket` | Explicit non-delivery decision and provenance |

Workspace initialization, sprint commitment, sprint closure, retrospectives, reports,
historical reconciliation, and public package issue intake are operations rather than
ticket-state transitions. A GitHub issue is external intake, not a Scrum ticket. `done`,
`parked`, and `rejected` are terminal for the current contract.

## gstack integration

| Installed workflow | Scrum phase | Typical output | May change Scrum state? |
| --- | --- | --- | --- |
| `/office-hours` | discovery/refinement | problem framing, alternatives, design document | No |
| `/plan-ceo-review` | discovery/refinement | scope recommendation, risks, decisions | No |
| `/autoplan` | planning review | multi-perspective reviewed plan and tasks | No |
| `/plan-eng-review` | refinement/execution preparation | technical plan, architecture, test plan | No |
| `/investigate` | implementation/debugging | root cause, hypothesis evidence, fix evidence | No |
| `/review` | Scrum review support | diff findings and plan-completion evidence | No |
| `/qa` | implementation/review support | functional QA evidence and defects | No |
| `/ship` | technical delivery | checks, commits, push, PR/MR, ship metrics | No |
| `/retro` | retrospective input | Git, engineering, session, and tool-usage analysis | No |

Installed names may be displayed with a `gstack-` prefix depending on local configuration; the ownership boundary is unchanged.

The live `/qa` and `/ship` workflows can modify code or Git state, and several gstack workflows contain `TODOS.md` or “build now” paths. Repository rules override those backlog paths: skip them, capture candidates through Scrum, and run mutating workflow steps only with ticket and action authority.

## Approval gates

Human approval is required for:

- the exact sprint proposal;
- material product-scope changes after readiness;
- unresolved important findings when acceptance is permitted;
- product or architecture decisions that evidence cannot settle;
- disposition of work and append-only history correction;
- process/method/skill changes and the exact retro experiment;
- branch, push, PR, deployment, destructive, or external actions already gated by their workflow.

An unavailable gstack question mechanism never becomes permission to auto-decide a Scrum gate.

## Git baseline gate

Before sprint commitment, `git status --porcelain=v1 --untracked-files=all` must be empty and
`HEAD^{commit}` must resolve to the repository's full commit object ID. `plan-sprint` records that ID in both the
active sprint and `sprint_started` event. Existing uncommitted implementation is classified
and resolved before planning; it is never hidden in the baseline and later counted as sprint
delivery.

After planning, commit the PM-only sprint file and appended event before starting a ticket.
`start-ticket` verifies a clean tree, verifies that the baseline is an ancestor of current
`HEAD`, and reads the exact sprint state from committed `HEAD`. Neither operation silently
stashes, discards, stages, or commits unrelated work.

## Evidence and artifacts

| Evidence | Durable location |
| --- | --- |
| ticket contract and result | `a-team/tickets/` |
| current priority | `a-team/backlog.md` only |
| active / closed sprint | `a-team/sprint.md` / `a-team/sprints/` |
| lifecycle and token events | `a-team/metrics/events.jsonl` |
| official retro | `a-team/retros/` |
| durable product decision | the owning spec under `docs/` (spec-first) or ticket-linked repository record |
| gstack plan/review/QA/ship evidence | repository artifact or concise ticket/review/result record; never only a private `~/.gstack/projects/` path when load-bearing |

Copied gstack reports should mark unresolved items: “Surfaced work candidates — not scheduled. Capture through the `capture-work` skill before execution.”

## Metrics through the lifecycle

- Story points are assigned when a ticket first becomes `ready`; pre-start reassessment follows the method and never rewrites historical events.
- Cycle time begins at the first `start-ticket` transition and continues across carry-over.
- Review time begins at first review entry; rework does not reset it.
- `block-ticket` opens and closes blocked periods.
- Ticket closure contributes throughput; sprint closure calculates committed and stretch velocity with no partial credit.
- Provider-exposed token usage is appended by attributable ticket/sprint/session/purpose; unavailable values remain `null`.

Exact formulas and aggregation rules remain in [`schemas/metrics.md`](schemas/metrics.md) and [`schemas/tokens.md`](schemas/tokens.md).

## What not to do

- Do not use gstack `DONE` or `DONE_WITH_CONCERNS` as ticket closure.
- Do not let `/ship` close a ticket or sprint.
- Do not change a ready or active scope silently.
- Do not use sprint planning as product discovery or commit `backlog` tickets.
- Do not award partial points or reset cycle time on carry-over.
- Do not keep load-bearing plans only in a private home directory.
- Do not let Scrum and gstack retros independently change the process.
- Do not treat a gstack task list, report, or legacy `TODOS.md` as a second backlog.
- Do not implement surfaced follow-ups before `capture-work` gives them Scrum identity.
- Do not estimate unavailable tokens or merge incompatible telemetry definitions.
