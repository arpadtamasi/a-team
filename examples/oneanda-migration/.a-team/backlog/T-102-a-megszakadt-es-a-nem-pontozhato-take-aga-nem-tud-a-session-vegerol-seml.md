---
id: T-102
title: >-
  A megszakadt és a nem pontozható take ága nem tud a session végéről — semleges
  „Tovább" a befejezés helyett
status: backlog
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: P-002
depends_on:
  - T-093
blocks: []
branch: null
pull_request: null
created_at: Mon Jul 20
updated_at: '2026-07-21'
---
# T-102 — A megszakadt és a nem pontozható take ága nem tud a session végéről — semleges „Tovább" a befejezés helyett

## Outcome

A session utolsó gyakorlata után a dobos akkor is a befejezésre hívó gombot lát, ha az a take

## Scope

Provizórikus: a `_partialView` és a `_lowConfidenceView` gombja a `practice_results_view.dart`-ban.

## Non-goals

- A footer és a napi összegzés várakozó szövege: [O-92](O-92-session-vege-felrevezeto-folyamat.md).

## Acceptance

- The outcome is observable: A session utolsó gyakorlata után a dobos akkor is a befejezésre hívó gombot lát, ha az a take

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-101; lane: app; legacy status: backlog.

## Open decisions

- Ugyanaz a felirat legyen-e (`finishSession`), vagy ezeken az ágakon más hangot kíván a

## Actual behaviour

Az [O-92](O-92-session-vege-felrevezeto-folyamat.md) a Result képernyő teljes pontszámú footerét

## Expected behaviour

A session utolsó gyakorlata után a dobos akkor is a befejezésre hívó gombot lát, ha az a take

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · app lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Az [O-92](O-92-session-vege-felrevezeto-folyamat.md) a Result képernyő teljes pontszámú footerét

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-101-partial-low-confidence-ag-session-vege.md. No product implementation or human ready approval is implied.
