---
id: T-016
title: 'Take-olvasat kottaként — R/L sávok a rácson, waveform-overlayjel (dev-eszköz)'
status: backlog
origin: imported
types:
  - feature
profiles: []
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
# T-016 — Take-olvasat kottaként — R/L sávok a rácson, waveform-overlayjel (dev-eszköz)

## Outcome

Egy take kirajzolódik zenei nézetben: két sáv (R fent, L lent), alattuk/felettük a számolás-rács (`4 e & a 1 e & a 2 e & a | 3 e & a …`), és a rácshoz képest kirakva, hova esett a tényleges ütés. Látszik rajta: melyik kéz ütött (a két sáv külön), hol a rácshoz képest — korán/pontosan/későn, előjelesen (ez a `biasMs` vizuális megfelelője), hangsúly (accent/ghost), ha a gyakorlat tartalmaz ilyet, a hiányzó és plusz ütés, az ütemvonalak és a count-in.

## Scope

2026-07-16, rp kérése képpel, közvetlenül az *AI értékelés semmitmondó* task után; az overlay-igény ugyanabban a körben jött. Prioritás: dev-eszköz, nem béta-blokkoló.

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-16; lane: scoring; legacy status: backlog.

## Open decisions

None.



## Execution notes

Migration preview only. Source: scrum/tickets/O-16-take-olvasat-kottakent-overlay.md. No product implementation or human ready approval is implied.
