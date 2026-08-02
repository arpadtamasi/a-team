---
name: start-contract
description: Safely start a defined Kotta contract with its claim, feature branch, and isolated worktree. Use when a user or batch coordinator asks an agent to begin or claim a contract for implementation.
---

# Start a contract

The canonical start operation is `kotta contract start`; do not manually move contract files or assemble claims, branches, or worktrees.

Prefer `kotta contract execute <contract-id> --agent <agent>`: it performs this start and then runs the contract in a fresh agent context on the brief alone (D-009). Use a bare `contract start` only when the execution context must exist before the agent runs; then launch it with `kotta contract execute <contract-id> --resume`, which the start output names.

1. Read the defined contract, active profiles, dependencies, constraints, and repository configuration.
2. Summarize the outcome, in-scope work, non-goals, verification contract, and unresolved risk before execution.
3. Confirm the repository is clean and the configured base branch is available. Do not implement on `main`, `master`, `develop`, or another protected branch.
4. Run `kotta contract start <contract-id> --agent <agent>` from the repository root. Use `--json` when another tool will consume the result.
5. Verify that the CLI created exactly one claim, a correctly named feature branch, and the configured worktree; verify that the contract is active.
6. Perform all subsequent work only in the reported execution context.

Refuse duplicate claims, conflicting branches, dirty unsafe state, invalid defined contracts, and unexpected non-empty worktree paths. Do not recover with manual filesystem edits. A forced claim release must clearly describe risk and must never discard uncommitted work.
