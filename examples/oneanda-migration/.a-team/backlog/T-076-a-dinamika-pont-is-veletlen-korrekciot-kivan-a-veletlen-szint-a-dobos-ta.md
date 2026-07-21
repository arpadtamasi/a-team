---
id: T-076
title: >-
  A dinamika-pont is véletlen-korrekciót kíván — a véletlen-szint a dobos
  tartományának közepén ül
status: backlog
origin: imported
types:
  - feature
profiles: []
priority: medium
risk: medium
package: P-005
depends_on:
  - T-010
blocks: []
branch: null
pull_request: null
created_at: Sun Jul 19
updated_at: '2026-07-21'
---
# T-076 — A dinamika-pont is véletlen-korrekciót kíván — a véletlen-szint a dobos tartományának közepén ül

## Outcome

A dinamika-jegy véletlen-korrigált: a találomra ütő teljesítmény nem kap 3-ast, és a jegy valódi

## Scope

Provizórikus: `libs/chart/src/eval/evaluate.ts` dinamika-ág + a `score15` dynamics-ága, a spec és

## Non-goals

- A timing véletlen-korrekciója — [O-10](O-10-pontszam-perceptualis-aggregalas.md).

## Acceptance

- The outcome is observable: A dinamika-jegy véletlen-korrigált: a találomra ütő teljesítmény nem kap 3-ast, és a jegy valódi

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-75; lane: scoring; legacy status: backlog.

## Open decisions

- Hogyan származtatjuk a `pₑ`-t, ha az a gyakorlat dinamika-összetételétől függ (blokkonként?



## Execution notes

Migration preview only. Source: scrum/tickets/O-75-dinamika-veletlen-korrekcio.md. No product implementation or human ready approval is implied.
