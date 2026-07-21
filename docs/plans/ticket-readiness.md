# Célfa — TR-1

> Egy parancs ticketenként kiírja, hiányzik-e a végrehajtáshoz szükséges hat szakasz vagy a story point valamelyike, és pontosan melyik.

**10 cél · 6 levél · 1h 25m becsült munka · 2 emberi döntés**

Forrás: `ticket-readiness.tree.json` · generálva: 2026-07-20T21:40:00+02:00

## A te döntéseid

Ezek nélkül az ügynök vagy áll, vagy kitalálja őket.

| # | cél | idő | mit kell eldöntened |
|---|---|---|---|
| `TR-1.4` | El van döntve és le van írva, hol és mikor nézel rá | 10m | Egy dokumentált helyen áll, mikor futtatod ezt a parancsot, és hogy a kimenete blokkol-e bármit vagy csak tájékoztat. |
| `TR-1.5` | A ticket típusa szerint eltérő bizonyíték követelhető | — | Egy UI-t érintő ticketnél screenshot, egy séma-ticketnél visszafelé migráció, egy API-ticketnél verzió — a típushoz kötött követelmény is számonkérhető. |

## Áttekintés

`★` a te döntésed · `▾` bontva · `·` levél

```
   1h 25m  ▾ TR-1         Minden ticketről látszik, van-e elég követelménye a végrehajtáshoz
        —    ▾ TR-1.1       A követelménylista egy helyen van, gépnek olvasható alakban
   1h 00m    ▾ TR-1.2       Egy parancs végignézi a tickteket és kiírja a hiányt
      15m      · TR-1.2.1     A parancs megtalálja és beolvassa mind a 13 tickettet
      25m      · TR-1.2.2     Ticketenként megnevezi a hiányzó szakaszokat és mezőket
      10m      · TR-1.2.3     A kimenet egy pillantásra olvasható
      10m      · TR-1.2.4     Sérült vagy nem-ticket fájlon sem áll meg
      15m    · TR-1.3       Bizonyítjuk, hogy a parancs tényleg a ticket tartalmát olvassa
★     10m    · TR-1.4       El van döntve és le van írva, hol és mikor nézel rá
★       —    ▾ TR-1.5       A ticket típusa szerint eltérő bizonyíték követelhető
```

## Részletek

### TR-1 · Minden ticketről látszik, van-e elég követelménye a végrehajtáshoz

Egy parancs ticketenként kiírja, hiányzik-e a végrehajtáshoz szükséges hat szakasz vagy a story point valamelyike, és pontosan melyik.

**1h 25m** · 5 gyerek · gazda: ügynök

*Miért nem levél:* c1 nem figyelhető meg, amíg a parancs nem létezik; a parancs négy külön megfigyelhető részből áll.

| # | állítás | ellenőrzés |
|---|---|---|
| c1 | A parancs mind a 13 ticketre ad ítéletet, és a hiányokat névvel nevezi meg. | *parancs* · `python3 skills/ready/ready.py \| tee /tmp/ready.out \| wc -l; grep -E '^AT-6' /tmp/ready.out`<br>→ 13 sornyi ticket-ítélet; az AT-6 sora ⛔, és felsorolja: Scope, Out of scope, Acceptance criteria, Verification, Dependencies, story_points |
| c2 | Az ítélet a ticket tényleges tartalmából jön, nem beégetett listából. | *folyamat* · `A GH-1 ticketből töröld a `## Verification` szakaszt, futtasd újra a parancsot, majd `git checkout a-team/tickets/GH-1-interrupted-sprint-closure.md` és futtasd megint.`<br>→ elsőre GH-1 ⛔ és a hiányok között ott van a Verification; visszaállítás után újra ✅ |

A cél az 1-es stopnál jóváhagyott mondat: 'Minden ticketről egy pillantásra látszik, van-e elég követelménye ahhoz, hogy az agent kérdés nélkül végigvigye — és ha nincs, pontosan mi hiányzik belőle.' Futamméret: egy este. A jelenlegi valóság a 3892c0d commitnál: 13 ticketből 4 teljes (AT-1, GH-1, TEMP-20260719-01, TEMP-20260719-02).

