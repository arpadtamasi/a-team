---
id: T-013
title: Add a discoverable bug-reporting path
status: ready
origin: human
types:
  - feature
profiles:
  - ui
  - workflow
priority: medium
risk: medium
package: P-003
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-07-23'
updated_at: '2026-07-23'
---
# T-013 — Add a discoverable bug-reporting path

## Outcome

An A-Team user or coding agent that encounters a defect can prepare the information maintainers need to reproduce it and submit it as a GitHub Issue in `arpadtamasi/a-team` through a supported human or agent entry point while understanding exactly what diagnostic data will be shared. Maintainers then capture the incoming issue in this A-Team workspace as a finding for validation and disposition before any execution ticket is created.

## User goal

Report a problem at the moment it is encountered without having to discover the repository, learn the internal ticket model, or compose an unstructured support message. A coding agent can perform the same workflow without pretending that a browser-only link is an agent-capable reporting interface.

## Entry point

A persistent, clearly labelled `Report a bug` action is available on both the public onboarding site and the local execution board. It opens `https://github.com/arpadtamasi/a-team/issues/new?template=bug.yml`. Installed agent users can invoke a bundled `report-a-team-bug` skill through their supported host; the skill prepares the same report and can submit it through an authenticated GitHub capability after explicit approval.

## Default state

Opening a human reporting path loads the `bug.yml` GitHub Issue Form in `arpadtamasi/a-team`. Invoking the agent skill prepares an equivalent structured draft containing summary, reproduction steps, expected behaviour, actual behaviour, and A-Team version. Optional diagnostic context is excluded by default and can be added only through an explicit per-report opt-in. Neither path submits an issue automatically.

## Loading state

While GitHub is being opened or an agent is investigating and preparing a report, the trigger or skill prevents duplicate activation and exposes concise progress. The agent communicates when it is inspecting evidence, checking for an existing issue, awaiting approval, or submitting.

## Empty state

Human form fields start empty or with explicit prompts. An agent draft contains only evidence it has inspected and clearly distinguishes observed facts from impact hypotheses. Optional diagnostics are off by default; the reporter must enumerate the exact proposed diagnostic fields and obtain a separate per-report opt-in before adding them to the outbound draft.

## Error state

If GitHub cannot be opened, the agent lacks an authenticated GitHub capability, or draft preparation/submission fails, the complete sanitized report remains available as copyable Markdown with the direct Issue Form URL.

## Success state

The human reaches the `arpadtamasi/a-team` GitHub Issue Form, or the approved agent submission returns the created GitHub Issue URL. GitHub owns authentication, final persistence, and issue confirmation.

## Disabled state

Submission is disabled until the minimum required report fields are present. Agent submission is additionally disabled until the user has seen the sanitized draft and explicitly approved the external write. Any unavailable diagnostic field is omitted and explained rather than blocking the report.

## Responsive behaviour

The public-site and local-board entry points plus GitHub form handoff remain usable at all supported widths without covering primary navigation or ticket controls. Agent reporting remains text-native and does not depend on viewport size.

## Keyboard and focus behaviour

Both visual entry points are keyboard reachable. Opening the reporting UI moves focus to its heading or first required field; closing it returns focus to the trigger. Escape closes only an in-product modal or drawer and never discards entered content without warning. The agent path requires no pointer-only interaction.

## Accessibility expectations

The visual action has an unambiguous accessible name, the GitHub Issue Form has persistent labels and validation guidance, focus order is logical, and status is not communicated by colour alone. Agent progress, draft, approval request, success URL, and errors are conveyed as text.

## Visual reference

Use the existing A-Team surface language and component system. The action must read as support/reporting rather than a primary lifecycle mutation and remain visually discoverable without competing with ticket execution controls. The public site and local board use the same `Report a bug` label and issue-form destination.

## Actors

- User encountering a defect.
- Coding agent encountering or investigating an A-Team defect.
- A-Team public site or local board presenting the reporting entry point.
- Bundled `report-a-team-bug` skill preparing and, when approved, submitting the agent report.
- The `arpadtamasi/a-team` GitHub Issues composer receiving the structured content.
- Maintainer capturing the resulting GitHub Issue through `a-team finding new`.
- Human decision owner validating and dispositioning the finding.

## Initial state

The user is on an A-Team surface and has encountered a problem. No report or diagnostic information has been shared.

## States

