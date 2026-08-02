import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

/**
 * T-036 — directory-as-state duplication (second root of F-008).
 *
 * Every fixture here is a real Git merge: two branches carry one entity into different state
 * directories, and the merge keeps both copies. Only the resolution differs between them.
 */

const cli = resolve("dist/cli/index.js");

const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
const run = (cwd: string, args: string[]) => {
  const result = attempt(cwd, args);
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as { ok: boolean; data: Record<string, unknown> };
};

interface Report {
  ok: boolean;
  errors: Array<{ code: string; message: string; path?: string }>;
}

function repository(label: string, options: { detectRenames?: boolean } = {}): string {
  // realpath: on macOS the temp directory is a symlink, and the CLI reports resolved paths.
  const root = realpathSync(mkdtempSync(join(tmpdir(), `a-team-duplicate-${label}-`)));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "A-Team Test");
  git(root, "config", "user.email", "test@example.com");
  // A merge only pairs a cross-directory move as delete+add while rename detection is on; a large
  // merge (or `merge.renames=false`) drops it, and then both copies survive. Both shapes are real.
  if (options.detectRenames === false) git(root, "config", "merge.renames", "false");
  run(root, ["init"]);
  git(root, "add", "-A");
  git(root, "commit", "-m", "init a-team");
  return root;
}

/** Finish a conflicted merge the way a hurried human does: keep both sides' files verbatim. */
function keepBothSides(root: string, files: Array<{ branch: string; path: string }>): void {
  for (const file of files) git(root, "checkout", file.branch, "--", file.path);
  git(root, "add", "-A");
  git(root, "commit", "-m", "merge: kept both copies");
}

