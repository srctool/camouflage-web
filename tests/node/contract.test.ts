import { readFileSync } from "node:fs";
import { COMPONENT_FIELDS, tokens } from "@srctool/camouflage-core";
import { cupertinoSkin } from "@srctool/camouflage-skin-cupertino";
import { minimalSkin } from "@srctool/camouflage-skin-minimal";
import { describe, expect, it } from "vitest";
import { expectation, kebab } from "../../tools/contract.ts";
import type { Contract } from "../../tools/contract.ts";

const read = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;
const contract = read<Contract>("contract/camouflage-contract.json");
interface Schema {
  $defs: Record<string, { properties?: Record<string, unknown>; required?: string[] }>;
}
const schema = read<Schema>("contract/schema.json");

describe("camouflage-contract.json", () => {
  it("uses only the fields its schema defines, and every required one", () => {
    const check = (value: object, def: string, where: string): void => {
      const { properties = {}, required = [] } = schema.$defs[def]!;
      for (const key of Object.keys(value)) expect(key in properties, `${where}.${key}`).toBe(true);
      for (const key of required) expect(value, where).toHaveProperty(key);
    };
    for (const component of contract.components) {
      check(component, "component", component.name);
      for (const p of component.parameters) check(p, "parameter", `${component.name}.${p.name}`);
      for (const f of component.themeFields ?? [])
        check(f, "themeField", `${component.name}.${f.name}`);
    }
  });

  it("names every component once, in PascalCase, with enum values for every enum", () => {
    const names = contract.components.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    for (const c of contract.components) {
      expect(c.name).toMatch(/^[A-Z][A-Za-z0-9]*$/);
      for (const p of c.parameters)
        if (p.type === "enum") expect(p.values?.length, `${c.name}.${p.name}`).toBeGreaterThan(0);
    }
  });

  // Fields the web adds to the base contract, on purpose.
  const WEB_ONLY: Record<string, string[]> = {
    button: ["touchTarget"],
    iconButton: ["touchTarget"],
    dialog: ["actionGap", "sectionGap"],
  };
  // A button's component-theme field `padding` is its style field `paddingInline` (a logical property), and so on.
  const STYLE_KEY: Record<string, Record<string, string>> = {
    button: { padding: "paddingInline", paddingWithIcon: "paddingInlineWithIcon" },
  };

  it("gives each component's theme fields to the theme and to the skins' defaults", () => {
    for (const c of contract.components.filter((x) => expectation(x).themeFields.length > 0)) {
      const key = c.name.charAt(0).toLowerCase() + c.name.slice(1);
      const { themeFields } = expectation(c);
      const web = [...(COMPONENT_FIELDS as Record<string, readonly string[]>)[key]!].sort();
      expect(web, `${key} theme fields`).toEqual([...themeFields, ...(WEB_ONLY[key] ?? [])].sort());
      for (const skin of [minimalSkin, cupertinoSkin]) {
        const defaults = (
          skin as unknown as Record<string, { defaults: (t: typeof tokens) => object }>
        )[key]!.defaults(tokens);
        for (const field of themeFields)
          expect(Object.keys(defaults), `${skin.name} ${key} defaults: ${field}`).toContain(
            STYLE_KEY[key]?.[field] ?? field,
          );
      }
    }
  });

  it("lists, as gaps, the fields a CSS variable cannot carry", () => {
    // A value that changes structure (where the actions go, whether there is a close button) is read by the renderer,
    // which is a pure function and reads no styles, so the web cannot take it from a variable. They are not
    // silently dropped: this list is the open work, and a field leaves it when the web carries it.
    const gaps = Object.fromEntries(
      contract.components
        .filter((c) => c.themeFields !== undefined)
        .map((c) => [c.name, expectation(c).themeGaps]),
    );
    expect(gaps).toEqual({
      Icon: ["size", "color"],
      Surface: [],
      Divider: [],
      Button: ["defaultAppearance"],
      IconButton: ["defaultAppearance"],
      TextField: ["labelPlacement"],
      SearchField: [],
      Checkbox: ["labelPosition"],
      Switch: ["labelPosition"],
      Radio: ["labelPosition"],
      SegmentedControl: ["showCheckIcon"],
      Slider: ["showStopMarks", "showValueLabel"],
      Stepper: ["layout"],
      Calendar: ["showOutsideDays"],
      TimePicker: ["style"],
      Card: ["defaultAppearance", "showSelectedCheck"],
      ListItem: ["dividers"],
      Accordion: ["indicator", "indicatorPosition"],
      Skeleton: ["animation"],
      BottomSheet: ["showHandle", "titleAlign", "showCloseButton"],
      Menu: ["checkPosition"],
      Tooltip: [],
      TopBar: ["titleAlign", "divider", "largeTitle"],
      Dialog: ["titleAlign", "actionsLayout", "showCloseButton", "stackedScrim"],
    });
  });
});

describe("the web naming rules", () => {
  it("spells names in kebab-case", () => {
    expect(kebab("SegmentedControl")).toBe("segmented-control");
    expect(kebab("prefixIcon")).toBe("prefix-icon");
    expect(kebab("supportingText")).toBe("supporting-text");
    expect(kebab("URLField")).toBe("url-field");
    expect(kebab("Solid")).toBe("solid");
  });

  it("turns a button into attributes, slots and an inverted boolean", () => {
    const button = expectation(contract.components.find((c) => c.name === "Button")!);
    expect(button).toMatchObject({
      tag: "camo-button",
      className: "CamoButton",
      slots: ["prefix-icon", "suffix-icon"],
      events: [], // onClick is the native click
      forbidden: ["enabled"],
    });
    expect(button.attributes["disabled"]).toBeNull();
    expect(button.attributes["enabled"]).toBeUndefined();
    expect(button.attributes["appearance"]).toEqual([
      "solid",
      "soft",
      "raised",
      "outline",
      "ghost",
      "link",
    ]);
  });

  it("makes a layout slot the default slot and a callback a custom event", () => {
    const dialog = expectation(contract.components.find((c) => c.name === "Dialog")!);
    expect(dialog.slots).toEqual(["", "confirm", "dismiss"]);
    expect(dialog.events).toEqual(["camo-close"]);
  });

  it("refuses a default-true boolean that has no inversion rule", () => {
    expect(() =>
      expectation({
        name: "Thing",
        parameters: [{ name: "pinned", kind: "value", type: "boolean", default: true }],
      }),
    ).toThrow("add its inversion to INVERTED");
  });
});
