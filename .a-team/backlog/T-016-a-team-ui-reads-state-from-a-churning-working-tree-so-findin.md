---
id: T-016
title: >-
  a-team ui reads state from a churning working tree, so findings flicker/vanish
  from the UI
status: backlog
origin: finding
types:
  - feature
profiles: []
priority: high
risk: medium
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-07-26'
updated_at: '2026-07-26'
source_finding: F-006
---
# T-016 — a-team ui reads state from a churning working tree, so findings flicker/vanish from the UI

## Outcome

The UI shows the **same** entity list (findings, tickets, packages) no matter
which branch the primary working directory happens to be checked out to.
Entities no longer flicker or vanish when another process runs `git checkout` /
`reset --hard` in the workspace. Derived state is read from a named ref, never
from the primary working tree's momentary `HEAD`.

## Scope

- The read path only: `readWorkspace()` in `src/commands/ui.ts` (and its helpers),
  which today reads `.a-team/` entity files directly off the working-tree
  filesystem (`readFileSync`/`readdirSync`) on every `/api/workspace` poll.
- Source the baseline entity set from the **configured base ref**
  (`config.yaml → git.base_branch`) via git plumbing (`git show <ref>:…` /
  `git ls-tree`), without checking anything out.
- **Extend** the existing worktree-aware status resolution (the `effective` /
  `diagnostics` / `fallback` logic around `ui.ts:36–44`) into a deliberate
  overlay: active worktrees contribute in-flight entities, marked with their
  claim/branch/worktree provenance (UX-SPEC §7). Disagreement surfaces as drift.

## Non-goals

- The write side (making `a-team finding new` land intake on the base ref) —
  separate ticket per D-001; here we only fix reads.
- Clustering/dedup, the dedicated `a-team/inbox` ref, the terminology rename —
  all deferred (D-001/D-002).

## Acceptance

- With the a-team UI running against a workspace, checking out any branch (or
  running `git reset --hard`) in the primary working directory does **not**
  change the set of findings/tickets/packages returned by `/api/workspace`.
- The returned baseline reflects the configured `git.base_branch`, resolved via
  git plumbing (no checkout), and is stable across concurrent branch churn.
- Active worktrees are overlaid as in-flight entities with visible
  claim/branch/worktree provenance; base-vs-worktree disagreement is reported as
  drift rather than silently resolved.

## Verification

- Automated test: start the reader against a fixture workspace, snapshot
  `/api/workspace`; from another process switch the primary dir to a feature
  branch (and `reset --hard`); re-snapshot and assert the baseline entity set is
  unchanged. A parallel worktree with an in-flight ticket must appear as overlay,
  not alter the baseline.
- Manual: reproduce the original flicker (the `pkg/…`→`main` checkout that hid
  the F- findings) and confirm it no longer changes the view.

## Constraints

- The CLI remains the only mutator; this ticket changes reads only.
- Honor `config.git.base_branch`; do not hard-code `main`.
- Must not regress the current worktree-derived ticket status behavior
  (UX-SPEC §3.1: state resolved from live worktrees).

## Open decisions

- **Uncommitted intake visibility.** `finding new` writes the file and
  regenerates the index but does **not** commit. If the baseline reads only the
  base ref, a freshly-written-but-uncommitted finding would disappear until
  committed. Decide: (a) union base ref + uncommitted working-tree adds for the
  base branch, (b) accept that intake is only visible once committed (pairs with
  the write-side ticket that commits intake to base), or (c) treat the primary
  checkout's *own* uncommitted adds as a third overlay.
- **Reuse depth.** How much of the existing `effective`-status/worktree
  resolution is reusable vs. needs rework — settle by reading that impl first.

## Execution notes

- Entry point: `readWorkspace()` — `src/commands/ui.ts:26`; served at
  `src/commands/ui.ts:202`.
- Existing worktree awareness to extend: `ui.ts:36–44`.
- Design basis: **D-001** (named-ref derivation, base + worktree overlay),
  source finding **F-006**. Enables **F-007** (triage agent needs reliable reads).
