---
id: AT-10
title: Reconcile the goal-tree validator with lazy expansion
lane: null
type: bug
status: backlog
story_points:
created_at: 2026-07-20T16:56:07+02:00
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

`docs/experiments/goal-tree/validate.py` accepts a tree that follows the lazy-expansion rule
of `docs/experiments/intake/PROMPT.md`, so a deliberately unexpanded branch is not reported
as a structural error.

## Why

Two committed artifacts contradict each other:

- `docs/experiments/intake/PROMPT.md` (added in `3892c0d`, "lazy expansion keeps the seven
  stops honest") requires that a branch which is deliberately not decomposed stays
  `leaf: false` with `why_not_leaf: "külön futamban bontjuk"` and carries no children.
- `docs/experiments/goal-tree/validate.py:46-48` reports any non-leaf without children as
  `FAIL`, a rule that predates lazy expansion.

The consequence is observed, not hypothetical: `docs/plans/ticket-readiness.tree.json` was
produced by following `PROMPT.md` exactly and fails validation on `TR-1.1` and `TR-1.5`:

```
FAIL (2):
  TR-1.1: marked non-leaf but has no children — the tree stops without saying who does the work
  TR-1.5: marked non-leaf but has no children — the tree stops without saying who does the work
```

While this stands, either the validator's output is untrustworthy for every intake-produced
plan, or authors will decompose branches they were told not to decompose in order to get a
green run. `AGENTS.md` requires naming an artifact conflict rather than silently resolving it.

## Known context

- `validate.py:43-52` holds the rule pair: rule 1 forbids a childless non-leaf; it separately
  requires `why_not_leaf` on every non-leaf.
- `docs/experiments/goal-tree/schema.json` already permits a childless non-leaf: it has no
  children constraint, and the `undecidable` check type exists precisely to force
  `leaf: false`. The schema and the validator therefore also disagree.
- `runway.py` treats a childless non-leaf harmlessly — it counts leaves only.
- `docs/experiments/goal-tree/M-1.tree.json` predates the intake prompt and decomposes every
  branch, so the conflict did not surface until the first intake-produced plan.

## Open questions

- Which artifact is authoritative — is lazy expansion the intended rule that the validator
  must adopt, or is a childless non-leaf genuinely a defect that `PROMPT.md` should stop
  prescribing? Both files are committed; neither is marked superseded.
- If the validator adopts lazy expansion, what distinguishes a legitimate deferred branch
  from an accidentally abandoned one? Candidates observed in the existing artifacts: an
  `undecidable` check type, a specific `why_not_leaf` value, or an explicit marker field.
  None is decided.
- Should a deferred branch be reported at all — for example as a warning or a separate
  "deferred" count — so a plan cannot quietly defer its entire scope?
- `docs/experiments/` is an experiment directory. Does this work belong there, or does the
  goal-tree tooling first need a decision about promoting it out of `experiments/`?

## Scope notes

Provisional: the change is expected to be confined to
`docs/experiments/goal-tree/validate.py`, and possibly to `PROMPT.md` or `schema.json`
depending on which artifact is chosen as authoritative. Not established by refinement.

## Out of scope

None explicitly identified.

## Dependencies

Unknown.

## Refinement notes

Discovered while producing `docs/plans/ticket-readiness.tree.json` through the intake
procedure in `docs/experiments/intake/PROMPT.md`. The PO/PM was shown both the failure and
the conflict, and explicitly chose to keep the plan as written and reconcile the validator
separately rather than expand the deferred branches to satisfy it.
