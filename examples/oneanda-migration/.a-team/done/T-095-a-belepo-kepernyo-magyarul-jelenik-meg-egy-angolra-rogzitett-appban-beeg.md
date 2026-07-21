---
id: T-095
title: >-
  A belépő képernyő magyarul jelenik meg egy angolra rögzített appban —
  beégetett stringek
status: done
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: P-006
depends_on:
  - T-055
blocks: []
branch: null
pull_request: null
created_at: Mon Jul 20
updated_at: '2026-07-21'
resolution: completed
---
# T-095 — A belépő képernyő magyarul jelenik meg egy angolra rögzített appban — beégetett stringek

## Outcome

A LEGELSŐ képernyő, amit egy új tesztelő lát, ugyanazon a nyelven szól, mint a többi app és a

## Scope

Provizórikus: a két megtalált hely l10n-kulcsra kötése (EN + HU), plusz egy szisztematikus

## Non-goals

- A nyelvválasztó visszakapcsolása (szándékosan rejtett a bétában).

## Acceptance

- The outcome is observable: A LEGELSŐ képernyő, amit egy új tesztelő lát, ugyanazon a nyelven szól, mint a többi app és a

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-94; lane: app; legacy status: done.

## Open decisions

- Van-e további beégetett string a fordításon kívül? (A gyors keresés kettőt talált; érdemes

## Actual behaviour

2026-07-20, szimulátoros screenshot-készítés közben derült ki: a belépő képernyő gombja

## Expected behaviour

A LEGELSŐ képernyő, amit egy új tesztelő lát, ugyanazon a nyelven szól, mint a többi app és a

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · app lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

2026-07-20, szimulátoros screenshot-készítés közben derült ki: a belépő képernyő gombja

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Review evidence

**LEZÁRVA — a munka leszállt, a lifecycle viszont sosem futott le.** Utólagos rögzítés, rp

## Execution notes

Migration preview only. Source: scrum/tickets/O-94-beegetett-magyar-a-belepo-kepernyon.md. No product implementation or human ready approval is implied.
