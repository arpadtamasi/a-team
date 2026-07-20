---
id: AT-8
title: Board, prime és milestone-alap leszállítva
lane: null
type: feature
status: review
story_points:
created_at: 2026-07-20T10:30:00+02:00
ready_at:
started_at:
review_at: 2026-07-20T11:15:00+02:00
done_at:
sprint:
milestone: M-1
branch:
blocked_periods: []
metrics:
  work_sessions: []
---

## Outcome

Az A-Team csomag tartalmaz egy read-only PM-boardot, egy olcsó agent-kontextus operációt
(`prime`), és a milestone-konténer adatmodelljét.

## Scope

- `skills/board/` — `serve.mjs`, `board.html`, `SKILL.md`.
- `skills/prime/` — `prime.py`, `SKILL.md`.
- `schemas/milestone.md` — a milestone alakja, eseményei, invariánsai.
- `METHOD.md` „Milestones" szakasz; `a-team/milestones/*.md` a sources-of-truth táblában;
  `board` és `prime` a lifecycle-ownership táblában.
- `schemas/ticket.md` `milestone:` mező; `schemas/events.md` konténer-szabály,
  `milestone_started` / `milestone_closed` sorok, opcionális `note` az envelope-ban.
- `PROCESSES.md` és root `SKILL.md` operációlistája.

## Out of scope

- Milestone-operációk (`plan-milestone` / `close-milestone`) — AT-5.
- Board drawer, kumulatív flow, taxonómia-konfig — AT-6.
- A `prime` dokumentált alapértelmezetté tétele — AT-7.
- Drag-and-drop és űrlapos szerkesztés a boardon: **szándékosan soha**. Kapu nélküli
  állapotírás lenne, azaz pontosan az, amit a módszer kizár.

## Acceptance criteria

1. A board egy tetszőleges A-Team vagy legacy `scrum/` workspace-en elindul, és az
   életciklus-oszlopokban (`backlog · ready · in_progress · review · done`) mutatja a
   ticketeket, kártyánként az **állapotban töltött idővel**, az `events.jsonl` utolsó
   életciklus-eseményéből számolva.
2. A `prime` ugyanarra a ticketre ugyanazt az állapotot és ugyanazt az állapotban töltött
   időt adja, mint a board.
3. A board szerver csak `127.0.0.1`-en figyel; a saját forrása (`serve.mjs`), a repo
   gyökere és a `.git` nem érhető el rajta keresztül.
4. `schemas/milestone.md` nem mond ellent a `METHOD.md`-nek és a többi sémának; a
   milestone-események és a `milestone:` ticketmező le vannak írva.
5. A `board` és a `prime` megtalálható a METHOD.md lifecycle-ownership táblájában, a
   PROCESSES.md-ben, a root `SKILL.md` operációlistájában és a `prime` saját `OPS:`
   sorában.

## Dependencies

Nincs. Az AT-9 hordozza a független bírálaton talált hibák javítását.

## Context

A PO/PM 2026-07-20-án Backlog.md-szintű terméket kért, milestone-nal a sprint helyett,
és azt, hogy vegyük át, ami a versenytársakból átvehető. A `prime` mintája a Beads
`bd prime`-jából jön; a board a Backlog.md webes kanbanjának mércéjére készült, írás nélkül.

Versenytárs-bizonyíték: `~/.gstack/projects/arpadtamasi-a-team/competitor-eval.md`. Sem a
Beads, sem a Backlog.md nem tud állapotban töltött időt mutatni (nincs eseménytörténetük),
és mindkettőnél lezárható bármely ticket bizonyíték nélkül.

## Verification

Minden bizonyíték a `/Users/rp/Dev/progos/a-team` repóban vagy a nevesített eldobható
klónban készült. A klón útvonala pontosan: `~/tmp/eval/oneanda-backlog` (84 ticket,
`O-53` `ready`) — **nem** az élő `/Users/rp/Dev/ezchops/oneanda` (87 ticket, `O-53`
`in_progress`), amely azóta továbbfejlődött.

| # | Bizonyíték |
| --- | --- |
| 1 | `node skills/board/serve.mjs --port 4403` a csomagrepóban: `/api/state` 13 ticket, 1 milestone. `--workspace scrum` a `~/tmp/eval/oneanda-backlog` klónon: 84 ticket; `O-10` `ready` 18h (sárga), `O-53`/`O-54` `ready` 2d (piros). |
| 2 | `python3 skills/prime/prime.py scrum` ugyanazon a klónon: `O-10 18h in state`, `O-53 2d in state`, `O-54 2d in state` — egyezik a board `status_since` értékeivel. |
| 3 | `curl` a 4403-on: `/` 200, `/board.html` 200, `/serve.mjs` 404, `/../README.md` 404, `/.git/HEAD` 404, `/..%2f..%2fREADME.md` 404; a gép LAN-IP-jén `000` (nem elérhető). |
| 4 | `schemas/events.md` konténer-szabálya és a `milestone.md` egyezik; a `note` mező deklarálva az envelope-ban. |
| 5 | `grep -l "A-Team source repository" skills/*/SKILL.md` → 19/19 skill. `board` és `prime` szerepel a METHOD.md:153-154, PROCESSES.md:62-63, `SKILL.md`:34 helyeken. |

## Result

**Utólagos capture.** A munka a ticket létrehozása ELŐTT landolt, feltalált scope-ként, a
`2026-07-19` sprint vállalásán kívül. A PO/PM ezt utólag az M-1 milestone-ba sorolta, hogy
a futó sprint metrikái ne torzuljanak.

**Az M-1 milestone maga is kézzel készült**, a `schemas/milestone.md` szerint, mert az
owning operációk (AT-5) még nincsenek megírva. A `milestone_started` esemény ezt
`"source":"office-hours-manual"` értékkel rögzíti. Ez tudatos kivétel, nem precedens.

Ez a ticket **szándékosan pont nélküli**: soha nem ment át `refine-ticket`-en, tehát
velocityt nem termelhet. A `ready_at` és `started_at` üresen marad, mert nem volt valós
átmenetük; ezek hiánya itt van kimondva, nem rekonstruálva.

Első bírálati kör: rework, 1 blocker + 4 important. A javítások az AT-9-ben landtak; ez a
törzs a blocker (hiányzó elfogadási feltételek) javítása.
