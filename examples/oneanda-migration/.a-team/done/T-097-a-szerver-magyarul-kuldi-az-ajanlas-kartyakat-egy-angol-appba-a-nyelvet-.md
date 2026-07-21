---
id: T-097
title: >-
  A szerver magyarul küldi az ajánlás-kártyákat egy angol appba — a nyelvet meg
  sem kapja
status: done
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: P-004
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Mon Jul 20
updated_at: '2026-07-21'
resolution: completed
---
# T-097 — A szerver magyarul küldi az ajánlás-kártyákat egy angol appba — a nyelvet meg sem kapja

## Outcome

A dobos a session végén az app nyelvén kapja az ajánlás-kártyákat — nem magyarul egy angol appban.

## Scope

- **Az app küldi a nyelvét.** A `POST /session/summary` törzse kiegészül egy nyelv-mezővel

## Non-goals

- A coach által ÍRT gyakorlás-tartalom nyelve → [O-97](O-97-magyar-gyakorlas-tartalom-angol-appban.md).

## Acceptance

1. A `/session/summary` kérés **hordozza az app nyelvét**, és a szerver ezt olvassa.

## Verification

### Automated

## Constraints

Migrated from O-96; lane: connector; legacy status: done.

## Open decisions

None.

## Actual behaviour

rp jelentette 2026-07-20-án, egy ÚJ (angol tartalmú) fiókkal végigjátszott session után: a

## Expected behaviour

A dobos a session végén az app nyelvén kapja az ajánlás-kártyákat — nem magyarul egy angol appban.

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · connector lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

rp jelentette 2026-07-20-án, egy ÚJ (angol tartalmú) fiókkal végigjátszott session után: a

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Review evidence

**Review-jelölt** (2026-07-20, branch `fix/o96-recommendation-language`, commit `40613e63`):

## Execution notes

Migration preview only. Source: scrum/tickets/O-96-szerver-oldali-ajanlasok-magyarul.md. No product implementation or human ready approval is implied.
