---
name: refine-ticket
description: Talk through and refine an existing backlog item into one independently executable, estimable, and verifiable work contract, or explain plainly why it cannot become ready. Use whenever the user asks to discuss a task, clarify what it should achieve, estimate, scope, make work ready, split it, investigate an uncertainty, define how completion will be checked, or assess whether it can fit a sprint—even when they do not know Scrum terminology or name the skill. Do not use it to capture new work, prioritize, schedule, start, implement, review, or close a ticket.
compatibility: Requires repository filesystem access and existing Scrum backlog and ticket artifacts; shared definitions come from the live project-management method.
---

# Refine Ticket

Turn an existing backlog item into an honest work contract. Readiness is a conclusion supported by the ticket and repository, not a formatting exercise. A good refinement may leave the item in `backlog`.

## Conversation contract

The user does not need to provide Scrum-formatted answers. Translate ordinary language into
the ticket contract and use the live package's `GLOSSARY.md` for shared meanings.

Inspect the repository first, then ask only for material facts or decisions that cannot be
discovered. Ask one focused question at a time, normally in this order when still unknown:

1. What should become observably different?
2. Why is that useful now?
3. What must be included, and what should wait?
4. What would convince the user that it is complete?
5. Is there a decision or other work that genuinely must happen first?

Do not ask the user to write acceptance criteria, choose a Definition of Ready/Done status,
or assign story points. Draft those from the answers and repository evidence, explain the
proposal in plain language, and ask for approval only for material product, scope, or
architecture decisions required by the method. Do not present a long questionnaire when
one answer may make later questions unnecessary.

## Boundaries

Refine without implementing, starting, scheduling, or prioritizing the work.

Do not:

- create or modify a sprint, including `a-team/sprint.md`;
- assign a branch;
- set `started_at`, `review_at`, or `done_at`;
- invent product or architecture decisions, evidence, commands, tests, measurements, dependencies, or historical timestamps;
- convert story points into time;
- weaken readiness criteria to advance a ticket;
- change the project-management method or migrate repository structure.

## Resolve the live method

Determine the package layout first. In the A-Team source repository, use root `METHOD.md`,
`schemas/...`, `skills/...`, `GSTACK.md`, `PROCESSES.md`, and `GLOSSARY.md` when relevant.
After installation, use their `.claude/skills/a-team/...` equivalents. Never prefer an
installed copy in the source repository.

1. Read `AGENTS.md`.
2. Read the selected package's `METHOD.md`.
3. Read the selected package's `schemas/ticket.md` and `schemas/events.md` for exact shared contracts.
4. Follow the selected method when it conflicts with this skill.

Target only the `a-team/` artifact structure. Do not create missing Scrum infrastructure to make refinement possible.

`a-team/backlog.md` and `a-team/tickets/` must already exist. Treat their absence as a blocker. If metrics infrastructure is absent, refinement may proceed when the method allows it, but report that lifecycle logging is unavailable rather than inventing a substitute.

## Identify the target

Resolve the ticket by ID, exact link, filename, or unambiguous title. If several tickets could match, ask the user to select one before editing.

Normally refine only a ticket whose status is `backlog`:

- `ready`: assess it without resetting `ready_at`; change its contract only with explicit user approval of the material delta. Re-run the complete Definition of Ready against the revised contract. If it would no longer qualify, preserve the current contract and capture a linked replacement or follow-up instead; the live method has no generic `ready` to `backlog` transition.
- `in_progress`: preserve the active contract. Report the proposed change and capture linked follow-up or replacement work only after an explicit capture decision; use disposition separately if the human stops the current contract.
- `review`: do not redefine scope; direct the user to the review workflow.
- `done`: do not reopen or rewrite it.
- `parked`: verify that its recorded reactivation condition has occurred before refinement.
- `rejected`: require an explicit decision before revival.

## Inspect before editing

Read enough repository evidence to judge the contract:

- the relevant backlog section and compact entry;
- the complete target ticket;
- related, prerequisite, parent, and child tickets;
- referenced research and decision logs;
- relevant source, tests, harnesses, package scripts, and architecture documentation;
- branch or ownership information exposed by repository state;
- `a-team/metrics/events.jsonl` when it exists;
- tickets with the same or overlapping outcome.

Use repository language, ID conventions, lanes, and terminology. Prefer repository artifacts over chat history when both describe the same fact.

