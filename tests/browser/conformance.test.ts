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
      // axe reads roles from attributes, and a component states its own through ElementInternals, so a rule that checks
      // a role against its children or its attributes would fail what a screen reader sees as right: a menu's items
      // (slotted `camo-menu-item`s) and the anchor that says it has a popup. Those two rules are left out for a menu.
      const ignore =
        variant.scenario.component === "menu"
          ? ["aria-required-children", "aria-allowed-attr"]
          : [];
      expect(await axeViolations(root, variant.skin, ignore)).toEqual([]);
      if (
        ["button", "icon-button", "checkbox", "switch", "list-item"].includes(
          variant.scenario.component,
        ) &&
        variant.scenario.props?.["disabled"] !== true &&
        (variant.scenario.component !== "list-item" ||
          variant.scenario.props?.["clickable"] === true)
      )
        expect(reachesTouchTarget(element), "a 48 px touch area").toBe(true);
    });
  }
});
