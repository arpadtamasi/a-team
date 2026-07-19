# AGENTS.md — repository working rules

Repository-level instructions for every coding agent, regardless of model. This is the
canonical instruction file; keep per-model behavior files only when a tool technically
requires one (point them here).

A-Team ships this file at its own repository root. When you adopt A-Team in your project,
copy this file to your repository root and adapt the project-specific parts. The source
method at this repository root, or its installed copy under `.claude/skills/a-team/`,
references two rules defined here — the **found-work (Boy Scout) rule** and the **code
guidelines** — so keep those intact.

## Sources of truth

Work is grounded in repository artifacts, not prior chat history. In the A-Team source
repository, the package method, schemas, and skills live at the repository root. After
installation into a consuming repository, the same package lives under
`.claude/skills/a-team/`. Important artifacts:

- `AGENTS.md` — durable, repository-level working rules;
- `METHOD.md` in this source repository, or `.claude/skills/a-team/METHOD.md` after installation — Scrum method definitions and data model;
- `PROCESSES.md` here, or `.claude/skills/a-team/PROCESSES.md` after installation — human-readable process map;
- `GSTACK.md` here, or `.claude/skills/a-team/GSTACK.md` after installation — the boundary between the Scrum lifecycle control plane and optional external expert workflows;
- `a-team/backlog.md` — current priority and backlog state;
- `a-team/sprint.md` — the active sprint (only while one exists);
- `a-team/tickets/` — durable work contracts;
- `schemas/` here, or `.claude/skills/a-team/schemas/` after installation — exact shared project-management shapes and formulas;
- `skills/` here, or `.claude/skills/a-team/skills/` after installation — owning operational procedures.

Do not silently resolve a conflict between artifacts: name it and report it.

In this source repository, `.claude/skills/a-team/` is a tracked discovery adapter whose
entries resolve to the repository-root package. It contains no copied implementation. Even
when an agent enters through that adapter, root `SKILL.md`, `METHOD.md`, `PROCESSES.md`,
`GSTACK.md`, `GLOSSARY.md`, `schemas/`, and `skills/` remain the only editable product
source. A consuming repository instead uses the actual installed package under
`.claude/skills/a-team/`. Project-management state stays under root `a-team/` in both cases.

## Git baseline rule

Start every sprint from a clean, committed Git baseline. Before sprint commitment, include
untracked files in the cleanliness check, classify all pending changes, and resolve them
without hiding work inside the new sprint. Record the full baseline SHA in the sprint and
start event. Commit the approved sprint file and event before any ticket starts.

Never count pre-baseline work as sprint delivery. Never stash, discard, absorb, stage, or
commit another owner's pending changes merely to satisfy the gate. Root `METHOD.md`,
`schemas/sprint.md`, `plan-sprint`, and `start-ticket` define the exact source-repository
checks; installed copies use the corresponding package paths.

## Plain-language interaction

Users do not need to know Scrum terms or operation names. Accept ordinary descriptions such
as “write this down,” “let's talk through the tasks,” “what should we do next?”, or “is this
finished?” and translate the intent to the one owning A-Team operation.

Lead with what will happen in everyday language. Give the canonical term or skill name
secondarily when it helps orientation; never make vocabulary a prerequisite for progress.
During refinement, ask one focused, non-jargon question at a time and inspect the repository
before asking the user for discoverable facts. Do not ask the user to manufacture story
points, acceptance criteria, a Definition of Ready, or a Definition of Done: derive a
proposal, explain it plainly, and preserve every required human approval gate.

Use root `GLOSSARY.md` in this source repository, or
`.claude/skills/a-team/GLOSSARY.md` after installation, for the shared plain-language
translations.

## Project management: the Scrum control plane

Do not change project-management state by improvising. For planning, refinement, starting,
review, blocking, closing, measurement, and retros, use the matching source skill under
`skills/` in this repository, or `.claude/skills/a-team/skills/` after installation. The
canonical definitions follow the same source-versus-installed layout. Operations include:

