import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { classifyBaseUpdate, classifyIntegration, coordinatorBranchName, linkedWorktrees } from "../../src/git/coordinator.js";
import { readWorkspaceConfig } from "../../src/core/config.js";

const cli = resolve("dist/cli/index.js");
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const run = (cwd: string, args: string[]) => {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as { ok: boolean; data: Record<string, unknown> };
};
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });

/** Everything a refusal must leave untouched. */
const snapshot = (root: string) => ({
  branch: git(root, "branch", "--show-current"),
  status: git(root, "status", "--porcelain"),
  heads: git(root, "for-each-ref", "--format=%(refname) %(objectname)", "refs/heads"),
  remotes: git(root, "for-each-ref", "--format=%(refname) %(objectname)", "refs/remotes"),
});

function definedTicket(root: string, title: string) {
  const created = run(root, ["ticket", "new", "--title", title, "--type", "feature"]);
  const { id, path } = created.data as { id: string; path: string };
  writeFileSync(path, readFileSync(path, "utf8")
    .replace("Describe the observable outcome.", `${title} works.`)
    .replace("- Define an observable condition.", `- ${title} is observable.`)
    .replace("- Explain how acceptance will be checked.", "- Run integration tests."));
  run(root, ["ticket", "ready", id, "--approve"]);
  return { id, filename: basename(path) };
}

/** An initialized repository whose `main` tracks a bare remote, with one ready package. */
function workspaceWithPackage(label: string, options: { tickets?: number } = {}) {
  const remote = mkdtempSync(join(tmpdir(), `kotta-coord-remote-${label}-`));
  execFileSync("git", ["init", "--bare", "-b", "main"], { cwd: remote });
  const root = mkdtempSync(join(tmpdir(), `kotta-coord-${label}-`));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  git(root, "add", ".");
  git(root, "commit", "-m", "initial");
  run(root, ["init"]);
  const tickets = Array.from({ length: options.tickets ?? 1 }, (_unused, index) => definedTicket(root, `Deliver slice ${index + 1}`));
  const ids = tickets.map((ticket) => ticket.id);
  const packageId = (run(root, ["package", "new", "--title", `Coordinated ${label}`, "--kind", "milestone", "--goal", "Ship the slice"]).data as { id: string }).id;
  for (const id of ids) run(root, ["package", "add", packageId, id]);
  run(root, ["package", "ready", packageId, "--approve"]);
  git(root, "add", ".");
  git(root, "commit", "-m", "define package");
  git(root, "remote", "add", "origin", remote);
  git(root, "push", "-u", "origin", "main");
  return { root, remote, ids, tickets, packageId };
}

function findPackageFile(root: string, packageId: string): string {
  const suffix = `-${packageId.slice(-8)}.md`;
  for (const state of ["backlog", "ready", "active", "done"]) {
    const directory = join(root, ".kotta/packages", state);
    if (!existsSync(directory)) continue;
    const match = readdirSync(directory).find((name) => name.endsWith(suffix));
    if (match) return join(directory, match);
  }
  throw new Error("package file not found");
}

/** Drives the package to done with its coordinator commit on `coord/P-001`, without integrating it. */
function completePackage(root: string, packageId: string, ids: string[]) {
  run(root, ["package", "start", packageId, "--agent", "codex"]);
  for (const id of ids) {
    const worktree = join(root, ".worktrees", id);
    writeFileSync(join(worktree, `${id}.md`), `# ${id}\n`);
    git(worktree, "add", ".");
    git(worktree, "commit", "-m", `feat: ${id}`);
    run(worktree, ["ticket", "review", id, "--evidence", "verified", "--deviations", "None."]);
    git(root, "merge", "--no-ff", git(worktree, "branch", "--show-current"), "-m", `merge ${id}`);
    run(root, ["ticket", "close", id, "--approve"]);
  }
}

