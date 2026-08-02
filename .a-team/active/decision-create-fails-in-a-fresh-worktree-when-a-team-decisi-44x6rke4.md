---
id: T-01kz1g2vra99x0xhw144x6rke4
title: decision create fails in a fresh worktree when .a-team/decisions is empty
status: active
origin: finding
types:
  - bug
profiles: []
priority: medium
risk: medium
package: null
depends_on: []
blocks: []
branch: >-
  fix/T-01kz1g2vra99x0xhw144x6rke4-decision-create-fails-in-a-fresh-worktree-when-a-team-decisi
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_finding: F-01kz1dbnrr9tcghwnr1rg6fqm9
assigned_agent: claude
---
# T-01kz1g2vra99x0xhw144x6rke4 — decision create fails in a fresh worktree when .a-team/decisions is empty

## Outcome

`a-team decision create` works in a freshly created worktree. A missing `.a-team/decisions` directory is created by the writer instead of crashing with `ENOENT`.

## Context

Discovered during T-034. Git does not carry empty directories into a linked worktree, so `.a-team/decisions` is absent there until something writes into it. `decision create` reads the directory before writing and fails with `ENOENT: scandir <worktree>/.a-team/decisions`. Reproduced: `git init` + `a-team init` + `git worktree add` + `decision create --approve`.

Every other writer — `finding`, `package`, `ready`, `review`, `close`, `cancel`, and since T-034 `ticket new` — already creates its directory first. This is the last one missing the same line.

## Scope

- Create `.a-team/decisions` when it is absent, before reading or writing, in the decision writer.
- Regression test that runs `decision create` in a linked worktree whose `.a-team/decisions` does not exist.

## Non-goals

- Any change to decision identity, validation, or the `--id` contract.
- Auditing other writers for the same class of gap beyond decisions.

## Acceptance

1. `decision create --from <draft> --approve` succeeds in a linked worktree with no `.a-team/decisions` directory, and the record lands in that worktree.
2. The created decision passes `a-team validate`.
3. Behaviour in a normal checkout is unchanged.
4. Full suite, typecheck and builds green.

## Verification

Integration test creating a temp repo, `a-team init`, `git worktree add`, then `decision create` inside the worktree. `npx vitest run`, `npx tsc --noEmit`, `npm run build:cli`.

## Constraints

The fix is a directory creation only; it must not change what a decision record contains or how its id is derived.

## Open decisions

None.

## Execution notes

`src/core/decision.ts` / `src/commands/decision.ts`; compare with how `newFinding` prepares its directory.
