---
id: T-032
title: >-
  A done-kapu nem békíti ki a próza deviációit a strukturált Deviations mezővel
status: backlog
origin: finding
types:
  - feature
profiles: []
priority: medium
risk: low
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_finding: F-019
---
# T-032 — A done-kapu nem békíti ki a próza deviációit a strukturált Deviations mezővel

## Outcome

Ha egy ticket `### Deviations` szakasza „None." vagy „Not declared.", de a review-evidencia prózája deviációt említ, a validáció hibát ad. A két hely nem mondhat ellent egymásnak észrevétlenül.

## Context

F-019: a oneanda workspace 67 done ticketjéből 14-ben a `### Deviations` „None."-t mondott, miközben ugyanabban a fájlban `DEVIACIOK:` lista sorakozott — 2–8 említés ticketenként. A T-031 a mechanikus okot megszüntette (a CLI többé nem ír kéretlen „None."-t, alapérték „Not declared."), de a kibékítést semmi nem kényszeríti ki: az ágens továbbra is nyilatkozhat „None."-t, és írhat deviációt a `### Verification performed` szövegébe. A T-031 ezt kifejezetten non-goalnak jelölte.

## Scope

- Új validációs szabály a done-kapuban: ha a `### Deviations` szakasz tartalma „None." vagy „Not declared.", és a `### Verification performed` szövege illeszkedik a deviáció-markerre (`/deviáci|deviaci|deviation/i`), a validáció `DEVIATION_MISMATCH` hibát ad, a ticket azonosítójával és a találat idézetével.
- A hiba a `validate` parancs kimenetében jelenik meg, ugyanabban a formában, mint a többi (`code`, `message`, `path`).
- Csak `done` állapotú ticketekre fut.

## Non-goals

- Nem dönti el, hogy a nyilatkozat *igaz*-e — csak azt, hogy a két hely nem mond ellent (a tartalmi bírálat az F-018 külön munkája).
- Nem javítja visszamenőleg a meglévő done ticketek szövegét.
- Nem blokkolja a `ticket close`-t futás közben; a validáció jelzi, a döntés emberi.

## Acceptance

1. Done ticket „Deviations: None." + a verification szövegében „DEVIACIOK: ..." → `validate` hibát ad `DEVIATION_MISMATCH` kóddal.
2. Ugyanez „Not declared."-del is hibát ad.
3. Done ticket, amelynek Deviations szakasza valódi felsorolást tartalmaz → nincs hiba, akárhányszor szerepel a szó a prózában.
4. Done ticket „None." + a prózában nincs deviáció-marker → nincs hiba.
5. Nem-done ticketre a szabály nem fut.
6. A teljes tesztkészlet zöld.

## Verification

Integrációs tesztek fixture-ticketekkel a `tests/integration` alatt, az 1–5. feltételre egy-egy eset; `npx vitest run` teljes készlet.

## Constraints

- A szabály nem törhet el a `Not declared.` alapértéken (T-031) — ez a leggyakoribb jövőbeli tartalom.
- A marker-regex ékezet nélküli írásmódot is fogjon (a mért esetekben `DEVIACIOK` szerepelt, ékezet nélkül).

## Open decisions

None.

## Execution notes

A szabály helye a `src/commands/validate.ts` ticket-bejárása; a szakaszok kiolvasásához a meglévő markdown-parser elég, nem kell új függőség.
