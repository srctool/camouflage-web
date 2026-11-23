import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components-vite";

const meta: Meta = { title: "Inputs/Date and time" };
export default meta;
type Story = StoryObj;

export const Calendar: Story = {
  render: () =>
    html`<camo-calendar value="2026-11-18" today="2026-11-22" locale="en-US"></camo-calendar>`,
};
export const CalendarRange: Story = {
  render: () =>
    html`<camo-calendar range start="2026-11-10" end="2026-11-16" today="2026-11-22" locale="en-US"></camo-calendar>`,
};
export const DatePicker: Story = {
  render: () =>
    html`<camo-date-picker label="Birth date" name="birth" value="2026-11-18" locale="en-US" min="1900-01-01"></camo-date-picker>`,
};
export const DateRange: Story = {
  render: () =>
    html`<camo-date-picker range label="Stay" locale="en-US" max-length="14"></camo-date-picker>`,
};
export const TimePicker: Story = {
  render: () =>
    html`<camo-time-picker label="Pickup" name="pickup" value="14:30" minute-step="5" locale="en-US"></camo-time-picker>`,
};
