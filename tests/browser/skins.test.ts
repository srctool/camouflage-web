// What only a skin can get wrong: its materials' fallback chains with capabilities forced off (ADR-42), densities that
// follow the input (ADR-41), the options factories, and renderers borrowed from another skin.
import { PRESSED_ATTRIBUTE, setEnvironmentSources } from "@srctool/camouflage-core";
import type { CamoProvider, CamoSkin, EnvironmentSources } from "@srctool/camouflage-core";
import { carbonSkin } from "@srctool/camouflage-skin-carbon";
import { carbonTheme } from "@srctool/camouflage-skin-carbon/factory";
import {
  createCupertinoSkin,
  cupertinoTab,
  cupertinoTabs,
} from "@srctool/camouflage-skin-cupertino";
import { createFluentSkin, fluentSkin } from "@srctool/camouflage-skin-fluent";
import { fluentTheme } from "@srctool/camouflage-skin-fluent/factory";
import { createMaterialSkin, materialSkin } from "@srctool/camouflage-skin-material";
import { minimalSkin } from "@srctool/camouflage-skin-minimal";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { box, mount, settled } from "./helpers.ts";

let restore: (() => void) | undefined;
afterEach(() => {
  restore?.();
  restore = undefined;
});

interface World {
  blur?: boolean;
  shaders?: boolean;
  reduceTransparency?: boolean;
  touch?: boolean;
}

/** What the provider will measure: the platform's capabilities and its input, forced. */
function world({ blur = true, shaders = true, reduceTransparency = false, touch = false }: World) {
  const sources: Partial<EnvironmentSources> = {
    query: (media) => ({
      matches:
        (reduceTransparency && media.includes("reduced-transparency")) ||
        (touch && media.includes("coarse")),
      subscribe: () => () => {},
    }),
    supports: (_property, value) => (value.startsWith("blur") ? blur : shaders),
    chromium: () => shaders,
  };
  restore = setEnvironmentSources(sources);
}

async function show(
  skin: CamoSkin | string,
  body: string,
  theme?: CamoProvider["theme"],
): Promise<HTMLElement> {
  const root = mount(`<camo-provider scheme="light">${body}</camo-provider>`);
  const provider = root.firstElementChild as CamoProvider;
  provider.skin = skin;
  if (theme !== undefined) provider.theme = theme;
  await settled(root);
  return root;
}

const part = (root: HTMLElement, host: string, selector: string): HTMLElement =>
  root.querySelector(host)!.shadowRoot!.querySelector<HTMLElement>(selector)!;

const filterOf = (el: Element): string => {
  const style = getComputedStyle(el);
  return style.backdropFilter || style.getPropertyValue("-webkit-backdrop-filter");
};

/** Whether a computed color lets something through: any alpha below one, in whichever syntax the engine writes it. */
const translucent = (el: Element): boolean => {
  const color = getComputedStyle(el).backgroundColor;
  const alpha = color.includes("/")
    ? Number.parseFloat(color.split("/")[1]!)
    : color.startsWith("rgba")
      ? Number.parseFloat(color.split(",")[3]!)
      : 1;
  return alpha < 1;
};

const BAR = `<camo-top-bar title="Orders"></camo-top-bar>`;

describe("Cupertino's materials", () => {
  const classic = createCupertinoSkin();
  const glass = createCupertinoSkin({ surface: "liquid-glass" });

  it("blurs what is behind a bar under Classic", async () => {
    world({});
    const bar = part(await show(classic, BAR), "camo-top-bar", ".bar");
    expect(filterOf(bar)).toContain("blur(25px)");
    expect(filterOf(bar)).not.toContain("url(");
    expect(translucent(bar)).toBe(true);
  });

  it.each([
    ["no backdrop blur", { blur: false }],
    ["Reduce Transparency", { reduceTransparency: true }],
  ])("draws an opaque fill with %s, for both materials", async (_name, forced) => {
    world(forced);
    for (const skin of [classic, glass]) {
      const bar = part(await show(skin, BAR), "camo-top-bar", ".bar");
      expect(translucent(bar)).toBe(false);
      expect(filterOf(bar)).not.toContain("url(");
    }
  });

  it("bends the backdrop under Liquid Glass where the engine can, and keeps blur and edge where not", async () => {
    world({});
    const bent = part(await show(glass, BAR), "camo-top-bar", ".bar");
    // Only a Chromium engine can parse and draw the reference; the others drop the whole declaration if they cannot.
    if (CSS.supports("backdrop-filter", "url(#a) blur(1px)")) {
      expect(filterOf(bent)).toContain("url(");
    }
    restore?.();
    world({ shaders: false });
    const flat = part(await show(glass, BAR), "camo-top-bar", ".bar");
    expect(filterOf(flat)).not.toContain("url(");
    expect(filterOf(flat)).toContain("blur(16px)");
    expect(getComputedStyle(flat).boxShadow).not.toBe("none");
  });

  it("makes every glass button a capsule", async () => {
    world({});
    const root = await show(glass, `<camo-button text="Go" appearance="soft"></camo-button>`);
    const surface = part(root, "camo-button", ".camo-surface");
    expect(Number.parseFloat(getComputedStyle(surface).borderTopLeftRadius)).toBeGreaterThan(100);
    expect(translucent(surface)).toBe(true);
  });
});

