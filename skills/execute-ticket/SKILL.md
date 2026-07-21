---
name: execute-ticket
description: Implement and verify one active A-Team ticket within its approved contract and isolated Git context. Use when an agent is asked to carry out, continue, or finish implementation for an active ticket.
---

# Execute a ticket

Work only in the branch and worktree recorded by the ticket's claim. A-Team state mutations belong to the `a-team` CLI; normal product-code edits use the repository's regular tools.

1. Validate the active ticket, claim, branch, worktree, dependencies, and protected-branch safety before editing.
2. Convert acceptance conditions and active-profile done checks into a concrete verification plan.
3. Make the smallest implementation that produces the ticket outcome. Preserve non-goals and constraints.
4. Classify discoveries as required for outcome, required for safe implementation, optional improvement, separate finding, or definition contradiction.
5. Include only the first two categories when supported by the contract. Create unrelated work with `a-team finding new`; do not silently expand scope.
6. Stop for missing product intent, an unsafe expansion, or a definition contradiction. Record the issue and use a legal CLI transition back to ready or backlog when required.
7. Run the repository checks and ticket-specific verification. Capture exact, reproducible evidence for every acceptance condition and profile requirement.
8. Keep implementation and A-Team state changes committed on the feature branch and leave the working tree clean before review.

Do not merge, close, or claim acceptance. Execution produces an implementation candidate and evidence; review remains a separate state.
