---
id: T-090
title: >-
  Androidon a Crashlytics néma no-op — nincs google-services.json és
  gradle-plugin
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
created_at: Mon Jul 20
updated_at: '2026-07-21'
blocked: true
blocked_reason: Legacy work was parked; human reactivation is required.
---
# T-090 — Androidon a Crashlytics néma no-op — nincs google-services.json és gradle-plugin

## Outcome

Az Android-build vagy valódi crash-riportot ad (google-services.json + Crashlytics gradle-plugin +

## Scope

Provizórikus: a válasz kettéágazik (bekötés vs. dokumentált lezárás).

## Non-goals

- iOS-oldali Crashlytics (O-53).

## Acceptance

- The outcome is observable: Az Android-build vagy valódi crash-riportot ad (google-services.json + Crashlytics gradle-plugin +

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-89; lane: app; legacy status: parked.

## Open decisions

- Szállítunk-e egyáltalán Androidra a bétában? Ha nem, a helyes lépés a dokumentált lezárás

## Actual behaviour

Az O-53 review adverzariális passa mérte fel: a `firebase_crashlytics` Dart-függőség Androidon

## Expected behaviour

Az Android-build vagy valódi crash-riportot ad (google-services.json + Crashlytics gradle-plugin +

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · app lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Az O-53 review adverzariális passa mérte fel: a `firebase_crashlytics` Dart-függőség Androidon

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-89-android-crashlytics-nema-noop.md. No product implementation or human ready approval is implied.
