---
name: explore-workspace
description: This skill should be used when the user asks "what needs my decision?", "find related work", "where else is this topic?", "find overlaps or duplicates", "explain the backlog", or asks about a theme across A-Team tickets, findings, packages, decisions, and migration history.
---

# Explore an A-Team workspace

Perform read-only portfolio analysis over the repository's canonical `.a-team/` workspace. Treat the conversation as the interface: answer the user's actual question instead of proposing a separate dashboard or stopping after an inspection plan.

1. Locate the repository root and `.a-team/config.yaml`. Read `.a-team/index.md` for orientation, then inspect the relevant canonical files rather than relying on the index summary alone.
2. Search every lifecycle directory under `.a-team/` for tickets, findings, and packages. Read `.a-team/decisions/` to distinguish durable human decisions from still-open decision sections. Include resolved history when it can explain a decision, duplicate, supersession, or dependency.
3. Inspect `.a-team/migration.json` when present. Follow `source_file`, legacy identifiers, split records, and excluded-terminal records when current files do not contain enough evidence.
4. Compare outcome, scope, evidence, lifecycle state, dependencies, decisions, and package membership. Never infer a relationship from title similarity alone.
5. Separate results into the smallest useful groups, such as direct matches, dependencies, overlap or duplicate candidates, adjacent context, resolved history, and items needing a human decision. Omit empty groups.
6. Render every reported canonical entity as a Markdown link with its exact identifier, such as `[O-97](.a-team/backlog/O-97-example.md)`. Link the entity's current canonical file; for migration-only history, link the validated `source_file` when available.
7. Distinguish observed facts from interpretation. Explain the concrete reason for every non-obvious relationship and call out uncertainty.
8. Return the substantive answer as concise GitHub-Flavored Markdown. Use tables only when comparing repeated fields across several items; otherwise prefer short prose and lists.

Remain read-only. Do not create tickets or findings, edit priority, reshape packages, or perform lifecycle transitions. End with optional next actions only when they are useful, and make clear that each requires an explicit human request.

## Common requests

- For "find related work for `<id>`", start from the named entity, then search tickets, findings, packages, dependencies, migration metadata, and resolved history for shared evidence or outcome.
- For "where else is `<topic>`?", search both prose and metadata, including synonyms and likely domain terms; report ticket and finding matches together.
- For "find overlaps or duplicates", require outcome-equivalent or evidence-linked work and distinguish true duplicates from adjacent scope.
- For "what needs my decision?", compare ticket open-decision sections with durable records under `.a-team/decisions/`, then prioritize genuinely unresolved choices, blocked work, unresolved findings, review items, and backlog items whose progress depends on human intent.
- For "explain the backlog", cluster by outcome or decision seam, identify unpackaged work, and flag clusters whose package structure is misleading or absent.
