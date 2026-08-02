---
id: T-026
title: 'Kis kontextus: egy ticket végrehajtásához a ticket maga legyen elég'
status: ready
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-01'
updated_at: '2026-08-02'
---
# T-026 — Kis kontextus: egy ticket végrehajtásához a ticket maga legyen elég

## Outcome

A Kotta munkaegysége kis kontextussal futtatható: egy végrehajtó ágens a ticket **briefjét** kapja — a ticket törzse + a hivatkozott döntések + a profil követelményei —, nem a teljes workspace-t és nem a beszélgetés-történetet. A brief mérete mérhető és riportolt. Az elv kimondva: **ha egy tickethez nagy kontextus kell, az nem futtatási, hanem szerződés-hiba.**

## Context

Az operátor mért használati adata (2026-08-01): a fogyasztás 88%-a 150k feletti kontextusban futott, 37%-a subagent-nehéz sessionökben. A hosszú, mindent cipelő session a drága és törékeny út — miközben a Kotta alapállítása pont az, hogy a ticket önhordó szerződés. Ha ez igaz, akkor a végrehajtáshoz a ticketnél sokkal több nem kellhet; ha mégis kell, azt a szerszámnak kell megmutatnia, mert az a kotta hiányossága (F-017/F-018 rokonság). Kapcsolódik az F-016 költségmérés-findinghoz: a brief-méret ticketenként az első valódi költség-előrejelző.

## Scope

- **`kotta brief <id>`** — összeállítja egy ticket minimális végrehajtási kontextusát: ticket-törzs, hivatkozott D-döntések, profil-követelmények, claim/branch-információ. Kimenete fájlba is kérhető, tokenbecsléssel.
- **Friss kontextus ticketenként, alapértelmezetten (D-009):** az execute-flow minden tickethez ÚJ ágenst indít a brieffel — a koordinátor kontextusa nem öröklődik. A kontextus-továbbvitel explicit flag és naplózott kivétel. A worktree-ben a kód ott van — a brief a *szándék*-kontextust szűkíti.
- **Mérés és jelzés:** a brief tokenbecslése a riportban; küszöb fölött (konfigurálható) a CLI figyelmeztet: a ticket valószínűleg túl nagy vagy alul-hivatkozott — bontani vagy élesíteni kell.
- **Függőség-határ:** a brief kimondja, mit NEM tartalmaz (más ticketek törzse, findingok) — ha a végrehajtónak mégis kellene, az explicit kérés és naplózott jel, nem csendes odaadás.

## Non-goals

- Nem kontextus-tömörítő és nem RAG: a brief determinisztikus összeállítás, nem okos válogatás.
- Nem nyúl a meglévő ticketek tartalmához — a túl nagy brief jelzés, nem automatikus átírás.
- A beszélgetős (PM-) munkafolyamat kontextusa nem tárgya — ez a végrehajtó ágensek útja.

## Acceptance

1. `kotta brief T-xxx` a ticket + hivatkozott döntések + profil tartalmát adja, semmi mást; tokenbecsléssel zár.
2. Egy valós ticketen (pl. crm-kit T-002) a brief önmagában elég egy friss ágensnek a munka elkezdéséhez — próbafutással igazolva, a hiányzó információk jegyzőkönyvezve.
3. Küszöb fölötti briefnél a CLI kimondott figyelmeztetést ad, és megnevezi a legnagyobb tételt.
4. Az execute-package flow minden tickethez friss ágenst indít a brieffel — alapértelmezetten, flag nélkül; a futam jegyzőkönyvében látszik a brief mérete és az ágens-kontextus különállása ticketenként. Kontextus-öröklés csak explicit flaggel, és a jegyzőkönyv jelöli.
5. A dokumentáció kimondja az elvet: a kis kontextus minőségi mérce, nem takarékossági trükk.

## Constraints

- A brief összeállítása tisztán a workspace fájljaiból történik, determinisztikusan — kétszer futtatva bájtra ugyanaz.
- A tokenbecslés lehet közelítő (karakter-alapú), de a módszere dokumentált és stabil.

## Execution notes

Először a `brief` parancs és a mérés — az önmagában értéket ad és adatot termel. Az execute-flow átállítása második lépés, a crm-kit build tapasztalata után (ott derül ki, mi hiányzik a briefből a gyakorlatban).

## Verification

CLI-tesztek a brief tartalmára és determinizmusára; egy valós próbafutás jegyzőkönyve a 2. acceptance szerint.

## Open decisions

None.
