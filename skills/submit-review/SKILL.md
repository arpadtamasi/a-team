---
name: submit-review
description: Move one implemented Scrum ticket from in_progress into review after confirming that a real candidate result and implementation-level verification evidence exist. Use this skill whenever the user asks to submit, hand off, send, or move a ticket or implementation to review, or says a ticket is ready for review—even when they do not name Scrum. Do not use it to perform the review, begin rework, declare completion, or close the ticket.
compatibility: Requires repository filesystem access and existing Scrum ticket, backlog, sprint, and metrics artifacts governed by the live method.
---

# Submit Review

Create an auditable review handoff. The transition means that a candidate result exists and has been checked at implementation level; it does not mean the result is accepted or done.

## Transition ownership

This skill alone owns the normal `in_progress` to `review` transition, the first `review_at` value, and `ticket_submitted_for_review` events.

Do not:

- review or approve the result;
- set `done_at`, close the ticket, or award story points;
- begin rework or append `rework_started`;
- change scope, acceptance criteria, verification requirements, estimate, sprint commitment, `started_at`, or branch history;
- edit implementation merely to make the handoff pass;
- treat a commit, diff, generated code, or agent summary as sufficient evidence by itself.

## Inputs

Require one ticket identified by ID, exact path, or unambiguous title. Accept links to candidate artifacts, commands already run, and manual or measurement evidence. Discover repository facts before asking for information that can be inspected.

If the target is ambiguous, or the user has not authorized the transition, report what was found and leave state unchanged.

## Resolve the live method

Determine the package layout first. In the A-Team source repository, use root `METHOD.md`,
`schemas/...`, `skills/...`, `GSTACK.md`, `PROCESSES.md`, and `GLOSSARY.md` when relevant.
After installation, use their `.claude/skills/a-team/...` equivalents. Never prefer an
installed copy in the source repository.

1. Read `AGENTS.md`.
2. Read the selected package's `METHOD.md`.
3. Read the selected package's `schemas/ticket.md`, `schemas/events.md`, and `schemas/tokens.md` for exact shared contracts.
4. The method wins over this skill if their operational rules conflict.

Require the target ticket and the method-defined Scrum artifacts used by this operation. Do not create a missing backlog, ticket directory, sprint, or metrics structure.

## Inspect live state

Before changing anything, inspect:

- the complete ticket and its compact backlog entry;
- `a-team/sprint.md` and the ticket's active sprint assignment;
- the actual working tree, current/default branches, branch ownership, commits, and ticket-relevant diff;
- changed files and candidate output or research artifact;
- every verification command and manual, measurement, or documentation check named in the ticket;
- recorded outputs, logs, screenshots, measurements, and known failures;
- required research and decision logs;
- related blockers and dependencies;
- the ticket's work sessions and `a-team/metrics/events.jsonl`, when present.

Repository artifacts and executed outputs are facts. User statements not corroborated by inspectable evidence remain identified assumptions. Never invent a command result, timestamp, branch, session, token count, or evidence.

## Check eligibility

The ticket must currently be `in_progress`. Refuse the transition when it is `backlog`, `ready`, `blocked`, `parked`, `rejected`, or `done`.

For a ticket already in `review`, treat an identical rerun as idempotent: report the existing handoff and do not change `review_at` or append another event. If new work followed a recorded `rework_started`, require a new candidate and new verification before another review submission; preserve the original first-entry `review_at` and append one event for the new review round.

Confirm all of the following:

- a concrete candidate result exists in the repository or a ticket-defined external artifact;
- the diff or artifact can be associated with this ticket;
- implementation-level verification required before review was actually run;
- the evidence records command or protocol, result, and relevant limitations;
- known failures are disclosed rather than presented as passing;
- measurement-backed claims have executed measurement output stored or linked;
- no unresolved blocker makes review entry misleading.
- every concrete problem noticed during implementation or handoff inspection is linked to an existing backlog ticket or captured through `.claude/skills/a-team/skills/capture-work/SKILL.md`.

The Boy Scout rule covers defects; smells; duplication; unnecessary complexity; SOLID violations; risky coupling; security, privacy, authorization, data, migration, performance, resource, accessibility, observability, dependency, license, supply-chain, test, documentation, and operational problems. Capture only repository-grounded actionable findings, reuse outcome-equivalent tickets, and create separate tickets for independent outcomes.

Found-work capture does not expand the candidate scope. Work not required by this ticket stays `backlog`, unestimated, unstarted, and outside the active sprint. A blocker-level security, privacy, authorization, data-loss, or operational-safety risk in the current candidate still blocks handoff; creating a ticket is not a waiver.

Missing optional checks may be listed for the reviewer. Missing ticket-required verification or implementation evidence blocks submission. Do not run broad or destructive checks without authority; when a safe required check can be run now, run it and record its real output.

## Record the handoff

Use one current local ISO 8601 timestamp with timezone for the real transition. Never reconstruct historical times.

1. Set `status: review`.
2. Set `review_at` only when it is empty. Preserve it across later review/rework rounds because the method defines review time from first entry.
3. Preserve `started_at`, `sprint`, `branch`, story points, blocked periods, and all historical fields.
4. Record a unique review-session ID only when the repository schema supports sessions. Associate it with the ticket and sprint without replacing prior sessions.
5. Record the candidate, verification evidence, known limitations, and handoff session in the method-defined ticket location or existing repository convention. Do not invent a new evidence system.
6. Update only the target's compact backlog state when the board mirrors ticket status.

If `a-team/metrics/events.jsonl` exists, scan it before appending. Append exactly one `ticket_submitted_for_review` event conforming to `.claude/skills/a-team/schemas/events.md` for this submission.

Use the live method's compatible schema. Identify a duplicate by ticket, review round/candidate, and existing transition event—not timestamp alone. Never rewrite existing lines; correct bad history only with a method-defined correction event. Parse every appended line before success.

Append `token_usage` only when the tool or provider exposes counts. Preserve each provider category, model, provider, source, session, ticket, sprint, and purpose `review` where known; use `null` for exposed-schema fields that are unknown. Never estimate counts from text or activity. If metrics infrastructure is absent, report that logging was skipped rather than creating it.

## Validate

Review the diff and confirm:

- the ticket was `in_progress` and now is `review`;
- a real candidate and required verification evidence exist;
- first `review_at` is a real timezone-qualified transition time and was not reset;
- `done_at`, estimate, scope, `started_at`, sprint, and branch history did not change;
- exactly one handoff event was appended for this review round and any token event is provider-exposed;
- backlog state, ticket state, session reference, and event agree;
- every concrete found-work item has a resolvable ticket link and no duplicate outcome was created;
- no implementation, review decision, closure, sprint commitment, or unrelated file changed.

If validation fails, repair only handoff-owned artifacts when safe; otherwise report the blocker and do not claim submission.

## Report

Report the ticket ID and path, candidate result, verification actually observed, missing or failing checks, every found-work ticket created or linked, resulting state, `review_at` behavior, review session, lifecycle/token logging, assumptions, and files changed. When refusing, name the unmet prerequisite and confirm that state and events remain unchanged.
