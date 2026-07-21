---
id: T-085
title: >-
  A coldStartLoss/steadyLoss a nem hallott ütéseket is teljes veszteségnek
  számolja
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
# T-085 — A coldStartLoss/steadyLoss a nem hallott ütéseket is teljes veszteségnek számolja

## Outcome

A take-kártya `coldStartLoss`/`steadyLoss` jelzése a MEGHALLOTT ütések időzítését méri, nem a

## Scope

Provizórikus: `apps/mcp/src/analytics.ts` (`takeCard`, `hitRows` fogyasztói),

## Non-goals

- A take timing-átlaga — az [O-73](O-73-nem-merheto-blokk-ne-kapjon-nullat.md) leszállította.

## Acceptance

- The outcome is observable: A take-kártya `coldStartLoss`/`steadyLoss` jelzése a MEGHALLOTT ütések időzítését méri, nem a

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-84; lane: scoring; legacy status: backlog.

## Open decisions

- A javítás iránya: a `multiBar` szűrése `matched`-re, VAGY a csonkolt blokkok kihagyása a

## Actual behaviour

A `takeCard` a cold-start és steady veszteséget MINDEN elvárt ütés sorából számolja, a nem

## Expected behaviour

A take-kártya `coldStartLoss`/`steadyLoss` jelzése a MEGHALLOTT ütések időzítését méri, nem a

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · scoring lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

A `takeCard` a cold-start és steady veszteséget MINDEN elvárt ütés sorából számolja, a nem

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-84-coldstart-loss-fantom-kihagyasokbol.md. No product implementation or human ready approval is implied.
