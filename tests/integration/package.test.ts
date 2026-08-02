import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { readWorkspace } from "../../src/commands/ui.js";

const cli = resolve("dist/cli/index.js");
const run = (cwd: string, args: string[]) => {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as Record<string, unknown>;
};
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });

describe("dependency-aware package", () => {
  test("creates a backlog package and keeps ticket membership in sync", () => {
    const root = mkdtempSync(join(tmpdir(), "kotta-package-membership-"));
    git(root, "init", "-b", "main");
    writeFileSync(join(root, "README.md"), "fixture\n");
    run(root, ["init"]);
    const pkg = (run(root, ["package", "new", "--title", "Launch batch", "--kind", "milestone", "--goal", "Ship the first slice", "--parallelism", "1"]) as { ok: boolean; data: { id: string; path: string } });
    expect(pkg.ok).toBe(true);
    expect(pkg.data.id).toMatch(/^P-[0-9a-hjkmnp-tv-z]{26}$/);
    expect(basename(pkg.data.path)).toBe(`launch-batch-${pkg.data.id.slice(-8)}.md`);
    const packageFile = readFileSync(pkg.data.path, "utf8");
    expect(packageFile).toContain("parallelism: 1");
    expect(packageFile).toContain("create_findings: true");
    const ticket = (run(root, ["ticket", "new", "--title", "Prepare release", "--type", "feature"]) as { data: { id: string; path: string } }).data;
    expect(run(root, ["package", "add", pkg.data.id, ticket.id])).toMatchObject({ ok: true, data: { tickets: [ticket.id] } });
    expect(readFileSync(ticket.path, "utf8")).toContain(`package: ${pkg.data.id}`);
    expect(run(root, ["package", "remove", pkg.data.id, ticket.id])).toMatchObject({ ok: true, data: { tickets: [] } });
    expect(readFileSync(ticket.path, "utf8")).toContain("package: null");
  });

  test("plans all dependency layers and starts only currently executable tickets", () => {
    const root = mkdtempSync(join(tmpdir(), "kotta-package-"));
    git(root, "init", "-b", "main"); git(root, "config", "user.name", "Kotta Test"); git(root, "config", "user.email", "test@example.com");
    writeFileSync(join(root, "README.md"), "fixture\n"); git(root, "add", "."); git(root, "commit", "-m", "initial");
    run(root, ["init"]);
    const tickets: Array<{ id: string; filename: string }> = [];
    for (const title of ["Build parser", "Expose command"]) {
      const created = run(root, ["ticket", "new", "--title", title, "--type", "feature"]) as { data: { id: string; path: string } };
      const path = created.data.path;
      writeFileSync(path, readFileSync(path, "utf8").replace("Describe the observable outcome.", `${title} works.`).replace("- Define an observable condition.", `- ${title} is observable.`).replace("- Explain how acceptance will be checked.", "- Run integration tests."));
      run(root, ["ticket", "ready", created.data.id, "--approve"]);
      tickets.push({ id: created.data.id, filename: basename(path) });
    }
    const [parser, command] = tickets;
    const second = join(root, ".kotta/ready", command.filename);
    writeFileSync(second, readFileSync(second, "utf8").replace("depends_on: []", `depends_on:\n  - ${parser.id}`));
    const packageId = (run(root, ["package", "new", "--title", "Parser slice", "--kind", "sprint", "--goal", "Deliver a parser slice"]) as { data: { id: string } }).data.id;
    run(root, ["package", "add", packageId, parser.id]);
    run(root, ["package", "add", packageId, command.id]);
    const blockedBacklog = join(root, ".kotta/backlog", command.filename);
    writeFileSync(blockedBacklog, readFileSync(second, "utf8").replace("status: ready", "status: backlog"));
    unlinkSync(second);
    expect(run(root, ["package", "ready", packageId, "--approve"])).toMatchObject({ ok: true, command: "package ready" });
    git(root, "add", "."); git(root, "commit", "-m", "define package"); git(root, "checkout", "-b", `coord/${packageId}`);

    expect(run(root, ["package", "validate", packageId])).toMatchObject({ ok: true, data: { waves: [[parser.id], [command.id]] } });
    expect(run(root, ["package", "start", packageId, "--agent", "codex"])).toMatchObject({ ok: true, data: { started: [parser.id], waiting: [command.id] } });
    expect(existsSync(join(root, ".worktrees", parser.id, ".kotta/claims", `${parser.id}.yaml`))).toBe(true);
    expect(existsSync(join(root, ".worktrees", command.id))).toBe(false);
    expect(run(root, ["package", "status", packageId])).toMatchObject({
      ok: true,
      data: { status: "active", tickets: [{ id: parser.id, state: "active", worktree: expect.stringContaining(`.worktrees/${parser.id}`) }, { id: command.id, state: "backlog" }] },
    });
    const workspace = readWorkspace(root);
    expect(workspace.tickets.filter((ticket) => ticket.id === parser.id)).toEqual([
      expect.objectContaining({ id: parser.id, status: "active", branch: `feat/${parser.id}-build-parser`, assigned_agent: "codex" }),
    ]);
  });
});

