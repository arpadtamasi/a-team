# Kotta fejlesztési javaslat
## Shape: közös modell az ember és a coding agent között

**Státusz:** javaslat  
**Cél:** a Kotta kiterjesztése a contract előtti problématérre: a beszélgetésekből származó intent, döntések, terminológia és bizonytalanságok explicit kezelésére.

---

## 1. Kiinduló helyzet

A Kotta jelenleg erős kontrollréteget ad a már definiált fejlesztési munka végrehajtásához:

```text
human intent
    ↓
contract
    ↓
batch
    ↓
claim / worktree
    ↓
execution
    ↓
evidence
    ↓
acceptance
```

A jelenlegi modell fő erősségei:

- repository-native canonical state;
- explicit executable contract;
- backlog → defined → active → review → done lifecycle;
- bounded execution;
- agentenként külön claim / branch / worktree;
- acceptance-to-evidence mapping;
- explicit human approval;
- durable decisions;
- read-only board / külön mutation surface;
- Git-alapú izoláció és ellenőrizhető végrehajtás.

A probléma az, hogy a legfontosabb hibák jelentős része **már a contract létrejötte előtt** megtörténik.

A user elmondja, mit szeretne. Az agent megpróbálja értelmezni. A hiányzó részeket kitölti, neveket talál ki, modelleket vezet be, trade-offokat választ. Mire elkészül a contract, lehet, hogy már egy olyan rendszer van formalizálva, amely nem pontosan az, amit a user akart.

A javasolt átalakítás ezért nem a jelenlegi execution-control réteg lecserélése, hanem egy új réteg hozzáadása elé.

---

## 2. A két központi probléma

### 2.1. Kimondatlan döntések

A user gyakran pontosan tudja, milyen problémát akar megoldani, de nem fogalmaz meg minden product-, UX- vagy architecture-döntést.

Példa:

> Kellene a gyakorláshoz beginner / intermediate / advanced út, és a mérés alapján mondja meg, mi legyen a következő.

Ebből legalább két nagyon különböző rendszer következhet:

1. előre definiált progression van, a mérés csak unlockolja a következő lépést;
2. az AI minden alkalommal szabadon választ gyakorlatot.

Ha ezt nem tisztázzuk, a coding agent kénytelen választani.

A probléma nem egyszerűen az, hogy „hiányos a spec”, hanem az, hogy:

> **a coding agent olyan döntést hoz meg, amelyről a user nem feltétlenül tudja, hogy döntés volt.**

---

### 2.2. Terminológiai drift

A másik tipikus probléma, hogy az agent olyan terminológiát kezd használni, amelyet a user nem használ vagy nem ért.

Példa:

```text
user:
"gyakorlási út"

agent:
"progression pipeline"

másik contract:
"learning track"

kód:
PracticeProgram
```

Néhány iteráció után ugyanaz a fogalom több néven él.

Ennek következménye:

- a contract nehezebben olvasható;
- a usernek folyamatosan vissza kell fejtenie az agent nyelvét;
- a dokumentáció és a kód eltérő fogalmi modelleket használhat;
- az agent maga is azt hiheti, hogy két külön fogalomról van szó;
- idővel a terminológiai drift domain-model driftet okozhat.

A probléma ezért nem pusztán copywriting:

> **az agent olyan fogalmat nevez el, amelyről a user nem feltétlenül tudja, hogy új fogalomként lett bevezetve.**

---

## 3. Javasolt új Kotta-modell

A jelenlegi modell:

```text
intent
  ↓
contract
  ↓
batch
  ↓
execution
  ↓
evidence
  ↓
acceptance
```

A javasolt modell:

```text
messy conversation
        ↓
      SHAPE
        ↓
 ┌───────────────┐
 │ intent        │
 │ facts         │
 │ constraints   │
 │ decisions     │
 │ terminology   │
 │ provenance    │
 └───────────────┘
        ↓
 decision gaps
 terminology gaps
 semantic conflicts
        ↓
 own / delegate / clarify / name
        ↓
 shared model
        ↓
  0..N contracts
        ↓
      batches
        ↓
    execution
        ↓
     evidence
        ↓
    acceptance
```

