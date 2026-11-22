import scenarioFile from "../../scenarios/scenarios.json" with { type: "json" };
import { afterEach, describe, expect, it } from "vitest";
import { expandScenarios } from "../../scenarios/expand.ts";
import type { ScenarioFile } from "../../scenarios/expand.ts";
import {
  axeViolations,
  mountVariant,
  reachesTouchTarget,
  resetTextScale,
} from "../helpers/conformance-browser.ts";

// Every variant of every scenario in `scenarios/scenarios.json` (the same list the screenshots use) is checked here
// as it renders: it paints, it has no accessibility violation (axe), and a control keeps a 48 px touch area. A new
// scenario entry is covered with no new test code.
const file = scenarioFile as ScenarioFile;
const variants = expandScenarios(file);

afterEach(resetTextScale);

describe("every scenario variant", () => {
  for (const variant of variants) {
    it(variant.id, async () => {
      const { root, element } = await mountVariant(variant);
      expect(element.shadowRoot, "the element rendered a shadow root").not.toBeNull();
      expect(element.shadowRoot!.childNodes.length).toBeGreaterThan(0);
      expect(await axeViolations(root, variant.skin)).toEqual([]);
      if (
        ["button", "icon-button"].includes(variant.scenario.component) &&
        variant.scenario.props?.["disabled"] !== true
      )
        expect(reachesTouchTarget(element), "a 48 px touch area").toBe(true);
    });
  }
});
