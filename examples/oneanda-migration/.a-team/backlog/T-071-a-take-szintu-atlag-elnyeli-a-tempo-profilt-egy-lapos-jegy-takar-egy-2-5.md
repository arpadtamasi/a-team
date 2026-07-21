---
id: T-071
title: >-
  A take-szintű átlag elnyeli a tempó-profilt — egy lapos jegy takar egy 2..5
  tartományt
status: backlog
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: P-005
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Sun Jul 19
updated_at: '2026-07-21'
---
# T-071 — A take-szintű átlag elnyeli a tempó-profilt — egy lapos jegy takar egy 2..5 tartományt

## Outcome

A dobos nem egyetlen lapos jegyet kap egy több tempót átfogó take-re: látszik, **melyik blokkban

## Scope

Provizórikus. Az aggregálás súlyozásának javítása és a per-blokk jel megjelenítése

## Non-goals

A pontszám skálázása/véletlen-korrekciója — az az [O-10](O-10-pontszam-perceptualis-aggregalas.md).

## Acceptance

- The outcome is observable: A dobos nem egyetlen lapos jegyet kap egy több tempót átfogó take-re: látszik, **melyik blokkban

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-70; lane: scoring; legacy status: backlog.

## Open decisions

- Mi váltsa/egészítse ki a lapos jegyet: per-blokk sáv a Result képernyőn, a leggyengébb blokk

## Actual behaviour

A take-szintű `timing`/`dynamics` a per-gyakorlat pontok **súlyozatlan** átlaga

## Expected behaviour

A dobos nem egyetlen lapos jegyet kap egy több tempót átfogó take-re: látszik, **melyik blokkban

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · scoring lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

A take-szintű `timing`/`dynamics` a per-gyakorlat pontok **súlyozatlan** átlaga

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-70-take-atlag-elnyeli-a-tempo-profilt.md. No product implementation or human ready approval is implied.
