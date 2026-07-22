# A-Team

A-Team is a repository-native operating system for human–AI development teams.

It provides executable tickets, type-specific requirements, coordinated work packages, and strict Git isolation for coding agents—all stored as plain files in your repository.

> Humans own intent. Agents investigate and execute. Git isolates the work. The repository keeps the shared truth.

[See why A-Team exists and follow the visual onboarding guide.](https://arpadtamasi.github.io/a-team/)

## Install and create your first ticket

Prerequisites: Node.js 20 or newer, Git, and a coding-agent host supported by
`skills@1.5.20`. The guided slash-command path is verified with Codex; other hosts reported
by the installer may expose installed skills differently.

Install the public CLI and confirm the exact version:

```bash
npm install --global @arpadtamasi/a-team@0.1.2
a-team --version
```

Install the pinned skill collection from the public repository:

```bash
npx skills@1.5.20 add arpadtamasi/a-team
```

Then open an existing Git repository in the supported host and run:

```text
/setup-a-team
/define-ticket
```

`/setup-a-team` invokes the canonical `a-team init` operation and creates the local
`.a-team/` workspace. `/define-ticket` guides you through an executable work contract. Finish
by checking the generated ticket and workspace:

```bash
a-team ticket validate T-001
a-team validate
a-team status
```

With Node, Git, and Codex already installed, this path is designed to take no more than five
minutes; the release canary records the measured result.

If `a-team` is not found, inspect `npm prefix --global`, ensure its `bin` directory is on
`PATH`, and reopen the terminal. If validation fails, read the reported missing section or
profile requirement, update the ticket through `/define-ticket`, and rerun both validation
commands. The CLI never treats a validation failure as a ready ticket.

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

- `explore-workspace` — answer cross-workspace questions about themes, related work, overlaps, decisions, and backlog structure without changing PM state.
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
a-team ticket define T-014 --from /tmp/T-014-definition.md
a-team ticket validate T-014
a-team ticket ready T-014 --approve
a-team ticket start T-014 --agent codex
a-team ticket review T-014 --evidence "Acceptance tests and visual evidence passed" --pull-request PR-123
a-team ticket close T-014 --approve

a-team package validate P-012
a-team package ready P-012 --approve
a-team package start P-012 --agent codex
a-team package status P-012

a-team finding new --title "Divergent permission checks" --type inconsistency --evidence "src/a.ts and src/b.ts differ"
a-team finding validate F-032
a-team finding resolve F-032 --disposition create-ticket --approve

a-team claim list
a-team claim release T-014 --force
```

Every command supports `--json`. Mutations validate before writing and report both the violated rule and corrective action when rejected.

## Maintainer releases

`package.json#version` is the only release version source. Merge a reviewed version bump to
`main`, then create `v<version>` on that exact commit. The `npm release` workflow rejects a
tag/version mismatch or a commit outside `main`, runs the full tests, inspects the packed
allowlist, and exercises a clean install before publishing.

Publishing is limited to the `arpadtamasi/a-team` repository, `.github/workflows/npm-release.yml`,
and the `npm-release` GitHub environment through npm Trusted Publishing. The workflow receives
only `contents: read` and `id-token: write`; ordinary pushes and pull requests have no npm
credential. Published versions are immutable. If a version already exists or a post-publish
canary fails, correct it with a new patch version rather than attempting an overwrite.

## Scope

A-Team is intentionally local and file-based. V1 has no hosted service, database, authentication, automatic prioritization, automatic merging, scheduler daemon, or Jira/Linear synchronization.

## License

MIT. See [LICENSE](LICENSE).
