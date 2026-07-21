---
id: T-105
title: >-
  Az elfogadott ajánlás MAGYAR nevű blokkot tesz a tervbe — a kártya angol, a
  következménye nem
status: done
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: P-004
depends_on:
  - T-097
blocks: []
branch: null
pull_request: null
created_at: Mon Jul 20
updated_at: '2026-07-21'
resolution: completed
---
# T-105 — Az elfogadott ajánlás MAGYAR nevű blokkot tesz a tervbe — a kártya angol, a következménye nem

## Outcome

Amit az elfogadott ajánlás a dobos tervébe tesz, az ugyanazon a nyelven szól, mint a kártya, amit

## Scope

- A négy `Spec.patch` szövegei ([recommend.ts](../../apps/mcp/src/recommend.ts)): a blokk `name`

## Non-goals

- A MÁR elfogadott ajánlásokból származó, meglévő tervekben ülő magyar blokk-nevek visszamenőleges

## Acceptance

1. `en` nyelvvel az elfogadott ajánlás által a tervbe írt blokk **neve és jegyzete angol**;

## Verification

### Automated

## Constraints

Migrated from O-104; lane: connector; legacy status: done.

## Open decisions

None.

## Actual behaviour

Az [O-96](O-96-szerver-oldali-ajanlasok-magyarul.md) a kártyák **szövegét** (title/body/goal) tette

## Expected behaviour

Amit az elfogadott ajánlás a dobos tervébe tesz, az ugyanazon a nyelven szól, mint a kártya, amit

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · connector lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Az [O-96](O-96-szerver-oldali-ajanlasok-magyarul.md) a kártyák **szövegét** (title/body/goal) tette

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Review evidence

### Amit szállít

## Execution notes

Migration preview only. Source: scrum/tickets/O-104-ajanlas-patch-blokknevei-magyarok.md. No product implementation or human ready approval is implied.
