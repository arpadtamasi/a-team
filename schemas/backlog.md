# Backlog contract

`a-team/backlog.md` is the ordered current-work inventory and the only canonical priority
surface. Ticket files own detailed contracts and lifecycle fields; the backlog mirrors only
the compact state needed to scan and select work.

## Minimal initialized form

An initialized workspace with no captured tickets uses exactly:

```markdown
# Backlog

## Backlog

None.
```

The initial `Backlog` section is a neutral priority section, not the `backlog` lifecycle
state. Repositories may later adopt additional priority sections such as `Now`, `Next`, or
`Later`, but section names and order express priority only unless the repository explicitly
defines another convention.

Do not create `a-team/sprint.md` during backlog initialization. Its absence means no active
sprint when no unmatched `sprint_started` event exists.

## Compact ticket entries

Each captured ticket appears exactly once as a Markdown list item under one priority
section. Preserve the repository's established syntax after the first ticket, while keeping
these facts available:

- linked ticket ID and title;
- lifecycle state;
- type;
- story points or the repository's unset marker;
- known dependencies;
- one-line outcome or faithful capture summary.

Priority section and lifecycle state are distinct. Moving an entry changes priority, not
ticket state. Changing ticket state does not silently reprioritize it. Operations that own a
lifecycle transition update the compact state in place unless a separately approved board
convention defines section movement.

Remove the `None.` marker when adding the first entry to a section. Restore it when a section
becomes empty. Never treat headings, prose, or a duplicated entry as a substitute for the
canonical ticket file.

## Invariants

- Keep every ticket ID unique and linked to one file under `a-team/tickets/`.
- Keep backlog state consistent with ticket frontmatter.
- Preserve ordering unless an explicit priority decision or dependency constraint requires
  a change.
- Do not place sprint commitment, detailed acceptance criteria, evidence, session history,
  token totals, or full ticket bodies in the compact entry.
- Do not infer readiness, completion, priority, or sprint membership from section placement.
- Treat a missing `a-team/backlog.md`, missing `a-team/tickets/`, or malformed duplicate entry
  as an infrastructure or consistency problem, not permission to invent alternate state.
