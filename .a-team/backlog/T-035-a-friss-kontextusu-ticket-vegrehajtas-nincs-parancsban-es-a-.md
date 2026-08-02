---
id: T-035
title: 'ticket execute: a friss-kontextusu vegrehajtas legyen parancs, ne fegyelem'
status: backlog
origin: finding
types:
  - feature
  - workflow
profiles:
  - workflow
priority: high
risk: medium
package: P-005
depends_on:
  - T-034
blocks: []
branch: null
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_finding: F-032
---
# T-035 — `ticket execute`: a friss-kontextusú végrehajtás legyen parancs, ne fegyelem

## Outcome

Egyetlen paranccsal — `a-team ticket execute <id>` — egy ready ticket friss ágens-kontextusban fut le: a parancs elvégzi a startot, összeállítja a briefet, elindítja az ágenst kizárólag azzal, és a ticketet implementált, még nem reviewzott állapotban adja vissza. A koordinátor kontextusa nem hordoz ticket-munkát. A kontextus-öröklés csak explicit, indokolt és naplózott kivétel.

## Context

F-032 és D-009. A D-009 kimondja, hogy minden ticket friss ágens-kontextusban fut, és hogy koordinátor-kontextusban ticket-implementáció tilos — de ez ma csak skill-szövegben él. Mért következmény ebben a repóban (2026-08-02): a T-032, T-033, T-012, T-014 és T-015 végig a koordinátor felhalmozott kontextusában készült, és semmi nem állította meg; az operátor vette észre, nem a szerszám. A T-013-nál kézzel állítottuk helyre — `ticket brief T-013` (4509 token) → friss ágens csak a brieffel → a koordinátor review-ra maradt —, és működött, de emberi fegyelem tartotta össze.

Az operátor indoklása: így párhuzamosítható a munka (ma a koordinátor kontextusa a soros szűk keresztmetszet, a package `parallelism` mezője nem tud érvényesülni), minimális marad a kontextus, és megszűnik a ticketek közti átfolyás.

A T-031 mintája irányadó: ott addig volt hazug a mező, amíg az őszinte út nem lett az alapértelmezés és a kivétel explicit nyilatkozat. Ugyanez kell itt.

Függ a T-034-től: amíg az azonosító ütközhet, a párhuzamos végrehajtás adatromlást termel — ma egyetlen párhuzamos ágens is ütközést okozott.

## Actors

- Operátor, aki egy ticketet vagy egy csomagot végrehajtat.
- Koordinátor-ágens, amely sorrendez, kapuknál megáll és jegyzőkönyvez.
- Ticket-ágens, amely kizárólag a briefet kapja.
- A-Team CLI, amely a claimet, branchet, worktree-t, briefet és az ágens-indítást kezeli.

## Initial state

A ticket `ready`, érvényes, nincs claimje, a repó tiszta, és van elérhető ágens-parancs a gépen.

## States

- `unstarted`: a ticket ready, nincs claim.
- `briefed`: a claim, branch és worktree létrejött, a brief összeállt.
- `running`: a ticket-ágens fut a saját kontextusában.
- `implemented`: az ágens visszatért, a munka commitolva a feature branchen, a ticket még active.
- `refused`: valamelyik előfeltétel nem teljesült; semmi nem jött létre.
- `agent-failed`: az ágens hibával vagy üres eredménnyel tért vissza; a claim és a worktree megmarad vizsgálatra.

## Transitions

- `execute` egy ready ticketre: start → brief → ágens-indítás → várakozás → implemented.
- Bármely előfeltétel bukása `refused`, mutáció nélkül.
- Az ágens hibája `agent-failed`; a parancs nem törli a claimet és nem lép review-ba.
- A `--inherit-context` explicit kivétel: a hívó indokot ad, és ez a futam-jegyzőkönyvbe kerül.

## Triggers

Az `execute` parancs, az ágens visszatérése vagy hibája, és a megszakítás.

## Permissions

A parancs a meglévő `ticket start` írókon keresztül hoz létre claimet, branchet és worktree-t, és elindít egy külső ágens-parancsot. Nem lép review-ba, nem mergel, nem zár le ticketet, és nem ír kanonikus állapotot az ágens nevében.

## Error paths

