---
id: T-081
title: A preflight hangerő-blokkja felduzzasztotta az alsó sávot — designt kíván
status: done
origin: imported
types:
  - feature
profiles:
  - ui
priority: medium
risk: medium
package: null
depends_on:
  - T-064
blocks: []
branch: null
pull_request: null
created_at: Sun Jul 19
updated_at: '2026-07-21'
resolution: completed
---
# T-081 — A preflight hangerő-blokkja felduzzasztotta az alsó sávot — designt kíván

## Outcome

A Készenlét képernyő alsó sávja a design 15-ös turnje szerint **pontosan három szoros sor**

## Scope

Csak a nézet-réteg: [ready_preflight.dart](../../app/lib/screens/ready_preflight.dart) átírása a

## Non-goals

- A MAX/boost **működése** és a `setVolume` — az [O-63](O-63-hangero-figyelmeztetes-vegrehajthatatlan.md)

## Acceptance

1. Halk metronóm állapotban a `PreflightSummary` **pontosan két sort** rajzol (státusz-egysoros +

## Verification

### Automated

## Constraints

Migrated from O-80; lane: app; legacy status: done.

## Open decisions

None.

## User goal

A Készenlét képernyő alsó sávja a design 15-ös turnje szerint **pontosan három szoros sor**

## Entry point

The existing app surface named in the source contract.

## Default state

Az [O-63](O-63-hangero-figyelmeztetes-vegrehajthatatlan.md) **működik** — a mechanizmus jó —, de a

## Loading state

Keep the current context visible while work is pending.

## Empty state

Explain why no content exists and provide the next valid action.

## Error state

Show an actionable error without discarding user input.

## Success state

A Készenlét képernyő alsó sávja a design 15-ös turnje szerint **pontosan három szoros sor**

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

**Review-jelölt** (2026-07-20, branch `feat/o80-preflight-bottom-bar`, commitok `37b156ee` + `992779b5`):

## Execution notes

Migration preview only. Source: scrum/tickets/O-80-preflight-hangero-blokk-design.md. No product implementation or human ready approval is implied.
