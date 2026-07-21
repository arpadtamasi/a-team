---
id: T-091
title: >-
  Az O-73 csonkoltság-detektora épp a legrosszabb blokkokat hagyja ki — 50 %-os
  detektálás sem jelöl
status: backlog
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: P-005
depends_on:
  - T-074
blocks: []
branch: null
pull_request: null
created_at: Mon Jul 20
updated_at: '2026-07-21'
---
# T-091 — Az O-73 csonkoltság-detektora épp a legrosszabb blokkokat hagyja ki — 50 %-os detektálás sem jelöl

## Outcome

Egy blokk, aminek az ütéseiből a mikrofon a felét sem hallotta meg, **megjelölődik nem mérhetőként**

## Scope

Provizórikus: a `lowTruncation` kritérium újraszármaztatása + korpusz-felmérés arról, hány take

## Non-goals

- A detektor küszöbe és a halk ütés meghallása → [O-74](O-74-detektor-halk-utes-erzekenyseg.md).

## Acceptance

- The outcome is observable: Egy blokk, aminek az ütéseiből a mikrofon a felét sem hallotta meg, **megjelölődik nem mérhetőként**

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-90; lane: scoring; legacy status: backlog.

## Open decisions

- A p10-feltétel a hibás, a padló származtatása, vagy a kettő aránya (`1,35`)?

## Actual behaviour

Az O-73 bevezette a blokk-szintű alsó-csonkoltság jelölést (`lowTruncated`), és a korpuszon

## Expected behaviour

Egy blokk, aminek az ütéseiből a mikrofon a felét sem hallotta meg, **megjelölődik nem mérhetőként**

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · scoring lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Az O-73 bevezette a blokk-szintű alsó-csonkoltság jelölést (`lowTruncated`), és a korpuszon

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-90-o73-csonkoltsag-detektor-alulcsordul.md. No product implementation or human ready approval is implied.
