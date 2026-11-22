import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components-vite";

const meta: Meta = {
  title: "Components/Button",
  component: "camo-button",
  argTypes: {
    appearance: {
      control: "select",
      options: ["solid", "soft", "raised", "outline", "ghost", "link"],
    },
    tone: { control: "select", options: ["default", "error", "success", "warning", "info"] },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
    text: { control: "text" },
  },
  args: { text: "Save", appearance: "solid", tone: "default", disabled: false, loading: false },
  render: (a) => html`<camo-button
    text=${a["text"]}
    appearance=${a["appearance"]}
    tone=${a["tone"]}
    ?disabled=${a["disabled"]}
    ?loading=${a["loading"]}
  ></camo-button>`,
};
export default meta;
type Story = StoryObj;

export const Solid: Story = {};
export const Outline: Story = { args: { appearance: "outline" } };
export const Error: Story = { args: { tone: "error", text: "Delete" } };
export const Loading: Story = { args: { loading: true, text: "Saving" } };
export const Disabled: Story = { args: { disabled: true, text: "Unavailable" } };
export const WithIcons: Story = {
  render: () => html`<camo-button text="Add" appearance="outline"
    ><camo-icon slot="prefix-icon" name="add"></camo-icon
    ><camo-icon slot="suffix-icon" name="arrow-back" auto-mirror></camo-icon
  ></camo-button>`,
};
