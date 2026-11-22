import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components-vite";

const NAMES = ["close", "add", "search", "heart", "heart-filled", "arrow-back", "swatch"];

const meta: Meta = {
  title: "Components/Icon",
  component: "camo-icon",
  argTypes: { name: { control: "select", options: NAMES } },
  args: { name: "search", label: "Search" },
  render: (a) => html`<camo-icon name=${a["name"]} label=${a["label"]}></camo-icon>`,
};
export default meta;
type Story = StoryObj;

export const Registered: Story = {};
export const Sizes: Story = {
  render: () =>
    html`${["16px", "24px", "32px", "48px"].map((s) => html`<camo-icon name="heart-filled" size=${s}></camo-icon>`)}`,
};
export const Tinted: Story = {
  render: () =>
    html`<camo-icon name="heart-filled" size="32px" tint="var(--camo-color-error)"></camo-icon>`,
};
export const InlineSvg: Story = {
  render: () =>
    html`<camo-icon><svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" /></svg></camo-icon>`,
};
export const Original: Story = {
  render: () => html`<camo-icon name="swatch" size="48px"></camo-icon>`,
};
