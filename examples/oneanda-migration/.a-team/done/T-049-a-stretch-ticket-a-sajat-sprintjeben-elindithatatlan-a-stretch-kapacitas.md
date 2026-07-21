---
id: T-049
title: >-
  A stretch ticket a saját sprintjében elindíthatatlan — a stretch-kapacitásnak
  nincs legális útja
status: done
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Sat Jul 18
updated_at: '2026-07-21'
resolution: obsolete
---
# T-049 — A stretch ticket a saját sprintjében elindíthatatlan — a stretch-kapacitásnak nincs legális útja

## Outcome

Ha a commitolt munka a sprint vége előtt elkészül, a sprintben megnevezett stretch ticket legális úton elindítható (vagy a metódus kimondja, hogy a stretch fogalma törlendő).

## Scope

2026-07-18 adversarial review lelet (PR #61), confidence 8/10; a mi-iranytu forrás-metódusban is fennáll. Érintett: `.claude/skills/scrum/METHOD.md` (Committed/Stretch definíció), `.claude/skills/scrum/skills/start-ticket/SKILL.md`, `.claude/skills/scrum/skills/plan-sprint/SKILL.md`. A korábbi másodlagos akadályt — az egynapos sprint-ID/archív-útvonal ütközést — a sprint-generalizáció (0.32.x metódus-változás) oldja; az előléptetési út hiánya attól még fennáll.

## Non-goals

None explicitly identified.

## Acceptance

- The outcome is observable: Ha a commitolt munka a sprint vége előtt elkészül, a sprintben megnevezett stretch ticket legális úton elindítható (vagy a metódus kimondja, hogy a stretch fogalma törlendő).

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-48; lane: cross-cutting; legacy status: rejected.

## Open decisions

- Melyik a kívánt mechanizmus: (a) `plan-sprint` kapjon explicit „stretch-előléptetés aktív sprintben, PO-jóváhagyással" ágat, (b) a `start-ticket` fogadjon stretch ticketet, ha minden commitolt kész, vagy (c) a stretch fogalom törlése?

## Actual behaviour

A `start-ticket` csak a commitolt szekcióban szereplő ticketet fogad („not merely stretch work"), a stretch→committed előléptetéshez pedig `plan-sprint` kellene, ami csak aktív sprint nélkül fut. Így a stretch — a metódus saját definíciója szerint „optional capacity" — a gyakorlatban sosem használható fel abban a sprintben, amelyikhez felvették.

## Expected behaviour

Ha a commitolt munka a sprint vége előtt elkészül, a sprintben megnevezett stretch ticket legális úton elindítható (vagy a metódus kimondja, hogy a stretch fogalma törlendő).

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · cross-cutting lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

A `start-ticket` csak a commitolt szekcióban szereplő ticketet fogad („not merely stretch work"), a stretch→committed előléptetéshez pedig `plan-sprint` kellene, ami csak aktív sprint nélkül fut. Így a stretch — a metódus saját definíciója szerint „optional capacity" — a gyakorlatban sosem használható fel abban a sprintben, amelyikhez felvették.

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Review evidence

**MIGRÁLVA 2026-07-19T14:11:40+02:00** → **[arpadtamasi/a-team#2](https://github.com/arpadtamasi/a-team/issues/2)**

## Execution notes

Migration preview only. Source: scrum/tickets/O-48-stretch-ticket-elindithatatlan.md. No product implementation or human ready approval is implied.
