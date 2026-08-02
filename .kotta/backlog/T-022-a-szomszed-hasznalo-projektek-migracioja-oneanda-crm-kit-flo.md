---
id: T-022
title: 'A szomszed workspace-ek migracioja a kotta migrate paranccsal'
status: backlog
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
package: P-004
depends_on:
  - T-023
blocks: []
branch: null
pull_request: null
created_at: '2026-08-01'
updated_at: '2026-08-01'
---
# T-022 — A szomszéd workspace-ek migrációja a `kotta migrate` paranccsal

## Outcome

The three neighbour workspaces — oneanda, crm-kit, flowbench — run on the current Kotta shape: `.kotta/` directory, the new vocabulary, `defined` instead of `ready`. Each migrated by running `kotta migrate`, each in its own commit, each with a green `kotta validate` afterwards.

## Context

D-006 staged the rename; T-020 made both directory names work, including under the previously released CLI; T-023 provides `kotta migrate` and migrates this repository with it. This ticket applies the same command to the neighbours.

The T-020 agent already proved the mechanics on **copies** of all three: byte-identical validate results before and after, in both symlink directions, and still green after `mv .a-team .kotta && ln -s .kotta .a-team` — even with the old released CLI. So the risk here is not whether it works, but that these are live workspaces with other people's history in them.

oneanda is the large one: 164 contracts, 101 observations, 21 batches, and 42 pre-existing validate errors that are **not ours** and must not be silently repaired by this ticket.

## Scope

- Run `kotta migrate` on each of oneanda, crm-kit and flowbench.
- One commit per repository, whose message names the command and carries its output.
- A `kotta validate` run in each, before and after, with the two outputs compared.
- Record the pre-existing error count in each repository before migrating, so the after-state can be judged against it.

## Non-goals

- Fixing any pre-existing validate error in a neighbour workspace. oneanda's 42 are recorded and left alone; repairing them is separate work with a separate owner.
- Touching product code in any neighbour repository. Only the workspace directory moves.
- Publishing or upgrading the Kotta dependency in those repositories beyond what the migration needs.
- Migrating any workspace not named here.

## Acceptance

1. Each of the three repositories has its workspace under `.kotta/`, migrated by the command rather than by hand.
2. In each, `kotta validate` after the migration reports exactly the errors it reported before — no new class, and none silently repaired. oneanda's count is 42 before and 42 after unless a difference is explained in the evidence.
3. Every cross-reference still resolves in each workspace; no identifier changed.
4. Each repository has exactly one migration commit, carrying the command's output.
5. The board opens against each migrated workspace and lists the same entity counts as before.
6. Nothing outside the workspace directory changed in any neighbour repository — shown by the diff.

## Verification

For each repository: capture `kotta validate --json` before, run `kotta migrate --dry-run`, run it, capture validate after, diff the two, and diff the working tree to prove nothing else moved. Then start the board against each and compare entity counts with the pre-migration numbers.

## Constraints

These are live repositories with other people's work in them. Migrate on a clean tree; if a repository is dirty, stop and report rather than committing around it. Never repair a pre-existing error as a side effect. Never change an identifier.

## Open decisions

None.

## Execution notes

Paths: `/Users/rp/Dev/ezchops/oneanda`, plus crm-kit and flowbench. The T-020 review evidence records the copy-based rehearsal and the exact numbers it saw, including oneanda's 42.
