---
id: T-014
title: A futam-indítás offline útja nincs tesztelve
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
# T-014 — A futam-indítás offline útja nincs tesztelve

## Outcome

A `startSessionRun` bukási útja ([ma_screen.dart](../../app/lib/screens/ma_screen.dart) `_ensureRun`) tesztelt: a `try/catch` garantálja, hogy a gyakorlás hálózat nélkül is elinduljon (a `runTransaction` szerver-oldali, offline nem old fel), és ez teszttel bizonyított, nem csak kóddal.

## Scope

2026-07-16 `/ship` pre-landing review (testing + performance specialista, egybehangzóan, 9/10) a `fix/summary-screen-signals` ágon. A hibát a review fogta meg, a javítás bent van — csak a teszt hiányzik.

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-14; lane: app; legacy status: backlog.

## Open decisions

None.

## Decision to be supported

A `startSessionRun` bukási útja ([ma_screen.dart](../../app/lib/screens/ma_screen.dart) `_ensureRun`) tesztelt: a `try/catch` garantálja, hogy a gyakorlás hálózat nélkül is elinduljon (a `runTransaction` szerver-oldali, offline nem old fel), és ez teszttel bizonyított, nem csak kóddal.

## Research question

Ez a `catch` tartja a legrosszabb regressziót távol (offline a dobos blokkot nyit, a terv-nézet a cache-ből renderel, és a blokk sosem nyílna ki, ráadásul a `_opening` guard némán elnyelné a további koppintásokat). Egy őrizetlen `catch` csendben eltűnhet egy későbbi refaktorban. Ma a tiszta döntés (`resolveRunId`) tesztelve van, a bukási út nem: a `startSessionRun` a top-level `_db`-re köt, nincs injektálható tranzakció-futtató és nincs `fake_cloud_firestore`.

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

Migration preview only. Source: scrum/tickets/O-14-futam-inditas-offline-teszt.md. No product implementation or human ready approval is implied.
