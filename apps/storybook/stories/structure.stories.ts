import { html } from "lit";
import { ref } from "lit/directives/ref.js";
import type { CamoPagedList } from "@srctool/camouflage-core";
import type { Meta, StoryObj } from "@storybook/web-components-vite";

const meta: Meta = { title: "Structure/Containers and lists" };
export default meta;
type Story = StoryObj;

const body = html`<camo-text variant="title-medium" text="Pro plan"></camo-text><camo-text text="Unlimited projects and priority support"></camo-text>`;

export const Cards: Story = {
  render: () => html`<div style="display:grid;gap:12px;max-inline-size:360px">
    <camo-card>${body}</camo-card>
    <camo-card appearance="outline">${body}</camo-card>
    <camo-card appearance="soft" tone="error">${body}</camo-card>
    <camo-card clickable selectable selected>${body}</camo-card>
  </div>`,
};
export const ListSection: Story = {
  render:
    () => html`<camo-list-section title="Network" footer="Wi-Fi uses less battery than cellular" style="max-inline-size:420px">
    <camo-list-item headline="Wi-Fi" supporting="Home" clickable><camo-icon slot="leading" name="search"></camo-icon><camo-icon slot="trailing" name="arrow-back" auto-mirror></camo-icon></camo-list-item>
    <camo-list-item headline="Bluetooth" supporting="On" clickable><camo-icon slot="leading" name="add"></camo-icon></camo-list-item>
    <camo-list-item headline="Airplane mode"><camo-switch slot="trailing"></camo-switch></camo-list-item>
  </camo-list-section>`,
};
export const Accordion: Story = {
  render: () => html`<camo-accordion-group single-expand style="max-inline-size:420px">
    <camo-accordion title="Shipping" subtitle="2 to 4 days" expanded>Orders ship within two business days.</camo-accordion>
    <camo-accordion title="Returns">Free returns within 30 days.</camo-accordion>
    <camo-accordion title="Warranty" disabled>Two years.</camo-accordion>
  </camo-accordion-group>`,
};
export const Skeletons: Story = {
  render: () => html`<div style="display:grid;gap:12px;max-inline-size:360px">
    <camo-skeleton height="6rem" shape="large"></camo-skeleton>
    <camo-skeleton variant="text" lines="3"></camo-skeleton>
    <camo-skeleton variant="circle" size="48px"></camo-skeleton>
    <camo-skeleton variant="list-item" lines="2"></camo-skeleton>
  </div>`,
};

const people = Array.from({ length: 30 }, (_, i) => ({
  headline: `Person ${i + 1}`,
  supporting: "Mathematician",
}));
export const PagedList: Story = {
  render: () => html`<camo-paged-list
    label="People"
    style="display:block;block-size:360px;overflow:auto;max-inline-size:420px"
    ${ref((el?: Element) => {
      if (el === undefined) return;
      const list = el as CamoPagedList<{ headline: string; supporting: string }>;
      // A fake API: pages of ten, a short delay, an end after three pages.
      let loaded = 10;
      const set = (loading: "none" | "initial" | "more"): void => {
        list.state = { items: people.slice(0, loaded), loading, endReached: loaded >= 30 };
      };
      list.state = { items: [], loading: "initial" };
      setTimeout(() => set("none"), 600);
      list.addEventListener("camo-load-more", () => {
        set("more");
        setTimeout(() => {
          loaded += 10;
          set("none");
        }, 700);
      });
    })}
  ></camo-paged-list>`,
};
