import { html } from "lit";
import { describe, expect, it } from "vitest";
import { renderToString, squash } from "../helpers/ssr.ts";

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
