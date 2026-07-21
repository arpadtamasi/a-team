---
id: T-010
title: A timing-pontszám véletlen-korrekciót kap — a skála alsó fele ma halott
status: done
origin: imported
types:
  - feature
profiles: []
priority: high
risk: medium
package: P-005
depends_on:
  - T-074
blocks: []
branch: null
pull_request: null
created_at: Fri Jul 17
updated_at: '2026-07-21'
resolution: completed
---
# T-010 — A timing-pontszám véletlen-korrekciót kap — a skála alsó fele ma halott

## Outcome

A dobos timing-jegye **véletlen-korrigált**: a `0` a véletlen-szintet jelenti, nem a semmit.

## Scope

- **κ-korrekció a timing-pontra** a `libs/chart/src/eval/evaluate.ts`-ben; a `pₑ` levezetése

## Non-goals

- **A `dynamics` κ-korrekciója.** Más a képlete (`1 − |Δvel|`), ezért saját `pₑ`-levezetést kíván;

## Acceptance

1. A timing-pont véletlen-korrigált: `κ = (p − pₑ)/(1 − pₑ)`, `0`-ra vágva alul, és a `pₑ`

## Verification

### Automated

## Constraints

Migrated from O-10; lane: scoring; legacy status: done.

## Open decisions

None.



## Review evidence

**Review-jelölt** (2026-07-20, branch `feat/o10-timing-chance-correction`, 6 commit).

## Execution notes

Migration preview only. Source: scrum/tickets/O-10-pontszam-perceptualis-aggregalas.md. No product implementation or human ready approval is implied.
