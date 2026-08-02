---
id: T-036
title: Merge utan ugyanaz az entitas ket allapot-konyvtarban marad
status: ready
origin: finding
types:
  - bug
profiles: []
priority: high
risk: medium
package: P-005
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_finding: F-008
---
# T-036 — Merge után ugyanaz az entitás két állapot-könyvtárban marad

## Outcome

Két ág összemergelése után egyetlen entitás sem szerepel egyszerre két állapot-könyvtárban. Ahol a merge mégis kettőt hagyott, a `validate` megnevezi mindkét helyet, és van támogatott út a feloldására — nem kézi `git rm`.

## Context

F-008 második gyökere, amit a D-003 kifejezetten nem old meg. Az entitás állapotát ma a könyvtár kódolja (`backlog/`, `ready/`, `active/`, `review/`, `done/`). A git a könyvtárak közti mozgatást nem rendezi delete+add párként, ezért merge után mindkét példány túléli. A oneandában mérve (2026-07-26): T-039 és T-040 egyszerre `backlog` és `done`, T-041 egyszerre `active` és `backlog`, P-015 egyszerre `packages/backlog` és `packages/ready`.

Ez az azonosító-ütközéstől független hiba: akkor is előjön, ha minden azonosító egyedi (T-034). A párhuzamos, több-ágenses modell mindkettőt kiváltja, ezért a T-035 párhuzamosítása előtt ez is kell.

Rokon, de más: az F-028 arról szól, melyik git-kontextus az igazság olvasáskor; ez itt az írás/merge oldala.

## Scope

- A `validate` külön esetként nevezze meg, ha ugyanaz az azonosító két állapot-könyvtárban van, és mondja meg, melyik kettőben — ma ez a valódi azonosító-ütközéssel egy kalap alá esik.
- Determinisztikus feloldási szabály, amely az életciklus előrehaladását tiszteli: a későbbi állapot nyer.
- CLI-út a feloldásra, amely a támogatott írókon fut és naplózza, mit dobott el.
- Ugyanez a csomagokra (`packages/*`).

## Non-goals

- Az azonosító-mintázás megváltoztatása — az a T-034.
- Az olvasási szabály a git-kontextusok fölött — az az F-028.
- A könyvtár-alapú tárolás elhagyása; ez a ticket a duplikátumot szünteti meg, nem a modellt cseréli.
- A oneanda meglévő duplikátumainak visszamenőleges rendezése; a feloldó út létrejön, a futtatása külön döntés.

## Acceptance

1. Két ágon eltérően továbbvitt ugyanazon ticket merge-e után a `validate` megnevezi a duplikátumot, mindkét helyet kiírva — teszt valódi git-fixture-rel.
2. A feloldó CLI-út a későbbi életciklus-állapotot tartja meg, a másikat eltávolítja, és megnevezi, mit dobott el.
3. Ha a két példány törzse eltér, a parancs megáll és nem dönt helyettünk.
4. Csomagokra ugyanez érvényes, a P-015 alakú esetre külön teszttel.
5. Jóváhagyás nélkül a feloldás nem fut le.
6. Teljes tesztkészlet, typecheck és mindhárom build zöld.

## Verification

Git-fixture két ággal, amelyek ugyanazt a ticketet külön állapotba viszik, majd merge; ugyanez csomagra. Külön teszt a tartalom-eltérés esetére, amely bizonyítja, hogy a parancs megáll. `npx vitest run`, `npx tsc --noEmit`, mindhárom build.

## Constraints

A feloldás sosem dob el olyan példányt, amelynek törzse eltér a megtartottétól. Minden mutáció a támogatott írókon megy át. A `validate` a duplikátumot hibaként jelenti akkor is, ha a feloldást senki nem futtatja.

## Open decisions

None.

## Execution notes

A `validate` mai duplikátum-ága a `src/commands/validate.ts` `seen` térképe — `DUPLICATE_ID`-t ad, de nem különbözteti meg a „két állapot-könyvtárban ugyanaz" esetet a valódi azonosító-ütközéstől. A `STATE_MISMATCH` szabály a `src/core/validation.ts`-ben már összeveti a frontmattert a könyvtárral.
