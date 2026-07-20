---
id: AT-5
title: Migrate commitment operations from sprint to concurrent milestones
lane: null
type: feature
status: backlog
story_points:
created_at: 2026-07-20T08:55:00+02:00
ready_at:
started_at:
review_at:
done_at:
sprint:
milestone: M-1
branch:
blocked_periods: []
metrics:
  work_sessions: []
---

## Outcome

The commitment container is the milestone (`schemas/milestone.md`): outcome-bound, never
time-boxed, several active concurrently. `plan-sprint`/`close-sprint` gain milestone-aware
successors (or milestone modes), ticket lifecycle events record `milestone`, and
`report-metrics` reports velocity per unit time under concurrent containers.

## Why

PO/PM decision (2026-07-20, office-hours session): the milestone is closer to how the
work actually flows than the single-goal sprint; several outcome tracks run at once in
real projects (store-prep, scoring, landing). Schema and METHOD.md anchor already landed;
the executable operations are this ticket.

## Known context

- `schemas/milestone.md` defines the shape, events, and invariants.
- METHOD.md "Milestones" section: sprint invariants preserved, no time-box, concurrency,
  per-time velocity, sprint history never rewritten.
- Human gates unchanged: milestone commitment and scope changes remain PO/PM approvals.
- Board (`skills/board/`) and prime (`skills/prime/`) already render/report milestones.

## Open questions

- New skills (`plan-milestone`, `close-milestone`) or milestone modes on existing ones?
- What is the migration story for the active sprint in this repo and the consuming repos?
- Does `retro` attach to each milestone close, or to a cadence?
