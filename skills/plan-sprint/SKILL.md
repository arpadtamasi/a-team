---
name: plan-sprint
description: Prepare one evidence-based Scrum sprint proposal and, only after the human explicitly approves that exact proposal, write the active sprint commitment and log sprint_started. Use this skill whenever the user asks to plan a sprint, choose committed or stretch work, set a sprint goal, approve a sprint proposal, or begin a new sprint. Do not use it to refine, estimate, start, implement, block, review, close, or merely report existing work.
compatibility: Requires repository filesystem and Git inspection plus the Scrum artifacts defined by the live method.
---

# Plan Sprint

Propose a realistic sprint commitment from ready work, then preserve the human approval gate. Planning selects work; it does not begin it.

## Inputs

Use the user's planning request, constraints, availability, priorities, and explicit approval. Discover ticket state, estimates, dependencies, ownership, risks, and velocity from repository artifacts rather than asking for facts that are already recorded.

An approval is valid only when the user clearly approves the exact displayed proposal in the current interaction. A request to “plan,” “prepare,” or “show” a sprint is not approval. Material changes to goal, committed tickets, stretch tickets, or risks require a new proposal and approval.

Product discovery and technical planning are separate from sprint planning. Installed gstack `/office-hours`, `/autoplan`, `/plan-ceo-review`, and `/plan-eng-review` may explain or challenge candidate work, but they cannot make a ticket ready, schedule it, or substitute for this approval gate. Apply [`.claude/skills/a-team/GSTACK.md`](../../GSTACK.md) when their artifacts are relevant.

## Resolve the live contract

Determine the package layout first. In the A-Team source repository, use root `METHOD.md`,
`schemas/...`, `skills/...`, `GSTACK.md`, `PROCESSES.md`, and `GLOSSARY.md` when relevant.
After installation, use their `.claude/skills/a-team/...` equivalents. Never prefer an
installed copy in the source repository.

1. Read `AGENTS.md` and the selected package's `METHOD.md`.
2. Read the selected package's `schemas/sprint.md`, `schemas/events.md`, and `schemas/tokens.md` for exact shared contracts.
3. The selected method wins over this skill when they conflict.

Do not create missing backlog, ticket, sprint-history, or metrics infrastructure. An absent `sprint.md` is the canonical idle state, not missing infrastructure, when no unmatched `sprint_started` event exists. Planning creates `sprint.md` only after approval. Otherwise report the prerequisite.

## Inspect live state

Before proposing anything, inspect:

- the ordered `backlog.md`, all candidate ticket files, and their links;
- the current `sprint.md`, if present, and any unresolved active commitment;
- ready tickets, estimates, dependencies, blocked periods, sprint assignments, and branch ownership;
- Git's current branch, local branches, worktrees, and divergence/staleness evidence without checking out or deleting anything;
- recent closed sprint records, recent committed velocity, carry-over, reliability, and unfinished work;
- the append-only event log and generated metric summary, when present, checking derived claims against raw or sprint records;
- explicit user availability or capacity constraints.

Distinguish repository facts, user-provided constraints, and planning assumptions. Do not infer that a dependency is satisfied merely because it is absent from the backlog. Do not invent velocity when history is missing.

Detect an active sprint from `sprint.md`, sprint files, tickets, and unmatched `sprint_started`/`sprint_closed` events. Absence of `sprint.md` plus a fully matched history means no active sprint. If those sources disagree, stop and report the inconsistency. Never create a second active sprint.

Inspect Git with untracked files included. Before presenting a committable proposal, report
whether the index and worktree are clean and identify the current full `HEAD` commit object
ID. A dirty
tree may be investigated and classified read-only, but it cannot become an approved sprint
baseline. Do not stash, discard, absorb, stage, or commit pending changes under this skill.

## Build the proposal

1. Choose exactly one observable sprint goal. Describe a demonstrable outcome, not activity or a list of tickets.
2. Consider backlog order and recent completed velocity, but do not treat velocity as a quota or override explicit human priority.
3. Put only tickets currently in `ready` into committed or stretch work. Confirm each has a valid `1`, `2`, `3`, or `5` estimate and a resolvable ticket file.
4. If a gstack plan proposes a material contract change, exclude the affected ticket until `refine-ticket` resolves that proposal with the required human approval. Do not edit scope during sprint planning.
5. Check dependencies, active claims, branch conflicts, stale branches, shared unresolved decisions, and likely file overlap. Exclude tickets that cannot responsibly start.
6. Separate committed tickets from optional stretch tickets. Stretch work is not part of the commitment.
7. Sum committed story points exactly once per committed ticket. Never split points, silently change estimates, or count stretch points as committed.
8. Identify carry-over explicitly. A carried ticket remains governed by its original `started_at`; planning never resets lifecycle timestamps or ticket state.
9. State dependency, ownership, capacity, review, measurement, and carry-over risks supported by evidence.

