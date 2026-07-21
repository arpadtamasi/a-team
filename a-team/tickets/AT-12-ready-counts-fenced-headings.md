---
id: AT-12
title: Stop counting fenced code-block headings as real ticket sections
lane: null
type: bug
status: backlog
story_points:
created_at: 2026-07-20T23:05:00+02:00
ready_at:
started_at:
review_at:
done_at:
sprint:
milestone:
branch:
blocked_periods: []
metrics:
  work_sessions: []
---

## Outcome

`skills/ready/ready.py` counts a `## ` heading as a ticket section only when it is a real
heading, so a heading quoted inside a fenced code block cannot make an incomplete ticket
report as complete.

## Why

`ready.py` collects sections with a plain prefix test over every line
(`line.startswith("## ")`) and never tracks fenced-block state. A `## Verification` line
written inside a ```` ``` ```` block therefore satisfies the requirement.

Reproduced against the live repository. Appending this to `a-team/tickets/AT-6-board-v2.md`:

```markdown
## Verification
## Acceptance criteria
```

changes its verdict from

```
AT-6  ⛔ Scope, Out of scope, Acceptance criteria, Verification, Dependencies, story_points
```

to

```
AT-6  ⛔ Scope, Out of scope, Dependencies, story_points
```

The file was restored afterwards; no ticket content was left modified.

The consequence is the exact failure the tool exists to prevent. A ticket that merely quotes
a markdown example — a realistic thing for a documentation, schema, or skill ticket to do,
since `schemas/ticket.md` itself presents the section list inside a fenced block — is
reported as carrying requirements it does not carry. A false ✅ is worse than no tool,
because the readiness report is meant to be the thing that is trusted at a glance.

No ticket in `a-team/tickets/` triggers it today, so this is a latent defect, not a currently
wrong report.

## Known context

- The section scan is in `parse()` in `skills/ready/ready.py`; it is one set comprehension
  over the lines after the frontmatter.
- The frontmatter parse has the same shape of assumption — it stops at the first `---` line
  and treats any remaining `key: value` line as a top-level field — but no failing case has
  been demonstrated for it.
- `docs/plans/ticket-readiness.tree.json` leaf `TR-1.3` proves the tool reads real content by
  deleting a section. That check passes and remains valid; it does not cover the inverse
  direction, where content is added that should not count.

## Open questions

- Should the same fenced-block awareness apply to the frontmatter parse, or is that a
  separate finding that needs its own demonstrated failure first?
- Should `TR-1.3`'s honesty test in the goal tree gain a symmetric case — add a heading that
  must not count — so this class of defect is caught by the plan's own criteria rather than
  by inspection?

## Scope notes

Provisional: expected to be confined to `parse()` in `skills/ready/ready.py`, plus a check
that demonstrates the fenced case. Not established by refinement.

## Out of scope

- Judging whether a section's content is adequate. The tool's approved boundary is presence,
  not quality.

## Dependencies

Unknown.

## Refinement notes

Found by inspection while verifying `docs/plans/ticket-readiness.tree.json` against the
delivered `skills/ready/ready.py`, which was written in a separate session and is not yet
committed. Captured under the `AGENTS.md` Boy Scout rule; not fixed inside the verification
pass.
