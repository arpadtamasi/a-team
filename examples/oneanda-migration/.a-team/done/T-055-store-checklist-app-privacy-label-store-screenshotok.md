---
id: T-055
title: Store-checklist — App Privacy label + store-screenshotok
status: done
origin: imported
types:
  - operations
profiles:
  - workflow
priority: critical
risk: medium
package: P-001
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Sat Jul 18
updated_at: '2026-07-21'
resolution: completed
---
# T-055 — Store-checklist — App Privacy label + store-screenshotok

## Outcome

Az App Store Connect listing beadásra kész a nem-kód checklist-elemekben: az App Privacy

## Scope

- **App Privacy label** kitöltése az App Store Connectben az app valós adatkezelése alapján:

## Non-goals

- IP-scrub / katalógus-generizálás → [O-1](O-1-store-prep-testflight.md) refinement-notes és

## Acceptance

1. Az App Privacy kérdőív az App Store Connectben ki van töltve, és tükrözi a tényleges gyűjtött/

## Verification

### Manual

## Constraints

Migrated from O-54; lane: store; legacy status: done.

## Open decisions

None.

## Actors

Player, coach, operator, and the responsible delivery agent where applicable.

## Initial state

Az [O-1](O-1-store-prep-testflight.md) store-beadási kapujának két, kódtól független eleme. A

## States

Use only the states already present in the product and this ticket contract.

## Transitions

Az App Store Connect listing beadásra kész a nem-kód checklist-elemekben: az App Privacy

## Triggers

The user or operational action described by the source contract.

## Permissions

Preserve existing authorization and privacy boundaries.

## Error paths

Failures remain visible and retryable without silent partial completion.

## Cancellation path

Cancellation leaves canonical repository and product state valid.

## Retry and duplicate-action behaviour

Retries are idempotent or explicitly rejected.

## Audit and notification expectations

Record material state changes; notify only the actor who can respond.



## Review evidence

**LEZÁRVA — 2026-07-20 19:32.**

## Execution notes

Migration preview only. Source: scrum/tickets/O-54-store-checklist-assetek.md. No product implementation or human ready approval is implied.
