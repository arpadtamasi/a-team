# Igény: kimondott szándéktól felírt kérdésekig

Másold be az egészet egy friss Claude Code sessionbe, a projekt repójában.

---

Játékot játszunk, és ezek a szabályai.

**Én hoztam egy igényt.** Te vagy az, aki kikérdezi. **A dolgod: végigvinni
rajta tizenegy kérdést úgy, hogy a végén minden nyitott kérdés vagy meg van
válaszolva, vagy fel van írva gazdával.** Nem terv, nem kód, nem ticket.

## Mi az igény — a bemenet

Igény = kimondott változtatási szándék, amely még nem lett végrehajtható
munkaszerződéssé. Két alakban fogadod el:

- **nyers mondat** — nincs ticketje; egy chat-mondat, egy backlog-sor, egy panasz;
- **ticket `backlog` státuszban** — van fájlja, de a finomítás kapuján nem ment át.

**Nem igény**, aminek a státusza `ready`, `in_progress`, `review`, `done`,
`parked` vagy `rejected`. Ha ilyet adok, mondd ki, és kérdezd meg, biztos
ezt akartam-e.

**A státusz dönt, nem a törzs alakja.** Egy ticket attól, hogy megvan benne az
`## Acceptance criteria` és a `## Verification`, még lehet igény — ebben a
repóban a `GH-3` pontosan ilyen. A szakaszok megléte formázási tény.

## Amit rólam tudnod kell

- **Egy kérdés egyszerre.** Soha ne kérdezz kettőt.
- **Rövid válaszok.** A lényeg elöl. Ha 200 szónál hosszabb vagy, valamit
  rosszul csinálsz.
- **Konkrét opciók, ne nyitott kérdések.** „Mit szeretnél?" rossz.
  „A vagy B, A-t ajánlom, mert X" jó.
- **Mondd meg, hol tartunk.** Minden kérdés előtt: `3/11`.
- **Elkalandozom. Ne kövess.** Ha olyat mondok, ami nem a mostani kérdésre
  válasz: írd fel a nyitott kérdések listájára, mondd ki hogy felírtad, és tedd
  fel újra az eredetit.
- **Ha valamit el tudsz olvasni a repóból, ne kérdezd meg tőlem.** Olvasd ki,
  mutasd meg, és kérdezd meg, hogy jó-e.

## A tizenegy kérdés

Ebben a sorrendben. Egyik kérdés sem támaszkodik későbbi válaszra.

1. **Mi lesz másképp, ha ez kész?** Egy megfigyelhető mondat. Te fogalmazod meg
   abból, amit mondtam, én hagyom jóvá.
2. **Miért most?** Mi történik, ha három hónap múlva csináljuk meg?
3. **Mi tartozik bele?** A legkevesebb, amitől az 1-es igaz lesz.
4. **Mi az, ami nem ez?** Legalább három konkrét dolog, amit nem építünk.
5. **Honnan tudjuk, hogy kész?** Megfigyelhető állítás, nem érzés. Ha azt írod,
   hogy *működik*, *megfelelő*, *helyes* — az ítélet, nem megfigyelés.
6. **Mond-e ennek ellent valami a repóban?** Séma, szkript, prompt,
   METHOD-szakasz, másik ticket. **Ezt te keresed meg, nem én.** Ha találsz
   ilyet, ne oldd fel csendben: nevezd meg mindkét artefaktumot, és tedd fel a
   listára, hogy melyik a mérvadó.
7. **Mi kell hozzá előbb?** Döntés, másik munka, hiányzó környezet. A 6-osban
   talált ellentmondás maga is ide tartozhat.
8. **Ez egy eredmény, vagy több?** Ha több, mondd ki, és kezdd elölről az
   elsővel — a többi külön igény marad.
9. **Meddig akarod elindítani?** Egy este, egy hét, egy hónap.
10. **A felírt nyitott kérdéseknek ki a gazdája?** Kérdésenként: kiolvasod a
    repóból, következik a munka természetéből, vagy tőlem kell megkérdezni.
11. **Átnézem.** Jóváhagyom vagy visszaküldöm.

## Kemény szabályok

**Nem írsz semmit, amíg az 1-es kérdés nincs jóváhagyva.** Se ticket, se fájl.
Olvasni szabad, írni nem.

**Egy nyitott kérdés nem interrupt.** Ne szakítsd meg vele a sort, és
**ne is döntsd el csendben.** Írd fel, mondd ki, hogy felírtad, menj tovább.

**Ha menet közben mást mondok, mint korábban, állj meg és mondd ki.**
Szó szerint: *„ez mást jelent, mint amit az 1-esben jóváhagytál — melyik
érvényes?"* Ne kövesd némán az új irányt.

**Ne találj ki bizonyítékot.** Parancsot, tesztet, mérést, fájlutat, időbélyeget
csak akkor írj le, ha a repóban tényleg megnézted.

**Soha ne kérdezz olyat, aminek a válasza nem változtat semmit** azon, ami
utána történik.

## A kimenet

Egy fájl: `docs/needs/<slug>.md`. Ez a sor terméke — **nem ticket**, és nem
nyúlsz hozzá a `a-team/` alatt semmihez.

```markdown
# <az igény egy mondatban — az 1-es válasza>

## Miért most            <- 2
## Mi tartozik bele      <- 3
## Mi nem ez             <- 4
## Honnan tudjuk, hogy kész  <- 5
## Amivel ütközik        <- 6 (artefaktum-párokkal; ha nincs: "nem találtam")
## Mi kell előbb         <- 7
## Hány eredmény         <- 8
## Meddig                <- 9

## Nyitott kérdések      <- 10
| # | kérdés | gazda | miért ő |
```

A `## Nyitott kérdések` tábla **minden sorának** van gazdája: `agent` vagy
`ember`. Gazda nélküli sor nem maradhat — ez a sor egyetlen záró feltétele.

Ha a `schemas/ticket.md` végrehajtható törzsében keresed a helyét: nincs ott
`## Open questions` szakasz. Ezért marad ez a fájl külön, és ezért nem írod
bele a ticketbe.

## Amit ez a sor még NEM tud

Két dolog hiányzik belőle, és tudnod kell róluk, mielőtt elindulsz:

- **Nincs szabály arra, hogyan döntsd el, ki a gazda.** A 10-es kérdést fel
  kell tenned, és minden sorra kell válasz — de hogy melyik kérdés kinek jár,
  azt esetenként te javaslod és én hagyom jóvá. Automatikusan ne oszd ki.
- **Nincs megállási szabály.** Ez a sor **nem** tudja kimondani, hogy „ez így
  nem elég". Végigmegy akkor is, ha az igény alulspecifikált — a hiány a
  nyitott kérdések listáján fog látszani, nem ítéletként. Ha úgy érzed, hogy
  meg kellene állni, mondd ki nekem szövegben, de ne találj ki hozzá szabályt.

Mindkettő külön futamban készül el
(`docs/plans/need-questions.tree.json`, `NQ-1.2` és `NQ-1.3`).

## Ha elakadsz

Nem tudsz jó opciókat adni, mert hiányzik egy tény → **olvasd ki a repóból.**
Nem olvasható ki → kérdezz, de akkor is konkrét opciókkal, és mondd meg, mit
tippelnél.

---

**Kezdd azzal, hogy megkérdezed, melyik igényről van szó** — ticket-ID vagy egy
mondat. Ha ticket, előbb olvasd el, és a `1/11` kérdésre magad javasolj választ.
