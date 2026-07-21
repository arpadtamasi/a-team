---
id: T-082
title: 'Az előnézetben nincs ütés, csak klikk — nem mutatja be a gyakorlatot'
status: backlog
origin: imported
types:
  - feature
profiles:
  - ui
priority: medium
risk: medium
package: null
depends_on:
  - T-063
blocks: []
branch: null
pull_request: null
created_at: Sun Jul 19
updated_at: '2026-07-21'
---
# T-082 — Az előnézetben nincs ütés, csak klikk — nem mutatja be a gyakorlatot

## Outcome

A „Meghallgatás" megmutatja, hogy a gyakorlat HOGYAN HANGZIK — a dobos hallja az ütéseket, nem

## Scope

- Az [O-62](O-62-preview-take-klikk-elter.md) elfogadási kritériuma **nem sérülhet**: a felvétel és

## Non-goals

- A felvétel alatti hang — ott a click-only megkötés áll, és az O-62 döntése szerint nem változik.

## Acceptance

- The outcome is observable: A „Meghallgatás" megmutatja, hogy a gyakorlat HOGYAN HANGZIK — a dobos hallja az ütéseket, nem

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-81; lane: app; legacy status: backlog.

## Open decisions

- Milyen hang legyen az ütés? (Minta-alapú pergő-hang vs. szintetizált; a régi 200 Hz-es zajburst

## User goal

A „Meghallgatás" megmutatja, hogy a gyakorlat HOGYAN HANGZIK — a dobos hallja az ütéseket, nem

## Entry point

The existing app surface named in the source contract.

## Default state

rp eszközös ellenőrzése a 25-ös buildről, 2026-07-19:

## Loading state

Keep the current context visible while work is pending.

## Empty state

Explain why no content exists and provide the next valid action.

## Error state

Show an actionable error without discarding user input.

## Success state

A „Meghallgatás" megmutatja, hogy a gyakorlat HOGYAN HANGZIK — a dobos hallja az ütéseket, nem

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

Migration preview only. Source: scrum/tickets/O-81-elonezet-mutassa-be-a-gyakorlatot.md. No product implementation or human ready approval is implied.
