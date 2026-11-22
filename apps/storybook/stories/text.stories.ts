import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components-vite";

const ROLES = [
  "display-large",
  "display-medium",
  "display-small",
  "headline-large",
  "headline-medium",
  "headline-small",
  "title-large",
  "title-medium",
  "title-small",
  "body-large",
  "body-medium",
  "body-small",
  "label-large",
  "label-medium",
  "label-small",
];

const meta: Meta = {
  title: "Components/Text",
  component: "camo-text",
  argTypes: {
    variant: { control: "select", options: ROLES },
    overflow: { control: "select", options: ["clip", "ellipsis"] },
    "text-align": { control: "select", options: ["start", "center", "end"] },
  },
  args: {
    text: "The quick brown fox",
    variant: "body-medium",
    "max-lines": 0,
    overflow: "clip",
    "text-align": "start",
  },
  render: (a) => html`<camo-text
    text=${a["text"]}
    variant=${a["variant"]}
    max-lines=${a["max-lines"]}
    overflow=${a["overflow"]}
    text-align=${a["text-align"]}
  ></camo-text>`,
};
export default meta;
type Story = StoryObj;

export const Body: Story = {};
export const AllRoles: Story = {
  render: () => html`${ROLES.map((r) => html`<camo-text variant=${r} text=${r}></camo-text>`)}`,
};
export const Rich: Story = {
  render: () => html`<camo-text variant="body-large"
    >I agree to the <strong>Terms</strong> and the <a href="#privacy">Privacy Policy</a>.</camo-text
  >`,
};
export const Truncated: Story = {
  args: {
    text: "A long line of text that does not fit in two lines, so it is cut off with an ellipsis at the end of the second line.",
    "max-lines": 2,
    overflow: "ellipsis",
  },
  render: (a) =>
    html`<div style="inline-size: 260px"><camo-text text=${a["text"]} max-lines=${a["max-lines"]} overflow="ellipsis"></camo-text></div>`,
};
