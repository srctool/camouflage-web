import { cssText } from "@srctool/camouflage-core";
import type { CamoSkin } from "@srctool/camouflage-core";
import { cupertinoSkin } from "@srctool/camouflage-skin-cupertino";
import { minimalSkin } from "@srctool/camouflage-skin-minimal";
import { html } from "lit";
import { describe, expect, it } from "vitest";
import { buttonArgs, dialogArgs } from "../helpers/args.ts";
import { assertPure, findLiteral, findPhysicalProperty } from "../helpers/conformance.ts";
import { flatten } from "../helpers/flatten.ts";
import { renderToString, squash } from "../helpers/ssr.ts";

await import("@srctool/camouflage-core/define");
await import("@srctool/camouflage-skin-minimal/register");
await import("@srctool/camouflage-skin-cupertino/register");

describe("the conformance helpers", () => {
  it("finds a literal outside var(), and nothing else", () => {
    expect(findLiteral("color: #fff")).toBe("#fff");
    expect(findLiteral("padding: 12px")).toBe("12px");
    expect(findLiteral("transition: opacity 120ms")).toBe("120ms");
    expect(
      findLiteral("color: var(--camo-color-primary, #fff); gap: var(--x, 4px)"),
    ).toBeUndefined();
    expect(findLiteral("flex: 1 1 auto; opacity: 0.5")).toBeUndefined();
  });

  it("finds a physical-side property, and not a logical one", () => {
    for (const bad of [
      "margin-left: 4px",
      "padding-right: var(--p)",
      "left: 0",
      "a { right: 0 }",
      "text-align: left",
      "float: right",
      "border-top-left-radius: var(--r)",
    ])
      expect(findPhysicalProperty(bad), bad).toBeDefined();
    for (const good of [
      "margin-inline-start: 4px",
      "padding-inline-end: var(--p)",
      "inset-inline-start: 0",
      "text-align: start",
      "border-start-start-radius: var(--r)",
      "justify-content: flex-end",
      "inset: 0",
    ])
      expect(findPhysicalProperty(good), good).toBeUndefined();
  });

  it("flags a renderer that is not pure", () => {
    let n = 0;
    expect(() => assertPure(() => String(n++))).toThrow("two different outputs");
    expect(() => assertPure(() => "same")).not.toThrow();
  });
});

describe.each<[string, CamoSkin]>([
  ["minimal", minimalSkin],
  ["cupertino", cupertinoSkin],
])("%s renderers follow the rules", (_name, skin) => {
  const outputs = (): { name: string; markup: string; css: string }[] => [
    {
      name: "button",
      markup: flatten(
        skin.button.render(buttonArgs(skin, { appearance: "outline", loading: true })),
      ),
      css: cssText(skin.button.styles),
    },
    {
      name: "dialog",
      markup: flatten(skin.dialog.render(dialogArgs(skin))),
      css: cssText(skin.dialog.styles),
    },
  ];

  it("use logical properties only, in their styles and in the styles they render", () => {
    for (const { name, markup, css } of outputs()) {
      expect(findPhysicalProperty(css), `${skin.name} ${name} styles`).toBeUndefined();
      expect(findPhysicalProperty(markup), `${skin.name} ${name} markup`).toBeUndefined();
    }
  });

  it("render the same markup twice, and the same page on the server twice", () => {
    assertPure(() => flatten(skin.button.render(buttonArgs(skin))));
    assertPure(() => flatten(skin.dialog.render(dialogArgs(skin))));
    const page = (): string =>
      squash(
        renderToString(
          html`<camo-provider skin=${skin.name} scheme="dark"
            ><camo-button text="Save" appearance="outline"></camo-button
            ><camo-dialog open title="T" message="M"
              ><camo-button slot="confirm" text="OK"></camo-button></camo-dialog
          ></camo-provider>`,
        ),
      );
    expect(page()).toBe(page());
  });
});
