---
name: review-ticket
description: Independently review one Scrum ticket's candidate result against its outcome, acceptance criteria, verification evidence, regression risks, and repository obligations, then return severity-ranked actionable findings or closure eligibility. Use this skill whenever the user asks to review, assess, inspect, approve, reject, or check a ticket or candidate implementation that is already in review—even when they say only “take a look.” Do not use it to submit work to review, edit the implementation on the first pass, or close the ticket.
compatibility: Requires repository and verification access sufficient to inspect a ticket, its candidate diff or artifact, and the live Scrum method.
---

# Review Ticket

Perform an independent, evidence-based acceptance review. The review protects the ticket contract and repository, not a preferred implementation style.

## Ownership and boundaries

This skill owns the review judgment and, only after an explicit decision to begin rework, the `review` to `in_progress` transition and `rework_started` event. `submit-review` owns review entry; `close-ticket` owns completion.

On the first review pass, do not edit implementation, tests, generated outputs, prompts, documentation, or logs. Keep implementation inspection read-only; the only additional write permitted is invoking `.claude/skills/a-team/skills/capture-work/SKILL.md` for concrete discovered problems, alongside method-supported review/session records. Do not close the ticket, set `done_at`, reset `started_at` or `review_at`, alter scope or story points, waive findings silently, or append `rework_started` merely because findings exist.

## Inputs

Require one ticket identified unambiguously. Accept a candidate branch, diff, artifact, or verification links when supplied, but verify them against live repository state. Clarify the review target if several candidates exist.

## Resolve the live method

1. Read `AGENTS.md`.
2. Prefer `.claude/skills/a-team/METHOD.md`.
3. Read `.claude/skills/a-team/schemas/ticket.md`, `.claude/skills/a-team/schemas/events.md`, and `.claude/skills/a-team/schemas/tokens.md` for exact shared contracts.
4. Follow the applicable method over this skill.

Do not invent missing Scrum infrastructure. A read-only review may report what can be inspected, but no lifecycle/session mutation is allowed when required canonical artifacts or an unambiguous method are absent.

## Inspect live state

Read:

- the full ticket, compact backlog entry, active sprint record, and related tickets;
- outcome, scope, out-of-scope, acceptance criteria, verification, dependencies, context, and result;
- current/default branches, ticket branch ownership, commits, full relevant diff, untracked files, and generated artifacts;
- source and configuration affected beyond the obvious changed lines;
- automated test output, manual checks, measurement artifacts, screenshots, and other claimed evidence;
- regression surface, error paths, boundary cases, compatibility, security/privacy consequences, and failure behavior relevant to the ticket;
- required decision logs;
- ticket sessions, blocked periods, prior submissions, review findings, rework events, and token events.
- repository-visible gstack `/review`, `/qa`, security, investigation, or other specialist reports relevant to the current candidate, plus any local-only artifact whose limitations must be disclosed.

Distinguish facts directly observed from user claims and reviewer inference. Re-run safe, relevant checks when needed to validate stale or incomplete evidence. Record actual commands, conditions, and results; never invent passing output.

Specialist workflows provide evidence, not acceptance. Interpret their findings against this ticket's outcome, acceptance criteria, and Definition of Done; do not copy their internal review procedure or convert gstack `DONE`, `DONE_WITH_CONCERNS`, `BLOCKED`, or `NEEDS_CONTEXT` into Scrum states. Follow [`.claude/skills/a-team/GSTACK.md`](../../GSTACK.md). If a load-bearing report exists only under `~/.gstack/projects/`, preserve its required evidence in the repository before closure.

## Review against the contract

Evaluate:

1. **Outcome and acceptance criteria** — demonstrate each criterion independently; identify criteria that are unmet, untestable, or satisfied only by assertion.
2. **Diff and scope** — trace changed files to the outcome, catch omitted necessary changes, unintended behavior, unrelated cleanup, and silent scope expansion.
3. **Tests and evidence** — assess whether checks exercise the changed behavior and relevant failure paths, whether outputs match the current candidate, and whether manual checks are reproducible.
4. **Regression and edge cases** — prioritize plausible consequences grounded in the code, data, interfaces, or repository architecture.
5. **Simplicity** — flag unnecessary complexity only when a smaller approach materially reduces risk or maintenance burden; avoid speculative style preferences.
6. **Research validity** — separate hypothesis, implementation, measurement, interpretation, and decision; verify dataset/cases, judge, rubric, schema, repetitions, build conditions, variance, and coverage limits. Negative findings are valid. Never generalize “no regression” beyond covered cases.
7. **Documentation and logs** — verify required research/decision updates and that recorded claims match executed evidence.
8. **Merge/readiness condition** — check the ticket's specified branch, merge, deployment, or artifact requirement without assuming that an unmerged result is automatically unacceptable.

