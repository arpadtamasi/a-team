---
id: T-022
title: Produkált hero-trailer (~30s) — ha valaha kell
status: backlog
origin: imported
types:
  - feature
profiles:
  - ui
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
# T-022 — Produkált hero-trailer (~30s) — ha valaha kell

## Outcome

Ha a landingre egyszer kell egy produkált, ~30 mp-es, 16:9 darab a 10–15 mp-es valódi demó mellé, a nyersanyag rendelkezésre áll (`videos/oneanda-promo/`), és a hero elkészíthető. Ehhez kell:

## Scope

2026-07-16. Ez egy HyperFrames-spike volt, nem termék-igény — a cél a technológia kipróbálása volt, és sikerült: 30.0s, 1920×1080, H.264+AAC (zene + 8 SFX), `lint` 0 hiba, `check` passed, kontraszt 10/10 WCAG AA. A spike mellékterméke egy 30 mp-nyi pozicionálás-állítás lett, amit egy ideig termék-döntésnek néztünk — nem az volt.

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

- The outcome is observable: Ha a landingre egyszer kell egy produkált, ~30 mp-es, 16:9 darab a 10–15 mp-es valódi demó mellé, a nyersanyag rendelkezésre áll (`videos/oneanda-promo/`), és a hero elkészíthető. Ehhez kell:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-22; lane: gtm; legacy status: backlog.

## Open decisions

None.

## User goal

Ha a landingre egyszer kell egy produkált, ~30 mp-es, 16:9 darab a 10–15 mp-es valódi demó mellé, a nyersanyag rendelkezésre áll (`videos/oneanda-promo/`), és a hero elkészíthető. Ehhez kell:

## Entry point

The existing gtm surface named in the source contract.

## Default state

Nincs rá igény — ezért Later. A hero-videó feladatát a Now-beli 10–15 mp-es valódi demó látja el, és az jobb is: az bizonyít (pad → ütés/timing visszajelzés → ajánlott következő BPM), ez csak állítana. Egy szkeptikus dobosnál a bizonyíték veri a költészetet — ez a deferral indoka.

## Loading state

Keep the current context visible while work is pending.

## Empty state

Explain why no content exists and provide the next valid action.

## Error state

Show an actionable error without discarding user input.

## Success state

Ha a landingre egyszer kell egy produkált, ~30 mp-es, 16:9 darab a 10–15 mp-es valódi demó mellé, a nyersanyag rendelkezésre áll (`videos/oneanda-promo/`), és a hero elkészíthető. Ehhez kell:

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

Migration preview only. Source: scrum/tickets/O-22-produkalt-hero-trailer.md. No product implementation or human ready approval is implied.
