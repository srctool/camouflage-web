import { html } from "lit";
import type { TemplateResult } from "lit";

const APPEARANCES = ["solid", "soft", "raised", "outline", "ghost", "link"] as const;
const TONES = ["default", "error", "success", "warning", "info"] as const;

const arrow = html`<svg slot="suffix-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6" /></svg>`;

function buttons(): TemplateResult {
  return html`
    <div class="row">
      ${APPEARANCES.map((a) => html`<camo-button text=${a} appearance=${a}></camo-button>`)}
    </div>
    <div class="row">
      ${TONES.map((t) => html`<camo-button text=${t} tone=${t}></camo-button>`)}
    </div>
    <div class="row">
      <camo-button text="Next" appearance="outline">${arrow}</camo-button>
      <camo-button text="Saving" loading></camo-button>
      <camo-button text="Unavailable" disabled></camo-button>
    </div>`;
}

function confirmation(): TemplateResult {
  return html`
    <camo-dialog open title="Delete item?" message="This can't be undone.">
      <camo-button slot="confirm" text="Delete" tone="error"></camo-button>
      <camo-button slot="dismiss" text="Cancel" appearance="ghost"></camo-button>
    </camo-dialog>`;
}

/**
 * The spike page: a Minimal provider with a nested Cupertino provider in the dark scheme, each with the same buttons.
 * Rendered on the server and left as is: the page's own markup needs no hydration, only the elements in it do.
 */
export function spikePage(): TemplateResult {
  return html`
    <camo-provider skin="minimal" scheme="light" class="page">
      <h1>Minimal</h1>
      ${buttons()}
      <camo-provider skin="cupertino" scheme="dark" class="panel">
        <h1>Cupertino, dark</h1>
        ${buttons()}
      </camo-provider>
    </camo-provider>`;
}

/**
 * The inputs page: every W3 input once, server-rendered and then hydrated, to show that hydration moves nothing and keeps
 * what the server wrote (values, labels, state).
 */
export function inputsPage(skin: string, scheme: string): TemplateResult {
  return html`<camo-provider skin=${skin} scheme=${scheme} class="page">
    <form style="display:grid;gap:16px;max-inline-size:420px">
      <camo-text-field name="email" label="Email" value="ada@example.com" supporting-text="We never share it"></camo-text-field>
      <camo-text-field name="bad" label="Floating" label-placement="floating" error="Something is wrong"></camo-text-field>
      <camo-search-field value="camouflage"></camo-search-field>
      <camo-checkbox name="terms" label="I accept" description="Required" checked></camo-checkbox>
      <camo-switch name="wifi" label="Wi-Fi" checked></camo-switch>
      <camo-radio-group name="plan" label="Plan" value="pro">
        <camo-radio value="free" label="Free"></camo-radio>
        <camo-radio value="pro" label="Pro" checked></camo-radio>
      </camo-radio-group>
      <camo-segmented-control name="range" label="Range" value="week">
        <camo-segment value="day" label="Day"></camo-segment>
        <camo-segment value="week" label="Week" selected></camo-segment>
      </camo-segmented-control>
      <camo-slider name="volume" label="Volume" min="0" max="100" step="10" value="30"></camo-slider>
      <camo-stepper name="qty" label="Quantity" min="1" max="10" value="3"></camo-stepper>
      <camo-date-picker name="when" label="Date" value="2026-11-18" locale="en-US"></camo-date-picker>
      <camo-time-picker name="at" label="Time" value="14:30" locale="en-US"></camo-time-picker>
      <camo-calendar value="2026-11-18" today="2026-11-22" locale="en-US"></camo-calendar>
    </form>
  </camo-provider>`;
}

/**
 * The structure page: containers, lists, a top bar and a select, server-rendered and then hydrated. Server rendering
 * cannot read an element's children, so what depends on them (a select's chosen label, the segments) is written down.
 */
export function structurePage(skin: string, scheme: string): TemplateResult {
  return html`<camo-provider skin=${skin} scheme=${scheme} class="page">
    <camo-top-bar title="Inbox">
      <camo-icon-button slot="navigation" label="Back"><camo-icon name="arrow-back"></camo-icon></camo-icon-button>
    </camo-top-bar>
    <camo-card appearance="outline" clickable selectable selected><camo-text text="Pro plan"></camo-text></camo-card>
    <camo-list-section title="Network" footer="Wi-Fi uses less battery">
      <camo-list-item headline="Wi-Fi" supporting="Home" clickable></camo-list-item>
      <camo-list-item headline="Bluetooth" supporting="On" clickable></camo-list-item>
    </camo-list-section>
    <camo-accordion title="Shipping" subtitle="2 to 4 days" expanded>Ships in two days.</camo-accordion>
    <camo-skeleton variant="list-item" lines="2"></camo-skeleton>
    <camo-select label="Country" value="id" selected-label="Indonesia"><camo-option value="id" label="Indonesia"></camo-option></camo-select>
  </camo-provider>`;
}

/**
 * The feedback and navigation page: progress, a banner, chips, a badge, avatars, a FAB, tabs and a navigation bar,
 * server-rendered and then hydrated. Server rendering cannot read an element's children, so the selected tab and item
 * carry `selected`, and nothing here animates (an indeterminate bar would differ from frame to frame).
 */
