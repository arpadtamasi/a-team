---
id: T-087
title: >-
  A média-hangerő listener process-szintű singleton — két képernyő
  regisztrációja némán kioltja egymást
status: done
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
created_at: Mon Jul 20
updated_at: '2026-07-21'
resolution: obsolete
---
# T-087 — A média-hangerő listener process-szintű singleton — két képernyő regisztrációja némán kioltja egymást

## Outcome

A hangerő-listener regisztráció robusztus arra az esetre, ha két képernyő (Készenlét és

## Scope

Provizórikus; refine dönti el a megoldási irányt.

## Non-goals

None explicitly identified.

## Acceptance

- The outcome is observable: A hangerő-listener regisztráció robusztus arra az esetre, ha két képernyő (Készenlét és

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-86; lane: app; legacy status: rejected.

## Open decisions

- Van-e középtávon olyan tervezett navigáció, ami a két képernyőt stackeli? (Ha soha, a javítás

## Actual behaviour

A `flutter_volume_controller` (2.0.1) `addListener`-e a meglévő listenert némán cancelli:

## Expected behaviour

A hangerő-listener regisztráció robusztus arra az esetre, ha két képernyő (Készenlét és

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · app lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

A `flutter_volume_controller` (2.0.1) `addListener`-e a meglévő listenert némán cancelli:

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Review evidence

**REJECTED — 2026-07-20.**

## Execution notes

Migration preview only. Source: scrum/tickets/O-86-volume-listener-singleton-torekeny.md. No product implementation or human ready approval is implied.
