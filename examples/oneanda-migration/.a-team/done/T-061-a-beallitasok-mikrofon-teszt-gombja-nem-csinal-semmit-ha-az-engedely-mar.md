---
id: T-061
title: >-
  A beállítások „Mikrofon teszt" gombja nem csinál semmit, ha az engedély már
  megvan
status: done
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: null
depends_on:
  - T-060
blocks: []
branch: null
pull_request: null
created_at: Sat Jul 18
updated_at: '2026-07-21'
resolution: completed
---
# T-061 — A beállítások „Mikrofon teszt" gombja nem csinál semmit, ha az engedély már megvan

## Outcome

A beállítások „Mikrofon teszt" sora ténylegesen tesztel valamit: a felhasználó megnyomja, és

## Scope

- A javítás a `_testMic` viselkedése és/vagy a sor célja. A mikrofon-ENGEDÉLY sora (`micAccess`)

## Non-goals

- Maga az audio-labor képernyő megépítése — [O-59](O-59-audio-labor-kepernyo.md).

## Acceptance

1. A „Mikrofon teszt" sor megnyomása megadott engedély mellett is **látható eredményt** ad — a

## Verification

- `cd app && flutter test`; `flutter analyze` az érintett fájlra.

## Constraints

Migrated from O-60; lane: app; legacy status: done.

## Open decisions

- Mi legyen a tényleges tartalma? A kézenfekvő válasz az [O-59](O-59-audio-labor-kepernyo.md)

## Actual behaviour

A dobos (fiú) 2026-07-18-án szóvá tette: „a configban van egy mikrofon teszt gomb, ami most nem

## Expected behaviour

A beállítások „Mikrofon teszt" sora ténylegesen tesztel valamit: a felhasználó megnyomja, és

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · app lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

A dobos (fiú) 2026-07-18-án szóvá tette: „a configban van egy mikrofon teszt gomb, ami most nem

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Review evidence

**LESZÁLLÍTVA**, a `fix/o6-metronom-speaker-override` ágon (`e9f097c`), a 18-as buildtől kint van.

## Execution notes

Migration preview only. Source: scrum/tickets/O-60-mikrofon-teszt-gomb-nem-mukodik.md. No product implementation or human ready approval is implied.
