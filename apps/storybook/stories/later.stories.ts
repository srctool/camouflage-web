import { html } from "lit";
import { ref } from "lit/directives/ref.js";
import type { Meta, StoryObj } from "@storybook/web-components-vite";

const meta: Meta = { title: "Later/Actions, panels, media, data and navigation helpers" };
export default meta;
type Story = StoryObj;

const gb = (text: string, extra = ""): ReturnType<typeof html> =>
  html`<camo-group-button text=${text} ?toggle=${extra.includes("toggle")} ?selected=${extra.includes("selected")}></camo-group-button>`;

export const ButtonGroups: Story = {
  render: () => html`<div style="display:grid;gap:16px">
    <camo-button-group label="Clipboard">${gb("Cut")}${gb("Copy")}${gb("Paste")}</camo-button-group>
    <camo-button-group label="Formatting">
      <camo-group-button icon="bold" content-description="Bold" toggle selected></camo-group-button>
      <camo-group-button icon="italic" content-description="Italic" toggle></camo-group-button>
      <camo-group-button icon="underline" content-description="Underline" toggle></camo-group-button>
    </camo-button-group>
    <camo-button-group label="Actions" spaced appearance="soft">${gb("Edit")}${gb("Share")}</camo-button-group>
  </div>`,
};
export const SplitButtons: Story = {
  render: () => html`<div style="display:flex;gap:16px">
    <camo-split-button text="Save"><camo-menu-item text="Save as…"></camo-menu-item><camo-menu-item text="Save a copy"></camo-menu-item></camo-split-button>
    <camo-split-button text="Sort" menu-only appearance="soft"><camo-menu-item text="Newest"></camo-menu-item><camo-menu-item text="Oldest"></camo-menu-item></camo-split-button>
  </div>`,
};
export const Popover: Story = {
  render: () => html`<div style="padding:60px 0 120px">
    <camo-popover title="Rename" placement="bottom">
      <camo-button slot="anchor" text="Rename" appearance="outline"></camo-button>
      <camo-text text="Choose a new name for this file."></camo-text>
      <camo-button slot="actions" appearance="ghost" text="Cancel"></camo-button>
      <camo-button slot="actions" text="Save"></camo-button>
    </camo-popover>
  </div>`,
};
export const SideSheets: Story = {
  render: () => html`<div style="display:flex;gap:16px;block-size:280px">
      <div style="flex:1">The main content stays usable beside a docked sheet.</div>
      <camo-side-sheet title="Properties" closable><camo-list-item headline="Name" supporting="report.pdf"></camo-list-item></camo-side-sheet>
    </div>
    <camo-button text="Filters" @click=${(e: Event) => (((e.currentTarget as Element).nextElementSibling as HTMLElement & { open: boolean }).open = true)}></camo-button>
    <camo-modal-side-sheet title="Filters" closable><camo-list-item headline="Open now" clickable></camo-list-item></camo-modal-side-sheet>`,
};
export const Toolbar: Story = {
  render: () => html`<div style="display:grid;gap:16px;max-inline-size:420px">
    <camo-toolbar label="Editor"><camo-icon-button label="Bold" toggle checked><camo-icon name="bold"></camo-icon></camo-icon-button><camo-icon-button label="Italic" toggle><camo-icon name="italic"></camo-icon></camo-icon-button><camo-icon-button label="Share"><camo-icon name="share"></camo-icon></camo-icon-button><camo-icon-button label="Delete" tone="error"><camo-icon name="delete"></camo-icon></camo-icon-button></camo-toolbar>
    <camo-toolbar label="Narrow" style="max-inline-size:180px"><camo-icon-button label="Bold"><camo-icon name="bold"></camo-icon></camo-icon-button><camo-icon-button label="Italic"><camo-icon name="italic"></camo-icon></camo-icon-button><camo-icon-button label="Share"><camo-icon name="share"></camo-icon></camo-icon-button><camo-icon-button label="Delete"><camo-icon name="delete"></camo-icon></camo-icon-button></camo-toolbar>
  </div>`,
};
export const ImagesAndRatings: Story = {
  render: () => html`<div style="display:grid;gap:16px;max-inline-size:320px">
    <camo-image src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 2'%3E%3Crect width='3' height='2' fill='%2300897b'/%3E%3C/svg%3E" content-description="A teal field" aspect-ratio="1.5" shape="large"></camo-image>
    <camo-image src="data:image/png;base64,AAAA" content-description="Broken" aspect-ratio="1.5"></camo-image>
    <camo-rating label="Quality" value="3.5" step="half"></camo-rating>
    <camo-rating label="Quality" value="4" readonly size="large"></camo-rating>
  </div>`,
};
export const Carousel: Story = {
  render:
    () => html`<div style="max-inline-size:360px"><camo-carousel caption="Photos" show-buttons="always">
    ${["#00897b", "#5c6bc0", "#c2185b"].map((c, i) => html`<div style="background:${c};color:white;display:grid;place-items:center;height:160px;font:600 24px sans-serif">${i + 1}</div>`)}
  </camo-carousel></div>`,
};
export const FileUploader: Story = {
  render:
    () => html`<camo-file-uploader label="Upload files" hint="PNG or JPG, up to 5 MB" multiple style="max-inline-size:420px"
    ${ref((el) => {
      if (el !== undefined)
        Object.assign(el, {
          files: [
            {
              id: "1",
              name: "report.pdf",
              sizeBytes: 1048576,
              progress: 0.45,
              status: "uploading",
            },
            {
              id: "2",
              name: "video.mov",
              sizeBytes: 9437184,
              status: "failed",
              message: "Too large",
            },
          ],
        });
    })}></camo-file-uploader>`,
};
export const DataTable: Story = {
  render:
    () => html`<div style="block-size:260px;max-inline-size:520px"><camo-data-table caption="People" selectable
    ${ref((el) => {
      if (el !== undefined)
        Object.assign(el, {
          columns: [
            { key: "name", header: "Name", sortable: true },
            { key: "role", header: "Role" },
            { key: "score", header: "Score", align: "end", sortable: true },
          ],
          rows: [
            { id: "1", name: "Ada Lovelace", role: "Analyst", score: 98 },
            { id: "2", name: "Grace Hopper", role: "Admiral", score: 95 },
            { id: "3", name: "Katherine Johnson", role: "Mathematician", score: 99 },
          ],
          sort: { columnKey: "name", ascending: true },
        });
    })}></camo-data-table></div>`,
};
export const Tree: Story = {
  render: () => html`<camo-tree caption="Files" style="max-inline-size:320px"
    ${ref((el) => {
      if (el !== undefined)
        Object.assign(el, {
          nodes: [
            {
              key: "docs",
              label: "Documents",
              icon: ["folder", "folder"],
              children: [{ key: "a", label: "Report.pdf", icon: "file" }],
            },
            { key: "pics", label: "Pictures", icon: ["folder", "folder"], hasChildren: true },
          ],
          expanded: ["docs"],
        });
    })}></camo-tree>`,
};
export const Navigation: Story = {
  render: () => html`<div style="display:grid;gap:16px;max-inline-size:420px">
    <camo-pagination page-count="20" page="9" label="Results"></camo-pagination>
    <camo-pagination page-count="9" page="2" variant="compact"></camo-pagination>
    <camo-pagination page-count="5" page="1" variant="dots"></camo-pagination>
    <camo-breadcrumb label="Path"><camo-breadcrumb-item label="Home"></camo-breadcrumb-item><camo-breadcrumb-item label="Documents"></camo-breadcrumb-item><camo-breadcrumb-item label="Projects"></camo-breadcrumb-item><camo-breadcrumb-item label="Camouflage"></camo-breadcrumb-item></camo-breadcrumb>
    <camo-progress-steps label="Checkout" current="1"><camo-step label="Cart"></camo-step><camo-step label="Shipping" description="Where it goes"></camo-step><camo-step label="Payment"></camo-step></camo-progress-steps>
  </div>`,
};
