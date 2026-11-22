import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components-vite";

const meta: Meta = { title: "Foundations/Provider", component: "camo-provider" };
export default meta;

/** One markup, two skins: the nested provider changes the look, the elements inside it do not change. */
export const NestedSkins: StoryObj = {
  render: () => html`
    <div style="display:grid;gap:16px">
      <camo-button text="Under the toolbar's skin"></camo-button>
      <camo-provider skin="cupertino" scheme="dark" style="display:block;padding:16px;background:var(--camo-color-surface)">
        <camo-button text="Under Cupertino, dark"></camo-button>
      </camo-provider>
      <camo-provider skin="minimal" scheme="light" style="display:block;padding:16px;background:var(--camo-color-surface)">
        <camo-button text="Under Minimal, light"></camo-button>
      </camo-provider>
    </div>`,
};
