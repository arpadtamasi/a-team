# Metric contract

This file owns exact delivery formulas and aggregation rules. `report-metrics` owns deterministic calculation; closure skills calculate only their operation's scoped values.

Calculate from the deterministic effective event view defined in `events.md`. Preserve raw source counts and report corrected, voided, invalid, and unavailable records separately. A correction changes derived interpretation, never the raw audit log.

## Time metrics

```text
cycle time = done_at - started_at
lead time = done_at - created_at
refinement time = ready_at - created_at
queue time = started_at - ready_at
review time = done_at - first review_at
blocked time = sum of valid, non-overlapping, closed blocked periods
unblocked flow time = cycle time - blocked time
```

Cycle time continues across sprint boundaries and includes blocked time. Review time is a first-entry approximation; lifecycle events provide detailed loop analysis. Missing source timestamps make the metric unavailable, never estimated.

## Delivery metrics

```text
committed velocity = story points of sprint-start committed tickets that reached done in that sprint
throughput = count of tickets completed in the reporting period
commitment reliability = completed committed points / sprint-start committed points
carry-over rate = unfinished sprint-start committed tickets / all sprint-start committed tickets
first-pass acceptance rate = tickets accepted in their first review round / tickets reviewed
```

Incomplete tickets contribute zero velocity. Story points are never divided. Stretch completion is separate. A carried ticket contributes only when recommitted and completed in the later sprint.

## Token-derived metrics

Within one declared ticket, sprint, or reporting-period scope and one compatible provider-reported-total population:

```text
tokens per completed ticket = compatible reported total tokens / completed tickets
tokens per completed point = compatible reported total tokens / completed story points
environment token ratio = environment-purpose reported totals / all compatible reported totals
review token ratio = review-purpose reported totals / all compatible reported totals
rework token ratio = rework-purpose reported totals / all compatible reported totals
```

Zero or unavailable denominators yield `null`. Provider populations remain separate as required by `tokens.md`.

## Aggregation

- Normalize durations to integer seconds from timezone-aware timestamps.
- Sort numeric samples ascending.
- Median is the middle value, or the arithmetic mean of the two middle values.
- The 85th percentile uses nearest rank `ceil(0.85 × n)` with one-based ranks.
- Rolling velocity is the median committed velocity of the latest 10 closed sprints by sprint date, or all available when fewer exist.
- Group story-point metrics by exact recorded Fibonacci value.
- Retain exact counts and seconds; ratios use a consistent representation.
- Every metric reports sample size, coverage, exclusions, and incompatible or invalid source data.
- Identical valid inputs produce semantically identical derived output; generation time is omitted unless a schema explicitly requires it.
