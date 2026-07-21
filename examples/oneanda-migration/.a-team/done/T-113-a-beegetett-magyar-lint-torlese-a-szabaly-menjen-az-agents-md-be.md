---
id: T-113
title: A beégetett-magyar lint törlése — a szabály menjen az AGENTS.md-be
status: done
origin: imported
types:
  - other
profiles: []
priority: medium
risk: medium
package: P-006
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Tue Jul 21
updated_at: '2026-07-21'
resolution: completed
---
# T-113 — A beégetett-magyar lint törlése — a szabály menjen az AGENTS.md-be

## Outcome

A `hardcoded_hungarian_test.dart` törölve, a szabálya pedig az `AGENTS.md`-ben él előírásként.

## Scope

1. `app/test/hardcoded_hungarian_test.dart` törlése.

## Non-goals

- Az `app_hu.arb` sorsa (ma 0 felhasználót szolgál ki, mert a nyelvváltó ki van kapcsolva) —

## Acceptance

- The outcome is observable: A `hardcoded_hungarian_test.dart` törölve, a szabálya pedig az `AGENTS.md`-ben él előírásként.

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-112; lane: app; legacy status: done.

## Open decisions

None.



## Review evidence

Törölve: `app/test/hardcoded_hungarian_test.dart` (82 sor). Helyette az `AGENTS.md` 6. kód-

## Execution notes

Migration preview only. Source: scrum/tickets/O-112-beegetett-magyar-kapu-csak-ekezetet-lat.md. No product implementation or human ready approval is implied.
