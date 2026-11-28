import { setEnvironmentSources } from "@srctool/camouflage-core";
import type { CamoSkin } from "@srctool/camouflage-core";
import { createCupertinoSkin } from "@srctool/camouflage-skin-cupertino";
import { createFluentSkin } from "@srctool/camouflage-skin-fluent";
import { html, nothing } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { registerDemoIcons } from "../../../scenarios/icons.ts";
import { applyProperties, scenarioMarkup } from "../../../scenarios/expand.ts";
import { ref } from "lit/directives/ref.js";
import type { Direction, Mode, Scenario } from "../../../scenarios/expand.ts";

// The screenshot harness: one story that renders any scenario of `scenarios/scenarios.json`, chosen by the URL, so a
// new component needs a scenario entry and no story. The runner (e2e/scenarios.spec.ts) builds the URL:
//   iframe.html?id=harness--scenario&viewMode=story&scenario=<json>
// where the JSON is `{ scenario, skin, mode, textScale, direction, testMode? }`.
//
// `testMode` fakes what the environment reads (the Provider note, 3.3): `reduced-motion`, `reduced-transparency`,
// `blur-off` (no `backdrop-filter`) and `no-shaders` (no refraction), so a skin's fallback is exercised in any browser.

export type TestMode = "reduced-motion" | "reduced-transparency" | "blur-off" | "no-shaders";

export interface HarnessRequest {
  scenario: Scenario;
  skin: string;
  mode: Mode;
  textScale: number;
  direction: Direction;
  testMode?: TestMode;
}

/** The skin with the scenario's surface material, or its registered name. */
function skinFor(name: string, surface: string | undefined): CamoSkin | string {
  if (surface === undefined) return name;
  return name === "fluent"
    ? createFluentSkin({ surface: surface as "acrylic" })
    : createCupertinoSkin({ surface: surface as "classic" | "liquid-glass" });
}

// Something for a material to let through, over the whole page: menus and popovers reach outside the harness box.
const STRIPES =
  "repeating-linear-gradient(135deg, #0f62fe 0 14px, #ffffff 14px 28px, #f59e0b 28px 42px) fixed";

class Fixed {
  readonly matches: boolean;
  constructor(matches: boolean) {
    this.matches = matches;
  }
  subscribe(): () => void {
    return () => {};
  }
}

function applyTestMode(testMode: TestMode | undefined): void {
  if (testMode === undefined) return;
  setEnvironmentSources({
    query: (media) =>
      new Fixed(
        (testMode === "reduced-motion" && media.includes("prefers-reduced-motion")) ||
          (testMode === "reduced-transparency" && media.includes("prefers-reduced-transparency")),
      ),
    supports: (property, value) =>
      !(
        testMode === "blur-off" &&
        property.endsWith("backdrop-filter") &&
        value.startsWith("blur")
      ),
    ...(testMode === "no-shaders" ? { chromium: () => false } : {}),
  });
}

const meta: Meta = {
  title: "Harness/Scenario",
  parameters: { harness: true, layout: "fullscreen" },
  render: () => {
    const raw = new URLSearchParams(location.search).get("scenario");
    if (raw === null)
      return html`<p>Pass <code>?scenario=&lt;json&gt;</code> (see scenarios/).</p>`;
    const request = JSON.parse(raw) as HarnessRequest;
    registerDemoIcons();
    applyTestMode(request.testMode);
    document.body.style.background = request.scenario.surface === undefined ? "" : STRIPES;
    // The text scale is the user's font-size setting, which every type size follows (they are `rem`).
    document.documentElement.style.fontSize = `${request.textScale * 100}%`;
    return html`<div id="harness" dir=${request.direction} style="display:inline-block;min-width:240px">
      <camo-provider
        ${ref((el) => {
          // The scenario's element is a child committed after this attribute part: assign once it is there.
          if (el !== undefined) queueMicrotask(() => applyProperties(el, request.scenario));
        })}
        .skin=${skinFor(request.skin, request.scenario.surface)}
        scheme=${request.mode}
        density=${request.scenario.density ?? nothing}
        style="display:block;padding:24px;background:${
          request.scenario.surface === undefined ? "var(--camo-color-surface)" : "transparent"
        };color:var(--camo-color-on-surface)"
        >${unsafeHTML(scenarioMarkup(request.scenario))}</camo-provider
      >
    </div>`;
  },
};
export default meta;

/** Renders the scenario named in the URL. */
export const Scenario: StoryObj = {};
