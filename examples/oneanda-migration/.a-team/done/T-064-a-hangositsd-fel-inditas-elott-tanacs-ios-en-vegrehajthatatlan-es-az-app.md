---
id: T-064
title: >-
  A „hangosítsd fel indítás előtt" tanács iOS-en végrehajthatatlan — és az app
  el is rejti a hangerő-visszajelzést
status: done
origin: imported
types:
  - bug
profiles:
  - bug
priority: high
risk: high
package: null
depends_on:
  - T-060
blocks: []
branch: null
pull_request: null
created_at: Sat Jul 18
updated_at: '2026-07-21'
resolution: completed
---
# T-064 — A „hangosítsd fel indítás előtt" tanács iOS-en végrehajthatatlan — és az app el is rejti a hangerő-visszajelzést

## Outcome

A halk metronóm figyelmeztetése a ready képernyőn **végrehajtható** cselekvést kínál: egy gomb,

## Scope

A ready képernyő preflight-figyelmeztetése kap egy cselekvő gombot, az

## Non-goals

- **A rendszer hangerő-HUD elrejtésének feloldása.** A `false` az app szándékos, dokumentált

## Acceptance

1. A ready képernyő preflight-figyelmeztetése a küszöb alatt egy megnyomható gombot mutat, ami

## Verification

### Automated

## Constraints

Migrated from O-63; lane: app; legacy status: done.

## Open decisions

None.

## Actual behaviour

A mai figyelmeztetés jó problémát ismer fel, és **rossz tanácsot ad hozzá**.

## Expected behaviour

A halk metronóm figyelmeztetése a ready képernyőn **végrehajtható** cselekvést kínál: egy gomb,

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · app lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

A mai figyelmeztetés jó problémát ismer fel, és **rossz tanácsot ad hozzá**.

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Review evidence

**A halk metronóm figyelmeztetése végrehajtható cselekvést kínál.** A „hangosítsd fel indítás

## Execution notes

Migration preview only. Source: scrum/tickets/O-63-hangero-figyelmeztetes-vegrehajthatatlan.md. No product implementation or human ready approval is implied.