A lényegi változás:

> **A contract ne a gondolkodási folyamat eleje legyen, hanem annak fordítási célpontja.**

---

# 4. Új first-class fogalom: Shape

## 4.1. Mi a Shape?

A Shape egy contract előtti, conversation-driven munkaterület.

Nem task.

Nem observation.

Nem backlog contract.

Nem spec-dokumentum.

A Shape egy **folyamatosan épülő közös modell arról, hogy mit ért az ember és az AI a problémán**.

Példa:

```text
S-01...
Guided practice

Goal
Facts
Constraints
Decisions
Delegations
Decision gaps
Terminology
Terminology gaps
Possible conflicts
Sources
Candidate contracts
```

Egy Shape eredménye lehet:

- 0 contract;
- 1 contract;
- több contract;
- 1 vagy több durable decision;
- új observation;
- egy batch-javaslat;
- vagy annak felismerése, hogy nincs szükség fejlesztésre.

Ezért fontos, hogy a Shape ne legyen automatikusan contract.

---

## 4.2. A Shape minimális adatszerkezete

Javasolt MVP-forma:

```yaml
id: S-...
title: Guided practice
status: shaping

sources:
  - type: conversation
    ref: E-...
  - type: file
    ref: src/...
  - type: decision
    ref: D-...

candidate_contracts: []
```

Markdown body:

```md
# Goal

...

# Facts

...

# Constraints

...

# Decisions

...

# Delegations

...

# Decision gaps

...

# Terminology

...

# Terminology gaps

...

# Possible semantic conflicts

...

# Candidate contracts

...
```

Nem szükséges minden fieldet canonicalizálni az első verzióban.

A fontos az, hogy a Shape:

- repository-native legyen;
- provenance-szel rendelkezzen;
- ne legyen végrehajtható;
- különüljön el a contract lifecycle-tól.

---

# 5. Decision gaps

## 5.1. Miért nem „spec completeness”?

Nem javasolt olyan score használata, mint:

```text
Specification completeness: 73%
```

Ez nehezen értelmezhető és könnyen válik álprecíz metrikává.

A sokkal relevánsabb kérdés:

> **Ha most elindulna a coding agent, milyen döntéseket kellene még saját maga meghoznia?**

Ez legyen a `decision gap`.

---

## 5.2. Három döntési állapot

Nem minden döntést kell az embernek meghoznia.

Egy senior fejlesztőt sem mikromenedzselünk.

Ezért minden felismert döntési pont kapjon egy státuszt:

### OWNED

Az ember explicit meghozta a döntést.

```text
✓ OWNED
Progression is deterministic.
```

### DELEGATED

Az ember tudatosan delegálta a döntést az agentnek, megfelelő korlátokkal.

```text
→ DELEGATED
Choose the local class structure following existing repository patterns.
```

### UNOWNED

Nem világos, ki hozza meg a döntést.

```text
! UNOWNED
What happens when performance regresses?
```

A lényegi szabály:

> **csak az UNOWNED döntés blokkolja a contract compile/sign folyamatot.**

Ez megakadályozza, hogy a Kotta bürokratikus kérdezőgéppé váljon.

---

## 5.3. A Kotta új fontos metrikája

Javasolt elsődleges shaping metric:

```text
Unowned decisions: 3
```

Ennek jelentése:

> Ha most elkezdődne a végrehajtás, három olyan product/design/architecture döntés van, amelyet az implementáló agentnek kellene a user helyett meghoznia.

Ez sokkal informatívabb, mint egy általános readiness score.

---

# 6. A kérdezés szabálya

A Kotta ne interjúztassa a usert.

A jelenlegi `define-contract` filozófiáját érdemes általánosítani:

> **Investigate before asking.**

A Shape-agent először:

1. megnézi a releváns kódot;
2. elolvassa a dokumentációt;
3. megkeresi a kapcsolódó contractokat;
4. megkeresi a durable decisionöket;
5. megnézi a project vocabularyt;
6. csak ezután tesz fel kérdést.