describe("Fluent's surfaces", () => {
  const flyout = `<camo-surface level="high"></camo-surface><camo-popover open><camo-button slot="anchor" text="a"></camo-button>x</camo-popover>`;

  it("makes flyouts acrylic and keeps what is lower solid", async () => {
    world({});
    const root = await show(createFluentSkin({ surface: "acrylic" }), flyout);
    const panel = part(root, "camo-popover", ".camo-surface");
    expect(filterOf(panel)).toContain("blur(30px)");
    expect(translucent(panel)).toBe(true);
    expect(getComputedStyle(panel).backgroundImage).toContain("data:image/svg");
    expect(translucent(part(root, "camo-surface", ".camo-surface"))).toBe(false);
  });

  it("keeps the grain over a solid fill without blur, and drops both with Reduce Transparency", async () => {
    const acrylic = createFluentSkin({ surface: "acrylic" });
    world({ blur: false });
    const solid = part(await show(acrylic, flyout), "camo-popover", ".camo-surface");
    expect(translucent(solid)).toBe(false);
    expect(getComputedStyle(solid).backgroundImage).toContain("data:image/svg");
    restore?.();
    world({ reduceTransparency: true });
    const plain = part(await show(acrylic, flyout), "camo-popover", ".camo-surface");
    expect(translucent(plain)).toBe(false);
    expect(getComputedStyle(plain).backgroundImage).not.toContain("url(");
  });

  it("is Solid under Mica on the web, which has no window material", async () => {
    world({});
    const root = await show(createFluentSkin({ surface: "mica" }), BAR + flyout);
    expect(translucent(part(root, "camo-surface", ".camo-surface"))).toBe(false);
  });
});

describe("density follows the input", () => {
  const height = async (skin: CamoSkin | string, theme?: CamoProvider["theme"]): Promise<number> =>
    box(
      (await show(skin, `<camo-button text="Go"></camo-button>`, theme)).querySelector(
        "camo-button",
      )!,
    ).height;

  it.each([
    ["fluent", 32, 40],
    ["carbon", 40, 48],
  ])("%s: %ipx with a pointer, %ipx with fingers", async (name, pointer, finger) => {
    world({});
    expect(await height(name)).toBe(pointer);
    restore?.();
    world({ touch: true });
    expect(await height(name)).toBe(finger);
  });

  it("is fixed when the theme asks for a size", async () => {
    world({ touch: true });
    expect(await height(fluentSkin, fluentTheme({ density: "small" }))).toBe(24);
    expect(await height(carbonSkin, carbonTheme({ density: "sm" }))).toBe(32);
  });
});

describe("Material's feedback and options", () => {
  it("starts the ripple where the pointer went down", async () => {
    const root = await show("material", `<camo-button text="Press me"></camo-button>`);
    const button = root.querySelector<HTMLElement>("camo-button")!;
    await userEvent.hover(button);
    button.dispatchEvent(
      new PointerEvent("pointerdown", {
        button: 0,
        clientX: box(button).left + 10,
        clientY: box(button).top + 5,
      }),
    );
    expect(button.hasAttribute(PRESSED_ATTRIBUTE)).toBe(true);
    expect(button.style.getPropertyValue("--camo-press-x")).toBe("10px");
    expect(button.style.getPropertyValue("--camo-press-y")).toBe("5px");
    globalThis.dispatchEvent(new PointerEvent("pointerup"));
  });

  it("waves the progress bar only when asked", async () => {
    const bar = `<camo-progress-bar label="x" value="0.5"></camo-progress-bar>`;
    const mask = async (skin: CamoSkin): Promise<string> => {
      const fill = part(await show(skin, bar), "camo-progress-bar", ".fill");
      return getComputedStyle(fill).getPropertyValue("mask-image");
    };
    expect(await mask(materialSkin)).toBe("none");
    expect(await mask(createMaterialSkin({ expressiveProgress: true }))).toContain("data:image");
    expect(createMaterialSkin()).toBe(materialSkin);
  });
});

describe("borrowing a renderer", () => {
  it("draws Cupertino's segmented tabs inside Minimal", async () => {
    const mixed: CamoSkin = { ...minimalSkin, tabs: cupertinoTabs, tab: cupertinoTab };
    const root = await show(
      mixed,
      `<camo-tabs label="x" value="a"><camo-tab value="a" text="A"></camo-tab><camo-tab value="b" text="B"></camo-tab></camo-tabs><camo-button text="Go"></camo-button>`,
    );
    expect(part(root, "camo-tabs", ".tabs").classList.contains("segmented")).toBe(true);
    // The rest of the skin is still Minimal.
    expect(box(root.querySelector("camo-button")!).height).toBe(40);
  });
});
