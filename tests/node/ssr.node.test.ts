import { html } from "lit";
import { describe, expect, it } from "vitest";
import { renderToString, squash } from "../helpers/ssr.ts";
import { registerDemoIcons } from "../../scenarios/icons.ts";

registerDemoIcons();
await import("@srctool/camouflage-core/define");
await import("@srctool/camouflage-skin-minimal/register");
await import("@srctool/camouflage-skin-cupertino/register");

const MINIMAL_PRIMARY = "--camo-color-primary: #1b1b1b";
const CUPERTINO_PRIMARY = "--camo-color-primary: #007aff";

describe("server rendering", () => {
  const page = html`<camo-provider skin="minimal" scheme="light">
    <camo-button text="Save"></camo-button>
    <camo-provider skin="cupertino" scheme="dark">
      <camo-button text="Delete" tone="error" disabled></camo-button>
    </camo-provider>
  </camo-provider>`;
  const out = squash(renderToString(page));

  it("renders every element into declarative shadow DOM", () => {
    expect(
      out.match(/<template shadowroot="open" shadowrootmode="open"/g)?.length,
    ).toBeGreaterThanOrEqual(4);
  });

  it("gives each provider its own skin's theme as variables, in the first bytes", () => {
    const first = out.indexOf(MINIMAL_PRIMARY);
    const second = out.indexOf(CUPERTINO_PRIMARY);
    expect(first).toBeGreaterThan(-1);
    expect(second).toBeGreaterThan(first); // the nested provider comes later in the document
  });

  it("sets the scheme on each provider, the nested one overriding", () => {
    expect(out).toMatch(/<camo-provider[^>]*skin="minimal"[^>]*data-camo-scheme="light"/);
    expect(out).toMatch(/<camo-provider[^>]*skin="cupertino"[^>]*data-camo-scheme="dark"/);
  });

  it("draws each button with the skin of its provider, from the same markup", () => {
    const buttons = out.split("<camo-button").slice(1);
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toContain("--b-height: var(--camo-button-height, 40px)"); // Minimal: 40 tall
    expect(buttons[1]).toContain("--b-height: var(--camo-button-height, 44px)"); // Cupertino: 44 tall
  });

  it("carries role, name and state as attributes, so the page works with scripts off", () => {
    expect(out).toMatch(/<camo-button[^>]*role="button"[^>]*aria-label="Save"/);
    expect(out).toMatch(/<camo-button[^>]*aria-label="Delete"[^>]*aria-disabled="true"/);
    expect(out).toMatch(/<camo-button[^>]*tabindex="-1"/);
  });

  it("starts nothing the browser must run: no scripts in the markup", () => {
    expect(out).not.toContain("<script");
  });
});

describe("the provider on the server, from attributes only", () => {
  const out = squash(
    renderToString(
      html`<camo-provider skin="minimal" scheme="dark" window-size="compact" input="touch" platform="macos">
        <camo-button text="Save"></camo-button>
      </camo-provider>`,
    ),
  );

  it("writes the whole theme, both schemes and the reduced-motion rule, with no script", () => {
    expect(out).toContain("--camo-color-primary: #1b1b1b");
    expect(out).toContain("--camo-color-primary: #e8e8e8");
    expect(out).toContain("--camo-color-tertiary:");
    expect(out).toContain("--camo-motion-duration-long: 300ms");
    expect(out).toContain("prefers-reduced-motion: reduce");
    expect(out).not.toContain("<script");
  });

  it("resets the content color and icon size for the subtree", () => {
    expect(out).toContain(
      ":host { color: var(--camo-content-color); --camo-content-color: var(--camo-color-on-surface); --camo-icon-size: 24px; }",
    );
  });

  it("keeps the scheme and the environment attributes it was given", () => {
    expect(out).toMatch(/<camo-provider[^>]*data-camo-scheme="dark"/);
    expect(out).toMatch(/<camo-provider[^>]*window-size="compact"/);
  });
});

