---
id: T-056
title: A scrum-folyamat vezesse a gitet — minden PM-állapotváltás után commitoljon
status: done
origin: imported
types:
  - feature
profiles: []
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
# T-056 — A scrum-folyamat vezesse a gitet — minden PM-állapotváltás után commitoljon

## Outcome

A scrum control plane a saját állapotváltásait git-commitba zárja: egy board-/ticket-/event-művelet után nem marad uncommitted change a `scrum/` alatti PM-artefaktokban, a commit a végrehajtott műveletet azonosítja, és ez a viselkedés a metódusban rögzített, nem esetről esetre az agent jóindulatán múlik.

## Scope

Provizórikus: a lényegi kimenet a metódus (megosztott commit-szerződés) + minden owner-skill záró commit-lépése + egy safety-net hook, úgy hogy minden PM-állapotváltás után legyen `scrum/`-scoped commit. Több független kimenet (schema-szerződés; skillenkénti lépés; hook-adapter; worktree-helper) — a finomítás dönthet dekompozícióról (pl. külön ticket a hook-adapternek).

## Non-goals

- A kód-változások (nem-`scrum/` fájlok) commit-/branch-/PR-kezelése — az a `ticket-cycle` és a `/ship` dolga; ez a ticket a PM-artefaktok git-vezetéséről szól.

## Acceptance

- The outcome is observable: A scrum control plane a saját állapotváltásait git-commitba zárja: egy board-/ticket-/event-művelet után nem marad uncommitted change a `scrum/` alatti PM-artefaktokban, a commit a végrehajtott műveletet azonosítja, és ez a viselkedés a metódusban rögzített, nem esetről esetre az agent jóindulatán múlik.

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-55; lane: cross-cutting; legacy status: rejected.

## Open decisions

Az eredeti hét nyitott kérdés eldöntve (felhasználói döntés, 2026-07-18) — ld. `Refinement notes → Eldöntött tervezési döntések`. A refinement-be maradó, még nyitott pont:



## Review evidence

**MIGRÁLVA 2026-07-19T14:11:40+02:00** → **[arpadtamasi/a-team#5](https://github.com/arpadtamasi/a-team/issues/5)**

## Execution notes

Migration preview only. Source: scrum/tickets/O-55-scrum-git-commit-minden-atmenetnel.md. No product implementation or human ready approval is implied.
