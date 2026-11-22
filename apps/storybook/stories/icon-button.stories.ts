import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import type { Meta, StoryObj } from "@storybook/web-components-vite";

const meta: Meta = {
  title: "Components/Icon button",
  component: "camo-icon-button",
  argTypes: {
    appearance: {
      control: "select",
      options: ["solid", "soft", "raised", "outline", "ghost", "link"],
    },
    tone: { control: "select", options: ["default", "error", "success", "warning", "info"] },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
  },
  args: {
    label: "Favorite",
    tone: "default",
    disabled: false,
    loading: false,
    tooltip: "Add to favorites",
  },
  render: (a) => html`<camo-icon-button
    label=${a["label"]}
    appearance=${ifDefined(a["appearance"])}
    tone=${a["tone"]}
    tooltip=${a["tooltip"]}
    ?disabled=${a["disabled"]}
    ?loading=${a["loading"]}
  ><camo-icon name="heart"></camo-icon></camo-icon-button>`,
};
export default meta;
type Story = StoryObj;

export const Ghost: Story = {};
export const Appearances: Story = {
  render: () =>
    html`<div style="display:flex;gap:12px">${["solid", "soft", "outline", "ghost"].map((a) => html`<camo-icon-button label=${a} appearance=${a}><camo-icon name="heart"></camo-icon></camo-icon-button>`)}</div>`,
};
export const Danger: Story = {
  render: () =>
    html`<camo-icon-button label="Delete" tone="error" appearance="soft"><camo-icon name="close"></camo-icon></camo-icon-button>`,
};
export const Toggle: Story = {
  render: () =>
    html`<camo-icon-button label="Favorite" toggle @click=${(e: Event) => {
      const el = e.currentTarget as HTMLElement & { checked: boolean };
      el.checked = !el.checked;
      el.querySelector("camo-icon")!.setAttribute("name", el.checked ? "heart-filled" : "heart");
    }}><camo-icon name="heart"></camo-icon></camo-icon-button>`,
};
export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true } };
