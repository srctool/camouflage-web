import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  COMPONENT_NAMES,
  assertCompleteSkin,
  classic,
  defineSkin,
  fade,
  flat,
  inProgressSkin,
  missingRenderers,
  opacity,
  registerSkin,
  tokens,
} from "@srctool/camouflage-core";
import type { CamoSkin, InProgressSkin } from "@srctool/camouflage-core";
import { carbonSkin } from "@srctool/camouflage-skin-carbon";
import { cupertinoSkin } from "@srctool/camouflage-skin-cupertino";
import { fluentSkin } from "@srctool/camouflage-skin-fluent";
import { materialSkin } from "@srctool/camouflage-skin-material";
import { minimalSkin } from "@srctool/camouflage-skin-minimal";
import { renderToString, squash } from "../helpers/ssr.ts";
import { html } from "lit";

const { dialog: _dialog, ...withoutDialog } = minimalSkin;
void _dialog;

describe("the skin contract", () => {
  it("lists every component the contract has a renderer for", () => {
    expect([...COMPONENT_NAMES]).toEqual([
      "text",
      "icon",
      "surface",
      "divider",
      "button",
      "iconButton",
      "textField",
      "searchField",
      "checkbox",
      "switch",
      "radio",
      "segmentedControl",
      "segment",
      "slider",
      "stepper",
      "calendar",
      "timePicker",
      "card",
      "listItem",
      "listSection",
      "accordion",
      "skeleton",
      "pagedList",
      "bottomSheet",
      "menu",
      "menuItem",
      "tooltip",
      "topBar",
      "dialog",
      "progressBar",
      "progressCircle",
      "snackbar",
      "banner",
      "chip",
      "badge",
      "avatar",
      "fab",
      "tabs",
      "tab",
      "navItem",
      "navigationBar",
      "navigationRail",
      "navigationDrawer",
      "buttonGroup",
      "groupButton",
      "splitButton",
      "popover",
      "sideSheet",
      "toolbar",
      "image",
      "rating",
      "carousel",
      "fileUploader",
      "dataTable",
      "tree",
      "pagination",
      "breadcrumb",
      "progressSteps",
      "splitPane",
      "scrollbar",
    ]);
    expect(missingRenderers(minimalSkin)).toEqual([]);
    for (const skin of [cupertinoSkin, materialSkin, fluentSkin, carbonSkin])
      expect(missingRenderers(skin)).toEqual([]);
  });

  it("names the renderer a skin is missing", () => {
    const partial: InProgressSkin = { ...withoutDialog, name: "partial" };
    expect(missingRenderers(partial)).toEqual(["dialog"]);
    expect(() => assertCompleteSkin(partial)).toThrow(
      'Skin "partial" is incomplete: missing dialog.',
    );
  });

  it("names every missing part, and a missing name", () => {
    const bare = { name: "bare" } as unknown as InProgressSkin;
    expect(() => assertCompleteSkin(bare)).toThrow(
      'Skin "bare" is incomplete: missing surfaceTreatment, feedback, text, icon, surface, divider, button, iconButton, textField, searchField, checkbox, switch, radio, segmentedControl, segment, slider, stepper, calendar, timePicker, card, listItem, listSection, accordion, skeleton, pagedList, bottomSheet, menu, menuItem, tooltip, topBar, dialog, progressBar, progressCircle, snackbar, banner, chip, badge, avatar, fab, tabs, tab, navItem, navigationBar, navigationRail, navigationDrawer, buttonGroup, groupButton, splitButton, popover, sideSheet, toolbar, image, rating, carousel, fileUploader, dataTable, tree, pagination, breadcrumb, progressSteps, splitPane, scrollbar.',
    );
    const unnamed = { ...minimalSkin, name: "" } as CamoSkin;
    expect(() => assertCompleteSkin(unnamed)).toThrow("(unnamed)");
  });

  it("builds a skin step by step, and only a complete one registers", () => {
    const wip = inProgressSkin({ ...withoutDialog, name: "wip" }); // compiles while it is half built
    expect(() =>
      registerSkin(wip as unknown as CamoSkin, { theme: { light: tokens, dark: tokens } }),
    ).toThrow('Skin "wip" is incomplete: missing dialog.');
    const done = defineSkin({ ...wip, dialog: minimalSkin.dialog });
    expect(missingRenderers(done)).toEqual([]);
  });

  it("borrows and replaces renderers with a plain spread", () => {
    const brand = defineSkin({ ...minimalSkin, name: "brand", button: cupertinoSkin.button });
    expect(brand.button).toBe(cupertinoSkin.button);
    expect(brand.dialog).toBe(minimalSkin.dialog);
  });

  it("fails tsc for a skin with a missing renderer, naming it", () => {
    let output = "";
    try {
      execFileSync(
        process.execPath,
        ["node_modules/typescript/bin/tsc", "-p", "tests/fixtures/incomplete-skin", "--noEmit"],
        { cwd: new URL("../..", import.meta.url).pathname, encoding: "utf8", stdio: "pipe" },
      );
    } catch (error) {
      output = String((error as { stdout?: string }).stdout ?? "");
    }
    expect(output).toMatch(/Property 'dialog' is missing/);
  }, 60_000);
});

describe("the shared surface treatments and feedback", () => {
  const theme = tokens;
  const child = html`<b>x</b>`;
  const surface = (treatment: typeof flat): string =>
    squash(
      renderToString(
        treatment.decorate({
          child,
          color: "red",
          shape: "8px",
          elevation: "3px",
          border: "1px solid blue",
          theme,
        }),
      ),
    );

  it("Flat has no shadow, and a hairline only when asked", () => {
    const out = surface(flat);
    expect(out).toContain("background: red; border-radius: 8px;");
    expect(out).toContain("border: 1px solid blue");
    expect(out).not.toContain("box-shadow");
    expect(
      squash(
        renderToString(
          flat.decorate({ child, color: "red", shape: "8px", elevation: "3px", theme }),
        ),
      ),
    ).not.toContain("border:");
  });

  it("Classic casts a shadow that follows the elevation", () => {
    expect(surface(classic)).toContain("box-shadow: 0 calc(3px / 2) calc(3px * 3)");
  });

  it("Fade veils on hover and press, and rings keyboard focus", () => {
    const out = squash(
      renderToString(fade.wrap({ child, contentColor: "navy", shape: "8px", theme })),
    );
    expect(out).toContain("--camo-veil: navy");
    expect(out).toContain(
      ":host(:hover:not([disabled]):not([loading])) .camo-feedback-veil { opacity: 0.04; }",
    );
    expect(out).toContain(":host([data-camo-pressed]) .camo-feedback-veil");
    expect(out).toContain(":host(:focus-visible)");
  });

  it("Opacity dims the content while pressed, by pointer or key", () => {
    const out = squash(
      renderToString(opacity.wrap({ child, contentColor: "navy", shape: "8px", theme })),
    );
    expect(out).toContain(":host([data-camo-pressed]) .camo-feedback-content");
    expect(out).toContain("opacity: 0.35");
  });
});
