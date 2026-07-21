---
id: T-053
title: a-team — a scrum-metódus kiemelése publikus GitHub-repóba
status: done
origin: imported
types:
  - decision
profiles:
  - discovery
priority: medium
risk: medium
package: null
depends_on:
  - T-048
  - T-049
  - T-050
blocks: []
branch: null
pull_request: null
created_at: Sat Jul 18
updated_at: '2026-07-21'
resolution: completed
---
# T-053 — a-team — a scrum-metódus kiemelése publikus GitHub-repóba

## Outcome

Döntés születik arról, hogy a `.claude/skills/scrum/` metódus-csomag önálló, publikus GitHub-projektként jelenjen-e meg „a-team" (agent team) néven — és ha igen, milyen csomagolásban; a döntés után a kiemelés végrehajtható.

## Scope

Provizórikus: a kiemelés maga (repo létrehozás, README, licenc, migráció) csak a döntés után, külön munkaként.

## Non-goals

None explicitly identified.

## Acceptance

- The outcome is observable: Döntés születik arról, hogy a `.claude/skills/scrum/` metódus-csomag önálló, publikus GitHub-projektként jelenjen-e meg „a-team" (agent team) néven — és ha igen, milyen csomagolásban; a döntés után a kiemelés végrehajtható.

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-52; lane: cross-cutting; legacy status: done.

## Open decisions

- Végleges név: a-team? (névfoglalás/ütközés ellenőrizendő GitHubon)

## Decision to be supported

Döntés születik arról, hogy a `.claude/skills/scrum/` metódus-csomag önálló, publikus GitHub-projektként jelenjen-e meg „a-team" (agent team) néven — és ha igen, milyen csomagolásban; a döntés után a kiemelés végrehajtható.

## Research question

A metódus tudatosan lett önhordóvá és projekt-függetlenné választva (kód a `.claude/skills/scrum/` alatt, adat a `scrum/`-ban), és már két élesben járatott fogyasztója van (mi-iranytu, oneanda). A PO megfogalmazása: „ez tkp egy fejlesztőcsapat" — a publikus név ezért a-team. A publikálás értelmet adna a névnek, és megszüntetné a két repo közti metódus-fork driftjét is (közös upstream).

## Hypotheses

The source contract contains the current evidence and competing explanations.

## Method

Inspect repository evidence, run the smallest representative measurement, and record uncertainty.

## Time or depth limit

Stop when the stated decision can be made with explicit confidence.

## Expected output

A decision-ready evidence note and the smallest follow-up ticket set.

## Decision criterion

The product owner can choose without inventing missing evidence.



## Review evidence

**A DÖNTÉS MEGSZÜLETETT 2026-07-19T14:11:40+02:00.** Ennek a ticketnek a kimenete maga a döntés volt („Döntés születik

## Execution notes

Migration preview only. Source: scrum/tickets/O-52-a-team-metodus-publikalas.md. No product implementation or human ready approval is implied.
