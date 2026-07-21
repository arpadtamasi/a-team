# Need-questions — a levezetés

Ez a munkanapló. A termék a `PROMPT.md`; ez a fájl azt mutatja, honnan
jött minden kérdés. A `docs/plans/need-questions.tree.json` NQ-1.1.1 …
NQ-1.1.5 leveleinek a kimenete, levelenként egy szakasz.

---

## NQ-1.1.1 — Mi számít igénynek

### A definíció

**Igény = kimondott változtatási szándék, amely még nem lett végrehajtható
munkaszerződéssé.**

Két alakban fordul elő, és a kérdéssor **mindkettőt** elfogadja bemenetnek:

1. **Nyers mondat.** Még nincs ticketje. Egy chat-mondat, egy backlog-sor,
   egy hibabejelentés. A kérdéssor kimenete ilyenkor az is, hogy egyáltalán
   ticket legyen-e belőle.
2. **Ticket `backlog` státuszban.** Van fájlja, van ID-je, de még nem ment át
   a finomítás kapuján.

**Nem igény** minden ticket, amely a kapun már túl van: `ready`,
`in_progress`, `review`, `done`, `parked`, `rejected`. Ezekre a kérdéssort
futtatni vagy késő (fut a munka), vagy értelmetlen (kész), vagy külön döntést
igényel (`parked` reaktiválás, `rejected` felélesztés) — az nem ennek a sornak
a dolga.

### A megkülönböztető: a státusz, nem a törzs alakja

Ez a definíció legfontosabb fele, és nem magától értetődő.

A `schemas/ticket.md` kétféle törzset ismer: capture-szakaszút
(`## Known context`, `## Open questions`, `## Scope notes`) és végrehajthatót
(`## Acceptance criteria`, `## Verification`). Kézenfekvő volna azt mondani:
akinek capture-törzse van, az az igény.

**Ez hibás, és a repó meg is cáfolja.** A `GH-3` törzse a végrehajtható alakot
viseli — megvan az `## Acceptance criteria` és a `## Verification` is —, a
státusza mégis `backlog`. A hat szakasz megléte nem tette végrehajthatóvá.
Ez pontosan a `NQ-1` gyökér notes-ában álló tanulság: a szakasz-meglét
formázási tény, nem készültségi tény.

Fordítva is elromlik: az `AT-8` és `AT-9` `review`-ban áll, végrehajtható
törzzsel, de hiányzik belőlük a `## Why` — ha a törzs alakja döntene, ezek
"hiányosak" volnának, holott már el is készültek.

Ezért: **a státusz dönt, a törzs alakja csak jelzés.** A capture-törzs
egy igény tipikus, de nem szükséges és nem elégséges ismertetőjegye.

### Miért nem kell a `## Open questions` a definícióhoz

A `schemas/ticket.md` capture-törzsében van `## Open questions` szakasz. Ez
adja a kérdéssor létjogosultságát — van hova írni a választ —, de nem része a
definíciónak: az `AT-5`, `AT-6`, `AT-7` capture-törzse csonka (a
`## Open questions`-nál véget ér), és ettől még igény mind a három.

### Besorolás — a check kimenete

Az `a-team/tickets/*.md` összes fájlja, egy sor per ticket:

