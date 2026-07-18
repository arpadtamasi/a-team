---
name: report-status
description: Produce a concise, strictly read-only operational snapshot of this repository’s Scrum sprint, tickets, branches, blockers, dependencies, carry-over, and next ready work. Use this skill whenever the user asks what is happening now, what is in progress or blocked, who or which branch owns work, what should be pulled next, whether Scrum artifacts are consistent, or for a stand-up/status update. Do not use it to plan or close a sprint, transition tickets, edit files, or calculate a historical metrics dashboard.
compatibility: Requires read access to the repository and any existing Scrum artifacts; this skill must not invoke mutating tools or commands.
---

# Report Status

Report the current operational picture without changing it. This skill is strictly read-only, even when the repository is inconsistent.

## Inputs

Use the current repository unless the user specifies a sprint, lane, ticket subset, or comparison point. Clarify only an ambiguity that would materially change the reported scope.

## Read-only contract

Never create, edit, delete, format, stage, commit, append to, or regenerate any file. Never invoke commands, scripts, package tasks, or tools that may write caches, locks, build output, timestamps, or repository metadata. Do not append events or “repair” inconsistencies.

Use read-only inspection such as file reads, searches, directory listings, and non-mutating version-control queries. If a required fact would need mutation to discover, report it as unavailable.

## Resolve the repository contract

1. Read `AGENTS.md` and prefer `.claude/skills/a-team/METHOD.md`.
2. Read `.claude/skills/a-team/schemas/ticket.md`, `.claude/skills/a-team/schemas/sprint.md`, and `.claude/skills/a-team/schemas/events.md` for exact shared contracts.
3. Distinguish method requirements from observed state.

Missing infrastructure is a report finding, not permission to create it. An absent `scrum/sprint.md` is not missing infrastructure when event history has no unmatched `sprint_started`; report “no active sprint.” A missing `scrum/sprints/` directory means no closure history yet when no closed-sprint event claims otherwise.

## Inspect live state

Read, when present:

- `scrum/sprint.md` and recent `scrum/sprints/` records;
- ordered `scrum/backlog.md`;
- all relevant `scrum/tickets/` frontmatter and dependencies;
- branches, worktrees, and repository status through read-only version-control inspection;
- `scrum/metrics/events.jsonl` for claimed sessions, blockers, and recent transitions;
- `scrum/metrics/summary.json` only as a derived cross-check, never as stronger truth than tickets and events.
- repository-visible gstack plan, review, QA, investigation, or ship artifacts when they materially affect current work, and existing local `~/.gstack/projects/<project-slug>/` metadata only when safely readable and relevant.

Validate every JSONL line consulted. Do not infer a ticket state from prose when canonical frontmatter exists. Do not assume a populated branch exists: compare recorded ownership with live branches or worktrees. Do not expose secrets or unrelated file contents.

Do not execute a gstack workflow merely to report status because its preamble or telemetry may write local state. Treat gstack completion values and unfinished workflows as external evidence, never ticket states. Report a load-bearing private-only artifact as a durability gap under [`.claude/skills/a-team/GSTACK.md`](../../GSTACK.md).

Interpret lifecycle evidence through the deterministic effective event view in `.claude/skills/a-team/schemas/events.md`. Keep the raw line and applied correction visible in provenance. Report invalid or ambiguous correction chains as inconsistencies; never repair them or choose the more favorable state.

Reconcile without repairing:

- sprint commitment versus ticket `sprint` and status;
- ticket frontmatter versus compact backlog state;
- branch claims versus live branches and worktrees;
- open blocked periods versus ticket state and blocker events;
- dependency IDs and whether prerequisites are actually `done`;
- committed unfinished work from prior sprints;
- duplicate IDs, broken links, missing files, invalid states, or timestamps in impossible order;
- multiple active sprints, or contradictions between `sprint.md`, archives, and start/close events.

Label contradictions explicitly and cite both sources. Never silently pick the more convenient value.

## Select decision-oriented facts

Report:

1. active sprint goal and date, or that none is reliably active;
2. committed and stretch tickets with state and points;
3. tickets grouped by canonical state, keeping the view compact;
4. active branches, worktrees, sessions, and claimed work;
5. concrete blockers and open blocked periods;
6. dependency chains that gate current or next work;
7. carry-over from earlier sprint commitments;
8. next ordered `ready` work not already claimed, with dependency caveats;
9. missing or inconsistent Scrum artifacts requiring a human or owning-skill decision.
10. relevant completed, concerned, blocked, or incomplete gstack workflows, labeled as workflow-local results with their repository-visible artifact or durability gap.

“Next ready” follows existing backlog order. It is not a new priority decision, sprint commitment, or instruction to start work.

## Validate

Before replying, confirm:

- no filesystem, event, git, ticket, sprint, or derived-summary mutation occurred;
- all status claims are current repository facts or clearly labeled assumptions;
- branch ownership is cross-checked rather than inferred;
- blockers and dependencies name their evidence;
- contradictions and missing artifacts are visible;
- the report does not promise metric precision unsupported by raw records;
- the report remains concise and focuses on decisions or risks.

If inspection is incomplete, report exactly which artifacts were unavailable. Never fill gaps from memory or prior chat.

## Output

Use a compact structure:

```markdown
## Sprint
## Work state
## Blockers and dependencies
## Ownership
## Next ready
## Inconsistencies
```

Omit empty detail while preserving explicit “none found” where operationally important. End with the next human decision, if one exists, and state that the report made no changes.
