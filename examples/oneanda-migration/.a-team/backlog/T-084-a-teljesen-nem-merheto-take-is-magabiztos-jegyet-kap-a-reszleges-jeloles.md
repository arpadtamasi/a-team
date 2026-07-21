---
id: T-084
title: >-
  A teljesen nem mérhető take is magabiztos jegyet kap — a „részleges" jelölés
  itt alulmond
status: backlog
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: P-005
depends_on:
  - T-074
blocks: []
branch: null
pull_request: null
created_at: Mon Jul 20
updated_at: '2026-07-21'
---
# T-084 — A teljesen nem mérhető take is magabiztos jegyet kap — a „részleges" jelölés itt alulmond

## Outcome

Ha egy take **minden** blokkja alulról csonkolt, a dobos nem magabiztos rossz jegyet kap egy

## Scope

Provizórikus: `apps/mcp/src/getTake.ts`, `apps/mcp/src/score.ts` (a `null` overall ág),

## Non-goals

- A blokkonkénti kizárás — az [O-73](O-73-nem-merheto-blokk-ne-kapjon-nullat.md) leszállította.

## Acceptance

- The outcome is observable: Ha egy take **minden** blokkja alulról csonkolt, a dobos nem magabiztos rossz jegyet kap egy

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-83; lane: scoring; legacy status: backlog.

## Open decisions

- **Termékdöntés (rp):** a teljesen nem mérhető take kapjon-e egyáltalán pontszámot? A `partial`

## Actual behaviour

Az [O-73](O-73-nem-merheto-blokk-ne-kapjon-nullat.md) a csonkolt blokkokat kizárja a take

## Expected behaviour

Ha egy take **minden** blokkja alulról csonkolt, a dobos nem magabiztos rossz jegyet kap egy

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · scoring lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Az [O-73](O-73-nem-merheto-blokk-ne-kapjon-nullat.md) a csonkolt blokkokat kizárja a take

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-83-teljesen-nem-merheto-take.md. No product implementation or human ready approval is implied.