| # | ticket | státusz | törzs alakja | besorolás | miért |
|---|--------|---------|--------------|-----------|-------|
| 1 | AT-1 | ready | végrehajtható | **nem igény** | a kapun túl |
| 2 | AT-10 | backlog | capture | **igény** | kapu előtt |
| 3 | AT-11 | backlog | capture | **igény** | kapu előtt |
| 4 | AT-2 | backlog | capture | **igény** | kapu előtt |
| 5 | AT-3 | backlog | capture | **igény** | kapu előtt |
| 6 | AT-4 | backlog | capture | **igény** | kapu előtt |
| 7 | AT-5 | backlog | capture (csonka) | **igény** | kapu előtt; a csonka törzs nem számít |
| 8 | AT-6 | backlog | capture (csonka) | **igény** | kapu előtt |
| 9 | AT-7 | backlog | capture (csonka) | **igény** | kapu előtt |
| 10 | AT-8 | review | végrehajtható (`## Why` nélkül) | **nem igény** | a kapun túl; a hiányzó szakasz nem hozza vissza |
| 11 | AT-9 | review | végrehajtható (`## Why` nélkül) | **nem igény** | a kapun túl |
| 12 | GH-1 | ready | végrehajtható | **nem igény** | a kapun túl |
| 13 | GH-3 | backlog | **végrehajtható** | **igény** | a törzs alakja ellenére: a státusz dönt |
| 14 | TEMP-20260719-01 | review | végrehajtható | **nem igény** | a kapun túl |
| 15 | TEMP-20260719-02 | ready | végrehajtható | **nem igény** | a kapun túl |

15 sor, 15 ticketfájl. Igény: 9. Nem igény: 6. „Nem tudom": 0.

### Amit a check nem mér

A check zöld — de zöld volna akkor is, ha a definíció ennyi lenne: *„igény az,
aminek a státusza `backlog`"*. A státusz mindig kiolvasható és sosem
kétértelmű, tehát **bármely státusz-alapú szabály automatikusan nulla
„nem tudom"-ot ad.** A check a besorolhatóságot méri, nem a definíció
tartalmát.

A tartalmat két dolog hordozza, és egyiket sem a check bizonyítja:

- hogy a **nyers mondat** is bemenet (a repóban nulla ilyen eset van, tehát a
  besorolás nem is érinti);
- hogy a **státusz dönt, nem a törzs alakja** — ezt a `GH-3` sora mutatja meg,
  és ez a tábla egyetlen sora, amely egyáltalán megkülönbözteti ezt a
  definíciót a naivtól.

Ha a `GH-3` nem létezne, a check ugyanígy zöld lenne, és semmit nem tudnánk.

---

## NQ-1.1.2 — A két meglévő készlet egymásra fektetve

### A két készlet

**A hét stop** — `docs/experiments/intake/PROMPT.md`, „A hét stop" szakasz.
**A refine-ticket öt kérdése** — `skills/refine-ticket/SKILL.md`,
„Conversation contract", számozott lista.

12 tétel. Mindegyik pontosan egy sort kap.

### A tábla

