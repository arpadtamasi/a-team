---
id: T-034
title: 'Koordinacio-mentes entitas-azonosito, hogy ket ag ne tudjon utkozni'
status: backlog
origin: finding
types:
  - bug
profiles: []
priority: high
risk: medium
package: P-005
depends_on: []
blocks:
  - T-035
  - T-036
branch: null
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_finding: F-008
---
# T-034 — Koordináció-mentes entitás-azonosító, hogy két ág ne tudjon ütközni

## Outcome

Két, egymásról nem tudó ágon **ezután** létrehozott entitás azonosítója soha nem esik egybe. Az azonosító mintása nem igényel allokátort, zárat vagy közös base-refet. A már meglévő szekvenciális azonosítók változatlanul maradnak és továbbra is működnek — a workspace vegyes azonosító-térrel is valid.

## Context

F-008 és D-003. A `nextId()` a jelenlegi ág fájljait pásztázza és max+1-et ad — két ág ugyanazt a számot osztja ki. A oneandában ez már két valódi ütközést termelt (F-008 és T-049 egyaránt két különböző entitást jelentett), és ma ebben a repóban is megismétlődött: a T-013-at vivő friss ágens `finding new`-t hívott a worktree-jében, miközben a koordinátor ugyanazt tette a főágon — mindkettő F-032 lett, kézzel kellett átszámozni, és az `index.md` is konfliktált.

A D-003 az irányt eldöntötte: a gépi identitás legyen koordináció-mentes, idő-rendezhető azonosító (ULID/KSUID), az emberi hivatkozás pedig a cím/slug.

**A D-010 szűkíti ezt: a meglévő azonosítókat nem bántjuk.** Nincs migráció, nincs átszámozás, nincs hivatkozás-átírás — a `T-034` és társai maradnak, a workspace tartósan vegyes azonosító-terű lesz. A D-003 „Consequences" szakasza teljes migrációt vetített előre; azt a részt a D-010 ejtette. Cserébe a ticket elveszti az egyetlen visszafordíthatatlan részét, és a oneanda 163 ticketje sem mozdul.

Ez a ticket blokkolja a párhuzamos, több-ágenses végrehajtást: amíg az azonosító ütközhet, a T-035 (`ticket execute`) által lehetővé tett párhuzamosság adatromlást termel.

## Scope

- Új azonosító-mintázó a `T-`/`F-`/`P-`/`D-` entitásokhoz: idő-rendezhető, koordináció-mentes, allokátor nélkül. A típus-előtag megmarad, hogy a típus továbbra is az azonosítóból látszódjon.
- A `nextId()` helyére a mintázó lép az új entitások létrehozásakor; a pásztázás-és-max+1 megszűnik.
- A `validate` mindkét alakot elfogadja, és `DUPLICATE_ID`-t ad, ha két entitás mégis egy azonosítón osztozik.
- Az `index.md` újragenerálása determinisztikus és merge-barát: két ág független entitás-felvétele ne termeljen konfliktust.
- Az új entitások fájlneve `slug + rövid id-utótag`, ágak között is ütközésmentesen; a meglévő fájlnevek változatlanok.

## Non-goals

- **A meglévő azonosítók bármilyen érintése**: nincs migráció, nincs átszámozás, nincs fájlnév-változás, nincs hivatkozás-átírás — sem itt, sem a oneandában.
- Az F-008 másik gyökere — ugyanaz az entitás egyszerre két állapot-könyvtárban a merge után — külön ticket (T-036).
- Az olvasási oldal (melyik git-kontextus az igazság) az F-028 külön munkája.
- A cím/slug alapú emberi hivatkozás bevezetése a meglévő számok helyett; a rövid id-utótag megjelenítésén túl nincs új UI.

## Acceptance

1. Két külön worktree-ben, egymás ismerete nélkül létrehozott ugyanolyan típusú entitás azonosítója különbözik, és a két ág merge-e után a `validate` zöld — teszt valódi git-fixture-rel.
2. A meglévő szekvenciális azonosítójú entitások változatlanok maradnak: a `validate` elfogadja őket, feloldhatók, és a rájuk mutató hivatkozások működnek — teszt egy vegyes azonosító-terű fixture-ön.
3. Egyetlen meglévő fájl neve, azonosítója vagy hivatkozása sem változik a ticket landolásától — a repó `git diff`-je nem tartalmaz átszámozást.
4. A `validate` `DUPLICATE_ID`-t ad, ha két entitás mégis egy azonosítón osztozik.
5. Két ág független entitás-felvétele után az `index.md` merge-e nem termel konfliktust.
6. Teljes tesztkészlet, typecheck és mindhárom build zöld; `a-team validate` ok — ebben a repóban és a oneanda workspace-én is, változtatás nélkül.

## Verification

Git-fixture, amely két worktree-t hoz létre, mindkettőben entitást mint, majd összemergeli az ágakat és futtatja a `validate`-et. Vegyes azonosító-terű fixture, amelyben régi szekvenciális és új entitások keresztre hivatkoznak. A 3. feltétel `git diff --stat` ellenőrzéssel. `npx vitest run`, `npx tsc --noEmit`, `npm run build:cli`, `build:ui`, `build:site`.

## Constraints

A meglévő entitásokhoz nem szabad hozzányúlni. A workspace-nek vegyes azonosító-térrel is validnak kell lennie, határozatlan ideig — ez nem átmeneti állapot, hanem a végállapot. Minden mutáció a támogatott írókon megy át.

## Open decisions

None.

## Execution notes

Az irány a D-003-ban eldőlt, azt nem kell újranyitni — csak a migrációs következményét ejtettük. Érintett pontok: `src/filesystem/entities.ts` (`nextId`, `findTicket`, `idFromFilename`), `src/core/validation.ts` (`INVALID_ID`, `FILENAME_ID_MISMATCH` — ma `/^(?:T-\d{3,}|O-\d+(?:\.\d+)?)$/`, ezt kell kibővíteni, nem lecserélni), `src/filesystem/workspace.ts` (`regenerateIndex`), és minden `finding`/`ticket`/`package`/`decision` író.