/** An initialized repository with one commit, ready for package work. */
function workspaceRepository(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `kotta-package-${label}-`));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  git(root, "add", ".");
  git(root, "commit", "-m", "initial");
  run(root, ["init"]);
  return root;
}

function definedTicket(root: string, title: string) {
  const created = run(root, ["ticket", "new", "--title", title, "--type", "feature"]) as { data: { id: string; path: string } };
  const { id, path } = created.data;
  writeFileSync(path, readFileSync(path, "utf8")
    .replace("Describe the observable outcome.", `${title} works.`)
    .replace("- Define an observable condition.", `- ${title} is observable.`)
    .replace("- Explain how acceptance will be checked.", "- Run integration tests."));
  run(root, ["ticket", "ready", id, "--approve"]);
  return { id, filename: basename(path) };
}

/** Everything a refusal must leave untouched. */
const snapshot = (root: string) => ({
  status: git(root, "status", "--porcelain"),
  head: git(root, "rev-parse", "HEAD"),
  workspace: git(root, "ls-files", ".kotta"),
});

const packageFile = (root: string, state: string, filename: string) => join(root, ".kotta/packages", state, filename);

/**
 * The P-005 shape: a package still in `backlog` whose tickets reached done outside the package
 * flow. Membership is recorded after the fact, exactly as it is for a package nobody ever started.
 */
function backlogPackageWithMembers(label: string, members: Array<"done" | "ready">) {
  const root = workspaceRepository(label);
  const tickets = members.map((_member, index) => definedTicket(root, `Slice ${index + 1}`));
  git(root, "add", ".");
  git(root, "commit", "-m", "define tickets");
  // `ticket cancel` is a supported writer into `done`; it needs a clean tree and commits itself.
  members.forEach((member, index) => {
    if (member === "done") run(root, ["ticket", "cancel", tickets[index].id, "--resolution", "obsolete", "--approve"]);
  });
  const created = run(root, ["package", "new", "--title", `Batch ${label}`, "--kind", "batch", "--goal", "Ship the slice"]) as { data: { id: string; path: string } };
  for (const ticket of tickets) run(root, ["package", "add", created.data.id, ticket.id]);
  git(root, "add", ".");
  git(root, "commit", "-m", "define package");
  return { root, packageId: created.data.id, filename: basename(created.data.path), tickets };
}

