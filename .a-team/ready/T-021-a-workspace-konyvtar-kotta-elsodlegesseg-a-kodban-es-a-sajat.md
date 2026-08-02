---
id: T-021
title: 'A workspace-könyvtár .kotta: elsődlegesség a kódban és a saját repo migrációja'
status: ready
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
package: P-004
depends_on:
  - T-020
blocks: []
branch: null
pull_request: null
created_at: '2026-08-01'
updated_at: '2026-08-02'
---
# T-021 — A workspace-könyvtár .kotta: elsődlegesség a kódban és a saját repo migrációja

## Outcome

A `.kotta/` az elsődleges workspace-könyvtár: az init ezt hozza létre, a felderítés ezt találja meg először, a dokumentáció ezt mondja — és ez a repo maga az első migrált példány: a saját `.a-team/`-je `git mv`-vel `.kotta/` lett, visszafelé mutató symlinkkel.

## Context

D-007 felülírta a D-006/4 kompatibilitás-only tervet: a könyvtár a rename része. A T-020 megtanította a CLI-nek mindkét utat; ez a ticket fordítja meg az elsőbbséget és végzi el az első valódi migrációt — a sajátunkon, mielőtt bárki máséhoz nyúlnánk (T-022).

## Scope

- Felderítési sorrend: `.kotta/` először, `.a-team/` másodikként, mindkettő létezésekor `.kotta/` nyer és a CLI figyelmeztet a kettősségre.
- `kotta init` új workspace-t `.kotta/` néven hoz létre.
- Ebben a repóban: `git mv .a-team .kotta` + `ln -s .kotta .a-team` — egy commitban, a teljes tesztkészlet zöldje mellett.
- Minden repo-beli út-hivatkozás (tesztek, skillek, site, README) `.kotta/`-t mond; a kompatibilitást egy helyen dokumentáljuk.
- A UI fejlécben és a státuszkimenetben látszó útvonalak az új nevet mutatják.

## Non-goals

- Szomszéd projektek migrációja — az T-022.
- A `.a-team/` olvasásának megszüntetése — a kivezetés külön, későbbi döntés.

## Acceptance

1. `kotta init` üres repóban `.kotta/`-t hoz létre, validate zöld.
2. Ebben a repóban a workspace `.kotta/` alatt él, a `.a-team` symlink, és minden parancs + a teljes tesztkészlet zöld.
3. Csak `.a-team/`-et tartalmazó régi workspace változatlanul működik (kompatibilitási teszt).
4. Mindkét könyvtárt tartalmazó (nem symlink) workspace-nél a CLI kimondott figyelmeztetést ad és a `.kotta/`-t használja.
5. A repóban nincs `.a-team/` út-említés a kompatibilitási dokumentáción és a történeti fájlokon kívül.

## Constraints

- A migráció `git mv` — a fájltörténetnek követhetőnek kell maradnia.
- A symlink a repóba commitolva; Windows-viselkedése a dokumentációban jelezve (ott a checkout sima könyvtárt adhat).

## Execution notes

Sorrend: felderítés-csere tesztekkel → init-csere → saját migráció → út-említések cseréje. A saját migráció legyen külön commit, hogy a T-022 tudjon rá mintaként hivatkozni.

## Verification

Teljes tesztkészlet zölden migráció előtt és után; kézi füstteszt: status, ui, ticket validate a migrált repón.

## Open decisions

None.
