# Kotta

Kotta is a repository-native operating system for human–AI development teams.

It provides executable tickets, type-specific requirements, coordinated work packages, and strict Git isolation for coding agents—all stored as plain files in your repository.

> Humans own intent. Agents investigate and execute. Git isolates the work. The repository keeps the shared truth.

[See why Kotta exists and follow the visual onboarding guide.](https://arpadtamasi.github.io/kotta/)

## Install and create your first ticket

Prerequisites: Node.js 20 or newer, Git, and a coding-agent host supported by
`skills@1.5.20`. The guided slash-command path is verified with Codex; other hosts reported
by the installer may expose installed skills differently.

Install the public CLI and confirm the exact version:

```bash
npm install --global kotta@0.3.0
kotta --version
```

The binary is `kotta`. The pre-rename name `a-team` is installed as an alias of the same
entrypoint and reports the same version, so existing scripts keep working; new work should
use `kotta`. See [Renamed from A-Team](#renamed-from-a-team) if you already have a workspace.

Install the pinned skill collection from the public repository:

```bash
npx skills@1.5.20 add arpadtamasi/kotta
```

Then open an existing Git repository in the supported host and run:

```text
/setup-kotta
/define-ticket
```

`/setup-kotta` invokes the canonical `kotta init` operation and creates the local
`.kotta/` workspace. `/define-ticket` guides you through an executable work contract. Finish
by checking the generated ticket and workspace:

```bash
kotta ticket validate <ticket-id>
kotta validate
kotta status
```

Every command that creates an entity prints its identifier. New identifiers are minted
without coordination — `T-` plus a time-sortable ULID — so two agents on two branches can
never mint the same one, and their branches merge without renumbering. Identifiers created
before this rule (`T-034`, `F-008`, `P-005`, `D-003`) keep their sequential form forever; a
workspace with both kinds is valid and stays that way.

With Node, Git, and Codex already installed, this path is designed to take no more than five
minutes; the release canary records the measured result.

If `kotta` is not found, inspect `npm prefix --global`, ensure its `bin` directory is on
`PATH`, and reopen the terminal. If validation fails, read the reported missing section or
profile requirement, update the ticket through `/define-ticket`, and rerun both validation
commands. The CLI never treats a validation failure as a ready ticket.

## Renamed from A-Team

The product was called **A-Team** until 2026-08 (D-005, D-006). The rename costs an existing
workspace nothing — there is no migration step, and nothing in your repository has to change:

| Surface | Now | Pre-rename name |
| --- | --- | --- |
| npm package | `kotta` | `@arpadtamasi/a-team` (deprecated, points here) |
| CLI binary | `kotta` | `a-team` — still installed, same entrypoint, same version |
| Workspace directory | `.kotta/` — what `kotta init` creates | `.a-team/` — still discovered and used as-is |
| GitHub repository | `arpadtamasi/kotta` | `arpadtamasi/a-team` (redirects) |
| Environment overrides | `KOTTA_*` | `A_TEAM_*` — still read |

Directory discovery is one rule: **`.kotta/` if it is there, otherwise `.a-team/`.** The CLI
never renames a workspace behind your back, and `init` refuses to create a second one beside
an existing directory under either name.

If a project needs both names to resolve — a script, a tool, or a teammate's checkout expects
the other one — bridge them with a symlink instead of renaming:

```bash
# an existing .a-team/ workspace that should also answer to the new name
ln -s .a-team .kotta

# a .kotta/ workspace that must keep answering to the old name
ln -s .kotta .a-team
```

Both directions work, in the CLI and on the board. Only one of the two is a real directory,
and that is the one Git tracks and the board reads through Git plumbing; the symlink is a
convenience for humans and scripts, so commit it only if your team wants it committed.

The second direction is also how a project renames its directory without waiting for everyone:
after `mv .a-team .kotta && ln -s .kotta .a-team`, an older `a-team` install that knows nothing
about the new name keeps working against the same files.

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

All mutations go through the `kotta` CLI. Skills, automation, and a future local UI share the same command and validation services; none implements a competing workflow.

Open the local filesystem-backed board from an initialized repository:

```bash
kotta ui
```

This uses the current directory by default. To serve another checkout or address its
workspace directly, pass `--workspace <repository-root>` or `--workspace <repository-root>/.kotta`.

Without `--port`, the board starts at `4311` and advances to the next free port when that
one is taken, so a second workspace opens without any manual step; the output names the
port it selected. With an explicit `--port <port>` the choice is strict: an occupied port
fails with an actionable error instead of quietly moving to a neighbour.

Once the server is listening, the selected URL is opened in the default browser. `--no-open`
prints it without opening, and `--json` never opens anything because that mode is for
automation. A browser that refuses to open is a warning, never a startup failure — the board
keeps serving.

## Package coordinator branches

`kotta package start` runs a package on a deterministic coordinator branch, `coord/<package-id>`.
Started from the configured base branch it creates and checks out that branch and records the
branch, the base branch, and the base commit in the package file. Starting again on the recorded
branch is a safe no-op; starting from an unrelated branch is refused rather than guessed.

Completing the last ticket does **not** delete the coordinator branch — its final commit is what
gets integrated. `kotta package status <id>` reports where the package stands: `active`,
`done-unintegrated`, `cleanup-pending`, `blocked-*`, or `cleaned`.

Completing the last member ticket also completes the package itself, whether or not the package was
ever started — a package whose tickets ran one by one through `kotta ticket execute` is finished by
the last `ticket close` or `ticket cancel`, not left in `backlog`. `kotta package close <id> --approve`
is the explicit path for a package whose tickets reached `done` some other way: it moves the package to
`packages/done` from any state, refuses while a member ticket is not `done` and names it, never touches
a ticket, and is a no-op on an already finished package.

Once the branch is merged, `kotta package finalize <id>` performs the cleanup, and only what it
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
- `setup-kotta` — initialize a project workspace.
- `define-ticket` — investigate and formalize work.
- `validate-finding` — verify and disposition discovered work.
- `start-ticket` — safely claim and isolate a ready ticket.
- `execute-ticket` — implement one bounded ticket.
- `execute-package` — coordinate a package of tickets.
- `submit-review` — submit implementation with evidence.
- `close-ticket` — verify completion and safely release resources.
- `report-kotta-bug` — prepare and, after explicit approval, submit a Kotta defect report as a GitHub Issue.

## Report a bug

Defects in Kotta itself go to
[the issue form in `arpadtamasi/kotta`](https://github.com/arpadtamasi/kotta/issues/new?template=bug.yml).
The same destination and the same report contract serve every entry point:

- **Public site** — the `Report a bug` link in the header and footer of the onboarding site.
- **Local board** — the `Report a bug` link in the rail footer of `kotta ui`. The board sends
  nothing itself; it opens the GitHub form so you write and submit the report there.
- **Coding agent** — the installed `report-kotta-bug` skill. It inspects evidence, searches
  open issues for duplicates, sanitizes the draft, and shows you the exact repository, title,
  body, and diagnostic fields before asking to create the issue. Without approval nothing is
  sent. With an authenticated GitHub connector or `gh` session it creates the issue and returns
  its URL; without one it returns the complete report as copyable Markdown plus the form URL.

Every path reports the same five fields: summary, reproduction steps, expected behaviour,
actual behaviour, and Kotta version. Optional diagnostics (Node.js and OS version, the
redacted failing command output, the redacted `--json` error payload) are off by default and
require a separate per-report opt-in after the exact fields are shown. Kotta stores no GitHub
credential, and reporting never mutates your `.kotta` workspace.

Maintainers capture an incoming issue as evidence, not as scheduled work:

```bash
kotta finding new --title "<issue title>" --type bug \
  --evidence "https://github.com/arpadtamasi/kotta/issues/<n> — <reported facts>"
```

The finding stays open until `kotta finding validate` and a human-approved
`kotta finding resolve --disposition <disposition> --approve`. A GitHub Issue never creates a
ticket by itself.

## CLI overview

```bash
kotta init
kotta validate
kotta status

kotta ticket new --title "Add filtered export" --type feature --profile ui workflow
kotta ticket define T-014 --from /tmp/T-014-definition.md
kotta ticket validate T-014
kotta ticket ready T-014 --approve
kotta ticket start T-014 --agent codex
kotta ticket brief T-014 --out /tmp/T-014-brief.md
kotta ticket execute T-014 --agent claude
kotta ticket execute T-014 --resume
kotta ticket review T-014 --evidence "Acceptance tests and visual evidence passed" --pull-request PR-123
kotta ticket close T-014 --approve

kotta package validate P-012
kotta package ready P-012 --approve
kotta package start P-012 --agent codex
kotta package status P-012
kotta package close P-012 --approve

kotta finding new --title "Divergent permission checks" --type inconsistency --evidence "src/a.ts and src/b.ts differ"
kotta finding validate F-032
kotta finding resolve F-032 --disposition create-ticket --approve

kotta decision create --from /tmp/cutover-decision.md --approve

kotta claim list
kotta claim release T-014 --force
```

Every command supports `--json`. Mutations validate before writing and report both the violated rule and corrective action when rejected.

**Small contexts by default.** Each ticket executes in a fresh agent context whose intent input is `kotta ticket brief <id>` — the ticket body, its referenced decisions, its profiles and its claim, nothing else. The brief is deterministic and reports an approximate token count; above a threshold (`--warn-tokens`, default 12000) it warns that the ticket is probably too large or under-referenced. This is a quality gauge, not a thrift trick: if a ticket cannot be executed from its brief plus the code in the worktree, the contract is incomplete — record the gap instead of widening the context.

**`ticket execute` is the command that makes that the default (D-009).** `kotta ticket execute <id> --agent <agent>` does the start, assembles the brief and launches the agent with the brief as its only input — the caller's context never reaches it. It refuses before creating anything when the ticket is not ready, a claim or execution context already exists, the repository is dirty, or the agent command is missing, so a missing binary can never leave a half-built worktree. The output — human and `--json` — names the brief's token count, the agent, the branch and the worktree; record the token count per ticket in the run log.

A non-zero exit or an empty result is `agent-failed`: the claim and worktree are kept for inspection and the ticket does not move to review. An interrupt terminates the agent, keeps the claim and worktree, and names what to decide by hand. Retry with `kotta ticket execute <id> --resume`, which reuses the existing execution context (and is also how a context created by `ticket start` gets its agent) — a second plain `execute` always refuses rather than starting a second agent. Context carry-over is an explicit, logged exception: `--inherit-context "<reason>"` requires a reason, appends it to the prompt as a declared deviation and reports it in the output.

The agent binary is resolved from `--agent` (`claude`, `codex`, or any command on `PATH`); `KOTTA_AGENT_COMMAND` overrides the executable, which is how the test suite drives a deterministic script double instead of a real agent. Review, merge and close stay separate human gates — `execute` never enters them.

A decision draft contains `title` frontmatter and non-empty `Decision`, `Context`, and
`Consequences` sections. `decision create` requires explicit human approval, assigns the
next stable `D-001`-style identifier and current date (or validates supplied values), and
atomically publishes the validated record beneath `.kotta/decisions/`. Pass `--id D-001`
when a caller needs to reserve a specific stable identity; an existing identity is never
overwritten. The canonical filename is the identity alone (`D-001.md`), so different
titles cannot race around the identity reservation.

## Tests

`npx vitest run` runs the whole suite in one command. `tests/unit` and `tests/integration`
cover the CLI and run in Node. `tests/ui` holds component tests for the React board: they
render a real component from `ui/src/` with `@testing-library/react` in `jsdom`, and assert
what the user sees plus how the surface reacts to a click or an input. No browser is started —
`site/tests` is the separate Playwright suite, run with `npm run test:site`.

To add a UI test, copy [`tests/ui/done-stage.test.tsx`](tests/ui/done-stage.test.tsx). The
first line, `// @vitest-environment jsdom`, is what puts that file in a browser-like
environment; everything without it stays in Node, so a CLI test can never drift into `jsdom`.
Export the component you want to render from `ui/src/App.tsx` and keep the fixture local to
the test.

## Maintainer releases

`package.json#version` is the only release version source. Merge a reviewed version bump to
`main`, then create `v<version>` on that exact commit. The `npm release` workflow rejects a
tag/version mismatch or a commit outside `main`, runs the full tests, inspects the packed
allowlist, and exercises a clean install before publishing.

### The first release under the name `kotta`

The package name changed with 0.3.0, and a name that does not exist yet on the registry has no
trusted publisher configured — so the **first** `kotta` release is published by a maintainer by
hand, from a clean `main` checkout at the release commit:

```bash
npm run verify:pack                  # build, pack, inspect the allowlist
npm publish --access public          # first publish of the name `kotta`
```

Then point the old package at the new one, once:

```bash
npm deprecate @arpadtamasi/a-team "Renamed to 'kotta'. Install with: npm i -g kotta"
```

Afterwards configure Trusted Publishing for `kotta` on npmjs.com (repository
`arpadtamasi/kotta`, workflow `.github/workflows/npm-release.yml`, environment `npm-release`);
every later release goes back through the tag-driven workflow below and needs no local publish.

Publishing is limited to the `arpadtamasi/kotta` repository, `.github/workflows/npm-release.yml`,
and the `npm-release` GitHub environment through npm Trusted Publishing. The workflow receives
only `contents: read` and `id-token: write`; ordinary pushes and pull requests have no npm
credential. Published versions are immutable. If a version already exists or a post-publish
canary fails, correct it with a new patch version rather than attempting an overwrite.

## Scope

Kotta is intentionally local and file-based. V1 has no hosted service, database, authentication, automatic prioritization, automatic merging, scheduler daemon, or Jira/Linear synchronization.

## License

MIT. See [LICENSE](LICENSE).
