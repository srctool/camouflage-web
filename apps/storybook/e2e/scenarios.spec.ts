import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { expandScenarios } from "../../../scenarios/expand.ts";
import type { ScenarioFile, Variant } from "../../../scenarios/expand.ts";
import type { HarnessRequest, TestMode } from "../stories/harness.stories.ts";

// The screenshot runner: every scenario of `scenarios/scenarios.json`, expanded over skin, mode, text scale and
// direction, captured through the Storybook harness story in each browser. A capture is compared with its baseline
// (`e2e/screenshots/<id>-<browser>-<platform>.png`); a missing baseline is recorded, so a new scenario needs no more
// than its entry. Baselines are committed from CI's Linux run only (fonts differ per OS); the others are ignored.
const file = JSON.parse(
  readFileSync(new URL("../../../scenarios/scenarios.json", import.meta.url), "utf8"),
) as ScenarioFile;
const variants = expandScenarios(file);

async function open(page: Page, v: Variant, testMode?: TestMode): Promise<void> {
  const request: HarnessRequest = {
    scenario: v.scenario,
    skin: v.skin,
    mode: v.mode,
    textScale: v.textScale,
    direction: v.direction,
    ...(testMode === undefined ? {} : { testMode }),
  };
  const url = `/web/iframe.html?id=harness-scenario--scenario&viewMode=story&scenario=${encodeURIComponent(JSON.stringify(request))}`;
  await page.setViewportSize({ width: 480, height: 360 });
  await page.goto(url);
  await page.waitForSelector("#harness camo-provider");
  // Settled: every camo element has upgraded and finished its first update, and the fonts are in.
  await page.evaluate(async () => {
    await Promise.all(
      ["camo-provider", "camo-button", "camo-dialog"].map((t) => customElements.whenDefined(t)),
    );
    for (let round = 0; round < 3; round++) {
      const all = [...document.querySelectorAll("*")].filter(
        (e): e is Element & { updateComplete: Promise<boolean> } => "updateComplete" in e,
      );
      await Promise.all(all.map((e) => e.updateComplete));
    }
    await document.fonts.ready;
  });
}

async function capture(page: Page, v: Variant): Promise<Buffer> {
  // An unknown amount pulses for ever, even under reduced motion: freeze it, or each capture catches another moment.
  const options = v.scenario.name.endsWith("-indeterminate")
    ? { animations: "disabled" as const }
    : {};
  return v.scenario.frame === "page"
    ? await page.screenshot(options)
    : await page.locator("#harness").screenshot(options);
}

for (const v of variants) {
  test(v.id, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await open(page, v);
    await expect(await capture(page, v)).toMatchSnapshot(`${v.id}.png`);
    expect(errors).toEqual([]);
  });
}

// The test modes change what the environment reports; the page must still render, and a skin's fallback must hold.
const MODES: TestMode[] = ["reduced-motion", "reduced-transparency", "blur-off", "no-shaders"];
for (const testMode of MODES) {
  // One plain component, and every material scenario: each step of a material's fallback chain has its capture.
  const sample = variants.filter(
    (v) =>
      (v.scenario.name === "button-solid" || v.scenario.surface !== undefined) &&
      v.mode === "light" &&
      v.textScale === 1 &&
      v.direction === "ltr",
  );
  for (const v of sample) {
    test(`${v.id} in ${testMode} mode`, async ({ page }) => {
      await open(page, v, testMode);
      await expect(await capture(page, v)).toMatchSnapshot(`${v.id}_${testMode}.png`);
      const env = await page.evaluate(() => {
        const p = document.querySelector("camo-provider") as unknown as {
          measured: {
            reducedMotion?: boolean;
            capabilities: { reduceTransparency?: boolean; backdropBlur?: boolean };
          };
        };
        return p.measured;
      });
      if (testMode === "reduced-motion") expect(env.reducedMotion).toBe(true);
      if (testMode === "reduced-transparency")
        expect(env.capabilities.reduceTransparency).toBe(true);
      if (testMode === "blur-off") expect(env.capabilities.backdropBlur).toBe(false);
    });
  }
}