Kérdést csak akkor érdemes feltenni, ha a válasz materially befolyásolja például:

- az observable behaviourt;
- egy durable invariánst;
- a product flow-t;
- az adatmodellt;
- architecture boundaryt;
- migrationt;
- securityt;
- external integrationt;
- acceptance-et;
- irreversible vagy drága trade-offot.

Nem kérdés:

> Milyen nevet adjunk ennek a helpernek?

Tipikus kérdés:

> A mérés egy előre definiált progression következő lépését oldja fel, vagy az AI szabadon választ következő gyakorlatot?

---

## 6.1. Döntési kérdések, nem általános pontosítások

Kerülendő:

> Pontosítsd, mit értesz „következő gyakorlat” alatt.

Jobb:

```text
A "következő gyakorlat" két materially eltérő rendszert jelenthet:

A — a mérés unlockolja az előre definiált következő lépést;
B — a recommendation engine szabadon választ egy gyakorlatot.

Ez befolyásolja a persistence-et, a tesztelhetőséget és az UX-et.

Melyiket szeretnéd?
```

A Shape-agent feladata nem az általános kérdezés, hanem a **döntési pontok felismerése és minimalizált felszínre hozása**.

---

# 7. Terminológia mint first-class kontrollréteg

## 7.1. Négy nyelvi szint

A rendszerben érdemes explicit különválasztani:

```text
HUMAN LANGUAGE
ahogy a user nevezi

DOMAIN LANGUAGE
a projekt elfogadott közös terminológiája

CODE LANGUAGE
identifier / class / API naming

KOTTA LANGUAGE
contract, batch, observation, shape stb.
```

Példa:

```text
Human:
"gyakorlási út"

Canonical domain term:
practice path

Code:
PracticePath
```

A cél nem az, hogy minden szónak egyetlen neve legyen, hanem hogy világos legyen:

- melyik ugyanannak a fogalomnak az aliasa;
- melyik valóban külön fogalom;
- melyik az elfogadott domain term;
- melyik csak implementációs név.

---

## 7.2. Project Vocabulary

Javasolt repository-native artifact:

```text
.kotta/vocabulary.md
```

MVP-példa:

```md
# Project vocabulary

## Practice path

Meaning:
The ordered set of exercises through which a user progresses.

Preferred term:
practice path

Human term:
gyakorlási út

Code:
PracticePath

Aliases understood:
- learning path
- progression path

Avoid:
- curriculum
- course
- program

Notes:
Progression inside a practice path may branch.
```

Nem cél ontology engine építése.

Egy egyszerű Markdown fájl elegendő első iterációban.

---

## 7.3. Terminológiai gap

A Shape-agent keresse azokat az eseteket, ahol:

- a user egy fogalmat máshogy nevez, mint a repo;
- több contract különböző szót használ ugyanarra;
- a code és a product language nincs összhangban;
- új fogalom került bevezetésre definíció nélkül;
- két azonosnak tűnő szó esetleg valójában külön domain entity.

Példa:

```text
TERMINOLOGY GAP

You said:
"next exercise"

Existing code says:
"recommendation"

An earlier contract says:
"suggestion"

These may refer to the same concept.

Suggested canonical term:
Next exercise recommendation

[Same concept]
[Different concepts]
[Use another term]
```

---

## 7.4. Agent writing rules

A Kotta generált szövegeire és agent briefjeire kerüljön be néhány explicit szabály:

1. **Prefer known project terms.**
2. **Do not silently introduce synonyms for known concepts.**
3. **Define a necessary new technical term the first time it appears.**
4. **If a new term changes the conceptual model, surface it before making it canonical.**
5. **Prefer the user's established vocabulary when technical precision does not require otherwise.**

Példa kerülendő szövegre:

> The orchestration layer hydrates the ephemeral execution context from canonical control-plane state.

Jobb:

> Kotta assembles the information the coding agent needs before it starts. Internally this is called the execution context.

