# Ticket contract

This file owns the exact reusable ticket shape. Operational skills own when and how fields change.

## File and frontmatter

Tickets live at `a-team/tickets/<ticket-id>-<slug>.md` and use this frontmatter:

```yaml
---
id: <unique stable ID>
title: <concise title>
lane: <repository lane or null>
type: <feature|bug|research|operations|decision|documentation|other>
status: <backlog|ready|in_progress|review|blocked|done|parked|rejected>
story_points: <1|2|3|5 or empty>
created_at: <ISO 8601 with timezone or empty historical unknown>
ready_at: <ISO 8601 with timezone or empty>
started_at: <ISO 8601 with timezone or empty>
review_at: <ISO 8601 with timezone or empty>
done_at: <ISO 8601 with timezone or empty>
sprint: <sprint ID or empty>
milestone: <milestone ID or empty — see milestone.md; never both sprint and milestone non-empty>
branch: <real claimed branch or empty>
blocked_periods: []
metrics:
  work_sessions: []
---
```

IDs are never reused or renumbered. Lifecycle timestamps record real transitions, never reconstructed history. Unknown migrated values remain empty and their absence is disclosed.

`done_at` records accepted delivery only. A `parked` or `rejected` disposition keeps `done_at` empty; its transition time and decision provenance live in the append-only lifecycle event and its outcome is recorded in `Result`.

`story_points` is populated only when the ticket becomes `ready` and remains unchanged after completion. `sprint` is assigned when work starts, not during planning. A non-empty `branch` is an ownership claim and must name a real branch.

`metrics.work_sessions` is an ordered list of unique session-ID strings. Token totals do not belong in ticket frontmatter.

## Blocked periods

Each blocked period uses:

```yaml
- started_at: <ISO 8601 with timezone>
  ended_at: <ISO 8601 with timezone or empty while open>
  reason: <concrete blocker>
  prior_status: <ready|in_progress|review>
  resolution_evidence: <evidence and provenance or empty while open>
```

Periods never overlap. Historical periods are append-only except that unblocking closes the latest open period by filling its empty closure fields. A terminal disposition may also close the latest open period with the disposition decision as evidence, without claiming that the blocker itself was resolved.

## Refined ticket body

An executable ticket uses these sections in order:

```markdown
## Outcome
## Why
## Scope
## Out of scope
## Acceptance criteria
## Verification
## Dependencies
## Context
## Result
```

`Result` remains empty until closure. An optional `Refinement notes` section may preserve sizing rationale, resolved ambiguity, and remaining constraints.

## Capture-stage body

Before refinement, a newly captured ticket may instead use:

```markdown
## Outcome
## Why
## Known context
## Open questions
## Scope notes
## Out of scope
## Dependencies
## Refinement notes
```

Capture does not invent acceptance criteria or verification. Refinement normalizes the body to the executable shape only when evidence supports it.
