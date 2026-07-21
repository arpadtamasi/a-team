---
id: T-023
title: Opcionális marketing-email rendszer
status: backlog
origin: imported
types:
  - operations
profiles:
  - workflow
priority: medium
risk: medium
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Fri Jul 17
updated_at: '2026-07-21'
---
# T-023 — Opcionális marketing-email rendszer

## Outcome

Ha később marketing/„beta updates” indul, az szétválik a kért szolgáltatáshoz tartozó béta-meghívástól. A marketing checkbox nem kötelező és nem előre bejelölt; a consent szövegének verziója, ideje és forrása mentve van. Minden marketing emailben azonosítható feladó és egykattintásos, ingyenes leiratkozás szerepel; a leiratkozást suppression list védi. A teljes végrehajtási runbook: [docs/EMAIL-OPS.md](../../docs/EMAIL-OPS.md). A dokumentum merge-elése nem teljesítés: a küldő kiválasztása, DPA-/al-adatfeldolgozó-ellenőrzése, Privacy-frissítés, domain-hitelesítés, leiratkozás és suppression-szinkron tényleges beállítása is ennek a TODO-nak a része.

## Scope

2026-07-13 tulajdonosi döntés: launchkor nincs marketing; a külön, opcionális marketing checkbox marad, de ez nem beta/landing blocker. A választott szolgáltató az SMTP2GO Free csomag, viszont a fiók/DPA/al-adatfeldolgozók, DNS-hitelesítés, webhook és helyi suppression-integráció még nincs kész. Marketingküldés előtt a [docs/EMAIL-OPS.md](../../docs/EMAIL-OPS.md) teljes aktiválási kapuját le kell zárni. 2026-07-13: Now-ból Later alá mozgatva, mert a béta-meghívó és a waitlist nem marketing-email rendszer függvénye.

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-23; lane: gtm; legacy status: backlog.

## Open decisions

None.

## Actors

Player, coach, operator, and the responsible delivery agent where applicable.

## Initial state

A launch döntése szerint nincs marketing; a jelentkező csak a kért béta-meghívót kaphatja. Egy későbbi általános update közvetlen marketing lehet, amihez külön, bizonyítható előzetes hozzájárulás és működő leiratkozás kell.

## States

Use only the states already present in the product and this ticket contract.

## Transitions

Ha később marketing/„beta updates” indul, az szétválik a kért szolgáltatáshoz tartozó béta-meghívástól. A marketing checkbox nem kötelező és nem előre bejelölt; a consent szövegének verziója, ideje és forrása mentve van. Minden marketing emailben azonosítható feladó és egykattintásos, ingyenes leiratkozás szerepel; a leiratkozást suppression list védi. A teljes végrehajtási runbook: [docs/EMAIL-OPS.md](../../docs/EMAIL-OPS.md). A dokumentum merge-elése nem teljesítés: a küldő kiválasztása, DPA-/al-adatfeldolgozó-ellenőrzése, Privacy-frissítés, domain-hitelesítés, leiratkozás és suppression-szinkron tényleges beállítása is ennek a TODO-nak a része.

## Triggers

The user or operational action described by the source contract.

## Permissions

Preserve existing authorization and privacy boundaries.

## Error paths

Failures remain visible and retryable without silent partial completion.

## Cancellation path

Cancellation leaves canonical repository and product state valid.

## Retry and duplicate-action behaviour

Retries are idempotent or explicitly rejected.

## Audit and notification expectations

Record material state changes; notify only the actor who can respond.



## Execution notes

Migration preview only. Source: scrum/tickets/O-23-opcionalis-marketing-email.md. No product implementation or human ready approval is implied.
