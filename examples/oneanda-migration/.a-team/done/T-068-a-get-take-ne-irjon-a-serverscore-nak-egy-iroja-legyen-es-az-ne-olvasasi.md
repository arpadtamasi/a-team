---
id: T-068
title: >-
  A `get_take` ne írjon — a `serverScore`-nak egy írója legyen, és az ne
  olvasási mellékhatás
status: done
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
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
# T-068 — A `get_take` ne írjon — a `serverScore`-nak egy írója legyen, és az ne olvasási mellékhatás

## Outcome

A `serverScore`-nak **egyetlen írója** van (a `/take/score`), és az írás soha nem egy olvasás

## Scope

A `getTake.ts` write-back ágának ([:199-207](../../apps/mcp/src/getTake.ts#L199)) **törlése** —

## Non-goals

- A `/take/score` kapuja — az [O-66](O-66-take-score-reszleges-take-kapu.md) szállította.

## Acceptance

1. A `get_take` hívása **nem módosítja** a take-dokumentumot: sem `serverScore`, sem `scoredAt`

## Verification

### Automated

## Constraints

Migrated from O-67; lane: connector; legacy status: done.

## Open decisions

- Kell-e ugyanez a szűrés a `recommend.ts` baseline-olvasására? Az a `serverScore`-t olvassa

## Actual behaviour

Az [O-66](O-66-take-score-reszleges-take-kapu.md) a `/take/score` endpointra tette ki a kaput

## Expected behaviour

A `serverScore`-nak **egyetlen írója** van (a `/take/score`), és az írás soha nem egy olvasás

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · connector lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Az [O-66](O-66-take-score-reszleges-take-kapu.md) a `/take/score` endpointra tette ki a kaput

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Review evidence

**Review-ra beadva 2026-07-19T12:11:30+02:00** (session `O-67-20260719-120835`, branch

## Execution notes

Migration preview only. Source: scrum/tickets/O-67-get-take-writeback-partial-kapu.md. No product implementation or human ready approval is implied.
