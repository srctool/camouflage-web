import { cssText, tokens } from "@srctool/camouflage-core";
import type { CamoSkin } from "@srctool/camouflage-core";
import { carbonSkin } from "@srctool/camouflage-skin-carbon";
import { cupertinoSkin, createCupertinoSkin } from "@srctool/camouflage-skin-cupertino";
import { fluentSkin } from "@srctool/camouflage-skin-fluent";
import { materialSkin } from "@srctool/camouflage-skin-material";
import { minimalSkin } from "@srctool/camouflage-skin-minimal";
import type { TemplateResult } from "lit";
import { describe, expect, it } from "vitest";
import { buttonArgs, dialogArgs, sentinelStyle } from "../helpers/args.ts";
import { flatten } from "../helpers/flatten.ts";

const skins: [string, CamoSkin][] = [
  ["minimal", minimalSkin],
  ["cupertino", cupertinoSkin],
  ["cupertino liquid glass", createCupertinoSkin({ surface: "liquid-glass" })],
  ["material", materialSkin],
  ["fluent", fluentSkin],
  ["carbon", carbonSkin],
];

// A color, a size or a duration written into a renderer instead of coming from a token or a style field.
const LITERAL =
  /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl|oklch|hwb|lab)a?\(|\b\d+(?:\.\d+)?(?:px|rem|em|ms|s)\b/;

describe.each(skins)("%s renderers", (_name, skin) => {
  it("runs where there is no window or document (pure)", () => {
    expect(typeof (globalThis as { window?: unknown }).window).toBe("undefined");
    expect(typeof (globalThis as { document?: unknown }).document).toBe("undefined");
    expect(() => skin.button.render(buttonArgs(skin))).not.toThrow();
    expect(() => skin.dialog.render(dialogArgs(skin))).not.toThrow();
  });

  it("renders the same output twice for the same arguments", () => {
    expect(flatten(skin.button.render(buttonArgs(skin)))).toBe(
      flatten(skin.button.render(buttonArgs(skin))),
    );
    expect(flatten(skin.dialog.render(dialogArgs(skin)))).toBe(
      flatten(skin.dialog.render(dialogArgs(skin))),
    );
  });

  it("has complete defaults: every style field is set", () => {
    for (const style of [skin.button.defaults(tokens), skin.dialog.defaults(tokens)]) {
      for (const [key, value] of Object.entries(style)) {
        expect(value, key).not.toBeUndefined();
      }
    }
  });

  it("writes no color, size or duration literal in a render (tokens and style fields only)", () => {
    // With every style field replaced by a sentinel, anything literal left in the output is the renderer's own.
    // The skin's surface and feedback are materials with constants of their own (a focus ring's width), so they are
    // stubbed to pass their child through; the rule is about the renderers.
    const bare = {
      surfaceTreatment: { decorate: ({ child }: { child: TemplateResult }) => child },
      feedback: { wrap: ({ child }: { child: TemplateResult }) => child },
    };
    const button = { ...buttonArgs(skin, { appearance: "outline", loading: true }), skin: bare };
    const dialog = { ...dialogArgs(skin), skin: bare };
    for (const out of [
      flatten(skin.button.render({ ...button, style: sentinelStyle(button.style) })) +
        cssText(skin.button.styles),
      flatten(skin.dialog.render({ ...dialog, style: sentinelStyle(dialog.style) })) +
        cssText(skin.dialog.styles),
    ]) {
      const hit = LITERAL.exec(out.replace(/var\([^)]*\)/g, ""));
      expect(hit?.[0], `literal in a ${skin.name} renderer`).toBeUndefined();
    }
  });

  it("uses token references for the theme, never values", () => {
    const out = flatten(skin.button.render(buttonArgs(skin)));
    expect(out).toContain("var(--camo-color-");
    expect(out).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });

  it("places the slots the contract names, and no others", () => {
    const button = flatten(skin.button.render(buttonArgs(skin)));
    expect(button).toContain("prefix-icon");
    expect(button).toContain("suffix-icon");
    const dialog = flatten(skin.dialog.render(dialogArgs(skin)));
    for (const slot of ["confirm", "dismiss", "content"]) expect(dialog).toContain(slot);
  });

  it("keeps a button's color rule for every appearance and tone", () => {
    for (const appearance of ["solid", "soft", "raised", "outline", "ghost", "link"] as const) {
      for (const tone of ["default", "error", "success", "warning", "info"] as const) {
        const out = flatten(skin.button.render(buttonArgs(skin, { appearance, tone })));
        expect(out, `${appearance} ${tone}`).toContain("--b-fg:");
      }
    }
  });
});
