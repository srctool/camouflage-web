import { setEnvironmentSources } from "@srctool/camouflage-core";
import { html } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { scenarioMarkup } from "../../../scenarios/expand.ts";
import type { Direction, Mode, Scenario } from "../../../scenarios/expand.ts";

// The screenshot harness: one story that renders any scenario of `scenarios/scenarios.json`, chosen by the URL, so a
// new component needs a scenario entry and no story. The runner (e2e/scenarios.spec.ts) builds the URL:
//   iframe.html?id=harness--scenario&viewMode=story&scenario=<json>
// where the JSON is `{ scenario, skin, mode, textScale, direction, testMode? }`.
//
// `testMode` fakes what the environment reads (the Provider note, 3.3): `reduced-motion`, `reduced-transparency` and
// `blur-off` (no `backdrop-filter`), so a skin's fallback is exercised in any browser.

export type TestMode = "reduced-motion" | "reduced-transparency" | "blur-off";

export interface HarnessRequest {
  scenario: Scenario;
  skin: string;
  mode: Mode;
  textScale: number;
  direction: Direction;
  testMode?: TestMode;
}

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
      !(testMode === "blur-off" && property === "backdrop-filter" && value.startsWith("blur")),
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
    applyTestMode(request.testMode);
    // The text scale is the user's font-size setting, which every type size follows (they are `rem`).
    document.documentElement.style.fontSize = `${request.textScale * 100}%`;
    return html`<div id="harness" dir=${request.direction} style="display:inline-block;min-width:240px">
      <camo-provider
        skin=${request.skin}
        scheme=${request.mode}
        style="display:block;padding:24px;background:var(--camo-color-surface);color:var(--camo-color-on-surface)"
        >${unsafeHTML(scenarioMarkup(request.scenario))}</camo-provider
      >
    </div>`;
  },
};
export default meta;

/** Renders the scenario named in the URL. */
export const Scenario: StoryObj = {};
