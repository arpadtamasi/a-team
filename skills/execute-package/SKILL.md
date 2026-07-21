---
name: execute-package
description: Coordinate an A-Team sprint, milestone, batch, or mission with validated tickets, dependency-aware ordering, bounded parallelism, and isolated worktrees. Use when a user asks to start or execute a package of tickets.
---

# Execute a package

Use `a-team package start` as the canonical package mutation. Never bypass ticket-level validation or manually manufacture claims and worktrees.

1. Run `a-team package validate <package-id>` and inspect every referenced ticket.
2. Reject non-ready tickets unless an explicit supported configuration allows them. Surface missing dependencies, cycles, and likely file or branch conflicts.
3. Explain the calculated execution order, mode, parallelism, and stop-on-failure behavior.
4. Run `a-team package start <package-id> --agent <agent>`.
5. Start no more tickets than the configured parallelism permits. Parallel tickets must have separate claims, branches, and Git worktrees.
6. For each active ticket, follow the `execute-ticket` contract. Poll with `a-team package status <package-id>` and start newly unblocked work through supported CLI operations.
7. On failure, stop or continue exactly as configured. Report blocked dependencies and conflicts without weakening validation.
8. Keep package status current through CLI-backed ticket transitions.

One ticket maps to one feature branch and one review target. V1 never auto-merges tickets and does not use a package integration branch.
