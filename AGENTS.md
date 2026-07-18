# AGENTS.md — repository working rules

Repository-level instructions for every coding agent, regardless of model. This is the
canonical instruction file; keep per-model behavior files only when a tool technically
requires one (point them here).

A-Team ships this file at its own repository root. When you adopt A-Team in your project,
copy this file to your repository root and adapt the project-specific parts. The Scrum
method under `.claude/skills/a-team/` references two rules defined here — the **found-work
(Boy Scout) rule** and the **code guidelines** — so keep those intact.

## Sources of truth

Work is grounded in repository artifacts, not prior chat history. Important artifacts:

- `AGENTS.md` — durable, repository-level working rules;
- `.claude/skills/a-team/METHOD.md` — Scrum method definitions and data model;
- `.claude/skills/a-team/PROCESSES.md` — human-readable process map;
- `.claude/skills/a-team/GSTACK.md` — the boundary between the Scrum lifecycle control plane and optional external expert workflows;
- `scrum/backlog.md` — current priority and backlog state;
- `scrum/sprint.md` — the active sprint (only while one exists);
- `scrum/tickets/` — durable work contracts;
- `.claude/skills/a-team/schemas/` — exact shared project-management shapes and formulas.

Do not silently resolve a conflict between artifacts: name it and report it.

## Project management: the Scrum control plane

Do not change project-management state by improvising. For planning, refinement, starting,
review, blocking, closing, measurement, and retros, use the matching skill under
`.claude/skills/a-team/skills/`; the canonical definitions live in
`.claude/skills/a-team/METHOD.md` and `.claude/skills/a-team/schemas/`. Operations include:

- choosing and explaining the correct PM process (`howto`);
- backlog capture and refinement (`capture-work`, `refine-ticket`);
- sprint planning (`plan-sprint`);
- starting, blocking, submitting, reviewing, and closing a ticket
  (`start-ticket`, `block-ticket`, `submit-review`, `review-ticket`, `close-ticket`);
- parking or rejecting work without claiming delivery (`disposition-ticket`);
- append-only correction of proven historical errors (`reconcile-history`);
- sprint closure and demo report (`close-sprint`); metrics (`report-metrics`); retro (`retro`).

A normal coding task does not need the full method loaded — only when project-management
state must change.

External expert workflows (discovery, planning, investigation, review, QA, ship) provide
plans, findings, and evidence; they NEVER own a Scrum ticket or sprint transition. When both
systems are involved, `.claude/skills/a-team/GSTACK.md` governs the boundary.

## The Boy Scout rule: capture every concrete finding

Discovered technical debt must not vanish into a report or silently merge into the running
ticket.

When implementation, investigation, verification, or review reveals a concrete, actionable
problem, create (or link) a backlog ticket with `capture-work`: defects, unsafe edge cases,
code smells, needless complexity, duplication, broken responsibilities, security/privacy/
data-loss/performance risks, missing tests.

- Search for an existing ticket first, and link rather than duplicate.
- One ticket per independently actionable finding; preserve the evidence, affected paths,
  consequence, severity, and source.
- Capturing a ticket does NOT authorize fixing it inside the running change: fix now only if
  the active ticket's outcome or acceptance criteria require it. Otherwise keep the diff
  surgical, and file the new ticket unestimated and out of sprint.
- A blocker-level security/privacy/data-loss finding also blocks review/closure when the
  current candidate carries the risk — the backlog ticket is not an exemption.
- Do not manufacture noise tickets from unfounded hypotheses or taste. The threshold is a
  concrete, repository-grounded, actionable problem.

## Code guidelines (against common LLM mistakes)

Caution over speed; use judgment on trivial tasks.

1. **Think before coding.** State your assumptions; if unsure, ask. With multiple readings,
   do not silently pick one — lay them out. If there is a simpler path, say so. If something
   is unclear, stop, name it, ask. If the ticket is explicit and the decision is reversible,
   decide sensibly instead of blocking on needless questions.
2. **Simplicity first.** The least code that solves it, nothing speculative. No unrequested
   abstraction or "flexibility", no error handling for impossible cases. If 200 lines could
   be 50, rewrite it.
3. **Surgical changes.** Only what is necessary. Do not "fix" adjacent code, comments, or
   formatting, do not refactor what is not broken, match the existing style. Clean up only
   the orphans of your own change; flag and ticket foreign dead code, do not delete it. Every
   changed line should trace back to the request.
4. **Goal-driven execution.** A verifiable success criterion, and loop until green. "Fix the
   bug" means first a test that reproduces it, then green. For multi-step work, a short plan
   plus per-step verification. Generated code, one passing command, or an agent's self-
   assessment is not by itself proof of done.
5. **Delegate mechanical work to a cheaper subagent.** Large, repetitive, unambiguous,
   mechanically checkable work (bulk search/replace, many-file lookup) goes to a cheaper,
   faster subagent, in independent parallel chunks. The main model keeps design, tricky
   logic, synthesis, and the acceptance decision. Do not delegate a trivial one-shot task.

## Release versioning

The repository release process is sourced from the root `VERSION` file. If you use an
external ship workflow, let it bump the version rather than editing it by hand; if `VERSION`
and any package manifest drift, reconcile the drift before inventing a new bump.
