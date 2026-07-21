---
id: T-092
title: >-
  A take jegye a már 0-ra vágott blokk-pontok átlaga — többblokkos take-en
  elnézőbb a szándékoltnál
status: backlog
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: P-005
depends_on:
  - T-010
blocks: []
branch: null
pull_request: null
created_at: Mon Jul 20
updated_at: '2026-07-21'
---
# T-092 — A take jegye a már 0-ra vágott blokk-pontok átlaga — többblokkos take-en elnézőbb a szándékoltnál

## Outcome

A take timing-jegye ugyanazt az elvet követi take-szinten is, amit az O-10 blokk-szinten

## Scope

Provizórikus. A választott irány újramérést kíván a korpuszon (AC 4/5 megismétlése).

## Non-goals

- A véletlen-korrekció képlete és a küszöbök (O-10, kész).

## Acceptance

- The outcome is observable: A take timing-jegye ugyanazt az elvet követi take-szinten is, amit az O-10 blokk-szinten

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-91; lane: scoring; legacy status: backlog.

## Open decisions

- Vágatlan κ-t vigyünk tovább gyakorlatonként, és egyszer vágjunk a take átlagán? Ez a

## Actual behaviour

Az O-10 véletlen-korrekciója szándékosan az ÁTLAGON vág 0-ra, nem ütésenként — és ez a

## Expected behaviour

A take timing-jegye ugyanazt az elvet követi take-szinten is, amit az O-10 blokk-szinten

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · scoring lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Az O-10 véletlen-korrekciója szándékosan az ÁTLAGON vág 0-ra, nem ütésenként — és ez a

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-91-take-atlag-vagott-kappa-atlaga.md. No product implementation or human ready approval is implied.
