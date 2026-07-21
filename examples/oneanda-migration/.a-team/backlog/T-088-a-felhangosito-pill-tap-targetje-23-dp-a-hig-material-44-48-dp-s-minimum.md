---
id: T-088
title: >-
  A felhangosító pill tap-targetje ~23 dp — a HIG/Material 44–48 dp-s minimuma
  alatt
status: backlog
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: null
depends_on:
  - T-081
blocks: []
branch: null
pull_request: null
created_at: Mon Jul 20
updated_at: '2026-07-21'
---
# T-088 — A felhangosító pill tap-targetje ~23 dp — a HIG/Material 44–48 dp-s minimuma alatt

## Outcome

A Készenlét képernyő felhangosító pillje megbízhatóan eltalálható (tap-target ≥ 44 dp) és

## Scope

Provizórikus: hit-área ≥ 44 dp + `Semantics(button: true)` + ikon `semanticLabel`; a vizuális

## Non-goals

- A pill vizuális mérete és stílusa (design-forrás: 15-ös turn).

## Acceptance

- The outcome is observable: A Készenlét képernyő felhangosító pillje megbízhatóan eltalálható (tap-target ≥ 44 dp) és

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-87; lane: app; legacy status: backlog.

## Open decisions

- Design-kérdés: elfogadja-e rp a láthatatlan hit-área-növelést (sávmagasság-hatással), vagy a

## Actual behaviour

Az O-80 review adverzariális passa mérte ki: a pill `4/12` paddingje 10.5 dp-s feliraton

## Expected behaviour

A Készenlét képernyő felhangosító pillje megbízhatóan eltalálható (tap-target ≥ 44 dp) és

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · app lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Az O-80 review adverzariális passa mérte ki: a pill `4/12` paddingje 10.5 dp-s feliraton

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-87-felhangosito-pill-tap-target.md. No product implementation or human ready approval is implied.