Az elsődleges cél az olvashatóság, nem a technikai jargon maximalizálása.

---

# 8. Terminológiai drift mint modellezési kockázat

A vocabulary layer nem pusztán UX-feature.

Ha a rendszerben párhuzamosan jelenik meg:

```text
Exercise
Drill
Practice
Routine
Task
```

akkor két lehetőség van:

1. ezek ugyanannak a fogalomnak a szinonimái;
2. külön fogalmak, amelyek jelentése nincs tisztázva.

Mindkettő veszélyes lehet.

A terminológiai drift idővel adatmodell- és architecture-driftté válhat.

A Kotta ezért jelezhesse:

```text
Possible terminology/model conflict

"Exercise" and "Drill" are used interchangeably in 3 contracts,
but the code contains separate Exercise and Drill types.

This may be intentional or may indicate domain-model drift.
```

Ez ne automatikus „hiba” legyen, hanem reviewable jelzés.

---

# 9. Provenance

A Kotta egyik alapelve továbbra is az legyen:

> **The repository keeps the shared truth.**

Ehhez a Shape-model állításainak visszavezethetőnek kell lenniük a forrásukra.

Nem szükséges mondatonként knowledge graphot építeni.

MVP-ben elég a section-level vagy item-level provenance.

Példa:

```text
Decision:
Progression is deterministic.

Sources:
- human message E-291
- existing principle D-018
```

Contractban:

```text
WHY DOES THIS EXIST?

Outcome
← Shape S-123
← human message E-291

Constraint: do not change measurement semantics
← D-018

Acceptance: existing users retain history
← human message E-304
```

A provenance célja:

- ne kelljen az agent memóriájára hagyatkozni;
- vissza lehessen nézni, honnan jött egy döntés;
- később lehessen challenge-elni vagy supersede-elni;
- a coding agent deterministic briefje megbízható inputból készüljön.

---

# 10. Durable decisions átalakítása

A jelenlegi decision modell jó alap:

```text
Decision
Context
Consequences
```

Érdemes kiegészíteni opcionális scope és provenance mezőkkel.

Javasolt backward-compatible forma:

```yaml
id: D-...
title: Progression is deterministic
date: 2026-08-07

scope:
  type: shape
  id: S-...

sources:
  - type: event
    ref: E-...
  - type: file
    ref: src/...

supersedes: []
```

Lehetséges scope-ok:

```text
principle
shape
contract
batch
```

### Principle

Cross-cutting, projektszintű szabály.

Például:

```text
Identity uses ULIDs.
```

### Entity-scoped decision

Egy konkrét Shape / contract / batch kapcsán meghozott döntés.

Ez illeszkedik ahhoz a már megjelent Kotta-gondolathoz, hogy:

- global decision → principle;
- entity-scoped decision → az adott entity mellett jelenik meg.

---

# 11. Semantic conflict detection

A Kotta jelenlegi determinisztikus contradiction-modelljét meg kell őrizni.

Fontos különbség:

```text
DETERMINISTIC CONTRADICTION
```

nem ugyanaz, mint:

```text
POSSIBLE SEMANTIC CONFLICT
```

Példa determinisztikus contradictionre:

- contract state és Git/worktree state nem egyezik;
- dangling reference;
- két canonical artifact strukturálisan ellentmond egymásnak.

Példa semantic conflictra:

```text
Earlier decision:
"Users may freely choose exercises."

New conversation:
"The system always chooses the next exercise."
```

Az LLM itt ne mondja ki automatikusan, hogy contradiction.

Helyette:

```text
POSSIBLE INTENT CONFLICT

D-021
"Users may freely choose exercises."

E-488
"The system always chooses the next exercise."

These may conflict.

[Different contexts]
[Replace old decision]
[Clarify]
```

A semantic conflict hypothesis legyen reviewable, ne canonical truth.

---

# 12. Shape → Contract compile

Amikor:

- nincs blocking unowned decision;
- nincs blocking terminology gap;
- a semantic conflictok dispositioned állapotban vannak;
- a releváns provenance rendelkezésre áll;

