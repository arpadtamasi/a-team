---
name: disposition-ticket
description: Park or reject one existing Scrum ticket through an explicit non-delivery disposition, preserving its history and recording the decision in the backlog and event log. Use this skill whenever the user asks to park, shelve, abandon, decline, invalidate, reject, or close a ticket without delivering it—even if they do not use the words parked or rejected. Do not use it for temporary blockers, backlog reprioritization, successful completion, sprint cancellation, or reopening terminal work.
compatibility: Requires existing canonical Scrum ticket, backlog, event, method, and schema artifacts.
---

# Disposition Ticket

Park or reject a work contract without pretending it was delivered. A disposition preserves the history needed to understand what was attempted and why work stopped.

## Transition ownership

This skill alone owns normal transitions to `parked` and `rejected`, the matching compact backlog state, `Result` disposition record, and `ticket_parked` or `ticket_rejected` event.

Do not:

- mark the ticket `done`, set `done_at`, or award completed velocity;
- use `parked` as a substitute for a temporary blocker or ordinary backlog priority;
- use `rejected` merely because implementation or review is difficult;
- reopen `done`, `parked`, or `rejected` work;
- erase estimates, timestamps, blocked periods, sessions, sprint membership, branch history, evidence, or prior events;
- delete branches, implementation, research output, or ticket files.

## Inputs and authority

Require one unambiguous ticket, one explicit disposition, and a concrete reason with decision provenance.

- Choose `parked` when the outcome may remain valid but work is intentionally removed from active consideration without a resumption commitment.
- Choose `rejected` when an authorized decision declines or invalidates the work contract, for example because the outcome is unwanted, superseded, duplicate, or based on a disproven premise.

If the request says only “stop,” “cancel,” or “defer,” determine whether it refers to a ticket and whether `parked` or `rejected` is intended. Do not infer a terminal disposition from low priority, a blocker, or sprint cancellation.

## Resolve the repository contract

1. Read `AGENTS.md` and prefer `.claude/skills/a-team/METHOD.md`.
2. Read `.claude/skills/a-team/schemas/ticket.md`, `.claude/skills/a-team/schemas/events.md`, and `.claude/skills/a-team/schemas/tokens.md` for exact shared contracts.
3. If definitions or paths materially conflict, stop before mutation and report the conflict.
4. Follow the live method and schemas over this skill.

Require the existing target ticket, its compact backlog entry, and the canonical event log when lifecycle logging is required. Do not create missing project-management infrastructure.

## Inspect live state

Read:

- the entire ticket, including current state, outcome, dependencies, timestamps, blocked periods, sprint, branch, sessions, evidence, and Result;
- the matching compact backlog entry;
- `a-team/sprint.md` and relevant sprint history;
- lifecycle and token events for the ticket;
- live branch/worktree evidence when a branch claim exists.

Use repository facts over chat history. Reconcile ticket, backlog, sprint, and event state before writing. A partial or contradictory lifecycle representation is a blocker, not permission to fabricate a clean disposition.

## Check transition eligibility

Allow `backlog`, `ready`, `in_progress`, `blocked`, or `review` to transition to either disposition when the explicit decision supports it.

Refuse:

- `done`, because accepted completion cannot be rewritten as non-delivery;
- `parked` or `rejected`, except an identical event-backed replay, which is an idempotent success;
- a disposition without a concrete reason and identifiable decision provenance;
- a request that is actually temporary blocking, priority movement, review rework, ticket completion, or sprint cancellation;
- a transition that would hide a blocker-level security, privacy, authorization, data-loss, or operational-safety exposure without recording the finding and its required follow-up ticket.

Terminal tickets are not reopened. If work later becomes valuable, capture a new ticket linked to the terminal contract.

## Apply the disposition atomically

Use one current local ISO 8601 timestamp with timezone for the real transition.

1. Re-read the ticket, backlog entry, sprint, and matching lifecycle events immediately before mutation.
2. Preserve the source state as `prior_status`.
3. If the source is `blocked`, require exactly one matching open blocked period. Close it at the disposition timestamp and record the disposition decision as closure evidence without claiming that the blocker itself was resolved.
4. Set `status` to exactly `parked` or `rejected`.
5. Keep `done_at` empty and preserve every earlier lifecycle timestamp, story points, sprint, branch, scope, dependencies, evidence, and work session.
6. Record under `## Result` the disposition, reason, decision provenance, timestamp, demonstrated partial or negative result, remaining limitations, and links to any required follow-up tickets. Do not describe the outcome as delivered.
7. Update only the target's compact backlog state, preserving its order, estimate, link, title, dependencies, and outcome summary.
8. Append exactly one `ticket_parked` or `ticket_rejected` event conforming to `.claude/skills/a-team/schemas/events.md`.

Do not edit or reorder old events. Detect duplicates by ticket and terminal transition, not timestamp alone. If ticket, backlog, and event already agree with the same disposition and decision, report an idempotent replay. If only part of the transition exists, stop for reconciliation; correction requires a method-defined correction event.

Record `token_usage` only when directly exposed by the tool or provider, following `.claude/skills/a-team/schemas/tokens.md` with purpose `planning`. Never infer token counts.

## Validate

Confirm:

- the pre-transition state was eligible and the disposition was explicitly authorized;
- ticket and compact backlog agree on the terminal state;
- `done_at`, estimate, earlier timestamps, sprint, branch, scope, dependencies, evidence, and sessions were preserved;
- an open blocked period, if any, ended at the disposition time with honest decision evidence;
- Result clearly distinguishes disposition from successful delivery;
- exactly one matching event exists and the appended line is valid JSON;
- no velocity, sprint result, implementation, branch, unrelated ticket, or old event changed;
- every concrete finding discovered by this operation is linked to an existing or newly captured ticket under `AGENTS.md`.

If validation fails, repair only disposition-owned artifacts when safe. Otherwise leave or restore a coherent non-terminal state and report the blocker; never claim partial disposition.

## Report

Report the ticket ID and path, prior and resulting state, reason and decision provenance, blocked-period handling, preserved sprint and branch relation, event and token-recording result, follow-up ticket links, files changed, and validation status. On refusal or replay, explain why state remained unchanged.
