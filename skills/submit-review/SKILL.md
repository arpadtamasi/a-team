---
name: submit-review
description: Prepare evidence and submit an implemented A-Team ticket into review. Use when implementation is complete and a user or agent asks to request review, open or record a pull request, or move a ticket to review.
---

# Submit a ticket for review

Use `a-team ticket review` for the lifecycle mutation. Do not move the ticket file or edit status manually.

1. Confirm the active ticket, claim, branch, and worktree agree and the working tree is clean.
2. Run all required repository checks and ticket-specific verification.
3. Map every acceptance condition to concrete evidence. Verify the done checks of every active profile.
4. Confirm that unrelated discoveries are recorded as findings and that no hidden scope expansion remains.
5. Record the pull-request identifier or equivalent review target when available.
6. Add the review evidence required by the CLI: acceptance mapping, verification performed, deviations, findings created, and known concerns.
7. Run `a-team ticket review <ticket-id>` with supported evidence and pull-request options; use `--json` for automation.
8. Verify that the ticket is in review and the claim remains in place.

Do not claim acceptance or integration. If checks fail or evidence is incomplete, keep the ticket active and report the corrective action.
