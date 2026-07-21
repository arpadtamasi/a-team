---
id: AT-11
title: Decide whether ticket readiness may require type-dependent evidence
lane: null
type: decision
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

A recorded PO/PM decision states whether a ticket's readiness check may demand evidence that
depends on the ticket's type, and if so, where the type comes from and how the evidence's
presence is observed.

## Why

The PO/PM raised it directly during the intake session that produced
`docs/plans/ticket-readiness.tree.json`: a ticket touching the UI should have to show a
screenshot, and different ticket types plausibly carry different evidence obligations.

It cannot be folded into the readiness work already planned. That plan's approved boundary is
that the tool reports empty fields only and never judges content quality. Deciding "this is a
UI ticket" and "this screenshot is sufficient evidence" is a judgement, so it is a different
tool with a different risk profile. The plan carries it as the deliberately unexpanded branch
`TR-1.5`, owner `human`.

Without a recorded decision the question is lost between sessions, and the readiness tool
would be built a second time rather than extended.

## Known context

- `schemas/ticket.md` already defines a `type` frontmatter field with the values `feature`,
  `bug`, `research`, `operations`, `decision`, `documentation`, `other`. A type source
  therefore already exists on disk; whether it is the right one is not decided.
- `METHOD.md:171-181` (Definition of Ready) is type-independent today. Type-dependent
  evidence would be an addition to it, which `AGENTS.md` self-dogfooding rules place under
  the method's own change process.
- The readiness plan keeps its rule set as data rather than branching code specifically so a
  per-type rule can be added later without a rewrite. See the `TR-1.2` notes in
  `docs/plans/ticket-readiness.tree.json`.
- Candidate type/evidence pairs raised in the session, none of them decided: UI change →
  screenshot; schema change → reverse migration; API change → version; agent skill → a
  worked example that was actually run.

## Open questions

- Does the type come from the existing `type:` frontmatter field, or from an agent's
  judgement about the ticket's content? The two differ in cost and in trustworthiness, and
  the first is already available.
- How is "the evidence is present" observed without judging its quality? A named file
  existing is observable; a screenshot showing the right thing is not.
- Does a missing type-dependent evidence item block `ready`, or is it advisory like the
  general readiness report the PO/PM already decided must not block?
- Does this belong in the Definition of Ready in `METHOD.md`, in the Definition of Done, or
  only in the readiness reporting tool?
- Which types actually earn a rule? An unbounded per-type rule table is a maintenance
  surface, not a feature.

## Scope notes

Provisional: this ticket is the decision itself, not its implementation. Refinement must
decide whether the resulting build work is a separate ticket.

## Out of scope

- The general, type-independent readiness check planned in
  `docs/plans/ticket-readiness.tree.json`. That work is approved and proceeds without this
  decision.

## Dependencies

Unknown.

## Refinement notes

Captured from the intake session on 2026-07-20 at the PO/PM's explicit instruction that open
questions must reach the backlog rather than stay in a plan file. The PO/PM owns this
decision; the agent may not resolve it alone.
