---
id: T-075
title: A detektor hallja meg a halk ütést — érzékenység fantom-ütés nélkül
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
  - T-047
blocks: []
branch: null
pull_request: null
created_at: Sun Jul 19
updated_at: '2026-07-21'
---
# T-075 — A detektor hallja meg a halk ütést — érzékenység fantom-ütés nélkül

## Outcome

A szándékolt halk (ghost) ütés **ténylegesen detektálódik** valós eszközön, anélkül hogy a

## Scope

Provizórikus: `app/lib/audio/onset_detector.dart` és a hívói. **Valós eszközös verifikációt és

## Non-goals

- A pontozás-oldali védelem — [O-73](O-73-nem-merheto-blokk-ne-kapjon-nullat.md).

## Acceptance

- The outcome is observable: A szándékolt halk (ghost) ütés **ténylegesen detektálódik** valós eszközön, anélkül hogy a

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-74; lane: scoring; legacy status: backlog.

## Open decisions

- Attack-alapú kapu, adaptív küszöb, a `noiseK`/`fullLevel` származtatásának felülvizsgálata, vagy

## Actual behaviour

Az [O-69](O-69-zajpadlo-alatti-halk-utes-hamis-pontszam.md) szülő-ticket B rétege. A

## Expected behaviour

A szándékolt halk (ghost) ütés **ténylegesen detektálódik** valós eszközön, anélkül hogy a

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · scoring lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Az [O-69](O-69-zajpadlo-alatti-halk-utes-hamis-pontszam.md) szülő-ticket B rétege. A

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-74-detektor-halk-utes-erzekenyseg.md. No product implementation or human ready approval is implied.