describe("coordinator helpers", () => {
  test("the coordinator branch name is deterministic", () => {
    expect(coordinatorBranchName("P-001")).toBe("coord/P-001");
    expect(coordinatorBranchName("P-042")).toBe("coord/P-042");
  });

  test("the configured base branch counts as protected even when unlisted", () => {
    const { root, packageId } = workspaceWithPackage("config");
    const configPath = join(root, ".kotta/config.yaml");
    writeFileSync(configPath, readFileSync(configPath, "utf8").replace("base_branch: main", "base_branch: trunk"));
    const config = readWorkspaceConfig(root);
    expect(config.baseBranch).toBe("trunk");
    expect(config.protectedBranches).toContain("trunk");
    expect(config.protectedBranches).toContain("main");
  });

  test("integration is decided by ancestry, not by branch naming", () => {
    const { root, ids, packageId } = workspaceWithPackage("ancestry");
    completePackage(root, packageId, ids);
    expect(classifyIntegration(root, `coord/${packageId}`, "main")).toMatchObject({ integrated: false, reason: "unmerged" });
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${packageId}`, "-m", "integrate");
    expect(classifyIntegration(root, `coord/${packageId}`, "main")).toMatchObject({ integrated: true, via: "local-base", ref: "main" });
  });

  test("base update classification separates current, fast-forward and diverged", () => {
    const { root, packageId } = workspaceWithPackage("baseupdate");
    expect(classifyBaseUpdate(root, "main")).toMatchObject({ kind: "current" });
    writeFileSync(join(root, "remote-only.md"), "remote\n");
    git(root, "add", "."); git(root, "commit", "-m", "remote work"); git(root, "push", "origin", "main");
    git(root, "reset", "--hard", "HEAD~1");
    expect(classifyBaseUpdate(root, "main")).toMatchObject({ kind: "fast-forward", remote: "origin/main" });
    writeFileSync(join(root, "local-only.md"), "local\n");
    git(root, "add", "."); git(root, "commit", "-m", "local work");
    expect(classifyBaseUpdate(root, "main")).toMatchObject({ kind: "diverged" });
  });

  test("linked worktrees are listed with the branch each holds", () => {
    const { root, ids, packageId } = workspaceWithPackage("worktrees");
    run(root, ["package", "start", packageId, "--agent", "codex"]);
    const linked = linkedWorktrees(root);
    expect(linked.some((entry) => entry.path.endsWith(`/${ids[0]}`))).toBe(true);
    expect(linked.every((entry) => entry.path !== root)).toBe(true);
  });
});

describe("package start owns the coordinator branch", () => {
  test("starting from a clean base creates the branch and records its metadata", () => {
    const { root, packageId } = workspaceWithPackage("create");
    const baseCommit = git(root, "rev-parse", "HEAD");
    const started = run(root, ["package", "start", packageId, "--agent", "codex"]);
    expect(started.data.coordinator).toMatchObject({ branch: `coord/${packageId}`, base_branch: "main", action: "created" });
    expect(git(root, "branch", "--show-current")).toBe(`coord/${packageId}`);
    const file = readFileSync(findPackageFile(root, packageId), "utf8");
    expect(file).toContain(`branch: coord/${packageId}`);
    expect(file).toContain("base_branch: main");
    expect(file).toContain(`base_commit: ${baseCommit}`);
  });

  test("repeating start on the recorded branch is idempotent", () => {
    const { root, packageId } = workspaceWithPackage("resume");
    run(root, ["package", "start", packageId, "--agent", "codex"]);
    const before = snapshot(root);
    const again = run(root, ["package", "start", packageId, "--agent", "codex"]);
    expect(again.data.coordinator).toMatchObject({ branch: `coord/${packageId}`, action: "resumed" });
    expect(snapshot(root)).toEqual(before);
  });

  test("starting from an unrelated branch is refused without mutation", () => {
    const { root, packageId } = workspaceWithPackage("unrelated");
    run(root, ["package", "start", packageId, "--agent", "codex"]);
    git(root, "switch", "-c", "spike/elsewhere");
    const before = snapshot(root);
    const refusal = attempt(root, ["package", "start", packageId, "--agent", "codex"]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain(`coordinates on 'coord/${packageId}'`);
    expect(snapshot(root)).toEqual(before);
  });

  test("an existing conventional branch is never overwritten by start", () => {
    const { root, packageId } = workspaceWithPackage("collide");
    git(root, "branch", `coord/${packageId}`);
    const before = snapshot(root);
    const refusal = attempt(root, ["package", "start", packageId, "--agent", "codex"]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain(`already exists while package ${packageId} records no coordinator`);
    expect(snapshot(root)).toEqual(before);
  });
});

describe("package finalize", () => {
  test("refuses an unmerged coordinator branch and changes nothing", () => {
    const { root, ids, packageId } = workspaceWithPackage("unmerged");
    completePackage(root, packageId, ids);
    const before = snapshot(root);
    const refusal = attempt(root, ["package", "finalize", packageId]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain("is not an ancestor of");
    expect(snapshot(root)).toEqual(before);
    expect(run(root, ["package", "status", packageId]).data.coordinator).toMatchObject({ state: "done-unintegrated", cleanup_pending: false });
  });

  test("switches to the base, fast-forwards it and deletes the merged branch", () => {
    const { root, remote, ids, packageId } = workspaceWithPackage("success");
    completePackage(root, packageId, ids);
    // Integration happens elsewhere: push the coordinator branch and merge it into the remote base.
    git(root, "push", "origin", `coord/${packageId}`);
    const integrator = mkdtempSync(join(tmpdir(), "kotta-coord-integrator-"));
    execFileSync("git", ["clone", remote, integrator]);
    execFileSync("git", ["config", "user.name", "Integrator"], { cwd: integrator });
    execFileSync("git", ["config", "user.email", "integrator@example.com"], { cwd: integrator });
    execFileSync("git", ["merge", "--no-ff", `origin/coord/${packageId}`, "-m", `integrate ${packageId}`], { cwd: integrator });
    execFileSync("git", ["push", "origin", "main"], { cwd: integrator });
    git(root, "fetch", "origin");

    expect(run(root, ["package", "status", packageId]).data.coordinator).toMatchObject({ state: "cleanup-pending", cleanup_pending: true, integration: { integrated: true, via: "remote-base" } });
    const finalized = run(root, ["package", "finalize", packageId]);
    expect(finalized.data).toMatchObject({ state: "cleaned", branch: `coord/${packageId}` });
    expect(finalized.data.actions).toEqual(["switched-to:main", "fast-forwarded:main", `deleted-local-branch:coord/${packageId}`]);
    expect(git(root, "branch", "--show-current")).toBe("main");
    expect(git(root, "for-each-ref", "--format=%(refname)", "refs/heads")).not.toContain(`coord/${packageId}`);
    // main carries the remote head plus the local finalize commit; nothing was reset away.
    expect(() => git(root, "merge-base", "--is-ancestor", "origin/main", "main")).not.toThrow();
    expect(readFileSync(findPackageFile(root, packageId), "utf8")).toMatch(/cleaned_at: '?\d{4}-\d{2}-\d{2}/);
    // The remote coordinator branch is never touched.
    expect(git(root, "ls-remote", "--heads", "origin", `coord/${packageId}`)).toContain(`coord/${packageId}`);
  });

  test("re-running after success is a no-op", () => {
    const { root, remote, ids, packageId } = workspaceWithPackage("noop");
    completePackage(root, packageId, ids);
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${packageId}`, "-m", "integrate");
    git(root, "push", "origin", "main");
    run(root, ["package", "finalize", packageId]);
    const before = snapshot(root);
    const again = run(root, ["package", "finalize", packageId]);
    expect(again.data).toMatchObject({ state: "cleaned", actions: [] });
    expect(snapshot(root)).toEqual(before);
    expect(remote).toBeTruthy();
  });

  test("refuses a dirty working tree and leaves it untouched", () => {
    const { root, ids, packageId } = workspaceWithPackage("dirty");
    completePackage(root, packageId, ids);
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${packageId}`, "-m", "integrate");
    writeFileSync(join(root, "scratch.md"), "uncommitted\n");
    const before = snapshot(root);
    const refusal = attempt(root, ["package", "finalize", packageId]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain("has pending changes");
    expect(snapshot(root)).toEqual(before);
    expect(readFileSync(join(root, "scratch.md"), "utf8")).toBe("uncommitted\n");
    expect(run(root, ["package", "status", packageId]).data.coordinator).toMatchObject({ state: "blocked-dirty" });
  });

  test("refuses while a claim or a ticket worktree is still linked", () => {
    const { root, ids, packageId } = workspaceWithPackage("inuse", { tickets: 2 });
    // Parallelism 2 starts both tickets; only the first is carried to done.
    completePackage(root, packageId, [ids[0]]);
    // Force the package into done while the second ticket is still claimed and checked out.
    const active = findPackageFile(root, packageId);
    writeFileSync(active, readFileSync(active, "utf8").replace("status: active", "status: done"));
    const doneDirectory = join(root, ".kotta/packages/done");
    execFileSync("mkdir", ["-p", doneDirectory]);
    execFileSync("git", ["mv", active, join(doneDirectory, basename(active))], { cwd: root });
    git(root, "add", "-A");
    git(root, "commit", "-m", "force package done");
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${packageId}`, "-m", "integrate");
    const before = snapshot(root);
    const refusal = attempt(root, ["package", "finalize", packageId]);
    expect(refusal.status).toBe(1);
    const output = refusal.stdout + refusal.stderr;
    expect(output).toContain("Active claims remain");
    expect(output).toContain("Ticket worktrees are still linked");
    expect(snapshot(root)).toEqual(before);
    expect(existsSync(join(root, ".worktrees", ids[1]))).toBe(true);
  });

  test("refuses a diverged local base without resetting anything", () => {
    const { root, ids, packageId } = workspaceWithPackage("diverged");
    completePackage(root, packageId, ids);
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${packageId}`, "-m", "integrate");
    git(root, "push", "origin", "main");
    // Rewrite the local base so it no longer fast-forwards onto its remote.
    git(root, "reset", "--hard", "HEAD~1");
    git(root, "merge", "--no-ff", `coord/${packageId}`, "-m", "integrate again");
    const before = snapshot(root);
    const refusal = attempt(root, ["package", "finalize", packageId]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain("have diverged");
    expect(snapshot(root)).toEqual(before);
    expect(run(root, ["package", "status", packageId]).data.coordinator).toMatchObject({ state: "blocked-diverged" });
  });

  test("refuses when another worktree holds the coordinator branch", () => {
    const { root, ids, packageId } = workspaceWithPackage("held");
    completePackage(root, packageId, ids);
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${packageId}`, "-m", "integrate");
    const held = join(root, ".worktrees", "held");
    git(root, "worktree", "add", held, `coord/${packageId}`);
    const before = snapshot(root);
    const refusal = attempt(root, ["package", "finalize", packageId]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain(`Another worktree holds coord/${packageId}`);
    expect(snapshot(root)).toEqual(before);
    git(root, "worktree", "remove", held);
  });

  test("completes the remaining cleanup after an interruption that already switched branches", () => {
    const { root, ids, packageId } = workspaceWithPackage("resumefinalize");
    completePackage(root, packageId, ids);
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${packageId}`, "-m", "integrate");
    // Simulate a crash between the switch and the delete: on the base, branch still present.
    expect(git(root, "branch", "--show-current")).toBe("main");
    const finalized = run(root, ["package", "finalize", packageId]);
    expect(finalized.data.actions).toEqual([`deleted-local-branch:coord/${packageId}`]);
    expect(git(root, "for-each-ref", "--format=%(refname)", "refs/heads")).not.toContain(`coord/${packageId}`);
  });

  test("concurrent finalization leaves exactly one deletion and no error", async () => {
    const { root, ids, packageId } = workspaceWithPackage("concurrent");
    completePackage(root, packageId, ids);
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${packageId}`, "-m", "integrate");
    const both = await Promise.all([0, 1].map(() => new Promise<{ status: number | null; output: string }>((done) => {
      const child = spawnSync("node", [cli, "package", "finalize", packageId, "--json"], { cwd: root, encoding: "utf8" });
      done({ status: child.status, output: child.stdout + child.stderr });
    })));
    const deletions = both.filter((result) => result.output.includes(`deleted-local-branch:coord/${packageId}`));
    expect(deletions).toHaveLength(1);
    expect(both.filter((result) => result.status === 0)).toHaveLength(2);
    expect(git(root, "for-each-ref", "--format=%(refname)", "refs/heads")).not.toContain(`coord/${packageId}`);
  });

  test("refuses before the package is done", () => {
    const { root, packageId } = workspaceWithPackage("notdone");
    run(root, ["package", "start", packageId, "--agent", "codex"]);
    const before = snapshot(root);
    const refusal = attempt(root, ["package", "finalize", packageId]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain("coordinator cleanup runs only after the package is done");
    expect(snapshot(root)).toEqual(before);
  });
});

