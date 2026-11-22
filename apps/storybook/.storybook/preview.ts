import "@srctool/camouflage-core/define";
import "@srctool/camouflage-skin-minimal/register";
import "@srctool/camouflage-skin-cupertino/register";
import { html } from "lit";
import type { Preview } from "@storybook/web-components-vite";

// Every story renders inside a provider; the toolbar picks the skin and the scheme, so one story covers each mode.
const preview: Preview = {
  globalTypes: {
    skin: {
      description: "Skin",
      toolbar: { title: "Skin", items: ["minimal", "cupertino"], dynamicTitle: true },
    },
    scheme: {
      description: "Colour scheme",
      toolbar: { title: "Scheme", items: ["light", "dark"], dynamicTitle: true },
    },
  },
  initialGlobals: { skin: "minimal", scheme: "light" },
  decorators: [
    (story, context) => html`
      <camo-provider
        skin=${String(context.globals["skin"])}
        scheme=${String(context.globals["scheme"])}
        style="display:block;padding:24px;min-height:100vh;box-sizing:border-box;background:var(--camo-color-surface);color:var(--camo-color-on-surface)"
      >
        ${story()}
      </camo-provider>
    `,
  ],
  parameters: { layout: "fullscreen" },
};
export default preview;
