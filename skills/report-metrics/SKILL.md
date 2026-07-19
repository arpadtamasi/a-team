---
name: report-metrics
description: Recalculate this repository’s Scrum delivery and token metrics from append-only raw events plus ticket and closed-sprint records, deterministically refresh summary.json, and explain missing or inconsistent data. Use this skill whenever the user asks for cycle-time percentiles, velocity, throughput, reliability, carry-over, review or rework ratios, token accounting, sessions per ticket, a metrics dashboard, or a refresh of derived Scrum metrics. Do not use it for live status, ticket or sprint transitions, retrospectives, or cross-provider performance ranking.
compatibility: Requires repository filesystem access and valid Scrum event, ticket, and sprint artifacts defined by the live project-management method.
---

# Report Metrics

Generate reproducible metrics from raw truth. This operation may replace only the derived `a-team/metrics/summary.json`; it never changes tickets, sprints, backlog, `sprint.md`, or raw events.

## Inputs

Use the user-specified period, otherwise report the full valid history and identify the latest 10 closed sprints for rolling velocity. Record the period boundaries and timezone basis in the output.

## Resolve the repository contract

Determine the package layout first. In the A-Team source repository, use root `METHOD.md`,
`schemas/...`, `skills/...`, `GSTACK.md`, `PROCESSES.md`, and `GLOSSARY.md` when relevant.
After installation, use their `.claude/skills/a-team/...` equivalents. Never prefer an
installed copy in the source repository.

1. Read `AGENTS.md` and the selected package's `METHOD.md`.
2. Read the selected package's `schemas/metrics.md`, `schemas/events.md`, `schemas/ticket.md`, `schemas/sprint.md`, and `schemas/tokens.md` for exact shared contracts.
3. The live method's definitions override this skill.

Require existing `a-team/metrics/events.jsonl`, `a-team/tickets/`, and `a-team/sprints/`. Do not create missing raw history or alternative infrastructure. The operation may create `summary.json` only inside an existing, authorized metrics directory because it owns that derived artifact.

## Load and validate source data

Hash every nonblank JSONL line before parsing, then validate its JSON object, event name, ISO 8601 timestamp with timezone, and required identifiers. Report line numbers and reasons for invalid raw records. A malformed target may contribute through one valid approved replacement or be omitted through `void`; otherwise invalid data that could change a requested metric leaves that metric `null` or partial. Never skip or rewrite raw lines silently.

Read relevant ticket frontmatter and closed sprint archives. Reconcile IDs, lifecycle order, sprint membership, fixed commitments, story points, blocked periods, review rounds, session IDs, and results. Raw events are the append-only lifecycle and token truth; ticket and sprint files supply contract fields and closure evidence. Surface disagreements instead of selecting whichever improves a metric.

Build the deterministic effective event view exactly as defined by `.claude/skills/a-team/schemas/events.md`, including raw-line hashes and linear correction chains. Deduplicate only exact duplicate effective source records for calculation and report them as inconsistencies; never mutate the log. Invalid or ambiguous correction chains make the affected record unavailable rather than inviting a favorable interpretation.

## Deterministic calculation rules

Apply `.claude/skills/a-team/schemas/metrics.md` exactly, including duration normalization, sample ordering, percentile, ratio, grouping, rolling-window, rounding, null, and coverage rules.

Include source counts, exclusions, and calculation version so identical inputs produce byte-identical semantic JSON. Sort object keys or arrays by stable documented keys. Do not include a generation timestamp unless the live schema requires one; a wall-clock value would make unchanged inputs non-deterministic.

## Delivery metrics

Calculate every requested delivery metric that the source coverage supports, using only the catalog and formulas in `.claude/skills/a-team/schemas/metrics.md`.

## Token metrics

Use only provider/tool-exposed `token_usage` events and calculate token metrics according to `.claude/skills/a-team/schemas/tokens.md` and `.claude/skills/a-team/schemas/metrics.md`. Never estimate missing values, merge incompatible provider totals, or rank cross-provider efficiency.

gstack timelines, review/ship JSONL files, local analytics, duration, cost displays, and workflow completion statuses are gstack telemetry, not Scrum metric events. Include gstack usage only when reliable provider-exposed values were already recorded as valid Scrum `token_usage` events with compatible attribution. Follow [`.claude/skills/a-team/GSTACK.md`](../../GSTACK.md); never translate telemetry heuristically.

## Refresh the summary

Build a complete candidate summary in memory, including schema/calculation version, period, raw and effective source counts, correction counts and exclusions, data-quality findings, delivery metrics, token coverage, and token metrics.

Before replacement:

1. validate the candidate as JSON;
2. recompute it independently from the same inputs and confirm semantic equality;
3. compare with the existing summary;
4. write only when the authorized target differs;
5. use an atomic replacement if repository tooling supports it.

Do not append a lifecycle event for summary regeneration; it is a derived report, not a state transition. Do not edit `events.jsonl`. If path authority, schema, or source validity is materially ambiguous, provide a read-only human report and leave the existing summary unchanged.

## Validate

Confirm:

- all included events were valid and attributable under the stated rules;
- every applied correction formed a valid linear chain and raw/effective counts remain distinguishable;
- every metric lists its sample size or coverage;
- percentile, median, ratio, and latest-10 ordering rules were applied consistently;
- commitments use sprint-start records and points remain whole;
- token values are exposed values and provider categories are preserved;
- repeated execution on unchanged input yields the same semantic summary;
- tickets, backlog, `sprint.md`, archives, and raw events did not change;
- only `a-team/metrics/summary.json` changed, if any file changed.

## Output

Provide a compact human-readable report with period, delivery metrics, token metrics and coverage, data-quality warnings, source counts, exclusions, whether `summary.json` changed, and its path. Use `null` or “unavailable” instead of invented precision.
