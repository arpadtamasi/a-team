# Changelog

All notable changes to A-Team will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Entity identifiers are minted without coordination (T-034, D-003 narrowed by D-010): `ticket new`,
  `finding new`, `package new` and `decision create` produce `<type>-<ULID>` instead of scanning the
  branch for `max + 1`, so two agents on two branches can no longer be handed the same id. New entity
  files are named `slug-<short id>.md`; `.a-team/index.md` is merged with Git's `union` driver, which
  `a-team init` now records in `.gitattributes`. Existing sequential identifiers, filenames and
  references are untouched and stay valid indefinitely — `validate` accepts both forms and reports
  `DUPLICATE_ID` if two entities ever share one.

### Added

- `a-team ticket execute <id> --agent <agent>` (T-035, D-009): one command performs the start, assembles
  the brief and launches the agent with the brief as its only input, so per-ticket fresh context is the
  default path instead of coordinator discipline. It refuses before any mutation on a non-ready ticket, an
  existing claim or execution context, a dirty repository and a missing agent command; a non-zero exit or an
  empty result is reported as `agent-failed` with the claim and worktree preserved; an interrupt terminates
  the agent and names the manual decision. `--resume` reuses the existing execution context (retry, or a
  context created by `ticket start`) and `--inherit-context "<reason>"` is the explicit, logged exception to
  the fresh-context default. The output — human and `--json` — names the brief's token count, the agent, the
  branch and the worktree, and `ticket start` now names `ticket execute` as its next step.
- Initial installable skill collection for setup, ticket definition and execution, finding validation, package coordination, review submission, and safe ticket closure.
- Repository-native workflow model for tickets, packages, findings, profiles, and claims.
- Canonical CLI contract shared by skills, automation, and the future local UI.
- Git isolation rules for feature branches, claims, protected branches, and parallel worktrees.

## [0.2.2] - 2026-07-27

### Added

- Entity detail drawer in the local UI: clicking a ticket, finding, or package opens a drawer that renders its full contract and metadata from the workspace data, with clickable entity links and Discuss / Raw source actions (T-017).
