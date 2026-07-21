---
id: T-109
title: >-
  A dinamika zajosabb, mint az időzítés — a trend zaj-kapuja dimenziónkénti
  küszöböt kívánhat
status: backlog
origin: imported
types:
  - research
profiles:
  - discovery
priority: medium
risk: medium
package: P-002
depends_on:
  - T-076
blocks: []
branch: null
pull_request: null
created_at: Tue Jul 21
updated_at: '2026-07-21'
---
# T-109 — A dinamika zajosabb, mint az időzítés — a trend zaj-kapuja dimenziónkénti küszöböt kívánhat

## Outcome

Eldől, hogy a trend zaj-kapuja dimenziónként külön küszöböt kapjon-e, vagy az egységes érték

## Scope

Provisional: ismételt-take mérés a zaj tényleges elkülönítésére, majd döntés a dimenziónkénti

## Non-goals

- A vödör-küszöbök módosítása → [O-91](O-91-take-atlag-vagott-kappa-atlaga.md),

## Acceptance

- The outcome is observable: Eldől, hogy a trend zaj-kapuja dimenziónként külön küszöböt kapjon-e, vagy az egységes érték

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-108; lane: scoring; legacy status: backlog.

## Open decisions

- **A megfigyelt különbség zaj-e vagy valódi jel?** A billenések Δ-eloszlása NEM zaj-mérés: nem

## Decision to be supported

Eldől, hogy a trend zaj-kapuja dimenziónként külön küszöböt kapjon-e, vagy az egységes érték

## Research question

Az [O-100](O-100-trend-modul-iranyt-mond-jelentest-nem.md) egységes `noiseThreshold = 0.03`

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

Migration preview only. Source: scrum/tickets/O-108-trend-dimenzionkenti-zaj-kuszob.md. No product implementation or human ready approval is implied.
