import { execFileSync, spawn, spawnSync } from "node:child_process";
import { mkdtempSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { readWorkspace } from "../../src/commands/ui.js";

const cli = resolve("dist/cli/index.js");

function initializedRepository() {
  const root = mkdtempSync(join(tmpdir(), "a-team-ui-cli-"));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("node", [cli, "init", "--json"], { cwd: root });
  return root;
}

function startUi(cwd: string, workspace?: string): Promise<Record<string, unknown>> {
  return new Promise((resolvePromise, reject) => {
    const args = [cli, "ui", "--port", "0", "--json"];
    if (workspace !== undefined) args.push("--workspace", workspace);
    const child = spawn("node", args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`Timed out waiting for UI startup. stdout: ${stdout} stderr: ${stderr}`));
    }, 10_000);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
      const line = stdout.split("\n").find(Boolean);
      if (!line) return;
      clearTimeout(timeout);
      child.kill();
      try {
        resolvePromise(JSON.parse(line) as Record<string, unknown>);
      } catch (error) {
        reject(error);
      }
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("exit", (code) => {
      if (code && !stdout.trim()) {
        clearTimeout(timeout);
        reject(new Error(`UI exited with ${code}. stderr: ${stderr}`));
      }
    });
  });
}

describe("a-team ui workspace option", () => {
  test("documents an optional workspace with the runtime default", () => {
    const help = execFileSync("node", [cli, "ui", "--help"], { encoding: "utf8" });

    expect(help).toContain("--workspace <path>");
    expect(help).toContain("Repository root or .a-team directory (default: \".\")");
    expect(help).not.toContain("required option '--workspace <path>'");
  });

  test("omission resolves like explicit repository-root and .a-team paths", async () => {
    const root = initializedRepository();
    const omitted = await startUi(root);
    const explicitRoot = await startUi(root, ".");
    const explicitWorkspace = await startUi(root, ".a-team");
    const results = [omitted, explicitRoot, explicitWorkspace];

    if (results.every((result) => result.ok === true)) {
      expect(omitted).toMatchObject({ ok: true, command: "ui", data: { workspace: join(realpathSync(root), ".a-team") } });
      expect(explicitRoot).toMatchObject({ data: { workspace: join(realpathSync(root), ".a-team") } });
      expect(explicitWorkspace).toMatchObject({ data: { workspace: join(realpathSync(root), ".a-team") } });
    } else {
      expect(results).toEqual(results.map(() => ({
        ok: false,
        errors: [{ code: "COMMAND_FAILED", message: "listen EPERM: operation not permitted 127.0.0.1" }],
      })));
    }

    expect(readWorkspace(root).workspace).toBe(join(resolve(root), ".a-team"));
    expect(readWorkspace(join(root, ".a-team")).workspace).toBe(join(resolve(root), ".a-team"));
  });

  test("omission outside a workspace has actionable human and JSON errors", () => {
    const outside = mkdtempSync(join(tmpdir(), "a-team-ui-outside-"));
    const human = spawnSync("node", [cli, "ui", "--port", "0"], { cwd: outside, encoding: "utf8" });
    const json = spawnSync("node", [cli, "ui", "--port", "0", "--json"], { cwd: outside, encoding: "utf8" });
    const canonicalOutside = realpathSync(outside);

    expect(human.status).toBe(1);
    expect(human.stderr).toContain(`No A-Team workspace found at ${canonicalOutside}.`);
    expect(json.status).toBe(1);
    expect(JSON.parse(json.stdout)).toMatchObject({
      ok: false,
      errors: [{ code: "COMMAND_FAILED", message: `No A-Team workspace found at ${canonicalOutside}.` }],
    });
  });
});
