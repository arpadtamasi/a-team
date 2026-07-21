---
id: T-065
title: >-
  A mikrofon-folyam némán meghalhat felvétel közben — a take elmentődik és
  pontot kap a hiányzó adatra
status: done
origin: imported
types:
  - bug
profiles:
  - bug
priority: critical
risk: high
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Sat Jul 18
updated_at: '2026-07-21'
resolution: completed
---
# T-065 — A mikrofon-folyam némán meghalhat felvétel közben — a take elmentődik és pontot kap a hiányzó adatra

## Outcome

Ha a mikrofon-folyam felvétel közben elhal, a take **részlegesként** mentődik, **pontszámot nem

## Scope

**Detektálás.** A megszakadás három, egymást kiegészítő jelből:

## Non-goals

- **A már szennyezett scoring-korpusz megtisztítása.** A felmérés megmondja a mértékét; a takarítás

## Acceptance

1. Felvétel közben háttérbe tett app esetén a take `partial: true` jelöléssel mentődik, és a

## Verification

### Automated

## Constraints

Migrated from O-64; lane: app; legacy status: done.

## Open decisions

None.

## Actual behaviour

**Bizonyított eset**: `IC4DiVrzma92rPhRGk0S` (uid `H50TV…`, 2026-07-18T09:04:04Z). A tervezett blokk

## Expected behaviour

Ha a mikrofon-folyam felvétel közben elhal, a take **részlegesként** mentődik, **pontszámot nem

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · app lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

**Bizonyított eset**: `IC4DiVrzma92rPhRGk0S` (uid `H50TV…`, 2026-07-18T09:04:04Z). A tervezett blokk

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Review evidence

**Review-ra beadva 2026-07-19T02:10:52+02:00** (session `O-64-20260719-010549`, branch

## Execution notes

Migration preview only. Source: scrum/tickets/O-64-mikrofon-folyam-nema-halala.md. No product implementation or human ready approval is implied.
