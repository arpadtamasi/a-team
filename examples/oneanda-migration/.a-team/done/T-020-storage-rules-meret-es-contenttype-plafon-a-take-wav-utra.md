---
id: T-020
title: 'storage.rules: méret- és contentType-plafon a take-WAV útra'
status: done
origin: imported
types:
  - operations
profiles:
  - workflow
priority: medium
risk: medium
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Fri Jul 17
updated_at: '2026-07-21'
resolution: completed
---
# T-020 — storage.rules: méret- és contentType-plafon a take-WAV útra

## Outcome

A `storage.rules` `users/{userId}/**` write-ága méret- és contentType-korláttal rendelkezik:

## Scope

- A `storage.rules`-ban a take-WAV útra (`users/{userId}/takes/{file}`) `request.resource.size`

## Non-goals

- Kalibrációs WAV feltöltési szabály: a kalibráció ma nem tölt Storage-ba, csak lokális

## Acceptance

1. A `users/{userId}/takes/{file}` (vagy az azt lefedő) write-ág elutasítja a

## Verification

### Automated (elvégezve, 2026-07-18)

## Constraints

Migrated from O-20; lane: store; legacy status: done.

## Open decisions

None.

## Actors

Player, coach, operator, and the responsible delivery agent where applicable.

## Initial state

Ma a szabály egyetlen wildcard, csak auth+uid-tulajdon ellenőrzéssel

## States

Use only the states already present in the product and this ticket contract.

## Transitions

A `storage.rules` `users/{userId}/**` write-ága méret- és contentType-korláttal rendelkezik:

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

**Elfogadott kimenet (2026-07-18).** A take-WAV feltöltési út abúzus ellen zárva, és a legit

## Execution notes

Migration preview only. Source: scrum/tickets/O-20-storage-rules-meret-contenttype.md. No product implementation or human ready approval is implied.
