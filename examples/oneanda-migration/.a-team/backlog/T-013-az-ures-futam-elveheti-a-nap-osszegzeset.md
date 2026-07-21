---
id: T-013
title: Az üres futam elveheti a nap összegzését
status: backlog
origin: imported
types:
  - bug
profiles:
  - bug
priority: high
risk: high
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Fri Jul 17
updated_at: '2026-07-21'
---
# T-013 — Az üres futam elveheti a nap összegzését

## Outcome

Egy felvétel nélküli koppintás nem ír ki új, üres futam-azonosítót a `control/session`-be — a nap valódi összegzése ilyenkor is elérhető marad.

## Scope

2026-07-16 `/ship` adversarial review (FIXABLE #2) a `fix/summary-screen-signals` ágon. rp döntése: a bejelentett P1 (stale/kevert Summary) javítva és bizonyítva, ez egy új, kisebb, helyrehozható él → TODO, nem blokkolja a shipet.

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-13; lane: app; legacy status: backlog.

## Open decisions

None.

## Actual behaviour

Egy KÉSZ terven a blokk-lista tappelható marad (`_planView`, QA 2026-07-11 döntés). Ha a dobos rákoppint egy blokkra és azonnal kilép (nem vesz fel semmit), a `_ensureRun` ([ma_screen.dart](../../app/lib/screens/ma_screen.dart)) már ki is írta az ÚJ, üres futam-azonosítót — mert a `startsFreshRun` a kész tervet friss futamnak veszi. Ettől a nap valódi összegzése elérhetetlen lesz: a „View summary" gomb az üres futamra mutat („még nincs mit összegezni"), és a `suggestChanges` ([recommend.ts](../../apps/mcp/src/recommend.ts)) is a `session.runStartedAt`-et olvassa, tehát a coach is elveszti a napot. A summary-doc nem vész el, csak nem lehet hozzáférni; egy újabb felvétel vagy egy újratervezés feloldja.

## Expected behaviour

Egy felvétel nélküli koppintás nem ír ki új, üres futam-azonosítót a `control/session`-be — a nap valódi összegzése ilyenkor is elérhető marad.

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · app lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Egy KÉSZ terven a blokk-lista tappelható marad (`_planView`, QA 2026-07-11 döntés). Ha a dobos rákoppint egy blokkra és azonnal kilép (nem vesz fel semmit), a `_ensureRun` ([ma_screen.dart](../../app/lib/screens/ma_screen.dart)) már ki is írta az ÚJ, üres futam-azonosítót — mert a `startsFreshRun` a kész tervet friss futamnak veszi. Ettől a nap valódi összegzése elérhetetlen lesz: a „View summary" gomb az üres futamra mutat („még nincs mit összegezni"), és a `suggestChanges` ([recommend.ts](../../apps/mcp/src/recommend.ts)) is a `session.runStartedAt`-et olvassa, tehát a coach is elveszti a napot. A summary-doc nem vész el, csak nem lehet hozzáférni; egy újabb felvétel vagy egy újratervezés feloldja.

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-13-ures-futam-nap-osszegzes.md. No product implementation or human ready approval is implied.
