---
id: T-037
title: Trend-lekérdezés korlátozása és indexelése
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
# T-037 — Trend-lekérdezés korlátozása és indexelése

## Outcome

A `fetchPreviousBlockScore` Firestore query szerveroldalon `createdAt` szerint csökkenően

## Scope

2026-07-12 repository code review (`claude/beta-screens`), P2 találat.

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-37; lane: app; legacy status: backlog.

## Open decisions

None.

## Actual behaviour

A jelenlegi implementáció az azonos nevű blokk teljes történetét letölti, majd kliensoldalon

## Expected behaviour

A `fetchPreviousBlockScore` Firestore query szerveroldalon `createdAt` szerint csökkenően

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · app lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

A jelenlegi implementáció az azonos nevű blokk teljes történetét letölti, majd kliensoldalon

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-37-trend-lekerdezes-korlatozas-indexeles.md. No product implementation or human ready approval is implied.
