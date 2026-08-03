import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  outputDir: "../test-results/site",
  reporter: [["list"], ["html", { outputFolder: "../playwright-report/site", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4174/kotta/",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run preview:site",
    cwd: new URL("..", import.meta.url).pathname,
    url: "http://127.0.0.1:4174/kotta/",
    reuseExistingServer: !process.env.CI,
  },
});
