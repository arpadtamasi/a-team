---
name: define-contract
description: Turn a raw request or backlog item into a concise, evidence-grounded Kotta contract. Use when a user asks to define, refine, clarify, create, update, or sign a Kotta contract off for execution.
---

# Define a contract

Investigate before asking the human. Use the `kotta` CLI for every contract creation or lifecycle mutation; do not move or rewrite canonical contract files directly.

1. Inspect relevant repository code, documentation, existing contracts, batches, observations, profiles, and decisions.
2. Separate observed facts from missing product intent. Ask only focused questions whose answers cannot be discovered locally.
3. Propose the smallest independently executable outcome, bounded scope, non-goals, constraints, acceptance conditions, and a verification method for each condition.
4. Select every applicable type and profile. Satisfy the union of their required sections; do not force unlike work through a generic definition.
5. Record unresolved human choices under open decisions. Never invent intent or trade-offs.
   When a human resolves a choice and asks to retain it durably, use `kotta decision create --from <draft.md> --approve` instead of editing `.kotta/decisions/`.
6. Create the item with `kotta contract new`, write the investigated definition to a temporary Markdown file, then apply it with `kotta contract define <contract-id> --from <file>`. Keep incomplete work in backlog.
7. Run `kotta contract validate <contract-id>` and `kotta validate`.
8. Only after the definition is complete and required human approval is present, run `kotta contract sign <contract-id>`.

A defined contract must have an explicit outcome, bounded scope, acceptance and verification, all active-profile requirements, no blocking open decision, and a valid dependency order.