akkor a Shape „compile-olható” contractokra.

Példa:

```text
S-123 Guided practice

Candidate work:

T-A Domain model
T-B Progression engine
T-C Practice path UI

Decisions:
D-X progression is deterministic
D-Y users may repeat previous exercises

Delegated:
- local class boundaries
- internal naming following existing conventions
```

A compile eredménye:

```text
Shape
  │
  ├── D-X
  ├── D-Y
  │
  ├── T-A
  ├── T-B
  └── T-C
```

A usernek látnia kell, hogy:

- mi lesz egy contract;
- mi lesz több contract;
- milyen durable döntések keletkeznek;
- mi marad delegált implementation freedom.

A compile után a jelenlegi Kotta lifecycle lép életbe.

---

# 13. A jelenlegi Kotta-rendszerrel való kapcsolat

A meglévő execution modellt nem kell újratervezni.

A jelenlegi:

```text
contract
  ↓
sign
  ↓
batch
  ↓
claim
  ↓
branch/worktree
  ↓
execute
  ↓
submit review
  ↓
evidence
  ↓
human acceptance
  ↓
close
```

maradjon.

A Shape csak a contract előtti hiányzó kontrollréteg.

---

# 14. A meglévő shaping-vonal generalizálása

A repo-ban már létező shaping elképzelések jó alapot adnak:

- determinisztikus shape-plan;
- preview;
- plan hash;
- code-aware finding analysis;
- provenance;
- human correction;
- mutation előtti review.

Ezeket nem érdemes kidobni.

A javaslat:

### Jelenlegi mentális modell

```text
findings
   ↓
cluster
   ↓
tickets
```

### Új általános modell

```text
SOURCES
├── conversation
├── observations
├── existing contracts
├── durable decisions
├── principles
├── vocabulary
└── repository evidence
        ↓
      SHAPE
        ↓
 ┌──────┼────────┐
 ↓      ↓        ↓
decisions contracts observations
         │
         ↓
       batch?
```

Egyetlen shaping engine legyen.

Ne külön:

- finding shaping;
- conversation shaping;
- backlog shaping.

Mindegyik ugyanabba a Shape-modellbe tápláljon.

---

# 15. UI / interaction modell

## 15.1. A board maradjon read-only

A meglévő Kotta-alapelv jó:

- a board canonical state projection;
- a mutáció és approval a calling chatben történik;
- a UI nem válik második, divergáló control surface-szé.

Ezt a Shape esetében is meg kell tartani.

---

## 15.2. A shaping fő interaction surface-e a chat

Példa:

```text
You:
Kellene login után onboarding.

Kotta:
Megnéztem a jelenlegi auth/profile flow-t.

A célt értem, de maradt egy product decision:

Az onboarding kötelező egyszeri flow legyen,
vagy bármikor átugorható és később folytatható?

Ez befolyásolja a persistence-et és az existing-user migrációt.
```

A user válaszol.

Kotta frissíti a Shape-modellt.

---

## 15.3. Shape a boardon

A boardon egy Shape például így jelenhet meg:

```text
SHAPING

Guided practice

Goal                 ✓
Facts                8
Owned decisions      4
Delegated decisions  2
Decision gaps        1   ← WAITING ON YOU

Vocabulary terms     7
Terminology gaps     2

Possible conflicts   1

Sources
12 chat messages
4 repository files
2 principles

Candidate contracts
not compiled
```

---

## 15.4. Home / Waiting on you

A jelenlegi `Waiting on you` modellbe természetesen bekerülhet:

```text
3 shaping decisions waiting
2 terminology clarifications
2 contracts in review
1 observation awaiting disposition
```

Fontos:

- a „defined contract” továbbra se legyen debt;
- csak valódi human gate kerüljön a waiting queue-ba.

---

# 16. Javasolt CLI / skill surface

MVP:

```text
/shape
```

Létrehoz vagy folytat egy Shape-et.

---

```text
kotta shape show <shape-id>
```

Megmutatja:

