import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components-vite";

const meta: Meta = { title: "Inputs/Slider and stepper" };
export default meta;
type Story = StoryObj;

export const Slider: Story = {
  render: () => html`<div style="display:grid;gap:16px;max-inline-size:360px">
    <camo-slider label="Volume" value="0.4"></camo-slider>
    <camo-slider label="Rating" min="0" max="10" step="2" value="6"></camo-slider>
  </div>`,
};
export const Stepper: Story = {
  render: () => html`<div style="display:grid;gap:16px">
    <camo-stepper label="Quantity" min="1" max="10" value="2"></camo-stepper>
    <camo-stepper label="Weight" min="0" max="5" step="0.25" decimals="2" value="1.5"></camo-stepper>
  </div>`,
};
