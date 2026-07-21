---
id: T-069
title: >-
  A hiányos adatra kiadott `serverScore` takarítása — a felmérés szerint
  egyetlen take
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
  - T-065
blocks: []
branch: null
pull_request: null
created_at: Sun Jul 19
updated_at: '2026-07-21'
resolution: completed
---
# T-069 — A hiányos adatra kiadott `serverScore` takarítása — a felmérés szerint egyetlen take

## Outcome

A megszakadt felvételre kiadott, hamis `serverScore` nem torzítja tovább a dobos átlagait és a

## Scope

Provizórikus: egyetlen Firestore-dokumentum korrekciója a fenti (a)–(c) döntés szerint, plusz

## Non-goals

- Az előretekintő javítás — az [O-64](O-64-mikrofon-folyam-nema-halala.md) szállította.

## Acceptance

- The outcome is observable: A megszakadt felvételre kiadott, hamis `serverScore` nem torzítja tovább a dobos átlagait és a

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-68; lane: connector; legacy status: done.

## Open decisions

- Melyik korrekció? (a) `partial: true` felírása + `serverScore`/`serverEval`/`scoredAt` törlése —

## Actual behaviour

Az [O-64](O-64-mikrofon-folyam-nema-halala.md) ELŐRE tekintve zárja a rést (a jövőbeli megszakadt

## Expected behaviour

A megszakadt felvételre kiadott, hamis `serverScore` nem torzítja tovább a dobos átlagait és a

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · connector lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Az [O-64](O-64-mikrofon-folyam-nema-halala.md) ELŐRE tekintve zárja a rést (a jövőbeli megszakadt

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Review evidence

**ZÁRVA 2026-07-19T14:06:44+02:00** — a takarítás lefutott.

## Execution notes

Migration preview only. Source: scrum/tickets/O-68-szennyezett-serverscore-takaritas.md. No product implementation or human ready approval is implied.
