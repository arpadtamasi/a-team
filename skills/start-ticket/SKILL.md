---
name: start-ticket
description: Safely start a ready A-Team ticket with its claim, feature branch, and isolated worktree. Use when a user or package coordinator asks an agent to begin or claim a ticket for implementation.
---

# Start a ticket

The canonical start operation is `a-team ticket start`; do not manually move ticket files or assemble claims, branches, or worktrees.

1. Read the ready ticket, active profiles, dependencies, constraints, and repository configuration.
2. Summarize the outcome, in-scope work, non-goals, verification contract, and unresolved risk before execution.
3. Confirm the repository is clean and the configured base branch is available. Do not implement on `main`, `master`, `develop`, or another protected branch.
4. Run `a-team ticket start <ticket-id> --agent <agent>` from the repository root. Use `--json` when another tool will consume the result.
5. Verify that the CLI created exactly one claim, a correctly named feature branch, and the configured worktree; verify that the ticket is active.
6. Perform all subsequent work only in the reported execution context.

Refuse duplicate claims, conflicting branches, dirty unsafe state, invalid ready tickets, and unexpected non-empty worktree paths. Do not recover with manual filesystem edits. A forced claim release must clearly describe risk and must never discard uncommitted work.
