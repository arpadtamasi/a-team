# A-Team workspace

This directory is the repository's canonical work record. Keep tickets and packages in the directory that represents their current lifecycle state; their frontmatter `status` must match that directory.

- `backlog/`, `ready/`, `active/`, `review/`, and `done/` contain tickets.
- `findings/new/` and `findings/resolved/` contain discovered work awaiting or following disposition.
- `packages/` contains coordinated groups of tickets, organized by lifecycle state.
- `profiles/` contains project-specific requirement profiles.
- `claims/` contains temporary execution locks. Do not edit or remove an active claim casually.
- `decisions/` contains durable human decisions.
- `index.md` is generated; do not edit it manually.

Repository files are canonical. Chat history, pull-request comments, and user interfaces are views of this state rather than independent sources of truth.
