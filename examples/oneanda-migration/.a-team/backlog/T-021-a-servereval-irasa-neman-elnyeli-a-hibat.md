---
id: T-021
title: A `serverEval` írása némán elnyeli a hibát
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
# T-021 — A `serverEval` írása némán elnyeli a hibát

## Outcome

A `handleScore` `serverEval`-írása ([score.ts:72](../../apps/mcp/src/score.ts#L72)) nem nyeli el némán a hibát — ma a `ref.set(...).catch(() => {})`-tel ír: ha a write elhasal, a pontozás akkor is 200-at ad vissza, a take-en nem lesz `serverEval`, és semmi nyoma nem marad.

## Scope

2026-07-16, a `feat/concrete-take-feedback` review-találata; pre-existing, nem ez a branch okozta.

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-21; lane: connector; legacy status: backlog.

## Open decisions

None.

## Actual behaviour

Pontosan ez a minta rejtett el 2026-07-04-én napokra egy `PERMISSION_DENIED`-et (a `firestore.rules` `hasOnly()`-listájából hiányzó `device` kulcs), amit a pad némán elnyelt. A fejlesztő akkor maga jelezte a szálban, hogy „az üres catchError-t érdemes lenne logolásra/felszínre hozni" — nem történt meg. Ma ez a baseline-t is érinti: egy néma write-hiba a következő take diagnózisát rontja el.

## Expected behaviour

A `handleScore` `serverEval`-írása ([score.ts:72](../../apps/mcp/src/score.ts#L72)) nem nyeli el némán a hibát — ma a `ref.set(...).catch(() => {})`-tel ír: ha a write elhasal, a pontozás akkor is 200-at ad vissza, a take-en nem lesz `serverEval`, és semmi nyoma nem marad.

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · connector lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Pontosan ez a minta rejtett el 2026-07-04-én napokra egy `PERMISSION_DENIED`-et (a `firestore.rules` `hasOnly()`-listájából hiányzó `device` kulcs), amit a pad némán elnyelt. A fejlesztő akkor maga jelezte a szálban, hogy „az üres catchError-t érdemes lenne logolásra/felszínre hozni" — nem történt meg. Ma ez a baseline-t is érinti: egy néma write-hiba a következő take diagnózisát rontja el.

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-21-servereval-hiba-elnyeles.md. No product implementation or human ready approval is implied.
