---
id: T-026
title: Az átmenetben egy futam a SAJÁT normájának mintája lehet
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
  - T-012
blocks: []
branch: null
pull_request: null
created_at: Fri Jul 17
updated_at: '2026-07-21'
---
# T-026 — Az átmenetben egy futam a SAJÁT normájának mintája lehet

## Outcome

Egy futam nem válhat a saját normájának mintájává. A `loadProgressContext` a `<` scopeId-vel „a mostani futam saját docát is kizárja" — de csak az AZONOS kulcsútra. Az átmenetben (régi build nem küld `runStartedAt`) egy gyakorlás két docot hagyhat: `summaries/{sessionCreatedAt}` és `summaries/{runStartedAt}`, ahol `S < R`. Az R-futam norma-ablakába ma belefér a saját S-docja — a saját biasa a saját normájának mintája lesz, a p75-öt a jelen érték felé húzza, és elnémítja a jelzést. Semmi nem szűri.

## Scope

2026-07-17 `/ship` adversarial (Claude, INVESTIGATE) a `feat/summary-per-block-signals` ágon.

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-26; lane: connector; legacy status: backlog.

## Open decisions

None.

## Actual behaviour

A §2.2a jelzése pont attól működik, hogy a normát KORÁBBI futamok adják. Ez a rés némán gyengíti, és pont az átmenetben (most), amikor a legkevésbé látjuk.

## Expected behaviour

Egy futam nem válhat a saját normájának mintájává. A `loadProgressContext` a `<` scopeId-vel „a mostani futam saját docát is kizárja" — de csak az AZONOS kulcsútra. Az átmenetben (régi build nem küld `runStartedAt`) egy gyakorlás két docot hagyhat: `summaries/{sessionCreatedAt}` és `summaries/{runStartedAt}`, ahol `S < R`. Az R-futam norma-ablakába ma belefér a saját S-docja — a saját biasa a saját normájának mintája lesz, a p75-öt a jelen érték felé húzza, és elnémítja a jelzést. Semmi nem szűri.

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · connector lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

A §2.2a jelzése pont attól működik, hogy a normát KORÁBBI futamok adják. Ez a rés némán gyengíti, és pont az átmenetben (most), amikor a legkevésbé látjuk.

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-26-futam-sajat-normaja-minta.md. No product implementation or human ready approval is implied.
