# Sprint contract

This file owns the exact reusable sprint record. `plan-sprint` owns commitment and `close-sprint` owns closure.

## Sprint ID and length

`<sprint-id>` is the sprint's start date as `YYYY-MM-DD`. If a sprint already started on that date, append `-2`, `-3`, … in start order. The ID never changes after the sprint starts. Sprint length is set by the goal, not the calendar: a sprint stays active until `close-sprint` closes it, and a new sprint may start the same day the previous one closed.

## Active sprint

`scrum/sprint.md` exists only while one sprint is active:

```markdown
# Sprint — <sprint-id>

Status: `active`

## Sprint goal

<one observable outcome>

## Committed

1. [<ticket ID and title>](tickets/<file>.md) — <points> SP

Committed total: **<points> SP**

Execution order: **<IDs in order>**

## Stretch

<ordered ticket links and points, or None.>

## Carry-over

<carried ticket IDs and preserved lifecycle context, or None.>

## Risks and assumptions

<evidence-backed risks and explicit assumptions>

## Approval

<evidence identifying the exact approved proposal>

Committed at: `<ISO 8601 with timezone>`
```

Committed and stretch sets are disjoint. Points are copied unchanged from ready tickets. Planning does not assign ticket sprint fields, start work, or create branch claims.

An absent `scrum/sprint.md` means no sprint is active only when the event history contains no unmatched `sprint_started` event. `plan-sprint` creates the file after an approved commitment. `close-sprint` removes it only after the matching archive and `sprint_closed` event validate successfully.

## Closed sprint archive

`scrum/sprints/<sprint-id>.md` is the self-contained historical snapshot. It preserves the committed goal, ticket sets, points, order, carry-over, risks, and approval as facts, changes the status to `closed`, rewrites ticket links relative to the archive as `../tickets/...`, and uses this exact structure:

```markdown
# Sprint — <sprint-id>

Status: `closed`

Committed at: `<ISO 8601 with timezone>`
Closed at: `<ISO 8601 with timezone>`

## Sprint goal

<original goal unchanged>

## Commitment snapshot

### Committed

1. [<ticket ID and title>](../tickets/<file>.md) — <points> SP

Committed total: **<points> SP**

Execution order: **<IDs in original order>**

### Stretch

<original ordered stretch links and points, or None.>

### Carry-over at start

<original carry-over, or None.>

### Risks and assumptions

<original risks and assumptions>

### Approval

<original approval evidence>

## Demonstrated

<observable goal-level result>

## Evidence

<executed checks, measurements, artifacts, and links>

## Ticket accounting

| Ticket | Class | Start SP | Final status | Done in sprint | Evidence / next prerequisite |
| --- | --- | ---: | --- | --- | --- |
| [<ticket ID and title>](../tickets/<file>.md) | committed\|stretch | <points> | <status> | yes\|no | <evidence or next prerequisite> |

## Sprint result

`done|partial|failed|cancelled`

<concise goal-level rationale>

## Metrics

- Committed points:
- Completed committed points:
- Committed velocity:
- Stretch completed points:
- Throughput:
- Commitment reliability:
- Carry-over ticket IDs:
- Cycle-time summary:
- Token summary:
- Token coverage and exclusions:

## Data quality and limitations

<missing or corrected events, unavailable timestamps/tokens, exclusions, and coverage limits>
```

Sprint result is exactly one of:

- `done`: the sprint goal was achieved and demonstrated;
- `partial`: useful work was completed, but the sprint goal was not fully achieved;
- `failed`: the sprint produced no acceptable goal-level result;
- `cancelled`: the sprint was deliberately stopped because the goal became invalid or lower priority.

A sprint can be `partial` even when one or more tickets are `done`. Every committed and stretch ticket appears exactly once in ticket accounting. Unfinished work records its current state and next prerequisite there; it receives no partial points. Stretch completion is reported separately. Metrics follow `metrics.md`; tokens follow `tokens.md`.

Metric values state unavailable data, effective-event corrections, provider compatibility, exclusions, and coverage rather than silently using zero.

After the archive and matching event validate, `scrum/sprint.md` is deleted. If both closure artifacts exist and the file is absent, closure is an idempotent success. If only part of that representation exists, stop for `reconcile-history` rather than guessing.
