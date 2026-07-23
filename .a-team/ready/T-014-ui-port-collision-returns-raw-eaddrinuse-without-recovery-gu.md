---
id: T-014
title: UI port collision returns raw EADDRINUSE without recovery guidance
status: ready
origin: finding
types:
  - bug
profiles:
  - bug
  - workflow
priority: medium
risk: low
package: P-003
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-07-23'
updated_at: '2026-07-23'
source_finding: F-001
---
# T-014 — Start the UI on the next available default port

## Outcome

Running `a-team ui` without an explicit `--port` starts the UI even when the default port is occupied: it tries `127.0.0.1:4311`, advances sequentially to the next available port, and prints the actual URL and workspace it selected.

## Actual behaviour

If another process already listens on `127.0.0.1:4311`, `a-team ui --workspace .` exits with the raw Node error `listen EADDRINUSE: address already in use 127.0.0.1:4311`. The user must diagnose the port owner and manually retry with `--port`.

## Expected behaviour

When `--port` is omitted, `EADDRINUSE` on the default port triggers a deterministic sequential retry on the next port until startup succeeds within the documented retry bound. The existing server is not disturbed. When the user explicitly supplies `--port`, that port remains strict and a collision returns an actionable error instead of silently selecting a different port.

## Reproduction steps

1. Start a healthy A-Team UI on the default port with `a-team ui --workspace <workspace-a>`.
2. From another initialized repository, run `a-team ui --workspace <workspace-b>` without `--port`.
3. Observe that the second invocation exits with raw `EADDRINUSE`.
4. Retry with `--port 4312` and observe that the second UI starts successfully.

## Environment

Observed on macOS on 2026-07-23 with Node 24.14.1. PID 35831 was a healthy `a-team ui --workspace .` process serving `/Users/rp/Dev/ezchops/oneanda/.a-team` on `127.0.0.1:4311`; port 4312 was free.

## Frequency

Deterministic whenever the default host and port are already occupied.

## Impact

Running multiple A-Team workspaces is a normal local workflow, but the second UI fails on first launch and exposes an implementation-level Node error. Users must understand ports and process inspection even though the CLI can recover safely.

## Regression-test expectation

Add integration coverage that occupies the default port, starts the UI without `--port`, and proves it listens on the next free port. Retain a separate test proving that an explicitly requested occupied port fails without fallback.

## Actors

- Operator starting one or more local A-Team UIs.
- Existing process that already owns a candidate port.
- A-Team CLI selecting and binding a port.
- Browser or automation consuming the printed or JSON URL.

## Initial state

The requested host is valid, the workspace is readable, and zero or more sequential ports beginning at 4311 may already be occupied.

## States

- `candidate`: the CLI has a host/port pair to attempt.
- `occupied-default`: an implicit candidate failed with `EADDRINUSE`.
- `listening`: the server successfully bound and reports its actual address.
- `exhausted`: every candidate within the documented retry bound was occupied.
- `strict-port-failed`: an explicitly requested port could not be bound.
- `fatal`: startup failed for a reason other than an eligible implicit-port collision.

## Transitions

- With no `--port`, startup begins at candidate 4311.
- `EADDRINUSE` on an implicit candidate advances to the next integer port and retries.
- Successful `listen` moves to `listening` and reports the selected URL once.
- Reaching the retry bound moves to `exhausted` with actionable guidance.
- With explicit `--port`, any bind failure moves directly to `strict-port-failed` or `fatal`; no alternate port is selected.
- Non-collision errors never enter the retry loop.

## Triggers

The `a-team ui` command, each server `listen` result, an eligible `EADDRINUSE`, successful binding, retry exhaustion, and process cancellation.

## Permissions

The CLI may bind only the requested host and candidate ports. It does not inspect, signal, kill, or replace the process holding an occupied port.

## Error paths

Invalid port values, port overflow, `EACCES`, invalid host, workspace-read failure, retry exhaustion, and server errors after binding return actionable human and JSON errors. Only `EADDRINUSE` during implicit default-port selection is eligible for fallback.

## Cancellation path

Ctrl+C or process termination closes the server through existing shutdown behavior. Cancellation during port selection stops further attempts and does not affect existing listeners.

## Retry and duplicate-action behaviour

Candidate ports are tried once in ascending order. The implementation retries by handling `listen` errors directly rather than pre-scanning ports, avoiding a check-then-bind race. Starting the command twice may select different free ports; each invocation reports its own actual URL and workspace.

## Audit and notification expectations

Human output prints the actual URL, selected workspace, and a short note when it fell back from 4311. `--json` output returns the actual URL, host, port, workspace, and whether fallback occurred. No canonical `.a-team` artifact or external notification is created by port selection.

## Scope

- Distinguish an omitted port from an explicitly supplied `--port`.
- Retry sequential ports only for `EADDRINUSE` on the implicit default path.
- Use a finite documented retry bound and reject port overflow.
- Report the actual selected port in human and JSON output.
- Replace raw eligible listen errors with actionable diagnostics.
- Add focused unit and process-level integration tests.
- Document default fallback and strict explicit-port behaviour.

## Non-goals

- Killing or reusing an existing UI process.
- Detecting whether the port owner is another A-Team instance.
- Managing a registry of running workspaces.
- Opening a browser automatically.
- Random port allocation, network-wide discovery, or binding to additional interfaces.
- Changing the default host or allowing remote access.

## Acceptance

- With 4311 free, `a-team ui` listens on 4311 and reports that URL.
- With 4311 occupied and 4312 free, `a-team ui` without `--port` starts on 4312 without disturbing the existing listener.
- With 4311 and 4312 occupied, implicit startup advances in ascending order until the first available port within the retry bound.
- Human output identifies the selected URL and workspace and notes fallback when it occurred.
- JSON output contains the actual host, port, URL, workspace, and fallback status.
- `a-team ui --port 4311` remains strict: if occupied, it exits non-zero with an actionable collision error and does not bind 4312.
- Errors other than `EADDRINUSE` are not retried.
- Exhausting the retry bound exits non-zero and explains how to provide an explicit port.
- Port selection does not mutate canonical workspace state or signal an existing process.

## Verification

- Add unit tests for implicit/explicit option parsing, eligible error classification, sequential candidates, retry bound, and port overflow.
- Add integration tests using real ephemeral listeners to cover free default, one collision, multiple collisions, strict explicit collision, non-collision failure, and exhaustion.
- Assert both human and `--json` output against the actual bound address.
- Keep the first server running while the second starts, then query both `/api/workspace` endpoints and verify each serves its own workspace.
- Run typecheck and the full test suite.
- Reproduce the original scenario with one UI on 4311 and confirm a second bare-port invocation starts on 4312.

## Constraints

Do not preflight with `lsof` or kill the port owner. Handle the server's bind result as the authority. Keep `127.0.0.1` as the default host and preserve strict behavior for an explicitly requested port. The retry bound must be finite and documented in CLI help.

## Open decisions

None.

## Execution notes

Source: F-001. Human decision on 2026-07-23: automatic fallback is the desired behaviour; manual `--port 4312` is only a workaround. Recommended implementation shape is equivalent to development servers that auto-increment an implicit default port while treating an explicit port as strict.
