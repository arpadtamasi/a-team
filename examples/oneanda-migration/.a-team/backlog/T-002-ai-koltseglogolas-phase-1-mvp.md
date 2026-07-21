---
id: T-002
title: AI-költséglogolás — Phase-1 MVP
status: backlog
origin: imported
types:
  - feature
profiles: []
priority: high
risk: medium
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Fri Jul 17
updated_at: '2026-07-21'
---
# T-002 — AI-költséglogolás — Phase-1 MVP

## Outcome

A `logUsage` és a `users/{uid}/usageEvents` rögzíti az LLM-ajánló (és bármely más LLM) hívásait,

## Scope

Részlet: [docs/COST-LOGGING.md](../../docs/COST-LOGGING.md).

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

- The outcome is observable: A `logUsage` és a `users/{uid}/usageEvents` rögzíti az LLM-ajánló (és bármely más LLM) hívásait,

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-3; lane: test-code; legacy status: backlog.

## Open decisions

None.



## Execution notes

Migration preview only. Source: scrum/tickets/O-3-ai-koltseglogolas-phase1.md. No product implementation or human ready approval is implied.
