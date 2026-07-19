---
name: retro
description: Run an evidence-based per-sprint or cross-sprint Scrum retrospective and record an explicitly accepted process improvement. Use this skill whenever the user asks for a retro, retrospective, lessons learned, process reflection, workflow improvement, recurring carry-over analysis, or an investigation of review, blocker, estimation, environment, or token-overhead patterns. Do not use it to close a sprint, regenerate metric summaries, edit historical estimates, or grade agents and models.
compatibility: Requires repository filesystem access and closed sprint, ticket, event, and retrospective artifacts defined by the live project-management method.
---

# Retro

Turn delivery evidence into a small operating improvement. Analyze the system, not the worth of an agent, model, or person.

## Inputs

Determine:

- cadence: per closed sprint unless the user requests a cross-sprint (multi-sprint) retro;
- period and closed sprint records to include;
- any user observations;
- whether a proposed process change has explicit human approval.

An installed gstack `/retro` report may be supplied as engineering or session-level input. It is not the official process record and cannot approve or apply a Scrum process change.

Without approval, produce a proposal and do not write a retro or alter process files.

## Resolve the repository contract

1. Read `AGENTS.md` and prefer `.claude/skills/a-team/METHOD.md`.
2. Read `.claude/skills/a-team/schemas/sprint.md`, `.claude/skills/a-team/schemas/metrics.md`, and `.claude/skills/a-team/schemas/tokens.md` for exact shared contracts.
3. The live method wins over this skill.

Do not invent missing sprint, ticket, metrics, or history artifacts. An approved retro may create its own dated file under an existing `a-team/retros/` directory when the method and conventions define it. Otherwise report the missing prerequisite.

## Inspect live evidence

Read the selected closed sprint archives, their committed and stretch tickets, and relevant raw events. Inspect existing retros, method-change records, decision logs, and skill files when a repeated issue implicates them.

When relevant, inspect repository-visible gstack retro evidence and clearly separate its Git, session, or tool-usage observations from canonical Scrum metrics. A private local report may inform analysis but cannot be the sole durable evidence for an accepted change. Follow [`.claude/skills/a-team/GSTACK.md`](../../GSTACK.md).

Analyze available evidence for:

- cycle time and story-point size;
- carry-over and commitment reliability;
- first-pass acceptance, review rounds, and rework;
- blocked periods and dependency failures;
- token distribution by method purpose;
- environment overhead and repository-readiness failures;
- repeated estimation misses;
- recurring ambiguity in ticket design, skills, or process.

Validate JSONL lines before using them. Recalculate claims from source records where possible. Label missing fields and small samples. Do not infer exact token counts, invent causal explanations, or compare providers as equivalent. Keep observation, interpretation, and proposed decision separate.

## Build the retrospective

### Daily

Use exactly:

```markdown
## Helped

## Slowed us down

## Change
```

Ground each observation in a sprint, ticket, event, or explicit user observation. Propose at most one concrete operating change for the next sprint. “Be more careful” is not a process change; name the changed rule, checklist, artifact, skill, or repository prerequisite.

### Cross-sprint

Summarize the covered sprints and sample sizes, then describe repeated evidence, exceptions, and trends across sprints. Prefer medians and distributions where appropriate. Recommend a small set of prioritized changes, but distinguish recommendations from the one change, if any, accepted now.

Do not:

- grade or rank agents, people, providers, or models;
- rewrite past estimates, sprint results, tickets, or events;
- disguise a product decision as a process change;
- claim causality from correlation;
- optimize one metric at the expense of verified outcomes.

## Approval and recording

Present the evidence and proposed change before mutation unless the user has already explicitly approved that exact change.

For an approved change:

1. Use the current ISO 8601 timestamp with timezone as `accepted_at`; never backfill an invented acceptance time.
2. Create one convention-matching record under `a-team/retros/`, using a date-based name that cannot overwrite another retro.
3. Record cadence, covered period, evidence, Helped/Slowed us down/Change content, decision owner when known, effective point, and affected method or skill files.
4. If no change is accepted, say so plainly; a valid negative result needs no forced change.

The retro identifies required edits but does not silently modify `.claude/skills/a-team/METHOD.md`, skills, tickets, sprint archives, backlog, `sprint.md`, or raw events. Obtain explicit approval for a separate scoped update to those artifacts. The retro file itself is the traceable acceptance record.

A recommendation from gstack `/retro` follows the same rule: it remains input until this Scrum retro records an explicit human decision.

Make recording idempotent: search by covered period and accepted change. If the same retro already exists, report it rather than duplicating it. If the period exists with different content, preserve it and request a distinct filename or correction decision.

## Validate

Confirm:

- every factual claim links to inspectable evidence or is labeled as an observation;
- the period, cadence, and sample sizes are explicit;
- the per-sprint format has at most one accepted change;
- historical metrics, estimates, events, and sprint results are untouched;
- token claims use only exposed compatible values;
- affected method or skill files are named but not edited;
- an accepted timestamp is current ISO 8601 with timezone;
- no duplicate retro was created;
- only the new retro file changed.

If evidence cannot support a proposed conclusion, preserve the negative or uncertain result instead of forcing an action.

## Output

Report cadence and period, evidence-backed Helped and Slowed us down findings, the proposed or accepted Change, affected process files, data limitations, record path if written, and any approval still required.
