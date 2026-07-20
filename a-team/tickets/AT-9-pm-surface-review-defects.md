---
id: AT-9
title: Fix the review defects in the board and prime delivery
lane: null
type: bug
status: review
story_points:
created_at: 2026-07-20T10:45:00+02:00
ready_at:
started_at: 2026-07-20T10:45:00+02:00
review_at: 2026-07-20T11:25:00+02:00
done_at:
sprint:
milestone: M-1
branch:
blocked_periods: []
metrics:
  work_sessions: []
---

## Outcome

The defects found by the independent `review-ticket` pass on AT-8 are fixed, so the M-1
foundation is internally consistent and its two new operations are discoverable.

## Scope

- `skills/prime/prime.py` — derive age from the last lifecycle event in `events.jsonl`,
  as `skills/board/serve.mjs` already does, so both tools report the same age-in-state.
- `schemas/events.md` — ticket lifecycle rows accept `sprint` **or** `milestone` (exactly
  one, non-empty); resolve the contradiction with `schemas/milestone.md`.
- `METHOD.md` — register `board` and `prime` as read-only operations in the lifecycle
  ownership table; add `a-team/milestones/*.md` to the sources-of-truth table.
- `PROCESSES.md` and root `SKILL.md` — list `board` and `prime` in the operation roster.
- `skills/prime/prime.py` — complete the `OPS:` roster (it omits `board`, `prime`,
  `init-workspace`).
- `skills/board/SKILL.md`, `skills/prime/SKILL.md` — add the standard source-resolution
  stanza every other operation carries.
- `skills/board/serve.mjs` — path containment compares against `here + sep`, and only
  board assets are served.
- `a-team/backlog.md`, `a-team/milestones/M-1-pm-surface.md` — render `— SP`, never the
  invented `0 SP`.
- `a-team/tickets/AT-8-pm-surface-foundation.md` — normalise the body to the executable
  shape of `schemas/ticket.md` with observable acceptance criteria; state the exact clone
  path in Verification; disclose that M-1 was created by hand.

## Out of scope

- Milestone operations (`plan-milestone` / `close-milestone`) — owned by AT-5.
- Board drawer, cumulative flow, taxonomy config — owned by AT-6.
- Making `prime` the documented default entry — owned by AT-7.

## Acceptance criteria

1. For every ticket, `prime` and the board report the same status and the same
   age-in-state, both derived from the last lifecycle event. Demonstrated on a ticket
   whose `ready_at` and last event differ.
2. `schemas/events.md` and `schemas/milestone.md` do not contradict each other; the AT-8
   `ticket_submitted_for_review` line is valid against the amended events schema, and any
   field it carries is declared in the envelope.
3. `board` and `prime` appear in METHOD.md's lifecycle ownership table, PROCESSES.md,
   root `SKILL.md`'s operation list, and `prime`'s own `OPS:` roster; `a-team/milestones/*.md`
   appears in METHOD.md's sources of truth.
4. Both new `SKILL.md` files carry the same source-resolution stanza as the other
   operations, so `grep "A-Team source repository" skills/*/SKILL.md` matches every skill.
5. `curl <board>/serve.mjs` does not return the server source; traversal probes still 404.
6. No `0 SP` string remains in `a-team/`.
7. AT-8's body satisfies `schemas/ticket.md`, its Verification names the exact repository
   path used for evidence, and the manual creation of M-1 is disclosed.

## Dependencies

None. AT-8 stays in `review` until this rework lands and it is resubmitted.

## Context

Findings come from the independent `review-ticket` pass on AT-8 (2026-07-20), which
returned rework with 1 blocker and 4 important findings.

One reviewer finding was **rejected after verification**: it claimed the AT-8 evidence was
false (87 tickets, `O-53` `in_progress`). The reviewer checked the live
`/Users/rp/Dev/ezchops/oneanda` instead of the evaluation clone
`~/tmp/eval/oneanda-backlog`, which really does hold 84 tickets with `O-53` `ready`.
The underlying lesson is kept as criterion 7: verification evidence must name its exact
path, or a reviewer has to guess which repository to check.

## Verification

Minden ellenőrzés a `/Users/rp/Dev/progos/a-team` repóban futott; a 2. kritérium
bizonyítéka a `~/tmp/eval/oneanda-backlog` klónon (84 ticket).

| # | Kritérium | Eredmény | Bizonyíték |
| --- | --- | --- | --- |
| 1 | prime és board azonos állapot + azonos állapotidő | PASS | `O-10` prime 18h / board 18h; `O-53` 2d / 2d; `O-54` 2d / 2d. Mindhárom `ready`, `ready_at` és utolsó esemény eltér, tehát a régi számítás mást adott volna. |
| 2 | sémák nem mondanak ellent | PASS | `schemas/events.md` konténer-szabály + a négy lifecycle sor `sprint` vagy `milestone`; `note` deklarálva az envelope-ban, tehát az AT-8 submit sora érvényes. |
| 3 | board és prime regisztrálva | PASS | METHOD.md lifecycle-ownership + `a-team/milestones/*.md` a sources of truth-ban; PROCESSES.md két új sor; root `SKILL.md` roster; `prime.py` `OPS:` sora teljes. |
| 4 | forrás-feloldási szakasz mindenhol | PASS | `grep -l "A-Team source repository" skills/*/SKILL.md` → 19/19. |
| 5 | csak board asset szolgálható ki | PASS | `/` 200, `/board.html` 200, `/serve.mjs` 404, `/../README.md` 404, `/.git/HEAD` 404, `/..%2f..%2fREADME.md` 404, LAN-IP 000. |
| 6 | nincs `0 SP` | PASS | `grep -r "0 SP" a-team/backlog.md a-team/milestones/` üres. |
| 7 | AT-8 törzse sémakonform | PASS | `## Acceptance criteria` jelen; a Verification megnevezi a pontos klónútvonalat; az M-1 kézi létrehozása kimondva. |

## Result

Mind a hét kritérium teljesült. A `serve.mjs` javítása közben egy saját regresszió is
előjött és javítva lett: a `sep` import hiányzott, ami minden asset-kérést 500-ra vitt;
ez az újramérésnél derült ki, nem maradt benne.
