---
name: close-ticket
description: Safely complete an accepted and integrated A-Team ticket, release its claim and Git resources, and update package status. Use when a reviewed ticket has been accepted and merged or otherwise integrated.
---

# Close a ticket

Use `a-team ticket close` as the canonical completion operation. Never delete claims, branches, worktrees, or canonical ticket files by hand.

1. Verify recorded review acceptance, merged or integrated status, acceptance evidence, and all active-profile completion checks.
2. Confirm the final resolution, normally `completed`; use another supported resolution only when it truthfully describes the outcome.
3. Inspect the claimed worktree and branch for uncommitted or unintegrated work. Stop rather than delete unsafe Git resources.
4. Run `a-team ticket close <ticket-id>` with the required approval, integration, and resolution inputs.
5. Verify that the ticket moved to done, the claim was released, safe worktree and local-branch cleanup occurred, the containing package was updated, and `.a-team/index.md` was regenerated.
6. Report any resource intentionally retained and the exact safe follow-up.

A merge alone is insufficient: completion requires accepted review and verified acceptance. Rejected review returns through a legal CLI transition instead of being closed.
