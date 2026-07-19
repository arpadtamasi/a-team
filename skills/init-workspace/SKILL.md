---
name: init-workspace
description: This skill should be used when the user asks to "initialize A-Team", "set up the Scrum workspace", "bootstrap a-team/", "enable A-Team in this repository", "inicializáld az A-Teamet", or "ebben a workspace-ben is ez a rendszer menjen". It creates the minimal canonical Scrum infrastructure exactly once without importing work, starting a sprint, or inventing project state. Do not use it to repair partial history, migrate an existing backlog, capture GitHub issues, or reinitialize an active workspace.
compatibility: Requires repository filesystem access and the A-Team method and schemas.
---

# Initialize Workspace

Bootstrap the minimum canonical project-management structure required by `capture-work` and
the later lifecycle operations. Create infrastructure only; do not create work or imply that
delivery has begun.

## Boundary

Create only:

- `a-team/backlog.md` in the exact empty form defined by `schemas/backlog.md`;
- `a-team/tickets/` with a tracked `.gitkeep` placeholder when no ticket exists;
- `a-team/metrics/events.jsonl` as an empty append-only event log.

Do not create:

- a ticket, ticket ID, backlog entry, estimate, dependency, priority decision, or event;
- `a-team/sprint.md`, a sprint archive, retrospective, metric summary, branch, commit, or PR;
- copied GitHub issues, gstack tasks, legacy TODOs, or inferred historical records;
- alternate directories, schemas, templates, or sample data.

Initialization has no lifecycle event because no project-management entity transitions.
Record no timestamp or token usage.

## Resolve the live package

1. Read `AGENTS.md`.
2. Locate the live A-Team package. In the A-Team source repository, read root `METHOD.md`,
   `schemas/backlog.md`, `schemas/ticket.md`, and `schemas/events.md`. In an installed
   consuming repository, read the corresponding files under `.claude/skills/a-team/`.
3. Stop and report any disagreement between the selected method, schemas, and this skill.

Never mix source-package and installed-package versions in one initialization.

## Inspect before writing

Inspect the complete repository state relevant to bootstrapping:

- any existing `a-team/` files and directories;
- legacy backlog, TODO, sprint, ticket, event, or project-management artifacts;
- Git status and ignored-file rules that could hide canonical artifacts;
- repository instructions that define another project-management source of truth.

Classify the workspace:

- **absent**: no `a-team/` control-plane artifacts exist — initialization may proceed;
- **initialized**: the canonical backlog, ticket directory, and event log exist and validate
  — report idempotent success without rewriting them;
- **partial or conflicting**: only some artifacts exist, data appears under an alternate
  path, or another writable backlog is canonical — stop without mutation and request an
  explicit migration or reconciliation decision.

Do not treat an empty `a-team/` directory as initialized. Do not overwrite, merge, move, or
delete existing project-management data during bootstrap.

## Initialize exactly once

Immediately recheck that no `a-team/` artifact appeared after inspection.

1. Create `a-team/backlog.md` from the exact minimal initialized form in
   `schemas/backlog.md`.
2. Create `a-team/tickets/.gitkeep` as an empty placeholder so a clone preserves the required
   ticket directory. Remove it only when repository convention deliberately replaces the
   placeholder; its presence does not count as a ticket.
3. Create `a-team/metrics/events.jsonl` as a zero-byte file. Do not append an initialization
   event or blank JSON object.

Treat the three artifacts as one atomic bootstrap candidate. If a write fails, remove only
new incomplete artifacts created by this invocation when doing so is unambiguous and safe;
otherwise report the partial state and stop.

## Validation

Confirm:

- `a-team/backlog.md` matches the exact empty backlog schema;
- `a-team/tickets/` exists and contains no Markdown tickets;
- `a-team/tickets/.gitkeep` is empty;
- `a-team/metrics/events.jsonl` exists, is zero bytes, and contains no invalid placeholder;
- `a-team/sprint.md`, sprint archives, retrospectives, metric summaries, tickets, events, and
  alternate backlogs were not created;
- no existing file, Git branch, index, commit, remote, issue, or external system changed;
- the resulting artifacts are not ignored and appear in the repository diff.

After validation, `capture-work` may create the first ticket. Initialization itself does not
authorize capturing any surfaced work.

## Output

Report whether initialization was created, already valid, or refused. List the three
canonical artifacts, confirm that no sprint or ticket exists, state that the event log is
empty, identify any legacy backlog requiring a separate migration decision, and report that
Git commit or publication remains a separate action.
