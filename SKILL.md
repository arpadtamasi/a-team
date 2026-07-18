---
name: a-team
description: 'Router to the repository Scrum control plane. Use for ANY project-management lifecycle operation: capturing or refining backlog work, planning or closing the sprint, starting/blocking/submitting/reviewing/closing a ticket, parking or rejecting work, status or metrics reporting, history reconciliation, and retros. Invoke as /a-team <operation> (e.g. /scrum plan-sprint) or whenever the user asks for such an operation in their own words ("vegyük fel a backlogra", "indítsd a sprintet", "zárd le a ticketet", "mi az állás").'
---

# Scrum router

This directory holds the full Scrum method (METHOD.md, schemas/, skills/, PROCESSES.md,
GSTACK.md); the project data it operates on — backlog, tickets, sprint, events — lives
under `scrum/` at the repository root. This SKILL.md only routes: it loads the owning
operational procedure and follows it. Never improvise a project-management state change
outside an owning skill.

## Procedure

1. Resolve the requested operation to one owner using the lifecycle-ownership table in
   `.claude/skills/a-team/METHOD.md`. The operations are the directories under `.claude/skills/a-team/skills/`:
   `capture-work`, `refine-ticket`, `plan-sprint`, `start-ticket`, `block-ticket`,
   `submit-review`, `review-ticket`, `close-ticket`, `disposition-ticket`,
   `reconcile-history`, `close-sprint`, `retro`, `report-status`, `report-metrics`, `howto`.
2. If the argument names an operation, use it. If the request is in natural language, pick
   the owner per the ownership table. If the right operation is unclear, run
   `.claude/skills/a-team/skills/howto/SKILL.md` (read-only routing guidance) instead of guessing.
3. Read `.claude/skills/a-team/skills/<operation>/SKILL.md` in full and follow it exactly. It will direct
   you to the shared contracts (`.claude/skills/a-team/METHOD.md`, `.claude/skills/a-team/schemas/`) as needed.
4. Respect every human approval gate the procedure declares — do not auto-decide them.

For the full delivery loop of one committed ticket (start → implement → review → ship →
close), use the `ticket-cycle` skill instead of chaining operations here manually.
