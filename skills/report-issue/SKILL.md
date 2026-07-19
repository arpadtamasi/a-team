---
name: report-issue
description: This skill should be used when the user asks to "report an A-Team issue", "file an A-Team bug", "open an issue for A-Team", "jelentsd ezt az A-Team hibát", or "vegyél fel egy A-Team issue-t". It searches open and closed issues in arpadtamasi/a-team for the same outcome and creates one English-language GitHub issue only when no substantive duplicate exists. Do not use it to create Scrum backlog tickets, report issues for another repository, comment on or modify existing issues, or implement the reported work.
compatibility: Requires GitHub CLI access, authentication with permission to create issues in arpadtamasi/a-team, and network access to GitHub.
---

# Report A-Team Issue

Route public A-Team package feedback to
[`arpadtamasi/a-team`](https://github.com/arpadtamasi/a-team/issues) without creating
duplicate issues. Treat GitHub Issues as an external intake channel, not as the consuming
repository's Scrum backlog or lifecycle state.

## Scope

Target exactly `arpadtamasi/a-team`. Accept bug reports, documentation problems, feature
requests, compatibility problems, and concrete workflow defects in the A-Team package.

Create at most one issue per invocation. Do not:

- create, refine, estimate, prioritize, schedule, start, or modify a Scrum ticket;
- file an issue in another repository;
- comment on, reopen, close, label, assign, transfer, pin, or add an existing issue to a
  project;
- implement a fix or change repository files;
- disclose secrets, credentials, private repository content, personal data, or other
  sensitive evidence.

An explicit request to report or file the issue authorizes one new issue when no duplicate
exists. A request only to search or check for duplicates remains read-only.

## Resolve the live package

When repository inspection is needed for evidence, use the repository-root package in the
A-Team source repository and the installed `.claude/skills/a-team/` package in a consuming
repository. Never prefer an installed copy inside the source repository. This external
reporting operation does not edit either package or project-management state.

## Resolve the report

Extract the smallest independently actionable outcome from the user's report. Establish:

- a concise title describing the observed problem or requested capability;
- whether the report is a bug, documentation problem, feature request, compatibility
  problem, or other concrete feedback;
- the actual behavior or current limitation;
- the expected behavior or requested outcome;
- reproduction steps, environment, affected version, impact, and evidence when supplied.

Distinguish repository-verified facts, user-provided facts, and inference. Never invent a
version, command result, reproduction step, environment, impact, workaround, cause, or
acceptance criterion. Omit unsupported optional sections rather than filling them with
fiction.

Ask one focused question only when the intended outcome cannot be identified well enough to
search for a duplicate or write a faithful issue. Do not block on missing optional detail.

Redact secrets and sensitive data before searching or drafting. When redaction would remove
the evidence needed to understand the report, stop and request a safe summary instead of
sending the material to GitHub.

## Verify GitHub access

1. Run `gh auth status` and require a valid authenticated GitHub session.
2. Inspect `arpadtamasi/a-team` with `gh repo view` and confirm that Issues are enabled.
3. Stop without mutation when authentication, repository access, or Issues availability is
   missing. Report the exact prerequisite without attempting another target.

Do not expose authentication tokens in commands, logs, issue bodies, or the response.

## Search for duplicates

Search both open and closed issues before creating anything.

1. Derive two or three short searches from the core outcome: the affected concept, the
   observed failure or requested behavior, and a distinctive error or operation name when
   available.
2. When the report is not English, search with both the original-language terms and their
   English equivalents so historical issues in either language remain discoverable.
3. Use GitHub issue search scoped to `arpadtamasi/a-team`, matching titles and bodies. Include
   all states and enough results to cover every plausible match; do not rely on the first
   page or an exact-title query alone.
4. Inspect each plausible candidate in full with `gh issue view`, including number, title,
   body, state, labels, and URL.
5. Compare outcomes rather than keywords. Treat an issue as a duplicate only when it covers
   substantially the same user-visible problem or requested capability, not merely the same
   component.

Reuse an open or closed issue when it already represents the outcome. Return its link and
state without creating, commenting, or reopening. When several candidates are similar but
the outcome boundary remains materially ambiguous, present the candidates and stop for a
human decision; preventing a duplicate takes precedence over automatic creation.

## Draft the issue

When no substantive duplicate exists, draft a concise issue using only supported facts.
Write the title, headings, and body in clear English even when the user's report is in
another language. Preserve exact command names, identifiers, paths, and error messages.
Translate non-English quotations when their content matters; include the original wording
only when it is evidence whose exact phrasing is relevant. Prefer this structure, omitting
sections with no useful evidence:

```markdown
## Summary

<observed problem or requested capability>

## Current behavior

<what happens now>

## Expected behavior

<what should happen>

## Reproduction

<minimal steps or scenario>

## Impact

<concrete consequence>

## Environment

<version, platform, host application, or relevant configuration>

## Evidence

<safe logs, paths, screenshots, or links>
```

Use a specific, neutral title. Do not claim a root cause unless demonstrated. Do not add
acceptance criteria, implementation prescriptions, labels, assignees, milestones, or
priority unless the user explicitly supplies them and the target repository already
supports the requested metadata.

## Create exactly once

1. Write the body to a temporary file with real Markdown newlines.
2. Immediately repeat the most discriminating duplicate search before mutation.
3. Create exactly one issue with `gh issue create --repo arpadtamasi/a-team`, the resolved
   title, and the body file.
4. Read the created issue back from GitHub and verify its repository, number, title, body,
   state, and URL.

If issue creation returns an ambiguous timeout or transport failure, search for the exact
title and distinctive body content before retrying. Treat a matching newly created issue as
success. Never retry blindly.

Do not create a local Scrum ticket as a side effect. A maintainer may later use
`capture-work` in the package's development repository after an explicit intake decision.

## Validate

Confirm before reporting success:

- the target is exactly `arpadtamasi/a-team`;
- open and closed issues were searched by outcome;
- every plausible match was inspected in full;
- no substantive duplicate existed at creation time;
- exactly one issue was created and read back successfully;
- the title and body contain no invented or sensitive information;
- no existing issue, repository setting, project, label, assignment, milestone, Scrum
  artifact, or source file changed.

## Output

For a duplicate, report the existing issue number, title, state, URL, and the outcome match
that prevented creation.

For a new issue, report its number, title, URL, the duplicate searches performed, and the
successful read-back validation.

For a refusal or ambiguous match, name the missing prerequisite or candidate issues and
confirm that no issue was created.
