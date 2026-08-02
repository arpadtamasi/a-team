---
id: T-01kz1xrxw4aheeqv1ca0bv0fcq
title: A board atallitasa a Kotta Console v2 tervre
status: active
origin: human
types:
  - feature
profiles:
  - ui
  - workflow
priority: high
risk: medium
package: null
depends_on: []
blocks: []
branch: feat/T-01kz1xrxw4aheeqv1ca0bv0fcq-a-board-atallitasa-a-kotta-console-v2-tervre
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
assigned_agent: claude
---
# T-01kz1xrxw4aheeqv1ca0bv0fcq — A board átállítása a Kotta Console v2 tervre

## Outcome

The board is the Kotta Console v2 design: a dark rail carrying the mark and the derivation chain, a Home screen that answers "what waits on me, what doesn't add up, what runs next", and the existing views restyled onto the Modernist system. It states plainly that it does not write, and it does not.

## User goal

Answer "where do I need to decide, and what is not true" in one glance, then browse the corpus when looking for something specific. Not to move cards — the CLI and the agents do that.

## Entry point

`a-team ui` opens the board (since T-01kz1g2vyhfn5ezzvvyzn4w2gr it opens the browser itself). Home is the landing view. The rail switches views; nothing else navigates.

## Default state

Home, showing three bands in order: **Waiting on you** (the decision queues), **Doesn't add up** (contradictions), **What runs next?** (the menu of defined backlog contracts, with a `Run next →` affordance that names the CLI command rather than running it).

If work is running, the rail's `Running` entry carries a live count and `Watch →` leads to the run view.

## Loading state

The workspace read is a single request. Until it resolves, each band shows its heading and a quiet placeholder row — never a spinner over the whole page, never a layout that jumps when data lands.

## Empty state

Each band states the good news in words, not a blank: nothing waiting to decide, nothing contradictory, nothing defined to run. An empty workspace shows the same three bands with all three empty messages, plus how to create the first ticket.

## Error state

If the workspace cannot be read, the board says what it tried to read and why it failed, keeps the rail usable, and offers a retry. A single failing band does not blank the others.

## Success state

Not applicable in the usual sense: the board performs no mutation, so it reports no success. Reaching a coherent, current view of the workspace is the whole success condition.

## Disabled state

`Run next →` and every other affordance that names a CLI command is presentation only — it is a copyable command, never a button that acts. Nothing on the board is disabled because nothing on the board is enabled to write.

## Responsive behaviour

Designed for the desktop widths the design shows. Below the rail's breakpoint the rail collapses to the mark plus icons; the bands stack. No horizontal scrolling of the page at any supported width; wide content (tables, long ids) scrolls inside its own container.

## Keyboard and focus behaviour

Every rail entry and every row is reachable by keyboard in reading order. The drawer opens on Enter and closes on `Escape` — the design labels this `Close · esc`. Focus moves into the drawer on open and returns to the invoking row on close. Focus is always visible: the Modernist `:focus-visible` ring, 2px accent, never the browser default.

## Accessibility expectations

Zero serious or critical axe violations at the supported widths. The rail is a landmark; the bands are headed regions. Colour is never the only carrier of meaning — a state is a word as well as a tint. The accent-on-ground pair is tuned to 3:1, so accent text at paragraph size uses `--color-accent-700`, not the accent itself.

## Visual reference

`design/kotta/Kotta Console v2.dc.html` — vendored into this repository so it travels with the ticket. It is the specification for layout, wording and behaviour. Its design system is `design/kotta/_ds/modernist-.../styles.css` plus `readme.md`; `design/kotta/Kotta Logo.dc.html` carries the mark and its rules (the red note-head always sits on a line, never between; four staff lines above 24px, three below, two below 18px). `design/kotta/uploads/*.png` show the current board for comparison.

## Actors

- Operator reading the board.
- Agents and the CLI, which produce every change the board displays.
- The UI server, which reads the workspace from a stable ref.

## Initial state

An initialized workspace, read through the existing `/api/workspace` endpoint.

## States

- `loading` — the workspace read is in flight.
- `home` — the three bands.
- `chain` — one of Observations, Contracts, Batches.
- `decisions` — the flat cross-cutting list.
- `running` — the watch view.
- `drawer` — an entity open over any of the above.
- `error` — the workspace could not be read.

## Transitions

Rail entries switch view. A row opens the drawer. `Escape` or the close control returns to the underlying view with focus restored. A refresh re-reads the workspace and preserves the current view and drawer.

