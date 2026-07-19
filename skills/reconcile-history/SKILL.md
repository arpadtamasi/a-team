---
name: reconcile-history
description: Reconcile a proven error or contradiction in Scrum lifecycle or token history by proposing an evidence-backed correction, obtaining explicit approval, appending an event_corrected record, and aligning current ticket/backlog materializations only when required. Use this skill whenever the user asks to fix, correct, void, supersede, reconcile, or repair a wrong, duplicate, malformed, or misleading events.jsonl record or Scrum history. Do not use it for normal lifecycle transitions, missing evidence, metric improvement, or rewriting raw history.
compatibility: Requires existing canonical Scrum method, schemas, event log, and affected current-state artifacts.
---

# Reconcile History

Repair demonstrated project-management history without erasing the original record. Corrections are exceptional audit events, not a shortcut around lifecycle skills.

## Ownership and boundaries

This skill alone owns `event_corrected` events and exceptional evidence-backed repair of the current ticket/backlog materialization when an approved correction requires it.

Do not:

- edit, reorder, delete, or normalize any existing JSONL line;
- create a normal lifecycle transition that belongs to another skill;
- invent a missing timestamp, event, token count, decision, approval, or historical state;
- change history merely to improve velocity, reliability, cycle time, token ratios, or appearance;
- rewrite sprint commitments, closed archives, research evidence, implementation, or git history;
- treat chat recollection alone as sufficient historical evidence.

An absent event is not correctable because it has no target. Record a delayed normal event only when another owning operation and durable evidence establish its exact historical contract; otherwise keep the history unavailable and report the gap.

## Inputs and authority

Require:

- the exact erroneous raw line or an unambiguous event that resolves to one raw line;
- a concrete statement of what is wrong;
- inspectable evidence supporting `replace` or `void`;
- explicit approval of the exact correction plan before mutation.

Use `replace` when a full evidence-backed event can stand in for the target. Use `void` when the target must contribute nothing to the effective history, such as a proven duplicate or event that never occurred.

## Resolve the repository contract

1. Read `AGENTS.md` and prefer `.claude/skills/a-team/METHOD.md`.
2. Read `.claude/skills/a-team/schemas/events.md`, plus `.claude/skills/a-team/schemas/ticket.md`, `.claude/skills/a-team/schemas/sprint.md`, `.claude/skills/a-team/schemas/metrics.md`, and `.claude/skills/a-team/schemas/tokens.md` when affected.
3. If path authority, correction semantics, or affected state is materially ambiguous, stop before mutation and report the conflict.
4. Follow the live method and schemas over this skill.

Require the existing `a-team/metrics/events.jsonl`. Do not create a substitute log, correction file, or missing project-management infrastructure.

## Inspect and prove the discrepancy

Read the complete raw event log as bytes and as logical lines. Hash every nonblank raw line before parsing so a malformed JSON line can still be targeted. Inspect affected tickets, compact backlog entries, active/closed sprint records, derived summaries, evidence files, and relevant git facts.

For the target:

1. Calculate lowercase SHA-256 over the exact UTF-8 bytes of the line excluding its line terminator.
2. Record the positive one-based line number. The `(target_line, target_event_sha256)` pair is authoritative: the line selects the append-only occurrence and the hash verifies its unchanged content.
3. Require the line to exist earlier in the log and its exact bytes to match the hash. For identical duplicate lines, evidence must establish which occurrence is erroneous.
4. Reconstruct the effective correction chain already targeting that line/hash pair according to `.claude/skills/a-team/schemas/events.md`.
5. Demonstrate the discrepancy from repository evidence. Separate observed fact, inference, and explicit human decision.

If evidence establishes only that the record is suspicious, produce a report and leave history unchanged.

## Propose the exact reconciliation

Before writing, show one complete proposal containing:

- target line number, SHA-256, event identity, and relevant original fields;
- action `replace` or `void`;
- the complete replacement event, or `null` for `void`;
- reason, evidence references, and decision provenance;
- a new unique `correction_id`;
- the active `supersedes_correction_id`, or `null` for the first correction;
- affected metrics and reports;
- any exact ticket/backlog fields that must be aligned, with before and after values;
- explicit exclusions and remaining uncertainty.

Do not write until the user approves this exact proposal. A general request to “fix the history” authorizes investigation, not mutation.

## Apply the approved correction atomically

Use one current local ISO 8601 timestamp with timezone for the correction event.

1. Re-read the raw target, its hash, the active correction chain, and every proposed current-state field immediately before mutation.
2. Confirm the approved proposal still matches live evidence and no competing correction appeared.
3. Append exactly one `event_corrected` object conforming to `.claude/skills/a-team/schemas/events.md`, including the approved `materialized_repairs` array or an empty array.
4. For `replace`, include the complete valid replacement event with an evidence-backed original event timestamp. For `void`, set `replacement` to `null`.
5. If approved and necessary, align only the affected ticket and compact backlog fields to the already-proven current state. This is repair of a materialized fact, not a new transition; do not append another lifecycle event.
6. Leave `a-team/sprint.md`, sprint archives, raw prior lines, implementation, research records, branches, and git history unchanged.

Do not directly refresh `a-team/metrics/summary.json`; `report-metrics` owns deterministic regeneration from the effective event view.

Record reconciliation-session `token_usage` only when directly exposed by the provider, following `.claude/skills/a-team/schemas/tokens.md` with purpose `planning`. Never estimate counts.

## Idempotency and correction chains

Identify a correction by `correction_id` and its target line/hash pair. If the exact approved correction already exists and current materializations agree, report an idempotent success without appending.

The first correction for a target uses `supersedes_correction_id: null`. A later correction must name the currently active correction for that same target. Never fork a chain, target an `event_corrected` line directly, or silently choose between competing corrections. An invalid or ambiguous chain leaves the affected effective record unavailable until reconciled.

## Validate

Confirm:

- the target line exists earlier and its exact bytes match the target hash;
- action, evidence, replacement, provenance, and approval match the proposal;
- the replacement satisfies the event and token schemas and contains no invented values;
- the correction ID is unique and the supersedes chain is linear;
- every old JSONL byte is unchanged and exactly one valid correction line was appended;
- approved ticket/backlog repairs, if any, match the evidence and add no lifecycle transition;
- raw and effective views remain distinguishable;
- no summary, sprint, archive, implementation, research, branch, or unrelated ticket changed;
- repeated effective-view calculation produces the same result.

If validation fails, do not append a compensating fiction. Report the exact inconsistency; a further correction requires another approved proposal.

## Report

Report the correction ID, target line/hash/event, action, evidence and decision provenance, replacement summary, superseded correction if any, ticket/backlog alignment, affected derived metrics, files changed, token-recording result, validation status, and remaining unavailable or conflicting data. Clearly distinguish raw history from the effective corrected view.
