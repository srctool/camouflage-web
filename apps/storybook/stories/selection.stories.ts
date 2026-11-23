import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components-vite";

const meta: Meta = { title: "Inputs/Selection controls" };
export default meta;
type Story = StoryObj;

export const Checkbox: Story = {
  render: () => html`<div style="display:grid;gap:8px">
    <camo-checkbox label="Remember me"></camo-checkbox>
    <camo-checkbox label="Newsletter" description="One email a month" checked></camo-checkbox>
    <camo-checkbox label="Select all" indeterminate></camo-checkbox>
    <camo-checkbox label="I agree" error="You must accept to continue"></camo-checkbox>
    <camo-checkbox label="Unavailable" checked disabled></camo-checkbox>
  </div>`,
};
export const Switch: Story = {
  render: () => html`<div style="display:grid;gap:8px">
    <camo-switch label="Wi-Fi" checked></camo-switch>
    <camo-switch label="Low power mode" description="Uses less battery"></camo-switch>
    <camo-switch label="Airplane mode" disabled></camo-switch>
  </div>`,
};
export const RadioGroup: Story = {
  render: () => html`<camo-radio-group label="Plan" name="plan" value="pro">
    <camo-radio value="free" label="Free"></camo-radio>
    <camo-radio value="pro" label="Pro" description="For teams"></camo-radio>
    <camo-radio value="max" label="Max" disabled></camo-radio>
  </camo-radio-group>`,
};
export const SegmentedControl: Story = {
  render: () => html`<camo-segmented-control label="Range" value="week">
    <camo-segment value="day" label="Day"></camo-segment>
    <camo-segment value="week" label="Week"></camo-segment>
    <camo-segment value="month" label="Month"></camo-segment>
  </camo-segmented-control>`,
};
export const SegmentedMulti: Story = {
  render: () => html`<camo-segmented-control label="Days" multiple>
    <camo-segment value="mo" label="Mon"></camo-segment>
    <camo-segment value="tu" label="Tue"></camo-segment>
    <camo-segment value="we" label="Wed"></camo-segment>
  </camo-segmented-control>`,
};
