---
id: P-004
kind: batch
title: 'Teljes rename: a-team → kotta'
status: backlog
tickets:
  - T-020
  - T-021
  - T-023
  - T-022
execution:
  mode: dependency-aware
  parallelism: 1
  stop_on_failure: true
authority:
  create_findings: true
  create_subtickets: false
  reorder_independent_tickets: false
  change_scope: false
created_at: '2026-08-01'
updated_at: '2026-08-02'
---
# P-004 — Teljes rename: a-team → kotta

## Goal

A termék minden felülete és a szomszéd workspace-ek is Kotta néven futnak: npm, CLI, könyvtár, szótár — egyetlen, sorrendezett körben.

## Completion

All member tickets satisfy their acceptance contracts.

## Execution notes

Membership and ordering are coordinated by a human.
