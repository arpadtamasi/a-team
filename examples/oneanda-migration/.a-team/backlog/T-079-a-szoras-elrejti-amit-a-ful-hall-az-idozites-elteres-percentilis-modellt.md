---
id: T-079
title: >-
  A szórás elrejti, amit a fül hall — az időzítés-eltérés percentilis-modellt
  kíván
status: backlog
origin: imported
types:
  - research
profiles:
  - discovery
priority: medium
risk: medium
package: P-005
depends_on:
  - T-074
blocks: []
branch: null
pull_request: null
created_at: Sun Jul 19
updated_at: '2026-07-21'
---
# T-079 — A szórás elrejti, amit a fül hall — az időzítés-eltérés percentilis-modellt kíván

## Outcome

Az időzítés-eltérést a **kvantilisei** írják le (tipikus / p90 / p99 / max, és a hallhatóan

## Scope

Kutatási jellegű: a kvantilis-jellemzők kiszámítása a teljes korpuszon, összevetve a mai

## Non-goals

- A timing véletlen-korrekciója — [O-10](O-10-pontszam-perceptualis-aggregalas.md).

## Acceptance

- The outcome is observable: Az időzítés-eltérést a **kvantilisei** írják le (tipikus / p90 / p99 / max, és a hallhatóan

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-78; lane: scoring; legacy status: backlog.

## Open decisions

- Mi a „hallhatóan elhibázott" küszöb? Fix ms, a tempóhoz viszonyított arány (rp álláspontja

## Decision to be supported

Az időzítés-eltérést a **kvantilisei** írják le (tipikus / p90 / p99 / max, és a hallhatóan

## Research question

**rp megfigyelése (2026-07-19), miután meghallgatta a gyermeke játékát: a jelentett ~28 ms

## Hypotheses

The source contract contains the current evidence and competing explanations.

## Method

Inspect repository evidence, run the smallest representative measurement, and record uncertainty.

## Time or depth limit

Stop when the stated decision can be made with explicit confidence.

## Expected output

A decision-ready evidence note and the smallest follow-up ticket set.

## Decision criterion

The product owner can choose without inventing missing evidence.



## Execution notes

Migration preview only. Source: scrum/tickets/O-78-idozites-percentilis-modell.md. No product implementation or human ready approval is implied.
