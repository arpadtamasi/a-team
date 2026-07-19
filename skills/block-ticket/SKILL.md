---
name: block-ticket
description: Record a concrete delivery blocker on one ready or active Scrum ticket, or unblock it only after resolution evidence exists, while preserving the prior actionable state and append-only lifecycle history. Use this skill whenever the user asks to mark work blocked, record an unavailable dependency or decision, clear a blocker, unblock, or resume after a resolved blocker. Do not use it to defer low-priority work, park or reject a ticket, refine ordinary uncertainty, start a ready ticket, or fix the blocker itself.
compatibility: Requires repository filesystem access and existing Scrum ticket and metrics artifacts defined by the live method.
---

# Block Ticket

Represent real interruption periods accurately. Blocking is a reversible state transition with evidence, not a label for uncertainty, inactivity, or priority.

## Operations and inputs

Support exactly one operation per invocation:

- `block`: require one unambiguous ticket and a concrete reason describing the unavailable dependency, external decision, broken environment, or unresolved prerequisite that prevents progress.
- `unblock`: require one unambiguous blocked ticket and repository or user-provided evidence that the recorded blocker is resolved.

Resolve the ticket by ID, exact path, filename, or uniquely matching title. Ask for selection when ambiguous. If the requested operation or reason/evidence is unclear, leave state unchanged.

## Resolve the live contract

Determine the package layout first. In the A-Team source repository, use root `METHOD.md`,
`schemas/...`, `skills/...`, `GSTACK.md`, `PROCESSES.md`, and `GLOSSARY.md` when relevant.
After installation, use their `.claude/skills/a-team/...` equivalents. Never prefer an
installed copy in the source repository.

1. Read `AGENTS.md` and the selected package's `METHOD.md`.
2. Read the selected package's `schemas/ticket.md`, `schemas/events.md`, and `schemas/tokens.md` for exact shared contracts.
3. The selected method is authoritative.

The target ticket, its compact backlog entry, and the event log required by the method must already exist. Do not create a ticket, backlog, sprint, metrics directory, or alternate event file as part of blocking.

## Inspect live state

Before either transition, inspect:

- the complete target ticket, its backlog entry, and its current status;
- `blocked_periods`, lifecycle timestamps, sprint, branch, and work sessions;
- active `sprint.md`, dependency tickets, relevant repository evidence, branches, and worktrees;
- all relevant `ticket_blocked`, `ticket_unblocked`, start, review, and done events;
- the alleged blocker or resolution source, when repository-visible.

Reconcile ticket and event history conceptually before writing. If sources materially disagree, stop and report the mismatch rather than fabricating a clean history.

## Decide whether this is a blocker

A blocker prevents otherwise actionable work because a required dependency, external decision, environment, access, or prerequisite is unavailable. It must be concrete enough that resolution can later be demonstrated.

Do not use `blocked` for:

- ordinary implementation uncertainty that the ticket is expected to resolve;
- work that is merely difficult, slow, or lower priority;
- an unrefined backlog item;
- deliberate deferral, which belongs to `parked` when the method permits;
- abandoned or invalid work, which belongs to `rejected`;
- missing readiness information that should return to refinement.

## Block

Allow blocking only from an actionable state supported by the live method: `ready`, `in_progress`, or `review`. Preserve which of those states must be restored later. Refuse `backlog`, `blocked`, `done`, `parked`, or `rejected`, except that an idempotent replay of an already recorded identical block makes no changes.

1. Require the concrete reason; distinguish verified repository facts from user-provided facts and assumptions.
2. Confirm there is no open blocked period. An open period has `started_at` and no `ended_at`.
3. Obtain the current local time at transition and format it as ISO 8601 with timezone.
4. Append one blocked-period record using the live schema. It must durably preserve `started_at`, the reason, and the prior actionable status needed for restoration; leave `ended_at` empty. Add no invented resolution or duration.
5. Set `status: blocked`. Preserve `started_at`, `ready_at`, `review_at`, `done_at`, sprint, branch, estimate, scope, and sessions.
6. Update only the target's compact backlog entry to `blocked`, preserving its order and every other field.
7. Append one `ticket_blocked` event conforming to `.claude/skills/a-team/schemas/events.md`.

