---
id: P-003
kind: batch
title: Flutter surface decomposition
status: backlog
tickets:
  - T-038
  - T-039
execution:
  mode: dependency-aware
  parallelism: 2
  stop_on_failure: true
authority:
  create_findings: true
  create_subtickets: false
  reorder_independent_tickets: true
  change_scope: false
created_at: '2026-07-21'
updated_at: '2026-07-21'
---
# P-003 — Flutter surface decomposition

## Goal

Make the three large player surfaces independently testable without a redesign.

## Completion

Every referenced ticket is accepted and done; obsolete items have an explicit disposition.

## Execution notes

Migration preview package. Ordering remains dependency-aware and requires human commitment before execution.
