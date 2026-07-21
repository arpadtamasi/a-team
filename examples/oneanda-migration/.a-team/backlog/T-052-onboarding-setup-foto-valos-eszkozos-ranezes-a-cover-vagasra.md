---
id: T-052
title: Onboarding setup-fotó — valós eszközös ránézés a cover-vágásra
status: backlog
origin: imported
types:
  - other
profiles: []
priority: medium
risk: medium
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Sat Jul 18
updated_at: '2026-07-21'
---
# T-052 — Onboarding setup-fotó — valós eszközös ránézés a cover-vágásra

## Outcome

Valós eszközön ellenőrizve, hogy az onboarding „Set up in seconds" lapján az új setup-fotó `cover`-vágása jól ül a 260px-keretben; eltérés esetén a vágás igazítva.

## Scope

Forrás: a befagyasztott TODOS.md Done-szakaszának „Az onboardingból hiányzik a beállítás-fotó" bejegyzése (2026-07-17) + a 2026-07-18-i pre-landing review lelete (PR #61). Érintett: `app/lib/screens/onboarding_screen.dart`, `app/assets/onboarding-setup.jpg`. Eszköz-hozzáférés (rp iPhone) szükséges.

## Non-goals

None explicitly identified.

## Acceptance

- The outcome is observable: Valós eszközön ellenőrizve, hogy az onboarding „Set up in seconds" lapján az új setup-fotó `cover`-vágása jól ül a 260px-keretben; eltérés esetén a vágás igazítva.

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-51; lane: app; legacy status: backlog.

## Open decisions

None.



## Execution notes

Migration preview only. Source: scrum/tickets/O-51-onboarding-foto-eszkozos-ranezes.md. No product implementation or human ready approval is implied.
