---
name: close-sprint
description: Close and archive the active Scrum sprint after its goal and committed work have been demonstrated, then calculate its delivery and token metrics. Use this skill whenever the user asks to end the sprint, run the sprint demo, archive the sprint commitment, declare the sprint result, or carry unfinished sprint work forward. Do not use it to close individual tickets, plan the next sprint, run a retrospective, or merely report current status.
compatibility: Requires repository filesystem access and the Scrum artifacts defined by the live project-management method.
---

# Close Sprint

Close one active sprint from evidence. Completion activity is not a demonstration, and an unfinished ticket contributes no partial points.

## Inputs

Resolve from the request and live repository:

- the active sprint in `a-team/sprint.md`;
- any demonstration evidence supplied by the user;
- current committed and stretch ticket state;
- lifecycle and token events exposed by the repository.

Ask only for material evidence or a sprint-result decision that cannot be discovered. Never infer a successful demo from implementation summaries.

gstack review, QA, investigation, or ship artifacts may support the demonstration when repository-visible, but no gstack workflow can close the sprint or determine its canonical result. Apply [`.claude/skills/a-team/GSTACK.md`](../../GSTACK.md).

## Resolve the repository contract

1. Read `AGENTS.md` and prefer `.claude/skills/a-team/METHOD.md`.
2. Read `.claude/skills/a-team/schemas/sprint.md`, `.claude/skills/a-team/schemas/metrics.md`, `.claude/skills/a-team/schemas/events.md`, and `.claude/skills/a-team/schemas/tokens.md` for exact shared contracts.
3. Follow the live method over this skill if their operational rules conflict.

Do not invent missing infrastructure. `a-team/tickets/` and `a-team/metrics/events.jsonl` must already exist. An active closure requires `a-team/sprint.md`; when it is absent, only the idempotent closed-state checks below apply. This operation may create the canonical `a-team/sprints/` directory for the first archive because the live schema defines its exact contents; never create an alternate history location.

## Inspect live state

Before writing, inspect:

- the complete active sprint, its date, one goal, commitment, stretch list, risks, and prior result fields;
- every referenced ticket, including points, timestamps, status, sprint, branch, blockers, result, and verification evidence;
- backlog links and compact states;
- relevant diffs, checks, stored measurements, screenshots, outputs, research or decision logs;
- all valid lifecycle and token events for the sprint and its tickets;
- existing sprint archives and the canonical `sprint.md` active/absent convention.

Refuse if there is more than one active sprint, ambiguous commitment, unresolved path authority, invalid effective event history, or an archive already exists with conflicting content. If `sprint.md` is absent and an identical archive plus matching `sprint_closed` event exist, report the prior closure without duplicating it. If `sprint.md` is absent and neither exists, report that no sprint is active. If only one closure artifact exists, stop for `reconcile-history`.

## Determine the result

Classify the sprint goal as `done`, `partial`, `failed`, or `cancelled` according to `.claude/skills/a-team/METHOD.md` and `.claude/skills/a-team/schemas/sprint.md`. Record the demonstration, evidence, ticket accounting, result, metrics, and data-quality limits using the exact archive schema.

Name observable outcomes and concrete evidence. List every unfinished committed ticket with its current state and next prerequisite. Preserve continuing tickets, their story points, `started_at`, branch ownership, blocked periods, and cycle time. Closure does not start, close, re-estimate, or rewrite a ticket.

## Calculate sprint metrics

Calculate the sprint metrics exactly as defined in `.claude/skills/a-team/schemas/metrics.md` and token coverage according to `.claude/skills/a-team/schemas/tokens.md`. Use the sprint-start commitment as the fixed baseline, keep committed and stretch results separate, give no partial point credit, and state exclusions or inconsistencies instead of repairing history.

## Commit the closure

Use one current ISO 8601 timestamp with timezone for the real closure.

1. Create `a-team/sprints/` when this is the first closure, then create `a-team/sprints/<sprint-id>.md` using the exact schema. Preserve commitment facts, set archive status to `closed`, and rewrite ticket links from `tickets/...` to `../tickets/...`.
2. Append exactly one `sprint_closed` event conforming to `.claude/skills/a-team/schemas/events.md`.
3. Validate the complete archive, every rewritten link, the matching event, ticket accounting, and calculated metrics.
4. Delete `a-team/sprint.md`. Its absence now canonically means no active sprint when no unmatched start event exists.
5. Do not alter the backlog or ticket files merely to make closure metrics agree. Report their inconsistent state for the owning skill.

Events are append-only. Detect an existing event by sprint and event type before appending. Never edit old lines; append a correction only when the method defines one and the user authorizes it.

## Validate

Before reporting, confirm:

- the archive date and active sprint match;
- result and demo evidence support one another;
- every committed and stretch ticket is accounted for exactly once;
- archive status is `closed`, commitment facts are preserved, and every `../tickets/...` link resolves;
- metric membership and formulas are reproducible from source records;
- point totals use only fixed estimates and no partial credit;
- continuing work retained its original lifecycle timestamps;
- the appended event is valid single-line JSON and unique;
- `sprint.md` is absent after the archive and event validate;
- no ticket state, estimate, scope, or branch was changed;
- no gstack workflow-local result was treated as sprint or ticket closure;
- only the archive, existing event log, and `sprint.md` changed.

If an identical archive and event exist while `sprint.md` still contains the exact closed sprint, revalidate them and finish the pending deletion without duplicating closure artifacts. For any conflicting partial closure, use `reconcile-history`. Otherwise repair only artifacts owned by this invocation or leave state unchanged and report the blocker.

## Output

Report the sprint date, result, demonstrated outcome and evidence, unfinished committed work, metric summary, token-data gaps, archive path, event status, and `sprint.md` disposition. Clearly distinguish repository facts, calculations, and explicit human decisions.
