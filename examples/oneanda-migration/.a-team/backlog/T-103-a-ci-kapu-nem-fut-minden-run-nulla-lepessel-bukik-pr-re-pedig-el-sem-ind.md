---
id: T-103
title: 'A CI-kapu nem fut — minden run nulla lépéssel bukik, PR-re pedig el sem indul'
status: backlog
origin: imported
types:
  - operations
profiles:
  - workflow
priority: medium
risk: medium
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Mon Jul 20
updated_at: '2026-07-21'
---
# T-103 — A CI-kapu nem fut — minden run nulla lépéssel bukik, PR-re pedig el sem indul

## Outcome

A `ci.yml` kapu ténylegesen lefut minden PR-en és main-pushon, és a zöld/piros állapota valódi

## Scope

A gyökérok eldőlt (billing), a fizetés elvetve → a hatókör: **a kapu kiváltása és a bizonyíték-elvárás

## Non-goals

- A Node-runtime deprecation: [O-30](O-30-github-actions-node-runtime-deprecation.md).

## Acceptance

- The outcome is observable: A `ci.yml` kapu ténylegesen lefut minden PR-en és main-pushon, és a zöld/piros állapota valódi

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-102; lane: operations; legacy status: backlog.

## Open decisions

- A `ci.yml` maradjon-e a repóban kikapcsolva/`workflow_dispatch`-re állítva (hogy ne gyártson

## Actors

Player, coach, operator, and the responsible delivery agent where applicable.

## Initial state

Az O-92 (PR #81) szállításakor derült ki, hogy **a CI-kapu ma nem véd semmit**. Két külön tünet,

## States

Use only the states already present in the product and this ticket contract.

## Transitions

A `ci.yml` kapu ténylegesen lefut minden PR-en és main-pushon, és a zöld/piros állapota valódi

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

Migration preview only. Source: scrum/tickets/O-102-ci-kapu-nem-fut.md. No product implementation or human ready approval is implied.
