---
id: T-015
title: A `suggestChanges` kétszer olvassa a session-docot
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
# T-015 — A `suggestChanges` kétszer olvassa a session-docot

## Outcome

A `suggestChanges` ([recommend.ts:596](../../apps/mcp/src/recommend.ts#L596)) és a `generateSummary` ([:564](../../apps/mcp/src/recommend.ts#L564)) egyetlen Firestore-olvasással dolgoznak a `control/session`-ön hívásonként, nem kettővel.

## Scope

2026-07-16 `/ship` pre-landing review (performance specialista, 7/10). Hatókörön kívül: nem ez az ág okozta.

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-15; lane: connector; legacy status: backlog.

## Open decisions

None.



## Execution notes

Migration preview only. Source: scrum/tickets/O-15-suggestchanges-duplikalt-olvasas.md. No product implementation or human ready approval is implied.
