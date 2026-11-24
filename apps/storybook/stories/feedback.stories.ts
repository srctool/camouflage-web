import { messengerOf } from "@srctool/camouflage-core";
import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components-vite";

const meta: Meta = { title: "Feedback/Progress, banner and snackbar" };
export default meta;
type Story = StoryObj;

export const ProgressBars: Story = {
  render: () => html`<div style="display:grid;gap:16px;max-inline-size:360px">
    <camo-progress-bar progress="0.4" label="Uploading photo"></camo-progress-bar>
    <camo-progress-bar label="Loading"></camo-progress-bar>
    <camo-progress-bar progress="0.7" tone="error" label="Upload failed"></camo-progress-bar>
  </div>`,
};
export const ProgressCircles: Story = {
  render: () => html`<div style="display:flex;gap:24px;align-items:center">
    <camo-progress-circle size="small" label="Loading"></camo-progress-circle>
    <camo-progress-circle label="Loading"></camo-progress-circle>
    <camo-progress-circle size="large" progress="0.6" label="Uploading"></camo-progress-circle>
    <camo-progress-circle progress="1" tone="success" label="Done"></camo-progress-circle>
  </div>`,
};
export const Banners: Story = {
  render: () => html`<div style="display:grid;gap:12px;max-inline-size:480px">
    <camo-banner title="Trial ends in 3 days" message="Upgrade to keep your projects."><camo-button slot="actions" appearance="ghost" text="Upgrade"></camo-button></camo-banner>
    <camo-banner tone="success" message="Your changes were saved."></camo-banner>
    <camo-banner tone="warning" appearance="outline" title="Storage almost full" message="You have used 95% of your storage." dismissible></camo-banner>
    <camo-banner tone="error" appearance="solid" message="Couldn't sync" dismissible><camo-button slot="actions" appearance="ghost" text="Retry"></camo-button></camo-banner>
  </div>`,
};
// The messenger queues: press more than once to see them follow one another.
export const Snackbars: Story = {
  render: () => html`<div style="display:flex;gap:12px;flex-wrap:wrap">
    <camo-button text="Archive" @click=${(e: Event) => {
      void messengerOf(e.currentTarget as Element).show("Message archived", { action: "Undo" });
    }}></camo-button>
    <camo-button text="Fail" appearance="outline" tone="error" @click=${(e: Event) => {
      void messengerOf(e.currentTarget as Element).show("Couldn't send the message", {
        action: "Retry",
        tone: "error",
        withDismiss: true,
      });
    }}></camo-button>
    <camo-button text="Replace" appearance="ghost" @click=${(e: Event) => messengerOf(e.currentTarget as Element).dismissCurrent()}></camo-button>
  </div>`,
};
