---
id: T-01kz1g2vyhfn5ezzvvyzn4w2gr
title: a-team ui does not open the browser — auto-open the served URL on start
status: backlog
origin: finding
types:
  - bug
profiles: []
priority: medium
risk: medium
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_finding: F-014
---
# T-01kz1g2vyhfn5ezzvvyzn4w2gr — a-team ui does not open the browser — auto-open the served URL on start

## Outcome

`a-team ui` opens the served URL in the default browser on start, and can be told not to.

## Context

Today the command prints the URL and waits; the operator copies it by hand on every start. Since T-014 the port is not even predictable — an occupied 4311 makes the UI pick the next free port — so the printed URL is the only way to know where the board is.

## Scope

- Open the resolved URL in the default browser once the server is listening.
- `--no-open` to suppress it.
- Do not open when `--json` is used, since that mode is for automation.
- A failed open is a warning, never a startup failure.

## Non-goals

- Choosing or configuring which browser is used.
- Reusing an existing tab, or any browser automation beyond handing over the URL.
- Changing host, port or fallback behaviour.

## Acceptance

1. `a-team ui` opens the actual served URL, including a port chosen by fallback.
2. `a-team ui --no-open` starts and opens nothing.
3. `a-team ui --json` opens nothing.
4. A failing opener prints a warning; the server keeps running and the exit status is unaffected.
5. Tests never launch a real browser.
6. Full suite, typecheck and builds green.

## Verification

Integration tests with an injectable opener double asserting the URL it received, plus the three suppression paths and the failure path. `npx vitest run`, `npx tsc --noEmit`, `npm run build:cli`.

## Constraints

The opener must be substitutable so tests never spawn a browser. Opening happens after a successful bind, never before.

## Open decisions

None.

## Execution notes

`src/commands/ui.ts` already resolves the final port through `bindUiServer` (T-014); the opener hangs off the same result. Platform command: `open` on darwin, `xdg-open` on linux, `start` on win32.