#### TR-1.1 · A követelménylista egy helyen van, gépnek olvasható alakban

A hat kötelező szakasz és a story_points mező egyetlen adatfájlban áll, nem prózában és nem kódba drótozva, hogy később típusfüggő szabállyal bővíthető legyen.

**—** · 0 gyerek · gazda: ügynök

*Miért nem levél:* külön futamban bontjuk

| # | állítás | ellenőrzés |
|---|---|---|
| c1 | A követelménylista adat, amit egy új sorral bővíteni lehet kódmódosítás nélkül. | *eldönthetetlen* · `A fájl formátuma és helye még nincs kiválasztva; a bővíthetőség csak konkrét formátum ellen figyelhető meg.`<br>→ külön futamban bontjuk |

Ma este ez a TR-1.2 belsejében adatszerkezetként valósul meg (lásd TR-1.2 notes). Önálló, verziózott szerződéssé emelése az a futam, amelyik a típusfüggő követelményt (TR-1.5) is kiszolgálja.

#### TR-1.2 · Egy parancs végignézi a tickteket és kiírja a hiányt

A `python3 skills/ready/ready.py` beolvassa az összes ticketfájlt, és ticketenként egy sorban megnevezi a hiányzó kötelező szakaszokat és mezőket.

**1h 00m** · 4 gyerek · gazda: ügynök

*Miért nem levél:* A beolvasás, a hiánymegnevezés, a kimenet alakja és a hibatűrés négy külön megfigyelhető állítás.

| # | állítás | ellenőrzés |
|---|---|---|
| c1 | A parancs egyetlen futásból ad teljes képet: minden ticket szerepel, minden hiány néven nevezve. | *parancs* · `python3 skills/ready/ready.py`<br>→ 13 sor; a 4 teljes ticket (AT-1, GH-1, TEMP-20260719-01, TEMP-20260719-02) ✅, a többi ⛔ hiánylistával |

A hat kötelező szakasz a 6-os stopnál jóváhagyva: Outcome, Scope, Out of scope, Acceptance criteria, Verification, Dependencies — plusz a nem üres story_points frontmatter mező. A Why, a Context és a Result szándékosan nem kötelező; a Result a schemas/ticket.md szerint lezárásig üres. A szabálylista a szkriptben is adatként (lista/dict) áll, nem elszórt if-ekben — ez tartja nyitva a TR-1.1 és TR-1.5 útját.

##### TR-1.2.1 · A parancs megtalálja és beolvassa mind a 13 tickettet

A parancs az `a-team/tickets/*.md` fájlokból kiolvassa a frontmattert és a `## ` szakaszcímeket, és minden fájlról ad egy sort.

**15m** · levél · gazda: ügynök

| # | állítás | ellenőrzés |
|---|---|---|
| c1 | A kimenet pontosan annyi ticket-sort tartalmaz, ahány ticketfájl van a mappában. | *parancs* · `test "$(python3 skills/ready/ready.py \| grep -cE '^(AT\|GH\|TEMP)-')" = "$(ls a-team/tickets/*.md \| wc -l \| tr -d ' ')"; echo $?`<br>→ 0 |
| c2 | Minden ticket azonosítója szerepel a kimenetben, egy sem esik ki csendben. | *parancs* · `python3 skills/ready/ready.py > /tmp/r.out; for f in a-team/tickets/*.md; do id=$(grep -m1 '^id:' "$f" \| cut -d' ' -f2); grep -q "^$id" /tmp/r.out \|\| echo "HIÁNYZIK: $id"; done`<br>→ üres kimenet |

ember: 2 perc (a kimenet átfutása). Nulla függőség: csak a python3 standard könyvtára, a frontmatter kézzel parse-olva, a repó validate.py / runway.py mintájára.

##### TR-1.2.2 · Ticketenként megnevezi a hiányzó szakaszokat és mezőket

Minden ⛔ sor felsorolja, pontosan melyik a hat kötelező szakaszból és a story_points mezőből hiányzik.

**25m** · levél · gazda: ügynök · függ: `TR-1.2.1`