Distinguish outcome overlap from file overlap. Tickets that touch the same files are not duplicates unless their observable results compete or repeat. Report whether overlapping tickets should be differentiated, sequenced, or explicitly merged; do not merge them automatically.

Ask only for material information that cannot be discovered. If a missing product or architecture decision remains unresolved, keep the ticket in `backlog` and name the decision plainly.

## Optional expert planning input

When installed and useful, gstack `/office-hours`, `/plan-ceo-review`, `/autoplan`, or `/plan-eng-review` may provide product or technical planning input. Read the load-bearing plan or preserve its approved decisions in a repository-visible artifact before relying on it for readiness. A private `~/.gstack/projects/` path is not sufficient for a ready or active ticket.

Treat gstack scope recommendations as proposals. They do not change ticket status, estimate, priority, sprint commitment, or contract. Follow [`.claude/skills/a-team/GSTACK.md`](../../GSTACK.md) for approval, follow-up capture, and artifact rules. Do not duplicate those specialist workflows inside refinement.

## Refine the work contract

### Outcome

Define exactly one observable result. Prefer behavior or evidence over implementation activity.

For implementation work, describe what becomes observably true. For research or decision work, describe the validated finding or decision artifact. Do not prescribe a technical solution unless it is already an approved constraint.

If the ticket contains multiple independently valuable outcomes, do not disguise them as acceptance criteria. Treat the item as an epic or decomposition candidate.

### Why

State why the result matters now using user input or repository evidence. Do not invent urgency.

### Scope

Define the minimum behavior, artifacts, and layers required for the outcome, only where repository evidence supports them.

### Out of scope

Exclude likely sources of scope creep when relevant, such as unrelated refactors, speculative abstractions, optional cleanup, adjacent features, broader migrations, future automation, repository restructuring, or claims beyond the measurement coverage. Avoid irrelevant boilerplate exclusions.

### Acceptance criteria

Write numbered criteria when there are several. Each criterion must be binary or directly inspectable and answer: what must be true for this ticket to be accepted?

Avoid subjective phrases such as “works well,” “is improved,” “is clean,” or “handles edge cases.” Name the behavior, case, artifact, or measured result instead.

Do not specify a measurement whose harness, dataset, judge, or protocol is absent unless creating that infrastructure is explicitly in scope and still fits the ticket.

### Verification

Name how completion will be demonstrated. Inspect the repository before naming commands or paths.

Separate relevant evidence types:

```markdown
## Verification

### Automated

- `<verified repository command>`

### Measurement

- `<existing harness, cases, repetitions, and expected artifact>`

### Manual

- `<observable check>`

### Documentation

- `<required decision-log update>`
```

Omit inapplicable subsections. If an exact required command or protocol cannot be established, record what must be discovered and keep the ticket in `backlog`.

Research claims need a measurement plan appropriate to their scope. Preserve the separation between hypothesis, implementation, measurement, interpretation, and decision. Do not imply universal correctness from guard or sentinel coverage.

### Dependencies and decisions

Identify real prerequisites, ordering constraints, pending decisions, shared work, unavailable environments, and missing measurement infrastructure. Distinguish:

- a blocker without which the outcome cannot be completed;
- a sequencing preference;
- related context;
- optional follow-up work.

Do not label related work a dependency merely because it shares files or subject matter.

## Estimate relatively

Use the Fibonacci scale and anchors in `.claude/skills/a-team/METHOD.md`.

Judge amount of work, complexity, uncertainty, change surface, regression risk, and verification burden together. Compare with repository anchor tickets when available. Explain the estimate briefly without converting it to hours or days.

- `1`, `2`, `3`, or `5` may become `ready` if every other readiness condition holds.
- `8` indicates work too large or uncertain for a sprint; decompose it or define a smaller spike.
- `13` indicates an epic-level or insufficiently understood item.

Do not lower an estimate to make the work sprint-compatible. Unless the live method explicitly supports estimates on non-ready items, keep frontmatter `story_points` empty for an item that remains `backlog` and record an `8` or `13` sizing conclusion in refinement notes and the report.

## Decompose or define a spike

When several independent outcomes exist or the sizing conclusion is `8` or `13`, keep the parent in `backlog` and propose the smallest vertical, demonstrable child outcomes with their dependency order.

Estimate a proposed child only if it independently satisfies every readiness condition. Do not split by technical layer when that produces fragments with no observable result.

