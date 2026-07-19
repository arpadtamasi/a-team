---
name: capture-work
description: Capture newly requested or discovered work into this repository's Scrum backlog as unrefined backlog tickets, compact backlog entries, and ticket-created metrics events when the log exists. Use this skill whenever the user asks to record, capture, note, defer, or add a feature, defect, code smell, duplication, SOLID violation, risk, research finding, operational task, documentation task, follow-up, or unresolved decision for later—even when they do not mention Scrum or a ticket. Also use it automatically for concrete problems discovered during implementation, verification, or review under the repository's Boy Scout rule. Do not use it to refine, estimate, schedule, start, implement, review, or close work.
compatibility: Requires repository filesystem access and the Scrum artifacts described in .claude/skills/a-team/METHOD.md.
---

# Capture Work

Capture work faithfully without making it look more understood or execution-ready than it is. The result is a durable backlog record, not a plan or implementation.

## Boundaries

Create at most one backlog item per invocation unless the user explicitly requests separate captures or the repository's Boy Scout rule supplies several independently actionable findings. Keep every initial state `backlog`.

Do not:

- implement or start the work;
- create or modify a sprint, including `a-team/sprint.md`;
- assign a branch;
- estimate story points;
- mark the ticket `ready`;
- invent acceptance criteria, verification steps, product decisions, evidence, dependencies, historical timestamps, or other missing facts;
- silently split related work into executable tickets.

If an ordinary feature request contains several independently valuable outcomes, capture one epic-level backlog item and state that refinement must decompose it. For a batch of concrete Boy Scout findings, create one ticket per independently actionable problem so evidence and ownership do not collapse into a vague technical-debt epic.

## Boy Scout discovery input

When another workflow invokes this skill for discovered technical debt:

- require repository-grounded evidence, not a hypothetical or personal style preference;
- record affected paths or artifact locations, the observed problem, its consequence, severity, and the ticket or review where it was discovered;
- include defects, smells, duplication, SOLID violations, security/privacy/authorization risks, data-loss or migration risks, performance/resource risks, accessibility, observability, dependency/license/supply-chain risks, flaky tests, and missing tests for demonstrated risk;
- search for an outcome-equivalent ticket before creating anything;
- link a duplicate to the discovery source rather than creating another ticket;
- keep captured work outside the active sprint, unestimated, unstarted, and `backlog`;
- do not fix the finding as part of capture;
- state separately when a blocker-level risk must stop the current review or closure; capture is not a waiver.

A gstack plan task, TODO, review finding, QA defect, ship follow-up, or retro suggestion is initially a surfaced work candidate, not a Scrum item. Do not implement it, prioritize it, estimate it, or infer a Scrum status from its gstack wording. Capture it only after an explicit capture decision, except when the repository-wide Boy Scout rule independently requires capture because the workflow demonstrated a concrete repository-grounded actionable problem. In both cases, search for and link an outcome-equivalent ticket first. See [`.claude/skills/a-team/GSTACK.md`](../../GSTACK.md).

## Resolve the repository contract

Determine the package layout first. In the A-Team source repository, use root `METHOD.md`,
`schemas/...`, `skills/...`, `GSTACK.md`, `PROCESSES.md`, and `GLOSSARY.md` when relevant.
After installation, use their `.claude/skills/a-team/...` equivalents. Never prefer an
installed copy in the source repository.

1. Read `AGENTS.md`.
2. Read the selected package's `METHOD.md` as the canonical definition of the workflow and ticket model.
3. Read the selected package's `schemas/backlog.md`, `schemas/ticket.md`, and `schemas/events.md` for the exact shared backlog, ticket, and event contracts.
4. If the applicable method conflicts with this skill, stop and report the conflict; the method is authoritative.

Do not copy the full method into the ticket or this skill's output.

## Discover the current state

Before writing, inspect:

- `a-team/backlog.md`;
- existing Markdown files in `a-team/tickets/`;
- recent ticket IDs, filename slugs, lanes, types, language, and naming conventions;
- backlog priority sections and entry format;
- documentation or files referenced by the request;
- `a-team/metrics/events.jsonl`, when present.

