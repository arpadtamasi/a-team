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

describe("dependency-aware package", () => {
  test("creates a backlog package and keeps ticket membership in sync", () => {
    const root = mkdtempSync(join(tmpdir(), "a-team-package-membership-"));
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
    const root = mkdtempSync(join(tmpdir(), "a-team-package-"));
    git(root, "init", "-b", "main"); git(root, "config", "user.name", "A-Team Test"); git(root, "config", "user.email", "test@example.com");
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
    const second = join(root, ".a-team/ready", command.filename);
    writeFileSync(second, readFileSync(second, "utf8").replace("depends_on: []", `depends_on:\n  - ${parser.id}`));
    const packageId = (run(root, ["package", "new", "--title", "Parser slice", "--kind", "sprint", "--goal", "Deliver a parser slice"]) as { data: { id: string } }).data.id;
    run(root, ["package", "add", packageId, parser.id]);
    run(root, ["package", "add", packageId, command.id]);
    const blockedBacklog = join(root, ".a-team/backlog", command.filename);
    writeFileSync(blockedBacklog, readFileSync(second, "utf8").replace("status: ready", "status: backlog"));
    unlinkSync(second);
    expect(run(root, ["package", "ready", packageId, "--approve"])).toMatchObject({ ok: true, command: "package ready" });
    git(root, "add", "."); git(root, "commit", "-m", "define package"); git(root, "checkout", "-b", `coord/${packageId}`);

    expect(run(root, ["package", "validate", packageId])).toMatchObject({ ok: true, data: { waves: [[parser.id], [command.id]] } });
    expect(run(root, ["package", "start", packageId, "--agent", "codex"])).toMatchObject({ ok: true, data: { started: [parser.id], waiting: [command.id] } });
    expect(existsSync(join(root, ".worktrees", parser.id, ".a-team/claims", `${parser.id}.yaml`))).toBe(true);
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
