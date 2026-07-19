---
id: AT-4
title: Stop routing delivery work to the missing ticket-cycle skill
lane: null
type: bug
status: backlog
story_points:
created_at: 2026-07-19T20:49:51+02:00
ready_at:
started_at:
review_at:
done_at:
sprint:
branch:
blocked_periods: []
metrics:
  work_sessions: []
---

## Outcome

The A-Team router directs a full ticket delivery request only to an operation that actually exists and has a defined lifecycle contract.

## Why

The root router currently tells users to use `ticket-cycle`, but the package contains no `skills/ticket-cycle/SKILL.md`, so the advertised route cannot be followed.

## Known context

- Affected artifact: root `SKILL.md`, in the final delivery-loop paragraph.
- Repository evidence: the router names `ticket-cycle`, while the `skills/` directory has no corresponding operation.
- Consequence: a user requesting the full delivery loop is sent to an unavailable workflow.
- Severity: important but not blocking for the active path-resolution ticket.
- Source: self-audit of `TEMP-20260719-01` on 2026-07-19.

## Open questions

- Should A-Team add a real orchestration skill, or should the router direct users through the existing lifecycle operations?
- If orchestration is added, which human approval gates and interruption points must it preserve?

## Scope notes

- Provisional: make the public router and the available operation catalogue agree.

## Out of scope

None explicitly identified.

## Dependencies

Unknown.

## Refinement notes

Refinement must choose between removing the unsupported route and defining the missing orchestration operation; capture does not make that product decision.