describe("a dialog on the server", () => {
  const dialog = (skin: string): string =>
    squash(
      renderToString(
        html`<camo-provider skin=${skin}>
          <camo-dialog open title="Delete item?" message="This can't be undone.">
            <camo-button slot="confirm" text="Delete" tone="error"></camo-button>
            <camo-button slot="dismiss" text="Cancel" appearance="ghost"></camo-button>
          </camo-dialog>
        </camo-provider>`,
      ),
    );

  it("arrives open, named and described", () => {
    const out = dialog("minimal");
    expect(out).toMatch(
      /<dialog[^>]*aria-labelledby="title"[^>]*aria-describedby="message"[^>]*open/,
    );
    expect(out).toContain("Delete item?");
    expect(out).toContain("This can&#39;t be undone."); // escaped by the template engine, never raw HTML
  });

  it("places the actions by skin from the same markup (Minimal: cancel then delete; Cupertino: delete then cancel)", () => {
    const place = (out: string): string[] =>
      [...out.matchAll(/<slot name="(confirm|dismiss)"/g)].map((m) => m[1] ?? "");
    expect(place(dialog("minimal"))).toEqual(["dismiss", "confirm"]);
    expect(place(dialog("cupertino"))).toEqual(["confirm", "dismiss"]);
  });

  it("stacks the actions under Cupertino and lays them out at the end under Minimal", () => {
    expect(dialog("minimal")).toContain("actions-end");
    expect(dialog("cupertino")).toContain("actions-stacked");
  });
});

describe("a component with no provider", () => {
  it("uses the registered fallback skin (Minimal) and logs once", () => {
    const out = squash(renderToString(html`<camo-button text="Alone"></camo-button>`));
    expect(out).toContain("--b-height: var(--camo-button-height, 40px)");
  });
});

describe("the W2 components on the server", () => {
  const page = (skin: string): string =>
    squash(
      renderToString(
        html`<camo-provider skin=${skin} scheme="light">
          <camo-surface level="low" shape="large" elevation="level2" border>
            <camo-text variant="title-medium" max-lines="2" overflow="ellipsis" text="Hello"></camo-text>
            <camo-text variant="body-small">Read the <a href="#terms">terms</a></camo-text>
            <camo-divider inset="start"></camo-divider>
            <camo-icon name="close" label="Close"></camo-icon>
            <camo-icon name="close"></camo-icon>
            <camo-icon-button label="Favorite" toggle checked tooltip="Favorite">
              <camo-icon name="heart"></camo-icon>
            </camo-icon-button>
          </camo-surface>
        </camo-provider>`,
      ),
    );

  it.each(["minimal", "cupertino"])(
    "renders every one into declarative shadow DOM under %s",
    (skin) => {
      const out = page(skin);
      for (const tag of [
        "camo-surface",
        "camo-text",
        "camo-divider",
        "camo-icon",
        "camo-icon-button",
      ])
        expect(out, tag).toContain(`<${tag}`);
      expect(out).not.toContain("<script");
    },
  );

  it("carries role, name and state as attributes in the first bytes", () => {
    const out = page("minimal");
    expect(out).toMatch(/<camo-icon[^>]*role="img"[^>]*aria-label="Close"/);
    expect(out).toMatch(/<camo-icon[^>]*role="presentation"[^>]*aria-hidden="true"/);
    expect(out).toMatch(
      /<camo-icon-button[^>]*role="button"[^>]*aria-label="Favorite"[^>]*aria-pressed="true"/,
    );
    expect(out).toMatch(/<camo-divider[^>]*aria-hidden="true"/);
    expect(out).toMatch(/<camo-surface[^>]*role="generic"/);
  });

  it("draws a registered icon as inline SVG, and the same markup differs per skin", () => {
    const minimal = page("minimal");
    expect(minimal).toContain("<svg");
    expect(minimal).toContain('viewBox="0 0 24 24"');
    // Minimal's icon button container is 40 and Cupertino's is 44, from the same markup.
    expect(minimal).toContain("--b-size: var(--camo-icon-button-container-size, 40px)");
    expect(page("cupertino")).toContain("--b-size: var(--camo-icon-button-container-size, 44px)");
  });

  it("paints the surface level and styles a link in the skin's way", () => {
    const out = page("minimal");
    expect(out).toContain("var(--camo-color-surface-container-low)");
    expect(out).toContain("--t-link-decoration: underline");
    expect(page("cupertino")).toContain("--t-link-decoration: none");
  });
});

