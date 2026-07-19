---
name: close-ticket
description: Close one reviewed Scrum ticket only after independently recorded review and complete Definition of Done evidence prove the result is acceptable, then record done state, result, compact backlog state, lifecycle event, and ticket metrics. Use this skill whenever the user asks to close, complete, finish, accept, mark done, or finalize a reviewed ticket—even if they simply say “ship this ticket.” Do not use it to submit or review a candidate, resolve findings, close a sprint, or report portfolio metrics.
compatibility: Requires existing canonical Scrum artifacts and evidence sufficient to verify the live method's Definition of Done.
---

# Close Ticket

Closure records a verified outcome, not confidence or activity. Refuse rather than convert missing evidence into assumptions.

## Transition ownership

This skill alone owns the normal `review` to `done` transition, `done_at`, completed ticket `Result`, `ticket_done`, compact backlog completion state, and ticket-level completion metrics.

Do not:

- perform the first review, implement fixes, or begin rework;
- close a sprint or award sprint velocity;
- award partial story points or change the estimate after completion;
- reset lifecycle timestamps, erase blocked periods, rewrite raw events, or backfill invented history;
- merge, deploy, or delete branches unless the user separately authorizes that external action and the ticket requires it;
- hide known regressions, limitations, unresolved findings, or measurement failures.

## Inputs

Require one unambiguous ticket and authority to close it. Accept review links or merge/readiness evidence, but verify them from repository artifacts and current state.

Installed gstack `/ship` output may prove technical actions such as checks, commits, push, or PR/MR creation. It is shipping evidence only: success, `DONE`, or `DONE_WITH_CONCERNS` never satisfies this transition by itself. Follow [`.claude/skills/a-team/GSTACK.md`](../../GSTACK.md).

## Resolve the live method

Determine the package layout first. In the A-Team source repository, use root `METHOD.md`,
`schemas/...`, `skills/...`, `GSTACK.md`, `PROCESSES.md`, and `GLOSSARY.md` when relevant.
After installation, use their `.claude/skills/a-team/...` equivalents. Never prefer an
installed copy in the source repository.

1. Read `AGENTS.md`.
2. Read the selected package's `METHOD.md`.
3. Read the selected package's `schemas/ticket.md`, `schemas/metrics.md`, `schemas/events.md`, and `schemas/tokens.md` for exact shared contracts.
4. The applicable method wins over this skill.

Require the existing ticket, compact backlog, and append-only metrics structure when the method makes them part of closure. Do not invent missing infrastructure.

## Inspect live state

Inspect:

- the entire ticket and every acceptance criterion;
- compact backlog entry, active sprint, dependencies, blockers, branch ownership, and current/default branch relation;
- candidate diff, commits, changed/untracked files, artifact identity, and merge/readiness condition named by the ticket;
- all review rounds, severity findings, explicit acceptances, and rework submissions;
- automated output, manual checks, screenshots, measurements, and stored artifacts tied to the current candidate;
- required research and decision logs and their diff;
- `## Result`, known limitations, scope deviations, follow-up work, and regression disclosures;
- repository-visible shipping evidence when the ticket requires a commit, push, PR/MR, merge, or deployment; never rely solely on a private `~/.gstack/projects/` artifact;
- ticket session records, lifecycle/token events, and blocked periods.

Use live repository facts over chat history. Label unverified user claims and inferences; do not invent evidence, branch state, decisions, sessions, timestamps, or tokens.

## Enforce closure eligibility

Normally require `status: review`. A ticket already `done` with a matching `ticket_done` event and complete artifacts is an idempotent success: report it without resetting `done_at`, rewriting result/history, or duplicating events.

Refuse closure from `backlog`, `ready`, `in_progress`, `blocked`, `parked`, or `rejected`. Refuse when any of these is unsupported:

