---
id: T-022
title: 'A szomszéd használó projektek migrációja: oneanda, crm-kit, flowbench'
status: backlog
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
package: P-004
depends_on:
  - T-023
blocks: []
branch: null
pull_request: null
created_at: '2026-08-01'
updated_at: '2026-08-01'
---
# T-022 — A szomszéd használó projektek migrációja: oneanda, crm-kit, flowbench

## Outcome

Mindhárom szomszéd workspace `.kotta/` alatt fut: a könyvtár `git mv`-vel átnevezve, visszafelé mutató `.a-team` symlinkkel, minden projektben saját commitban, zöld validate-tel. A migráció receptje dokumentálva, hogy külső használó is meg tudja ismételni.

## Context

D-007/3: a szomszédok nem symlink-hídon maradnak, hanem migrálnak. A 2026-08-01-i felmérés szerint az érintettek: `~/Dev/ezchops/oneanda`, `~/Dev/progos/crm-kit`, `~/Dev/thalesnano/flowbench`. A minta a T-021 saját migrációs commitja.

## Scope

Projektenként, ebben a sorrendben — crm-kit (legkisebb), flowbench, oneanda (legnagyobb, éles):

1. Tiszta munkafa ellenőrzése; ha koszos, a migráció ott áll meg és jelez.
2. `git mv .a-team .kotta && ln -s .kotta .a-team && git add -A`
3. `kotta validate` (vagy `a-team validate` az aliasszal) — zöldnek kell lennie a commit előtt és után.
4. Commit egységes üzenettel, ami a D-007-re hivatkozik.
5. Füstteszt: `status`, `ui` indul, egy ticket megnyitható.
6. A projekt saját dokumentációjában (ha említi az utat) a `.a-team/` → `.kotta/` csere.

Plusz: a migrációs recept egyetlen rövid fejezetként a kotta repo dokumentációjába — külső használóknak.

## Non-goals

- A szomszéd projektek szkriptjeinek átírása `a-team`-ről `kotta` parancsra — az alias él, a csere a projektek dolga, a saját tempójukban.
- Bármilyen tartalmi változás a workspace-ekben: a migráció kizárólag a könyvtár nevét érinti.

## Acceptance

1. Mindhárom projektben a workspace `.kotta/` alatt él, `.a-team` symlinkkel, saját commitban.
2. Mindhárom projektben a validate zöld a migráció után, és a UI elindul.
3. A oneanda éles workspace-én a migráció előtt és után futtatott `status` kimenete azonos (a névtől eltekintve) — bizonyíték, hogy semmi tartalmi nem változott.
4. A recept a dokumentációban, kipróbálhatóan.

## Constraints

- Éles workspace-hez (oneanda) csak zöld T-021 után szabad nyúlni, és ott a migráció előtt a `status --json` kimenet mentendő összehasonlítási alapnak.
- Egy projekt bukása a többit nem állítja meg tartalmilag, de a csomag stop-on-failure szabálya dönt — a hiba nem nyelhető le csendben.

## Execution notes

A crm-kit az első, mert üres még a kódja és e beszélgetés hozta létre — ha ott hibázik a recept, semmi nem sérül. A oneanda az utolsó, és ott a 3. acceptance a kapu.

## Verification

Projektenkénti validate + füstteszt jegyzőkönyv a ticket evidenciájában; a oneanda status-diff csatolva.

## Open decisions

None.
