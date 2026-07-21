---
name: setup-a-team
description: Initialize A-Team's repository-native ticket workspace in a Git repository. Use when a user asks to install, set up, bootstrap, or initialize A-Team for a project.
---

# Set up A-Team

Use the `a-team` CLI as the canonical mutation interface. Do not create or edit `.a-team/` state by hand.

1. Locate the Git repository root and inspect any existing `.a-team/` directory and `.gitignore` entry.
2. Explain any conflict that would prevent a safe initialization. Preserve existing files; never overwrite them silently.
3. Run `a-team init` from the repository root. Add `--json` when structured output is useful.
4. Run `a-team validate` and report actionable validation failures.
5. Summarize the created workspace and configuration, including the base branch and worktree policy.
6. Tell the user that `/define-ticket` creates the first executable work contract and `a-team status` shows current state.

The filesystem under `.a-team/` is canonical, but all workflow mutations must pass through the CLI so validation, index generation, and transaction safety stay consistent.
