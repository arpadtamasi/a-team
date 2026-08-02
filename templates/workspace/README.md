# Kotta workspace

This directory is the repository's canonical work record. Keep contracts and batches in the directory that represents their current lifecycle state; their frontmatter `status` must match that directory.

- `backlog/`, `defined/`, `active/`, `review/`, and `done/` contain contracts.
- `observations/new/` and `observations/resolved/` contain discovered work awaiting or following disposition.
- `batches/` contains coordinated groups of contracts, organized by lifecycle state.
- `profiles/` contains project-specific requirement profiles.
- `claims/` contains temporary execution locks. Do not edit or remove an active claim casually.
- `decisions/` contains durable human decisions. Create them with
  `kotta decision create --from <draft.md> --approve`; do not edit canonical records directly.
- `index.md` is generated; do not edit it manually.

Repository files are canonical. Chat history, pull-request comments, and user interfaces are views of this state rather than independent sources of truth.

A decision draft uses `title` frontmatter and non-empty `Decision`, `Context`, and
`Consequences` sections. The CLI assigns a stable `D-001`-style identifier and date,
validates the draft, and publishes it atomically to the identity-only filename (`D-001.md`).
