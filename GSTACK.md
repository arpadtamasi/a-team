# Scrum and gstack integration

This repository uses two cooperating layers:

- the Scrum system (method under `.claude/skills/a-team/`, data under `a-team/`) is the canonical control plane for backlog priority, ticket contracts, sprint commitment, lifecycle state, readiness, acceptance, closure, delivery metrics, and token accounting.
- installed gstack workflows are optional experts for discovery, product and technical planning, investigation, review, QA, and technical shipping.

gstack output is evidence for Scrum. It is never Scrum state.

Some installed workflows are mutating: `/qa` may fix and commit defects, `/ship` may merge the base branch, edit release artifacts, commit, push, and create a PR/MR, and planning/review workflows may propose writing `TODOS.md` or building a surfaced item immediately. Invoke those paths only inside an authorized ticket and explicit action scope. In this repository, skip legacy-TODO writes and “build now” handling for surfaced candidates; route them through `capture-work`. If a workflow cannot preserve that restriction, do not run its conflicting mutation path.

## Ownership boundary

Only [`backlog.md`](../../../a-team/backlog.md), [`sprint.md`](../../../a-team/sprint.md), ticket files, sprint archives, and Scrum events determine priority, commitment, status, story points, cycle time, velocity, Definition of Ready, Definition of Done, closure, and carry-over. State changes use the owner named in [`METHOD.md`](METHOD.md#lifecycle-ownership).

The installed gstack completion protocol currently reports `DONE`, `DONE_WITH_CONCERNS`, `BLOCKED`, or `NEEDS_CONTEXT`. Other workflow-specific reports also use local values such as review findings or plan-item `DONE`/`NOT DONE`. All are local results:

| gstack result | Scrum interpretation |
| --- | --- |
| `DONE` | The workflow completed; its evidence may support the next Scrum operation. |
| `DONE_WITH_CONCERNS` | The workflow completed, but Scrum review must classify and resolve the concerns before closure. |
| `BLOCKED` | The workflow could not proceed. Use [`block-ticket`](skills/block-ticket/SKILL.md) only when the cause is a real ticket-level impediment. |
| `NEEDS_CONTEXT` | Input or a decision is missing. Refinement may be needed; no state changes automatically. |

## Three kinds of planning

| Question | Owner | Result |
| --- | --- | --- |
| What outcome do we commit to in this sprint? | [`plan-sprint`](skills/plan-sprint/SKILL.md) | Approved sprint commitment |
| Is this ticket clear, bounded, estimable, and verifiable? | [`refine-ticket`](skills/refine-ticket/SKILL.md) | A ready contract or explicit readiness gaps |
| What should be built, why, and how? | optional gstack `/office-hours`, `/autoplan`, `/plan-ceo-review`, `/plan-eng-review` | Product or technical planning input |

Product planning is useful before or during refinement. Technical planning may continue after the observable outcome is stable, provided it does not change that outcome. Neither kind schedules a ticket.

## Scope changes

Discovery may freely challenge work during capture and backlog refinement. It may not silently rewrite a `ready`, `in_progress`, or `review` contract.

For a material proposal after readiness:

1. preserve the current contract and report the proposed delta;
2. obtain explicit human approval;
3. let `refine-ticket` reassess a not-yet-started `ready` ticket only under its explicit-intent rule;
4. if the revised contract still passes the Definition of Ready, update it atomically and preserve lifecycle history;
5. if it no longer passes, or work has started, capture a linked replacement or follow-up through [`capture-work`](skills/capture-work/SKILL.md); when the old contract is no longer wanted, use [`disposition-ticket`](skills/disposition-ticket/SKILL.md);
6. preserve historical story points and events, and never rewrite completed work.

The live lifecycle has no generic `ready → backlog` reopening transition. Do not invent one. A future reopening operation would be a method change requiring explicit approval.

## Review and QA

gstack `/review`, `/qa`, security reviews, and other specialists may provide evidence to [`review-ticket`](skills/review-ticket/SKILL.md). The Scrum review still evaluates acceptance criteria and Definition of Done, classifies unresolved findings as `blocker`, `important`, or `minor`, records first-pass acceptance, and decides whether rework is required. It should reference specialist evidence, not duplicate specialist logic.

A gstack concern does not automatically start rework. A clean gstack report does not automatically make a ticket eligible for closure.

## Investigation

gstack `/investigate` may reproduce a defect, identify root cause, test a hypothesis, or implement an authorized fix. Its `DONE`, `DONE_WITH_CONCERNS`, or `BLOCKED` result remains execution evidence. Starting, blocking, submitting, reviewing, and closing the ticket still use their Scrum owners.

## Shipping

gstack `/ship` may run checks, prepare commits, merge the base branch, push, and create a pull or merge request when those actions are supported and authorized. It does not own product acceptance, ticket closure, sprint closure, Definition of Done, or velocity.

The normal delivery order is:

```text
candidate → submit-review → review-ticket (+ optional gstack review/QA)
→ optional gstack ship → close-ticket
```

`/ship` is optional when the ticket does not require a PR, merge, or deployment. A successful ship is only shipping evidence; [`close-ticket`](skills/close-ticket/SKILL.md) must still verify the full Definition of Done. [`close-sprint`](skills/close-sprint/SKILL.md) remains separate.

## Retrospectives

[`retro`](skills/retro/SKILL.md) is the official process retrospective because it combines sprint commitment, cycle and blocked time, review/rework, carry-over, estimation, environment, and token evidence. gstack `/retro` provides deeper Git, engineering, session, and tool-usage analysis as optional input.

A gstack retro cannot directly alter `METHOD.md`, Scrum skills, historical estimates, or process rules. The Scrum retro records an explicitly accepted change; edits to method or skills require a separately approved scoped change.

## Metrics, telemetry, and tokens

Canonical project metrics come from `a-team/metrics/events.jsonl`, tickets, and closed sprint archives. [`report-metrics`](skills/report-metrics/SKILL.md) owns their deterministic interpretation. gstack telemetry describes skill runs, duration, workflow outcomes, branches, browser use, and other gstack-local facts; it never replaces a Scrum event.

Installed gstack commonly keeps local project artifacts under `~/.gstack/projects/<project-slug>/`, including timeline, learning, decision, plan, task, review, and ship JSONL or Markdown files. Local analytics may also live under `~/.gstack/analytics/`; gstack retro history may use `.context/retros/`. Exact files vary by workflow and installed version. These stores are supporting evidence, not canonical Scrum metrics or backlog state.

Record gstack token usage in Scrum only when a reliable machine-readable provider total is exposed and can be attributed to ticket, sprint, session, purpose, provider, and model under [`schemas/tokens.md`](schemas/tokens.md). Use `null` for unavailable fields. Never infer tokens from logs, elapsed time, output length, model identity, or gstack telemetry.

## Durable artifacts

A gstack plan or report may begin in a private local directory. If it is required to execute a ticket, preserve an approved product decision, reproduce verification, review a candidate, close a ticket, or support a research claim, make the load-bearing content repository-visible by:

1. copying the approved artifact to an appropriate repository location;
2. recording the required decisions and evidence concisely in a canonical repository artifact; or
3. using a stable link accessible to every required agent.

Do not copy irrelevant transcripts. A private home-directory path cannot be the sole source for a ready or active ticket.

## Surfaced work and the one backlog

[`backlog.md`](../../../a-team/backlog.md) is the only canonical work backlog. gstack TODOs, plan tasks, review findings, QA defects, ship follow-ups, and retro suggestions are candidates until captured:

```text
gstack finding → surfaced work candidate → explicit capture decision
→ capture-work → Scrum backlog ticket → refine-ticket when prioritized
```

Before capture, a candidate has no Scrum status, priority, points, sprint eligibility, lifecycle event, or authorization to begin. Repository-visible copied reports should label such sections:

> Surfaced work candidates — not scheduled. Capture through the `capture-work` skill before execution.

The Boy Scout rule in [`AGENTS.md`](../../../AGENTS.md) still requires capture when a workflow demonstrates a concrete repository-grounded actionable problem; the gstack label alone is not evidence. Search for and link an outcome-equivalent ticket before creating another.

Audit your repository for any pre-existing backlog-like surfaces before adopting this method: legacy `TODOS.md`-style Now/Next/Later boards, spec documents with open "next step" notes, or planning and go-to-market docs. Migrate their open items into Scrum tickets through `capture-work`, then treat those surfaces as read-only context. Do not maintain a second writable backlog alongside `a-team/backlog.md`.

## Human approval gates

Human approval remains required for the exact sprint commitment, material product-scope changes, acceptance of unresolved important findings where permitted, product decisions gstack cannot infer, method or skill changes, and every action already gated by a Scrum skill.

If gstack cannot reliably request input in the active environment, it must stop or return the missing decision. The main agent or Scrum owner must ask; silence, fallback behavior, or a workflow-local auto-decision cannot satisfy a Scrum approval gate.
