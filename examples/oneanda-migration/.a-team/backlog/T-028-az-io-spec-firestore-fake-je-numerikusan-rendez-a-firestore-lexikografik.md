---
id: T-028
title: 'Az io-spec Firestore-fake-je NUMERIKUSAN rendez, a Firestore LEXIKOGRAFIKUSAN'
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
# T-028 — Az io-spec Firestore-fake-je NUMERIKUSAN rendez, a Firestore LEXIKOGRAFIKUSAN

## Outcome

A `recommend.io.spec.ts` fake-je a valósághoz hűen rendez. Ma a fake `orderBy`-ja a summary-sorokat `Number(a.id)` szerint rendezi, a `where` viszont stringként hasonlít — az éles Firestore a `FieldPath.documentId()`-t lexikografikusan rendezi. Minden fixture 13 jegyű ID-t használ, ezért az eltérés sosem látszik.

## Scope

2026-07-17 `/ship` testing-specialista (6/10). Pre-existing teszt-infra, nem ez az ág okozta; a connector-oldali `epochMs` tartomány-szűrő a legdurvább esetet már kizárja.

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-28; lane: test-code; legacy status: backlog.

## Open decisions

None.

## Actual behaviour

Pont ezt a hibaosztályt tartja számon a `oneanda-run-identity-client-clock` tanulság: a `runStartedAt` a telefon órájáról jön, doc-KULCS lesz, és az előzmény doc-ID szerint rendez — egy 12 jegyű (2001 előtti) ID minden valódi fölé/alá kerül. A 2026-07-17-i §2.2a óta ez a rendezés dönti el, MELYIK 12 summary adja a `priorRunBiasMs` normát. Az egyetlen teszt-infra, ami ezt elkaphatná, más rendezést modellez, mint a valóság.

## Expected behaviour

A `recommend.io.spec.ts` fake-je a valósághoz hűen rendez. Ma a fake `orderBy`-ja a summary-sorokat `Number(a.id)` szerint rendezi, a `where` viszont stringként hasonlít — az éles Firestore a `FieldPath.documentId()`-t lexikografikusan rendezi. Minden fixture 13 jegyű ID-t használ, ezért az eltérés sosem látszik.

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · test-code lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Pont ezt a hibaosztályt tartja számon a `oneanda-run-identity-client-clock` tanulság: a `runStartedAt` a telefon órájáról jön, doc-KULCS lesz, és az előzmény doc-ID szerint rendez — egy 12 jegyű (2001 előtti) ID minden valódi fölé/alá kerül. A 2026-07-17-i §2.2a óta ez a rendezés dönti el, MELYIK 12 summary adja a `priorRunBiasMs` normát. Az egyetlen teszt-infra, ami ezt elkaphatná, más rendezést modellez, mint a valóság.

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-28-io-spec-fake-rendezes-eltres.md. No product implementation or human ready approval is implied.
