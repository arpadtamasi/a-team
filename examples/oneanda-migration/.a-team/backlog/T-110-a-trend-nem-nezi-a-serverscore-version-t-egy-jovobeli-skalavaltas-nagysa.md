---
id: T-110
title: >-
  A trend nem nézi a `serverScore.version`-t — egy jövőbeli skálaváltás
  nagyságrend-állítássá válik
status: backlog
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: P-002
depends_on:
  - T-076
blocks: []
branch: null
pull_request: null
created_at: Tue Jul 21
updated_at: '2026-07-21'
---
# T-110 — A trend nem nézi a `serverScore.version`-t — egy jövőbeli skálaváltás nagyságrend-állítássá válik

## Outcome

A trend nem hasonlít össze két, KÜLÖNBÖZŐ pontozási verzióval készült pontszámot — vagy kezeli a

## Scope

- **Connector**: a `/take/score` válasz gyökere adja a `version`-t is

## Non-goals

- A `SCORING_VERSION` értékének vagy a backfill-folyamatnak a módosítása.

## Acceptance

1. Ha az előző take `serverScore.version`-je ELTÉR a mostanitól, a trend-modul **nem jelenik meg**.

## Verification

### Automated

## Constraints

Migrated from O-109; lane: app; legacy status: ready.

## Open decisions

None.

## Actual behaviour

A `fetchPreviousBlockScore` ([firestore_service.dart:145-168](../../app/lib/firebase/firestore_service.dart#L145))

## Expected behaviour

A trend nem hasonlít össze két, KÜLÖNBÖZŐ pontozási verzióval készült pontszámot — vagy kezeli a

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · app lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

A `fetchPreviousBlockScore` ([firestore_service.dart:145-168](../../app/lib/firebase/firestore_service.dart#L145))

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-109-trend-serverscore-version-ellenorizetlen.md. No product implementation or human ready approval is implied.