By default, propose decomposition without creating child tickets. If the user explicitly asks for actual decomposition:

1. Preserve the parent unless repository conventions and an explicit decision require replacement.
2. Follow `.claude/skills/a-team/skills/capture-work/SKILL.md` for each child ticket's creation, ID, backlog entry, and `ticket_created` event.
3. Refine each child independently; mark only qualifying children `ready`.
4. Keep unresolved children in `backlog` rather than making the set look uniformly ready.

Use a spike when one primary uncertainty prevents responsible implementation scope. A spike must define:

- the question to answer;
- evidence to collect;
- constraints;
- stopping condition;
- expected finding, decision, or prototype artifact;
- explicit out of scope;
- the rule for follow-up work.

Estimate the spike's own uncertainty and verification burden, not the later implementation.

## Check the Definition of Ready

A ticket may become `ready` only when every condition below is supported:

- exactly one clear, observable outcome;
- a stated reason for doing it now;
- explicit scope and meaningful out-of-scope boundaries;
- concrete, testable acceptance criteria;
- executable or observable verification;
- known dependencies;
- material product and architecture decisions resolved or isolated;
- an independently reviewable result;
- small enough for one sprint;
- a justified `1`, `2`, `3`, or `5` estimate;
- no independently valuable outcomes bundled together;
- no reliance on invented evidence;
- an appropriate measurement plan for research claims.

If any condition fails, status remains `backlog`. Record exactly what is missing; Markdown completeness is not readiness.

## Update the ticket

When every readiness condition passes, set `status: ready`, assign a valid ready-sized `story_points` value, and set `ready_at` to the current ISO 8601 timestamp with timezone, following `.claude/skills/a-team/schemas/ticket.md`.

Use the current local timestamp only for the real transition. Preserve `created_at`, ID, historical context, links, evidence, and explicit decisions. Do not populate `started_at`, `review_at`, `done_at`, `sprint`, or `branch`.

When readiness fails, keep `status: backlog`, do not set `ready_at`, and preserve or clear `story_points` according to the live method. Update the contract only with evidence-backed refinement findings and explicit missing information.

Use the refined ticket body defined by `.claude/skills/a-team/schemas/ticket.md`.

Leave `Result` empty or state only that work has not started. A concise `Refinement notes` section may record estimate rationale, resolved ambiguity, remaining assumptions, or decomposition reasoning. Remove or clearly supersede contradictory capture-stage wording; preserve valid context and evidence.

## Update the backlog and event log

Update only the target's compact entry in `a-team/backlog.md` with its state, story points, dependencies, link, and one-line outcome. Keep its priority unless the user separately requests reprioritization or existing dependency order is objectively invalid. Refinement does not move work into `a-team/sprint.md`.

When a ticket transitions to `ready` and `a-team/metrics/events.jsonl` exists, append one `ticket_ready` event using the same transition timestamp and conforming to `.claude/skills/a-team/schemas/events.md`.

Follow a different compatible schema when the selected method requires it. Parse the new line as JSON. Do not log `ticket_ready` when status remains `backlog`, and do not invent another metrics format when the expected file is absent.

## Verify the refinement

Review the diff and confirm:

- the ticket has one outcome and no competing ready duplicate;
- acceptance criteria are testable and verification is concrete;
- dependencies and material decisions are known or the ticket stayed `backlog`;
- a ready estimate is exactly `1`, `2`, `3`, or `5`;
- timestamps reflect real transitions and no evidence was invented;
- `started_at`, `review_at`, `done_at`, `sprint`, and `branch` were not populated;
- active or completed work was not silently rewritten;
- any external plan used for readiness is repository-visible and any material scope delta has explicit approval;
- ticket ID and backlog link remain correct;
- no implementation, sprint change, method change, migration, or unrelated edit occurred;
- any appended event is valid one-line JSON and matches the ticket.

Repair only refinement artifacts when a check fails; otherwise report the blocker.

## Report

Keep the final report concise. Include:

- ticket ID and path;
- resulting state and whether every readiness condition passed;
- estimate and brief rationale, or why no final estimate was assigned;
- important scope boundaries and dependencies;
- verification approach;
- unresolved questions;
- whether decomposition or a spike is recommended;
- whether a lifecycle event was logged.

When status remains `backlog`, name each condition that prevents readiness.

Lead the report with what is now clear and what still needs a decision. Put internal state,
skill, and field names secondarily; never require the user to understand them to choose the
next step.
