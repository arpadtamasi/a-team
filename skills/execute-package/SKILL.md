---
name: execute-package
description: Coordinate a Kotta sprint, milestone, batch, or mission with validated tickets, dependency-aware ordering, bounded parallelism, and isolated worktrees. Use when a user asks to start or execute a package of tickets.
---

# Execute a package

Use `kotta package start` as the canonical package mutation. Never bypass ticket-level validation or manually manufacture claims and worktrees.

1. Run `kotta package validate <package-id>` and inspect every referenced ticket.
2. Reject non-ready tickets unless an explicit supported configuration allows them. Surface missing dependencies, cycles, and likely file or branch conflicts.
3. Explain the calculated execution order, mode, parallelism, and stop-on-failure behavior.
4. Run `kotta package start <package-id> --agent <agent>`.
5. Start no more tickets than the configured parallelism permits. Parallel tickets must have separate claims, branches, and Git worktrees.
6. **Fresh context per ticket (D-009, default):** launch every ticket with `kotta ticket execute <ticket-id>` — never with your accumulated conversation. Use `--resume` for a ticket whose execution context `package start` already created, and `--agent <agent>` for one that has none yet. The command starts the ticket, assembles its brief and runs the ticket agent on that brief alone; do not hand-assemble start + brief + agent launch, and never implement a ticket in your own context. The coordinator stays thin: it sequences, gates and records. Record each ticket's brief token count — `execute` reports it in its output and in `--json` — in the run log. Context carry-over is an explicit, logged exception: `--inherit-context "<reason>"`.
7. **Handle execution outcomes through the command:** `agent-failed` (non-zero exit or empty result) keeps the claim and worktree for inspection — retry with `kotta ticket execute <ticket-id> --resume`, which reuses that context instead of creating a second one. A plain repeat `execute` on a claimed ticket refuses by design. `execute` never enters review, merge or close.
8. For each active ticket, the fresh agent follows the `execute-ticket` contract. Poll with `kotta package status <package-id>` and start newly unblocked work through supported CLI operations.
9. On failure, stop or continue exactly as configured. Report blocked dependencies and conflicts without weakening validation.
10. Keep package status current through CLI-backed ticket transitions. Closing or cancelling the last member ticket completes the package on its own, from any package state. If its tickets reached `done` some other way, complete it explicitly with `kotta package close <package-id> --approve`; it refuses while any member is not `done` and never edits a ticket.

One ticket maps to one feature branch and one review target. V1 never auto-merges tickets and does not use a package integration branch.
