# Milestone contract

This file owns the exact reusable milestone shape. Operational skills own when and how
fields change.

A milestone is an **outcome-bound commitment container**. It replaces the sprint's role as
the unit of commitment, with two deliberate differences:

1. **Not time-boxed.** A milestone closes when its goal is demonstrably reached (or is
   explicitly abandoned), never because a date passed.
2. **Concurrent.** Several milestones may be `active` at once. Each has exactly one goal.
   A ticket belongs to at most one milestone.

Sprints remain valid during migration; a workspace uses sprints or milestones, and existing
sprint history is never rewritten. New commitments should target milestones.

## File and frontmatter

Milestones live at `a-team/milestones/<milestone-id>-<slug>.md`:

```yaml
---
id: <M-N, unique, never reused>
title: <concise outcome title>
goal: <one sentence: the observable outcome that closes this milestone>
status: <active|closed|abandoned>
created_at: <ISO 8601 with timezone>
closed_at: <ISO 8601 with timezone or empty>
baseline_commit: <full lowercase hex commit ID at commitment, or empty>
---
```

Body sections: `## Goal evidence` (what proves the goal is reached), `## Committed`
(ordered ticket list at commitment; scope changes append, never rewrite), `## Approval`
(the explicit PO/PM approval record), `## Result` (filled at close).

## Ticket membership

Ticket frontmatter uses the existing `sprint:` slot's successor:

```yaml
milestone: <milestone ID or empty>
```

During migration a ticket carries either `sprint` or `milestone`, never both non-empty.
Membership is assigned at commitment or when work starts, and changing it after
commitment is a scope change (human gate).

## Events

Append-only, per `events.md` envelope:

| Event | Required payload beyond the envelope |
|---|---|
| `milestone_started` | `milestone`, `goal`, `baseline_commit`, ordered `committed_ticket_ids` |
| `milestone_closed` | `milestone`, `result: done\|abandoned`, `completed_committed_points`, `throughput` |

Ticket lifecycle events (`ticket_started`, `ticket_submitted_for_review`, `ticket_done`,
`rework_started`) record `milestone` instead of `sprint` when the ticket belongs to one.

## Invariants

- Commitment into a milestone requires explicit PO/PM approval (human gate, unchanged).
- A milestone's goal never widens silently; narrowing or widening is a recorded scope change.
- `closed` requires goal evidence in `## Result`; `abandoned` requires a reason and
  decision provenance.
- Metrics derive from events only: per-milestone lead/cycle/review time, throughput,
  first-pass acceptance, token usage (grouped by `milestone` in `token_usage` events).
- Velocity under concurrent milestones is reported per unit time (per week), not per
  container, since containers overlap.