Nem ready ticket, meglévő claim, piszkos repó, hiányzó ágens-parancs, brief-összeállítási hiba, az ágens nem nulla exitje, üres vagy értelmezhetetlen ágens-eredmény — mindegyik cselekvőképes hibaüzenetet ad, és megkülönbözteti, hogy a végrehajtási kontextus létrejött-e.

## Cancellation path

Megszakítás az ágens indítása előtt semmit nem hagy hátra. Megszakítás futó ágens mellett a claimet és a worktree-t érintetlenül hagyja, és megnevezi, mit kell kézzel eldönteni.

## Retry and duplicate-action behaviour

Már claimelt ticketre az `execute` elutasít, nem indít második ágenst. Az `agent-failed` után az újrapróbálás a meglévő végrehajtási kontextust használja, nem hoz létre másodikat.

## Audit and notification expectations

A parancs kiírja a brief méretét tokenben, az elindított ágenst és a végrehajtási kontextust; a brief-méret ticketenként a futam-jegyzőkönyvbe kerül (F-016 első valós költségadata). Külső értesítés nincs.

## Scope

- Új parancs: `a-team ticket execute <id> --agent <agent>`, amely a startot, a briefet és az ágens-indítást egy útba fogja.
- Az ágens kizárólag a briefet kapja bemenetként; a koordinátor kontextusa nem kerül át.
- A brief mérete és a kiválasztott ágens megjelenik a kimenetben, `--json`-ban is.
- `--inherit-context <indok>` explicit kivételként, kötelező indokkal, naplózva.
- A `ticket start` kimenete a következő lépésként az `execute`-ot nevezi meg.
- Az `execute-ticket` és `execute-package` skillek a parancsra hivatkoznak, nem kézi lépéssorra.
- Dokumentáció az operátornak.

## Non-goals

- A review, merge és close automatizálása — azok külön kapuk maradnak.
- Több ticket egyidejű indítása egyetlen `execute` hívásból; a párhuzamosítás a csomag-szintű munka, és a T-034 landolása után.
- Ágens-választás intelligenciája, modell-konfiguráció, költségkeret.
- Az ágens munkájának minőségi bírálata — az a review dolga.

## Acceptance

1. Ready ticketen az `execute` létrehozza a claimet, branchet és worktree-t, elindítja az ágenst, és a ticketet `active` állapotban, commitolt munkával adja vissza.
2. A ticket-ágens bemenete bizonyíthatóan csak a brief: a parancs által átadott prompt nem tartalmaz a briefen kívüli munkaanyagot.
3. A kimenet — humán és `--json` — megnevezi a brief token-méretét, az ágenst, a branchet és a worktree-t.
4. Nem ready ticket, meglévő claim, piszkos repó és hiányzó ágens-parancs mind elutasít, mutáció nélkül.
5. Az ágens nem nulla exitje `agent-failed`-et ad, a claim és a worktree megmarad, a ticket nem lép review-ba.
6. Már claimelt ticketen az újbóli `execute` elutasít, második ágenst nem indít.
7. `--inherit-context` indok nélkül elutasít; indokkal lefut, és az indok megjelenik a kimenetben.
8. A `ticket start` kimenete megnevezi az `execute`-ot mint következő lépést.
9. Teljes tesztkészlet, typecheck és mindhárom build zöld.

## Verification

Integrációs tesztek ideiglenes repóban, az ágens-parancs helyett determinisztikus szkript-dublőrrel: sikeres futás, nem nulla exit, üres eredmény, és a négy elutasítási ág. A prompt tartalmának állítása a dublőr által kapott bemenetből. `npx vitest run`, `npx tsc --noEmit`, mindhárom build.

## Constraints

A parancs nem kerülheti meg a meglévő `ticket start` szerződését és kapuit. Az ágens-indítás legyen kicserélhető, hogy tesztben dublőrrel futhasson. A hívó gépén hiányzó ágens-parancs nem okozhat félig létrejött végrehajtási kontextust.

## Open decisions

None.

## Execution notes

Az `ui` parancs már felderíti a `codex` és `claude` binárist (`commandAvailable` a `src/commands/ui.ts`-ben) — az ágens-indítás erre építhet. A brief a meglévő `ticket brief` szolgáltatás.
