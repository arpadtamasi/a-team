---
id: T-023
title: >-
  A többi átnevezés: ready→defined a tárolt állapotban, és a D-004 szótár
  lezárása
status: backlog
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
package: P-004
depends_on:
  - T-021
blocks: []
branch: null
pull_request: null
created_at: '2026-08-01'
updated_at: '2026-08-01'
---
# T-023 — A többi átnevezés: ready→defined a tárolt állapotban, és a D-004 szótár lezárása

## Outcome

A rename nem áll meg a terméknévnél: a belső szótár is az új nyelvet beszéli. A `ready` státusz tárolt értéke és útvonala `defined` lesz (a UI-felirat már az), a D-004-ben parkoló szótárkérdés (`signal/ticket → task → goal`) pedig döntést kap és — ha a döntés átnevezést mond — végrehajtódik ugyanebben a körben. Visszafelé kompatibilitás: a régi értékeket a CLI még olvassa.

## Context

D-005 a `defined` feliratot bevezette, de a tárolt érték, a `tickets/ready/` útvonal és a `POST /api/ticket/ready` maradt — a doksi ki is mondta, hogy a rés a hátralévő munkát mutatja. D-004 óta parkol a nagy szótárkérdés. Az operátor döntése: ez is a teljes rename-csomag része, ne maradjon harmadik kör.

## Scope

- **Döntés először:** a `signal/ticket → task → goal` szótár lezárása az operátorral, D-döntésként. A további scope e döntés függvénye — ami marad, arra a ticket a minimumot szállítja.
- `ready` → `defined`: státuszérték, `tickets/ready/` → `tickets/defined/` könyvtár, API-útvonal, CLI-parancsnév (a `ticket ready` promóciós parancs új neve a döntés része — a `define` már foglalt a szerződésírásra), sémák, tesztek, dokumentáció.
- Olvasási kompatibilitás: a régi státuszérték és könyvtárnév beolvasása figyelmeztetéssel, legalább egy verzión át.
- A workspace-migrációs recept (T-022 használja) kiegészítése a státusz-könyvtár átnevezésével.

## Non-goals

- Nem vezet be új fogalmat — csak meglévőket nevez át a rögzített döntések szerint.
- Nem nyúl a UI-feliratokhoz, azok készen vannak.

## Acceptance

1. A szótárdöntés D-döntésként rögzítve; ami átnevezést kapott, az végrehajtva, ami nem, az indoklással lezárva.
2. Új ticket a `defined` státuszt kapja `ready` helyett; a `tickets/defined/` az útvonala.
3. Régi (`ready`-s) workspace beolvasható, a CLI figyelmeztet és megmondja a migrációs lépést.
4. Teljes tesztkészlet zöld mindkét (régi és új) workspace-formán.
5. A T-022 receptje frissítve, hogy a szomszédok egyetlen migrációval kapják meg a könyvtár- ÉS a szótárcserét.

## Constraints

- A döntés az operátoré; a ticket nem indulhat el a szótárdöntés nélkül — ez az első lépése, nem előfeltétele.
- Az átnevezés atomi legyen workspace-en belül: fél-átnevezett állapot nem maradhat.

## Execution notes

Sorrend: szótárdöntés → séma- és CLI-átnevezés kompatibilitással → tesztek mindkét formára → migrációs recept frissítése. A T-022 csak ezután indul.

## Verification

Tesztkészlet zölden régi és új formán; `validate` zöld ebben a repóban az átnevezés után.

## Open decisions

A `signal/ticket → task → goal` szótár tartalma — szándékosan itt van: ez a ticket első munkalépése, az operátorral közösen.
