---
id: T-029
title: A `.spec.ts` fájlok KIMARADNAK a typecheckből — a `satisfies` semmit nem őriz
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
created_at: Fri Jul 17
updated_at: '2026-07-21'
---
# T-029 — A `.spec.ts` fájlok KIMARADNAK a typecheckből — a `satisfies` semmit nem őriz

## Outcome

A spec-fájlok is típusellenőrzöttek. Ma az `apps/mcp/tsconfig.json` `exclude`-olja a `src/**/*.spec.ts`-t, a vitest pedig típusellenőrzés nélkül transzpilál (esbuild), így a spec-fájlokban egyetlen gate sem néz típust. A `summary.spec.ts` `satisfies SummaryResult`-ja tehát látszat-szerződés: nem bukna el, ha a fixture elavul. Mérve (2026-07-17): a `recommend.spec.ts` már most 6+ néma típushibát hordoz — a `classify(...)` hívások parciális `Baseline`-t adnak át (hiányzó `biasMs`), ami `tsc` alatt `TS2345`.

## Scope

2026-07-17 `feat/summary-per-block-signals` review-találata (`/review` high). A találat úgy jött elő, hogy a `SummaryResult` új kötelező mezőket kapott (`timingNote`, `runBiasMs`, `blocks`) — a `satisfies`-os fixture-öket kézzel kellett megkeresni, mert semmi nem jelezte. Hatókörön kívül: pre-existing, nem ez az ág okozta (az ág a saját fixture-jeit rendbe tette).

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-29; lane: test-code; legacy status: backlog.

## Open decisions

None.

## Actual behaviour

Pontosan az a hibaosztály, amit a repo többször megégetve tanult: egy fixture csendben elavul, a teszt zölden fut, és a valóságot már nem fedi. A `satisfies` azt sugallja, hogy a szerződést őrzi — miközben nem fut rá semmi. Aki erre támaszkodik, hamis biztonságot vesz.

## Expected behaviour

A spec-fájlok is típusellenőrzöttek. Ma az `apps/mcp/tsconfig.json` `exclude`-olja a `src/**/*.spec.ts`-t, a vitest pedig típusellenőrzés nélkül transzpilál (esbuild), így a spec-fájlokban egyetlen gate sem néz típust. A `summary.spec.ts` `satisfies SummaryResult`-ja tehát látszat-szerződés: nem bukna el, ha a fixture elavul. Mérve (2026-07-17): a `recommend.spec.ts` már most 6+ néma típushibát hordoz — a `classify(...)` hívások parciális `Baseline`-t adnak át (hiányzó `biasMs`), ami `tsc` alatt `TS2345`.

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · test-code lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Pontosan az a hibaosztály, amit a repo többször megégetve tanult: egy fixture csendben elavul, a teszt zölden fut, és a valóságot már nem fedi. A `satisfies` azt sugallja, hogy a szerződést őrzi — miközben nem fut rá semmi. Aki erre támaszkodik, hamis biztonságot vesz.

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-29-spec-ts-kimarad-typecheckbol.md. No product implementation or human ready approval is implied.
