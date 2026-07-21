---
id: T-063
title: >-
  Az előnézet és a felvétel MÁS metronómot szólaltat — a sticking-klikk nem jut
  el a take-be
status: done
origin: imported
types:
  - bug
profiles:
  - bug
priority: high
risk: high
package: null
depends_on:
  - T-005
blocks: []
branch: null
pull_request: null
created_at: Sat Jul 18
updated_at: '2026-07-21'
resolution: completed
---
# T-063 — Az előnézet és a felvétel MÁS metronómot szólaltat — a sticking-klikk nem jut el a take-be

## Outcome

A dobos ugyanazt a metronómot hallja a felvétel alatt, mint az előnézetben — vagy ha a kettő

## Scope

Tiszta törlés — a sticking-klikknek **egyetlen hívója van**:

## Non-goals

- A klikk HANGEREJE és a szint-hierarchia lapítása — az [O-6](O-6-metronom-halk-iphone.md)

## Acceptance

1. Az előnézet és a felvétel **azonos klikk-hangot** szólaltat ugyanarra a gyakorlatra.

## Verification

### Automated

## Constraints

Migrated from O-62; lane: app; legacy status: done.

## Open decisions

- **Szándékos-e az eltérés?** Elképzelhető, hogy a felvétel alatt direkt sima pulzus szól, mert a

## Actual behaviour

Az előnézet azt ígéri, hogy **hallod a kezed** (~~R = magas, L = mély~~ — **ez az állítás téves volt,

## Expected behaviour

A dobos ugyanazt a metronómot hallja a felvétel alatt, mint az előnézetben — vagy ha a kettő

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · app lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Az előnézet azt ígéri, hogy **hallod a kezed** (~~R = magas, L = mély~~ — **ez az állítás téves volt,

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Review evidence

**Az előnézet és a felvétel ugyanazt a metronómot szólaltatja.** A `stickings` paraméter és a

## Execution notes

Migration preview only. Source: scrum/tickets/O-62-preview-take-klikk-elter.md. No product implementation or human ready approval is implied.