If no coherent one-goal proposal can be formed from ready work, report why and leave state unchanged. Do not refine tickets, create substitute work, or weaken readiness.

Present the proposal with:

- proposed sprint identifier/date;
- one sprint goal;
- committed tickets and points;
- committed point total;
- stretch tickets and points, separately;
- carry-over and dependency risks;
- velocity context and its coverage or absence;
- explicit assumptions;
- a request for human approval.

Without approval, stop after the proposal and make no file or event changes.

If the repository is dirty, present planning content only as a draft and name the baseline
prerequisite. Do not request approval for a proposal that cannot legally be committed from
the observed Git state.

## Commit an approved sprint

Immediately before writing, re-read all proposal inputs. If state changed materially, invalidate the approval and present a revised proposal.

After explicit approval:

1. Reconfirm there is no active sprint and every selected ticket is still `ready`, unclaimed, dependency-safe, and in the approved category.
2. Require `git status --porcelain=v1 --untracked-files=all` to be empty, resolve `HEAD^{commit}` to the repository's full lowercase hexadecimal object ID, and preserve it as `baseline_commit`. Refuse an unborn branch, missing Git repository, staged change, modified file, untracked file, abbreviated ID, or non-commit object. Never clean or commit on the user's behalf under planning authority.
3. Use the current local date as the sprint identifier unless the live repository has an unambiguous compatible convention. Obtain the current local time at the moment of commitment and format it as ISO 8601 with timezone; never reconstruct or invent it.
4. Create or update `sprint.md` in the exact live-method or established repository format. Record active status, identifier, Git baseline, approved goal, committed and stretch ticket links with unchanged points, risks, carry-over, and approval evidence sufficient to identify the approved proposal. Do not put unapproved work into it.
5. Do not change ticket status, `started_at`, branch, scope, estimate, or sprint assignment. `start-ticket` owns beginning work and assignment.
6. Append one `sprint_started` event using the same timestamp and `baseline_commit`, conforming to `.claude/skills/a-team/schemas/events.md`.

The event log is append-only. Never edit or reorder existing lines. Before appending, check `sprint.md` and the entire relevant event history for the same sprint start. If the approved sprint is already recorded consistently, report the operation as already applied and append nothing. If only part of the state exists or fields disagree, stop for reconciliation rather than duplicating the event.

Record planning token usage only if the tool or provider exposes it. Preserve reported provider categories and identifiers, use purpose `planning`, set exposed-but-unknown fields to `null`, and never estimate from text length. Append token events; do not rewrite lifecycle history.

Planning intentionally leaves the new sprint file and event as a PM-only Git diff. Report
the exact files and require them to be committed before `start-ticket`; do not claim that
the repository remains clean after writing the commitment.

## Safety rules

- Human approval is required before any commitment write.
- A clean committed Git baseline is required before any commitment write.
- Do not implement, start, claim, block, refine, reprioritize, or alter ticket scope.
- Do not mark any ticket `in_progress` or set its sprint field.
- Do not create a branch, switch branches, or repair stale branches.
- Do not auto-pull work after a ticket completes.
- Do not present assumptions, derived summaries, or chat history as repository facts.
- Modify only `sprint.md` and the existing event log required for the approved commitment.

## Validation

Review the diff and confirm:

- the proposal had explicit approval and did not change after approval;
- there is exactly one active sprint and exactly one observable goal;
- the recorded baseline is the exact clean pre-write `HEAD` and is identical in the sprint file and start event;
- every committed and stretch ticket was `ready` at commitment time;
- committed and stretch work are distinct and committed points sum correctly;
- ticket state, estimates, lifecycle timestamps, scope, and branches did not change;
- carry-over retained its original `started_at`;
- `sprint.md` links resolve and match the approved proposal;
- the appended event is valid one-line JSON with an ISO 8601 timezone timestamp;
- no duplicate `sprint_started` event was introduced;
- no unavailable tokens, velocity, evidence, decisions, or history were invented;
- only the operation-owned files changed.

Confirm that the post-write diff contains only the approved sprint file and appended
event/token lines, and report that `start-ticket` remains blocked until this PM state is
committed.

If validation fails, repair only an unambiguous write from this invocation. Otherwise stop and report the inconsistency; never rewrite old events.

## Output

For a proposal, report the complete proposal, evidence coverage, assumptions, risks, and that no state changed. For an approved commitment, report the sprint identifier, goal, committed/stretch tickets and points, `sprint.md` path, event result, token-recording result, and validation status. For refusal, name the prerequisite or conflict and confirm state remained unchanged.
