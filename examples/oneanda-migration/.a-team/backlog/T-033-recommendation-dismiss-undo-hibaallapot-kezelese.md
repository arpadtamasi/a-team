---
id: T-033
title: Recommendation dismiss/undo hibaállapot kezelése
status: backlog
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: P-004
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Fri Jul 17
updated_at: '2026-07-21'
---
# T-033 — Recommendation dismiss/undo hibaállapot kezelése

## Outcome

A Summary képernyő `_setStatus` útja `try/finally`-jal mindig feloldja a kártya busy állapotát,

## Scope

2026-07-12 follow-up code review az atomikus recommendation accept után, P2 találat.

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-33; lane: app; legacy status: backlog.

## Open decisions

None.

## Actual behaviour

A közvetlen dismiss/undo írás kivételét jelenleg semmi nem kezeli. Hiba esetén a Future elszáll,

## Expected behaviour

A Summary képernyő `_setStatus` útja `try/finally`-jal mindig feloldja a kártya busy állapotát,

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · app lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

A közvetlen dismiss/undo írás kivételét jelenleg semmi nem kezeli. Hiba esetén a Future elszáll,

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-33-recommendation-dismiss-undo-hibakezeles.md. No product implementation or human ready approval is implied.