export function feedbackPage(skin: string, scheme: string): TemplateResult {
  return html`<camo-provider skin=${skin} scheme=${scheme} class="page">
    <camo-progress-bar progress="0.4" label="Uploading"></camo-progress-bar>
    <camo-progress-circle progress="0.6" label="Syncing"></camo-progress-circle>
    <camo-banner tone="warning" title="Storage almost full" message="You have used 95% of your storage.">
      <camo-button slot="actions" appearance="ghost" text="Manage"></camo-button>
    </camo-banner>
    <div style="display:flex;gap:8px;align-items:center">
      <camo-chip label="Open now" selectable selected></camo-chip>
      <camo-chip label="ada@example.com" removable></camo-chip>
      <camo-chip label="Paid" appearance="soft" tone="success"></camo-chip>
      <camo-badged-box><camo-icon-button label="Notifications"><camo-icon name="heart"></camo-icon></camo-icon-button><camo-badge slot="badge" count="3"></camo-badge></camo-badged-box>
      <camo-avatar name="Dwiki Riyadi" presence="online"></camo-avatar>
      <camo-avatar-group max="3"><camo-avatar name="Ada Lovelace"></camo-avatar><camo-avatar name="Grace Hopper"></camo-avatar></camo-avatar-group>
      <camo-fab content-description="Compose" text="Compose"><camo-icon slot="icon" name="edit"></camo-icon></camo-fab>
    </div>
    <camo-tabs label="Product" value="reviews">
      <camo-tab value="overview" label="Overview"></camo-tab>
      <camo-tab value="reviews" label="Reviews" selected></camo-tab>
      <camo-tab value="specs" label="Specs"></camo-tab>
    </camo-tabs>
    <camo-navigation-bar label="Main" value="home">
      <camo-nav-item value="home" label="Home" icon="home" selected></camo-nav-item>
      <camo-nav-item value="inbox" label="Inbox" icon="inbox"></camo-nav-item>
      <camo-nav-item value="saved" label="Saved" icon="star"></camo-nav-item>
    </camo-navigation-bar>
  </camo-provider>`;
}

/**
 * The later components' page: a button group, a split button, a toolbar, a rating, an image, pagination and steps,
 * server-rendered and then hydrated. A server cannot read children, so nothing here depends on them (a breadcrumb or a
 * carousel draws on the client), and the data table and tree, which draw from object properties, are left out: they render
 * on the server (tested in Node) but hydrate only when their properties are set before the element upgrades.
 */
export function laterPage(skin: string, scheme: string): TemplateResult {
  return html`<camo-provider skin=${skin} scheme=${scheme} class="page">
    <camo-button-group label="Formatting">
      <camo-group-button text="Bold" toggle selected></camo-group-button>
      <camo-group-button text="Italic" toggle></camo-group-button>
    </camo-button-group>
    <camo-split-button text="Save"><camo-menu-item text="Save as…"></camo-menu-item></camo-split-button>
    <camo-toolbar label="Editor" style="width: 360px">
      <camo-icon-button label="Bold"><camo-icon name="bold"></camo-icon></camo-icon-button>
      <camo-icon-button label="Italic"><camo-icon name="italic"></camo-icon></camo-icon-button>
    </camo-toolbar>
    <camo-rating label="Quality" value="3.5" step="half"></camo-rating>
    <div style="width: 240px"><camo-image src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 2'%3E%3Crect width='3' height='2' fill='%2300897b'/%3E%3C/svg%3E" content-description="A lake" aspect-ratio="1.5"></camo-image></div>
    <camo-pagination page-count="20" page="9" label="Results"></camo-pagination>
    <camo-progress-steps label="Checkout" current="1" style="width: 360px">
      <camo-step label="Cart" state="complete" index="0" count="3"></camo-step>
      <camo-step label="Shipping" state="current" index="1" count="3"></camo-step>
      <camo-step label="Payment" state="upcoming" index="2" count="3"></camo-step>
    </camo-progress-steps>
  </camo-provider>`;
}

/** A dialog page: the same dialog markup under both skins, one after the other (the server renders them open). */
export function dialogPage(skin: string, scheme: string): TemplateResult {
  return html`<camo-provider skin=${skin} scheme=${scheme} class="page">${confirmation()}</camo-provider>`;
}

const MONTHS = JSON.stringify(["Jan", "Feb", "Mar", "Apr"]);
const REGIONS = JSON.stringify([
  { name: "North", values: [42, 51, 48, 60] },
  { name: "South", values: [30, 28, 39, 44] },
]);
const SOURCES = JSON.stringify([
  { label: "Search", value: 45 },
  { label: "Direct", value: 30 },
  { label: "Social", value: 25 },
]);

/** The charts. Their data are attributes, so the server draws them and the browser reads the same data. */
export function chartsPage(skin: string, scheme: string): TemplateResult {
  return html`<camo-provider skin=${skin} scheme=${scheme} class="page">
    <camo-sparkline values="[3,5,4,8,6,9]" description="Signups"></camo-sparkline>
    <camo-line-chart title="Sales" categories=${MONTHS} series=${REGIONS} kind="area" curve="smooth" plot-height="100" style="width: 360px"></camo-line-chart>
    <camo-bar-chart title="Revenue" categories=${MONTHS} series=${REGIONS} plot-height="100" style="width: 360px"></camo-bar-chart>
    <camo-pie-chart title="Traffic" slices=${SOURCES} donut plot-height="100" style="width: 360px"></camo-pie-chart>
  </camo-provider>`;
}
