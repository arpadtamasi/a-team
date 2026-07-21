---
id: T-011
title: A Bebas Neue és a DM Sans még futásidőben töltődik — az ELSŐ képernyő hőse is
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
# T-011 — A Bebas Neue és a DM Sans még futásidőben töltődik — az ELSŐ képernyő hőse is

## Outcome

A `theme.dart`-ban ([app/lib/theme.dart](../../app/lib/theme.dart)) használt két maradék `google_fonts`-család — `O.display` (Bebas Neue, wordmark és nagy számok, 15 fájl) és `O.tabular` (DM Sans, tempó/ms tabuláris számok, 4 fájl) — a bundle-ből renderel, nem a `fonts.gstatic.com`-ról futásidőben.

## Scope

2026-07-17 `feat/work-sans-bundled` review-találata. A Work Sans-task hatókörén kívül volt (az kifejezetten a body+UI fontról szólt), és az `allowRuntimeFetching = false` bekötése is ezen múlik — ezért külön item, nem a Work Sans-ágba tolva.

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-11; lane: app; legacy status: backlog.

## Open decisions

None.

## User goal

A `theme.dart`-ban ([app/lib/theme.dart](../../app/lib/theme.dart)) használt két maradék `google_fonts`-család — `O.display` (Bebas Neue, wordmark és nagy számok, 15 fájl) és `O.tabular` (DM Sans, tempó/ms tabuláris számok, 4 fájl) — a bundle-ből renderel, nem a `fonts.gstatic.com`-ról futásidőben.

## Entry point

The existing app surface named in the source contract.

## Default state

A Work Sans-task Why-ja („rossz első benyomás") emiatt csak félig zárult le. A [sign_in_screen.dart:26-28](../../app/lib/screens/sign_in_screen.dart#L26-L28) — a legelső képernyő — a nagy `1&A` lockupot `O.display(72)`-vel, tehát Bebas Neue-val rajzolja: repülőgép-módú első indításkor pont a képernyő legnagyobb eleme esik system-fontra, miközben a törzsszöveg már helyes. A tempó-számok (DM Sans) ugyanígy a Practice nézetben.

## Loading state

Keep the current context visible while work is pending.

## Empty state

Explain why no content exists and provide the next valid action.

## Error state

Show an actionable error without discarding user input.

## Success state

A `theme.dart`-ban ([app/lib/theme.dart](../../app/lib/theme.dart)) használt két maradék `google_fonts`-család — `O.display` (Bebas Neue, wordmark és nagy számok, 15 fájl) és `O.tabular` (DM Sans, tempó/ms tabuláris számok, 4 fájl) — a bundle-ből renderel, nem a `fonts.gstatic.com`-ról futásidőben.

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

Migration preview only. Source: scrum/tickets/O-11-bebas-neue-dm-sans-futasido.md. No product implementation or human ready approval is implied.
