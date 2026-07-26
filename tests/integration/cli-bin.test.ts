import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

// Regression guard for finding F-004: `tsc` emits dist/cli/index.js without the
// executable bit, so the published/linked `a-team` binary fails with
// "permission denied". build:cli must restore mode 0755 (scripts/chmod-bin.mjs).
const cli = resolve("dist/cli/index.js");

describe("a-team CLI binary", () => {
  test("ships with the executable bit set", () => {
    const mode = statSync(cli).mode;
    expect(mode & 0o111).not.toBe(0); // at least one execute bit
  });

  test("runs directly without a `node` prefix", () => {
    const output = execFileSync(cli, ["--version"], { encoding: "utf8" });
    expect(output.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });
});
