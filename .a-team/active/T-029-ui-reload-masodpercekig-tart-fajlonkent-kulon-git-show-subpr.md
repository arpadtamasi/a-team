---
id: T-029
title: >-
  UI reload masodpercekig tart — fajlonkent kulon git show subprocess, cache
  nelkul
status: active
origin: finding
types:
  - feature
profiles: []
priority: medium
risk: medium
package: null
depends_on: []
blocks: []
branch: feat/T-029-ui-reload-masodpercekig-tart-fajlonkent-kulon-git-show-subpr
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_finding: F-029
assigned_agent: claude
---
# T-029 — Hotfix: a UI workspace-olvasása batch-elt és cache-elt legyen

## Outcome

A UI reload nagy workspace-en (200+ entitás) is egy másodpercen belül fut. A base refről olvasás nem fájlonkénti `git show` subprocess, hanem egyetlen batch-hívás, és két commit között cache-ből megy.

## Context

F-029: a `readMdFromRef` minden entitás-fájlt külön `git show ref:path` spawnSync-kel olvas — a oneandánál 230+ blokkoló subprocess reloadonként, másodpercekig. Az operátor megerősítette élő használatban. Hotfix: a viselkedés (mit olvasunk, honnan) NEM változik, csak a hogyan.

## Scope

- A base ref alatti `.a-team/` fájlok tartalmát EGY subprocess adja: `git cat-file --batch` a `git ls-tree -r` kimenetére fűzve (vagy egyetlen `git archive` kibontás memóriába).
- Cache a base ref commit-hashére kulcsolva: reload előtt egy `git rev-parse <base>` — ha a hash azonos, a ref-oldali tartalom memóriából jön; a working-tree-s részek (claims, diagnostics, nem-committed állapot) továbbra is frissen olvasódnak.
- A meglévő olvasási szemantika (mikor olvasunk refről vs. working tree-ből) változatlan — az F-028 olvasási-szabály kérdése NEM ennek a ticketnek a tárgya.

## Non-goals

- Semmi új szemantika, semmi UI-változás — csak teljesítmény.
- Az F-028 (állapot-széttartás, olvasási szabály) külön, tervezett munka.

## Acceptance

1. Egy 200+ entitásos szintetikus workspace-en a workspace-adat összeállítása legfeljebb 2 git-subprocess-t indít (rev-parse + batch), nem fájlonként egyet — teszt bizonyítja (subprocess-számlálással vagy a hívási út egységtesztjével).
2. Azonos base-hash mellett a második összeállítás nem indít batch-olvasást (cache-találat) — teszt bizonyítja.
3. Új commit a base refen érvényteleníti a cache-t — teszt bizonyítja.
4. A meglévő ui-data tesztek változatlanul zöldek (szemantika nem változott).

## Constraints

- A cache folyamaton belüli memória — nincs lemez-cache, nincs invalidálási démon.
- A `maxBuffer` marad bőséges; a batch-olvasás hibája fájlonkénti fallbackre eshet vissza, hangos figyelmeztetéssel.

## Execution notes

A `git ls-tree -r --format` adja a blob hasheket; a `cat-file --batch` stdin-jére hash-listát tolva egy menetben jön minden tartalom. A parse-réteg (gray-matter) érintetlen.

## Verification

`npm run build:cli` zöld; `npx vitest run` teljes készlet zöld; kézi füstteszt: `a-team ui` a saját repón, reload-idő érzékelhetően csökken.

## Open decisions

None.
