# AGENTS.md

This repository runs on **Kotta**. Work is defined, executed, reviewed and closed as plain files
in `.kotta/`, and every state change goes through Kotta's validated services via contract chat or
the `kotta` CLI fallback. Read this before you touch
anything.

## The rule everything else follows from

`.kotta/` is the canonical source of truth for work: contracts, observations, batches, lifecycle
state, claims and decisions. Chat, the board (`kotta ui`), pull requests and CI are views or
history — they never override `.kotta/`. Never hand-edit workspace files; use the CLI, which
validates before it writes and names the violated rule when it refuses.

## Orient yourself first

```bash
kotta status      # defined / active / review / blocked, and new observations
kotta validate    # is the workspace consistent
```

Project-specific settings — approval gates, base and protected branches, worktree policy, batch
parallelism — live in `.kotta/config.yaml`. Read it rather than assuming defaults.

## The lifecycle

```text
backlog → defined → active → review → done
```

| Step | Command | Who |
| --- | --- | --- |
| Capture intent | `kotta contract new --title "…" --type <type> [--profile …]` | human, or agent if allowed by config |
| Formalize | `kotta contract define <id> --from <file>` then `kotta contract validate <id>` | agent |
| Approve for execution | Contract chat approval, or `kotta contract sign <id> --approve` | **human only** |
| Execute | `kotta contract execute <id> --agent <agent>` | agent, in its own claim + branch + worktree |
| Submit | `kotta contract review <id> --evidence "…" --pull-request <ref>` | agent |
| Close | Contract chat approval, or `kotta contract close <id> --approve` | **human only** |

`contract execute` does the start, builds the brief and launches a fresh agent context whose only
input is `kotta contract brief <id>`. Resume an interrupted or failed run with `--resume`; a second
plain `execute` is refused rather than starting a second agent.

`contract start --caller` is the explicit inherited-context alternative. It returns the isolated
worktree to the current caller without launching another agent. Fresh remains the default.

Canonical live state, claims and visible conversation stay on `git.base_branch`; implementation
worktrees contain code and their original baseline, not a divergent lifecycle copy. Commands invoked
from any linked worktree route state changes back to the checked-out control worktree.

## Rules for agents

1. **No change without an active contract you hold the claim for.** If there is no contract, the
   work is not defined yet — say so instead of starting.
2. **Stay inside the contract's scope.** Anything you notice outside it becomes an observation, not
   a silent fix: `kotta observation new --title "…" --type <type> --evidence "…"`.
3. **An observation is not a contract.** It is dispositioned by `kotta observation validate <id>`
   and a human-approved `kotta observation resolve <id> --disposition <disposition> --approve`.
4. **Do not invent product intent or accepted trade-offs.** Ask the human. Durable answers are
   recorded with `kotta decision create --from <file> --approve`.
5. **Approval is a human gate.** Never click a chat approval or pass `--approve` on the human's behalf.
6. **One active contract = one claim, one feature branch, one worktree.** Parallel work uses
   separate worktrees. Never execute on a protected branch.
7. **Review needs acceptance-to-evidence mapping**; closing needs accepted review, integration and
   verified acceptance conditions.
8. **Execute from the brief unless `--caller` was explicit.** If the brief plus the code in the worktree is not enough to finish
   the contract, the contract is incomplete — record the gap; do not widen your context.

## Skills

If the Kotta skills are installed, prefer them — they encode the how: `explore-workspace`,
`setup-kotta`, `define-contract`, `validate-observation`, `start-contract`, `execute-contract`,
`execute-batch`, `submit-review`, `close-contract`, `report-kotta-bug`. If they are not installed,
the CLI above is the whole contract; nothing depends on the skills being present.

A defect in Kotta itself is not a contract here: use `report-kotta-bug`, or the issue form at
<https://github.com/arpadtamasi/kotta/issues>.

## This repository

Kotta's own source. Replace this section when you copy this file into another project.

```bash
npm test            # builds, then runs the vitest suite (unit, integration, ui)
npm run typecheck
npm run build       # cli + board + site
npm run test:site   # separate Playwright suite for site/
kotta ui            # the local board, served from Git, not the working tree
```

Node 20+. The published surface is the `kotta` binary; `a-team` is a kept alias of the same
entrypoint, and a pre-rename `.a-team/` workspace is still discovered as-is. See
[README.md](README.md) for the migration path and the release process.