describe("the W3 inputs on the server", () => {
  const page = (skin: string): string =>
    squash(
      renderToString(
        html`<camo-provider skin=${skin} scheme="light">
          <camo-text-field name="email" label="Email" value="ada@example.com" supporting-text="Helper" prefix-text="+62"></camo-text-field>
          <camo-text-field label="Bad" error="Wrong" label-placement="floating"></camo-text-field>
          <camo-search-field value="cam"></camo-search-field>
          <camo-checkbox label="Remember" checked description="On this device"></camo-checkbox>
          <camo-switch label="Wi-Fi" checked></camo-switch>
          <camo-radio-group label="Plan" value="pro">
            <camo-radio value="free" label="Free"></camo-radio>
            <camo-radio value="pro" label="Pro" checked></camo-radio>
          </camo-radio-group>
          <camo-segmented-control label="Range" value="week">
            <camo-segment value="day" label="Day"></camo-segment>
            <camo-segment value="week" label="Week" selected></camo-segment>
          </camo-segmented-control>
          <camo-slider label="Volume" min="0" max="100" value="30"></camo-slider>
          <camo-stepper label="Quantity" min="1" max="10" value="3"></camo-stepper>
          <camo-calendar value="2026-11-18" today="2026-11-22" locale="en-US"></camo-calendar>
          <camo-date-picker label="Birth" value="2026-11-18" locale="en-US"></camo-date-picker>
          <camo-time-picker label="Pickup" value="14:30" locale="en-US"></camo-time-picker>
        </camo-provider>`,
      ),
    );

  it.each(["minimal", "cupertino"])(
    "renders every one into declarative shadow DOM under %s, with no script",
    (skin) => {
      const out = page(skin);
      for (const tag of [
        "camo-text-field",
        "camo-search-field",
        "camo-checkbox",
        "camo-switch",
        "camo-radio-group",
        "camo-radio",
        "camo-segmented-control",
        "camo-segment",
        "camo-slider",
        "camo-stepper",
        "camo-calendar",
        "camo-date-picker",
        "camo-time-picker",
      ])
        expect(out, tag).toContain(`<${tag}`);
      expect(out).not.toContain("<script");
    },
  );

  it("puts the editable value and the label links in the first bytes", () => {
    const out = page("minimal");
    expect(out).toMatch(/<input[^>]*id="input"[^>]*value="ada@example.com"/);
    expect(out).toContain('aria-labelledby="label"');
    expect(out).toContain('aria-describedby="supporting"');
    expect(out).toContain('aria-describedby="error"');
    expect(out).toContain("Helper");
    expect(out).toContain("Wrong");
    expect(out).toMatch(/<input[^>]*type="search"[^>]*value="cam"/);
    expect(out).toMatch(/value="Nov 18, 2026"/);
    expect(out).toMatch(/value="2:30\s?PM"/);
  });

  it("carries role, name and state as attributes", () => {
    const out = page("minimal");
    expect(out).toMatch(
      /<camo-checkbox[^>]*role="checkbox"[^>]*aria-label="Remember"[^>]*aria-checked="true"/,
    );
    expect(out).toMatch(/<camo-switch[^>]*role="switch"[^>]*aria-checked="true"/);
    expect(out).toMatch(/<camo-radio-group[^>]*role="radiogroup"[^>]*aria-label="Plan"/);
    expect(out).toMatch(
      /<camo-slider[^>]*role="slider"[^>]*aria-valuenow="30"[^>]*aria-valuemin="0"[^>]*aria-valuemax="100"/,
    );
    expect(out).toMatch(/<camo-stepper[^>]*role="group"[^>]*aria-label="Quantity"/);
    expect(out).toContain('role="spinbutton"');
    expect(out).toContain('aria-label="Quantity"');
  });

  it("renders the calendar month with full dates, and differs per skin where the skins differ", () => {
    const out = page("minimal");
    expect(out).toContain("November 2026");
    expect(out).toContain('aria-label="Wednesday, November 18, 2026"');
    expect(out).toContain('data-date="2026-11-18"');
    // The same markup, a different skin: Minimal's checkbox label follows the box, Cupertino's switch is wider.
    expect(page("minimal")).toContain("--s-track-width: var(--camo-switch-track-width, 44px)");
    expect(page("cupertino")).toContain("--s-track-width: var(--camo-switch-track-width, 51px)");
  });

  it("gives the same page twice the same bytes", () => {
    expect(page("cupertino")).toBe(page("cupertino"));
  });
});

