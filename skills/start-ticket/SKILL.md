---
name: start-ticket
description: Start exactly one ready ticket that is already committed to the active sprint, claim its real branch when applicable, create its first work session, and log ticket_started. Use this skill whenever the user asks to begin, pick up, claim, resume-as-start, or start work on a committed ticket. Do not use it to plan a sprint, refine scope, implement the ticket, submit review, block work, or restart an already active ticket.
compatibility: Requires repository filesystem and Git inspection plus an approved active sprint and ticket artifacts defined by the live method.
---

# Start Ticket

Make the transition from approved commitment to active work exactly once. Starting establishes ownership and timing; it does not perform implementation.

## Inputs

Require one unambiguous ticket ID, exact ticket link, filename, or uniquely matching title. Use the active sprint and repository state to discover commitment, dependencies, and ownership. If multiple tickets match, ask the user to identify one before changing state.

## Resolve the live contract

1. Read `AGENTS.md` and prefer `.claude/skills/a-team/METHOD.md`.
2. Read `.claude/skills/a-team/schemas/ticket.md`, `.claude/skills/a-team/schemas/sprint.md`, `.claude/skills/a-team/schemas/events.md`, and `.claude/skills/a-team/schemas/tokens.md` for exact shared contracts.
3. Follow the selected method when it conflicts with this skill.

The active-sprint file, backlog, ticket directory, and target ticket must exist. The event log must exist when the method requires start logging. Do not create missing project-management infrastructure or write into an undeclared tree.

## Inspect live state

Before changing anything, inspect:

- the complete target ticket and its compact backlog entry;
- the complete active `sprint.md` and the target's committed/stretch classification;
- sprint history and lifecycle events needed to prove the sprint is active;
- dependency tickets and evidence that each gating prerequisite is satisfied;
- all ticket branch fields and active work-session ownership;
- Git's current branch, local branches, worktrees, default branch, and ahead/behind or merge-base evidence relevant to staleness;
- the event log for prior `ticket_started`, rework, blocked, and token events for this ticket.

Resolve inconsistencies before mutation. Chat history does not override repository state.

Require the index and worktree, including untracked files, to be clean before starting.
Resolve the active sprint's full commit-object `baseline_commit` and refuse if it is missing, malformed,
or not an ancestor of current `HEAD`. Verify from committed Git content—not merely the
worktree—that `HEAD` contains the exact active `a-team/sprint.md` and its matching
`sprint_started` event. This proves the PM commitment was durably committed after its
baseline and before feature work began.

Do not stash, discard, absorb, stage, or commit pending changes to satisfy this gate. Report
the exact dirty paths or missing committed PM artifact and leave the ticket unchanged.

## Preconditions

Start only when all of these are true:

- the ticket status is exactly `ready`;
- the ticket appears in the committed section of the one active sprint, not merely stretch work;
- its estimate and contract remain intact;
- every gating dependency is satisfied by repository evidence;
- it has no open blocked period;
- no other ticket, branch, worktree, or open session claims the same work incompatibly;
- the ticket is not already claimed, active, blocked, under review, done, parked, or rejected.

Do not treat low priority, ordinary uncertainty, or a missing optional follow-up as a blocker. If the ticket's readiness contract has become invalid, leave it unchanged and direct it to refinement or blocking as appropriate.

## Resolve branch ownership

A populated branch field means claimed work. Never overwrite it casually.

- Record a branch only when Git proves it exists, or when the user explicitly authorizes its creation and the available tool actually creates it.
- Starting does not require creating a branch when repository convention permits work without one.
- If the requested or recorded branch already exists, inspect its ownership, worktree, divergence, and relation to the current default branch.
- Never reuse a stale branch merely because its name matches. Report the evidence and require an explicit safe resolution.
- Do not switch, create, delete, reset, merge, or rebase branches unless explicitly requested and actually performed within the user's authority. Never record a hypothetical branch.

## Start exactly once

Immediately before writing, re-read the ticket, active sprint, dependencies, ownership, and relevant events.

1. Obtain the current local time and format it as ISO 8601 with timezone. This is the actual transition time; never invent historical time.
2. Create a unique work-session ID using the established repository convention. If none exists, derive a readable ID from the actual start timestamp and check the ticket and full event log for collisions before using it.
3. Set `status: in_progress`.
4. Set `started_at` to the transition timestamp only if it is empty. If it is populated on a nominally ready ticket, stop on the inconsistent lifecycle rather than resetting cycle time.
5. Assign the identifier of the currently active sprint to `sprint`.
6. Set `branch` only to a branch proven to exist or explicitly created during this operation; otherwise preserve an allowed empty value.
7. Associate the session with `metrics.work_sessions` using the established live representation. When the method provides no richer representation, append the unique session ID without inventing token totals, end times, agents, models, or history.
8. Update only the target's compact entry in `backlog.md` to `in_progress`, preserving its order, estimate, dependencies, link, title, and outcome.
9. Append exactly one `ticket_started` event conforming to `.claude/skills/a-team/schemas/events.md`.

The event log is append-only. Never edit old lines. Before writing, check for an existing semantic start for this ticket and sprint. If ticket, sprint assignment, session, and event already agree, report “already started” and change nothing. If any subset exists without the others, stop for reconciliation rather than adding a second start or session.

Record token usage only when directly exposed by a tool or provider. Preserve provider categories separately, use the appropriate actual purpose, set unavailable fields to `null` when a token event is supported, and never infer totals from text length.

## Carry-over and resumption

This operation is not used to re-start a ticket already `in_progress`, blocked, or in review. Carry-over planning may assign continued work to a later sprint, but it never resets `started_at`, creates a duplicate first-start event, or changes original cycle-time history. Direct resumption after a blocker belongs to `block-ticket`'s unblock operation; rework belongs to the review/rework workflow.

## Safety rules

- Start one ticket only; do not implement it.
- Do not alter scope, acceptance criteria, verification, dependencies, story points, `ready_at`, `review_at`, `done_at`, or sprint commitment.
- Do not start stretch or merely backlog work.
- Do not claim work already owned by another branch, worktree, ticket, or session.
- Do not create infrastructure, fabricate branch existence, or infer missing evidence.
- Modify only the target ticket, its existing compact backlog entry, and the existing append-only event log, plus an explicitly authorized real Git branch operation when requested.

## Validation

Review state and diff and confirm:

- the ticket was ready and committed in the single active sprint immediately before transition;
- the pre-start Git tree was clean, the recorded baseline is an ancestor of `HEAD`, and the exact sprint commitment and start event already exist in committed `HEAD`;
- dependencies were demonstrably satisfied and ownership was clear;
- status is `in_progress`, sprint matches `sprint.md`, and `started_at` is the actual start timestamp;
- the original `started_at` was not reset or reconstructed;
- the backlog entry reports `in_progress` and otherwise remains unchanged and ordered;
- any recorded branch actually exists and is not stale or incompatibly claimed;
- the session ID is unique and associated with the ticket;
- one valid `ticket_started` JSON line matches ticket, sprint, session, and ISO timezone timestamp;
- no duplicate lifecycle event or overlapping session was added;
- no unavailable token, agent, model, evidence, decision, or history was invented;
- ticket scope, estimate, review fields, other tickets, and sprint commitment did not change.

If validation fails, repair only an unambiguous partial write from this invocation. Otherwise stop and report the inconsistency without rewriting event history.

## Output

Report the ticket and sprint, resulting status, preserved or newly set `started_at`, work-session ID, real branch state, dependency and ownership checks, lifecycle event result, token-recording result, and validation. On refusal or idempotent replay, explain why state remained unchanged.
