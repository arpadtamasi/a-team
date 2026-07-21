# Demo workflow

1. A human requested filtered course exports. `T-014` was captured in backlog.
2. Ticket definition applied the `ui` and `workflow` profiles and moved it to
   `ready`.
3. [`P-012`](packages/active/P-012-export-sprint.md) grouped `T-014`, `T-015`,
   and `T-018` for dependency-aware execution.
4. Execution claimed each started ticket on an isolated branch and worktree.
5. While implementing `T-014`, the agent found divergent archived-course
   permission checks and created `F-032` instead of expanding scope.
6. `T-014` moved through review with evidence and is now
   [`done`](done/T-014-add-filtered-export.md).
7. A human reviewed `F-032`; the finding is
   [`resolved`](findings/resolved/F-032-divergent-permission-checks.md) and its
   follow-up is [`T-019`](backlog/T-019-unify-archived-course-permissions.md).

`T-015` and `T-018` remain in [`ready/`](ready/) to make the package's remaining
work visible.
