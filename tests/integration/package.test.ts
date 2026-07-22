import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

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
    expect(run(root, ["package", "new", "--title", "Launch batch", "--kind", "milestone", "--goal", "Ship the first slice", "--parallelism", "1"])).toMatchObject({ ok: true, data: { id: "P-001" } });
    const packageFile = readFileSync(join(root, ".a-team/packages/backlog/P-001-launch-batch.md"), "utf8");
    expect(packageFile).toContain("parallelism: 1");
    expect(packageFile).toContain("create_findings: true");
    run(root, ["ticket", "new", "--title", "Prepare release", "--type", "feature"]);
    expect(run(root, ["package", "add", "P-001", "T-001"])).toMatchObject({ ok: true, data: { tickets: ["T-001"] } });
    expect(readFileSync(join(root, ".a-team/backlog/T-001-prepare-release.md"), "utf8")).toContain("package: P-001");
    expect(run(root, ["package", "remove", "P-001", "T-001"])).toMatchObject({ ok: true, data: { tickets: [] } });
    expect(readFileSync(join(root, ".a-team/backlog/T-001-prepare-release.md"), "utf8")).toContain("package: null");
  });

  test("plans all dependency layers and starts only currently executable tickets", () => {
    const root = mkdtempSync(join(tmpdir(), "a-team-package-"));
    git(root, "init", "-b", "main"); git(root, "config", "user.name", "A-Team Test"); git(root, "config", "user.email", "test@example.com");
    writeFileSync(join(root, "README.md"), "fixture\n"); git(root, "add", "."); git(root, "commit", "-m", "initial");
    run(root, ["init"]);
    for (const title of ["Build parser", "Expose command"]) {
      const created = run(root, ["ticket", "new", "--title", title, "--type", "feature"]);
      const id = (created.data as { id: string }).id;
      const slug = title.toLowerCase().replace(" ", "-");
      const path = join(root, `.a-team/backlog/${id}-${slug}.md`);
      writeFileSync(path, readFileSync(path, "utf8").replace("Describe the observable outcome.", `${title} works.`).replace("- Define an observable condition.", `- ${title} is observable.`).replace("- Explain how acceptance will be checked.", "- Run integration tests."));
      run(root, ["ticket", "ready", id, "--approve"]);
    }
    const second = join(root, ".a-team/ready/T-002-expose-command.md");
    writeFileSync(second, readFileSync(second, "utf8").replace("depends_on: []", "depends_on:\n  - T-001"));
    run(root, ["package", "new", "--title", "Parser slice", "--kind", "sprint", "--goal", "Deliver a parser slice"]);
    run(root, ["package", "add", "P-001", "T-001"]);
    run(root, ["package", "add", "P-001", "T-002"]);
    const blocked = join(root, ".a-team/ready/T-002-expose-command.md");
    const blockedBacklog = join(root, ".a-team/backlog/T-002-expose-command.md");
    writeFileSync(blockedBacklog, readFileSync(blocked, "utf8").replace("status: ready", "status: backlog"));
    unlinkSync(blocked);
    expect(run(root, ["package", "ready", "P-001", "--approve"])).toMatchObject({ ok: true, command: "package ready" });
    git(root, "add", "."); git(root, "commit", "-m", "define package"); git(root, "checkout", "-b", "coord/P-001");

    expect(run(root, ["package", "validate", "P-001"])).toMatchObject({ ok: true, data: { waves: [["T-001"], ["T-002"]] } });
    expect(run(root, ["package", "start", "P-001", "--agent", "codex"])).toMatchObject({ ok: true, data: { started: ["T-001"], waiting: ["T-002"] } });
    expect(existsSync(join(root, ".worktrees/T-001/.a-team/claims/T-001.yaml"))).toBe(true);
    expect(existsSync(join(root, ".worktrees/T-002"))).toBe(false);
    expect(run(root, ["package", "status", "P-001"])).toMatchObject({ ok: true, data: { status: "active" } });
  });
});
