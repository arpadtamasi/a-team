---
id: T-099
title: >-
  Az onboarding a telepítéshez van kötve, nem a fiókhoz — közös eszközön a
  második user kihagyja
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
# T-099 — Az onboarding a telepítéshez van kötve, nem a fiókhoz — közös eszközön a második user kihagyja

## Outcome

Minden új felhasználó végigmegy az onboardingon — akkor is, ha az eszközön már gyakorolt valaki

## Scope

- A „látta már az onboardingot" jelölés a felhasználóhoz kerül (`users/{uid}` alá, ahol a

## Non-goals

- Az onboarding TARTALMÁNAK átírása vagy a lépések szétválasztása eszköz- és

## Acceptance

1. Egy eszközön, ahol A felhasználó már végigment az onboardingon, **B felhasználó belépésekor

## Verification

### Automated

## Constraints

Migrated from O-98; lane: app; legacy status: done.

## Open decisions

None.

## Actual behaviour

rp vette észre 2026-07-20-án: **új fiókkal belépve nem jött az onboarding.** A feltevése helyes

## Expected behaviour

Minden új felhasználó végigmegy az onboardingon — akkor is, ha az eszközön már gyakorolt valaki

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · app lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

rp vette észre 2026-07-20-án: **új fiókkal belépve nem jött az onboarding.** A feltevése helyes

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Review evidence

**Review-jelölt** (2026-07-20, branch `fix/o98-onboarding-per-account`, commit `fab97f7e`):

## Execution notes

Migration preview only. Source: scrum/tickets/O-98-onboarding-telepiteshez-kotve.md. No product implementation or human ready approval is implied.
