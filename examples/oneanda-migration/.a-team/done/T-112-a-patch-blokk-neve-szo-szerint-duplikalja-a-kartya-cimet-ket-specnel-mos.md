---
id: T-112
title: >-
  A patch blokk-neve szó szerint duplikálja a kártya címét — két specnél, most
  már két nyelven
status: done
origin: imported
types:
  - other
profiles: []
priority: medium
risk: medium
package: P-004
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Tue Jul 21
updated_at: '2026-07-21'
resolution: obsolete
---
# T-112 — A patch blokk-neve szó szerint duplikálja a kártya címét — két specnél, most már két nyelven

## Outcome

Ahol a patch blokk-neve szándékosan azonos a kártya címével, ott EGY forrásból jön — nem két

## Scope

Provisional: vagy közös forrás a két érintett specnél, vagy egy teszt, ami a szinkront őrzi. A

## Non-goals

- A `SMALLER_TEMPO_STEPS` és a `PUSH_CEILING` szándékos eltérésének megszüntetése.

## Acceptance

- The outcome is observable: Ahol a patch blokk-neve szándékosan azonos a kártya címével, ott EGY forrásból jön — nem két

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-111; lane: connector; legacy status: rejected.

## Open decisions

- **Melyik a helyes forma?** A review javaslata `name: copy[lang].title` a két érintett specnél.



## Review evidence

**Elvetve — rp döntése (2026-07-21).** A négy literál ma konzisztens és átlátható; a védelem

## Execution notes

Migration preview only. Source: scrum/tickets/O-111-patch-blokknev-duplikalja-a-kartya-cimet.md. No product implementation or human ready approval is implied.
