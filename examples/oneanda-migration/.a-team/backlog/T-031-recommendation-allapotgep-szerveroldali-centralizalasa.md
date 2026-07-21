---
id: T-031
title: Recommendation állapotgép szerveroldali centralizálása
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
# T-031 — Recommendation állapotgép szerveroldali centralizálása

## Outcome

A dismiss/undo connector-végpontot (vagy azzal egyenértékű szerveroldali parancsot) kap, a

## Scope

2026-07-12 follow-up code review az atomikus recommendation accept után, P2 találat.

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-31; lane: connector; legacy status: backlog.

## Open decisions

None.

## Actual behaviour

A jelenlegi szabály csak azt ellenőrzi, hogy top-level mezőként kizárólag a `recommendations`

## Expected behaviour

A dismiss/undo connector-végpontot (vagy azzal egyenértékű szerveroldali parancsot) kap, a

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · connector lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

A jelenlegi szabály csak azt ellenőrzi, hogy top-level mezőként kizárólag a `recommendations`

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-31-recommendation-allapotgep-centralizalas.md. No product implementation or human ready approval is implied.