- goal;
- known facts;
- decisions;
- delegations;
- gaps;
- terminology;
- sources;
- candidate contracts.

---

```text
kotta shape gaps <shape-id>
```

Megmutatja kizárólag a blocking gapeket.

Példa:

```text
S-123 is NOT READY TO COMPILE

2 unowned decisions

HIGH
What determines advancement to the next exercise?

MEDIUM
What happens to existing users without progression state?

1 terminology gap

"practice path" and "learning track" may refer to the same concept.
```

---

```text
kotta shape compile <shape-id>
```

Read-only preview:

- durable decisions to create;
- contracts to create;
- batch proposal;
- provenance;
- delegated decisions.

Az apply továbbra is explicit human approvalhoz kötött.

---

# 17. Agent brief változása

A coding agent deterministic briefje ne csak contractot tartalmazzon.

Tartalmazza a releváns közös nyelvet és döntési határokat is.

Példa:

```md
## Outcome

...

## Relevant project terms

Practice path
The ordered progression of exercises.

Mastery
The condition that unlocks progression.

## Owned decisions

- Progression is deterministic.
- Users may repeat previous exercises.

## Delegated decisions

- Choose internal class boundaries following current domain conventions.
- Choose local helper names.

## Do not decide

None.

## Scope

...

## Acceptance

...

## Verification

...
```

Így a coding agent számára világos:

- mit kell csinálnia;
- milyen szavakat használjon;
- mi eldöntött;
- miben van szabadsága;
- miben nincs.

---

# 18. Non-goals

Az első verzióban nem cél:

- teljes ontology engine;
- automatikus knowledge graph;
- minden mondat canonical tárolása;
- LLM által generált „truth” automatikus elfogadása;
- minden technikai döntés human approvalhoz kötése;
- generic project management;
- generic chat history manager;
- új coding agent;
- saját IDE;
- Jira/Linear replacement;
- semantic conflict automatikus feloldása;
- új execution engine.

A Shape a jelenlegi Kotta elé kerül, nem helyette.

---

# 19. MVP javaslat

## Phase 1 — Decision-aware shaping

Legkisebb értelmes vertikális slice:

```text
conversation
    ↓
Shape
    ↓
owned / delegated / unowned decisions
    ↓
blocking gap detection
    ↓
compile to existing contract
```

### Tartalom

- `S-` entity;
- `/shape` skill;
- Shape persistence;
- decision gap modell;
- owned / delegated / unowned státusz;
- `shape show`;
- `shape gaps`;
- egyszerű Shape → contract compile;
- provenance legalább conversation event szinten;
- board read-only Shape detail;
- Home `Waiting on you` integration.

### Sikerkritérium

A Kotta képes legyen egy természetes beszélgetésből úgy contractot készíteni, hogy a compile pillanatában nincs olyan releváns product/design/architecture döntés, amelyről nincs explicit módon eldöntve, hogy:

- human-owned;
- vagy agent-delegated.

---

## Phase 2 — Shared vocabulary

Hozzáadni:

- `.kotta/vocabulary.md`;
- preferred term;
- aliases;
- code name;
- avoid list;
- terminology gap detection;
- new-term introduction rule;
- relevant vocabulary injection a contract/agent briefbe.

### Sikerkritérium

Egy agent ne tudjon észrevétlenül alternatív doménterminológiát kialakítani a projektben.

---

## Phase 3 — Semantic consistency

Hozzáadni:

- possible intent conflicts;
- decision supersession;
- vocabulary/model conflicts;
- semantic review flow.

### Sikerkritérium

A rendszer észreveszi, ha egy új beszélgetés potenciálisan ütközik egy korábbi durable döntéssel vagy domain definícióval, de nem állítja automatikusan, hogy contradiction történt.

---

## Phase 4 — Generalized shaping engine

A már meglévő finding-shaping capabilityt átvezetni ugyanarra a Shape-modellre.

Inputok:

```text
conversation
observation(s)
existing contract
repository evidence
decision
principle
```

Outputok:

```text
0..N contracts
0..N decisions
0..N observations
0..1 batch proposal
```

