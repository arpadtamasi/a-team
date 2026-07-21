---
id: T-005
title: >-
  Metronóm halk az egyik iPhone-on — a Practice-klikk hallhatóvá tétele a
  pontozás rontása nélkül
status: done
origin: imported
types:
  - bug
profiles:
  - bug
priority: high
risk: high
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Fri Jul 17
updated_at: '2026-07-21'
resolution: completed
---
# T-005 — Metronóm halk az egyik iPhone-on — a Practice-klikk hallhatóvá tétele a pontozás rontása nélkül

## Outcome

A felvétel alatti metronóm-klikk az iPhone 15 / iOS 26.5 eszközön érdemben hangosabb lesz,

## Scope

- A mérő audio session kimeneti útjának javítása a

## Non-goals

- A `.measurement` → `.default` (vagy `.videoRecording`) mód-váltás. Ez a T4.5 döntés

## Acceptance

1. A `_configureMeasurementSession` a session aktiválása után `overrideOutputAudioPort(.speaker)`-t

## Verification

### Measurement

## Constraints

Migrated from O-6; lane: app; legacy status: done.

## Open decisions

None.

## Actual behaviour

Béta-gate. A dobos (fiú, uid `H50TV…`) háromszor jelezte ugyanazt — 2026-07-17 16:54Z („Nagyon

## Expected behaviour

A felvétel alatti metronóm-klikk az iPhone 15 / iOS 26.5 eszközön érdemben hangosabb lesz,

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · app lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Béta-gate. A dobos (fiú, uid `H50TV…`) háromszor jelezte ugyanazt — 2026-07-17 16:54Z („Nagyon

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Review evidence

**2026-07-18 — a kódváltozás kész, az eszközös igazolás FÜGGŐBEN.** A ticket `in_progress`

## Execution notes

Migration preview only. Source: scrum/tickets/O-6-metronom-halk-iphone.md. No product implementation or human ready approval is implied.
