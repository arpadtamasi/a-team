---
id: T-048
title: >-
  Megszakadt sprint-zárás repairje — a reconcile-history nem tudja, amit
  ráterhelnek
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
# T-048 — Megszakadt sprint-zárás repairje — a reconcile-history nem tudja, amit ráterhelnek

## Outcome

Egy félbeszakadt sprint-zárás (archív megíródott, de az aktív sprint-fájl megmaradt — vagy fordítva) helyreállításának van tulajdonos művelete, és a metódus-fájlok arra a műveletre mutatnak, amelyik a javítást ténylegesen el tudja végezni.

## Scope

2026-07-18 adversarial review lelet (a scrum-migrációs PR #61 kapcsán), confidence 8/10. A hiba a mi-iranytu forrás-metódusban is jelen van — a javítást érdemes oda is visszacsatolni. Érintett: `.claude/skills/scrum/schemas/sprint.md` (részleges reprezentáció szabálya), `.claude/skills/scrum/skills/close-sprint/SKILL.md`, `.claude/skills/scrum/skills/reconcile-history/SKILL.md` (Leave unchanged lista).

## Non-goals

None explicitly identified.

## Acceptance

- The outcome is observable: Egy félbeszakadt sprint-zárás (archív megíródott, de az aktív sprint-fájl megmaradt — vagy fordítva) helyreállításának van tulajdonos művelete, és a metódus-fájlok arra a műveletre mutatnak, amelyik a javítást ténylegesen el tudja végezni.

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-47; lane: cross-cutting; legacy status: rejected.

## Open decisions

- A `reconcile-history` hatásköre bővüljön (materialized_repairs már ismer artifact-javítást — kiterjeszthető-e sprint-fájlokra), vagy a `close-sprint` kapjon idempotens „befejezem a félbemaradt zárást" ágat?

## Actual behaviour

A `schemas/sprint.md` és a `close-sprint` skill a részleges zárás-reprezentációt a `reconcile-history`-hoz irányítja („stop for reconcile-history"), a `reconcile-history` saját szerződése viszont csak `events.jsonl`-sorok append-only javítását engedi, és expliciten kimondja, hogy az aktív sprint-fájlt és a sprint-archívumokat érintetlenül hagyja. A szó szerint követő agent egy olyan skillhez jut, amelyik megtagadja a ráküldött munkát; közben `plan-sprint` nem indít új sprintet kétértelmű állapot fölött — a rendszer beragad.

## Expected behaviour

Egy félbeszakadt sprint-zárás (archív megíródott, de az aktív sprint-fájl megmaradt — vagy fordítva) helyreállításának van tulajdonos művelete, és a metódus-fájlok arra a műveletre mutatnak, amelyik a javítást ténylegesen el tudja végezni.

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · cross-cutting lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

A `schemas/sprint.md` és a `close-sprint` skill a részleges zárás-reprezentációt a `reconcile-history`-hoz irányítja („stop for reconcile-history"), a `reconcile-history` saját szerződése viszont csak `events.jsonl`-sorok append-only javítását engedi, és expliciten kimondja, hogy az aktív sprint-fájlt és a sprint-archívumokat érintetlenül hagyja. A szó szerint követő agent egy olyan skillhez jut, amelyik megtagadja a ráküldött munkát; közben `plan-sprint` nem indít új sprintet kétértelmű állapot fölött — a rendszer beragad.

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Review evidence

**MIGRÁLVA 2026-07-19T14:11:40+02:00** → **[arpadtamasi/a-team#1](https://github.com/arpadtamasi/a-team/issues/1)**

## Execution notes

Migration preview only. Source: scrum/tickets/O-47-sprint-zaras-repair-dead-end.md. No product implementation or human ready approval is implied.
