import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false,
    testTimeout: 15_000,
    // No test may launch a real browser: every `a-team ui` here — in process or spawned,
    // which inherits this — hands its URL to a no-op instead of the platform opener.
    env: { A_TEAM_UI_OPEN_COMMAND: "true" },
    exclude: [...configDefaults.exclude, "site/tests/**"],
  },
});