| # | állítás | ellenőrzés |
|---|---|---|
| c1 | Az AT-6 sora mind a hat hiányát megnevezi, a story pontot is beleértve. | *parancs* · `python3 skills/ready/ready.py \| grep '^AT-6'`<br>→ ⛔ jelölés, és a sorban szerepel: Scope, Out of scope, Acceptance criteria, Verification, Dependencies, story_points |
| c2 | A teljes ticketek üres hiánylistát kapnak, és nem kapnak hamis hiányt. | *parancs* · `python3 skills/ready/ready.py \| grep -E '^(AT-1\|GH-1\|TEMP-20260719-01\|TEMP-20260719-02) '`<br>→ mind a négy sor ✅, hiánylista nélkül |
| c3 | A nem kötelező szakaszok hiánya sosem jelenik meg hiányként. | *parancs* · `python3 skills/ready/ready.py \| grep -E 'Why\|Context\|Result'`<br>→ üres kimenet — a három nem kötelező szakasz neve sehol nem szerepel a hiányok között |

ember: 5 perc (a hiánylisták kiszúrópróbás összevetése két tickettel). A c3 azért kell, mert a schemas/ticket.md kilenc szakaszt sorol fel; a hatra szűkítés a 6-os stop jóváhagyott döntése, és pont ez az, amit egy figyelmetlen implementáció visszacsempészne.

##### TR-1.2.3 · A kimenet egy pillantásra olvasható

A ⛔ sorok elöl állnak, a ✅ sorok hátul, és minden ticket egyetlen sort foglal.

**10m** · levél · gazda: ügynök · függ: `TR-1.2.2`

| # | állítás | ellenőrzés |
|---|---|---|
| c1 | A kimenetben egyetlen ✅ sor sem előzi meg ⛔ sort. | *parancs* · `python3 skills/ready/ready.py \| grep -nE '⛔\|✅' \| awk -F: '/✅/{seen=1} /⛔/{if(seen) print "SORREND HIBA: " $0}'`<br>→ üres kimenet |
| c2 | Egy ticket egy sor — a leghosszabb hiánylista sem törik több sorba. | *mérés* · `python3 skills/ready/ready.py \| grep -cE '^(AT\|GH\|TEMP)-' és a teljes sorszám összevetése`<br>→ a ticket-sorok száma 13, és a teljes kimenet legfeljebb 15 sor (13 ticket + legfeljebb 2 sor összegzés) |

ember: 3 perc (ránézés: tényleg egy pillantás-e). Ez az a levél, ahol a 'ránézek és látom' állítás megfigyelhetővé válik: rendezés + sorszám, nem esztétikai ítélet.

##### TR-1.2.4 · Sérült vagy nem-ticket fájlon sem áll meg

Egy üres vagy frontmatter nélküli .md fájl a tickets mappában nem szakítja meg a futást; a fájl megjelölve szerepel a kimenetben.

**10m** · levél · gazda: ügynök · függ: `TR-1.2.1`

| # | állítás | ellenőrzés |
|---|---|---|
| c1 | Üres .md fájl mellett a parancs végigfut és nullával tér vissza. | *parancs* · `: > a-team/tickets/ZZZ-empty.md; python3 skills/ready/ready.py; echo "exit=$?"; rm a-team/tickets/ZZZ-empty.md`<br>→ exit=0, és a 13 valódi ticket sora változatlanul megjelenik |
| c2 | A sérült fájl nem tűnik el csendben — külön megjelölve látszik. | *parancs* · `: > a-team/tickets/ZZZ-empty.md; python3 skills/ready/ready.py \| grep ZZZ-empty; rm a-team/tickets/ZZZ-empty.md`<br>→ egy sor, ⛔ jelöléssel és 'nem ticket' (vagy azonos értelmű) indoklással |

ember: 2 perc. A c2 a lényegi rész: a csendes kihagyás pont az a hiba, ami miatt a szerszám hazudni tudna arról, hogy mindent megnézett.

#### TR-1.3 · Bizonyítjuk, hogy a parancs tényleg a ticket tartalmát olvassa

