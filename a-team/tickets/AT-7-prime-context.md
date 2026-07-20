---
id: AT-7
title: Make prime the default cheap session context for agents
lane: null
type: feature
status: backlog
story_points:
created_at: 2026-07-20T08:57:00+02:00
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

`skills/prime/` (landed: ~60-line state + rules digest) becomes the documented default
entry for agent sessions: AGENTS.md template points to it, `init-workspace` installs the
pointer, and the method read-path cost per routine turn drops from ~800 lines to ~60.

## Why

Measured in the 2026-07-20 session: every operation currently rereads AGENTS.md (200) +
METHOD.md (275) + PROCESSES.md (205) + schemas (470) before acting; token accounting is a
headline feature while the method itself is the largest token consumer. Beads' `bd prime`
(~80 lines, dynamic) proved the pattern drives agents well — it was the smoothest of the
three systems in the agent test.

## Known context

- prime is summary, not authority: METHOD.md/schemas/owning skill win on conflict, and
  operations still read their owning skill before executing.
- Competitor evidence: `competitor-eval.md`, agent-test section.

## Open questions

- Auto-inject at session start (hook), or explicit invocation only?
- Should prime output include the token spend of the current sprint/milestone?
