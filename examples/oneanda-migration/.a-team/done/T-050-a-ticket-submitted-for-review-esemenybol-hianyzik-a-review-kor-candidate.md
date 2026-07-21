---
id: T-050
title: >-
  A ticket_submitted_for_review eseményből hiányzik a review-kör/candidate
  azonosító
status: done
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Sat Jul 18
updated_at: '2026-07-21'
resolution: obsolete
---
# T-050 — A ticket_submitted_for_review eseményből hiányzik a review-kör/candidate azonosító

## Outcome

A `ticket_submitted_for_review` esemény sémája hordozza a review-kört és/vagy a candidate azonosítót, így két beadás ugyanarra a ticketre az események szintjén megkülönböztethető — ahogy azt a submit-review idempotencia-szabálya elvárja.

## Scope

2026-07-18 adversarial review lelet (PR #61), confidence 7/10; a mi-iranytu forrásban is fennáll. Megjegyzés: a mi-iranytu gyakorlatban a submit-review már ír `review_round` és `candidate` mezőt (ld. a 2026-07-17-i A-9 eseménysort ott) — a séma kullog a gyakorlat mögött. Érintett: `.claude/skills/scrum/schemas/events.md`, `.claude/skills/scrum/skills/submit-review/SKILL.md`, `review-ticket`.

## Non-goals

None explicitly identified.

## Acceptance

- The outcome is observable: A `ticket_submitted_for_review` esemény sémája hordozza a review-kört és/vagy a candidate azonosítót, így két beadás ugyanarra a ticketre az események szintjén megkülönböztethető — ahogy azt a submit-review idempotencia-szabálya elvárja.

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-49; lane: cross-cutting; legacy status: rejected.

## Open decisions

- Kötelező vagy opcionális legyen a `review_round`/`candidate` mező az első beadásnál?

## Actual behaviour

A `schemas/events.md` a submit eseményhez csak `ticket_id`+`sprint`-et követel, miközben a `submit-review` skill a duplikátumot „by ticket, review round/candidate, and existing transition event — not timestamp alone" alapon azonosítaná. Az első valódi rework-kör két séma-szinten azonos sort ír, és a tiltott timestamp-alapú megkülönböztetés marad az egyetlen út.

## Expected behaviour

A `ticket_submitted_for_review` esemény sémája hordozza a review-kört és/vagy a candidate azonosítót, így két beadás ugyanarra a ticketre az események szintjén megkülönböztethető — ahogy azt a submit-review idempotencia-szabálya elvárja.

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · cross-cutting lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

A `schemas/events.md` a submit eseményhez csak `ticket_id`+`sprint`-et követel, miközben a `submit-review` skill a duplikátumot „by ticket, review round/candidate, and existing transition event — not timestamp alone" alapon azonosítaná. Az első valódi rework-kör két séma-szinten azonos sort ír, és a tiltott timestamp-alapú megkülönböztetés marad az egyetlen út.

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Review evidence

**MIGRÁLVA 2026-07-19T14:11:40+02:00** → **[arpadtamasi/a-team#3](https://github.com/arpadtamasi/a-team/issues/3)**

## Execution notes

Migration preview only. Source: scrum/tickets/O-49-review-round-hianyzo-esemeny-mezo.md. No product implementation or human ready approval is implied.
