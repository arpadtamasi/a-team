---
id: T-017
title: A `DRIFT_HIGH = 8` halott konstans — a drift-ág sosem sül el
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
# T-017 — A `DRIFT_HIGH = 8` halott konstans — a drift-ág sosem sül el

## Outcome

A `classify()` `DRIFT_HIGH = 8` küszöbe ([recommend.ts:84](../../apps/mcp/src/recommend.ts#L84)) elérhető marad a dobos valós adatain — ma elérhetetlen: a dobos 59 valós take-jén a `|driftMsPerBar|` maximuma 6,5. A `timingAfterTempo` így ma kizárólag a `coldStartLoss`-ból állhat elő, a take-en belüli sodródásról a rendszer sosem tud beszélni.

## Scope

2026-07-16, az *AI értékelés semmitmondó* branch (`feat/concrete-take-feedback`) mérése — 59 take, kronologikus baseline. Hatókörön kívül volt: nem ez a branch okozta.

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-17; lane: scoring; legacy status: backlog.

## Open decisions

None.

## Actual behaviour

Pontosan az a betegség, amit a #50 a `CLEAN_DYN = 0.85` / `JITTER_HIGH = 22` esetén kigyomlált — ugyanabban a függvényben ottfelejtve: egy kitalált abszolút szám a dobos teljes eloszlásán kívül ül. A #50 Done-ja a maradék `0.85`/`0.8` küszöböket vizsgálta, ez a `8` kimaradt.

## Expected behaviour

A `classify()` `DRIFT_HIGH = 8` küszöbe ([recommend.ts:84](../../apps/mcp/src/recommend.ts#L84)) elérhető marad a dobos valós adatain — ma elérhetetlen: a dobos 59 valós take-jén a `|driftMsPerBar|` maximuma 6,5. A `timingAfterTempo` így ma kizárólag a `coldStartLoss`-ból állhat elő, a take-en belüli sodródásról a rendszer sosem tud beszélni.

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · scoring lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Pontosan az a betegség, amit a #50 a `CLEAN_DYN = 0.85` / `JITTER_HIGH = 22` esetén kigyomlált — ugyanabban a függvényben ottfelejtve: egy kitalált abszolút szám a dobos teljes eloszlásán kívül ül. A #50 Done-ja a maradék `0.85`/`0.8` küszöböket vizsgálta, ez a `8` kimaradt.

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-17-drift-high-halott-konstans.md. No product implementation or human ready approval is implied.
