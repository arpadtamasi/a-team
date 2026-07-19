---
id: GH-3
title: Give every review submission a stable round identity
lane: null
type: bug
status: backlog
story_points:
created_at: 2026-07-19T19:20:50+02:00
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

Every initial and repeated review submission has a schema-defined round identity that writers record consistently and readers can use for deduplication and first-pass acceptance.

## Why

The event schema currently omits the identity that the submission and review procedures require, so repeated submissions may be indistinguishable without an improvised field.

## Scope

- Define one positive integer `review_round` for review submission and rework events.
- Define the initial submission as round `1`, rework as referring to the round whose findings are being addressed, and the next submission as the following integer.
- Use ticket, sprint, event type, and round as the stable lifecycle identity; timestamps are occurrence facts, not deduplication keys.
- Update `submit-review`, `review-ticket`, event examples, and round-dependent metric guidance to use the same rule.
- Preserve existing append-only rows without `review_round` and make their round-dependent coverage limitation visible instead of rewriting them.

## Out of scope

- Rewriting existing append-only event rows.
- Adding a generic `ticket_reviewed` lifecycle event.
- Designing a separate review-artifact store.
- Requiring a separate candidate identifier when the round already identifies the lifecycle submission.

## Acceptance criteria

1. Every newly appended `ticket_submitted_for_review` and `rework_started` event contains a positive integer `review_round`.
2. The first submission uses `1`; rework after round `n` records `n`; resubmission records `n + 1` only after the matching rework transition.
3. Submission and review procedures detect duplicates by ticket, sprint, event type, and `review_round`, never by timestamp alone.
4. First-pass acceptance is derived specifically from round `1` and its findings.
5. Legacy rows without `review_round` remain unchanged and usable for non-round lifecycle facts, while round-dependent identity and metrics are reported unavailable wherever durable evidence cannot disambiguate them.
6. Ambiguous or non-sequential history causes refusal rather than an invented round number.
7. Event examples and all producers and consumers use the same field name and semantics.

## Verification

### Automated

- `git diff --check`
- Parse every changed event example as one-line JSON and validate positive integer round values where required.

### Manual

- Walk an isolated sequence of submit round 1, idempotent resubmission attempt, rework round 1, submit round 2, and a second idempotent attempt; verify event identities and counts.
- Walk legacy missing-round and non-sequential histories and confirm that no round is guessed.

### Documentation

- Cross-check `schemas/events.md`, `skills/submit-review/SKILL.md`, `skills/review-ticket/SKILL.md`, and round-dependent metric wording for identical semantics.

## Dependencies

TEMP-20260719-01 must make the current source package available through the local adapter before dogfooding the review sequence.

## Context

- Imported from [GitHub issue #3](https://github.com/arpadtamasi/a-team/issues/3).
- The observed real-world workaround added a round field on the writer's initiative, but the schema did not define it.
- The proposed minimal identity is a required round number on every new submission and rework event; a separate candidate identifier remains optional evidence.

## Result

## Refinement notes

Sizing conclusion: 3 points. The work is bounded across one schema and its main producers/consumers, but it remains `backlog` and unestimated until the user approves the material identity decision: required `review_round` on every new event, without a second required candidate ID.