describe("legacy packages without coordinator metadata", () => {
  test("an unambiguous conventional branch with ancestry proof is adopted and cleaned", () => {
    const { root, ids, packageId } = workspaceWithPackage("legacy");
    completePackage(root, packageId, ids);
    // Strip the metadata the way a pre-T-015 package file looked.
    const file = findPackageFile(root, packageId);
    writeFileSync(file, readFileSync(file, "utf8").replace(/coordinator:\n(?:  .*\n)+/, ""));
    git(root, "add", "."); git(root, "commit", "-m", "strip coordinator metadata");
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${packageId}`, "-m", "integrate");
    expect(run(root, ["package", "status", packageId]).data.coordinator).toMatchObject({ legacy: true, state: "cleanup-pending" });
    const finalized = run(root, ["package", "finalize", packageId]);
    expect(finalized.data.actions).toContain(`adopted-legacy-branch:coord/${packageId}`);
    expect(git(root, "for-each-ref", "--format=%(refname)", "refs/heads")).not.toContain(`coord/${packageId}`);
  });

  test("a legacy package stops with guidance while its branch is unmerged", () => {
    const { root, ids, packageId } = workspaceWithPackage("legacyunmerged");
    completePackage(root, packageId, ids);
    const file = findPackageFile(root, packageId);
    writeFileSync(file, readFileSync(file, "utf8").replace(/coordinator:\n(?:  .*\n)+/, ""));
    git(root, "add", "."); git(root, "commit", "-m", "strip coordinator metadata");
    const before = snapshot(root);
    const refusal = attempt(root, ["package", "finalize", packageId]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain("is not an ancestor of");
    expect(snapshot(root)).toEqual(before);
  });

  test("the P-002 shape: refuses while the checkout still carries changes, succeeds once they are handled", () => {
    const { root, ids, packageId } = workspaceWithPackage("p002shape");
    completePackage(root, packageId, ids);
    const file = findPackageFile(root, packageId);
    writeFileSync(file, readFileSync(file, "utf8").replace(/coordinator:\n(?:  .*\n)+/, ""));
    git(root, "add", "."); git(root, "commit", "-m", "strip coordinator metadata");
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${packageId}`, "-m", "integrate");
    // P-002 was left on its merged coordinator branch with unrelated next-package work in the tree.
    writeFileSync(join(root, "next-package-notes.md"), "P-003 planning\n");
    const blocked = attempt(root, ["package", "finalize", packageId]);
    expect(blocked.status).toBe(1);
    expect(blocked.stdout + blocked.stderr).toContain("has pending changes");
    expect(readFileSync(join(root, "next-package-notes.md"), "utf8")).toBe("P-003 planning\n");

    git(root, "add", "."); git(root, "commit", "-m", "keep the next-package notes");
    const finalized = run(root, ["package", "finalize", packageId]);
    expect(finalized.data.actions).toContain(`deleted-local-branch:coord/${packageId}`);
    expect(existsSync(join(root, "next-package-notes.md"))).toBe(true);
  });

  test("a legacy package with no conventional branch has nothing to clean", () => {
    const { root, ids, packageId } = workspaceWithPackage("legacynone");
    completePackage(root, packageId, ids);
    const file = findPackageFile(root, packageId);
    writeFileSync(file, readFileSync(file, "utf8").replace(/coordinator:\n(?:  .*\n)+/, ""));
    git(root, "add", "."); git(root, "commit", "-m", "strip coordinator metadata");
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${packageId}`, "-m", "integrate");
    git(root, "branch", "-d", `coord/${packageId}`);
    const finalized = run(root, ["package", "finalize", packageId]);
    expect(finalized.data).toMatchObject({ state: "cleaned", actions: [] });
  });
});

describe("cleanup never touches unrelated resources", () => {
  test("the package file, ticket files and remote refs survive every refusal", () => {
    const { root, tickets, packageId } = workspaceWithPackage("integrity");
    completePackage(root, packageId, tickets.map((ticket) => ticket.id));
    const packageBefore = readFileSync(findPackageFile(root, packageId), "utf8");
    const remoteBefore = git(root, "ls-remote", "origin");
    attempt(root, ["package", "finalize", packageId]);
    expect(readFileSync(findPackageFile(root, packageId), "utf8")).toBe(packageBefore);
    expect(git(root, "ls-remote", "origin")).toBe(remoteBefore);
    for (const ticket of tickets) expect(existsSync(join(root, ".kotta/done", ticket.filename))).toBe(true);
  });
});
