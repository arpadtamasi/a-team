---
id: AT-1
title: Add PO/PM-guided project setup to init-workspace
lane: null
type: feature
status: ready
story_points: 3
created_at: 2026-07-19T19:31:02+02:00
ready_at: 2026-07-19T20:07:34+02:00
started_at:
review_at:
done_at:
sprint:
branch:
blocked_periods: []
metrics:
  work_sessions: []
---

## Outcome

`init-workspace` creates a usable control plane with one PO/PM-approved internal ticket prefix, and `capture-work` deterministically uses that durable convention instead of inventing permanent IDs.

## Why

The current initializer creates only empty technical infrastructure. Without a setup phase inside that first-run flow, `capture-work` may invent a supposedly temporary ID even though ticket IDs are permanent, appear in append-only history, and cannot be renumbered.

## Scope

- Add an exact shared schema for `a-team/config.yml` with schema version `1` and one PO/PM setting: `ticket_prefix`.
- Accept a prefix matching `^[A-Z][A-Z0-9]{0,9}$`; preserve the approved uppercase value exactly.
- Require `init-workspace` to obtain the prefix before a fresh initialization writes anything, then create the config together with the backlog, ticket directory, and empty event log as one bootstrap candidate.
- Let `init-workspace` add only the missing config to an otherwise valid legacy A-Team workspace after explicit PO/PM approval, without rewriting tickets, backlog, events, or existing IDs.
- Make repeated initialization with the same valid config idempotent; refuse a different prefix as an unsupported convention migration.
- Make `capture-work` require the config for new internal work and allocate `<prefix>-<n>` using one greater than the greatest existing numeric suffix for that prefix across tickets and backlog.
- Remove the `TEMP-*` fallback. If configuration is missing, `capture-work` routes to `init-workspace` instead of choosing an ID.
- Preserve explicit stable source identities for imported work, such as `GH-<issue number>`, after normal uniqueness and duplicate-outcome checks; imported IDs do not advance the internal sequence.
- Update the router, method, schemas, process guide, and public documentation wherever initialization or ID selection is described. No new routed operation is introduced.

## Out of scope

- Asking for or storing any other project preference in version 1.
- Creating or maintaining a separate `setup-project` skill.
- Renumbering existing `TEMP-*`, `GH-*`, or other durable IDs.
- Automatically changing an already configured internal prefix.
- Migrating partial or conflicting legacy Scrum infrastructure unrelated to the missing config.

## Acceptance criteria

1. A fresh initialization without an explicitly approved valid prefix leaves the repository unchanged and asks the PO/PM for that one decision in plain language.
2. With an approved prefix, fresh initialization creates the exact config and the existing minimal control-plane artifacts together; it creates no ticket, sprint, lifecycle event, priority, estimate, or branch.
3. A valid initialized workspace missing only the config can be upgraded by adding the approved config while preserving every existing project-management byte and ID.
4. Repeating initialization with the configured prefix changes nothing; supplying another prefix refuses without mutation and identifies convention migration as separate work.
5. Internal capture reads the configured prefix and chooses the next never-used numeric suffix; it does not use `TEMP-*`, reuse a gap, or count stable imported IDs in that sequence.
6. Capture with a missing or invalid config creates no ticket or event and routes back to `init-workspace`.
7. Explicit source-backed IDs such as `GH-3` remain permitted when unique and outcome-deduplicated, without changing the internal counter.
8. The config schema, initializer, capture procedure, router, method, process guide, and public documentation describe the same one-setting contract and source of truth.

## Verification

### Automated

- `git diff --check`
- Parse every example and fixture `a-team/config.yml` as YAML and validate schema version, exact key set, and prefix pattern.
- Parse all changed skill frontmatter and validate local Markdown links.

### Manual

- Exercise isolated workspace scenarios for: fresh initialization without a prefix; fresh initialization with `AT`; idempotent rerun; conflicting-prefix rerun; valid legacy workspace missing config with and without existing tickets; internal capture after `AT-1`; and imported `GH-3` beside the internal sequence.
- Compare pre/post file lists, ticket IDs, and event-line counts for every scenario against the acceptance criteria.

### Documentation

- Cross-check `METHOD.md`, the config schema, `init-workspace`, `capture-work`, `PROCESSES.md`, the router, and `README.md` for one operation name, one config path, and one ID rule.

## Dependencies

TEMP-20260719-01 must expose the current source package through the local adapter before this repository dogfoods the changed initializer and capture flow.

## Context

- The user approved `AT-1`, `AT-2`, … for internal A-Team work and source-derived IDs such as `GH-<issue>` for imported work.
- The user decided that setup belongs inside `init-workspace` and that version 1 asks only for the internal ticket prefix.
- Existing `TEMP-*` IDs remain historical because durable identities and append-only events cannot be renumbered.
- [TEMP-20260719-02](TEMP-20260719-02-po-pm-authority-boundary.md) is related broader work about the PO/PM authority model, but its completion is not required for this bounded setup behavior.

## Result

## Refinement notes

Estimated at 3 points: the behavior is bounded to one PO/PM setting, but it adds a durable schema and coordinated fresh, legacy-adoption, idempotency, and capture behavior across several method layers.
