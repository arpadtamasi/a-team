---
id: T-018
title: 'A `rightSd`/`leftSd` mérve van, de senki nem olvassa'
status: backlog
origin: imported
types:
  - research
profiles:
  - discovery
priority: medium
risk: medium
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Fri Jul 17
updated_at: '2026-07-21'
---
# T-018 — A `rightSd`/`leftSd` mérve van, de senki nem olvassa

## Outcome

A `TakeCard.dynamics.rightSd`/`leftSd` (szinten belüli egyenletesség), ami minden take-en kiszámolódik ([analytics.ts:91](../../apps/mcp/src/analytics.ts#L91)), vagy beleszól a `classify()` diagnózisába, vagy dokumentáltan lezárjuk, hogy nem hordoz jelet — ma egyik sem történik meg, semmilyen doboshoz jutó üzenetbe nem folyik bele.

## Scope

2026-07-16, a `feat/concrete-take-feedback` review-találata. Mérve: `rSd` medián 0,260, `lSd` 0,257, `|rSd−lSd|` medián 0,014 — vagyis a két kéz szórása szinte azonos, a jel diszkriminatív ereje még nem bizonyított; ezért mérés kell, nem vak bekötés.

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-18; lane: scoring; legacy status: backlog.

## Open decisions

None.

## Decision to be supported

A `TakeCard.dynamics.rightSd`/`leftSd` (szinten belüli egyenletesség), ami minden take-en kiszámolódik ([analytics.ts:91](../../apps/mcp/src/analytics.ts#L91)), vagy beleszól a `classify()` diagnózisába, vagy dokumentáltan lezárjuk, hogy nem hordoz jelet — ma egyik sem történik meg, semmilyen doboshoz jutó üzenetbe nem folyik bele.

## Research question

A coach 2026-07-04-én ezt kérte („szinten belüli egyenletesség + szintek szeparációja"), és a `coach_feedback`-en azt a választ kapta, hogy a finomabb metrikái „jó következő lépés, még nincs bent". Azóta sincs. A jel mérve van és a padlóra esik.

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



## Execution notes

Migration preview only. Source: scrum/tickets/O-18-rightsd-leftsd-nem-hasznalt.md. No product implementation or human ready approval is implied.
