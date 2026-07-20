# Event contract

`a-team/metrics/events.jsonl` is append-only raw truth. Each line is one JSON object with:

- `timestamp`: ISO 8601 with timezone;
- `event`: one supported event name;
- the event payload required below;
- optional `source` naming the operation when it is recorded;
- optional `note` carrying a short factual disclosure about the record itself (never a value the schema already defines);
- no invented values.

A ticket lifecycle event names exactly one commitment container: `sprint` for sprint-managed work, `milestone` for milestone-managed work (`milestone.md`). Never both, never neither once the ticket is committed.

Existing lines are never edited, reordered, or deleted. Derived summaries never override raw events.

## Supported events

| Event | Required payload beyond the envelope |
|---|---|
| `ticket_created` | `ticket_id`, `status: "backlog"`, `type` |
| `ticket_ready` | `ticket_id`, `story_points`; `status: "ready"` may be recorded |
| `ticket_started` | `ticket_id`, container (`sprint` or `milestone`, exactly one, non-empty), `session_id`; exposed `agent` and `model` values may be recorded |
| `ticket_submitted_for_review` | `ticket_id`, container (`sprint` or `milestone`, exactly one, non-empty); `session_id` is recorded when exposed |
| `rework_started` | `ticket_id`, container (`sprint` or `milestone`, exactly one, non-empty); identify the review round or candidate when the repository records it |
| `ticket_blocked` | `ticket_id`, `reason`, `prior_status` |
| `ticket_unblocked` | `ticket_id`, `restored_status`, `resolution_evidence` |
| `ticket_done` | `ticket_id`, container (`sprint` or `milestone`, exactly one, non-empty), unchanged `story_points`; `session_id` is recorded when exposed |
| `ticket_parked` | `ticket_id`, `status: "parked"`, `prior_status`, `reason`, `decision_provenance` |
| `ticket_rejected` | `ticket_id`, `status: "rejected"`, `prior_status`, `reason`, `decision_provenance` |
| `sprint_started` | `sprint`, `goal`, `baseline_commit` as the repository's full lowercase hexadecimal commit object ID, ordered `committed_ticket_ids`, `committed_points`, ordered `stretch_ticket_ids` |
| `sprint_closed` | `sprint`, `result`, `committed_points`, `completed_committed_points`, `throughput` |
| `milestone_started` | `milestone`, `goal`, `baseline_commit`, ordered `committed_ticket_ids` — see `milestone.md` |
| `milestone_closed` | `milestone`, `result`, `completed_committed_points`, `throughput` — see `milestone.md` |
| `token_usage` | fields defined in `tokens.md` |
| `event_corrected` | fields defined under **Correction event** |

Nullable fields remain present only where an established event shape requires them; their values are never guessed. Event-specific skills define the state mutation, evidence collection, and refusal rules. An operation is idempotent by semantic transition and entity identity, not by timestamp alone. A partial state/file/event representation is an inconsistency to reconcile, not permission to append a duplicate.

## Correction event

An approved correction appends this exact shape:

```json
{
  "timestamp": "<correction time, ISO 8601 with timezone>",
  "event": "event_corrected",
  "correction_id": "<unique stable ID>",
  "target_event_sha256": "<64 lowercase hexadecimal characters>",
  "target_line": 12,
  "action": "replace",
  "replacement": {"timestamp":"<evidence-backed original event time>","event":"<valid non-correction event>","...":"<complete payload>"},
  "reason": "<concrete demonstrated error>",
  "evidence": ["<inspectable repository evidence>"],
  "decision_provenance": "<explicit approver and approval evidence>",
  "supersedes_correction_id": null,
  "materialized_repairs": [],
  "source": "reconcile-history"
}
```

`target_event_sha256` is SHA-256 over the exact UTF-8 bytes of one earlier nonblank raw line, excluding its line terminator. `target_line` is its positive one-based append-only line number. The pair is authoritative: the line selects an occurrence, including one of several identical lines, and the hash verifies its unchanged content. The selected line may be malformed JSON. A correction never targets another `event_corrected` line.

`action` is `replace` or `void`. `replace` requires one complete event object conforming to the applicable lifecycle or token schema; it may not itself be `event_corrected`. `void` requires `replacement: null`. Replacement timestamps and values must be evidence-backed, never inferred for convenience.

`correction_id` is unique. The first correction for a target uses `supersedes_correction_id: null`. A later correction for the same target must name its currently active correction. Forked, cyclic, missing, cross-target, or duplicate-ID chains are invalid.

`materialized_repairs` is an array of approved current ticket/backlog repairs, each with `artifact`, `field`, `before`, and `after`; use an empty array when none are required. It records reconciliation of an already-proven fact, never a new lifecycle transition.

## Effective event view

Consumers calculate the effective view deterministically:

1. hash every nonblank raw line before parsing;
2. validate correction envelopes and match each target line/hash pair to one earlier non-correction line;
3. build one linear correction chain per target pair in append order;
4. use the active correction's full replacement at the target's original position, or omit the target for `void`;
5. exclude correction audit events themselves from lifecycle and token metrics;
6. leave any target with an invalid or ambiguous chain unavailable and report the exact lines and reason.

Raw lines remain the audit truth. The effective view is derived and reproducible; it never overwrites `events.jsonl`.
