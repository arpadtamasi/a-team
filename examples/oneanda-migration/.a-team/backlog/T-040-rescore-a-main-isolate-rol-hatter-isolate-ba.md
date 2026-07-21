---
id: T-040
title: Rescore a main isolate-ról háttér-isolate-ba
status: backlog
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Fri Jul 17
updated_at: '2026-07-21'
---
# T-040 — Rescore a main isolate-ról háttér-isolate-ba

## Outcome

A take végén futó `ClickRescore.run` + `measureLatencyMs` (`take_recorder.dart` `stop()`)

## Scope

Cons/miért nem most: Weben a `compute()` nem igazi isolate (ugyanazon a szálon fut), tehát csak

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

- The outcome is observable: A take végén futó `ClickRescore.run` + `measureLatencyMs` (`take_recorder.dart` `stop()`)

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-39; lane: scoring; legacy status: backlog.

## Open decisions

None.

## Actual behaviour

A teljes bufferelt PCM-en két per-sample IIR-burkoló + latency-pass fut szinkronban a main

## Expected behaviour

A take végén futó `ClickRescore.run` + `measureLatencyMs` (`take_recorder.dart` `stop()`)

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · scoring lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

A teljes bufferelt PCM-en két per-sample IIR-burkoló + latency-pass fut szinkronban a main

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-39-rescore-main-isolate-hatter-isolate.md. No product implementation or human ready approval is implied.
