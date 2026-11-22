import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components-vite";

const meta: Meta = {
  title: "Components/Dialog",
  component: "camo-dialog",
  args: { title: "Delete item?", message: "This can't be undone." },
  render: (a) => html`<camo-dialog open title=${a["title"]} message=${a["message"]}>
    <camo-button slot="confirm" text="Delete" tone="error"></camo-button>
    <camo-button slot="dismiss" text="Cancel" appearance="ghost"></camo-button>
  </camo-dialog>`,
};
export default meta;

export const Confirmation: StoryObj = {};
export const MessageOnly: StoryObj = { args: { title: "" } };
