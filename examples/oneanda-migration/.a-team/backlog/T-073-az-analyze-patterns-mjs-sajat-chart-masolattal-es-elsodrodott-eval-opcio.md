---
id: T-073
title: >-
  Az `analyze-patterns.mjs` saját chart-másolattal és elsodródott eval-opciókkal
  pontoz — a `reports/` bázisnak érvénytelen
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
created_at: Sun Jul 19
updated_at: '2026-07-21'
---
# T-073 — Az `analyze-patterns.mjs` saját chart-másolattal és elsodródott eval-opciókkal pontoz — a `reports/` bázisnak érvénytelen

## Outcome

A dev-elemző eszköz ugyanazt a pontszámot állítja elő, mint a produkció — vagy nem pontoz

## Scope

Provizórikus: az import-átállás valószínűleg kicsi, de a `rank-patterns.mjs` bemeneti szerződését

## Non-goals

Az O-10 mérési harnessének megírása — az saját ticket.

## Acceptance

- The outcome is observable: A dev-elemző eszköz ugyanazt a pontszámot állítja elő, mint a produkció — vagy nem pontoz

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-72; lane: scoring; legacy status: backlog.

## Open decisions

- Az eszköz `evaluateTake`-hívása **importálja** a produkciósat, vagy inkább **megszűnjön** az

## Actual behaviour

A [tools/oneanda/analyze-patterns.mjs](../../tools/oneanda/analyze-patterns.mjs) két ponton tér el

## Expected behaviour

A dev-elemző eszköz ugyanazt a pontszámot állítja elő, mint a produkció — vagy nem pontoz

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · scoring lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

A [tools/oneanda/analyze-patterns.mjs](../../tools/oneanda/analyze-patterns.mjs) két ponton tér el

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-72-analyze-patterns-elsodrodott-eval-opciok.md. No product implementation or human ready approval is implied.
