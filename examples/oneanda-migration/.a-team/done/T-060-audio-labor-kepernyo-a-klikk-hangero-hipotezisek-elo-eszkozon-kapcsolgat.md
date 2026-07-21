---
id: T-060
title: >-
  Audio-labor képernyő — a klikk-hangerő hipotézisek élő, eszközön
  kapcsolgatható kipróbálása
status: done
origin: imported
types:
  - feature
profiles:
  - ui
priority: high
risk: medium
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Sat Jul 18
updated_at: '2026-07-21'
resolution: completed
---
# T-060 — Audio-labor képernyő — a klikk-hangerő hipotézisek élő, eszközön kapcsolgatható kipróbálása

## Outcome

Egy képernyő az appban, ahol a metronóm-klikk és a felvétel EGYÜTT, valós eszközön elindítható,

## Scope

A képernyő tartalma nagy vonalakban (a pontos lista refinement-kérdés):

## Non-goals

- Take-mentés, pontozás, feltöltés, history — a labor nem termel adatot a gyakorlás-történetbe.

## Acceptance

1. A képernyő elérhető a béta-tesztelőnek (nem `kDebugMode`-hoz kötött), a beállítások „Mikrofon

## Verification

- `cd app && flutter test` — a meglévő app-tesztek zöldek maradnak (210 a szállításkor).

## Constraints

Migrated from O-59; lane: app; legacy status: done.

## Open decisions

None.

## User goal

Egy képernyő az appban, ahol a metronóm-klikk és a felvétel EGYÜTT, valós eszközön elindítható,

## Entry point

The existing app surface named in the source contract.

## Default state

Az [O-6](O-6-metronom-halk-iphone.md) megmutatta a jelenlegi hurok költségét: egy hipotézis

## Loading state

Keep the current context visible while work is pending.

## Empty state

Explain why no content exists and provide the next valid action.

## Error state

Show an actionable error without discarding user input.

## Success state

Egy képernyő az appban, ahol a metronóm-klikk és a felvétel EGYÜTT, valós eszközön elindítható,

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

**LESZÁLLÍTVA a `fix/o6-metronom-speaker-override` ágon, négy TestFlight-buildben (18, 19, 20, 21).**

## Execution notes

Migration preview only. Source: scrum/tickets/O-59-audio-labor-kepernyo.md. No product implementation or human ready approval is implied.
