import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false,
    testTimeout: 15_000,
    exclude: [...configDefaults.exclude, "site/tests/**"],
  },
});