## Findings

Use only these severities:

- `blocker` — the outcome cannot safely be accepted, critical evidence is invalid/absent, or a severe defect must be resolved;
- `important` — a substantive acceptance, regression, evidence, scope, or maintainability issue that must be resolved or explicitly accepted before closure;
- `minor` — a concrete improvement that does not prevent closure.

For every finding include severity, affected criterion or obligation, exact path and location or artifact, observed evidence, consequence, and a specific resolution. Do not pad the report with praise, vague “consider” comments, formatting tastes, or hypothetical problems unsupported by the repository.

Every concrete finding, including `minor`, must also link to an outcome-equivalent existing backlog ticket or a new ticket captured through `.claude/skills/a-team/skills/capture-work/SKILL.md`. Apply this to defects; smells; duplication; unnecessary complexity; SOLID violations; risky coupling; dead abstractions; security, privacy, authorization, data, migration, performance, resource, accessibility, observability, dependency, license, supply-chain, test, documentation, and operational problems. Create separate tickets for independently actionable findings; do not merge them into a vague cleanup item. Ticket capture does not authorize implementation and does not add work to the active sprint.

A blocker-level security, privacy, authorization, data-loss, or operational-safety finding in the current candidate remains a `blocker`; the existence of its backlog ticket does not make the candidate acceptable.

State explicitly when no findings exist. Absence of findings means none were detected in inspected coverage, not universal correctness.

## Decide the review result

Identify first-pass acceptance from lifecycle history: it applies only when the first submitted review round has no `blocker` or `important` finding. Do not rewrite history after later fixes.

- If any `blocker` or `important` finding exists, recommend rework. Keep status `review` during the first-pass report.
- Begin rework only when the user explicitly directs it or substantive repair actually starts in the same operation. Then set `status: in_progress`, preserve both `started_at` and first `review_at`, update the compact backlog state, and append one `rework_started` event for that review round.
- If no blocking finding exists, state that the ticket is eligible for `close-ticket`. Do not set `done`, fill `done_at`, or imply closure has occurred.
- Minor findings must be resolved, explicitly accepted where the method permits, or carried transparently into closure evidence; never hide them.

## Record review activity

Use a unique review-session ID when the repository's ticket/session schema supports it. Record the review round, candidate identity, inspected evidence, findings, coverage, and disposition in the method-defined or existing review location. Do not invent a parallel review store.

Use current local ISO 8601 timestamps with timezone for events that actually occur. Inspect `a-team/metrics/events.jsonl` before appending. Preserve it append-only and prevent duplicates by ticket, candidate/review round, session, and event type.

The live method defines no generic `ticket_reviewed` lifecycle event; do not invent one. Append `rework_started` only when rework truly begins. Append `token_usage` only for provider-exposed counts, with purpose `review` for review work and `rework` only for actual rework. Preserve provider categories and use `null` for unknown schema fields; never estimate tokens. Parse appended JSON lines. If the log is absent, report that recording was unavailable rather than creating substitute infrastructure.

## Validate

Confirm:

- the report covers every acceptance criterion and required evidence type;
- findings are actionable, grounded, severity-ranked, and location-specific;
- every concrete finding has a resolvable backlog ticket link, with duplicate outcomes reused rather than recreated;
- research and measurement claims match executed coverage;
- first-pass acceptance is derived from actual review history;
- first-pass implementation was not edited;
- status stayed `review` unless rework actually began with authority;
- no closure fields, estimates, sprint commitments, scope, or historical timestamps changed;
- review/session and token records are idempotent and provider-backed;
- specialist results were interpreted rather than treated as state, and load-bearing external evidence is repository-visible;
- any `rework_started` event matches one real transition and states agree across ticket and backlog.

## Report

Lead with findings ordered `blocker`, `important`, then `minor`, each with evidence, resolution, and its backlog ticket link. Then report criterion coverage, checks actually run, research/measurement limits, first-pass acceptance, review disposition, found-work tickets created or reused, rework state if any, session/token recording, assumptions, and files changed. When no blocking findings exist, say that the ticket is eligible for closure through `close-ticket` and list any non-blocking found-work tickets.
