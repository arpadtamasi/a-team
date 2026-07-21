---
id: T-024
title: Practice kéz- és hangsúlyjelölés vizuális szétválasztása
status: backlog
origin: imported
types:
  - feature
profiles:
  - ui
priority: medium
risk: medium
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Fri Jul 17
updated_at: '2026-07-21'
---
# T-024 — Practice kéz- és hangsúlyjelölés vizuális szétválasztása

## Outcome

A Practice nézetben a sticking két keze külön, stabil színt kap, miközben a hangsúly nem ugyanezzel a színcsatornával van kódolva: az accent aláhúzott, a ghost pedig kisebb (kb. félakkora) betű. A jelölés a nagy-betűs gyakorlási nézetből is távolról olvasható marad.

## Scope

2026-07-12 drummer feedback (`screen=Practice`); 2026-07-13 inbox triage során backlogba véve. A kapcsolódó téves Result-dinamika P1 javítása külön elkészült (#38), ez csak a Practice vizuális kódolása.

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-24; lane: app; legacy status: backlog.

## Open decisions

None.

## User goal

A Practice nézetben a sticking két keze külön, stabil színt kap, miközben a hangsúly nem ugyanezzel a színcsatornával van kódolva: az accent aláhúzott, a ghost pedig kisebb (kb. félakkora) betű. A jelölés a nagy-betűs gyakorlási nézetből is távolról olvasható marad.

## Entry point

The existing app surface named in the source contract.

## Default state

A dobos visszajelzése szerint a dinamika mai színezése furcsa és összemossa a kéz- és hangsúlyinformációt. Külön vizuális csatornákkal egyszerre látszik, melyik kéz jön és milyen erővel kell ütni.

## Loading state

Keep the current context visible while work is pending.

## Empty state

Explain why no content exists and provide the next valid action.

## Error state

Show an actionable error without discarding user input.

## Success state

A Practice nézetben a sticking két keze külön, stabil színt kap, miközben a hangsúly nem ugyanezzel a színcsatornával van kódolva: az accent aláhúzott, a ghost pedig kisebb (kb. félakkora) betű. A jelölés a nagy-betűs gyakorlási nézetből is távolról olvasható marad.

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



## Execution notes

Migration preview only. Source: scrum/tickets/O-24-practice-kez-hangsuly-jeloles.md. No product implementation or human ready approval is implied.