Egy végigfuttatott folyamat megmutatja, hogy egy szakasz eltávolítása átbillenti az ítéletet, visszatétele pedig visszabillenti.

**15m** · levél · gazda: ügynök · függ: `TR-1.2.2`

| # | állítás | ellenőrzés |
|---|---|---|
| c1 | Egy ✅ ticketből egy kötelező szakaszt kivéve a ticket ⛔ lesz, és pont az a szakasz jelenik meg hiányként. | *folyamat* · `python3 - <<'EOF' import re,pathlib p=pathlib.Path('a-team/tickets/GH-1-interrupted-sprint-closure.md') s=p.read_text() p.write_text(re.sub(r'\n## Verification\n.*?(?=\n## )', '\n', s, flags=re.S)) EOF python3 skills/ready/ready.py \| grep '^GH-1' git checkout a-team/tickets/GH-1-interrupted-sprint-closure.md python3 skills/ready/ready.py \| grep '^GH-1'`<br>→ az első GH-1 sor ⛔ és tartalmazza a 'Verification' szót; a második GH-1 sor ✅ |

ember: 5 perc (a két kimenet összevetése). Ez a 3-as stopnál jóváhagyott második sikerfeltétel. Egyetlen megfigyelhető állítás, ezért levél, nem bontott ág. A folyamat a végén visszaállítja a ticket eredeti tartalmát — a git checkout a lépés része, nem takarítás utána.

#### TR-1.4 · El van döntve és le van írva, hol és mikor nézel rá ★

Egy dokumentált helyen áll, mikor futtatod ezt a parancsot, és hogy a kimenete blokkol-e bármit vagy csak tájékoztat.

**10m** · levél · gazda: ember · függ: `TR-1.2.3`

| # | állítás | ellenőrzés |
|---|---|---|
| c1 | A parancs és a futtatás alkalma egy skill-dokumentumban le van írva, szó szerint másolható parancssorral. | *parancs* · `grep -n 'skills/ready/ready.py' skills/ready/SKILL.md`<br>→ legalább egy találat, egy másolható parancssor és mellette az alkalom megnevezése (pl. sprint tervezés előtt) |
| c2 | Ki van mondva, hogy a ⛔ ma nem blokkol semmilyen műveletet. | *parancs* · `grep -niE 'nem blokkol\|does not block\|tájékoztat' skills/ready/SKILL.md`<br>→ legalább egy találat |

human: a futtatás alkalma és a blokkolás kérdése munkafolyamat-döntés, nem implementációs részlet. A 6-os stopnál a PO/PM már kimondta, hogy ma a ⛔ nem blokkol — ez a levél ezt írja le, és rögzíti, mikor nézel rá. ember: 10 perc, agent: 10 perc a leírás megszövegezésére.

#### TR-1.5 · A ticket típusa szerint eltérő bizonyíték követelhető ★

Egy UI-t érintő ticketnél screenshot, egy séma-ticketnél visszafelé migráció, egy API-ticketnél verzió — a típushoz kötött követelmény is számonkérhető.

**—** · 0 gyerek · gazda: ember

*Miért nem levél:* külön futamban bontjuk

| # | állítás | ellenőrzés |
|---|---|---|
| c1 | A ticket típusához kötött extra követelmény hiánya ugyanúgy megjelenik, mint a hat általánosé. | *eldönthetetlen* · `Előbb el kell dönteni, honnan jön a típus (a frontmatter `type:` mezője vagy AI-ítélet), és hogy egy bizonyíték meglétét hogyan figyeljük meg egyáltalán.`<br>→ külön futamban bontjuk |

A PO/PM vetette fel a 6-os stop előtt; a 2-es stopnál jóváhagyott határral ütközik ('a szerszám nem mond véleményt'), ezért tudatosan kimarad a mai futamból. A külön futam első kérdése: a típus a schemas/ticket.md `type:` mezőjéből jön-e, vagy AI-ítéletből. A PO/PM ötletei: UI → screenshot. Az agent hozzátette: séma → visszafelé migráció, API → verzió, agent-skill → lefuttatott példa. Egyik sincs eldöntve.

