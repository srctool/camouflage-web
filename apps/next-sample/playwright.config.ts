import { defineConfig, devices } from "@playwright/test";

// `CAMO_BROWSERS=chromium,webkit` limits a local run, for a machine where one engine cannot start.
const names = (process.env["CAMO_BROWSERS"] ?? "chromium,firefox,webkit")
  .split(",")
  .map((s) => s.trim());
const all = {
  chromium: devices["Desktop Chrome"],
  firefox: devices["Desktop Firefox"],
  webkit: devices["Desktop Safari"],
} as const;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  webServer: {
    command: "node_modules/.bin/next start -p 4174",
    url: "http://localhost:4174/",
    reuseExistingServer: true,
    env: { PORT: "4174" },
  },
  use: { baseURL: "http://localhost:4174", reducedMotion: "reduce" },
  projects: names
    .filter((name): name is keyof typeof all => name in all)
    .map((name) => ({ name, use: { ...all[name] } })),
});
