# Célfa — NQ-1

> Egy leírt kérdéssor végigvihető egy igényen úgy, hogy a végén minden nyitott kérdés vagy megválaszolva, vagy gazdával felírva áll.

**10 cél · 5 levél · 1h 30m becsült munka · 0 emberi döntés**

Forrás: `need-questions.tree.json` · generálva: 2026-07-20T23:10:00+02:00

## A te döntéseid

Ezek nélkül az ügynök vagy áll, vagy kitalálja őket.

| # | cél | idő | mit kell eldöntened |
|---|---|---|---|

## Áttekintés

`★` a te döntésed · `▾` bontva · `·` levél

```
   1h 30m  ▾ NQ-1         Rögzítve van, milyen kérdéssort kell feltenni egy igényre
   1h 30m    ▾ NQ-1.1       A kérdéssor tartalma
      10m      · NQ-1.1.1     Mi számít igénynek
      20m      · NQ-1.1.2     A két meglévő készlet egymásra fektetve
      25m      · NQ-1.1.3     A hiányzó kérdések megnevezve
      15m      · NQ-1.1.4     A sorrend rögzítve
      20m      · NQ-1.1.5     A leírás helye és alakja
        —    ▾ NQ-1.2       Kérdésenként a gazda
        —    ▾ NQ-1.3       A megállási szabály
        —    ▾ NQ-1.4       Próba két valódi igényen
```

## Részletek

### NQ-1 · Rögzítve van, milyen kérdéssort kell feltenni egy igényre

Egy leírt kérdéssor végigvihető egy igényen úgy, hogy a végén minden nyitott kérdés vagy megválaszolva, vagy gazdával felírva áll.

**1h 30m** · 4 gyerek · gazda: ügynök

*Miért nem levél:* c1 és c2 csak akkor figyelhető meg, ha a kérdéssor tartalma, a kérdésenkénti gazda és a megállási szabály már létezik.

| # | állítás | ellenőrzés |
|---|---|---|
| c1 | A kérdéssor végigvihető egy valódi, kibontatlan igényen, és a végén minden nyitott kérdésnek van gazdája. | *folyamat* · `Végigvisszük a kérdéssort az a-team/tickets/AT-7-prime-context.md igényen, majd a kimenetet egymás mellé tesszük az AT-7 `## Open questions` szakaszával.`<br>→ az ott álló minden kérdés vagy megválaszolva, vagy gazdával (agent/ember) felírva; nulla felíratlan kérdés |
| c2 | A kérdéssor tud nemet mondani: alulspecifikált igényen megnevezi, mi hiányzik, és nem enged tovább. | *folyamat* · `Végigvisszük a kérdéssort az a-team/tickets/AT-6-board-v2.md félkész igényen.`<br>→ a sor megáll, és megnevezi, melyik kérdésre nincs válasz — nem ad zöld ítéletet |

A 3892c0d utáni este tanulsága szülte: a hat kötelező ticket-szakasz a refine-ticket öt kérdésének fosszíliája, ezért a szakasz-meglét ellenőrzése nem méri, hogy egy igény végrehajtható-e. Futamméret: egy este (1-es stopnál jóváhagyva). Határok a 2-es stopnál: nem építünk checker-szkriptet; nem építünk olyat, ami a kártya ÉRTÉKÉRŐL ítélkezik (a munka TERMÉSZETÉBŐL következtetni szabad — PO/PM élesítése); nem módosítjuk a schemas/ticket.md-t; nem írjuk át a refine-ticket skillt; nem oldjuk meg a típusfüggő bizonyítékot (AT-11).

#### NQ-1.1 · A kérdéssor tartalma

Le van írva, mely kérdéseket kell feltenni és milyen sorrendben, mindegyik vagy a két meglévő készletből származtatva, vagy megnevezett repó-esettel indokolva.

**1h 30m** · 5 gyerek · gazda: ügynök

*Miért nem levél:* A bemenet definíciója, a két készlet összefésülése, a hiánypótlás, a sorrend és a leírás helye öt külön megfigyelhető állítás.

