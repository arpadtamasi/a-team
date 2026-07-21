---
id: T-058
title: >-
  A bpm-nek nincs alsó határa — bpm ≤ 0 Infinity/negatív klikk-sávot ad és
  megkerüli a take-hosszkorlátot
status: backlog
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: null
depends_on:
  - T-020
blocks: []
branch: null
pull_request: null
created_at: Sat Jul 18
updated_at: '2026-07-21'
---
# T-058 — A bpm-nek nincs alsó határa — bpm ≤ 0 Infinity/negatív klikk-sávot ad és megkerüli a take-hosszkorlátot

## Outcome

A `plan_session`/`patch_session` gyakorlat-sémája a `bpm`-re pozitív (és ésszerű felső határú)

## Scope

Provisional: `bpm` alsó (és opcionálisan felső) korlát a `EXERCISE_OBJECT`-en, a hibaszöveg a

## Non-goals

Az app-oldali védelmi kód (a pad ne omoljon Infinity bar-hosszon) — ha kell, külön app-ticket.

## Acceptance

- The outcome is observable: A `plan_session`/`patch_session` gyakorlat-sémája a `bpm`-re pozitív (és ésszerű felső határú)

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-57; lane: connector; legacy status: backlog.

## Open decisions

- Mi az ésszerű bpm-tartomány (alsó és felső)? Egy dob-gyakorlópadon pl. ~20–400 bpm reális; a

## Actual behaviour

A séma ma `bpm: z.number()` — nincs alsó korlát

## Expected behaviour

A `plan_session`/`patch_session` gyakorlat-sémája a `bpm`-re pozitív (és ésszerű felső határú)

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · connector lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

A séma ma `bpm: z.number()` — nincs alsó korlát

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-57-bpm-also-hatar-validacio.md. No product implementation or human ready approval is implied.
