---
id: T-034
title: 'Koordinacio-mentes entitas-azonosito, hogy ket ag ne tudjon utkozni'
status: backlog
origin: finding
types:
  - bug
profiles: []
priority: high
risk: high
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

Két, egymásról nem tudó ágon létrehozott entitás azonosítója soha nem esik egybe. Az azonosító mintása nem igényel allokátort, zárat vagy közös base-refet; a merge után minden entitás megkülönböztethető marad, és a `validate` nem talál `DUPLICATE_ID`-t.

## Context

F-008 és D-003. A `nextId()` a jelenlegi ág fájljait pásztázza és max+1-et ad — két ág ugyanazt a számot osztja ki. A oneandában ez már két valódi ütközést termelt (F-008 és T-049 egyaránt két különböző entitást jelentett), és ma ebben a repóban is megismétlődött: a T-013-at vivő friss ágens `finding new`-t hívott a worktree-jében, miközben a koordinátor ugyanazt tette a főágon — mindkettő F-032 lett, kézzel kellett átszámozni, és az `index.md` is konfliktált.

A D-003 ezt eldöntötte: a gépi identitás legyen koordináció-mentes, idő-rendezhető azonosító (ULID/KSUID), az emberi hivatkozás pedig a cím/slug; a fájlnév slug + rövid id-utótag. A hivatkozások (`depends_on`, `blocks`, `package` tagság, `source_finding`) a stabil id-t célozzák. Ez a ticket a D-003 végrehajtása az identitás-oldalon.

Ez a ticket blokkolja a párhuzamos, több-ágenses végrehajtást: amíg az azonosító ütközhet, a T-035 (`ticket execute`) által lehetővé tett párhuzamosság adatromlást termel.

## Scope

- Új azonosító-mintázó a `T-`/`F-`/`P-`/`D-` entitásokhoz a D-003 szerint: idő-rendezhető, koordináció-mentes, allokátor nélkül.
- A fájlnév `slug + rövid id-utótag` formára áll, ágak között is ütközésmentesen.
- A hivatkozási mezők (`depends_on`, `blocks`, `package`, `source_finding`, `discovered_during`, csomag-tagság) a stabil azonosítót célozzák.
- Migrációs út a meglévő szekvenciális azonosítókról, amely a meglévő hivatkozásokat együtt mozgatja, és futtatható a oneanda 163 ticketes workspace-én is.
- Az `index.md` újragenerálása determinisztikus és merge-barát: két ág független entitás-felvétele ne termeljen konfliktust.
- A `validate` `DUPLICATE_ID` szabálya megmarad, és a régi szekvenciális azonosítókat is elfogadja a migráció alatt.

## Non-goals

- Az F-008 másik gyökere — ugyanaz az entitás egyszerre két állapot-könyvtárban a merge után — külön ticket (T-036); ez itt nem oldódik meg.
- Az olvasási oldal (melyik git-kontextus az igazság) az F-028 külön munkája.
- A meglévő emberi hivatkozások átírása prózában és commit-üzenetekben visszamenőleg.
- Új UI-felület az azonosítók megjelenítésére a rövid utótagon túl.

## Acceptance

1. Két külön worktree-ben, egymás ismerete nélkül létrehozott ugyanolyan típusú entitás azonosítója különbözik, és a két ág merge-e után a `validate` zöld — teszt valódi git-fixture-rel.
2. A régi szekvenciális azonosítójú entitások a migráció után is feloldhatók, és minden rájuk mutató hivatkozás velük együtt mozdul — teszt egy több-hivatkozásos fixture-ön.
3. A `validate` `DUPLICATE_ID`-t ad, ha két entitás mégis egy azonosítón osztozik.
4. Két ág független entitás-felvétele után az `index.md` merge-e nem termel konfliktust.
5. Az emberi hivatkozás címmel/sluggal működik ott, ahol eddig a szám állt; a rövid id-utótag csak megkülönböztetésre jelenik meg.
6. Teljes tesztkészlet, typecheck és mindhárom build zöld; `a-team validate` ok.

## Verification

Git-fixture, amely két worktree-t hoz létre, mindkettőben entitást mint, majd összemergeli az ágakat és futtatja a `validate`-et. Migrációs teszt egy szekvenciális azonosítókkal és kereszthivatkozásokkal feltöltött workspace-en. `npx vitest run`, `npx tsc --noEmit`, `npm run build:cli`, `build:ui`, `build:site`.

## Constraints

A migráció nem veszíthet hivatkozást és nem írhat át kanonikus fájlt a támogatott írókon kívül. A meglévő `.a-team` workspace-eknek (különösen a oneanda 163 ticketjének) a migráció után is validnak kell lenniük. Az azonosító-váltás egyirányú, ezért a migrációnak száraz futtatási módja kell hogy legyen.

## Open decisions

None.

## Execution notes

Az irány a D-003-ban eldőlt, azt nem kell újranyitni. Érintett pontok: `src/filesystem/entities.ts` (`nextId`, `findTicket`, `idFromFilename`), `src/core/validation.ts` (`INVALID_ID`, `FILENAME_ID_MISMATCH`), `src/filesystem/workspace.ts` (`regenerateIndex`), és minden `finding`/`ticket`/`package`/`decision` író.