| # | állítás | ellenőrzés |
|---|---|---|
| c1 | A sorban egyetlen kitalált kérdés sincs: mindegyik vagy örökölt, vagy megnevezett esettel indokolt. | *mérés* · `Végigolvasva a leírt sort, kérdésenként megjelölve a származása: 'hét stop N.', 'refine-ticket N.', vagy egy repó-eset azonosítója (ticket-ID vagy commit).`<br>→ nulla olyan kérdés, amely mellett egyik sem áll |

Az 5-ös stopnál a PO/PM ezt az ágat húzta bontásra. A többi három ág kibontatlan cél marad.

##### NQ-1.1.1 · Mi számít igénynek

Le van írva, mi a kérdéssor bemenete — nyers mondat, capture-stage ticket, vagy mindkettő —, és a definíció ellen a repó minden ticketje besorolható.

**10m** · levél · gazda: ügynök

| # | állítás | ellenőrzés |
|---|---|---|
| c1 | A definíció ellen a repó minden ticketje egyértelműen besorolható igényként vagy nem igényként. | *mérés* · `Az a-team/tickets/*.md összes fájlját besoroljuk a leírt definíció ellen, egy sor per ticket.`<br>→ a sorok száma egyezik a ticketfájlok számával, és nulla 'nem tudom' besorolás |

ember: 5 perc (a definíció átfutása). A 6-os stopnál agent-gazda: a schemas/ticket.md-ben létezik capture-szakasz `## Open questions`-szel, tehát a definíció kiolvasható a repóból.

##### NQ-1.1.2 · A két meglévő készlet egymásra fektetve

Egy táblázat mutatja, a hét stop hét tétele és a refine-ticket öt kérdése hogyan fedi egymást, és melyiknek nincs párja.

**20m** · levél · gazda: ügynök · függ: `NQ-1.1.1`

| # | állítás | ellenőrzés |
|---|---|---|
| c1 | Mindkét készlet minden tétele pontosan egyszer szerepel, párral vagy 'nincs párja' jelöléssel. | *mérés* · `A táblázat sorainak összevetése a docs/experiments/intake/PROMPT.md hét stopjával és a skills/refine-ticket/SKILL.md öt kérdésével.`<br>→ 12 tétel lefedve, nulla lefedetlen és nulla duplán szereplő tétel |

ember: 5 perc (a táblázat átfutása). A csendes kihagyás itt is a fő kockázat: egy tétel, ami egyik oldalról sem néz vissza, észrevétlenül kiesik.

##### NQ-1.1.3 · A hiányzó kérdések megnevezve

Amit egyik készlet sem kérdez, az megnevezve áll, és mindegyik mellett ott a repó-eset, ahol a hiánya kárt okozott.

**25m** · levél · gazda: ügynök · függ: `NQ-1.1.2`

| # | állítás | ellenőrzés |
|---|---|---|
| c1 | Minden új kérdés mellett áll egy megnevezett repó-eset. | *mérés* · `Az új kérdések listáját végigolvasva mindegyik mellett egy ticket-ID vagy commit-hash áll, amely a hiány kárát mutatja.`<br>→ nulla indoklás nélküli új kérdés |

ember: 10 perc. A check szándékosan szigorú: enélkül az agent kitalálna kérdéseket, amiket senki nem hiányolt. Egy már ismert jelölt: 'melyik nyitott kérdés kié' — a hét stop 6-osa kérdezi, a refine-ticket öt kérdése nem, és a ticket refined alakjában nincs neki hely.

##### NQ-1.1.4 · A sorrend rögzítve

A kérdések sorrendben állnak, és egyik kérdés sem támaszkodik későbbi válaszra.

**15m** · levél · gazda: ügynök · függ: `NQ-1.1.3`

| # | állítás | ellenőrzés |
|---|---|---|
| c1 | A soron végigolvasva nincs előreutalás: minden kérdés csak korábbi válaszokra épít. | *folyamat* · `A leírt sort elejétől végigolvasva kérdésenként megnézzük, mely korábbi válaszra hivatkozik.`<br>→ nulla olyan kérdés, amely egy későbbi kérdés válaszát feltételezi |

