import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components-vite";

const meta: Meta = { title: "Display/Chips, badges, avatars and FAB" };
export default meta;
type Story = StoryObj;

export const Chips: Story = {
  render: () => html`<div style="display:grid;gap:16px">
    <camo-chip-group label="Filters" multiple>
      <camo-chip value="open" label="Open now"></camo-chip>
      <camo-chip value="top" label="Top rated"></camo-chip>
      <camo-chip value="cheap" label="Cheap"></camo-chip>
    </camo-chip-group>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <camo-chip label="ada@example.com" removable></camo-chip>
      <camo-chip label="Add to calendar" clickable><camo-icon slot="leading" name="add"></camo-icon></camo-chip>
      <camo-chip label="Paid" appearance="soft" tone="success"></camo-chip>
      <camo-chip label="Pending" appearance="soft" tone="warning"></camo-chip>
    </div>
  </div>`,
};
export const Badges: Story = {
  render: () => html`<div style="display:flex;gap:24px;align-items:center">
    <camo-badge count="3"></camo-badge><camo-badge count="120"></camo-badge><camo-badge></camo-badge>
    <camo-badged-box><camo-icon-button label="Notifications"><camo-icon name="heart"></camo-icon></camo-icon-button><camo-badge slot="badge" count="3"></camo-badge></camo-badged-box>
    <camo-badged-box><camo-icon-button label="Messages"><camo-icon name="search"></camo-icon></camo-icon-button><camo-badge slot="badge"></camo-badge></camo-badged-box>
  </div>`,
};
export const Avatars: Story = {
  render: () => html`<div style="display:grid;gap:16px">
    <div style="display:flex;gap:16px;align-items:center">
      <camo-avatar name="Dwiki Riyadi" size="small"></camo-avatar>
      <camo-avatar name="Ada Lovelace" presence="online"></camo-avatar>
      <camo-avatar name="Grace Hopper" size="large" presence="busy"></camo-avatar>
      <camo-avatar></camo-avatar>
      <camo-avatar name="Katherine Johnson" shape="square"></camo-avatar>
    </div>
    <camo-avatar-group max="3">
      <camo-avatar name="Ada Lovelace"></camo-avatar><camo-avatar name="Grace Hopper"></camo-avatar><camo-avatar name="Katherine Johnson"></camo-avatar><camo-avatar name="Alan Turing"></camo-avatar><camo-avatar name="Margaret Hamilton"></camo-avatar>
    </camo-avatar-group>
  </div>`,
};
export const Fab: Story = {
  render: () => {
    const toggle = (e: Event): void => {
      const fab = (e.currentTarget as Element).parentElement!.querySelector(
        "camo-fab[text]",
      ) as HTMLElement & { collapsed: boolean };
      fab.collapsed = !fab.collapsed;
    };
    return html`<div style="display:flex;gap:16px;align-items:center">
      <camo-fab content-description="Add"><camo-icon slot="icon" name="add"></camo-icon></camo-fab>
      <camo-fab content-description="Compose" text="Compose"><camo-icon slot="icon" name="edit"></camo-icon></camo-fab>
      <camo-button text="Fold" appearance="outline" @click=${toggle}></camo-button>
    </div>`;
  },
};
