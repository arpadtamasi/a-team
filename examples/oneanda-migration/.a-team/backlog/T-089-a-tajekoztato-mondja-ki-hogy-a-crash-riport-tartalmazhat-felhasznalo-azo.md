---
id: T-089
title: >-
  A tájékoztató mondja ki, hogy a crash-riport tartalmazhat
  felhasználó-azonosítót
status: backlog
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: null
depends_on:
  - T-054
blocks: []
branch: null
pull_request: null
created_at: Mon Jul 20
updated_at: '2026-07-21'
---
# T-089 — A tájékoztató mondja ki, hogy a crash-riport tartalmazhat felhasználó-azonosítót

## Outcome

A publikus adatvédelmi tájékoztató és a belső feldolgozó-nyilvántartás **igazat mond** arról, hogy

## Scope

- `site/public/privacy.html` (EN + HU): a Crashlytics-bekezdés mondja ki, hogy a hibaüzenetek

## Non-goals

- A Crashlytics bekötése maga (O-53).

## Acceptance

- The outcome is observable: A publikus adatvédelmi tájékoztató és a belső feldolgozó-nyilvántartás **igazat mond** arról, hogy

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-88; lane: app; legacy status: backlog.

## Open decisions

- Az App Privacy nyilatkozatban a Crash Data marad-e „nem kapcsolt"? Ha a riport tartalmazhat

## Actual behaviour

Az O-53 review adverzariális passa találta. A take-WAV Storage-útvonala tartalmazza az uid-t

## Expected behaviour

A publikus adatvédelmi tájékoztató és a belső feldolgozó-nyilvántartás **igazat mond** arról, hogy

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · app lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Az O-53 review adverzariális passa találta. A take-WAV Storage-útvonala tartalmazza az uid-t

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-88-crash-riport-uid-szivargas.md. No product implementation or human ready approval is implied.