Before appending, search the ticket and events for the same open block. If an identical block is already represented consistently, report it as already applied. If the ticket is blocked without exactly one matching open period/event, or another open period exists, stop for reconciliation. Never overlap blocked periods or duplicate lifecycle events.

## Unblock

Unblock only a ticket whose status is `blocked` and which has exactly one latest open blocked period with a matching block event.

1. Require concrete resolution evidence. Inspect it when repository-visible. User testimony may be recorded as user-provided evidence but must not be relabeled as independently verified.
2. Determine the prior actionable state from the open period or compatible event history. Restore only `ready`, `in_progress`, or `review`.
3. If prior state is missing or ambiguous, do not guess from elapsed time. Repository evidence such as a first-start event, active sprint, or review event may establish it only when unambiguous; otherwise stop for human reconciliation.
4. Recheck that the dependency, decision, environment, access, or prerequisite is actually available as claimed.
5. Obtain the current local time and format it as ISO 8601 with timezone.
6. Close only the latest open period by setting `ended_at` to that timestamp and recording the supplied resolution evidence in the established schema. Do not alter closed historical periods.
7. Restore the preserved prior actionable status. Keep original lifecycle timestamps, sprint, branch, estimate, scope, and sessions unchanged.
8. Update only the target's compact backlog entry to the restored status, preserving its order and every other field.
9. Append one `ticket_unblocked` event conforming to `.claude/skills/a-team/schemas/events.md`.

If the latest period is already closed and a matching unblock event exists, report an idempotent replay with no changes. If only one side exists or multiple periods are open, stop; do not create a compensating fiction. A correction to an old event must be a new correction event permitted by the live method, never an edit.

Unblocking an `in_progress` ticket resumes its existing cycle time and session history; it is not a new `ticket_started` transition. Unblocking a `review` ticket returns it to review without performing or accepting review. Unblocking `ready` does not start it.

## Token and event safety

Treat `events.jsonl` as append-only raw truth: validate every new object, preserve every existing byte, and add one lifecycle line only after the ticket mutation is ready to commit consistently.

Record token usage only when exposed by the tool or provider. Preserve provider token categories and identifiers, attribute the actual purpose, use `null` for unavailable supported fields, and never estimate. Blocking does not itself authorize a new work session.

## Safety rules

- Do not fix the blocker, make the missing decision, change dependencies, refine scope, start work, submit review, close work, park, or reject within this operation.
- Do not clear branch ownership or reset `started_at` during a blocked period.
- Do not fabricate reason, resolution, timestamps, duration, evidence, prior status, sessions, or tokens.
- Modify only the target ticket, its existing compact backlog entry, and the existing append-only event log.
- Preserve historical blocked periods and lifecycle events exactly.

## Validation

Review the resulting state and diff.

For `block`, confirm:

- the source was `ready`, `in_progress`, or `review` and its prior status is durably preserved;
- the reason is concrete and supported with its provenance clear;
- status is `blocked` and exactly one latest blocked period is open;
- the compact backlog entry reports `blocked` and otherwise remains unchanged;
- one matching `ticket_blocked` JSON line uses the same ISO timezone timestamp;
- lifecycle timestamps, sprint, branch, estimate, scope, and session history were preserved.

For `unblock`, confirm:

- resolution evidence exists and its provenance is accurate;
- exactly one latest open period was closed and no periods overlap;
- the restored status equals the supported prior actionable state;
- the compact backlog entry reports the restored state and otherwise remains unchanged;
- one matching `ticket_unblocked` JSON line uses the same ISO timezone timestamp;
- original cycle time, review time, ownership, scope, and history were not reset.

For both, confirm no duplicate event, invented data, unrelated edit, or non-append event-log change. If verification fails, repair only an unambiguous partial write from this invocation. Otherwise stop and report the inconsistency without rewriting history.

## Output

Report the operation, ticket, prior and resulting status, concrete blocker reason or resolution evidence with provenance, blocked-period timestamp, restored state when applicable, lifecycle event result, token-recording result, and validation status. On refusal or replay, explain why state remained unchanged.