- `idle`: reporting action is available.
- `drafting`: the user is entering or reviewing report content.
- `investigating`: the agent is collecting reproducible evidence and checking for likely duplicate issues.
- `awaiting-approval`: the agent has presented the sanitized outbound issue draft and exact destination.
- `ready-to-handoff`: required content is complete.
- `handing-off`: the destination is opening or receiving prepared content.
- `handed-off`: GitHub displayed the prepared new issue.
- `reported`: the user submitted the GitHub Issue.
- `finding-new`: a maintainer captured the issue URL and evidence under `.a-team/findings/new`.
- `finding-resolved`: a human-approved disposition was recorded; scheduled work exists only when that disposition explicitly creates or attaches a ticket.
- `failed`: the handoff failed while the draft remains recoverable.
- `cancelled`: the user exits without submission.

## Transitions

- Activating `Report a bug` moves `idle → drafting`.
- Invoking the agent skill moves `idle → investigating → awaiting-approval`.
- Human approval moves `awaiting-approval → ready-to-handoff`; rejection or cancellation creates no external issue.
- Completing required fields moves `drafting → ready-to-handoff`.
- Explicit submission moves `ready-to-handoff → handing-off → handed-off`.
- GitHub submission moves `handed-off → reported`.
- Maintainer triage captures `reported → finding-new` with the GitHub Issue URL in Evidence.
- The existing finding workflow moves `finding-new → finding-resolved` only after validation and human-approved disposition.
- Destination or browser failure moves `handing-off → failed`; retry returns to `handing-off`.
- Closing before handoff moves `drafting|ready-to-handoff → cancelled`.

## Triggers

Explicit activation of either visual reporting entry point, invocation of the agent skill, field edits, evidence inspection, duplicate search, diagnostic consent, outbound-draft approval, GitHub submission, maintainer capture with `a-team finding new`, finding validation, human disposition, retry, and cancellation.

## Permissions

Any user who can access the public site or local board may prepare a report. An agent may investigate and draft without approval, but creating a GitHub Issue is an explicit external write and requires the user to approve the sanitized title/body and destination. Optional diagnostics are excluded unless the user separately opts in for that report after seeing every proposed field. No local repository content, environment variable, Git remote, user identity, file path, log, or agent conversation is shared through general submission approval alone. Maintainers may capture a public or otherwise authorized GitHub Issue as a finding; only a human-approved finding disposition may create or attach scheduled ticket work.

## Error paths

Blocked pop-up or navigation, unavailable GitHub, missing GitHub authentication or connector capability, malformed issue URL, oversized content, duplicate candidate, missing required fields, rejected approval, and unavailable diagnostics preserve the sanitized draft and provide a copyable fallback plus the direct Issue Form URL. Reporting failure must not affect canonical `.a-team` state or the running UI server.

## Cancellation path

The user can cancel before handoff or reject an agent's outbound draft. Cancellation creates no report and sends no diagnostics. If content would be discarded, the UI warns before closing or preserves the draft for the current session; the agent retains a copyable draft in its response.

## Retry and duplicate-action behaviour

Repeated activation while a report is open focuses the existing draft rather than creating another. The agent searches open GitHub Issues for likely duplicates before proposing creation and reports candidates to the user. Repeated submission during handoff is suppressed. After a failed handoff, retry reuses the same approved draft; the external destination remains authoritative for final duplicate detection.

## Audit and notification expectations

V1 does not add a canonical local audit record merely for opening, drafting, or cancelling the reporter. GitHub provides the issue identifier and confirmation after submission. The agent reports the created issue URL and the UI clearly states that the report leaves the local workspace and becomes a GitHub Issue. The corresponding finding records the GitHub Issue URL in Evidence and retains the existing finding disposition audit fields.

## Scope

- Add a discoverable, accessible `Report a bug` entry point to both the public onboarding site and local execution board.
- Add `.github/ISSUE_TEMPLATE/bug.yml` and point both visual entry points to `https://github.com/arpadtamasi/a-team/issues/new?template=bug.yml`.
- Add and publish a `report-a-team-bug` skill for supported coding-agent hosts.
- Collect or prepare the same minimum structured defect report across human and agent paths.
- Make the agent inspect relevant evidence, distinguish facts from hypotheses, search for likely duplicates, sanitize the outbound draft, and request explicit approval before creating the GitHub Issue.
- Use an authenticated GitHub app/connector when available and `gh issue create` as the documented fallback; otherwise return copyable Markdown and the Issue Form URL.
- Keep optional diagnostics disabled by default and require a separate per-report opt-in for an enumerated, privacy-safe field set.
- Open the `arpadtamasi/a-team` GitHub new-issue composer with the structured report prefilled.
- Document and verify the maintainer triage path from a submitted GitHub Issue to `a-team finding new`.
- Preserve the GitHub Issue URL and relevant report evidence in the finding.
- Preserve report content and provide a copyable fallback when handoff fails.
- Add interaction, accessibility, privacy, and handoff tests.
- Document the supported reporting path for installed and public users.

