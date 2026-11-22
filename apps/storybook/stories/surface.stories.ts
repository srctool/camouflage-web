import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components-vite";

const LEVELS = ["lowest", "low", "surface", "container", "high", "highest"];

const meta: Meta = {
  title: "Components/Surface",
  component: "camo-surface",
  argTypes: {
    level: { control: "select", options: LEVELS },
    shape: {
      control: "select",
      options: ["none", "extra-small", "small", "medium", "large", "extra-large", "full"],
    },
    elevation: {
      control: "select",
      options: ["level0", "level1", "level2", "level3", "level4", "level5"],
    },
    border: { control: "boolean" },
  },
  args: { level: "low", shape: "large", elevation: "level0", border: false },
  render: (
    a,
  ) => html`<camo-surface level=${a["level"]} shape=${a["shape"]} elevation=${a["elevation"]} ?border=${a["border"]}>
    <div style="padding: 16px"><camo-text variant="title-medium" text="A surface"></camo-text></div>
  </camo-surface>`,
};
export default meta;
type Story = StoryObj;

export const Default: Story = {};
export const Levels: Story = {
  render: () =>
    html`<div style="display:grid;gap:8px">${LEVELS.map((l) => html`<camo-surface level=${l} shape="medium"><div style="padding:12px"><camo-text text=${l}></camo-text></div></camo-surface>`)}</div>`,
};
export const Elevated: Story = { args: { elevation: "level3" } };
export const Bordered: Story = { args: { level: "surface", border: true } };