- choosing and explaining the correct PM process (`howto`);
- one-time empty control-plane bootstrap (`init-workspace`);
- backlog capture and refinement (`capture-work`, `refine-ticket`);
- sprint planning (`plan-sprint`);
- starting, blocking, submitting, reviewing, and closing a ticket
  (`start-ticket`, `block-ticket`, `submit-review`, `review-ticket`, `close-ticket`);
- parking or rejecting work without claiming delivery (`disposition-ticket`);
- append-only correction of proven historical errors (`reconcile-history`);
- sprint closure and demo report (`close-sprint`); metrics (`report-metrics`); retro (`retro`).

A normal coding task does not need the full method loaded — only when project-management
state must change.

Public problems and feature requests about the A-Team package itself go through
`report-issue`. It searches open and closed issues in `arpadtamasi/a-team` before creating
one and never treats a GitHub issue as Scrum state.

## Self-hosting and self-inspection

The A-Team source repository dogfoods its own control plane. Apply the same Scrum lifecycle,
evidence requirements, approval gates, found-work rule, and Definition of Done to changes in
`METHOD.md`, `schemas/`, `skills/`, `PROCESSES.md`, `GSTACK.md`, `README.md`, `docs/`, and
this `AGENTS.md`. Do not waive or weaken an A-Team rule merely because A-Team itself is the
subject of the change.

For every non-trivial implementation, verification, or review in this source repository,
inspect A-Team itself before claiming completion:

- compare the root router, lifecycle ownership table, schemas, owning skills, process guide,
  integration boundary, public documentation, and live `a-team/` artifacts for contradictions;
- verify operation names, state and event names, paths, links, approval gates, idempotency,
  append-only history, and source-versus-installed layout assumptions;
- exercise the changed workflow against this repository's own Scrum artifacts when doing so
  is safe and within the active ticket's scope;
- capture every concrete, independently actionable self-audit finding through `capture-work`,
  reusing an outcome-equivalent ticket instead of silently fixing unrelated work;
- keep GitHub issues as external intake until an explicit maintainer decision captures them
  into this repository's Scrum backlog.

Self-inspection supplies evidence; it never performs its own acceptance or closure. The
owning review and close operations still decide whether the active ticket satisfies the
method.

External expert workflows (discovery, planning, investigation, review, QA, ship) provide
plans, findings, and evidence; they NEVER own a Scrum ticket or sprint transition. When both
systems are involved, root `GSTACK.md` here or `.claude/skills/a-team/GSTACK.md` after
installation governs the boundary.

## A-Team source self-dogfooding

This section applies when the current repository is the A-Team package source. A-Team is
both the control plane used by the workspace and the product being changed; its own method,
schemas, skills, documentation, and Scrum artifacts receive no exemption from inspection.

For every material change to `AGENTS.md`, `METHOD.md`, `PROCESSES.md`, `GSTACK.md`,
`schemas/`, `skills/`, or the router `SKILL.md`:

1. Inspect the current Scrum status and the complete owning method, schema, and skill before
   editing. Use the root source package, never a stale installed copy.
2. After editing, run one bounded self-audit of the actual diff. Cross-check lifecycle
   ownership, states, event names and payloads, source/install paths, approval gates,
   idempotency rules, router and operation catalogues, and every affected documentation link.
3. Exercise the changed procedure against this workspace when a safe read-only or isolated
   validation is possible. Generated text or internal consistency alone is not proof.
4. Apply the Boy Scout rule to the audit itself: search the local Scrum backlog first, then
   capture every new concrete, independently actionable out-of-scope finding with
   `capture-work`. Keep it unestimated and outside the active sprint unless separately
   refined and committed.
5. Block review or closure when the candidate itself still carries a blocker-level
   correctness, security, privacy, authorization, data-loss, or operational-safety defect.

Self-examination does not authorize recursive scope expansion. Run one audit pass per
material candidate, repair only findings required by that candidate, and capture the rest.
Do not repeatedly audit the audit or convert GitHub issues into Scrum tickets without an
explicit intake decision. `report-issue` remains the separate public upstream channel.

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
