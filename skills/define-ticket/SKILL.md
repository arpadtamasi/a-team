---
name: define-ticket
description: Turn a raw request or backlog item into a concise, evidence-grounded A-Team ticket. Use when a user asks to define, refine, clarify, create, update, or make an A-Team ticket ready for execution.
---

# Define a ticket

Investigate before asking the human. Use the `a-team` CLI for every ticket creation or lifecycle mutation; do not move or rewrite canonical ticket files directly.

1. Inspect relevant repository code, documentation, existing tickets, packages, findings, profiles, and decisions.
2. Separate observed facts from missing product intent. Ask only focused questions whose answers cannot be discovered locally.
3. Propose the smallest independently executable outcome, bounded scope, non-goals, constraints, acceptance conditions, and a verification method for each condition.
4. Select every applicable type and profile. Satisfy the union of their required sections; do not force unlike work through a generic definition.
5. Record unresolved human choices under open decisions. Never invent intent or trade-offs.
6. Create the item with `a-team ticket new` or use the CLI's supported ticket update operation. Keep incomplete work in backlog.
7. Run `a-team ticket validate <ticket-id>`.
8. Only after the definition is complete and required human approval is present, run `a-team ticket ready <ticket-id>`.

A ready ticket must have an explicit outcome, bounded scope, acceptance and verification, all active-profile requirements, no blocking open decision, and a valid dependency order.
