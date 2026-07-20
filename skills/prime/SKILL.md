---
name: prime
description: This skill should be used at session start or when an agent needs A-Team workflow context cheaply — "prime the session", "mi az állás röviden", "load a-team context". Prints ~60 lines of current state (statuses, sprint/milestones, in-progress, review queue, ready order, last events) plus the non-negotiable rules, instead of reading the full method documentation. Read-only.
compatibility: Requires Python 3. Reads a-team/ (or legacy scrum/) workspace in the current repository.
---

# A-Team Prime

Compact session context. Replaces reading METHOD.md + PROCESSES.md + schemas (~800 lines)
for routine work turns; ~60 lines cover state and the rules that must never be violated.

## Package layout

Determine the package layout first. In the A-Team source repository, use root `METHOD.md`,
`schemas/...`, `skills/...`, `GSTACK.md`, `PROCESSES.md`, and `GLOSSARY.md` when relevant.
After installation, use their `.claude/skills/a-team/...` equivalents. Never prefer an
installed copy in the source repository.

## Run

```bash
python3 <package>/skills/prime/prime.py    # cwd = consuming repo root
```

Output: state counts, active sprint/milestones, in-progress + review + blocked + ready
queues with age, last events, the human-gate list, and the operation roster.

## Rules

- Prime is a **summary, not authority**. On any conflict, METHOD.md, the schemas, and the
  owning skill win. Prime never substitutes for reading the owning skill before executing
  an operation.
- Read-only; never mutates workspace state.
- Use at session start, after compaction, or before picking work. For full detail the
  agent still opens the method files.