describe("the W4 structure and overlays on the server", () => {
  const page = (skin: string): string =>
    squash(
      renderToString(
        html`<camo-provider skin=${skin} scheme="light">
          <camo-top-bar title="Inbox"><camo-icon-button slot="navigation" label="Back"><camo-icon name="arrow-back"></camo-icon></camo-icon-button></camo-top-bar>
          <camo-card appearance="outline" clickable selectable selected><camo-text text="Pro plan"></camo-text></camo-card>
          <camo-list-section title="Network" footer="Notes">
            <camo-list-item headline="Wi-Fi" supporting="Home" clickable><camo-icon slot="leading" name="search"></camo-icon></camo-list-item>
            <camo-list-item headline="Bluetooth"></camo-list-item>
          </camo-list-section>
          <camo-accordion title="Shipping" subtitle="2 days" expanded>Ships soon</camo-accordion>
          <camo-skeleton variant="list-item" lines="2"></camo-skeleton>
          <camo-paged-list label="People"></camo-paged-list>
          <camo-menu><camo-button slot="anchor" text="Actions"></camo-button><camo-menu-item text="Copy" trailing-text="⌘C"></camo-menu-item><camo-menu-item text="Delete" tone="error"></camo-menu-item></camo-menu>
          <camo-tooltip text="Save the file"><camo-button text="Save"></camo-button></camo-tooltip>
          <camo-select label="Country" value="id"><camo-option value="id" label="Indonesia"></camo-option></camo-select>
          <camo-bottom-sheet open title="Share"><camo-list-item headline="Message"></camo-list-item></camo-bottom-sheet>
        </camo-provider>`,
      ),
    );

  it.each(["minimal", "cupertino"])(
    "renders every one into declarative shadow DOM under %s, with no script",
    (skin) => {
      const out = page(skin);
      for (const tag of [
        "camo-top-bar",
        "camo-card",
        "camo-list-section",
        "camo-list-item",
        "camo-accordion",
        "camo-skeleton",
        "camo-paged-list",
        "camo-menu",
        "camo-menu-item",
        "camo-tooltip",
        "camo-select",
        "camo-bottom-sheet",
      ])
        expect(out, tag).toContain(`<${tag}`);
      expect(out).not.toContain("<script");
    },
  );

  it("carries role, name and state as attributes, and draws the texts", () => {
    const out = page("minimal");
    expect(out).toMatch(/<camo-card[^>]*role="button"[^>]*aria-pressed="true"/);
    expect(out).toMatch(/<camo-list-item[^>]*role="button"[^>]*aria-label="Wi-Fi, Home"/);
    expect(out).toMatch(/<camo-skeleton[^>]*aria-hidden="true"/);
    expect(out).toMatch(/<camo-menu-item[^>]*role="menuitem"[^>]*aria-label="Copy"/);
    expect(out).toContain('aria-expanded="true"'); // the accordion header
    expect(out).toContain("Network");
    expect(out).toContain("⌘C");
    expect(out).toContain("Indonesia");
    expect(out).toMatch(/<dialog[^>]*aria-labelledby="title"[^>]*open/); // the sheet arrives open
  });

  it("draws the same markup differently per skin", () => {
    expect(page("minimal")).toContain("--li-min: var(--camo-list-item-min-height-one-line, 56px)");
    expect(page("cupertino")).toContain(
      "--li-min: var(--camo-list-item-min-height-one-line, 48px)",
    );
    expect(page("minimal")).not.toContain('class="large"');
    expect(page("cupertino")).toContain('class="large"');
  });

  it("gives the same page twice the same bytes", () => {
    expect(page("cupertino")).toBe(page("cupertino"));
  });
});

