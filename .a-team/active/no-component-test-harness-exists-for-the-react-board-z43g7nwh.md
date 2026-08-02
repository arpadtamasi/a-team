---
id: T-01kz1nzpnafm6n5t0fz43g7nwh
title: Component-test harness for the React board
status: active
origin: finding
types:
  - feature
profiles: []
priority: medium
risk: medium
package: null
depends_on: []
blocks: []
branch: feat/T-01kz1nzpnafm6n5t0fz43g7nwh-component-test-harness-for-the-react-board
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_finding: F-033
assigned_agent: claude
---
# T-01kz1nzpnafm6n5t0fz43g7nwh — Component-test harness for the React board

## Outcome

A React component can be rendered in a test and asserted on: what it shows, and how it reacts to interaction. `npx vitest run` runs those tests alongside the existing node-only suite, in the same command, without a browser.

## Context

Recorded during T-013. The `ui` profile requires evidence for the default, loading, empty, error, success and disabled states of a surface. None of that can be shown without rendering the component.

What the repository has today, and why none of it fits:

- **unit tests** — pure functions, no UI at all
- **source-contract tests** — they grep the source or the built bundle for a string. They pass while the surface is broken; T-013 had to fall back on exactly this.
- **Playwright** — a real browser, but it only runs against `site/`, and it is slow

So every UI ticket whose Verification names component tests is unsatisfiable as written. Six UI tickets are queued behind this one.

## Scope

- Add a browser-like test environment (`jsdom`) and a rendering library (`@testing-library/react`) as dev dependencies.
- Configure vitest so UI tests get that environment while the existing node-only tests keep theirs — one `npx vitest run` covers both.
- One exemplar component test against a real component in `ui/src/`, asserting rendered output and one interaction, so the pattern is copyable.
- A short note in the README on where UI tests live and how to write one.

## Non-goals

- Testing every existing component, or reaching any coverage target.
- Replacing the Playwright suite that covers `site/`.
- Any change to the board's behaviour, markup or styling.
- A visual-regression or screenshot mechanism.

## Acceptance

1. A component test renders a component from `ui/src/` and asserts on what the user sees; it fails when the rendered output stops matching.
2. The same test asserts one interaction (a click or an input) and its visible effect.
3. `npx vitest run` runs both the new UI tests and the whole existing suite, green, in one command.
4. The existing node-only tests keep running in their current environment — no test moves to jsdom by accident.
5. No test opens a real browser.
6. Typecheck and all three builds green.

## Verification

Run `npx vitest run` and confirm both groups execute. Prove the exemplar has teeth: change the component's rendered text and watch the test fail, then revert. Confirm the node-only suite count is unchanged.

## Constraints

Test-only dependencies; nothing ships in the built board. The existing suite must not slow down materially or change environment.

## Open decisions

None.

## Execution notes

`vitest.config.ts` holds the current node-only setup, and since T-01kz1g2vyhfn5ezzvvyzn4w2gr also carries `test.env` pinning the browser opener — keep that working. UI source is `ui/src/App.tsx`; pick a small, self-contained component from it as the exemplar rather than the whole board.
