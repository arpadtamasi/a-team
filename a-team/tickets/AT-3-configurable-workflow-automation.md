---
id: AT-3
title: Configure the A-Team workflow automation level
lane: null
type: feature
status: backlog
story_points:
created_at: 2026-07-19T20:40:23+02:00
ready_at:
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

`init-workspace` presents a small, explained set of recommended automation levels and lets the PO/PM choose how autonomously A-Team advances through its workflow, including a maximum-automation mode that can continue from refinement through sprint execution until the retrospective when no question or required human decision interrupts it.

## Why

The PO/PM should be able to choose how often they need to return during execution instead of manually prompting every lifecycle step.

## Known context

- The highest requested automation level starts the sprint after refinement, executes it, and returns control to the PO/PM at the retrospective when no question arises.
- The PO/PM wants A-Team to propose the other useful automation levels rather than requiring the user to design them.
- A-Team currently preserves explicit human approval gates for sprint commitment and accepted completion.
- [AT-1](AT-1-init-workspace-project-setup.md) introduces the initial PO/PM-guided configuration mechanism with only a ticket-prefix setting.

## Open questions

- Which small set of automation levels and trade-offs should A-Team recommend, and which one should be the default?
- Does choosing maximum automation constitute advance authorization for later sprint commitments and acceptance decisions, or must some approval gates remain interactive?
- What conditions require the workflow to stop and ask the PO/PM a question?
- Which lifecycle operations may advance automatically, and how does the workflow resume after an interruption?
- What exactly should be prepared when the PO/PM returns for the retrospective?

## Scope notes

- Provisional: persist an automation-level choice during `init-workspace` and make lifecycle orchestration obey it.
- Refinement should propose plain-language levels and their pause points for PO/PM approval instead of asking the PO/PM to invent the model.
- The maximum level should run unattended only while the approved work remains unambiguous and no question is required.

## Out of scope

None explicitly identified.

## Dependencies

Unknown.

## Refinement notes

Refinement must reconcile unattended execution with the PO/PM authority principle and may need to decompose configuration, orchestration, interruption/resume, and approval semantics into separate tickets.

Initial proposal for PO/PM discussion; these levels are not yet approved:

- **Guided:** pause before each material lifecycle transition and explain the proposed next action.
- **Guardrailed (recommended default):** require approval of the exact sprint commitment, then execute autonomously inside it; pause for product questions, blockers, acceptance, and the retrospective.
- **Autopilot:** after refinement, start and run the sprint through to the retrospective without further interaction unless a question, blocker, or policy boundary requires the PO/PM.
