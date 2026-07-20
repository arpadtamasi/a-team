# Prompt: decompose a goal into an A-Team goal tree

Paste everything below the line into a fresh Claude Code session opened in
`/Users/rp/Dev/progos/a-team`. It produces `docs/experiments/goal-tree/M-1.tree.json`.

To decompose a different goal, change the two lines marked **INPUT**.

---

You are decomposing one goal into a goal tree for the A-Team method. This is a design
task. **Write no implementation code and change no workspace state** — your only output is
one JSON file plus a short report.

## INPUT

- Goal to decompose: **M-1**, defined in `a-team/milestones/M-1-pm-surface.md`
- Write the tree to: `docs/experiments/goal-tree/M-1.tree.json`

## The model

There is one primitive: **the goal**. A milestone is a goal. A ticket is a goal. A
code-level task is a goal. They differ in *altitude*, not in kind. Every goal has an
outcome and acceptance criteria. You decompose recursively until the leaves are reachable.

Three rules carry the whole model:

**1. A goal is a leaf when you can name a check for every one of its criteria.**
Not "when it feels small". A check is one of:

| type | what decides it |
|---|---|
| `command` | a command runs; its exit code or output decides |
| `ui` | a named element or state is observed on a named screen |
| `process` | a named flow is run end to end |
| `measurement` | a stated number crosses a stated threshold |
| `undecidable` | you cannot name a check yet — forces `leaf: false` |

`check.how` must be runnable or observable as written. `curl -s -o /dev/null -w '%{http_code}'
http://127.0.0.1:4403/serve.mjs` is a check. "verify the server is secure" is not.
If you catch yourself writing *works*, *correct*, *properly*, *megfelelő*, you are naming a
judgement instead of an observation — decompose instead.

**2. An unresolved decision is not a question; it is a child goal.**
If the work needs a choice the parent goal does not settle (runtime, data source, format,
naming, threshold), do not leave it implicit and do not plan to ask mid-flight. Make it a
node: *"the server runtime is chosen and recorded in SKILL.md — criterion: zero
dependencies, runs on a stock macOS install."* Then set `owner`:

- `agent` — the agent may settle it alone, because the criteria constrain it enough
- `human` — the PO/PM must settle it; the agent may not choose

`owner: human` nodes are the control surface. Be honest and sparing with them: every one is
an interruption the PO/PM has to pay for. Reserve them for choices that are hard to reverse,
change an external interface, commit to a dependency, or are pure taste.

**3. Every level keeps its own criteria, including non-leaves.**
A parent's criteria are the integration check: the thing that can still be false when all
its children are green. If a parent's only criterion is "all children done", you have not
written a criterion — find the observable claim that decomposition does not guarantee.

## Ids

Dotted paths that mirror position: `M-1`, `M-1.1`, `M-1.1.2`. Store nodes flat with
`parent` pointers (the file must diff cleanly in git). A node with exactly one child is a
smell: either merge it upward or you have missed its siblings.

## What to do

1. Read `a-team/milestones/M-1-pm-surface.md` for the goal and its evidence conditions.
2. Read the tickets it names (`a-team/tickets/AT-5`, `AT-6`, `AT-7`, `AT-8`, `AT-9`) for
   already-known scope. **Do not treat the existing tickets as the decomposition** — they
   are prior art written before this model existed. Decompose from the goal, then note in
   your report where the tree and the tickets disagree.
3. Read `METHOD.md`, `schemas/milestone.md`, `skills/board/`, `skills/prime/` for enough
   context that your checks are real commands against real paths.
4. Read `docs/experiments/goal-tree/schema.json` — your output must validate against it.
5. Write the tree. Depth is whatever the leaf rule produces; do not aim for a number.
6. Run `python3 docs/experiments/goal-tree/validate.py docs/experiments/goal-tree/M-1.tree.json`
   and fix every FAIL. Fix WARNs or justify each one in your report.

## Report back (short)

- node count, leaf count, depth, and the check-type mix
- every `owner: human` node, with one line on why it cannot be delegated
- the three leaves you are least confident about, and why
- where the tree disagrees with the existing AT-5..AT-9 tickets
- **the honest cost**: roughly how long this decomposition took you, and your estimate of
  total leaf effort. This experiment exists to test one bet — that writing the tree is
  cheaper than supervising an agent without one. Give the numbers that let the PO/PM judge
  it, including if they argue against the tree.

## Hard rules

- No implementation. No edits outside `docs/experiments/goal-tree/`.
- Do not create, refine, start, or close any A-Team ticket. Do not append to
  `a-team/metrics/events.jsonl`.
- Never invent a check you have not confirmed is runnable — if you are unsure a path or
  command exists, check it, or mark the criterion `undecidable` and decompose.
