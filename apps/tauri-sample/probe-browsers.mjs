// Runs the feature probe in Playwright's Chromium, Firefox and WebKit and prints one JSON object per engine.
import { readFileSync, writeFileSync } from "node:fs";
import { chromium, firefox, webkit } from "@playwright/test";

const script = readFileSync(new URL("web/probe.js", import.meta.url), "utf8");
const scenario = readFileSync(new URL("web/scenario.js", import.meta.url), "utf8");
// With the ssr-sample server running (`pnpm --filter @srctool/camouflage-ssr-sample start`), the spike scenario runs too.
const spike =
  process.env.CAMO_SPIKE_URL ?? "http://localhost:4173/dialog?skin=cupertino&scheme=light";
const engines = { chromium, firefox, webkit };
const names = (process.env.CAMO_BROWSERS ?? "chromium,firefox,webkit").split(",");
const out = {};
for (const name of names) {
  try {
    const browser = await engines[name].launch();
    const page = await browser.newPage();
    await page.goto("about:blank");
    out[name] = {
      version: browser.version(),
      ...(await page.evaluate(`${script}\n__camoProbeRun()`)),
    };
    const reachable = await fetch(spike).then(
      (r) => r.ok,
      () => false,
    );
    if (reachable) {
      await page.goto(spike);
      out[name].scenario = await page.evaluate(`${scenario}\n__camoScenarioRun()`);
    }
    await browser.close();
  } catch (error) {
    out[name] = { error: String(error).split("\n")[0] };
  }
}
writeFileSync(
  new URL("results-browsers.json", import.meta.url),
  JSON.stringify(out, null, 2) + "\n",
);
console.warn(
  JSON.stringify(
    Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.version ?? v.error])),
    null,
    1,
  ),
);
