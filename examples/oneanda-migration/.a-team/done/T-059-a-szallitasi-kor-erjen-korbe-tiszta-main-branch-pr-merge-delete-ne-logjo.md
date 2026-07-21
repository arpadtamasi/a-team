---
id: T-059
title: >-
  A szállítási kör érjen körbe — tiszta main → branch → PR → merge → delete, ne
  lógjon branch
status: done
origin: imported
types:
  - operations
profiles:
  - workflow
priority: medium
risk: medium
package: null
depends_on:
  - T-056
blocks: []
branch: null
pull_request: null
created_at: Sat Jul 18
updated_at: '2026-07-21'
resolution: obsolete
---
# T-059 — A szállítási kör érjen körbe — tiszta main → branch → PR → merge → delete, ne lógjon branch

## Outcome

Egy ticket szállítási köre garantáltan körbeér: mindig tiszta, friss `main`-ről indul, létrehozza a feature-branchet, elvégzi a melót, PR-t nyit, mergel, majd **törli a branchet** (lokálisan és a remote-on), és tiszta `main`-re tér vissza. Egy lezárt ticket után nem marad lógó (már mergelt) branch.

## Scope

Provizórikus: a fő kimenet a `ticket-cycle` (és szükség szerint a `/ship`) záró lépésének kiegészítése úgy, hogy a branch életciklusa körbeérjen (tiszta-main-start guard + merge utáni branch-törlés + visszatérés main-re). A meglévő 18 mergelt branch egyszeri takarítása lehet e ticket része vagy külön operations-ticket — a finomítás dönti el. Több független kimenet lehet (folyamat-szabály; egyszeri housekeeping; remote-topológia rendezése), dekompozíció mérlegelendő.

## Non-goals

- Nem-mergelt branchek force-törlése (adatvesztés-kockázat) — csak a `--merged main` halmaz jön szóba.

## Acceptance

- The outcome is observable: Egy ticket szállítási köre garantáltan körbeér: mindig tiszta, friss `main`-ről indul, létrehozza a feature-branchet, elvégzi a melót, PR-t nyit, mergel, majd **törli a branchet** (lokálisan és a remote-on), és tiszta `main`-re tér vissza. Egy lezárt ticket után nem marad lógó (már mergelt) branch.

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-58; lane: cross-cutting; legacy status: rejected.

## Open decisions

- **Tiszta-main-start kikényszerítése:** a ciklus elején kötelező-e `git switch main && git pull` és a piszkos working tree elleni guard (elutasítás/stash), mielőtt feature-branch nyílik? Mi történjön, ha a main nem tiszta (pl. a futó O-55 PM-commitok miatt)?

## Actors

Player, coach, operator, and the responsible delivery agent where applicable.

## Initial state

Felhasználói észrevétel, 2026-07-18: „a scrum folyamat hajlamos nyitva tartani brancheket". A repository élő állapota ezt igazolja: **18 lokális branch már main-be van mergelve, mégis törlés nélkül lóg** (`git branch --merged main`), a ~25 lokálisból; a capture pillanatában a working dir is egy feature-branchen (`fix/storage-rules-cap`) áll, nem main-en. A lógó branchek elfedik, mi van tényleg folyamatban, kockáztatják, hogy egy új meló nem friss main-ről indul (rejtett drift, véletlen újra-mergelés), és két remote (`origin`, `dobolj`) között sokszorozódik a stale-branch zaj. A `ticket-cycle` skill neve szerint „board → merged main"-t ígér, de a záró branch-takarítás és a tiszta-main-start nincs kikényszerítve.

## States

Use only the states already present in the product and this ticket contract.

## Transitions

Egy ticket szállítási köre garantáltan körbeér: mindig tiszta, friss `main`-ről indul, létrehozza a feature-branchet, elvégzi a melót, PR-t nyit, mergel, majd **törli a branchet** (lokálisan és a remote-on), és tiszta `main`-re tér vissza. Egy lezárt ticket után nem marad lógó (már mergelt) branch.

## Triggers

The user or operational action described by the source contract.

## Permissions

Preserve existing authorization and privacy boundaries.

## Error paths

Failures remain visible and retryable without silent partial completion.

## Cancellation path

Cancellation leaves canonical repository and product state valid.

## Retry and duplicate-action behaviour

Retries are idempotent or explicitly rejected.

## Audit and notification expectations

Record material state changes; notify only the actor who can respond.



## Review evidence

**MIGRÁLVA 2026-07-19T14:11:40+02:00** → **[arpadtamasi/a-team#6](https://github.com/arpadtamasi/a-team/issues/6)**

## Execution notes

Migration preview only. Source: scrum/tickets/O-58-branch-eletciklus-erjen-korbe.md. No product implementation or human ready approval is implied.
