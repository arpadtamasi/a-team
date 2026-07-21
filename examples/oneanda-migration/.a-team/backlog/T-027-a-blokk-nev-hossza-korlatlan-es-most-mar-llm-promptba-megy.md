---
id: T-027
title: A blokk-név hossza korlátlan — és most már LLM-promptba megy
status: backlog
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
created_at: Fri Jul 17
updated_at: '2026-07-21'
---
# T-027 — A blokk-név hossza korlátlan — és most már LLM-promptba megy

## Outcome

A blokk-név hossza kötött. Ma a `firestore.rules` `takes` create-szabálya engedi a `block` kulcsot, de — a `feedback.text`-tel ellentétben (`is string` && `size() <= 2000`) — se típust, se hosszat nem köt. A 2026-07-17-i §2.2a óta ez a mező a `BLOCKS=` promptba és a coach digestjébe is befolyik, tehát egy hitelesített kliens megabájtos blokk-nevet írhat, amit minden `/session/summary` elküld az LLM-nek. A prompt „bounded” ígérete a BLOCKS-ra ma nincs kikényszerítve.

## Scope

2026-07-17 `/ship` security-specialista (6/10) a `feat/summary-per-block-signals` ágon. Hatókörön kívül: a mező pre-existing, csak az ÚTJA új. Az injection-oldal (a BLOCKS untrusted-jelölése) ezen az ágon javítva.

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-27; lane: connector; legacy status: backlog.

## Open decisions

None.

## Actual behaviour

Költség-amplifikáció egy free-tier béta-úton. Nem jogosultsági rés — a saját take-jét írja —, de a saját számlánk.

## Expected behaviour

A blokk-név hossza kötött. Ma a `firestore.rules` `takes` create-szabálya engedi a `block` kulcsot, de — a `feedback.text`-tel ellentétben (`is string` && `size() <= 2000`) — se típust, se hosszat nem köt. A 2026-07-17-i §2.2a óta ez a mező a `BLOCKS=` promptba és a coach digestjébe is befolyik, tehát egy hitelesített kliens megabájtos blokk-nevet írhat, amit minden `/session/summary` elküld az LLM-nek. A prompt „bounded” ígérete a BLOCKS-ra ma nincs kikényszerítve.

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · connector lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Költség-amplifikáció egy free-tier béta-úton. Nem jogosultsági rés — a saját take-jét írja —, de a saját számlánk.

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-27-blokk-nev-hossz-korlatlan.md. No product implementation or human ready approval is implied.
