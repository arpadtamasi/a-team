---
id: T-083
title: >-
  A dinamika-átlag a csonkolt blokkot is beszámolja — a levágott eloszlás
  autoGain-műtermék
status: backlog
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: P-005
depends_on:
  - T-074
blocks: []
branch: null
pull_request: null
created_at: Mon Jul 20
updated_at: '2026-07-21'
---
# T-083 — A dinamika-átlag a csonkolt blokkot is beszámolja — a levágott eloszlás autoGain-műtermék

## Outcome

Az alulról csonkolt blokk **dinamika-pontja** sem termel műterméket: vagy kimarad a take

## Scope

Provizórikus: `apps/mcp/src/getTake.ts` (`takeEvaluation` dinamika-ága, esetleg `takeGain`),

## Non-goals

- A timing-oldali kizárás — az [O-73](O-73-nem-merheto-blokk-ne-kapjon-nullat.md) leszállította.

## Acceptance

- The outcome is observable: Az alulról csonkolt blokk **dinamika-pontja** sem termel műterméket: vagy kimarad a take

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-82; lane: scoring; legacy status: backlog.

## Open decisions

- Kizárás vagy gain-újraszámolás? A csonkolt blokk kihagyása a `takeGain` pooljából MÁS kérdés,

## Actual behaviour

Az [O-73](O-73-nem-merheto-blokk-ne-kapjon-nullat.md) a csonkolt blokkot **csak a timing-átlagból**

## Expected behaviour

Az alulról csonkolt blokk **dinamika-pontja** sem termel műterméket: vagy kimarad a take

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · scoring lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

Az [O-73](O-73-nem-merheto-blokk-ne-kapjon-nullat.md) a csonkolt blokkot **csak a timing-átlagból**

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-82-dinamika-a-csonkolt-blokkot-is-beszamolja.md. No product implementation or human ready approval is implied.
