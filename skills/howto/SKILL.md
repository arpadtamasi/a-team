---
name: howto
description: Explain how to use this repository's Scrum-like workflow and identify the correct owning process, prerequisites, approval gate, and next request without changing state. Use this skill whenever the user asks how to proceed procedurally, which Scrum skill or gstack workflow applies, how a ticket moves through the lifecycle, or how to handle scope changes, carry-over, findings, shipping, closure, or retrospectives—even when they ask casually, such as “how do I go on with this?” Do not use it to perform a transition, choose the next ticket from live backlog state, produce a status report, or recalculate metrics.
compatibility: Requires read access to the repository's canonical Scrum method, process guide, integration guide, and relevant skill definitions.
---

# Scrum How-to

Give a short, repository-grounded operating answer. This skill is a navigator, not another lifecycle owner.

## Read-only boundary

Do not create, edit, delete, append, stage, commit, push, run mutating commands, or invoke a mutating workflow. Do not change tickets, backlog, sprint state, events, estimates, branches, metrics, or gstack artifacts.

If the user explicitly asks both how to do something and to do it now, first explain the selected route and its material gate, then hand execution to the existing owning skill. Never perform the transition under this skill's authority.

## Resolve the live process

1. Read `AGENTS.md` and `.claude/skills/a-team/PROCESSES.md`.
2. Read `.claude/skills/a-team/METHOD.md` for shared concepts and lifecycle ownership.
3. Read `.claude/skills/a-team/GSTACK.md` when optional gstack discovery, planning, investigation, review, QA, ship, retro, telemetry, or artifacts are involved.
4. Read the complete owning `.claude/skills/a-team/skills/<name>/SKILL.md` before describing its exact prerequisites or refusal conditions.
5. Read schemas only when the question needs an exact state, field, event, metric, or artifact rule.

Repository artifacts override chat history. Report a material conflict instead of choosing silently.

## Decide what kind of help is needed

Distinguish these intents:

- **General explanation** — explain the relevant lifecycle segment without inspecting all live work.
- **Which process?** — map the requested outcome to exactly one owning Scrum skill, plus optional gstack support.
- **What next for this ticket?** — inspect the named ticket, compact backlog entry, active sprint, and relevant events read-only, then identify the next legal operation.
- **What is happening now?** — route to `report-status`; do not recreate its full repository audit.
- **How are metrics calculated?** — point to `METHOD.md` and the schemas; route a requested calculation to `report-metrics`.
- **Do it now** — confirm that execution was actually requested, then hand off to the owning skill and preserve its approval gate.

Ask a question only when the target or intended operation cannot be identified safely from repository evidence.

## Process router

| User intent | Owning Scrum process | Optional gstack support |
| --- | --- | --- |
| Record a request, defect, risk, or concrete finding | `capture-work` | gstack output may be the discovery source, but remains a candidate until capture |
| Clarify, estimate, split, or make work ready | `refine-ticket` | `/office-hours`, `/plan-ceo-review`, `/autoplan`, `/plan-eng-review` |
| Choose the sprint commitment | `plan-sprint` | none substitutes for sprint planning |
| Begin committed work | `start-ticket` | technical planning may already exist as input |
| Record or resolve an impediment | `block-ticket` | workflow `BLOCKED` is evidence only when it reflects a real ticket blocker |
| Hand off an implemented candidate | `submit-review` | QA evidence may support the handoff |
| Assess acceptance and findings | `review-ticket` | `/review`, `/qa`, security or specialist review |
| Begin review rework | `review-ticket` | `/investigate` may support root-cause work |
| Accept and mark delivered | `close-ticket` | `/ship` output may be shipping evidence, never closure |
| Stop work without delivery | `disposition-ticket` | none changes the explicit decision requirement |
| End and archive the sprint | `close-sprint` | gstack evidence may support the demo, never closure |
| Reflect and adopt a process experiment | `retro` | `/retro` is optional engineering input |
| Show current work state | `report-status` | relevant gstack results may be reported as external evidence |
| Calculate delivery or token metrics | `report-metrics` | gstack telemetry never replaces Scrum events |
| Repair proven historical event errors | `reconcile-history` | no heuristic reconstruction |

Implementation itself is performed by the authorized coding or research workflow inside an `in_progress` ticket; it is not a separate Scrum transition.

## Explain the next legal step

When a ticket is named, use its canonical state and evidence:

| Current state | Normal next operation | Key condition |
| --- | --- | --- |
| no ticket | `capture-work` | work is not already captured |
| `backlog` | `refine-ticket` | decisions, scope, verification, dependencies, and sizing can be resolved |
| `ready` | `start-ticket` if already committed; otherwise `plan-sprint`, then `start-ticket` | exact sprint proposal is approved; ticket is committed before start |
| `in_progress` | implementation, `block-ticket`, or `submit-review` | candidate and required verification exist before submission |
| `blocked` | `block-ticket` unblock or `disposition-ticket` | resolution evidence or explicit non-delivery decision exists |
| `review` | `review-ticket`, then rework or `close-ticket` | review judgment precedes closure |
| `done`, `parked`, or `rejected` | normally capture a new linked ticket | terminal contracts are not reopened casually |

Do not infer the next step from status alone when ticket, backlog, sprint, dependency, branch, blocker, or event records disagree. Name the inconsistency and direct it to its owning operation.

## Common decision rules

- Only `ready` tickets can be committed, and commitment does not start work.
- Carry-over preserves first start and cycle time; unfinished points count as zero and are never split.
- A material scope change after readiness needs explicit approval. Preserve active contracts and use refinement, linked follow-up work, or disposition as defined in `.claude/skills/a-team/GSTACK.md`.
- gstack `DONE`, `DONE_WITH_CONCERNS`, `BLOCKED`, and `NEEDS_CONTEXT` are workflow results, not Scrum states.
- `/ship` may supply technical delivery evidence but cannot close a ticket or sprint.
- A surfaced TODO or finding cannot be implemented until `capture-work` gives it Scrum identity, unless it is already inside the active ticket's approved scope.
- Exact token counts are recorded only when exposed by a provider; never estimate them.

## Response format

Keep the answer proportional to the question. Prefer:

```markdown
Recommended process: `<skill>`

Why: <one or two sentences>

Before it can run:
- <only the real prerequisites or approval gate>

Ask next:
> <a concrete request the user can give the owning skill>

Watch out for: <one material refusal condition or “none”>
```

For a multi-step route, show the shortest legal sequence and mark the current position. Link the owning skill and the relevant section of `PROCESSES.md`; do not reproduce the full method or skill procedure.

End by stating that this explanation made no state changes.

## Validate

Before replying, confirm:

- exactly one owning Scrum process is named for the immediate next operation;
- optional gstack support is clearly non-owning;
- prerequisites come from live repository artifacts and the owning skill;
- every required human approval remains visible;
- no status, lifecycle event, estimate, sprint, branch, metric, or artifact changed;
- the answer does not invent a missing process or duplicate `report-status`.
