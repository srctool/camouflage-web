import { showCamoDialog } from "@srctool/camouflage-core";
import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components-vite";

const meta: Meta = { title: "Structure/Overlays and bars" };
export default meta;
type Story = StoryObj;

const rows = html`<camo-list-item headline="Message" clickable></camo-list-item><camo-list-item headline="Mail" clickable></camo-list-item><camo-list-item headline="Copy link" clickable></camo-list-item>`;

export const BottomSheet: Story = {
  render:
    () => html`<camo-button text="Share" @click=${(e: Event) => (((e.currentTarget as HTMLElement).nextElementSibling as HTMLElement & { open: boolean }).open = true)}></camo-button>
    <camo-bottom-sheet title="Share" detent="medium">${rows}</camo-bottom-sheet>`,
};
export const Menu: Story = {
  render: () => html`<camo-menu>
    <camo-button slot="anchor" text="Actions" appearance="outline"></camo-button>
    <camo-menu-item text="Copy" trailing-text="⌘C"></camo-menu-item>
    <camo-menu-item text="Paste" trailing-text="⌘V"></camo-menu-item>
    <camo-menu-divider></camo-menu-divider>
    <camo-menu-group exclusive>
      <camo-menu-item text="Newest" checkable checked></camo-menu-item>
      <camo-menu-item text="Oldest" checkable></camo-menu-item>
    </camo-menu-group>
    <camo-menu-divider></camo-menu-divider>
    <camo-menu-item text="Delete" tone="error"></camo-menu-item>
  </camo-menu>`,
};
export const Tooltip: Story = {
  render: () =>
    html`<camo-tooltip text="Save the file"><camo-icon-button label="Save"><camo-icon name="add"></camo-icon></camo-icon-button></camo-tooltip>`,
};
export const ImperativeDialog: Story = {
  render: () =>
    html`<camo-button text="Delete…" tone="error" @click=${async (e: Event) => {
      await showCamoDialog({
        title: "Delete item?",
        message: "This can't be undone.",
        confirm: { text: "Delete", tone: "error", result: true },
        dismiss: { text: "Cancel", appearance: "ghost", result: false },
        host: e.currentTarget as HTMLElement,
      });
    }}></camo-button>`,
};
export const TopBar: Story = {
  render:
    () => html`<div style="block-size:320px;overflow:auto;border:1px solid var(--camo-color-outline-variant)" id="scroller">
    <camo-top-bar title="Inbox" scroll-target="#scroller">
      <camo-icon-button slot="navigation" label="Back"><camo-icon name="arrow-back" auto-mirror></camo-icon></camo-icon-button>
      <camo-icon-button slot="actions" label="Search"><camo-icon name="search"></camo-icon></camo-icon-button>
    </camo-top-bar>
    <div style="block-size:900px;padding:16px"><camo-text text="Scroll: the bar gets a hairline, and Cupertino collapses its large title."></camo-text></div>
  </div>`,
};
export const Select: Story = {
  render: () => html`<camo-select label="Country" value="id" style="max-inline-size:320px">
    <camo-option value="id" label="Indonesia" supporting="+62"></camo-option>
    <camo-option value="nl" label="Netherlands" supporting="+31"></camo-option>
    <camo-option value="no" label="Norway" disabled></camo-option>
    <camo-option value="nz" label="New Zealand" supporting="+64"></camo-option>
  </camo-select>`,
};