---

# 20. Javasolt product principles

## P1 — Humans own intent

A Kotta nem talál ki hiányzó product intentet.

---

## P2 — Delegation must be explicit

Az agent kaphat nagy szabadságot, de ennek tudatos delegációnak kell lennie.

---

## P3 — Agents must not silently rename the domain

Új doménterminológia nem válhat canonical-lá észrevétlenül.

---

## P4 — Investigate before asking

A Kotta ne kérdezze meg azt, amit a repóból vagy a durable knowledge-ből meg tud állapítani.

---

## P5 — Ask about decisions, not missing prose

A Kotta ne „spec completeness”-t optimalizáljon, hanem olyan döntési pontokat keressen, amelyek materially megváltoztatják a rendszert.

---

## P6 — Semantic suspicion is not canonical contradiction

LLM által érzékelt konfliktus reviewable hypothesis.

---

## P7 — Contracts are compiled artifacts

A contract a tisztázott intent végrehajtható reprezentációja, nem a gondolkodási folyamat első artefaktja.

---

## P8 — Repository remains the shared truth

A Shape, decision, vocabulary, contract és evidence visszakereshető, durable és repository-native.

---

# 21. Pozicionálási következmény

A jelenlegi Kotta fő ereje:

> kontrollálja, hogyan hajtja végre az agent a definiált munkát.

A kibővített Kotta:

> **azt is kontrollálja, hogy mielőtt végrehajtja, ugyanazt érti-e a user és az agent azon, amit meg kell építeni.**

Lehetséges rövid pozicionálás:

> **Kotta makes sure you and your agents mean the same thing before they start coding.**

Kibővítve:

> Kotta finds the decisions hidden in your conversation, aligns the language you use, turns the result into bounded executable contracts, and keeps execution tied to evidence.

Alternatíva:

> **From messy conversation to verified implementation.**

Vagy:

> **Don't let the agent decide what you forgot to specify.**

---

# 22. A Kotta saját terminológiájának felülvizsgálata

A vocabulary feature előtt érdemes a Kotta saját user-facing nyelvét is auditálni.

Jelenlegi fogalmak többek között:

- observation;
- contract;
- batch;
- decision;
- principle;
- shape;
- claim;
- control plane;
- defined;
- execution context;
- worktree;
- evidence.

Nem biztos, hogy mindegyiknek user-facing first-class fogalomként kell megjelennie.

Javasolt audit-kérdések:

- Kell-e a usernek ismernie ezt a szót?
- Domain concept vagy implementation concept?
- Látható-e közvetlenül a UI-ban?
- Magyarázat nélkül érthető?
- Van-e két fogalom, amelyet össze lehet vonni?
- Van-e technikai fogalom, amelyet csak advanced/debug view-ban kellene mutatni?
- Használja-e ugyanazt a szót a CLI, a board, a docs és az agent?

A Kottának először saját magán kell alkalmaznia a szabályt:

> **ne használjon több és technikaibb terminológiát annál, mint amennyi a user mentális modelljéhez valóban szükséges.**

---

# 23. Röviden

A javasolt új Kotta nem egyszerűen „jobb spec generátor”.

A teljes modell:

```text
YOU TALK
   ↓
KOTTA INVESTIGATES
   ↓
KOTTA BUILDS A SHARED MODEL
   ↓
KOTTA FINDS:
   - missing decisions
   - undeclared delegation
   - terminology drift
   - possible semantic conflicts
   ↓
YOU OWN / DELEGATE / CLARIFY / NAME
   ↓
KOTTA COMPILES CONTRACTS
   ↓
AGENTS EXECUTE BOUNDED WORK
   ↓
KOTTA REQUIRES EVIDENCE
   ↓
YOU ACCEPT
```

A jelenlegi Kotta fő kérdése:

> **Hogyan hajtsa végre biztonságosan az agent azt, amit kértünk?**

A kibővített Kotta ehhez hozzáad egy korábbi, még fontosabb kérdést:

> **Valóban ugyanazt értjük-e azon, amit kértünk?**
