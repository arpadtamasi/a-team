---
id: T-051
title: A metrics-események `source` mezőjének szemantikája tisztázandó
status: done
origin: imported
types:
  - decision
profiles:
  - discovery
priority: medium
risk: medium
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Sat Jul 18
updated_at: '2026-07-21'
resolution: obsolete
---
# T-051 — A metrics-események `source` mezőjének szemantikája tisztázandó

## Outcome

A `source` mező jelentése egy helyen, egyértelműen definiált (megengedett értékkészlettel vagy explicit szabaddal), és a séma-példák meg a meglévő adatsorok ennek megfelelnek vagy dokumentált kivételek.

## Scope

2026-07-18 adversarial review lelet (PR #61), confidence 6/10; részben a mi-iranytu forrásból örökölt (tokens.md), részben a migráció terméke (todos-migration). Érintett: `.claude/skills/scrum/schemas/events.md`, `.claude/skills/scrum/schemas/tokens.md`, `scrum/metrics/events.jsonl` (meglévő sorok append-only — átírni tilos, legfeljebb a definíció legalizálja őket).

## Non-goals

- A meglévő events.jsonl sorok módosítása (append-only).

## Acceptance

- The outcome is observable: A `source` mező jelentése egy helyen, egyértelműen definiált (megengedett értékkészlettel vagy explicit szabaddal), és a séma-példák meg a meglévő adatsorok ennek megfelelnek vagy dokumentált kivételek.

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-50; lane: cross-cutting; legacy status: rejected.

## Open decisions

- A `source` legyen kötött enum (skill-nevek + `todos-migration` + `tool-reported`), vagy szabad szöveg „a rögzítő folyamat neve" definícióval?

## Decision to be supported

A `source` mező jelentése egy helyen, egyértelműen definiált (megengedett értékkészlettel vagy explicit szabaddal), és a séma-példák meg a meglévő adatsorok ennek megfelelnek vagy dokumentált kivételek.

## Research question

Három inkonzisztens használat él egymás mellett: a `schemas/events.md` prózája szerint a `source` „naming the operation"; a `schemas/tokens.md` példája `"tool-reported"`-öt használ (nem művelet-név); a migrációs 46 esemény `"todos-migration"`-t (szintén nem a 15 skill egyike). A `report-metrics` lefedettség-riportjának sincs definiált vödre a migrációs forrásra.

## Hypotheses

The source contract contains the current evidence and competing explanations.

## Method

Inspect repository evidence, run the smallest representative measurement, and record uncertainty.

## Time or depth limit

Stop when the stated decision can be made with explicit confidence.

## Expected output

A decision-ready evidence note and the smallest follow-up ticket set.

## Decision criterion

The product owner can choose without inventing missing evidence.



## Review evidence

**MIGRÁLVA 2026-07-19T14:11:40+02:00** → **[arpadtamasi/a-team#4](https://github.com/arpadtamasi/a-team/issues/4)**

## Execution notes

Migration preview only. Source: scrum/tickets/O-50-source-mezo-szemantika-dontes.md. No product implementation or human ready approval is implied.
