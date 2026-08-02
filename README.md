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
a-team ticket validate <ticket-id>
a-team validate
a-team status
```

Every command that creates an entity prints its identifier. New identifiers are minted
without coordination — `T-` plus a time-sortable ULID — so two agents on two branches can
never mint the same one, and their branches merge without renumbering. Identifiers created
before this rule (`T-034`, `F-008`, `P-005`, `D-003`) keep their sequential form forever; a
workspace with both kinds is valid and stays that way.

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

Open the local filesystem-backed board from an initialized repository:

```bash
a-team ui
```

This uses the current directory by default. To serve another checkout or address its
workspace directly, pass `--workspace <repository-root>` or `--workspace <repository-root>/.a-team`.

Without `--port`, the board starts at `4311` and advances to the next free port when that
one is taken, so a second workspace opens without any manual step; the output names the
port it selected. With an explicit `--port <port>` the choice is strict: an occupied port
fails with an actionable error instead of quietly moving to a neighbour.

## Package coordinator branches

`a-team package start` runs a package on a deterministic coordinator branch, `coord/<package-id>`.
Started from the configured base branch it creates and checks out that branch and records the
branch, the base branch, and the base commit in the package file. Starting again on the recorded
branch is a safe no-op; starting from an unrelated branch is refused rather than guessed.

Completing the last ticket does **not** delete the coordinator branch — its final commit is what
gets integrated. `a-team package status <id>` reports where the package stands: `active`,
`done-unintegrated`, `cleanup-pending`, `blocked-*`, or `cleaned`.

Once the branch is merged, `a-team package finalize <id>` performs the cleanup, and only what it
can prove is safe: it verifies by Git ancestry that the coordinator head is contained in the base
branch or its remote-tracking ref, switches to the base, fast-forwards it when needed, and deletes
the merged local branch with `git branch -d`. A dirty worktree, an active claim, a linked ticket
worktree, a branch held by another worktree, or a diverged base each stop it with an explanation
and change nothing. It never forces, resets, rebases, or deletes a remote branch, and re-running it
after success is a no-op.

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
- `report-a-team-bug` — prepare and, after explicit approval, submit an A-Team defect report as a GitHub Issue.

## Report a bug

Defects in A-Team itself go to
[the issue form in `arpadtamasi/a-team`](https://github.com/arpadtamasi/a-team/issues/new?template=bug.yml).
The same destination and the same report contract serve every entry point:

- **Public site** — the `Report a bug` link in the header and footer of the onboarding site.
- **Local board** — the `Report a bug` link in the rail footer of `a-team ui`. The board sends
  nothing itself; it opens the GitHub form so you write and submit the report there.
- **Coding agent** — the installed `report-a-team-bug` skill. It inspects evidence, searches
  open issues for duplicates, sanitizes the draft, and shows you the exact repository, title,
  body, and diagnostic fields before asking to create the issue. Without approval nothing is
  sent. With an authenticated GitHub connector or `gh` session it creates the issue and returns
  its URL; without one it returns the complete report as copyable Markdown plus the form URL.

Every path reports the same five fields: summary, reproduction steps, expected behaviour,
actual behaviour, and A-Team version. Optional diagnostics (Node.js and OS version, the
redacted failing command output, the redacted `--json` error payload) are off by default and
require a separate per-report opt-in after the exact fields are shown. A-Team stores no GitHub
credential, and reporting never mutates your `.a-team` workspace.

Maintainers capture an incoming issue as evidence, not as scheduled work:

```bash
a-team finding new --title "<issue title>" --type bug \
  --evidence "https://github.com/arpadtamasi/a-team/issues/<n> — <reported facts>"
```

The finding stays open until `a-team finding validate` and a human-approved
`a-team finding resolve --disposition <disposition> --approve`. A GitHub Issue never creates a
ticket by itself.

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
a-team ticket brief T-014 --out /tmp/T-014-brief.md
a-team ticket execute T-014 --agent claude
a-team ticket execute T-014 --resume
a-team ticket review T-014 --evidence "Acceptance tests and visual evidence passed" --pull-request PR-123
a-team ticket close T-014 --approve

a-team package validate P-012
a-team package ready P-012 --approve
a-team package start P-012 --agent codex
a-team package status P-012

a-team finding new --title "Divergent permission checks" --type inconsistency --evidence "src/a.ts and src/b.ts differ"
a-team finding validate F-032
a-team finding resolve F-032 --disposition create-ticket --approve

a-team decision create --from /tmp/cutover-decision.md --approve

a-team claim list
a-team claim release T-014 --force
```

Every command supports `--json`. Mutations validate before writing and report both the violated rule and corrective action when rejected.

**Small contexts by default.** Each ticket executes in a fresh agent context whose intent input is `a-team ticket brief <id>` — the ticket body, its referenced decisions, its profiles and its claim, nothing else. The brief is deterministic and reports an approximate token count; above a threshold (`--warn-tokens`, default 12000) it warns that the ticket is probably too large or under-referenced. This is a quality gauge, not a thrift trick: if a ticket cannot be executed from its brief plus the code in the worktree, the contract is incomplete — record the gap instead of widening the context.

**`ticket execute` is the command that makes that the default (D-009).** `a-team ticket execute <id> --agent <agent>` does the start, assembles the brief and launches the agent with the brief as its only input — the caller's context never reaches it. It refuses before creating anything when the ticket is not ready, a claim or execution context already exists, the repository is dirty, or the agent command is missing, so a missing binary can never leave a half-built worktree. The output — human and `--json` — names the brief's token count, the agent, the branch and the worktree; record the token count per ticket in the run log.

A non-zero exit or an empty result is `agent-failed`: the claim and worktree are kept for inspection and the ticket does not move to review. An interrupt terminates the agent, keeps the claim and worktree, and names what to decide by hand. Retry with `a-team ticket execute <id> --resume`, which reuses the existing execution context (and is also how a context created by `ticket start` gets its agent) — a second plain `execute` always refuses rather than starting a second agent. Context carry-over is an explicit, logged exception: `--inherit-context "<reason>"` requires a reason, appends it to the prompt as a declared deviation and reports it in the output.

The agent binary is resolved from `--agent` (`claude`, `codex`, or any command on `PATH`); `A_TEAM_AGENT_COMMAND` overrides the executable, which is how the test suite drives a deterministic script double instead of a real agent. Review, merge and close stay separate human gates — `execute` never enters them.

A decision draft contains `title` frontmatter and non-empty `Decision`, `Context`, and
`Consequences` sections. `decision create` requires explicit human approval, assigns the
next stable `D-001`-style identifier and current date (or validates supplied values), and
atomically publishes the validated record beneath `.a-team/decisions/`. Pass `--id D-001`
when a caller needs to reserve a specific stable identity; an existing identity is never
overwritten. The canonical filename is the identity alone (`D-001.md`), so different
titles cannot race around the identity reservation.

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
