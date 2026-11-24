import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components-vite";

const meta: Meta = { title: "Navigation/Tabs, bar, rail and drawer" };
export default meta;
type Story = StoryObj;

const items = html`
  <camo-nav-item value="home" label="Home" icon="home" selected-icon="home-filled"></camo-nav-item>
  <camo-nav-item value="inbox" label="Inbox" icon="inbox"><camo-badge slot="badge" count="3"></camo-badge></camo-nav-item>
  <camo-nav-item value="saved" label="Saved" icon="star"></camo-nav-item>
  <camo-nav-item value="settings" label="Settings" icon="settings"></camo-nav-item>`;

export const Tabs: Story = {
  render: () => html`<div style="display:grid;gap:24px;max-inline-size:420px">
    <camo-tabs label="Product" value="reviews">
      <camo-tab value="overview" label="Overview"></camo-tab><camo-tab value="reviews" label="Reviews"></camo-tab><camo-tab value="specs" label="Specs"></camo-tab>
    </camo-tabs>
    <camo-tabs label="Sections" value="b" scrollable style="max-inline-size:260px">
      ${["a", "b", "c", "d", "e", "f"].map((k) => html`<camo-tab value=${k} label="Section ${k.toUpperCase()}"></camo-tab>`)}
    </camo-tabs>
    <camo-tabs label="Details" value="overview" appearance="ghost">
      <camo-tab value="overview" label="Overview" icon="home"></camo-tab><camo-tab value="reviews" label="Reviews" icon="star"></camo-tab>
    </camo-tabs>
  </div>`,
};
export const NavigationBar: Story = {
  render: () =>
    html`<div style="max-inline-size:420px"><camo-navigation-bar label="Main" value="home">${items}</camo-navigation-bar></div>`,
};
export const NavigationRail: Story = {
  render: () => html`<div style="block-size:360px"><camo-navigation-rail label="Main" value="inbox">
    <camo-fab slot="header" content-description="Compose"><camo-icon slot="icon" name="edit"></camo-icon></camo-fab>${items}
  </camo-navigation-rail></div>`,
};
export const NavigationDrawer: Story = {
  render:
    () => html`<div style="block-size:360px"><camo-navigation-drawer label="Mail" value="inbox">
    <camo-nav-section title="Mail"><camo-nav-item value="inbox" label="Inbox" icon="inbox"></camo-nav-item><camo-nav-item value="saved" label="Saved" icon="star"></camo-nav-item></camo-nav-section>
    <camo-nav-section title="Account"><camo-nav-item value="profile" label="Profile" icon="person"></camo-nav-item><camo-nav-item value="settings" label="Settings" icon="settings"></camo-nav-item></camo-nav-section>
  </camo-navigation-drawer></div>`,
};
export const ModalDrawer: Story = {
  render: () => html`<camo-button text="Menu" @click=${(e: Event) => {
    const drawer = (e.currentTarget as Element).nextElementSibling as HTMLElement & {
      open: boolean;
    };
    drawer.open = true;
  }}></camo-button>
    <camo-modal-drawer label="Navigation" value="inbox">
      <camo-nav-item value="inbox" label="Inbox" icon="inbox"></camo-nav-item><camo-nav-item value="saved" label="Saved" icon="star"></camo-nav-item><camo-nav-item value="settings" label="Settings" icon="settings"></camo-nav-item>
    </camo-modal-drawer>`,
};
