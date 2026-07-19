---
id: TEMP-20260719-01
title: Make source-workspace package path resolution consistent
lane: null
type: bug
status: review
story_points: 3
created_at: 2026-07-19T16:52:23+02:00
ready_at: 2026-07-19T19:22:21+02:00
started_at: 2026-07-19T20:43:23+02:00
review_at: 2026-07-19T20:51:08+02:00
done_at:
sprint: 2026-07-19
branch:
blocked_periods: []
metrics:
  work_sessions:
    - TEMP-20260719-01-20260719T204323+0200
---

## Outcome

The A-Team source repository uses its current root package through a thin Claude skill adapter, while consuming repositories continue to use the installed package without duplicated skill sources or ambiguous path authority.

## Why

This repository develops and dogfoods the same package. A copied local installation could drift from the candidate being edited, while root-only source files are not discoverable through Claude's normal project skill location.

## Scope

- Keep `SKILL.md`, `METHOD.md`, `PROCESSES.md`, `GSTACK.md`, `GLOSSARY.md`, `schemas/`, and `skills/` at the repository root as the only editable product source.
- Add a tracked `.claude/skills/a-team/` adapter whose runtime entries resolve to those root sources without copying their contents.
- Make `AGENTS.md`, the root router, and every operational skill explicitly resolve root sources in the A-Team source repository and `.claude/skills/a-team/` after installation.
- Keep this repository's project-management data under root `a-team/`.
- Keep relative documentation and procedure references resolvable when read through the source tree and through the local adapter.

## Out of scope

- Maintaining a second copied runtime package inside this repository.
- Changing the public installation layout of a clone placed directly in a user's skill directory.
- Supporting environments that cannot preserve the adapter's repository-relative links.
- Changing lifecycle behavior unrelated to package resolution.

## Acceptance criteria

1. Editing any product skill or schema requires changing exactly one root source file; the local adapter contains no copied product implementation.
2. `.claude/skills/a-team/SKILL.md`, its shared method files, `schemas/`, and `skills/` resolve to the corresponding root sources in this repository.
3. A request routed through the project skill reads the same bytes as the root candidate for every runtime source named in scope.
4. `AGENTS.md` and every operation describe one consistent source-versus-installed resolution rule and name root `a-team/` as this project's state directory.
5. Local Markdown references used by the router and operations resolve from both the root source paths and their adapter-visible paths.

## Verification

### Automated

- `git diff --check`
- Enumerate the adapter entries and verify that each resolves inside this repository to the expected root source.
- Compare every adapter-visible runtime file with its root source and require byte equality.
- Parse every root and adapter-visible `SKILL.md` frontmatter and require a name and description.

### Manual

- Route one read-only `howto` request through `.claude/skills/a-team/SKILL.md` and confirm that it reads the current root method and root operational skill rather than a copied package.

### Documentation

- Check every changed local Markdown link from both its source path and adapter-visible path.

### Review handoff

- Candidate commit: `62cdf60` (`fix: dogfood root A-Team package through adapter`).
- `git diff --check`: passed for the candidate.
- Adapter enumeration: 7 expected symlink entries, each resolving inside this repository to its exact root source.
- Byte comparison: all 28 runtime Markdown files matched between root and adapter-visible paths by SHA-256.
- Frontmatter parsing: all 36 root and adapter-visible router/operation `SKILL.md` views contained non-empty `name` and `description` values.
- Markdown-link check: all local links across 56 root and adapter-visible runtime views resolved.
- Manual route: `.claude/skills/a-team/skills/howto/SKILL.md` resolved to the current root `skills/howto/SKILL.md`.
- Self-audit finding: the pre-existing missing `ticket-cycle` route is captured outside this sprint as [AT-4](AT-4-missing-ticket-cycle-route.md).
- Known limitation: symbolic-link support is required, as already stated out of scope; no provider token totals were exposed.

## Dependencies

None.

## Context

- The repository both ships and uses A-Team.
- The user selected a thin local adapter with one physical product source rather than a copied installation.
- Consumer installations still place the package itself under their skill directory; they do not depend on this source-repository adapter.

## Result

## Refinement notes

Estimated at 3 points: the design is settled, but the change crosses the router, repository rules, every operation's resolution instructions, and two path contexts that require explicit validation.
