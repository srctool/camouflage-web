import { LitElement, html } from "lit";
import type { TemplateResult } from "lit";
import {
  camouflage,
  setEnvironmentSources,
  windowSizeOf,
  type CamoProvider,
  type WatchedQuery,
} from "@srctool/camouflage-core";
import { afterEach, describe, expect, it } from "vitest";
import { cssVar, mount, settled } from "./helpers.ts";

// A component that reads everything the provider offers, through the controller the notes call `camouflage(host)`.
class ProbeElement extends LitElement {
  readonly cx = camouflage(this);
  override render(): TemplateResult {
    const { environment, scheme } = this.cx;
    return html`${environment.windowSize}|${environment.input}|${environment.reducedMotion}|${scheme}|${this.cx.skin?.name}`;
  }
}
customElements.define("camo-test-probe", ProbeElement);

/** A media query the test controls: set `matches` and the provider's listener runs. */
class FakeQuery implements WatchedQuery {
  matches: boolean;
  readonly #listeners = new Set<() => void>();
  constructor(matches = false) {
    this.matches = matches;
  }
  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
  set(matches: boolean): void {
    this.matches = matches;
    for (const listener of this.#listeners) listener();
  }
  get listeners(): number {
    return this.#listeners.size;
  }
}

let restore: (() => void) | undefined;
afterEach(() => restore?.());

const probe = (root: ParentNode, id: string): ProbeElement =>
  root.querySelector<ProbeElement>(`#${id}`)!;
const text = (el: Element): string => el.shadowRoot!.textContent!.replace(/\s+/g, "");

describe("the inheritance rows with no provider above (rows 5 to 7)", () => {
  it("row 5: a skin only, with no outer provider, brings its own starter theme", async () => {
    const root = mount(`<camo-provider id="p" skin="cupertino"></camo-provider>`);
    await settled(root);
    expect(cssVar(root.firstElementChild!, "--camo-color-primary")).toBe("#007aff");
  });

  it("row 6: a theme only, with no outer provider, applies to the fallback skin", async () => {
    const root = mount(
      `<camo-provider id="p"><camo-test-probe id="a"></camo-test-probe></camo-provider>`,
    );
    const provider = root.firstElementChild as CamoProvider;
    provider.theme = { light: { colors: { primary: "#123456" } } };
    await settled(root);
    expect(cssVar(provider, "--camo-color-primary")).toBe("#123456");
    // The fallback skin is Minimal, and the rest of its starter theme is kept.
    expect(cssVar(provider, "--camo-color-on-primary")).toBe("#ffffff");
    expect(text(probe(root, "a"))).toContain("minimal");
  });

  it("row 7: a skin and a theme, with no outer provider, are both used", async () => {
    const root = mount(`<camo-provider id="p" skin="cupertino"></camo-provider>`);
    const provider = root.firstElementChild as CamoProvider;
    provider.theme = { light: { colors: { primary: "#abcdef" } } };
    await settled(root);
    expect(cssVar(provider, "--camo-color-primary")).toBe("#abcdef");
    expect(cssVar(provider, "--camo-shape-extra-large")).toBe("26px");
  });
});

describe("the environment", () => {
  it("gives the window size classes of ADR-41", () => {
    expect([0, 599, 600, 839, 840, 1199, 1200].map(windowSizeOf)).toEqual([
      "compact",
      "compact",
      "medium",
      "medium",
      "expanded",
      "expanded",
      "large",
    ]);
  });

  it("reads every value through a replaceable source", async () => {
    const queries = new Map<string, FakeQuery>([
      ["(pointer: coarse)", new FakeQuery(true)],
      ["(hover: none)", new FakeQuery(false)],
      ["(prefers-reduced-motion: reduce)", new FakeQuery(false)],
      ["(prefers-reduced-transparency: reduce)", new FakeQuery(true)],
      ["(prefers-color-scheme: dark)", new FakeQuery(false)],
    ]);
    restore = setEnvironmentSources({
      viewportWidth: () => 700,
      observeViewport: () => () => {},
      query: (media) => queries.get(media),
      supports: (property, value) => value.startsWith("blur"),
    });
    const root = mount(
      `<camo-provider skin="minimal"><camo-test-probe id="a"></camo-test-probe></camo-provider>`,
    );
    await settled(root);
    const provider = root.firstElementChild as CamoProvider;
    expect(provider.measured).toMatchObject({
      windowSize: "medium",
      input: "touch",
      reducedMotion: false,
      capabilities: {
        backdropBlur: true,
        runtimeShaders: false,
        windowMaterial: false,
        reduceTransparency: true,
      },
    });
    expect(text(probe(root, "a"))).toBe("medium|touch|false|light|minimal");
  });

  it("treats hover: none as touch, and a fine hovering pointer as pointer", async () => {
    const coarse = new FakeQuery(false);
    const noHover = new FakeQuery(true);
    restore = setEnvironmentSources({
      viewportWidth: () => 1300,
      observeViewport: () => () => {},
      query: (media) =>
        media === "(pointer: coarse)" ? coarse : media === "(hover: none)" ? noHover : undefined,
    });
    const root = mount(
      `<camo-provider skin="minimal"><camo-test-probe id="a"></camo-test-probe></camo-provider>`,
    );
    await settled(root);
    expect(text(probe(root, "a"))).toContain("large|touch");
    noHover.set(false);
    await settled(root);
    expect(text(probe(root, "a"))).toContain("large|pointer");
  });

  it("follows reduced motion live, and stops listening when the provider leaves", async () => {
    const reduced = new FakeQuery(false);
    restore = setEnvironmentSources({
      observeViewport: () => () => {},
      query: (media) => (media === "(prefers-reduced-motion: reduce)" ? reduced : undefined),
    });
    const root = mount(
      `<camo-provider skin="minimal"><camo-test-probe id="a"></camo-test-probe></camo-provider>`,
    );
    await settled(root);
    expect(text(probe(root, "a"))).toContain("|false|");
    reduced.set(true);
    await settled(root);
    expect(text(probe(root, "a"))).toContain("|true|");
    reduced.set(false);
    await settled(root);
    expect(text(probe(root, "a"))).toContain("|false|");
    expect(reduced.listeners).toBe(1);
    root.firstElementChild!.remove();
    expect(reduced.listeners).toBe(0);
  });

  it("zeroes the durations when the system asks for reduced motion, live", async () => {
    const root = mount(`<camo-provider skin="minimal"></camo-provider>`);
    await settled(root);
    const provider = root.firstElementChild!;
    // The stylesheet carries the media query, so the real system setting is honoured with no JavaScript at all.
    const css = [...provider.shadowRoot!.querySelectorAll("style")]
      .map((s) => s.textContent)
      .join("");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("--camo-motion-duration-long: 0ms");
    expect(cssVar(provider, "--camo-motion-duration-short")).toMatch(/^(0|120)ms$/);
  });

  it("lets a nested provider's attributes set what it needs, and inherits the rest", async () => {
    restore = setEnvironmentSources({ viewportWidth: () => undefined, query: () => undefined });
    const root = mount(`
      <camo-provider skin="minimal" window-size="compact" input="touch" platform="macos">
        <camo-test-probe id="outer"></camo-test-probe>
        <camo-provider window-size="large"><camo-test-probe id="inner"></camo-test-probe></camo-provider>
      </camo-provider>`);
    await settled(root);
    expect(text(probe(root, "outer"))).toBe("compact|touch|false|light|minimal");
    expect(text(probe(root, "inner"))).toBe("large|touch|false|light|minimal");
    expect(
      (root.querySelectorAll("camo-provider")[1] as CamoProvider).measured?.windowSize,
    ).toBeUndefined();
  });
});

describe("the controller and the content color", () => {
  it("resolves the theme as values for the scheme in force, and the per-subtree scheme", async () => {
    const root = mount(`
      <camo-provider skin="minimal" scheme="light">
        <camo-test-probe id="a"></camo-test-probe>
        <camo-provider scheme="dark"><camo-test-probe id="b"></camo-test-probe></camo-provider>
      </camo-provider>`);
    await settled(root);
    expect(probe(root, "a").cx.scheme).toBe("light");
    expect(probe(root, "b").cx.scheme).toBe("dark");
    expect(probe(root, "a").cx.theme?.colors.primary).toBe("#1b1b1b");
    expect(probe(root, "b").cx.theme?.colors.primary).toBe("#e8e8e8");
  });

  it("reads a brand's token set, and names the missing one", async () => {
    const root = mount(
      `<camo-provider skin="minimal"><camo-test-probe id="a"></camo-test-probe></camo-provider>`,
    );
    const provider = root.firstElementChild as CamoProvider;
    provider.theme = { light: { tokenSets: { brand: { "600": "#7c3aed" } } } };
    await settled(root);
    expect(probe(root, "a").cx.tokens("brand")).toEqual({ "600": "#7c3aed" });
    expect(() => probe(root, "a").cx.tokens("radius")).toThrow(
      'asked for the token set "radius", which the theme does not include (it has: brand)',
    );
    expect(cssVar(provider, "--brand-600")).toBe("#7c3aed");
  });

  it("resets the content color and icon size for its subtree", async () => {
    const root = mount(`<camo-provider skin="minimal"><span id="t">text</span></camo-provider>`);
    await settled(root);
    const provider = root.firstElementChild!;
    expect(cssVar(provider, "--camo-content-color")).toBe("#1b1b1b");
    expect(cssVar(provider, "--camo-icon-size")).toBe("24px");
    expect(getComputedStyle(root.querySelector("#t")!).color).toBe("rgb(27, 27, 27)");
  });

  it("gives the controller's content color as a live reference", async () => {
    const root = mount(
      `<camo-provider skin="minimal"><camo-test-probe id="a"></camo-test-probe></camo-provider>`,
    );
    await settled(root);
    expect(probe(root, "a").cx.contentColor).toBe("var(--camo-content-color)");
  });
});
