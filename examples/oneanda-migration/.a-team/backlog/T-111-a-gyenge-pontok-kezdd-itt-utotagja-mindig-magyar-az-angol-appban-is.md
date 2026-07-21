---
id: T-111
title: A gyenge pontok „— kezdd itt" utótagja mindig magyar — az angol appban is
status: backlog
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: P-006
depends_on:
  - T-097
blocks: []
branch: null
pull_request: null
created_at: Tue Jul 21
updated_at: '2026-07-21'
---
# T-111 — A gyenge pontok „— kezdd itt" utótagja mindig magyar — az angol appban is

## Outcome

A gyenge pontok listája is az app nyelvén szól — az angol úton nem marad magyar szöveg.

## Scope

- A `weakPointsOf` ([recommend.ts:668](../../apps/mcp/src/recommend.ts#L668)) megkapja a nyelvet.

## Non-goals

- A coach által írt gyakorlat-nevek (`a.name`) fordítása → [O-97](O-97-magyar-gyakorlas-tartalom-angol-appban.md).

## Acceptance

1. `en` nyelven a `weakPoints` egyetlen eleme sem tartalmaz magyar szöveget a RENDSZER által

## Verification

### Automated

## Constraints

Migrated from O-110; lane: connector; legacy status: in_progress.

## Open decisions

None.

## Actual behaviour

A `weakPointsOf` ([recommend.ts:676](../../apps/mcp/src/recommend.ts#L676)) a magyar

## Expected behaviour

A gyenge pontok listája is az app nyelvén szól — az angol úton nem marad magyar szöveg.

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · connector lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

A `weakPointsOf` ([recommend.ts:676](../../apps/mcp/src/recommend.ts#L676)) a magyar

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-110-weakpoints-kezdd-itt-magyar.md. No product implementation or human ready approval is implied.
