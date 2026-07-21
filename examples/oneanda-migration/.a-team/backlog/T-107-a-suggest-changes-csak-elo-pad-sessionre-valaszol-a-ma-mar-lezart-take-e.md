---
id: T-107
title: >-
  A `suggest_changes` csak élő pad-sessionre válaszol — a ma már lezárt
  take-ekre nem tud diagnózist adni
status: backlog
origin: imported
types:
  - feature
profiles: []
priority: medium
risk: medium
package: P-002
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Tue Jul 21
updated_at: '2026-07-21'
---
# T-107 — A `suggest_changes` csak élő pad-sessionre válaszol — a ma már lezárt take-ekre nem tud diagnózist adni

## Outcome

A coach akkor is kap blokkonkénti diagnózist, ha a dobos a padon már befejezte a napot — nem csak

## Scope

- A `suggestChanges` ([recommend.ts:834](../../apps/mcp/src/recommend.ts#L834)) élő session

## Non-goals

- A mainál régebbi napok elemzése — külön igény, külön ticket.

## Acceptance

1. Ha nincs élő pad-session, de a mai napon VAN lezárt, pontozott futam, a `suggest_changes`

## Verification

### Automated

## Constraints

Migrated from O-106; lane: connector; legacy status: ready.

## Open decisions

None.



## Execution notes

Migration preview only. Source: scrum/tickets/O-106-suggest-changes-lezart-take-diagnozis.md. No product implementation or human ready approval is implied.
