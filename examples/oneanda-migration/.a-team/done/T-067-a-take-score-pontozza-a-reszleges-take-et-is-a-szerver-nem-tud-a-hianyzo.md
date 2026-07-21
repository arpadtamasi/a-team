---
id: T-067
title: >-
  A `/take/score` pontozza a részleges take-et is — a szerver nem tud a hiányzó
  adatról
status: done
origin: imported
types:
  - bug
profiles:
  - bug
priority: critical
risk: high
package: null
depends_on:
  - T-065
blocks: []
branch: null
pull_request: null
created_at: Sun Jul 19
updated_at: '2026-07-21'
resolution: completed
---
# T-067 — A `/take/score` pontozza a részleges take-et is — a szerver nem tud a hiányzó adatról

## Outcome

A `/take/score` **visszautasítja** a részlegesnek jelölt take pontozását, tehát hiányzó adatra

## Scope

A [apps/mcp/src/score.ts](../../apps/mcp/src/score.ts) `handleScore` függvényében korai kilépés a

## Non-goals

- A `partial` mező bevezetése és a kliens-oldali viselkedés — az [O-64](O-64-mikrofon-folyam-nema-halala.md).

## Acceptance

1. `partial: true` take-re küldött `/take/score` kérés hibával tér vissza, és a take-dokumentum

## Verification

### Automated

## Constraints

Migrated from O-66; lane: connector; legacy status: done.

## Open decisions

None.

## Actual behaviour

Az [O-64](O-64-mikrofon-folyam-nema-halala.md) app-oldalon oldja meg, hogy megszakadt felvételnél ne

## Expected behaviour

A `/take/score` **visszautasítja** a részlegesnek jelölt take pontozását, tehát hiányzó adatra

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · connector lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Az [O-64](O-64-mikrofon-folyam-nema-halala.md) app-oldalon oldja meg, hogy megszakadt felvételnél ne

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Review evidence

**Review-ra beadva 2026-07-19T00:53:50+02:00** (session `O-66-20260719-004757`, branch

## Execution notes

Migration preview only. Source: scrum/tickets/O-66-take-score-reszleges-take-kapu.md. No product implementation or human ready approval is implied.
