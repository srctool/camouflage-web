import { inspectAria } from "@srctool/camouflage-core";
import type { CamoProvider } from "@srctool/camouflage-core";
import { describe, expect, it } from "vitest";
import { cssVar, mount, settled } from "./helpers.ts";

const MINIMAL = { light: "#1b1b1b", dark: "#e8e8e8" };
const CUPERTINO = { light: "#007aff", dark: "#0a84ff" };

describe("camo-provider", () => {
  it("writes the skin's starter theme as --camo-* variables on itself", async () => {
    const root = mount(`<camo-provider skin="minimal" scheme="light"></camo-provider>`);
    await settled(root);
    const provider = root.firstElementChild as CamoProvider;
    expect(cssVar(provider, "--camo-color-primary")).toBe(MINIMAL.light);
    expect(cssVar(provider, "--camo-shape-medium")).toBe("8px");
    expect(cssVar(provider, "--camo-type-label-large-size")).toBe("0.875rem");
  });

  it("switches the whole variable set with its scheme", async () => {
    const root = mount(`<camo-provider skin="minimal" scheme="dark"></camo-provider>`);
    await settled(root);
    expect(cssVar(root.firstElementChild!, "--camo-color-primary")).toBe(MINIMAL.dark);
  });

  it("nests: a nested provider changes only the scheme it sets, and its subtree follows", async () => {
    const root = mount(`
      <camo-provider id="outer" skin="minimal" scheme="light">
        <camo-provider id="inner" scheme="dark"><span id="leaf">x</span></camo-provider>
      </camo-provider>`);
    await settled(root);
    expect(cssVar(root.querySelector("#outer")!, "--camo-color-primary")).toBe(MINIMAL.light);
    expect(cssVar(root.querySelector("#inner")!, "--camo-color-primary")).toBe(MINIMAL.dark);
    // The skin is inherited: the inner provider drew its variables from Minimal's starter theme.
    expect(cssVar(root.querySelector("#leaf")!, "--camo-color-primary")).toBe(MINIMAL.dark);
    expect(root.querySelector("#inner")!.getAttribute("data-camo-scheme")).toBe("dark");
  });

  it("inherits the scheme: an inner provider with none follows the one above", async () => {
    const root = mount(`
      <camo-provider skin="minimal" scheme="dark">
        <camo-provider id="inner"></camo-provider>
      </camo-provider>`);
    await settled(root);
    expect(root.querySelector("#inner")!.getAttribute("data-camo-scheme")).toBe("dark");
    expect(cssVar(root.querySelector("#inner")!, "--camo-color-primary")).toBe(MINIMAL.dark);
  });

  it("row 1: an inner provider with nothing set is the outer's skin and theme", async () => {
    const root = mount(`
      <camo-provider skin="cupertino" scheme="light"><camo-provider id="inner"></camo-provider></camo-provider>`);
    await settled(root);
    expect(cssVar(root.querySelector("#inner")!, "--camo-color-primary")).toBe(CUPERTINO.light);
  });

  it("row 2: a theme on the inner provider changes the theme only, keeping the skin", async () => {
    const root = mount(
      `<camo-provider skin="cupertino" scheme="light"><camo-provider id="inner"><camo-button text="Go"></camo-button></camo-provider></camo-provider>`,
    );
    const inner = root.querySelector("#inner") as CamoProvider;
    inner.theme = { light: { colors: { primary: "#ff0000" } } };
    await settled(root);
    expect(cssVar(inner, "--camo-color-primary")).toBe("#ff0000");
    // Only that variable changed; everything else is still Cupertino's.
    expect(cssVar(inner, "--camo-color-on-primary")).toBe("#ffffff");
    expect(cssVar(inner, "--camo-shape-medium")).toBe("12px");
    // The button below still draws with the Cupertino renderer (44 tall).
    expect(
      root.querySelector("camo-button")!.shadowRoot!.querySelector(".b")!.getAttribute("style"),
    ).toContain("44px");
  });

  it("row 3: a skin on the inner provider switches the skin and, with no explicit theme above, its starter", async () => {
    const root = mount(
      `<camo-provider skin="minimal" scheme="light"><camo-provider id="inner" skin="cupertino"></camo-provider></camo-provider>`,
    );
    await settled(root);
    expect(cssVar(root.querySelector("#inner")!, "--camo-color-primary")).toBe(CUPERTINO.light);
  });

  it("row 3: a skin on the inner provider keeps an explicit theme from above", async () => {
    const root = mount(
      `<camo-provider id="outer" skin="minimal" scheme="light"><camo-provider id="inner" skin="cupertino"></camo-provider></camo-provider>`,
    );
    (root.querySelector("#outer") as CamoProvider).theme = {
      light: { colors: { primary: "#ff0000" } },
    };
    await settled(root);
    expect(cssVar(root.querySelector("#inner")!, "--camo-color-primary")).toBe("#ff0000");
    // ...while its shapes are still the outer theme's (Minimal's 8), because the theme is the one inherited.
    expect(cssVar(root.querySelector("#inner")!, "--camo-shape-medium")).toBe("8px");
  });

  it("row 4: a skin and a theme on the inner provider are both used", async () => {
    const root = mount(
      `<camo-provider skin="minimal"><camo-provider id="inner" skin="cupertino"></camo-provider></camo-provider>`,
    );
    (root.querySelector("#inner") as CamoProvider).theme = {
      light: { colors: { primary: "#00ff00" } },
    };
    await settled(root);
    expect(cssVar(root.querySelector("#inner")!, "--camo-color-primary")).toBe("#00ff00");
    expect(cssVar(root.querySelector("#inner")!, "--camo-shape-medium")).toBe("12px");
  });

  it("takes a typed skin property, which wins over the attribute", async () => {
    const { cupertinoSkin } = await import("@srctool/camouflage-skin-cupertino");
    const root = mount(
      `<camo-provider skin="minimal"><camo-button text="Go"></camo-button></camo-provider>`,
    );
    (root.firstElementChild as CamoProvider).skin = cupertinoSkin;
    await settled(root);
    expect(
      root.querySelector("camo-button")!.shadowRoot!.querySelector(".b")!.getAttribute("style"),
    ).toContain("44px");
  });

  it("moves a component to the new provider's skin when it is moved", async () => {
    const root = mount(`
      <camo-provider id="a" skin="minimal"><camo-button id="b" text="Go"></camo-button></camo-provider>
      <camo-provider id="c" skin="cupertino"></camo-provider>`);
    await settled(root);
    const button = root.querySelector("#b")!;
    expect(button.shadowRoot!.querySelector(".b")!.getAttribute("style")).toContain("40px");
    root.querySelector("#c")!.append(button);
    await settled(root);
    expect(button.shadowRoot!.querySelector(".b")!.getAttribute("style")).toContain("44px");
  });

  it("gives a component with no provider the fallback skin, and it still works", async () => {
    const root = mount(`<camo-button text="Alone"></camo-button>`);
    await settled(root);
    const button = root.firstElementChild as HTMLElement;
    expect(button.shadowRoot!.querySelector(".b")).not.toBeNull();
    expect(inspectAria(button)?.role).toBe("button");
  });

  it("reports the environment the browser measured", async () => {
    const root = mount(
      `<camo-provider skin="minimal" window-size="compact" input="touch"><camo-button text="x"></camo-button></camo-provider>`,
    );
    await settled(root);
    // The server defaults came from attributes; the client corrected them after connecting (the Provider note, 3.3).
    const provider = root.firstElementChild as CamoProvider;
    expect(provider.measured?.windowSize).toBeDefined();
    expect(provider.measured?.capabilities?.backdropBlur).toBeTypeOf("boolean");
  });
});
