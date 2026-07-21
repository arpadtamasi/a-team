---
id: T-054
title: Crashlytics-bekötés a Flutter appba
status: done
origin: imported
types:
  - feature
profiles:
  - ui
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
# T-054 — Crashlytics-bekötés a Flutter appba

## Outcome

A Flutter app Firebase Crashlyticsba jelenti a nem kezelt Dart-hibákat és a natív összeomlásokat:

## Scope

- `firebase_crashlytics` függőség felvétele ([pubspec.yaml](../../app/pubspec.yaml)), iOS pod-integráció.

## Non-goals

- Android-oldali crash-riport finomhangolás a minimális bekötésen túl (ha a build zöld, elég).

## Acceptance

1. A `firebase_crashlytics` szerepel a [pubspec.yaml](../../app/pubspec.yaml)-ban és a build (iOS)

## Verification

### Automated

## Constraints

Migrated from O-53; lane: app; legacy status: done.

## Open decisions

None.

## User goal

A Flutter app Firebase Crashlyticsba jelenti a nem kezelt Dart-hibákat és a natív összeomlásokat:

## Entry point

The existing app surface named in the source contract.

## Default state

Az [O-1](O-1-store-prep-testflight.md) „felügyelet nélküli béta" előfeltétele: idegen tesztelőket

## Loading state

Keep the current context visible while work is pending.

## Empty state

Explain why no content exists and provide the next valid action.

## Error state

Show an actionable error without discarding user input.

## Success state

A Flutter app Firebase Crashlyticsba jelenti a nem kezelt Dart-hibákat és a natív összeomlásokat:

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

**Review-jelölt** (2026-07-20, branch `feat/o53-crashlytics`, commitok `5aca5737` + `bc1ccc6c`).

## Execution notes

Migration preview only. Source: scrum/tickets/O-53-crashlytics-bekotes.md. No product implementation or human ready approval is implied.
