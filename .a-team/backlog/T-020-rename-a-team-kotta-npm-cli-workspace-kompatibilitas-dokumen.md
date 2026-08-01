---
id: T-020
title: 'Rename: a-team → kotta (npm, CLI, workspace-kompatibilitás, dokumentáció)'
status: backlog
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
updated_at: '2026-08-01'
---
# T-020 — Rename: a-team → kotta (npm, CLI, workspace-kompatibilitás, dokumentáció)

## Outcome

A termék minden felülete Kotta néven fut: npm-csomag `kotta`, CLI-bináris `kotta` (működő `a-team` aliasszal), a workspace-olvasó a `.kotta/` és a `.a-team/` könyvtárat egyaránt érti, a dokumentáció és a site az új nevet viseli. A meglévő workspace-ek (oneanda, flowbench, crm-kit) törés nélkül működnek tovább.

## Context

D-006 szakaszolta a renamet: a GitHub-átnevezés a döntéssel együtt megtörténik (alacsony kockázat, automatikus átirányítás); ez a ticket viszi a többit. A D-005 rögzítette a név indoklását; a D-004-ben parkoló szótárcsere (signal/ticket/task/goal) kifejezetten NEM része ennek a ticketnek — az külön kör, hogy a két nagy átnevezés ne keveredjen.

## Scope

- `package.json`: név `kotta`, repository/homepage/bugs URL-ek az új GitHub-címre; `bin`: `kotta` és `a-team` ugyanarra a belépési pontra.
- npm publish az új néven; a `@arpadtamasi/a-team` deprecate üzenettel mutat rá.
- Workspace-felderítés: a CLI és a UI a `.kotta/`-t keresi először, `.a-team/`-re visszaesik; init új workspace-t `.kotta/` néven hoz létre.
- Szomszéd projektek: symlink recept dokumentálva (`ln -s .a-team .kotta` vagy fordítva), az oneanda és flowbench workspace-ekben kipróbálva.
- Dokumentáció, README, site, skillek szövege: A-Team → Kotta; az `.a-team/` útvonal-említések a kompatibilitási megjegyzéssel.
- CHANGELOG-bejegyzés és verzióemelés.

## Non-goals

- A D-004 szótárcsere (signal/ticket/task/goal) — külön ticket, külön kör.
- A `.a-team/` könyvtárak tömeges átnevezése a meglévő projektekben — a symlink a híd, az átnevezés majd magától értetődő lesz, amikor a projektek maguk váltanak.
- Bármilyen viselkedésváltozás: ez a ticket nevet cserél, nem funkciót.

## Acceptance

1. `npm i -g kotta` után a `kotta --version` és az `a-team --version` ugyanazt adja.
2. Egy `.a-team/`-es meglévő workspace-en minden parancs változatlanul működik; egy symlinkelt `.kotta/`-n szintén, mindkét irányú symlinkkel tesztelve.
3. `kotta init` új projektben `.kotta/`-t hoz létre, és a validate zöld rajta.
4. A repóban és a site-on nem marad A-Team-említés, kivéve a történeti hivatkozásokat (CHANGELOG, döntések, findingok).
5. A régi npm-csomag deprecate üzenete az új nevet mondja.

## Constraints

- A meglévő workspace-ek egyetlen fájlja sem módosul a ticket hatására — a kompatibilitás a CLI-ben él, nem migrációban.
- A tesztkészletnek mindkét könyvtárnévre futnia kell; a CI-ban mindkét út lefedve.
- A publish előtt a teljes tesztkészlet zöld; az npm-név egyszer használható el, elrontani nem lehet.

## Execution notes

Sorrend: workspace-felderítés kompatibilitása → bináris-alias → tesztek mindkét útra → dokumentáció-csere → verzió + publish → régi csomag deprecate. A GitHub-átnevezés (D-006/1) már megtörtént, a lokális remote-ok frissítése ide tartozik.

## Verification

Teljes tesztkészlet zölden mindkét workspace-néven; kézi füstteszt a oneanda workspace-en symlinkkel; `a-team validate` (illetve már `kotta validate`) zöld ebben a repóban.

## Open decisions

None — a szakaszolást D-006 rögzítette.
