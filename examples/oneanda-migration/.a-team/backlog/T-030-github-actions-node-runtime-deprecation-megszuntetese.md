---
id: T-030
title: GitHub Actions Node runtime deprecation megszüntetése
status: backlog
origin: imported
types:
  - operations
profiles:
  - workflow
priority: low
risk: medium
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Fri Jul 17
updated_at: '2026-07-21'
---
# T-030 — GitHub Actions Node runtime deprecation megszüntetése

## Outcome

A CI workflow GitHub Actionjei olyan támogatott kiadásra kerülnek, amely már nem a kivezetett

## Scope

2026-07-12 PR #37 merge utáni CI (`29206363319`) figyelmeztetése, P3 ops debt.

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-30; lane: connector; legacy status: backlog.

## Open decisions

None.

## Actors

Player, coach, operator, and the responsible delivery agent where applicable.

## Initial state

A merge utáni CI az `actions/checkout@v4` és `actions/setup-node@v4` lépéseket már csak

## States

Use only the states already present in the product and this ticket contract.

## Transitions

A CI workflow GitHub Actionjei olyan támogatott kiadásra kerülnek, amely már nem a kivezetett

## Triggers

The user or operational action described by the source contract.

## Permissions

Preserve existing authorization and privacy boundaries.

## Error paths

Failures remain visible and retryable without silent partial completion.

## Cancellation path

Cancellation leaves canonical repository and product state valid.

## Retry and duplicate-action behaviour

Retries are idempotent or explicitly rejected.

## Audit and notification expectations

Record material state changes; notify only the actor who can respond.



## Execution notes

Migration preview only. Source: scrum/tickets/O-30-github-actions-node-runtime-deprecation.md. No product implementation or human ready approval is implied.
