---
id: T-023
title: 'A szotar atallitasa es a kotta migrate parancs'
status: backlog
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
package: P-004
depends_on:
  - T-021
blocks: []
branch: null
pull_request: null
created_at: '2026-08-01'
updated_at: '2026-08-01'
---
# T-023 — A szótár átállítása és a `kotta migrate` parancs

## Outcome

The code speaks the new vocabulary, and a single command carries any workspace across: `kotta migrate` renames the directory, the entities, the stored statuses and the references, idempotently, with a dry run first. This repository is migrated by running it — and so is every workspace anyone else has.

## Context

D-01kz240dn155hb97h6px6n2p85 closed the vocabulary: `finding` → **observation**, `ticket` → **contract**, `package` → **batch**, and the `kind` field disappears. The previously decided `ready` → `defined` rides along. D-004's `goal`/`run` split is dropped.

The operator's insight shapes this ticket: the migration is **not agent work**. A deterministic rename across 164 entities, repeated in three repositories, is what a script does perfectly and an agent does expensively and unevenly. Making it a command also means it ships — every Kotta user migrates the same way we do, and the neighbour-migration ticket becomes "run the command" instead of "do it again by hand".

## Scope

- The code speaks the new names: types, functions, CLI verbs, API routes, schemas, skills, documentation.
- Stored form follows: status value and directory `ready` → `defined`; the entity directories take the new names.
- The `ticket ready` promotion verb is renamed as part of this — `define` is already taken by contract-writing, so the new verb name is part of the work, not an afterthought.
- The `kind` field is removed from batches, its validation with it.
- **`kotta migrate`** — one command that takes a workspace from any older shape to the current one: the workspace directory (`.a-team` → `.kotta`), the entity directories, the stored statuses, and every reference between entities. Idempotent. `--dry-run` reports exactly what it would change and touches nothing.
- Read compatibility for at least one version: the old directory names and status values still load, with a warning naming the migration command.
- This repository's own workspace is migrated by running the command — not by hand, not by the agent editing files.

## Non-goals

- Renaming identifiers. Ids stay exactly as they are, per D-010 — this is vocabulary, not identity.
- Migrating the neighbour workspaces; that is the next ticket, and it will consist of running this command.
- The two questions D-004 still parks: the assess gate, and whether an open question is a first-class entity.
- Any change to what the board displays; its labels are already the new vocabulary.

## Acceptance

1. `kotta migrate --dry-run` on a fixture in the old shape lists every change and modifies nothing — verified by comparing the tree before and after.
2. `kotta migrate` on that fixture produces a workspace that `kotta validate` accepts, with every cross-reference still resolving.
3. Running it a second time changes nothing and says so.
4. A workspace already in the new shape is left alone.
5. Old status values and directory names still load, with a warning that names the migration command.
6. No identifier changes anywhere — asserted by diffing ids before and after.
7. This repository's workspace is migrated by the command; the commit shows the command's output, and `kotta validate` is green afterwards.
8. A fixture the size of oneanda's (160+ contracts, 100+ observations, 20+ batches) migrates and validates.
9. `kind` is gone from batches and from the schema; a batch that still carries it loads with a warning.
10. Full suite, typecheck and all three builds green.

## Verification

Integration tests over fixtures in the old shape: dry run, migrate, re-migrate, already-new, and a large fixture built from a copy of oneanda's shape. Id-stability asserted by set comparison before and after. Then run the command on this repository and commit the result with its output.

## Constraints

The migration never loses a reference and never changes an id. It is idempotent and safe to interrupt: a partial run leaves a workspace that either still validates or names exactly what remains. Every write goes through supported writers. The command must work on a workspace produced by an older released CLI, because that is what the neighbours have.

## Open decisions

None.

## Execution notes

`workspacePath()` in `src/filesystem/workspace.ts` (T-020) already centralises the directory name — the migration extends that seam rather than fighting it. `TICKET_STATES` and `PACKAGE_STATES` in `src/filesystem/entities.ts` enumerate the directories. The reference fields to carry across are `depends_on`, `blocks`, `package`, `source_finding`, `discovered_during`, `became`, and a batch's `tickets` list.
