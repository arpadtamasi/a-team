---
name: a-team
description: 'Router to the repository Scrum control plane and A-Team package issue intake. Use for ANY project-management lifecycle operation, including when the user does not know Scrum terminology and asks in ordinary language to write down work, talk through tasks, decide what comes next, begin work, check whether it is finished, or report an A-Team package issue. Invoke as /a-team <operation> or just describe the desired outcome (for example: "beszéljük át a feladatokat", "vegyük fel ezt", "mi jön most?", or "jelentsd ezt az A-Team hibát").'
---

# Scrum and package-feedback router

The package root holds the full Scrum method (`METHOD.md`, `schemas/`, `skills/`,
`PROCESSES.md`, `GSTACK.md`, and `GLOSSARY.md`); the project data it operates on — backlog,
tickets, sprint, and events — always lives under `a-team/` at the repository root. This
`SKILL.md` only routes: it loads the owning operational procedure and follows it. Never
improvise a project-management state change outside an owning skill.

Resolve the package root before routing:

- In the A-Team source repository, use the repository-root package files even when this
  router was discovered through `.claude/skills/a-team/SKILL.md`; that path is a thin local
  adapter to the same root bytes, not a second installation.
- In a consuming repository, use the installed package at `.claude/skills/a-team/`.

The repository-root package is the only editable product source. Never create or prefer a
copied local package inside the A-Team source repository.

The user never needs to know an operation name. Communicate the immediate outcome in plain
language first and mention the canonical A-Team term secondarily. Use `GLOSSARY.md` for the
shared translation; preserve the owning skill's approval gates.

## Procedure

1. Resolve the requested operation to one owner using the lifecycle-ownership table in the
   live package's `METHOD.md`. The operations are the directories under its `skills/`:
   `init-workspace`, `capture-work`, `refine-ticket`, `plan-sprint`, `start-ticket`, `block-ticket`,
   `submit-review`, `review-ticket`, `close-ticket`, `disposition-ticket`,
   `reconcile-history`, `close-sprint`, `retro`, `report-status`, `report-metrics`, `howto`,
   `report-issue`.
2. If the argument names an operation, use it. If the request is in natural language, pick
   the owner per the ownership table. If the right operation is unclear, run
   live package's `skills/howto/SKILL.md` (read-only routing guidance) instead of guessing.
3. Read the live package's `skills/<operation>/SKILL.md` in full and follow it exactly. It
   will direct you to the live `METHOD.md` and `schemas/` contracts as needed.
4. Respect every human approval gate the procedure declares — do not auto-decide them.

`report-issue` is external package feedback intake. It targets only
`arpadtamasi/a-team`, does not change Scrum state, and searches open and closed GitHub issues
before creating anything.

For the full delivery loop of one committed ticket (start → implement → review → ship →
close), use the `ticket-cycle` skill instead of chaining operations here manually.
