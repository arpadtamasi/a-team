---
id: AT-6
title: Harden the board skill into the Backlog.md-level PM surface
lane: null
type: feature
status: backlog
story_points:
created_at: 2026-07-20T08:56:00+02:00
ready_at:
started_at:
review_at:
done_at:
sprint:
milestone: M-1
branch:
blocked_periods: []
metrics:
  work_sessions: []
---

## Outcome

The board skill (`skills/board/`) reaches the Backlog.md web UI's polish while keeping
its differentiators (age-in-state, median per column, read-only): ticket drawer with full
contract, cumulative flow view from events, per-project taxonomy config surfaced from
`init-workspace`, and a documented one-command start.

## Why

PO/PM direction (2026-07-20): "I want a Backlog.md-level product." The v1 board landed in
the package (lifecycle columns, age from events.jsonl, milestone/sprint strip, lane/type
filters, 127.0.0.1-only, no repo-root serving). Verified against the Backlog.md web UI on
the same 84-ticket dataset; what their UI has and ours lacks: card drawer, drag-and-drop
(deliberately excluded — ungated state editing), forms (excluded — operations own writes).

## Known context

- Data source is server-parsed `/api/state` (tickets frontmatter + events.jsonl), one
  fetch per poll.
- Competitor evidence in `~/.gstack/projects/arpadtamasi-a-team/competitor-eval.md`:
  neither Beads nor Backlog.md can show time-in-state (no event history).
- Taxonomy config belongs to AT-1's init-workspace pattern (lanes, types, display).

## Open questions

- Does the board ever get a write path (invoking operations, never editing files)?
- Cumulative flow / metrics view: same page or a second tab?
