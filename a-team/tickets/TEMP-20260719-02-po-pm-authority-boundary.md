---
id: TEMP-20260719-02
title: Make PO/PM authority the enforceable anti-invention principle
lane: null
type: feature
status: ready
story_points: 5
created_at: 2026-07-19T19:28:09+02:00
ready_at: 2026-07-19T20:18:52+02:00
started_at:
review_at:
done_at:
sprint:
branch:
blocked_periods: []
metrics:
  work_sessions: []
---

## Outcome

A-Team consistently keeps product authority with the user as PO/PM while allowing the AI team to investigate, propose, and execute reversible technical decisions inside an explicitly approved work contract.

## Why

The central difficulty in AI development is that an AI may fill missing intent with its own assumptions and silently turn a proposal into a decision or authorization. A-Team's Scrum model should prevent that failure without reducing the AI to asking permission for every implementation detail.

## Scope

- Define one canonical responsibility split in `METHOD.md`:
  - the PO/PM owns desired product outcome and reason, priority, exact sprint commitment, material requirements and scope, product trade-offs, disposition, acceptance of the delivered result, and method-level product decisions;
  - the AI team owns repository investigation, proposal drafting, relative estimation, decomposition proposals, reversible technical design and implementation choices inside the approved contract, execution, verification, and evidence-backed review findings.
- Define the uncertainty rule: when missing information could materially change product outcome, priority, scope, acceptance, authorization, or irreversible architecture, the AI presents a proposal or focused question and does not silently decide; ordinary reversible implementation choices inside scope proceed without a new PO/PM gate.
- Make capture preserve unclear intent without authorizing implementation or priority.
- Make refinement translate plain language into a proposed contract while leaving material product decisions with the PO/PM.
- Keep exact sprint commitment and material post-readiness scope changes behind explicit PO/PM approval.
- Keep implementation autonomous inside the approved ticket, while found work is captured separately rather than silently added.
- Make review independently judge evidence and closure eligibility, but require explicit PO/PM acceptance before `close-ticket` records delivered work; unresolved permitted trade-offs also require explicit PO/PM disposition.
- Keep parking, rejection, durable process changes, and exceptional history correction behind their existing explicit decision gates.
- Add a compact lifecycle authority matrix to the human-readable process documentation and apply the same plain-language rule to the router, glossary, public documentation, AGENTS template, and affected operational skills.
- Run a bounded cross-lifecycle audit of every operation and update only those whose current wording permits an AI-owned product decision or obscures an existing PO/PM gate.

## Out of scope

- Requiring PO/PM approval for every command, file edit, reversible technical choice, verification step, or review finding inside an approved ticket.
- Making the PO/PM perform technical investigation, estimation, implementation, or independent review.
- Adding organizational roles, permissions, accounts, or an access-control system.
- Changing ticket states, event names, metrics formulas, sprint length, or Git authorization rules except where wording must expose the approved authority boundary.
- Treating GitHub issues, external workflow results, or captured findings as PO/PM authorization.

## Acceptance criteria

1. One canonical responsibility section names the user as PO/PM, the AI as the delivery team, and assigns every product and execution responsibility listed in scope to exactly one side.
2. A vague request can be captured without invented scope or authorization, and refinement asks only for material missing product decisions after inspecting available evidence.
3. A proposed estimate, decomposition, sprint, scope change, trade-off, disposition, or method change remains a proposal until the owning PO/PM gate is explicitly satisfied.
4. Inside an approved ticket, the AI may choose and execute reversible technical details without requesting redundant product approval, provided it stays within scope and repository authorization.
5. Concrete found work receives a separate ticket and does not change the running contract, priority, or sprint commitment automatically.
6. Review supplies an independent evidence-based eligibility judgment but cannot itself accept or close the product result; `close-ticket` requires identifiable explicit PO/PM acceptance and preserves unresolved finding decisions.
7. Missing or unavailable interaction mechanisms never become permission to auto-decide a PO/PM-owned choice.
8. The method, process matrix, router, glossary, AGENTS template, public documentation, and every affected operation use the same authority boundary without adding a second lifecycle owner.
9. External expert workflows and GitHub issues remain inputs or evidence and cannot acquire priority, commitment, acceptance, or transition authority.

## Verification

### Automated

- `git diff --check`
- Parse all changed skill frontmatter and validate every changed local Markdown link.
- Search the complete package for lifecycle approval language and require every PO/PM-owned decision named in scope to resolve to one documented owning gate.

### Manual

- Walk a scenario matrix covering: vague feature capture; refinement with a missing product choice; sprint proposal without approval; reversible technical choice inside scope; material scope expansion; found work during implementation; review with no findings; review with an unresolved important trade-off; closure without PO/PM acceptance; and unavailable external question tooling.
- For each scenario, record whether the AI may proceed, must propose or ask, or must refuse, and cross-check the result against the canonical responsibility split.

### Documentation

- Cross-check `METHOD.md`, `PROCESSES.md`, `GSTACK.md`, `GLOSSARY.md`, `AGENTS.md`, the router, `README.md`, and every affected operational skill for identical PO/PM and AI-team meanings.

## Dependencies

TEMP-20260719-01 must expose the current source package through the local adapter before this repository dogfoods the authority scenarios.

## Context

- The user identified this responsibility split as A-Team's core product principle on 2026-07-19 and explicitly approved the refined boundary.
- Existing artifacts already contain separate human gates and prohibitions against invented decisions; this ticket makes them one coherent, testable product model.
- AT-1 is an example of the model: `init-workspace` asks the PO/PM for the permanent prefix, then the AI executes the approved initialization details.

## Result

## Refinement notes

Estimated at 5 points: the principle and boundaries are resolved, but enforcement requires a controlled audit across the complete lifecycle, coordinated updates to several source-of-truth layers, and adversarial scenario verification.