ember: 5 perc. A hét stop sorrendje nem véletlen (cél → határ → siker); ez a levél teszi ugyanezt megfigyelhetővé az új soron.

##### NQ-1.1.5 · A leírás helye és alakja

A kérdéssor egy megnevezett fájlban áll a docs/experiments/ alatt, és önmagában használható egy friss sessionben, az intake PROMPT.md mintájára.

**20m** · levél · gazda: ügynök · függ: `NQ-1.1.4`

| # | állítás | ellenőrzés |
|---|---|---|
| c1 | A fájl a megnevezett úton létezik. | *parancs* · `test -f docs/experiments/need-questions/PROMPT.md; echo $?`<br>→ 0 |
| c2 | A leírás önmagában elég: friss sessionbe bemásolva elindul, külső magyarázat nélkül. | *folyamat* · `A fájl teljes tartalmát bemásoljuk egy friss Claude Code sessionbe a repóban, és megnézzük az első választ.`<br>→ a session az első kérdésével indul, és nem kér magyarázatot arról, hogy mit kellene csinálnia |

ember: 10 perc (a bemásolás és az első válasz megnézése). A 6-os stopnál a PO/PM döntött: kísérlet a docs/experiments/ alatt, nem skill a csomagban. Indok: skillnél a SKILL.md router operation-listáját és a METHOD.md ownership-tábláját is bővíteni kellene — az bekötés, nem leírás.

#### NQ-1.2 · Kérdésenként a gazda

Minden kérdésről tudni, hogy az agent válaszolja meg magától — repóból vagy a munka természetéből következtetve —, vagy az embertől kell megkérdezni.

**—** · 0 gyerek · gazda: ügynök

*Miért nem levél:* külön futamban bontjuk

| # | állítás | ellenőrzés |
|---|---|---|
| c1 | A kérdéssoron végigmenve egyetlen kérdés sem marad gazda nélkül, és az agent nem kérdez vissza olyat, ami a repóból kiolvasható. | *eldönthetetlen* · `A gazda hozzárendelésének szabálya még nincs meg; addig nem figyelhető meg, hogy egy kérdés jó gazdát kapott-e.`<br>→ külön futamban bontjuk |

A 6-os stopnál a PO/PM ezt húzta a következő futamnak. Ez a ma esti felfedezés magva: a hét stop 6-osa (`owner`) a fákban megvan, a ticketekben nincs. A 2-es stop élesített határa ide tartozik: az agent következtethet a munka természetéből (UI-t érint → screenshot kell), de a kártya értékéről nem ítélkezhet.

#### NQ-1.3 · A megállási szabály

Ki van mondva, mikor mondja a kérdéssor, hogy 'ez így nem elég', és hogyan nevezi meg a hiányt.

**—** · 0 gyerek · gazda: ügynök

*Miért nem levél:* külön futamban bontjuk

| # | állítás | ellenőrzés |
|---|---|---|
| c1 | Egy alulspecifikált igényen a sor megáll, és megnevezi, melyik kérdésre nincs válasz. | *eldönthetetlen* · `A megállás feltétele még nincs kimondva; addig nem figyelhető meg, hogy jó helyen állt-e meg.`<br>→ külön futamban bontjuk |

Ez tartja életben a gyökér c2-jét. Enélkül a sor mindenre bólintana, és megint egy zöld check maradna cél nélkül — pontosan az a hiba, ami a ticket-readiness futamot zsákutcába vitte.

#### NQ-1.4 · Próba két valódi igényen

A kérdéssor végig van vive az AT-7-en és az AT-6-on, és a két futás kimenete egymás mellett áll.

**—** · 0 gyerek · gazda: ügynök

*Miért nem levél:* külön futamban bontjuk

| # | állítás | ellenőrzés |
|---|---|---|
| c1 | Az AT-7 végigmegy a soron, az AT-6 megáll rajta. | *eldönthetetlen* · `A sor tartalma, a gazdák és a megállási szabály nélkül nincs mit végigvinni.`<br>→ külön futamban bontjuk |

Ez a gyökér c1 és c2 megfigyelése. Sorrendben az utolsó ág: mind a hármat teszteli.