## Triggers

Opening the board, a rail click or keypress, a row activation, `Escape`, and an explicit refresh.

## Permissions

The board reads. It performs no mutation and presents no control that would.

## Error paths

Workspace read failure, a malformed entity, and a reference that points at nothing. The last one is displayed rather than hidden: the design shows `dangling reference` in the derivation panel.

## Cancellation path

Closing the drawer discards nothing, because nothing was being composed.

## Retry and duplicate-action behaviour

Refresh is idempotent. Repeated activation of the same row is a no-op on an already-open drawer.

## Audit and notification expectations

None. The board writes no record and sends nothing.

## Scope

- The dark rail: mark and wordmark, the derivation chain (`01 Observations · new information`, `02 Contracts · tickets`, `03 Batches · sequencing`), `Decisions` outside the chain, and `Running` with a live count and `Watch →`.
- The Home view with the three bands, wording taken from the design.
- **Waiting on you** derives from where the CLI refuses without `--approve`: undisposed findings, contracts in review, packages whose members are all done. Not the backlog — that is the menu, not a queue.
- **Doesn't add up** surfaces what `a-team validate` reports plus visible contradictions such as a dangling reference.
- The derivation panel on an entity: `came from` (`source_finding`) and `goes with` (`package`), with `dangling reference` when a target is missing.
- Restyling the existing chain, decisions and drawer views onto the Modernist tokens.
- The Modernist stylesheet replaces the current ad-hoc styles as the single source of visual truth.
- Component tests for the new surfaces, using the harness from T-01kz1nzpnafm6n5t0fz43g7nwh.

## Non-goals

- **Removing the six write endpoints.** The design says the board does not write, and this ticket stops presenting those surfaces — but `/api/chat`, `/api/ticket/ready`, `/api/package`, `/api/package/tickets`, `/api/finding` and `/api/finding/resolve` stay in place. Deleting them is a separate, reversible decision.
- Renaming `finding` to `observation` anywhere but the board's own labels; the CLI, schemas and file paths keep their names. That migration rides with the Kotta rename (P-004).
- The fate of the package `kind` field, which carries no information today and which the design does not render.
- Any change to the CLI, to the workspace format, or to how state is read.
- The landing page and the logo files, which are vendored for reference only.

## Acceptance

1. The rail matches the design: mark, the three chain entries with their numbers and subtitles, `Decisions` visually outside the chain, and `Running` with a count that reflects actually-running work.
2. Home shows the three bands in the design's order and wording, and each band's contents are derived as the Scope describes — in particular, defined backlog contracts appear under `What runs next?` and never under `Waiting on you`.
3. With an empty workspace, all three bands show their empty message; nothing renders blank.
4. Opening an entity shows the derivation panel with `came from` and `goes with`, and a missing target renders as `dangling reference` rather than disappearing.
5. `Escape` closes the drawer and returns focus to the row that opened it.
6. No control on the board issues a write. A test asserts the rendered board contains no mutation request path.
7. Zero serious or critical axe violations at the supported widths.
8. The workspace still loads through one request; the T-029 read-performance contract holds and its subprocess-count test still passes.
9. Component tests cover Home's default, loading, empty and error states, and the drawer's open and close.
10. Full suite, typecheck and all three builds green.

## Verification

Component tests through the jsdom harness for the states named in Acceptance 9, driving real interaction rather than asserting on source. A live check against `a-team ui` on this repository's own workspace and on a temporary empty one, with screenshots at the supported widths. An axe run at those widths. Re-run the T-029 subprocess-count test. `npx vitest run`, `npx tsc --noEmit`, `npm run build`.

## Constraints

The design file is the specification; where this ticket and the design disagree, the design wins and the disagreement is reported rather than resolved silently. Take every colour, font, space and radius from the Modernist stylesheet — no hard-coded hex, no invented spacing. The board reads from the frontmatter of a stable ref and must not introduce per-entity git calls. Whatever the board displays must agree with what the CLI reports.

## Open decisions

None.

## Execution notes

The board is one file, `ui/src/App.tsx`, with `ui/src/styles.css` beside it; components there are module-private, so each one a test touches needs an `export` added, as `DoneStage` has. `readWorkspace` in `src/commands/ui.ts` is the server-side read. The design's HTML is a `.dc.html` template — read it for layout, wording and structure, not to copy its markup verbatim into React.
