# A-Team

**An AI-native Scrum control plane for Claude Code.**

A-Team turns your coding agents into a disciplined dev team. It is a lightweight,
one-goal-per-sprint Scrum method implemented entirely as Claude Code skills: backlog,
tickets, sprints, and delivery run through explicit operations with append-only history,
real metrics, and human approval gates. The point is to make agent work explicit, small,
reviewable, measurable, and recoverable, without turning project management into a second
product.

## Why

AI agents ship code fast. Left ungoverned, they also invent scope, hide regressions, and
report "done" with no evidence. A-Team is the control plane that keeps them honest:

- **Explicit lifecycle.** Every ticket moves `backlog → ready → in_progress → review → done`
  through one owning operation. A state value alone is never proof its transition happened.
- **Definition of Ready / Done.** A ticket enters a sprint only when its outcome, scope,
  acceptance criteria, and verification are pinned down; it closes only with real evidence.
- **Append-only history.** Lifecycle and token events are an audit log, not editable state.
  Metrics are derived, never hand-set.
- **Flow and delivery metrics.** Lead/cycle/review/blocked time, throughput, committed
  velocity, first-pass acceptance, carry-over — computed from the record, not vibes.
- **Token accounting.** Provider-reported usage attributed by ticket, sprint, and purpose.
- **Human gates.** Sprint commitment, scope changes, acceptance of open findings, and method
  changes require explicit approval. No workflow auto-decides them.
- **Clean Git baseline.** Every sprint records the clean commit it starts from, and its
  PM-only commitment is committed before feature work begins, so ticket diffs remain
  attributable and pre-existing work is never counted twice.

You do not need to know Scrum vocabulary. Describe what you want in ordinary language;
A-Team routes it to the right operation, asks focused questions, and translates terms when
they become useful. See [`GLOSSARY.md`](GLOSSARY.md) for the plain-language meanings.

## Who it is for

Developers and teams running Claude Code (or other AI coding agents) who want real
project-management rigor over agent work instead of a growing pile of TODOs. If you are
shipping with agents and cannot answer "what did we commit to, what is actually done, and how
do we know" — this is for you.

## How it fits with gstack

A-Team is the **dev team**. [gstack](https://github.com/garrytan/gstack) is the **product
team**: it designs the product — CEO/strategy, engineering, and design reviews, discovery,
QA, and shipping. A-Team is the agent crew that turns those plans into committed, reviewed,
delivered tickets under Scrum discipline.

They compose cleanly: gstack workflows produce plans, findings, and evidence; A-Team owns
priority, commitment, lifecycle state, acceptance, closure, and metrics. A gstack report is
**evidence** for a Scrum operation, never a Scrum state. The boundary is defined in
[`GSTACK.md`](GSTACK.md). A-Team works standalone too — gstack is optional.

## Install

```bash
git clone --single-branch --depth 1 https://github.com/arpadtamasi/a-team.git ~/.claude/skills/a-team
```

Then invoke operations with `/a-team <operation>` in Claude Code (for example
`/a-team init-workspace`), or just ask in your own words ("inicializáld az A-Teamet",
"vegyük fel a backlogra", "mi az állás"). `init-workspace` creates the minimal canonical
`a-team/` structure once; the remaining skills maintain it.

Copy [`AGENTS.md`](AGENTS.md) to your repository root and adapt it — the method relies on the
Boy Scout (found-work) rule and the code guidelines it defines.

## Operations

- `init-workspace` — create the minimal canonical Scrum infrastructure once
- `capture-work` — turn an idea, request, or finding into a backlog ticket
- `refine-ticket` — make one outcome clear, bounded, estimable, verifiable (→ `ready`)
- `plan-sprint` — set the sprint goal and commitment
- `start-ticket` — claim committed work, start cycle time
- `block-ticket` — record or resolve a real impediment
- `submit-review` — hand off a candidate with verification evidence
- `review-ticket` — judge the candidate against the contract and Definition of Done
- `close-ticket` — record accepted delivery (→ `done`)
- `disposition-ticket` — park or reject work without claiming delivery
- `reconcile-history` — append-only correction of proven history errors
- `close-sprint` — demonstrate and archive the sprint
- `retro` — produce a retrospective and one approved operating change
- `report-status` — read-only snapshot of current work
- `report-metrics` — recalculate delivery and token metrics
- `howto` — read-only routing: which operation applies, and how to request it
- `report-issue` — deduplicate and file A-Team package feedback on GitHub

## How it is organized

| File | Responsibility |
| --- | --- |
| [`METHOD.md`](METHOD.md) | Shared concepts, invariants, lifecycle ownership |
| [`schemas/`](schemas/) | Exact reusable data shapes and formulas |
| [`skills/`](skills/) | The operations, one directory each |
| [`PROCESSES.md`](PROCESSES.md) | Human-readable workflow map |
| [`GSTACK.md`](GSTACK.md) | Boundary with external expert workflows |
| [`GLOSSARY.md`](GLOSSARY.md) | Scrum and A-Team terms in plain language |
| [`AGENTS.md`](AGENTS.md) | Repository working rules the method relies on |

## License

MIT. See [`LICENSE`](LICENSE).

*Brought to you by [Progos](https://progos.hu).*
