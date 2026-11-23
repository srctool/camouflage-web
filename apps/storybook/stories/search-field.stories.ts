import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components-vite";

const meta: Meta = {
  title: "Inputs/Search field",
  component: "camo-search-field",
  args: { value: "" },
  render: (a) => html`<camo-search-field value=${a["value"]}></camo-search-field>`,
};
export default meta;
export const Empty: StoryObj = {};
export const WithQuery: StoryObj = { args: { value: "camouflage" } };