describe("package close", () => {
  test("closes a backlog package whose member tickets are all done", () => {
    const { root, packageId, filename, tickets } = backlogPackageWithMembers("closeable", ["done", "done"]);
    const ticketsBefore = tickets.map((ticket) => readFileSync(join(root, ".kotta/done", ticket.filename), "utf8"));

    const closed = run(root, ["package", "close", packageId, "--approve"]);
    expect(closed).toMatchObject({ ok: true, command: "package close", data: { id: packageId, status: "done", changed: true } });
    expect(existsSync(packageFile(root, "backlog", filename))).toBe(false);
    expect(readFileSync(packageFile(root, "done", filename), "utf8")).toContain("status: done");
    expect(run(root, ["package", "status", packageId])).toMatchObject({ ok: true, data: { id: packageId, status: "done" } });
    expect(run(root, ["validate"])).toMatchObject({ ok: true });
    // Closing a package never touches its tickets.
    expect(tickets.map((ticket) => readFileSync(join(root, ".kotta/done", ticket.filename), "utf8"))).toEqual(ticketsBefore);
    expect(git(root, "status", "--porcelain")).toBe("");

    // Re-closing a finished package is a no-op rather than an error.
    const before = snapshot(root);
    expect(run(root, ["package", "close", packageId, "--approve"])).toMatchObject({ ok: true, data: { status: "done", changed: false } });
    expect(snapshot(root)).toEqual(before);
  });

  test("refuses a package with a non-terminal member, names it, and changes nothing", () => {
    const { root, packageId, filename, tickets } = backlogPackageWithMembers("mixed", ["done", "ready"]);
    const before = snapshot(root);
    const packageBefore = readFileSync(packageFile(root, "backlog", filename), "utf8");

    const refusal = attempt(root, ["package", "close", packageId, "--approve"]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain(`${tickets[1].id} is ready`);
    expect(snapshot(root)).toEqual(before);
    expect(readFileSync(packageFile(root, "backlog", filename), "utf8")).toBe(packageBefore);
    expect(existsSync(packageFile(root, "done", filename))).toBe(false);
    expect(existsSync(join(root, ".kotta/ready", tickets[1].filename))).toBe(true);
  });

  test("requires human approval", () => {
    const { root, packageId, filename } = backlogPackageWithMembers("approval", ["done"]);
    const before = snapshot(root);

    const refusal = attempt(root, ["package", "close", packageId]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain("Human close approval is required");
    expect(snapshot(root)).toEqual(before);
    expect(existsSync(packageFile(root, "backlog", filename))).toBe(true);
  });

  test("closing the last ticket completes a package that never went active", () => {
    const root = workspaceRepository("autocomplete");
    const ticket = definedTicket(root, "Only slice");
    const created = run(root, ["package", "new", "--title", "Never started", "--kind", "batch", "--goal", "Ship the slice"]) as { data: { id: string; path: string } };
    const packageId = created.data.id;
    const filename = basename(created.data.path);
    run(root, ["package", "add", packageId, ticket.id]);
    git(root, "add", ".");
    git(root, "commit", "-m", "define package");

    const branch = (run(root, ["ticket", "start", ticket.id, "--agent", "codex"]) as { data: { branch: string } }).data.branch;
    const worktree = join(root, ".worktrees", ticket.id);
    writeFileSync(join(worktree, `${ticket.id}.md`), `# ${ticket.id}\n`);
    git(worktree, "add", ".");
    git(worktree, "commit", "-m", `feat: ${ticket.id}`);
    run(worktree, ["ticket", "review", ticket.id, "--evidence", "verified", "--deviations", "None."]);
    git(root, "merge", "--no-ff", branch, "-m", `merge ${ticket.id}`);
    // The package was never started; completion used to scan `packages/active` only.
    expect(existsSync(packageFile(root, "backlog", filename))).toBe(true);

    run(root, ["ticket", "close", ticket.id, "--approve"]);
    expect(existsSync(packageFile(root, "backlog", filename))).toBe(false);
    expect(readFileSync(packageFile(root, "done", filename), "utf8")).toContain("status: done");
    expect(run(root, ["package", "status", packageId])).toMatchObject({ ok: true, data: { id: packageId, status: "done" } });
    expect(run(root, ["validate"])).toMatchObject({ ok: true });
    expect(git(root, "status", "--porcelain")).toBe("");
  });
});
