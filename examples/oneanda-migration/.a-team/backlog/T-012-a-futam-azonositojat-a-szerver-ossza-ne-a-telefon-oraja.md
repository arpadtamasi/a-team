---
id: T-012
title: 'A futam azonosítóját a SZERVER ossza, ne a telefon órája'
status: backlog
origin: imported
types:
  - feature
profiles: []
priority: high
risk: medium
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Fri Jul 17
updated_at: '2026-07-21'
---
# T-012 — A futam azonosítóját a SZERVER ossza, ne a telefon órája

## Outcome

A `runStartedAt` a connector-től kapott futam-azonosító, nem a kliens órájáról jövő `DateTime.now().millisecondsSinceEpoch` ([ma_screen.dart](../../app/lib/screens/ma_screen.dart)) — miközben ez Firestore doc-KULCS is.

## Scope

2026-07-16 `/ship` adversarial review (INVESTIGATE #4 és #6) a `fix/summary-screen-signals` ágon; rp a „szerver adja a futam-ID-t" opciót választotta a puszta TODO helyett. A bétában ma EGY dobos van EGY eszközzel, ezért nem béta-blokkoló.

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-12; lane: connector; legacy status: backlog.

## Open decisions

None.



## Execution notes

Migration preview only. Source: scrum/tickets/O-12-futam-azonosito-szerver-oldalrol.md. No product implementation or human ready approval is implied.
