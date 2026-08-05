---
name: setup-kotta
description: Initialize Kotta's repository-native contract workspace in a Git repository. Use when a user asks to install, set up, bootstrap, or initialize Kotta for a project.
---

# Set up Kotta

Use the `kotta` CLI as the canonical mutation interface. Do not create or edit `.kotta/` state by hand.

1. Locate the Git repository root and inspect any existing workspace directory and `.gitignore` entry. `.kotta/` is the workspace directory; a directory under the pre-rename name is still read, and `init` refuses to add a second one beside it. The README section "Renamed from A-Team" is the single description of that compatibility, including how to migrate an existing workspace (`git mv` plus a backwards symlink) and what happens when both names are real directories — read it there rather than restating it.
2. Explain any conflict that would prevent a safe initialization. Preserve existing files; never overwrite them silently.
3. Run `kotta init` from the repository root. Add `--json` when structured output is useful.
4. Run `kotta validate` and report actionable validation failures.
5. Summarize the created workspace and configuration, including the base branch and worktree policy.
6. Tell the user that `/define-contract` creates the first executable work contract and `kotta status` shows current state.

The filesystem under `.kotta/` is canonical, but all workflow mutations must pass through Kotta's
validated services so validation, index generation, and transaction safety stay consistent. Contract
chat is the primary human approval surface; the CLI remains the automation and recovery fallback.
