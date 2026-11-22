import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

// Two projects: `node` (renderer purity, no-literals, server rendering, side-effect-free imports) and `browser`
// (behavior, accessibility and hydration in Chromium, Firefox and WebKit). The `source` condition makes workspace
// packages resolve to their TypeScript sources, so tests run without a build.
const conditions = ["source", "module", "browser", "development|production"];

// All three engines by default (CI). `CAMO_BROWSERS=chromium,webkit pnpm test:browser` limits a local run, for a
// machine where one engine can't start (Firefox does not launch in some sandboxes).
const browsers = (process.env["CAMO_BROWSERS"] ?? "chromium,firefox,webkit")
  .split(",")
  .map((name) => name.trim())
  .filter((name): name is "chromium" | "firefox" | "webkit" =>
    ["chromium", "firefox", "webkit"].includes(name),
  );

export default defineConfig({
  test: {
    projects: [
      {
        extends: false,
        resolve: { conditions: ["source", "node"] },
        test: {
          name: "node",
          environment: "node",
          include: ["tests/node/**/*.test.ts", "tools/**/*.test.ts"],
        },
      },
      {
        extends: false,
        resolve: { conditions },
        // Declared up front: a dependency optimized in the middle of a run reloads the page and breaks the test.
        optimizeDeps: { include: ["axe-core", "lit", "lit/static-html.js", "@lit/context"] },
        test: {
          name: "browser",
          include: ["tests/browser/**/*.test.ts"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: browsers.map((browser) => ({ browser })),
          },
        },
      },
    ],
  },
});
