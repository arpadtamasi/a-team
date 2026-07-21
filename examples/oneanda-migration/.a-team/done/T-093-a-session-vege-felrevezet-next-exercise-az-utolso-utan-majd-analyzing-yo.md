---
id: T-093
title: >-
  A session vége félrevezet — „Next exercise" az utolsó után, majd „Analyzing
  your take" a napi összegzésre
status: done
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
created_at: Mon Jul 20
updated_at: '2026-07-21'
resolution: completed
---
# T-093 — A session vége félrevezet — „Next exercise" az utolsó után, majd „Analyzing your take" a napi összegzésre

## Outcome

Az utolsó gyakorlat után a dobos azt látja, ami történik: a gomb a befejezésre hív (nem újabb

## Scope

- `ma_screen.dart`: a blokk megnyitása előtt már ismert, van-e utána teendő (`_nextUndone`);

## Non-goals

- A summary-kérés megbízhatósága, a „failed → retry" → [O-93](O-93-summary-varakozas-lejar-200-ellenere.md).

## Acceptance

1. Az utolsó **be nem fejezett** blokk Result képernyőjén a gomb felirata NEM „Next exercise",

## Verification

### Automated

## Constraints

Migrated from O-92; lane: app; legacy status: done.

## Open decisions

None.

## Actual behaviour

rp jelentette a 27-es TestFlight-buildből (2026-07-20), egy teljes sessiont végigjátszva:

## Expected behaviour

Az utolsó gyakorlat után a dobos azt látja, ami történik: a gomb a befejezésre hív (nem újabb

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · app lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

rp jelentette a 27-es TestFlight-buildből (2026-07-20), egy teljes sessiont végigjátszva:

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Review evidence

**Review-jelölt** (2026-07-20, branch `fix/o92-session-end-copy`, commitok `fb151db2` + `ea3d4526`):

## Execution notes

Migration preview only. Source: scrum/tickets/O-92-session-vege-felrevezeto-folyamat.md. No product implementation or human ready approval is implied.
