---
id: T-108
title: >-
  Nem látszik, mit kérnek a tesztelők a coachtól — az MCP tool-napló féloldalas
  és olvasó nélküli
status: backlog
origin: imported
types:
  - feature
profiles: []
priority: medium
risk: medium
package: P-002
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Tue Jul 21
updated_at: '2026-07-21'
---
# T-108 — Nem látszik, mit kérnek a tesztelők a coachtól — az MCP tool-napló féloldalas és olvasó nélküli

## Outcome

rp meg tudja nézni, mit kértek a tesztelők a coachtól, és a coach mit akart elérni a válaszul

## Scope

1. **`user_request` + `intent` opcionális mező** a tool-sémákban

## Non-goals

- A tesztelő claude.ai-beli chat-üzenetének nyers megszerzése — architekturálisan nem elérhető.

## Acceptance

1. A `handleTool` minden ága naplóz (a `guide` kivételével), a hívás kimenetelével együtt —

## Verification

### Automated

## Constraints

Migrated from O-107; lane: connector; legacy status: ready.

## Open decisions

None.



## Execution notes

Migration preview only. Source: scrum/tickets/O-107-mcp-tool-hivas-naplo-teljes-lathatosag.md. No product implementation or human ready approval is implied.
