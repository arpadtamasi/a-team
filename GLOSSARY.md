# A-Team terms in plain language

You do not need to know Scrum vocabulary to use A-Team. Describe the work in ordinary
language; the agent translates it into the method and explains a formal term only when it
helps you make a decision.

| A-Team term | What it means in everyday language |
| --- | --- |
| ticket | One durable work item: a problem, request, or result worth tracking separately. |
| backlog | Work that has been recorded but is not yet clear enough or selected to start. It does not mean rejected or unimportant. |
| refinement | Talking through one item until its intended result, boundaries, proof, dependencies, and size are clear. |
| outcome | The single observable change the work should produce, not merely the activity to perform. |
| scope / out of scope | What this item includes, and tempting adjacent work it deliberately does not include. |
| acceptance criteria | Concrete checks that answer: “What must be true for us to accept this?” |
| verification | The commands, observations, measurements, or documents that will prove those checks. |
| dependency | Something that genuinely must happen first; related work is not automatically a dependency. |
| ready | Clear, bounded, testable, independently reviewable, and small enough to consider for a sprint. Ready does not mean started. |
| story points | A relative comparison of effort, complexity, uncertainty, risk, and proof burden. They are not hours or days. |
| sprint | One short, coherent delivery goal and the work explicitly selected for it. In A-Team it ends when that goal is closed, not automatically on a calendar date. |
| Git baseline | The clean committed repository state recorded immediately before a sprint commitment. Pre-existing work is not counted as sprint delivery. |
| committed | Selected work the team expects to finish without weakening the quality bar. |
| stretch | Optional work considered only after the committed goal is safe; it does not count as committed delivery. |
| in progress | Someone has explicitly claimed the selected item and begun work. |
| blocked | A concrete impediment prevents meaningful progress. Difficulty or an unanswered refinement question alone is not a blocker. |
| review | An independent check of the candidate against the agreed work contract and evidence. |
| done | Accepted delivery with the required evidence; “the implementation was written” is not enough. |
| Definition of Ready | The shared checklist an item must pass before it may be selected for a sprint. |
| Definition of Done | The shared quality and evidence checklist it must pass before delivery may be accepted. |
| carry-over | Selected work that remains unfinished when a sprint closes and keeps its original history if selected again. |
| velocity | Story points from accepted work, used as historical planning evidence rather than a target or productivity score. |
| epic / initiative | A result too broad or uncertain to execute as one sprint-sized item; it needs smaller independently useful items. |
| spike | A small, time-bounded investigation whose result is evidence or a decision that removes a specific uncertainty. |

## How the conversation should feel

The agent asks one focused, ordinary-language question at a time. Typical questions are:

1. What should become observably different?
2. Why is that useful now?
3. What must this item include, and what should wait?
4. What would convince you that it is complete?
5. Is there a decision or other work that must happen first?

The agent inspects the repository for answers before asking. It then proposes the formal
ticket wording, checks, dependencies, and story-point estimate, explains any meaningful
trade-off without jargon, and asks for approval only where the method requires a human
decision.
