---
id: T-094
title: >-
  A napi összegzés hibát mutat, pedig a szerver 200-at adott — a 20 s-os
  várakozás lejár
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
# T-094 — A napi összegzés hibát mutat, pedig a szerver 200-at adott — a 20 s-os várakozás lejár

## Outcome

A napi összegzés nem mutat hibát olyankor, amikor a szerver sikeresen válaszolt — a dobosnak nem

## Scope

- `summary_screen.dart`: a `200` utáni várakozás ne hibába forduljon. A türelmi idő lejárta

## Non-goals

- A connector gyorsítása vagy az LLM-hívás optimalizálása — ez a ticket a KIJELZÉST javítja.

## Acceptance

1. A `SummaryApiSuccess` (`200`) után a 20 másodperces türelmi idő lejárta **nem** hibaképernyőt

## Verification

### Automated

## Constraints

Migrated from O-93; lane: app; legacy status: done.

## Open decisions

None.

## Actual behaviour

rp jelentette a 27-es TestFlight-buildből (2026-07-20): a session végén „failed", majd „retry",

## Expected behaviour

A napi összegzés nem mutat hibát olyankor, amikor a szerver sikeresen válaszolt — a dobosnak nem

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · app lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

rp jelentette a 27-es TestFlight-buildből (2026-07-20): a session végén „failed", majd „retry",

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Review evidence

**Review-jelölt** (2026-07-20, branch `fix/o93-summary-grace-hardcap`, commitok `44adad80` +

## Execution notes

Migration preview only. Source: scrum/tickets/O-93-summary-varakozas-lejar-200-ellenere.md. No product implementation or human ready approval is implied.
