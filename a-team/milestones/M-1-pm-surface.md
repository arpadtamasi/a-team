---
id: M-1
title: Az A-Team PM-felülete Backlog.md-szinten áll
goal: Egy idegen egy repón elindítja az A-Teamet, és kap egy élő PM-nézetet, amelyben a munka állapota és állapotban töltött ideje ránézésre látszik, olcsó agent-kontextussal.
status: active
created_at: 2026-07-20T10:30:00+02:00
closed_at:
baseline_commit: 3c895a685595fd0fde02378a7629cf0cf83b0d2d
---

## Goal evidence

A milestone akkor zárható, ha mind teljesül:

- Egy friss repón `init-workspace` + board indítás után látszik a teljes életciklus,
  állapotban töltött idővel, projektspecifikus taxonómiával.
- Az agent-belépő `prime` (nem a teljes metódus-olvasás) a dokumentált alapértelmezés.
- A milestone a működő commitment-konténer: `plan-*` és `close-*` operációk kezelik,
  nem kézi fájlszerkesztés.
- A boardon a `done` oszlop kártyáin látszik a bírálati verdikt és a token-költség.

## Committed

1. [AT-8 — Board, prime és milestone-alap leszállítva](../tickets/AT-8-pm-surface-foundation.md) — utólagos capture, — SP
2. [AT-5 — Migrate commitment operations from sprint to concurrent milestones](../tickets/AT-5-milestone-container-operations.md) — — SP
3. [AT-6 — Harden the board skill into the Backlog.md-level PM surface](../tickets/AT-6-board-v2.md) — — SP
4. [AT-7 — Make prime the default cheap session context for agents](../tickets/AT-7-prime-context.md) — — SP
5. [AT-9 — Fix the review defects in the board and prime delivery](../tickets/AT-9-pm-surface-review-defects.md) — — SP

Az AT-5/6/7 még nem `ready`; a milestone tartalmazza őket, de finomítás előtt nincs pontjuk.

## Approval

A PO/PM a 2026-07-20-i office-hours munkamenetben kifejezetten a „külön milestone"
opciót választotta arra a kérdésre, hogy a ticket nélkül leszállított board/prime/
milestone-alap hová kerüljön, azzal a céllal, hogy a futó `2026-07-19` sprint metrikái
érintetlenek maradjanak. Ez a milestone egyben a milestone-modell első éles használata.

## Result

_(nyitott)_
