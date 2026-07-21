---
id: AT-14
title: Require a real ticket branch before implementation starts
lane: null
type: bug
status: backlog
story_points:
created_at: 2026-07-21T10:51:49+02:00
ready_at:
started_at:
review_at:
done_at:
sprint:
milestone:
branch:
blocked_periods: []
metrics:
  work_sessions: []
---

## Outcome

Starting implementation creates or selects a dedicated, real Git branch before any
ticket implementation commit is made, and the ticket records that branch as its ownership
claim.

## Why

`TEMP-20260719-01` was started while the repository was on `main`; its `branch` field was
left empty and its implementation commit landed directly on the default branch. The PO/PM
identified that behavior as a bug.

The current `start-ticket` contract permits this: it says starting does not require branch
creation and makes branch creation depend on separate authority. That leaves implementation
work without branch isolation even though the method models a branch as the ticket's
ownership claim.

## Known context

- Affected artifacts include `skills/start-ticket/SKILL.md`, `PROCESSES.md`, and the branch
  rules shared by the method and ticket schema.
- Observed example: `TEMP-20260719-01` has an empty `branch` field; candidate commit
  `62cdf60` was created on `main`.
- The repository is now on `feat/m1-pm-surface`, but that later branch does not change the
  branchless start history of `TEMP-20260719-01`.
- Consequence: ticket work can land directly on the default branch without an isolated
  ownership surface for review or recovery.
- Source: PO/PM report on 2026-07-21.

## Open questions

- Is the required branch one branch per ticket or one branch per milestone/commitment?
- What branch naming convention should `start-ticket` use?
- Should starting create and switch branches in the current worktree, or create a separate
  worktree?
- Which work types, if any, may remain on the default branch?
- How should an existing, stale, or already checked-out matching branch be handled?
- Does the already landed branchless `TEMP-20260719-01` history need a separate corrective
  migration, or should the rule apply only to future starts?

## Scope notes

- Provisional: make branch isolation a start prerequisite and keep the Git branch and
  ticket ownership field consistent.
- Refinement must reconcile automatic branch creation with Git safety and external-action
  authority.

## Out of scope

None explicitly identified.

## Dependencies

Unknown.

## Refinement notes

Captured as a process bug rather than silently changing the current review candidate or
rewriting existing Git history.
