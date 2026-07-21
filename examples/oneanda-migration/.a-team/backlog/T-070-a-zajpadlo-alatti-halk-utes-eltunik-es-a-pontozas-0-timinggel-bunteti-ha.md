---
id: T-070
title: >-
  A zajpadló alatti halk ütés eltűnik, és a pontozás 0 timinggel bünteti — hamis
  pontszám
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
  - T-047
blocks: []
branch: null
pull_request: null
created_at: Sun Jul 19
updated_at: '2026-07-21'
---
# T-070 — A zajpadló alatti halk ütés eltűnik, és a pontozás 0 timinggel bünteti — hamis pontszám

## Outcome

A **szándékolt halk dinamika** (ghost, halk blokk) nem termel hamis pontszámot: az ilyen ütés vagy

## Scope

Két rétegben, rp döntése szerint (2026-07-19: „Mindkettő"):

## Non-goals

- **A gyors tempó (144–186 bpm) populáció.** A felmérés kimutatta, hogy ott is vesznek el ütések,

## Acceptance

1. Egy blokk **alsó csonkoltsága** detektálható és a kiértékelés kimenetében megjelenik

## Verification

### Automated

## Constraints

Migrated from O-69; lane: scoring; legacy status: backlog.

## Open decisions

None.

## Actual behaviour

A halk ütést a detektor a zajpadló miatt eldobja, a pontozás viszont kihagyásként kezeli és `0`

## Expected behaviour

A **szándékolt halk dinamika** (ghost, halk blokk) nem termel hamis pontszámot: az ilyen ütés vagy

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · scoring lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

A halk ütést a detektor a zajpadló miatt eldobja, a pontozás viszont kihagyásként kezeli és `0`

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-69-zajpadlo-alatti-halk-utes-hamis-pontszam.md. No product implementation or human ready approval is implied.
