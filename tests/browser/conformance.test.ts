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
      // (slotted `camo-menu-item`s) and the anchor that says it has a popup. Those rules are left out for a menu, and the second for what has such an anchor (a popover, a toolbar's more button, a breadcrumb's, a split button).
      const popups = ["menu", "popover", "toolbar", "breadcrumb", "split-button"];
      const ignore = [
        ...(variant.scenario.component === "menu" ? ["aria-required-children"] : []),
        ...(popups.includes(variant.scenario.component) ? ["aria-allowed-attr"] : []),
      ];
      // A snackbar fades in, and contrast measured mid-fade is not the settled colour.
      // The fade is waited for, not timed: a loaded runner can start it late.
      if (variant.scenario.component === "snackbar") {
        await new Promise((r) => setTimeout(r, 500));
        await Promise.all(element.getAnimations({ subtree: true }).map((a) => a.finished));
      }
      expect(await axeViolations(root, variant.skin, ignore)).toEqual([]);
      // A control keeps a 48 px touch area. A list row or a chip only when it can be pressed.
      const props = variant.scenario.props ?? {};
      const pressable = props["clickable"] === true || props["selectable"] === true;
      const component = variant.scenario.component;
      if (
        ["button", "icon-button", "checkbox", "switch", "fab"].includes(component) ||
        (["list-item", "chip"].includes(component) && pressable)
      )
        if (props["disabled"] !== true)
          expect(reachesTouchTarget(element), "a 48 px touch area").toBe(true);
    });
  }
});
