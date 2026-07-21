---
id: T-074
title: >-
  A nem mérhető blokk ne kapjon nullát — alsó csonkoltság-detektálás a
  pontozásban
status: done
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: P-005
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Sun Jul 19
updated_at: '2026-07-21'
resolution: completed
---
# T-074 — A nem mérhető blokk ne kapjon nullát — alsó csonkoltság-detektálás a pontozásban

## Outcome

Ha egy blokk velocity-eloszlása a detektálási padlón **alulról csonkolt**, a blokk **kimarad a

## Scope

- **Csonkoltság-detektálás** blokkonként a nyers velocity-eloszlásból, a meglévő `clipped`/`clipRatio`

## Non-goals

- A detektor érzékenységének javítása — [O-74](O-74-detektor-halk-utes-erzekenyseg.md).

## Acceptance

1. A kiértékelés blokkonként meghatároz egy **alsó csonkoltság** jelzést a nyers velocity-eloszlásból

## Verification

### Automated

## Constraints

Migrated from O-73; lane: scoring; legacy status: done.

## Open decisions

None.

## Actual behaviour

Az [O-69](O-69-zajpadlo-alatti-halk-utes-hamis-pontszam.md) szülő A rétege. A korpusz szerint

## Expected behaviour

Ha egy blokk velocity-eloszlása a detektálási padlón **alulról csonkolt**, a blokk **kimarad a

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · scoring lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Az [O-69](O-69-zajpadlo-alatti-halk-utes-hamis-pontszam.md) szülő A rétege. A korpusz szerint

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Review evidence

**Lezárva, mergelve.** PR [#74](https://github.com/ezchops/oneanda/pull/74), squash-merge

## Execution notes

Migration preview only. Source: scrum/tickets/O-73-nem-merheto-blokk-ne-kapjon-nullat.md. No product implementation or human ready approval is implied.
