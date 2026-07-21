---
id: T-072
title: >-
  A `cli.mjs takes` a halott `overall` mezőt olvassa — minden take
  „timing/dyn=?"-t ír
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
# T-072 — A `cli.mjs takes` a halott `overall` mezőt olvassa — minden take „timing/dyn=?"-t ír

## Outcome

A `node tools/oneanda/cli.mjs takes <uid>` a take-ek valódi pontszámát listázza, nem `?`-et.

## Scope

Egysoros olvasási hiba javítása a `listTakes`-ben; érdemes a `serverEval` 1–5 jegyet is kiírni,

## Non-goals

None explicitly identified.

## Acceptance

- The outcome is observable: A `node tools/oneanda/cli.mjs takes <uid>` a take-ek valódi pontszámát listázza, nem `?`-et.

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-71; lane: scoring; legacy status: backlog.

## Open decisions

None.

## Actual behaviour

A lista a take-dokumentum `overall` mezőjét olvassa, ami **nem létezik** — a pontszám a

## Expected behaviour

A `node tools/oneanda/cli.mjs takes <uid>` a take-ek valódi pontszámát listázza, nem `?`-et.

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · scoring lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

A lista a take-dokumentum `overall` mezőjét olvassa, ami **nem létezik** — a pontszám a

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-71-cli-listtakes-halott-overall-mezo.md. No product implementation or human ready approval is implied.
