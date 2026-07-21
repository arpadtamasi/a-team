---
id: AT-13
title: Give unresolved questions a place to live in a refined ticket
lane: null
type: bug
status: backlog
story_points:
created_at: 2026-07-20T23:20:00+02:00
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

A question that is still unresolved when a ticket is refined has a defined place in the
refined ticket, so refinement cannot silently drop it.

## Why

`schemas/ticket.md` defines two bodies. The capture-stage body contains `## Open questions`.
The refined ("executable") body does not — its sections are `Outcome`, `Why`, `Scope`,
`Out of scope`, `Acceptance criteria`, `Verification`, `Dependencies`, `Context`, `Result`.

`skills/refine-ticket/SKILL.md:235-237` instructs refinement to use the refined body and to
"Remove or clearly supersede contradictory capture-stage wording". It never mentions open
questions and gives no destination for one that is still open. So a question either
disappears at refinement or survives only in a section the schema no longer sanctions.

This is not theoretical. Nine tickets in `a-team/tickets/` currently carry an
`## Open questions` section, including `AT-10`, `AT-11` and `AT-12` captured today. Each of
them is scheduled to pass through refinement.

The PO/PM stated the governing rule on 2026-07-20: open questions must reach the backlog and
stay visible, "különben elfelejtjük". A schema in which the executable form has no slot for
an unresolved question works directly against that rule — the surface that is supposed to
remember is the one that forgets.

## Known context

- `schemas/ticket.md`, section "Capture-stage body" versus "Refined ticket body": the
  asymmetry is visible by comparing the two lists.
- `skills/refine-ticket/SKILL.md` contains no occurrence of "open question".
- The schema does allow an optional `Refinement notes` section on a refined ticket, which
  "may preserve sizing rationale, resolved ambiguity, and remaining constraints". Whether a
  still-open question counts as a "remaining constraint" is not stated.
- `METHOD.md:183` says a ticket is not ready while "meaningful product, architecture,
  research, or measurement decisions remain unresolved". This is the tension: some open
  questions must block `ready`, but not all of them, and the schema currently expresses
  neither case.
- Independently observed in `docs/experiments/need-questions/NOTES.md`: "a
  `schemas/ticket.md` capture-törzsében van `## Open questions`, a végrehajtható törzsben
  nincs. Vagyis a finomítás után a nyitott kérdésnek nincs hova kerülnie."

## Open questions

- Does a refined ticket keep `## Open questions` as a sanctioned section, or does refinement
  have to resolve every question, or split the unresolved ones out into their own tickets?
  All three are consistent with the method as written today.
- If an unresolved question may remain, does it block `ready`? `METHOD.md:183` blocks on
  unresolved *decisions*; a question about, say, output formatting is not obviously one.
- Does an open question need a named owner (`agent` / `human`) in the schema? The
  `need-questions` experiment treats an unowned question as unfinished, and `AT-10` — written
  earlier today — demonstrates the cost of omitting owners: its four questions have different
  owners and the list does not say which need a human.
- Is the fix a schema change, a `refine-ticket` change, or both? Changing `schemas/ticket.md`
  is a method change and falls under the `AGENTS.md` self-dogfooding rules.

## Scope notes

Provisional: expected to touch `schemas/ticket.md` and `skills/refine-ticket/SKILL.md`. Not
established by refinement.

## Out of scope

- Rewriting the Definition of Ready in `METHOD.md`.
- The `need-questions` experiment itself and its own deferred decisions (owner-assignment
  rule, stopping rule). Those belong to that experiment's run, not to this ticket.

## Dependencies

Unknown.

## Refinement notes

Surfaced by the `docs/experiments/need-questions` experiment and confirmed directly against
`schemas/ticket.md` and `skills/refine-ticket/SKILL.md` before capture. Captured at the
PO/PM's explicit instruction; the experiment's other two findings were deliberately not
captured here.