describe("one entity in two state directories (T-036)", () => {
  test("validate names both places after a merge, and dedupe keeps the furthest-advanced copy", () => {
    const root = repository("ticket");
    const ticket = run(root, ["ticket", "new", "--title", "Merge me", "--type", "feature"]).data as { id: string; path: string };
    const filename = basename(ticket.path);
    git(root, "add", "-A");
    git(root, "commit", "-m", "capture ticket");

    // Branch one readies the ticket; main cancels it. Both moves are supported writers.
    git(root, "checkout", "-b", "branch-ready");
    run(root, ["ticket", "ready", ticket.id, "--approve"]);
    git(root, "add", "-A");
    git(root, "commit", "-m", "ready");
    git(root, "checkout", "main");
    run(root, ["ticket", "cancel", ticket.id, "--resolution", "obsolete", "--approve"]);

    const merge = spawnSync("git", ["merge", "--no-ff", "branch-ready", "-m", "merge"], { cwd: root, encoding: "utf8" });
    expect(`${merge.stdout}${merge.stderr}`).toContain("CONFLICT (rename/rename)");
    keepBothSides(root, [
      { branch: "branch-ready", path: `.a-team/ready/${filename}` },
      { branch: "main", path: `.a-team/done/${filename}` },
    ]);
    const ready = join(root, ".a-team/ready", filename);
    const done = join(root, ".a-team/done", filename);
    expect(existsSync(ready) && existsSync(done)).toBe(true);

    // Acceptance 1: the duplicate is its own error case and names both places.
    const validation = attempt(root, ["validate"]);
    expect(validation.status).toBe(1);
    const report = JSON.parse(validation.stdout) as Report;
    const duplicate = report.errors.find((error) => error.code === "DUPLICATE_STATE");
    expect(duplicate).toBeDefined();
    expect(duplicate?.message).toContain(ready);
    expect(duplicate?.message).toContain(done);
    expect(report.errors.some((error) => error.code === "DUPLICATE_ID")).toBe(false);

    // Acceptance 5: without approval nothing is removed.
    const unapproved = attempt(root, ["ticket", "dedupe", ticket.id]);
    expect(unapproved.status).toBe(1);
    expect(unapproved.stdout).toContain("Human approval is required");
    expect(existsSync(ready) && existsSync(done)).toBe(true);

    // Acceptance 2: the later lifecycle state wins and the discarded copy is named — here in the
    // human-readable output; the package test below asserts the same in the structured result.
    const resolved = spawnSync("node", [cli, "ticket", "dedupe", ticket.id, "--approve"], { cwd: root, encoding: "utf8" });
    expect(resolved.status).toBe(0);
    expect(resolved.stdout).toContain(`Kept ${ticket.id} at ${done} (done)`);
    expect(resolved.stdout).toContain(`dropped ${ready} (ready`);
    expect(existsSync(ready)).toBe(false);
    expect(existsSync(done)).toBe(true);
    expect(run(root, ["validate"])).toMatchObject({ ok: true });

    // Re-running finds a single copy and refuses rather than silently doing nothing.
    const again = attempt(root, ["ticket", "dedupe", ticket.id, "--approve"]);
    expect(again.status).toBe(1);
    expect(again.stdout).toContain("nothing to resolve");
  });

  test("a package duplicated across packages/backlog and packages/ready resolves the same way", () => {
    const root = repository("package", { detectRenames: false });
    const first = run(root, ["ticket", "new", "--title", "First slice", "--type", "feature"]).data as { id: string };
    const second = run(root, ["ticket", "new", "--title", "Second slice", "--type", "feature"]).data as { id: string };
    run(root, ["ticket", "ready", first.id, "--approve"]);
    const pkg = run(root, ["package", "new", "--title", "Batch one", "--kind", "batch", "--goal", "Ship the slices"]).data as { id: string; path: string };
    run(root, ["package", "add", pkg.id, first.id]);
    const filename = basename(pkg.path);
    git(root, "add", "-A");
    git(root, "commit", "-m", "capture package");

    // The P-015 shape: one branch readies the package while main keeps editing it in backlog.
    git(root, "checkout", "-b", "branch-ready");
    run(root, ["package", "ready", pkg.id, "--approve"]);
    git(root, "add", "-A");
    git(root, "commit", "-m", "ready package");
    git(root, "checkout", "main");
    run(root, ["package", "add", pkg.id, second.id]);
    git(root, "add", "-A");
    git(root, "commit", "-m", "add second ticket");

    const merge = spawnSync("git", ["merge", "--no-ff", "branch-ready", "-m", "merge"], { cwd: root, encoding: "utf8" });
    expect(`${merge.stdout}${merge.stderr}`).toContain("CONFLICT (modify/delete)");
    git(root, "add", "-A");
    git(root, "commit", "-m", "merge: kept both copies");
    const backlog = join(root, ".a-team/packages/backlog", filename);
    const ready = join(root, ".a-team/packages/ready", filename);
    expect(existsSync(backlog) && existsSync(ready)).toBe(true);

    const validation = attempt(root, ["validate"]);
    expect(validation.status).toBe(1);
    const duplicate = (JSON.parse(validation.stdout) as Report).errors.find((error) => error.code === "DUPLICATE_STATE");
    expect(duplicate?.message).toContain(backlog);
    expect(duplicate?.message).toContain(ready);
    expect(duplicate?.message).toContain(`a-team package dedupe ${pkg.id} --approve`);

    expect(attempt(root, ["package", "dedupe", pkg.id]).status).toBe(1);
    expect(existsSync(backlog)).toBe(true);

    const resolved = run(root, ["package", "dedupe", pkg.id, "--approve"]).data as {
      kept: { state: string; path: string };
      dropped: Array<{ state: string; path: string; differing_fields: string[] }>;
    };
    expect(resolved.kept).toEqual({ state: "ready", path: ready });
    // The dropped copy carried a different membership list; the resolution says so instead of hiding it.
    expect(resolved.dropped).toEqual([{ state: "backlog", path: backlog, differing_fields: ["tickets"] }]);
    expect(existsSync(backlog)).toBe(false);
  });

  test("dedupe stops when the two copies have different bodies", () => {
    const root = repository("diverged", { detectRenames: false });
    const ticket = run(root, ["ticket", "new", "--title", "Contested", "--type", "feature"]).data as { id: string; path: string };
    const filename = basename(ticket.path);
    git(root, "add", "-A");
    git(root, "commit", "-m", "capture ticket");

    git(root, "checkout", "-b", "branch-ready");
    run(root, ["ticket", "ready", ticket.id, "--approve"]);
    git(root, "add", "-A");
    git(root, "commit", "-m", "ready");
    git(root, "checkout", "main");

    // Main rewrites the ticket body in place while the other branch moves it to ready.
    const definition = join(root, "definition.md");
    const body = ["Outcome", "Scope", "Non-goals", "Acceptance", "Verification", "Constraints", "Open decisions", "Execution notes"]
      .map((heading) => `## ${heading}\n\n${heading === "Open decisions" ? "None." : `Rewritten ${heading.toLowerCase()} that the other branch never saw.`}`)
      .join("\n\n");
    writeFileSync(definition, `---\ntypes:\n  - feature\n---\n${body}\n`);
    run(root, ["ticket", "define", ticket.id, "--from", definition]);
    git(root, "add", "-A");
    git(root, "commit", "-m", "rewrite body");

    const merge = spawnSync("git", ["merge", "--no-ff", "branch-ready", "-m", "merge"], { cwd: root, encoding: "utf8" });
    expect(`${merge.stdout}${merge.stderr}`).toContain("CONFLICT (modify/delete)");
    git(root, "add", "-A");
    git(root, "commit", "-m", "merge: kept both copies");
    const backlog = join(root, ".a-team/backlog", filename);
    const ready = join(root, ".a-team/ready", filename);
    expect(existsSync(backlog) && existsSync(ready)).toBe(true);

    // Acceptance 3: divergent bodies are not a machine decision.
    const refused = attempt(root, ["ticket", "dedupe", ticket.id, "--approve"]);
    expect(refused.status).toBe(1);
    expect(refused.stdout).toContain("different bodies");
    expect(refused.stdout).toContain(backlog);
    expect(refused.stdout).toContain(ready);
    expect(existsSync(backlog) && existsSync(ready)).toBe(true);
    expect((JSON.parse(attempt(root, ["validate"]).stdout) as Report).errors.some((error) => error.code === "DUPLICATE_STATE")).toBe(true);
  });

  test("dedupe refuses an identifier collision inside one state directory", () => {
    const root = repository("collision");
    const ticket = run(root, ["ticket", "new", "--title", "Shared identity", "--type", "feature"]).data as { id: string; path: string };
    const twin = join(root, ".a-team/backlog", `other-${basename(ticket.path)}`);
    copyFileSync(ticket.path, twin);
    writeFileSync(twin, readFileSync(twin, "utf8").replace("title: Shared identity", "title: A different entity"));

    const refused = attempt(root, ["ticket", "dedupe", ticket.id, "--approve"]);
    expect(refused.status).toBe(1);
    expect(refused.stdout).toContain("identifier collision");
    expect(existsSync(twin)).toBe(true);
  });
});