## Non-goals

- Building a general-purpose support desk, discussion forum, or public roadmap.
- Creating canonical project tickets inside the user's own `.a-team` workspace.
- Automatically uploading logs, repository contents, agent transcripts, secrets, or personal data.
- Implementing maintainer triage, prioritization, or SLA automation.
- Automatically creating an execution ticket from a GitHub Issue.
- Adding a GitHub polling daemon, webhook receiver, or bidirectional issue synchronization in V1.
- Replacing the internal `a-team finding` validation and human-disposition workflow.
- Letting an agent submit repository contents, logs, environment data, paths, conversations, or identity data without an explicit sanitized preview and approval.
- Giving the A-Team application a stored GitHub token or service credential.

## Acceptance

- A first-time user can find a clearly labelled bug-reporting action without navigating through a generic repository page.
- The public onboarding site and local execution board both link to `https://github.com/arpadtamasi/a-team/issues/new?template=bug.yml`.
- Installing the published A-Team skills makes `report-a-team-bug` discoverable to a supported coding agent.
- The prepared report includes summary, reproduction steps, expected behaviour, actual behaviour, and A-Team version when safely available.
- The agent path inspects evidence and likely duplicate GitHub Issues, then shows the exact sanitized title, body, repository, and diagnostic fields before requesting submission approval.
- An agent with approved authenticated GitHub access can create the Issue and returns its URL; without authentication it returns the complete copyable report and direct Issue Form URL.
- Rejecting the agent submission creates no GitHub Issue and shares no diagnostics.
- General approval to create the Issue does not authorize optional diagnostics; without a separate per-report opt-in, the outbound report contains none.
- Required fields and validation are accessible by keyboard and assistive technology.
- No diagnostic or repository-derived content is shared without the approved disclosure and consent policy.
- Successful handoff preserves the structured content and opens the `arpadtamasi/a-team` GitHub new-issue composer.
- A submitted GitHub Issue can be captured with the canonical CLI as a new finding whose Evidence contains the issue URL and reported facts.
- The captured report remains a finding until the existing validation flow records a human-approved disposition; no ticket is created merely because the GitHub Issue exists.
- Failed or blocked handoff preserves the draft and offers a copyable/manual fallback.
- Cancel and repeated-action behaviour match the defined workflow and do not create duplicate reports.
- The feature does not mutate the user's canonical `.a-team` state.
- Documentation points installed and public users to the same supported reporting contract.

## Verification

- Add component tests for default, validation, consent, loading, error, success, cancellation, and duplicate activation states.
- Add keyboard and automated accessibility coverage for the reporting flow.
- Validate the `bug.yml` Issue Form and test the exact template URL.
- Add skill contract tests or fixtures for evidence gathering, fact/hypothesis separation, duplicate candidates, secret/path sanitization, approval, authenticated submission, rejection, and unauthenticated fallback.
- Simulate blocked navigation and unavailable destination, then verify draft preservation and manual fallback.
- Inspect the outbound payload to prove that unapproved paths, logs, repository content, environment values, and conversations are absent.
- Submit a fixture GitHub Issue or use a stable fixture URL, capture it with `a-team finding new`, and validate the resulting finding.
- Verify that capturing the issue creates no ticket and that only an explicitly approved finding disposition can create or attach scheduled work.
- Run the UI/site build, typecheck, and full test suite.
- Perform a clean-user walkthrough from each selected entry surface to the maintainer destination.

## Constraints

Keep V1 credential-free for the A-Team application. Human reporting opens GitHub's Issue Form; agent reporting uses only the user's already authenticated connector or `gh` session after explicit approval. Optional diagnostics are opt-in per report, never enabled globally or inferred from general submission approval. Treat local filesystem paths, Git metadata, logs, configuration, and agent conversation as potentially sensitive. Follow the supported host boundary already used for distributed A-Team skills.

## Open decisions

None.

## Execution notes

The destination, surfaces, agent path, intake state, and diagnostic-consent decisions are resolved: reports go to GitHub Issues in `arpadtamasi/a-team`; the public site and local board link to the `bug.yml` form; supported coding agents use the bundled reporting skill; and maintainers then treat submitted issues as findings in this workspace. Agent submission always previews the sanitized outbound report and requires explicit approval. Optional diagnostics are disabled by default and require a separate per-report opt-in after exact field disclosure. Maintainer capture is manual in V1 and must use the canonical finding CLI.
