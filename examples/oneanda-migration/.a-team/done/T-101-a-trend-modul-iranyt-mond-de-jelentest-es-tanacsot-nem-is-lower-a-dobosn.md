---
id: T-101
title: >-
  A trend-modul irányt mond, de jelentést és tanácsot nem — „is lower" a
  dobosnak nem mond semmit
status: done
origin: imported
types:
  - feature
profiles:
  - ui
priority: medium
risk: medium
package: P-002
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Mon Jul 20
updated_at: '2026-07-21'
resolution: completed
---
# T-101 — A trend-modul irányt mond, de jelentést és tanácsot nem — „is lower" a dobosnak nem mond semmit

## Outcome

A „Compared with last time" modul úgy szól a dobosról, hogy a dobos érti, mit jelent a változás, és

## Scope

- **Zaj-kapu a trend-modulban** ([recommendation_card.dart:190-196](../../app/lib/widgets/recommendation_card.dart#L190)):

## Non-goals

- **Tanács a trend mellé.** rp szabálya (2026-07-21): *tempó-módosítást csak olyan felület

## Acceptance

1. Ha a nyers pontszám-különbség a zaj-küszöb alatt van, a modul **„hasonló maradt"**-at ír, akkor

## Verification

### Automated

## Constraints

Migrated from O-100; lane: app; legacy status: done.

## Open decisions

None.

## User goal

A „Compared with last time" modul úgy szól a dobosról, hogy a dobos érti, mit jelent a változás, és

## Entry point

The existing app surface named in the source contract.

## Default state

A béta-dobos maga írta meg a Result képernyőről (2026-07-20 15:10Z, `takeId=JLkuuioCOQqvpHVB3H3k`,

## Loading state

Keep the current context visible while work is pending.

## Empty state

Explain why no content exists and provide the next valid action.

## Error state

Show an actionable error without discarding user input.

## Success state

A „Compared with last time" modul úgy szól a dobosról, hogy a dobos érti, mit jelent a változás, és

## Disabled state

Unavailable actions remain visibly disabled with an accessible explanation.

## Responsive behaviour

Preserve hierarchy from phone through desktop web.

## Keyboard and focus behaviour

All actions are keyboard reachable and focus follows state changes predictably.

## Accessibility expectations

Labels, contrast, focus, and semantics meet the platform baseline.

## Visual reference

Use the existing one&a product language; the migration does not authorize a redesign.



## Review evidence

### Amit a modul most csinál

## Execution notes

Migration preview only. Source: scrum/tickets/O-100-trend-modul-iranyt-mond-jelentest-nem.md. No product implementation or human ready approval is implied.
