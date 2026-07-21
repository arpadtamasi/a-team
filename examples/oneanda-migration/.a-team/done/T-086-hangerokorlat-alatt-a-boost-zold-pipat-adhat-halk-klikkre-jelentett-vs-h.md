---
id: T-086
title: >-
  Hangerőkorlát alatt a boost zöld pipát adhat halk klikkre — jelentett vs.
  hallható hangerő eszközös mérése
status: done
origin: imported
types:
  - research
profiles:
  - discovery
priority: medium
risk: medium
package: null
depends_on:
  - T-081
blocks: []
branch: null
pull_request: null
created_at: Mon Jul 20
updated_at: '2026-07-21'
resolution: obsolete
---
# T-086 — Hangerőkorlát alatt a boost zöld pipát adhat halk klikkre — jelentett vs. hallható hangerő eszközös mérése

## Outcome

Eszközön mérve tudjuk, hogy iOS rendszerszintű hangerő-korlátozás (Hangerőkorlát /

## Scope

Provizórikus: (1) eszközös mérés a mátrixon, jegyzőkönyvvel; (2) a mérés eredményétől függő

## Non-goals

- A preflight-sáv layoutja (O-80 kontraktus szerint áll).

## Acceptance

- The outcome is observable: Eszközön mérve tudjuk, hogy iOS rendszerszintű hangerő-korlátozás (Hangerőkorlát /

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-85; lane: app; legacy status: rejected.

## Open decisions

- A `FlutterVolumeController.getVolume()` a korlátozott vagy a kért értéket jelenti iOS-en,

## Decision to be supported

Eszközön mérve tudjuk, hogy iOS rendszerszintű hangerő-korlátozás (Hangerőkorlát /

## Research question

Az O-80 review adverzariális passa vetette fel ([ready_screen.dart:451](../../app/lib/screens/ready_screen.dart#L451),

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



## Review evidence

**REJECTED — 2026-07-20.**

## Execution notes

Migration preview only. Source: scrum/tickets/O-85-volume-limit-jelentett-vs-hallhato.md. No product implementation or human ready approval is implied.
