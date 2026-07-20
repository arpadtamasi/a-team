---
name: board
description: This skill should be used when the user asks to "show the board", "open the PM view", "mutasd a boardot", "nyisd meg a PM-nézetet", or wants a live read-only kanban of the A-Team workspace. Starts a local server that renders tickets by lifecycle status with age-in-state from the event log, milestone/sprint strips, and lane/type filters. It never mutates workspace state.
compatibility: Requires Node.js 18+. Reads a-team/ (or legacy scrum/) workspace in the current repository.
---

# A-Team Board

Read-only PM surface: lifecycle columns, age-in-state from `events.jsonl`, milestone and
sprint strips, lane/type filters, search. The board shows not just where work is, but how
long it has been there — the one thing a plain kanban cannot derive without an append-only
event log.

## Package layout

Determine the package layout first. In the A-Team source repository, use root `METHOD.md`,
`schemas/...`, `skills/...`, `GSTACK.md`, `PROCESSES.md`, and `GLOSSARY.md` when relevant.
After installation, use their `.claude/skills/a-team/...` equivalents. Never prefer an
installed copy in the source repository.

## Start

```bash
node <package>/skills/board/serve.mjs   # cwd = consuming repo root
```

- Autodetects the workspace: `a-team/` first, legacy `scrum/` as fallback. Override with
  `--workspace <dir>`.
- Binds `127.0.0.1` only. Serves ONLY the board assets and `/api/state` (parsed JSON).
  Never serves the repo root, `.git`, or raw workspace files.
- Default port 4400; picks the next free port if taken. Prints the URL; open it for the
  user.

## What it shows

- Columns: `backlog · ready · in_progress · review · done` (plus `blocked / parked /
  rejected` only when non-empty).
- Per card: id, title, story points, type, lane, container (milestone or sprint), and
  **age in current state** derived from the last lifecycle event. Ready/review cards
  highlight after 12h, alarm after 2 days; backlog after 7/14 days.
- Column headers show the median age-in-state.
- Milestone/sprint strip: active containers as clickable filters.

## Rules

- **Read-only.** The board never writes workspace files and never invokes operations.
  State changes go through the owning skills; a board edit path would reintroduce
  honor-system state editing.
- The server-side parser is tolerant: tickets with missing fields render with what exists.
  Parsing never fabricates values.
