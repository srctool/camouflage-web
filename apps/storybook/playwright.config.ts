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
  snapshotPathTemplate: "e2e/screenshots/{arg}-{projectName}{ext}",
  fullyParallel: true,
  webServer: {
    command: "node serve.mjs",
    url: "http://localhost:6007/web/",
    reuseExistingServer: true,
    env: { PORT: "6007" },
  },
  use: { baseURL: "http://localhost:6007", reducedMotion: "reduce" },
  projects: names
    .filter((name): name is keyof typeof all => name in all)
    .map((name) => ({ name, use: { ...all[name] } })),
});
