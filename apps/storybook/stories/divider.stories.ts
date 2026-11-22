import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components-vite";

const meta: Meta = {
  title: "Components/Divider",
  component: "camo-divider",
  argTypes: {
    orientation: { control: "select", options: ["horizontal", "vertical"] },
    inset: { control: "select", options: ["none", "start", "middle"] },
  },
  args: { orientation: "horizontal", inset: "none" },
  render: (a) =>
    html`<camo-divider orientation=${a["orientation"]} inset=${a["inset"]}></camo-divider>`,
};
export default meta;
type Story = StoryObj;

export const Horizontal: Story = {};
export const InsetStart: Story = { args: { inset: "start" } };
export const InsetMiddle: Story = { args: { inset: "middle" } };
export const Vertical: Story = {
  render: () =>
    html`<div style="display:flex;gap:12px;block-size:48px;align-items:stretch"><camo-text text="Left"></camo-text><camo-divider orientation="vertical"></camo-divider><camo-text text="Right"></camo-text></div>`,
};
