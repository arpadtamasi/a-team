---
name: setup-kotta
description: Initialize Kotta's repository-native ticket workspace in a Git repository. Use when a user asks to install, set up, bootstrap, or initialize Kotta for a project.
---

# Set up Kotta

Use the `kotta` CLI as the canonical mutation interface. Do not create or edit `.kotta/` state by hand.

1. Locate the Git repository root and inspect any existing workspace directory and `.gitignore` entry. A `.a-team/` directory is an existing Kotta workspace under its pre-rename name (D-006): it keeps working untouched, `init` refuses to add a second one beside it, and nothing has to be migrated. If a script or another tool expects the other name, bridge them with a symlink (`ln -s .a-team .kotta`, or `ln -s .kotta .a-team`) instead of renaming.
2. Explain any conflict that would prevent a safe initialization. Preserve existing files; never overwrite them silently.
3. Run `kotta init` from the repository root. Add `--json` when structured output is useful.
4. Run `kotta validate` and report actionable validation failures.
5. Summarize the created workspace and configuration, including the base branch and worktree policy.
6. Tell the user that `/define-ticket` creates the first executable work contract and `kotta status` shows current state.

The filesystem under `.kotta/` is canonical, but all workflow mutations must pass through the CLI so validation, index generation, and transaction safety stay consistent.