- every acceptance criterion is demonstrably satisfied by the current candidate;
- the observable outcome is demonstrated, not merely described;
- all relevant automated checks actually passed;
- required manual verification was completed and recorded;
- required measurement ran under the stated protocol and its output is stored or linked;
- required decision-log changes are recorded;
- all `blocker` and `important` review findings are resolved or explicitly accepted under the method;
- minor findings and remaining limitations are disclosed;
- every concrete implementation, verification, or review finding has a resolvable existing or newly captured backlog ticket, including non-blocking smells, duplication, SOLID violations, risky coupling, security/privacy/data risks, and missing tests for demonstrated risk;
- no known regression or scope creep is hidden;
- the ticket-specific merge/readiness condition is true;
- any required gstack shipping result is preserved as inspectable evidence and its concerns are resolved or classified;
- result text states what actually happened, including negative findings;
- lifecycle and session/token records are complete as far as tools expose them.

Do not run destructive or external actions merely to satisfy closure. Report the exact missing prerequisite and leave all state unchanged.

## Calculate ticket metrics

Derive ticket metrics from canonical records using `.claude/skills/a-team/schemas/metrics.md` and `.claude/skills/a-team/schemas/tokens.md`. Preserve raw events as the source of truth, keep missing or incompatible values unavailable, and record exclusions or inconsistencies. Put the concise ticket metric summary in `## Result`; do not invent another metrics file.

## Apply closure atomically

Use one current local ISO 8601 timestamp with timezone for the real closure.

1. Complete `## Result` with demonstrated outcome, evidence, important implementation/research result, negative findings, accepted deviations, remaining limitations, and links to every found-work ticket so follow-ups are not silently absorbed into this ticket.
2. Set `status: done` and `done_at` to the closure timestamp. Preserve estimate and all earlier timestamps.
3. Record the calculated ticket metrics and incomplete-data limitations.
4. Update only this ticket's compact backlog entry to `done`, preserving its estimate, link, and history conventions.
5. Clear active branch ownership only when repository convention treats the ticket field as a claim and the branch is merged, retired, or explicitly released. Never claim a branch was deleted or merged without evidence; preserve the branch as historical context if the schema requires it.
6. Preserve active sprint membership; sprint closure owns sprint results and velocity.

If `a-team/metrics/events.jsonl` exists, scan it first and append exactly one `ticket_done` event conforming to `.claude/skills/a-team/schemas/events.md`.

Prevent duplicates using ticket ID and the completed transition, not timestamp alone. Never edit prior lines. Parse the appended JSON. Record closure-session `token_usage` only when the provider exposes it, with the actual purpose (usually `review` or `documentation`), preserved categories, and unknown schema fields as `null`; never estimate. If required logging is unavailable, refuse or report the prerequisite according to the live method—do not create a substitute.

## Validate

Review the diff and recompute checks:

- pre-closure state was `review`, review evidence exists, and Definition of Done is fully supported;
- closure did not rely on a workflow-local gstack status or successful `/ship` alone;
- status is `done`, `done_at` is a real timezone-qualified closure time, and earlier timestamps are unchanged;
- Result accurately links evidence and states limitations;
- all concrete found-work items resolve to unique existing or newly captured backlog tickets;
- story points are unchanged and no partial credit was recorded;
- ticket and compact backlog agree;
- branch ownership changed only with evidence and according to convention;
- calculated metrics follow method definitions and unknown data remains unavailable;
- exactly one `ticket_done` event exists for the transition and token counts are provider-exposed;
- raw events remain byte-for-byte unchanged except appended lines;
- sprint state, implementation, review findings, method, and unrelated files did not change.

If any check fails, repair only closure-owned artifacts when safe. Otherwise leave or restore a coherent non-done state and report the blocker; never claim partial closure.

## Report

Report ticket ID/path, closure status, demonstrated result, evidence checked, findings disposition, every found-work ticket created or linked, limitations, merge/readiness state, unchanged story points, branch-claim handling, cycle/lead/review/blocked time, sessions, provider-backed token summary, appended events, files changed, and data gaps. On refusal, list each unmet Definition of Done condition and confirm that state, timestamps, backlog, and events remain unchanged.
