---
id: T-104
title: >-
  A két fogyasztó nélküli magyar címke-halmaz törlése — a lint felmentései is
  eltűnnek
status: done
origin: imported
types:
  - other
profiles: []
priority: medium
risk: medium
package: P-006
depends_on:
  - T-100
blocks: []
branch: null
pull_request: null
created_at: Mon Jul 20
updated_at: '2026-07-21'
resolution: completed
---
# T-104 — A két fogyasztó nélküli magyar címke-halmaz törlése — a lint felmentései is eltűnnek

## Outcome

A két fogyasztó nélküli magyar címke-halmaz törölve, és a lint `allowed` térképéből eltűnnek a

## Scope

- **`TakeSummary.evennessLabel`** törlése ([take_summary.dart:72-73](../../app/lib/models/take_summary.dart#L72))

## Non-goals

- A `Settings.langCode` (a BESZÉLT nyelv) — az ÉL, és két voice-hívás használja. Nem ez a

## Acceptance

1. Az `evennessLabel` getter és a `Settings.languages` térkép **nincs többé a kódban**; az

## Verification

### Automated

## Constraints

Migrated from O-103; lane: app; legacy status: done.

## Open decisions

None.



## Review evidence

### Amit töröl

## Execution notes

Migration preview only. Source: scrum/tickets/O-103-halott-magyar-cimkek-fogyaszto-nelkul.md. No product implementation or human ready approval is implied.
