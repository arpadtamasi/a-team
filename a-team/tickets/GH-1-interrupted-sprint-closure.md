---
id: GH-1
title: Make interrupted sprint closure recoverable
lane: null
type: bug
status: ready
story_points: 3
created_at: 2026-07-19T19:20:50+02:00
ready_at: 2026-07-19T19:22:21+02:00
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

Rerunning `close-sprint` after an interruption in its documented write sequence safely completes the missing closure steps or refuses a conflicting state without duplicating the archive or event.

## Why

A partial closure currently routes the agent to a history-reconciliation operation that refuses to repair sprint files, so a rule-following agent can become stuck and cannot plan the next sprint.

## Scope

- Define the recoverable partial states produced by the existing ordered closure writes: archive created before event, and validated archive plus event before active-file deletion.
- Make `close-sprint` validate and reuse an identical existing archive instead of treating it as a conflicting second closure.
- When an identical archive exists without the closure event, append the one missing event using the archive's durable closure timestamp and validated facts, then continue normal validation and active-file deletion.
- When an identical archive and matching closure event exist while the active sprint file remains, validate them and delete only the stale active file.
- Keep conflicting archives, mismatched events, event-only partials, and states not reachable from the documented write order as explicit refusals.
- Align `schemas/sprint.md`, `close-sprint`, `reconcile-history`, and the human-readable process boundary so none routes a recoverable close-owned interruption to an operation that refuses it.

## Out of scope

- Rewriting, deleting, or correcting raw event rows.
- Reconstructing a missing archive from a closure event that lacks the archive's demonstration and metric details.
- Repairing manually edited or conflicting sprint records.
- Changing sprint-result or metric formulas.
- Making `reconcile-history` own sprint-file mutation.

## Acceptance criteria

1. Normal uninterrupted closure still creates one archive, appends one closure event, validates both, and removes the active sprint file.
2. An identical validated archive with no closure event is reused; exactly one matching event is appended and the active sprint file is removed after validation.
3. An identical validated archive and matching event with the active sprint file still present results only in validation and removal of that active file.
4. Repeating either recovery after completion reports idempotent success and changes nothing.
5. A conflicting archive, mismatched event, event without archive, or partial state not attributable to the documented write order leaves all artifacts unchanged and reports the exact inconsistency.
6. No recovery path invents a timestamp, demonstration, metric, ticket state, or sprint result, and no existing event line is edited.
7. The schema and owning skills direct recoverable closure states to `close-sprint` and reserve historical event correction for `reconcile-history` without a circular refusal.

## Verification

### Automated

- `git diff --check`
- Parse every example closure event introduced or changed by the ticket as one-line JSON conforming to `schemas/events.md`.

### Manual

- Walk the closure state matrix in isolated fixture copies: no prior artifact; archive only; archive plus event plus active file; fully closed; conflicting archive; mismatched event; event only.
- For each case, compare pre/post files and event-line counts with the owning rule in the acceptance criteria.

### Documentation

- Cross-check the recovery ownership and refusal rules in `schemas/sprint.md`, `skills/close-sprint/SKILL.md`, `skills/reconcile-history/SKILL.md`, and `PROCESSES.md`.

## Dependencies

TEMP-20260719-01 must make the current source package available through the local adapter before dogfooding this recovery path.

## Context

- Imported from [GitHub issue #1](https://github.com/arpadtamasi/a-team/issues/1).
- `close-sprint` already orders writes as archive, event, validation, then active-file deletion.
- The user selected the close-owned idempotent recovery direction rather than expanding general history reconciliation.

## Result

## Refinement notes

Estimated at 3 points: the outcome is bounded, but it changes a multi-artifact transition across the schema and two owning procedures and requires adversarial state-matrix verification.
