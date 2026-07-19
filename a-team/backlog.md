# Backlog

## Backlog

- [TEMP-20260719-01 — Make source-workspace package path resolution consistent](tickets/TEMP-20260719-01-source-workspace-path-resolution.md) — `review`, bug, 3 SP; dependencies: None; expose the one root product source through a thin local Claude skill adapter without copied runtime files.
- [GH-1 — Make interrupted sprint closure recoverable](tickets/GH-1-interrupted-sprint-closure.md) — `ready`, bug, 3 SP; dependencies: TEMP-20260719-01; let `close-sprint` finish its own reachable partial writes safely without duplicate closure artifacts.
- [GH-3 — Give every review submission a stable round identity](tickets/GH-3-review-round-identity.md) — `backlog`, bug, — SP; dependencies: TEMP-20260719-01; require a stable review-round identity for new submit and rework events while preserving legacy history.
- [TEMP-20260719-02 — Make PO/PM authority the enforceable anti-invention principle](tickets/TEMP-20260719-02-po-pm-authority-boundary.md) — `ready`, feature, 5 SP; dependencies: TEMP-20260719-01; enforce PO/PM product authority while the AI team acts autonomously inside approved work contracts.
- [AT-1 — Add PO/PM-guided project setup to init-workspace](tickets/AT-1-init-workspace-project-setup.md) — `ready`, feature, 3 SP; dependencies: TEMP-20260719-01; make initialization persist one approved internal ticket prefix and make capture use it deterministically.
- [AT-2 — Publish a public website for A-Team](tickets/AT-2-public-project-website.md) — `backlog`, documentation, — SP; dependencies: Unknown; publish a public project website, with GitHub Pages considered as a possible host.
- [AT-3 — Configure the A-Team workflow automation level](tickets/AT-3-configurable-workflow-automation.md) — `backlog`, feature, — SP; dependencies: Unknown; let the PO/PM choose how autonomously the workflow advances, up to returning only for questions or the retrospective.
- [AT-4 — Stop routing delivery work to the missing ticket-cycle skill](tickets/AT-4-missing-ticket-cycle-route.md) — `backlog`, bug, — SP; dependencies: Unknown; make the advertised full-delivery route resolve to an operation that actually exists.