The board and ticket directory must already exist. If either is absent, stop and route the
workspace to `init-workspace` rather than creating an alternative structure.

Search the backlog and ticket contents for the same requested outcome, defect, or finding. Compare outcomes rather than keywords alone:

- If an existing ticket describes the same work, do not create a duplicate. Report its ID and path and propose updating it through the appropriate operation.
- Keep materially different outcomes separate even when they share context or dependencies.

## Preserve uncertainty

Infer only facts strongly supported by the request or repository. Use the repository's language and naming style.

- Write an observable outcome only when one can be stated without deciding an unresolved product question.
- Put missing decisions and information under `Open questions`.
- Mark tentative scope as provisional.
- Use `Unknown` for dependencies that have not been established.
- Leave the lane null when it cannot be inferred safely.
- Choose the closest supported type from `feature`, `bug`, `research`, `operations`, `decision`, `documentation`, or `other`.
- Include only exclusions already stated by the user or repository. If none are known, say `None explicitly identified.`

## Choose a ticket ID

Derive the next ID from the existing tickets and backlog:

1. Preserve established prefixes such as `A-` or `B-`, including lane-specific conventions.
2. Check both filenames and frontmatter before selecting the next unused value.
3. Never reuse or renumber an ID.
4. If no safe convention can be inferred, use a conspicuously temporary ID such as `TEMP-YYYYMMDD-01`, verify that it is unused, and report why it is temporary.

Create a concise lowercase hyphenated filename slug without changing the ID:

`a-team/tickets/<ticket-id>-<slug>.md`

## Create the ticket

Use the current local time at the moment of capture, formatted as ISO 8601 with its timezone offset. This is the creation time, not reconstructed history.

Create the capture-stage frontmatter and body exactly as defined by `.claude/skills/a-team/schemas/ticket.md`.

Keep `story_points`, lifecycle timestamps other than `created_at`, `sprint`, and `branch` empty.

Do not add acceptance criteria or verification merely to make the capture appear complete. The refinement operation owns those fields.

## Update the backlog

Add one compact entry per created ticket to the appropriate section of `a-team/backlog.md`,
matching `schemas/backlog.md` and the existing format. Unless the user explicitly requests
another priority, use the neutral `Backlog` section created by `init-workspace`, or the
repository's established normal-backlog equivalent, rather than the active sprint or
highest-priority section.

Include only:

- ticket ID and title;
- state `backlog`;
- type;
- story points as `—` or the repository's equivalent unset marker;
- known dependencies;
- a relative link to the ticket;
- a one-line outcome or faithful capture summary.

Do not copy the detailed ticket body into the board and do not edit `a-team/sprint.md`.

## Log creation when supported

If `a-team/metrics/events.jsonl` exists, append exactly one `ticket_created` event per created ticket conforming to `.claude/skills/a-team/schemas/events.md`.

Use each ticket's capture timestamp in its event. Preserve existing lines exactly. Parse every appended line as JSON before considering the write successful.

If the expected log or metrics directory is absent, do not create a substitute. Report that logging was skipped because the infrastructure is absent.

## Verify before reporting

Check the resulting diff and confirm:

- every ID is unique across the backlog and ticket files;
- every created ticket file exists and its backlog link resolves;
- every created status is `backlog` and story points are unset;
- every created ticket keeps `ready_at`, `started_at`, `review_at`, `done_at`, `sprint`, and `branch` empty;
- `a-team/sprint.md` and sprint records were not changed;
- no unsupported facts, historical evidence, or timestamps were invented;
- no duplicate ticket was created;
- any gstack-surfaced input had capture authority and was not treated as pre-authorized implementation;
- every appended event is valid one-line JSON and matches its ticket;
- only the ticket, backlog, and existing event log changed.

If verification fails, repair only the capture artifacts or report the blocker. Do not broaden the operation.

## Report

Keep the final report concise and include:

- every created ticket ID and path, plus every existing duplicate ticket linked;
- backlog sections used;
- whether each event was logged or skipped;
- important open questions;
- whether decomposition appears necessary;
- confirmation that the item remains unestimated, unstarted, and not ready.
