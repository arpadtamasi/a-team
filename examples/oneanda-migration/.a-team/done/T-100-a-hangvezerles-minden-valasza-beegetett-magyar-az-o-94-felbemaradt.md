---
id: T-100
title: A hangvezérlés minden válasza beégetett magyar — az O-94 félbemaradt
status: done
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: P-006
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Mon Jul 20
updated_at: '2026-07-21'
resolution: completed
---
# T-100 — A hangvezérlés minden válasza beégetett magyar — az O-94 félbemaradt

## Outcome

A hangvezérlés a felhasználó nyelvén válaszol — sem hangban, sem képernyőn nem szólal meg magyarul

## Scope

- A 17 string l10n-kulcsra kötése (EN + HU).

## Non-goals

- A coach által írt gyakorlás-tartalom nyelve → [O-97](O-97-magyar-gyakorlas-tartalom-angol-appban.md).

## Acceptance

1. A felsorolt **17 string egyike sem** marad beégetve: mind l10n-kulcson keresztül jön, EN és HU

## Verification

### Automated

## Constraints

Migrated from O-99; lane: app; legacy status: done.

## Open decisions

None.

## Actual behaviour

Az [O-94](O-94-beegetett-magyar-a-belepo-kepernyon.md) a belépő képernyő két beégetett magyar

## Expected behaviour

A hangvezérlés a felhasználó nyelvén válaszol — sem hangban, sem képernyőn nem szólal meg magyarul

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · app lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Az [O-94](O-94-beegetett-magyar-a-belepo-kepernyon.md) a belépő képernyő két beégetett magyar

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Review evidence

**Review-jelölt** (2026-07-20, branch `fix/o99-voice-l10n`, commitok `ca8823cf` + `8817cca4`):

## Execution notes

Migration preview only. Source: scrum/tickets/O-99-hangvezerles-beegetett-magyar.md. No product implementation or human ready approval is implied.