describe("the W5 feedback, display and navigation on the server", () => {
  const page = (skin: string): string =>
    squash(
      renderToString(
        html`<camo-provider skin=${skin} scheme="light">
          <camo-progress-bar progress="0.4" label="Uploading"></camo-progress-bar>
          <camo-progress-bar label="Loading"></camo-progress-bar>
          <camo-progress-circle progress="0.5" size="large" label="Working"></camo-progress-circle>
          <camo-banner tone="warning" title="Storage" message="Almost full" dismissible><camo-button slot="actions" appearance="ghost" text="Manage"></camo-button></camo-banner>
          <camo-snackbar message="Archived" action="Undo"></camo-snackbar>
          <camo-chip label="Open now" selectable selected></camo-chip>
          <camo-chip label="ada@example.com" removable></camo-chip>
          <camo-chip-group label="Sort" value="a"><camo-chip value="a" label="Newest"></camo-chip><camo-chip value="b" label="Oldest"></camo-chip></camo-chip-group>
          <camo-badged-box><camo-icon-button label="Notifications"><camo-icon name="heart"></camo-icon></camo-icon-button><camo-badge slot="badge" count="120"></camo-badge></camo-badged-box>
          <camo-avatar name="Dwiki Riyadi" presence="online"></camo-avatar>
          <camo-avatar-group max="2"><camo-avatar name="Ada Lovelace"></camo-avatar><camo-avatar name="Grace Hopper"></camo-avatar><camo-avatar name="Alan Turing"></camo-avatar></camo-avatar-group>
          <camo-fab content-description="Compose" text="Compose"><camo-icon slot="icon" name="edit"></camo-icon></camo-fab>
          <camo-tabs label="Product" value="b"><camo-tab value="a" label="Overview"></camo-tab><camo-tab value="b" label="Reviews" selected></camo-tab></camo-tabs>
          <camo-navigation-bar label="Main" value="home"><camo-nav-item value="home" label="Home" icon="home" selected></camo-nav-item><camo-nav-item value="inbox" label="Inbox" icon="inbox"></camo-nav-item></camo-navigation-bar>
          <camo-navigation-rail label="Main" value="home"><camo-nav-item value="home" label="Home" icon="home"></camo-nav-item></camo-navigation-rail>
          <camo-navigation-drawer label="Mail" value="inbox"><camo-nav-section title="Mail"><camo-nav-item value="inbox" label="Inbox" icon="inbox"></camo-nav-item></camo-nav-section></camo-navigation-drawer>
          <camo-modal-drawer open label="Navigation" value="inbox"><camo-nav-item value="inbox" label="Inbox" icon="inbox"></camo-nav-item></camo-modal-drawer>
        </camo-provider>`,
      ),
    );

  it.each(["minimal", "cupertino"])(
    "renders every one into declarative shadow DOM under %s, with no script",
    (skin) => {
      const out = page(skin);
      for (const tag of [
        "camo-progress-bar",
        "camo-progress-circle",
        "camo-banner",
        "camo-snackbar",
        "camo-chip",
        "camo-chip-group",
        "camo-badge",
        "camo-badged-box",
        "camo-avatar",
        "camo-avatar-group",
        "camo-fab",
        "camo-tab",
        "camo-tabs",
        "camo-nav-item",
        "camo-nav-section",
        "camo-navigation-bar",
        "camo-navigation-rail",
        "camo-navigation-drawer",
        "camo-modal-drawer",
      ])
        expect(out, tag).toContain(`<${tag}`);
      expect(out).not.toContain("<script");
    },
  );

  it("carries role, name and state as attributes", () => {
    const out = page("minimal");
    expect(out).toMatch(
      /<camo-progress-bar[^>]*role="progressbar"[^>]*aria-valuenow="40"[^>]*aria-valuetext="40%"/,
    );
    expect(out).toMatch(/<camo-progress-circle[^>]*aria-valuenow="50"/);
    expect(out).toMatch(/<camo-banner[^>]*role="alert"/);
    expect(out).toMatch(/<camo-snackbar[^>]*role="status"[^>]*aria-live="polite"/);
    expect(out).toMatch(/<camo-chip[^>]*role="button"[^>]*aria-pressed="true"/);
    expect(out).toMatch(/<camo-avatar[^>]*role="img"[^>]*aria-label="Dwiki Riyadi, online"/);
    expect(out).toMatch(/<camo-fab[^>]*role="button"[^>]*aria-label="Compose"/);
    expect(out).toMatch(/<camo-tabs[^>]*role="tablist"/);
    expect(out).toMatch(/<camo-tab[^>]*role="tab"[^>]*aria-selected="true"/);
    expect(out).toMatch(/<camo-navigation-bar[^>]*role="navigation"[^>]*aria-label="Main"/);
    expect(out).toMatch(/<camo-nav-item[^>]*role="link"/);
    expect(out).toMatch(/<camo-nav-item[^>]*aria-current="page"/);
    expect(out).toMatch(/<dialog[^>]*aria-label="Navigation"[^>]*open/); // the drawer arrives open
  });

  it("draws the texts, the initials, the capped count and the hidden avatars", () => {
    const out = page("minimal");
    for (const text of [
      "Storage",
      "Almost full",
      "Archived",
      "Undo",
      "Open now",
      "ada@example.com",
      "DR",
      "99+",
      "Compose",
      "Overview",
      "Reviews",
    ])
      expect(out, text).toContain(text);
    // Avatars past `max` are hidden by a rule in the group's own style, which a server renders too.
    expect(out).toContain("nth-child(n + 3)");
  });

  it("draws the same markup differently per skin", () => {
    // A bar is 2 px under Minimal and 4 px under Cupertino; tabs are lines or a segmented pill.
    expect(page("minimal")).toContain("--pb-height: var(--camo-progress-bar-bar-height, 2px)");
    expect(page("cupertino")).toContain("--pb-height: var(--camo-progress-bar-bar-height, 4px)");
    expect(page("minimal")).toContain('class="tabs underline"');
    expect(page("cupertino")).toContain('class="tabs segmented"');
    // The snackbar sits at the bottom under Minimal and at the top under Cupertino.
    expect(page("minimal")).toContain('data-position="bottom"');
    expect(page("cupertino")).toContain('data-position="top"');
  });

  it("draws the selected tab's own indicator until the bar has measured, so nothing jumps", () => {
    expect(page("minimal")).toMatch(/class="self line"/);
  });

  it("gives the same page twice the same bytes", () => {
    expect(page("cupertino")).toBe(page("cupertino"));
  });
});
