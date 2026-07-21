---
id: T-025
title: Practice → Result teljes integrációs tesztjei
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
# T-025 — Practice → Result teljes integrációs tesztjei

## Outcome

Widget/integrációs teszt fedi a teljes mentés → `/take/score` → autoritatív Result utat, a pontozási hiba utáni címkézett lokális fallbacket, a mentési hiba + retry Snackbar ágat, valamint a kilépés/discard/voice eseményeket függőben lévő mentés és pontozás közben. A production Firebase-token + valódi HTTP-kliens lifecycle külön boundary-smoke tesztet kap.

## Scope

2026-07-13 `/ship` coverage audit; a mostani task auditált lefedettsége elérte a 80%-os célértéket, ez a megmaradó kereszt-komponensű E2E-adósság. 2026-07-17 (`fix/take-score-latency` review) óta ide tartozik a WAV-stream wiring is: korai leállás → `uploader.cancel()`; `finish()` false → `uploadTakeWav` fallback a recorder WAV-jával; sikeres stream → nincs dupla feltöltés.

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-25; lane: app; legacy status: backlog.

## Open decisions

None.

## Decision to be supported

Widget/integrációs teszt fedi a teljes mentés → `/take/score` → autoritatív Result utat, a pontozási hiba utáni címkézett lokális fallbacket, a mentési hiba + retry Snackbar ágat, valamint a kilépés/discard/voice eseményeket függőben lévő mentés és pontozás közben. A production Firebase-token + valódi HTTP-kliens lifecycle külön boundary-smoke tesztet kap.

## Research question

A jelenlegi unit- és widgettesztek minden új mappinget és Result-állapotot fednek, de a `PracticeScreen` aszinkron orchestration teljes felhasználói útját izolált függőségek nélkül nem lehet stabilan közvetlenül tesztelni.

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

Migration preview only. Source: scrum/tickets/O-25-practice-result-integracios-teszt.md. No product implementation or human ready approval is implied.
