# A-Team

A-Team is a repository-native operating system for human–AI development teams.

It provides executable tickets, type-specific requirements, coordinated work packages, and strict Git isolation for coding agents—all stored as plain files in your repository.

> Humans own intent. Agents investigate and execute. Git isolates the work. The repository keeps the shared truth.

## Install

Install the skill collection from the public repository:

```bash
npx skills@latest add arpadtamasi/a-team
```

Then initialize A-Team in a Git repository:

```text
/setup-a-team
```

The skill invokes the canonical CLI operation, `a-team init`, which creates the `.a-team/` workspace. Run `a-team status` to inspect it and use `/define-ticket` to turn a request into an executable work contract.

## How it works

The repository filesystem is the source of truth. Tickets move through a deliberately small lifecycle:

```text
backlog → ready → active → review → done
```

- Tickets define an observable outcome, bounded scope, acceptance conditions, and verification.
- Profiles add work-specific requirements for bugs, UI, performance, workflows, metrics, refactors, and discovery.
- Packages coordinate sprints, milestones, batches, or missions with sequential, parallel, or dependency-aware execution.
- Findings capture possible bugs and technical debt without silently expanding active work.
- Claims connect each active ticket to one agent, one feature branch, and one isolated execution context.

All mutations go through the `a-team` CLI. Skills, automation, and a future local UI share the same command and validation services; none implements a competing workflow.

## Core safety rules

- A backlog item is not executable until it is valid and explicitly ready.
- A finding is not automatically a ticket.
- Agents do not invent missing product intent or accepted trade-offs.
- Every active ticket has at most one claim and one feature branch.
- Parallel execution uses separate Git worktrees.
- Execution never edits a protected branch.
- Review requires acceptance-to-evidence mapping.
- Closing requires accepted review, integration, and verified acceptance.
- Unsafe branch or worktree cleanup is refused.

## Skills

- `setup-a-team` — initialize a project workspace.
- `define-ticket` — investigate and formalize work.
- `validate-finding` — verify and disposition discovered work.
- `start-ticket` — safely claim and isolate a ready ticket.
- `execute-ticket` — implement one bounded ticket.
- `execute-package` — coordinate a package of tickets.
- `submit-review` — submit implementation with evidence.
- `close-ticket` — verify completion and safely release resources.

## CLI overview

```bash
a-team init
a-team validate
a-team status

a-team ticket new --title "Add filtered export" --type feature --profile ui workflow
a-team ticket validate T-014
a-team ticket ready T-014 --approve
a-team ticket start T-014 --agent codex
a-team ticket review T-014 --evidence "Acceptance tests and visual evidence passed" --pull-request PR-123
a-team ticket close T-014 --approve

a-team package validate P-012
a-team package start P-012 --agent codex
a-team package status P-012

a-team finding new --title "Divergent permission checks" --type inconsistency --evidence "src/a.ts and src/b.ts differ"
a-team finding validate F-032
a-team finding resolve F-032 --disposition create-ticket --approve

a-team claim list
a-team claim release T-014 --force
```

Every command supports `--json`. Mutations validate before writing and report both the violated rule and corrective action when rejected.

## Scope

A-Team is intentionally local and file-based. V1 has no hosted service, database, authentication, automatic prioritization, automatic merging, scheduler daemon, or Jira/Linear synchronization.

## License

MIT. See [LICENSE](LICENSE).
