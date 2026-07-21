---
name: validate-finding
description: Investigate and disposition an A-Team finding without silently turning it into scheduled work. Use when a user asks to validate, triage, deduplicate, resolve, or convert an agent- or human-discovered finding.
---

# Validate a finding

Treat a finding as evidence awaiting disposition, not as a ticket. Use the `a-team` CLI for all finding mutations.

1. Read the finding and inspect the cited files, tests, logs, or reproduction.
2. Search new and resolved findings, tickets, and decisions for outcome-equivalent duplicates or related work.
3. State the concrete observation separately from predicted impact. Calibrate confidence and severity to the available evidence.
4. Recommend the smallest suitable disposition: create ticket, attach to existing ticket, investigate, accept risk, reject, or merge duplicate.
5. Run `a-team finding validate <finding-id>` and present its result.
6. Obtain the required human decision before creating scheduled work or accepting a trade-off.
7. Finalize with `a-team finding resolve <finding-id> --disposition <disposition>` and any command-required references.

Never silently expand the ticket during which the issue was discovered. A created ticket begins in backlog unless an explicit, separately validated ready transition is authorized.
