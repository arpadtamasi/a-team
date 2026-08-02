---
id: T-01kz1g2vvgqvvzef92qdtczv8w
title: >-
  Nincs CLI-ut egy csomag lezarasara, ha a ticketjei a csomag-folyamaton kivul
  keszultek el
status: ready
origin: finding
types:
  - bug
profiles: []
priority: medium
risk: medium
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_finding: F-01kz1fndr7se26q7bcpv49d2hk
---
# T-01kz1g2vvgqvvzef92qdtczv8w — >-

## Outcome

A package whose tickets all reached `done` can be closed through the CLI, whatever path the tickets took. `package status` never reports `backlog` for a package whose work is finished.

## Context

P-005, 2026-08-02: all three member tickets (T-034, T-036, T-035) are `done`, but the package still sits in `backlog` and no command can move it. The `package` verbs are new, add, remove, validate, ready, start, status, dedupe, finalize — there is no `close`.

Automatic completion lives in `updateContainingPackage` (`src/commands/ticket.ts`), but it scans only `.a-team/packages/active` and only runs on a ticket `close`/`cancel`. So a package whose tickets are executed one by one — which since T-035 (`ticket execute`) is a common path, not an exception — never becomes active, and therefore never becomes done.

The apparent workaround is a dead end: `package ready --approve` + `package start` moves the package to `active` and opens a coordinator branch, but there is then no closable ticket left to flip it to `done` — the package would be stuck worse than now.

## Scope

- A supported path to close a package whose member tickets are all in a terminal state, from any package state.
- `updateContainingPackage` also considers packages outside `active`, so the common path completes on its own.
- Refusal with a clear reason when a member ticket is not terminal.

## Non-goals

- Coordinator-branch cleanup — that is `package finalize` (T-015) and runs after this.
- Retroactively repairing other workspaces.
- Changing package membership or the ready/start contract.

## Acceptance

1. A package in `backlog` whose members are all `done` can be closed through the CLI and lands in `packages/done`; `package status` reports `done`.
2. Closing a package with a non-terminal member is refused, names the member, and changes nothing.
3. Closing the last ticket of a package that never went `active` completes the package without a separate command.
4. Human approval is required.
5. P-005 in this repository closes with the new path.
6. Full suite, typecheck and builds green; `a-team validate` ok.

## Verification

Integration tests over a temp repo: package with all-done members closed from `backlog`; refusal for a mixed package with a before/after snapshot; the auto-completion path. Then run it on P-005 here.

## Constraints

Closing a package must not alter its tickets. All mutations go through supported writers. A refusal leaves package and tickets untouched.

## Open decisions

None.

## Execution notes

`src/commands/package.ts` and `updateContainingPackage` in `src/commands/ticket.ts`. `closeTicket` is the closest existing shape for approval and commit conventions.
