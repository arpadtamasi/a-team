---
id: T-077
title: 'A `total` mező törlése — halott kód, amit csak a coach-szöveg mutat'
status: backlog
origin: imported
types:
  - other
profiles: []
priority: medium
risk: medium
package: null
depends_on:
  - T-010
blocks: []
branch: null
pull_request: null
created_at: Sun Jul 19
updated_at: '2026-07-21'
---
# T-077 — A `total` mező törlése — halott kód, amit csak a coach-szöveg mutat

## Outcome

A `score.total` mező és a `0.75·timing + 0.25·dynamics − 0.1·extraRate` képlet megszűnik; a

## Scope

Provizórikus: `libs/chart/src/eval/evaluate.ts`, `toText.ts`, `log.ts`, a tesztek, és a

## Non-goals

- A timing és dynamics pontozásának bármilyen változtatása —

## Acceptance

- The outcome is observable: A `score.total` mező és a `0.75·timing + 0.25·dynamics − 0.1·extraRate` képlet megszűnik; a

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-76; lane: scoring; legacy status: backlog.

## Open decisions

- Az `extraRate` maga megmarad-e (a `total`-on kívül nincs fogyasztója), vagy azzal együtt megy?



## Execution notes

Migration preview only. Source: scrum/tickets/O-76-total-mezo-torlese.md. No product implementation or human ready approval is implied.
