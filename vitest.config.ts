import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  // The board is JSX; the CLI is not. `automatic` lets a .tsx test render a component
  // without importing React, matching how `npm run build:ui` compiles the board.
  esbuild: { jsx: "automatic" },
  test: {
    fileParallelism: false,
    testTimeout: 15_000,
    // Node is the default for every test file. A UI test opts into the browser-like
    // environment per file with `// @vitest-environment jsdom` on its first line, so
    // no CLI test can drift into jsdom by editing shared config. See tests/ui/.
    environment: "node",
    // No test may launch a real browser: every `a-team ui` here — in process or spawned,
    // which inherits this — hands its URL to a no-op instead of the platform opener.
    env: { A_TEAM_UI_OPEN_COMMAND: "true" },
    exclude: [...configDefaults.exclude, "site/tests/**"],
  },
});
