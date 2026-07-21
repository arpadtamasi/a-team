---
id: T-036
title: Közös Firestore tranzakciós teszt-helper
status: backlog
origin: imported
types:
  - other
profiles: []
priority: low
risk: medium
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Fri Jul 17
updated_at: '2026-07-21'
---
# T-036 — Közös Firestore tranzakciós teszt-helper

## Outcome

Ha újabb modul kap konkurencia- vagy retry-tesztet, a `summary.spec.ts` lokális, optimista

## Scope

2026-07-12 follow-up code review az atomikus recommendation accept után, P3 találat; csak a

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-36; lane: connector; legacy status: backlog.

## Open decisions

None.



## Execution notes

Migration preview only. Source: scrum/tickets/O-36-kozos-firestore-tranzakcios-teszt-helper.md. No product implementation or human ready approval is implied.