| # | tétel | honnan | párja | megjegyzés |
|---|-------|--------|-------|------------|
| 1 | A cél, egy mondatban + meddig indítom | hét stop 1. | **RT 1.** | fél pár: a *cél* fedi egymást, a *runway* (egy este / hét / hónap) nem — a refine-ticketben nincs kérdés az időkeretre |
| 2 | A határ — legalább három dolog, amit nem építünk | hét stop 2. | **RT 3.** (második fele: „what should wait") | a hét stop számot is kér (≥3), az RT nem |
| 3 | A siker — megfigyelhető állítás, nem érzés | hét stop 3. | **RT 4.** | a legszorosabb pár a tizenkettőből |
| 4 | Az első szint — 3-6 ág, ez a scope, ezért az emberé | hét stop 4. | **RT 3.** (első fele: „what must be included") | fél pár: a *tartalom* fedi, a *tulajdonos* nem — az RT-ben a scope-ot az agent írja meg, itt az ember húzza |
| 5 | A második szint — EGY ágon, a többi kibontatlan | hét stop 5. | **nincs párja** | az RT ismer dekompozíciót, de nem lustát: nála minden gyerek egyszerre születik meg |
| 6 | A döntéslista — melyik döntés kié | hét stop 6. | **nincs párja** | ez a `NQ-1.2` magva; az RT sehol nem kérdezi, hogy egy nyitott kérdésnek ki a gazdája |
| 7 | A kész terv — átnézem, jóváhagyom vagy visszaküldöm | hét stop 7. | **nincs párja** (a kérdések között) | az RT szerkezeti megfelelője a Definition of Ready kapu — de az agent ítélete, nem az embernek feltett kérdés |
| 8 | What should become observably different? | RT 1. | **stop 1.** | lásd 1. sor |
| 9 | Why is that useful now? | RT 2. | **nincs párja** | a hét stop sehol nem kérdezi meg, hogy *miért most*; a cél megvan, a sürgőssége nincs |
| 10 | What must be included, and what should wait? | RT 3. | **stop 2. + stop 4.** | egyetlen RT-kérdés, amit a hét stop két külön megállóra bont |
| 11 | What would convince the user that it is complete? | RT 4. | **stop 3.** | lásd 3. sor |
| 12 | Is there a decision or other work that must happen first? | RT 5. | **nincs párja** | a hét stopban a függőség nem kérdés, hanem kemény szabály: *„egy eldöntetlen kérdés nem interrupt, hanem gyerek-cél, gazdával"* — az agent oldja meg, nem kérdezi |

### Mérleg

- 12 tétel, 12 sor, mindegyik pontosan egyszer.
- **Valódi pár: 4 tétel** (1↔8, 3↔11) plusz a 10-es kettéosztva (2, 4).
- **Nincs párja: 5 tétel** — stop 5., 6., 7. és RT 2., 5.
- Két fél pár (1. és 4. sor): a tartalom fedi egymást, a *tulajdonos* vagy a
  *keret* nem.

A két készlet ott tér el a legélesebben, ahol a **tulajdonlásról** van szó:
a hét stop háromszor is megkérdezi, kié a döntés (4., 6., 7. stop), az RT
egyszer sem. Fordítva az RT kérdezi meg a *miért most*-ot és a *mi jön előbb*-öt,
amit a hét stop szabállyal kerül meg.

### Amit a check nem mér

A check sorokat számol: 12 tétel, nulla lefedetlen, nulla duplán. Ezt egy
olyan tábla is teljesíti, amelyben minden sorban az áll, hogy „nincs párja" —
sőt, **a „nincs párja" a legolcsóbb módja egy érvényes sor előállításának.**
A check pontosan a rossz irányba véd: az elfelejtett *sorok* ellen igen, a
lusta *párosítás* ellen nem.

Ezt a táblát az teszi ellenőrizhetővé, hogy minden pár mellett ott áll, *mi*
fedi egymást és *mi nem* (1. és 4. sor), és hogy minden „nincs párja" mellett
ott áll, hol kereste a másik készletben (7. és 12. sor: megnevezi a szerkezeti
megfelelőt, és megmondja, miért nem kérdés). Ezt a check nem kényszeríti ki —
kézzel tartottam be.

---

## NQ-1.1.3 — A hiányzó kérdések megnevezve

A `NQ-1.1.2` öt párnélküli tétele nem hiány: azok megvannak, csak az egyik
készletben. Hiány az, amit **egyik készlet sem kérdez**. Kettő ilyet találtam.

### Ú1 — „Ennek a nyitott kérdésnek ki a gazdája?"

> Minden felírt nyitott kérdés mellé: az agent ki tudja olvasni a repóból, a
> munka természetéből következik, vagy tőled kell megkérdezni?

**Repó-eset: `AT-10`** (`a-team/tickets/AT-10-goal-tree-validator-lazy-expansion.md`,
`## Open questions`).

Négy kérdés áll egyetlen tagolatlan felsorolásban, gyökeresen eltérő gazdával:

- *„Melyik artefaktum a mérvadó — a lusta kibontás a szándékolt szabály, vagy
  a gyermektelen non-leaf valódi defekt?"* — ez PO/PM döntés, mert két
  jóváhagyott artefaktum közül választ.
- *„Jelenteni kell-e egyáltalán egy elhalasztott ágat, például figyelmeztetésként?"*
  — ezt az agent eldöntheti, a `runway.py` és a `schema.json` viselkedéséből.

A kár megfigyelhető: a ticket `backlog`-ban áll, mert *valamelyik* kérdésére
nincs válasz — de a lista nem mondja meg, melyikre kell **embert** várni.
Aki felveszi, nem tudja, van-e egyáltalán olyan része, ami elindítható.

**Másodlagos eset: `AT-11` `## Why`** — *„Without a recorded decision the
question is lost between sessions, and the readiness tool would be built a
second time rather than extended."* A gazdátlan kérdés kára itt kimondva áll:
elveszik két session között, és a munka kétszer készül el.

**Miért nem fedi egyik készlet sem:** a hét stop 6-osa a *döntésekre* kérdez
rá terv szinten (`NQ-1.1.2` 6. sor), nem kérdésenként egy igényen belül; a
refine-ticket öt kérdése közt nincs gazda-fogalom.

### Ú2 — „Van a repóban valami, ami ennek ellentmond?"

> Mielőtt jóváhagyjuk: van-e már becheckelt artefaktum — séma, szkript, prompt,
> METHOD-szakasz —, amely mást mond, mint amit itt kimondtunk?

**Repó-eset: `AT-10`** (ugyanaz a ticket, a `## Why` szakasz).

Két becheckelt artefaktum ellentmond egymásnak:
`docs/experiments/intake/PROMPT.md` megköveteli, hogy a szándékosan ki nem
bontott ág `leaf: false` maradjon gyerekek nélkül; a
`docs/experiments/goal-tree/validate.py:46-48` pedig minden gyermektelen
non-leaf-et `FAIL`-nek jelent.

A kár nem hipotetikus, a ticket idézi is:

```
FAIL (2):
  TR-1.1: marked non-leaf but has no children — the tree stops without saying who does the work
  TR-1.5: marked non-leaf but has no children — the tree stops without saying who does the work
```

A `docs/plans/ticket-readiness.tree.json` úgy bukott el a validáción, hogy a
szerzője **pontosan követte a promptot**. A ticket a következményt is kimondja:
vagy a validátor kimenete megbízhatatlan minden intake-terven, vagy a szerzők
kibontanak olyan ágakat, amiket nem lett volna szabad — csak hogy zöld legyen.

A ticket azt is megnevezi, miért csak most derült ki: *„`M-1.tree.json`
predates the intake prompt and decomposes every branch, so the conflict did not
surface until the first intake-produced plan."* Az ellentmondás hónapokig ott
ült becheckelve, és senki nem kérdezte meg.

**Miért nem fedi egyik készlet sem:** a refine-ticket „Inspect before editing"
szakasza kéri az átfedő *ticketek* felderítését — de az az agent házi
feladata, nem kérdés, és ticketekre szól, nem sémákra és szkriptekre. A hét
stop sehol nem nyúl hozzá.

### Megnevezve, de a sorba nem kerül be: „milyen természetű ez a munka?"

Harmadik jelöltként felmerült: *„Kód, dokumentum, döntés vagy kutatás ez — és
ebből mi következik arra, hogy mit kell megmutatni a végén?"*

**Repó-eset megvan: `AT-11`** — a ticket teljes egészében erről szól, és a
`## Known context`-je konkrét párokat is felsorol (UI-változás → screenshot,
séma-változás → visszamigrálás).

**Mégsem kerül a kérdéssorba.** A `NQ-1` gyökér 2-es stopnál élesített határa
szó szerint kizárja: *„nem oldjuk meg a típusfüggő bizonyítékot (AT-11)"*.
A kérdés önmagában értéktelen a válaszszabály nélkül — feltenném, megkapnám,
hogy „ez UI", és nem tudnék vele mit kezdeni. Az `AT-11` maga sorolja fel az öt
eldöntetlen kérdést, ami a szabályhoz kell. Ez a levél megnevezi a hiányt;
betölteni az `AT-11` dolga, külön futamban.

### Elvetve: „hol írjuk le a választ?"

Felmerült negyedikként. Elvetettem, mert **nem kérdés, hanem szabály**: a
válasza minden igényen ugyanaz, és az intake-prompt kimondja, hogy *„soha ne
kérdezz olyat, aminek a válasza nem változtat semmit azon, amit építeni fogsz"*.

A mögötte álló repó-tény viszont valódi, és szabályként be is épül: a
`schemas/ticket.md` capture-törzsében van `## Open questions`, a végrehajtható
törzsben **nincs**. Vagyis a finomítás után a nyitott kérdésnek nincs hova
kerülnie. A gyökér határa tiltja a `schemas/ticket.md` módosítását, ezért a
kérdéssor a saját kimenetében tartja meg őket — nem a ticketben.

### A check kimenete

| # | új kérdés | repó-eset | a kár |
|---|-----------|-----------|-------|
| 1 | Ú1 — ki a gazdája ennek a nyitott kérdésnek? | `AT-10` `## Open questions`; `AT-11` `## Why` | döntés és agent-munka egy tagolatlan listában; kérdés elveszik session-ök között |
| 2 | Ú2 — mond-e ennek ellent valami a repóban? | `AT-10` `## Why` (`validate.py:46-48` vs. `intake/PROMPT.md`) | a promptot pontosan követő terv `FAIL (2)`-vel bukik |

Két új kérdés, két megnevezett ticket-ID. Indoklás nélküli új kérdés: **0**.
Ezen felül egy jelölt megnevezve és tudatosan kihagyva (`AT-11`, gyökér-határ),
egy pedig elvetve és szabállyá alakítva.

### Amit a check nem mér

A check **egyirányú**: azt bünteti, ha kitalálok egy kérdést, amit senki nem
hiányolt. Azt nem veszi észre, ha **elfelejtek** egy valódi hiányt. Nulla új
kérdéssel is zöld lenne — az üres lista minden eleme mellett ott áll a
repó-eset.

Ezért a kettő nem plafon, hanem padló. Amit tudok: végigolvastam mind a hat
capture-törzsű ticket `## Open questions` szakaszát, és ez a kettő az, amelyre
kárt tudtam mutatni. Ahol nem tudtam kárt mutatni (például *„mi az, ami ebből
már landolt?"* — az `AT-6` és az `AT-7` is nem dokumentált alaphelyzethez
képesti deltát ír le), ott nem vettem fel a kérdést. Ez a check szabálya, de
lehet, hogy hiány maradt.

---

## NQ-1.1.4 — A sorrend rögzítve

Tizenegy kérdés. Minden sor megmondja, **melyik korábbi választ eszi meg** —
ez az, amit a check néz.

| # | kérdés | mit eszik meg | forrás |
|---|--------|---------------|--------|
| K1 | Mi lesz **másképp**, ha ez kész? Egy megfigyelhető mondat. | — (belépő) | stop 1. + RT 1. |
| K2 | **Miért most?** Mi történik, ha három hónap múlva csináljuk? | K1 | RT 2. |
| K3 | Mi tartozik **bele** — a legkevesebb, amitől K1 igaz lesz? | K1 | RT 3. + stop 4. |
| K4 | Mi az, ami **nem ez**? Legalább három konkrét dolog. | K1, K3 | stop 2. + RT 3. |
| K5 | **Honnan tudjuk, hogy kész?** Megfigyelhető állítás, nem érzés. | K1, K3 | stop 3. + RT 4. |
| K6 | **Mond-e ennek ellent valami a repóban?** Séma, szkript, prompt, METHOD-szakasz. | K1, K3, K5 | **Ú2 (új)** |
| K7 | Mi kell hozzá **előbb**? Döntés, másik munka, hiányzó környezet. | K3, K6 | RT 5. |
| K8 | Ez **egy** eredmény, vagy több? | K3, K5 | stop 4. + stop 5. |
| K9 | **Meddig** akarod elindítani — egy este, egy hét, egy hónap? | K8 | stop 1. (második fele) |
| K10 | A felírt nyitott kérdéseknek **ki a gazdája** — agent vagy ember? | K1–K9 mind | **Ú1 (új)** |
| K11 | **Átnézed?** Jóváhagyod vagy visszaküldöd. | K1–K10 mind | stop 7. |

### Miért ez a sorrend — a nem magától értetődő lépések

**K4 a K3 után.** A határt nem lehet a tartalom előtt meghúzni: a „mi nem ez"
csak akkor konkrét, ha van mihez képest. Fordítva a hét stop áll (2. a határ,
4. az első szint), de ott a határ a *projekt* köré megy, itt egy igény köré.

**K6 a K5 után, nem előtte.** Az ellentmondást a **siker-állításon** lehet a
legélesebben megfogni. Az `AT-10` esete pontosan ez: nem a célok mondtak
ellent egymásnak, hanem a `validate.py` `FAIL`-je annak, amit a `PROMPT.md`
sikernek nevez. Ha K6-ot K5 elé tenném, csak a célt tudnám ütköztetni, és a
konfliktus ugyanúgy elbújna, ahogy eddig.

**K7 a K6 után.** A K6-ban talált ellentmondás **maga is előfeltétel** lehet.
Az `AT-10` első nyitott kérdése — *„melyik artefaktum a mérvadó?"* — pont így
születik: a konfliktus felderítéséből lesz függőség. Ha K7 előbb futna, ez a
függőség nem lenne a listán.

**K10 az utolsó előtti.** Nem tehető előbbre: a *nyitott kérdések listáján*
dolgozik, és az a lista K1-től K9-ig folyamatosan nő. Gazdát csak akkor lehet
osztani, ha már minden kérdés fel van írva.

### K8 nem előreutalás, hanem visszaküldés

Egy hely van, ahol a sor nem lineáris. Ha **K8 válasza „több"**, akkor K1–K7
egy csomagra lett megválaszolva, és a sort minden résznél újra kell futtatni.

Ez **nem** előreutalás: K8 nem feltételezi egyetlen későbbi kérdés válaszát
sem, csak K3-at és K5-öt fogyasztja. Ellenőrzőpont, amely visszaküldhet — a
hét stop 4-es stopjának „ingyen ellenőrzése" ugyanez (*„ha az első szint olyan
ágakat ad, amiket egy ülésben nem lehet lebontani, akkor a cél volt túl nagy"*).
A check kimondottan előreutalást keres, és ilyet nem talál; de az egyirányú
olvasás ezt a hurkot nem látja, ezért írom ide ki.

### A check kimenete

Elejétől végigolvasva, kérdésenként: melyik korábbi válaszra hivatkozik?

| # | hivatkozott válaszok | mind korábbi? |
|---|----------------------|---------------|
| K1 | — | ✔ (belépő) |
| K2 | K1 | ✔ |
| K3 | K1 | ✔ |
| K4 | K1, K3 | ✔ |
| K5 | K1, K3 | ✔ |
| K6 | K1, K3, K5 | ✔ |
| K7 | K3, K6 | ✔ |
| K8 | K3, K5 | ✔ |
| K9 | K8 | ✔ |
| K10 | K1–K9 | ✔ |
| K11 | K1–K10 | ✔ |

Olyan kérdés, amely **későbbi** válaszra hivatkozik: **0**.

### Amit a check nem mér

Két gyengesége van, és mindkettő ugyanonnan jön: a sorrendet én írtam, és a
függőségeket is én írtam mellé.

**1. A check nem tudja, hogy egy kérdés *tényleg* megeszi-e, amit ráírtam.**
Ha K6 mellé nem írok semmit, K6 bárhová kerülhet, és a tábla ugyanúgy zöld.
Az egyetlen védelem, hogy minden nem magától értetődő él mellé odaírtam a
konkrét repó-esetet, ami kikényszeríti (K6→K5 és K7→K6: `AT-10`). Ahol nem
tudtam ilyet mutatni, ott az él gyenge:

- **K2 (miért most)** csak K1-et fogyasztja. Bárhol állhatna K1 után. Azért
  van a 2. helyen, mert olcsó és mert a válasza K9-et (runway) előre színezi —
  de ez ízlés, nem kényszer.
- **K3 és K5** ugyanazt a két választ eszik (K1). Egymáshoz képest a
  sorrendjük szabad; K5-öt azért tettem hátrébb, mert K4 a K3-ra épül.

**2. A check egyetlen fixpontot nem véd: hogy K1 a belépő.** Egy olyan sor is
zöld lenne, amely K11-gyel kezd, ha minden mást átszámozok. A „nulla
előreutalás" reláció önmagában konzisztens, nem helyes — a helyességét az adja,
hogy K1 az egyetlen kérdés, amely semmit nem fogyaszt.

---

## NQ-1.1.5 — A leírás helye és alakja

A termék: `docs/experiments/need-questions/PROMPT.md`, az
`docs/experiments/intake/PROMPT.md` mintájára. Kísérlet, nem skill — a 6-os
stopnál ez volt a PO/PM döntése, mert skillnél a router operation-listáját és a
`METHOD.md` ownership-tábláját is bővíteni kellene, az pedig bekötés, nem leírás.

### c1 — a fájl létezik

```
$ test -f docs/experiments/need-questions/PROMPT.md; echo $?
0
```

### c2 — friss sessionben elindul

A fájl teljes tartalmát bemásoltam egy friss, üres kontextusú ügynökbe ebben a
repóban. Az első válasza:

> Elolvastam a backlogot. A játék indulhat.
> A repóban **kilenc** ticket van `backlog` státuszban — ezek mind igénynek
> számítanak: [9 soros tábla: GH-3, AT-2, AT-3, AT-4, AT-5, AT-6, AT-7, AT-10, AT-11]
> **0/11 — Melyik igényről van szó?** Adj egy ID-t a fentiekből, vagy mondj egy
> nyers mondatot […]
> Ha nem akarsz választani: **AT-10**-et ajánlom, mert az az egyetlen, ami *most*
> blokkol egy létező munkafolyamatot […]

Elvárás: *a session az első kérdésével indul, és nem kér magyarázatot arról,
hogy mit kellene csinálnia.* **Teljesül.** Az első megnyilvánulása kérdés,
haladásjelzővel, konkrét opciókkal és ajánlással. Nem kérdezett vissza a
feladatra.

Ráadásként — amit a check nem kért, de mutatja, hogy a leírás átment: előbb
olvasott, és a `NQ-1.1.1` definícióját helyesen alkalmazta. Pontosan a kilenc
`backlog`-ot sorolta fel, **a `GH-3`-mal együtt** — vagyis a végrehajtható
törzs nem tévesztette meg.

Egy eltérés: `0/11`-gyel számozott, nem `1/11`-gyel, mert a „melyik igény ez"
kérdést a sor elé vette. Védhető olvasat, nem hiba.

### Amit a check nem mér

**c1 majdnem tartalmatlan.** Egy üres fájl is `0`-t ad. Csak azt méri, hogy
eltaláltam-e az utat.

**c2 az *első* választ nézi, semmi többet.** Egy olyan leírás is átmenne rajta,
amely szépen indul, és a 6-os kérdésnél összeomlik. Az ügynök egy kérdést tett
fel; a maradék tíz nem lett megfigyelve.

**És itt a lényeg: ez a PROMPT.md szándékosan hiányos, és ezt c2 nem látja.**
Nincs benne megállási szabály (`NQ-1.3`) és nincs benne gazda-hozzárendelési
szabály (`NQ-1.2`) — mindkettő kibontatlan ág. A hiány a 10-es és a 11-es
kérdésnél jelenne meg, oda pedig a check nem ér el.

Ezt nem elrejteni kell, hanem kimondani, ezért a `PROMPT.md`-ben van egy
`## Amit ez a sor még NEM tud` szakasz, amely mindkét hiányt megnevezi és
mutat a két ágra. **Így a levél célja teljesül a saját hatókörén belül** — a
leírás megvan, egy fájlban áll, magától elindul —, de a `NQ-1` gyökér c2-je
(*„a sor tud nemet mondani"*) ezzel a fájllal még **nem** volna megfigyelhető.
A `NQ-1.4` próbája ezért nem futtatható le még.
