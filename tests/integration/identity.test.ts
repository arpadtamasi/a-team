import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");
const MINTED = /^[TFP]-[0-9a-hjkmnp-tv-z]{26}$/;

const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
const run = (cwd: string, args: string[]) => {
  const result = attempt(cwd, args);
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as { ok: boolean; data: Record<string, unknown>; errors?: Array<{ code: string; message: string }> };
};

function repository(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `a-team-identity-${label}-`));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "A-Team Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  git(root, "add", ".");
  git(root, "commit", "-m", "initial");
  run(root, ["init"]);
  git(root, "add", "-A");
  git(root, "commit", "-m", "init a-team");
  return root;
}

/** A ticket the way the workspace looked before D-003: a sequential id in a `<id>-slug.md` file. */
function writeSequentialTicket(root: string, id: string, slug: string, extra: Record<string, string> = {}): string {
  const frontmatter = [
    `id: ${id}`, `title: ${slug}`, "status: backlog", "origin: human", "types:", "  - feature",
    "profiles: []", "priority: medium", "risk: medium", "package: null",
    ...Object.entries(extra).map(([key, value]) => `${key}: ${value}`),
    "created_at: 2026-01-01", "updated_at: 2026-01-01",
  ].join("\n");
  const body = ["Outcome", "Scope", "Non-goals", "Acceptance", "Verification", "Constraints", "Open decisions", "Execution notes"]
    .map((heading) => `## ${heading}\n\n${heading === "Open decisions" ? "None." : "Preserved."}`)
    .join("\n\n");
  const path = join(root, ".a-team/backlog", `${id}-${slug}.md`);
  writeFileSync(path, `---\n${frontmatter}\n---\n# ${id} — ${slug}\n\n${body}\n`);
  return path;
}

describe("coordination-free identity (D-003, narrowed by D-010)", () => {
  test("two branches that know nothing about each other mint distinct ids and merge cleanly", () => {
    const root = repository("branches");
    const worktrees = ["alpha", "beta"].map((label) => {
      const path = join(root, `.worktrees/${label}`);
      git(root, "worktree", "add", path, "-b", `feat/${label}`);
      return { label, path };
    });

    // Neither branch can see the other's writes: this is exactly the F-008 race.
    const minted = worktrees.map(({ label, path }) => {
      const ticket = run(path, ["ticket", "new", "--title", `Slice ${label}`, "--type", "feature"]).data as { id: string; path: string };
      const finding = run(path, ["finding", "new", "--title", `Observation ${label}`, "--type", "bug", "--evidence", `${label} evidence`]).data as { id: string; path: string };
      const pkg = run(path, ["package", "new", "--title", `Batch ${label}`, "--kind", "batch", "--goal", `Ship ${label}`]).data as { id: string };
      run(path, ["package", "add", pkg.id, ticket.id]);
      git(path, "add", "-A");
      git(path, "commit", "-m", `chore: capture ${label}`);
      return { label, ticket, finding, pkg };
    });

    for (const entry of minted) {
      expect(entry.ticket.id).toMatch(MINTED);
      expect(entry.finding.id).toMatch(MINTED);
      expect(entry.pkg.id).toMatch(MINTED);
      // The filename is slug + short id suffix, unique on disk even across branches.
      expect(basename(entry.ticket.path)).toBe(`slice-${entry.label}-${entry.ticket.id.slice(-8)}.md`);
    }
    const [alpha, beta] = minted;
    expect(alpha.ticket.id).not.toBe(beta.ticket.id);
    expect(alpha.finding.id).not.toBe(beta.finding.id);
    expect(alpha.pkg.id).not.toBe(beta.pkg.id);

    // Acceptance 5: the generated index is merged, not fought over.
    for (const { label } of worktrees) {
      const merge = spawnSync("git", ["merge", "--no-ff", `feat/${label}`, "-m", `merge ${label}`], { cwd: root, encoding: "utf8" });
      expect(`${merge.stdout}${merge.stderr}`).not.toContain("CONFLICT");
      expect(merge.status).toBe(0);
    }
    const index = readFileSync(join(root, ".a-team/index.md"), "utf8");
    expect(index).not.toContain("<<<<<<<");
    for (const entry of minted) expect(index).toContain(`${entry.finding.id.slice(-8)}`);

    const validation = run(root, ["validate"]);
    expect(validation).toMatchObject({ ok: true });
    expect(readdirSync(join(root, ".a-team/backlog")).filter((name) => name.endsWith(".md"))).toHaveLength(2);

    for (const { path } of worktrees) git(root, "worktree", "remove", path, "--force");
  });

  test("sequential ids stay valid, resolvable and cross-referenced beside minted ones", () => {
    const root = repository("mixed");
    const created = run(root, ["ticket", "new", "--title", "Minted work", "--type", "feature"]).data as { id: string; path: string };

    // Legacy → minted and minted → legacy references, in one mixed workspace.
    const legacyPath = writeSequentialTicket(root, "T-001", "legacy-work", { blocks: `\n  - ${created.id}`, depends_on: "[]" });
    writeFileSync(created.path, readFileSync(created.path, "utf8").replace("depends_on: []", "depends_on:\n  - T-001"));

    expect(run(root, ["validate"])).toMatchObject({ ok: true });
    expect(run(root, ["ticket", "validate", "T-001"])).toMatchObject({ ok: true, data: { id: "T-001", state: "backlog" } });
    expect(run(root, ["ticket", "validate", created.id])).toMatchObject({ ok: true, data: { id: created.id, state: "backlog" } });
    expect(basename(legacyPath)).toBe("T-001-legacy-work.md");

    const status = run(root, ["status"]).data as { allTickets: string[] };
    expect(status.allTickets.sort()).toEqual([created.id, "T-001"].sort());

    // The legacy ticket still moves through the workflow under its own id and filename.
    expect(run(root, ["ticket", "ready", "T-001", "--approve"])).toMatchObject({ ok: true });
    expect(readdirSync(join(root, ".a-team/ready"))).toEqual(["T-001-legacy-work.md"]);
  });

  test("validate reports DUPLICATE_ID when two entities share one id, in either form", () => {
    for (const [label, duplicate] of [["minted", null], ["sequential", "T-001"]] as const) {
      const root = repository(`duplicate-${label}`);
      const source = duplicate
        ? writeSequentialTicket(root, duplicate, "shared-identity")
        : (run(root, ["ticket", "new", "--title", "Shared identity", "--type", "feature"]).data as { path: string }).path;
      // Two distinct entities claiming one id inside a single state directory. One entity left in two
      // state directories is a different failure with a deterministic resolution (T-036).
      const twin = duplicate ? `${duplicate}-second-entity.md` : `second-entity-${basename(source).split("-").pop()}`;
      copyFileSync(source, join(root, ".a-team/backlog", twin));

      const report = attempt(root, ["validate"]);
      expect(report.status).toBe(1);
      const parsed = JSON.parse(report.stdout) as { ok: boolean; errors: Array<{ code: string }> };
      expect(parsed).toMatchObject({
        ok: false,
        errors: expect.arrayContaining([expect.objectContaining({ code: "DUPLICATE_ID" })]),
      });
      expect(parsed.errors.some((error) => error.code === "DUPLICATE_STATE")).toBe(false);
    }
  });
});
