import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  COLOR_ROLES,
  COMPONENT_FIELDS,
  DEFAULT_ELEVATION,
  DEFAULT_MOTION,
  DEFAULT_SHAPES,
  DEFAULT_SPACING,
  ELEVATION_ROLES,
  MOTION_ROLES,
  SHAPE_ROLES,
  SPACING_ROLES,
  TYPE_ROLES,
  applyTheme,
  componentVar,
  contrastRatio,
  createCamoTheme,
  parseColor,
  schemeStylesheet,
  systemTypography,
  themeDeclarations,
  tokens,
  validateTheme,
} from "@srctool/camouflage-core";
import type { CamoColors, CamoTheme } from "@srctool/camouflage-core";
import { fromSeed } from "@srctool/camouflage-core/seed";
import { cupertinoTheme, cupertinoThemes } from "@srctool/camouflage-skin-cupertino";
import { minimalThemes } from "@srctool/camouflage-skin-minimal";

const fixture = <T>(name: string): T =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8")) as T;

const base: CamoTheme = minimalThemes.light;

describe("the theme model", () => {
  it("has the 42 roles, 15 text styles and the scales of the notes", () => {
    expect(COLOR_ROLES).toHaveLength(42);
    expect(TYPE_ROLES).toHaveLength(15);
    expect(Object.keys(base.colors)).toEqual([...COLOR_ROLES]);
    expect(Object.keys(base.typography)).toEqual([...TYPE_ROLES]);
    expect(Object.keys(base.shapes)).toEqual([...SHAPE_ROLES]);
    expect(Object.keys(base.spacing)).toEqual([...SPACING_ROLES]);
    expect(Object.keys(base.elevation)).toEqual([...ELEVATION_ROLES]);
    expect(Object.keys(base.motion)).toEqual([...MOTION_ROLES]);
  });

  it("gives every role a token reference instead of a value", () => {
    expect(tokens.colors.onPrimaryContainer).toBe("var(--camo-color-on-primary-container)");
    expect(tokens.colors.inversePrimary).toBe("var(--camo-color-inverse-primary)");
    expect(tokens.typography.bodyMedium.lineHeight).toBe(
      "var(--camo-type-body-medium-line-height)",
    );
    expect(tokens.motion.durationLong).toBe("var(--camo-motion-duration-long)");
    expect(tokens.components).toEqual({});
    expect(tokens.tokenSets).toEqual({});
  });

  it("matches the system defaults of the base note", () => {
    const type = systemTypography();
    expect(type.displayLarge).toMatchObject({ size: "3rem", lineHeight: "3.5rem", weight: "600" });
    expect(type.bodySmall).toMatchObject({ size: "0.75rem", lineHeight: "1rem", weight: "400" });
    expect(type.labelSmall).toMatchObject({ size: "0.6875rem", lineHeight: "1rem", weight: "500" });
    expect(DEFAULT_SHAPES.medium).toBe("8px");
    expect(DEFAULT_SPACING.xxl).toBe("32px");
    expect(DEFAULT_ELEVATION.level5).toBe("12px");
    expect(DEFAULT_MOTION.durationLong).toBe("300ms");
  });
});

interface GoldenCase {
  name: string;
  seed: string;
  dark: boolean;
  neutral: boolean;
  roles: CamoColors;
}

describe("fromSeed", () => {
  // The values come from `CamoColors.fromSeed` in the Dart library (the Kotlin one uses the same table and the same
  // algorithm), so a change in any of the three shows up here.
  for (const golden of fixture<GoldenCase[]>("seed-golden.json")) {
    it(`gives Dart's 42 roles for ${golden.name}`, () => {
      const colors = fromSeed({
        primary: golden.seed,
        neutral: golden.neutral ? golden.seed : null,
        dark: golden.dark,
      });
      expect(colors).toEqual(golden.roles);
    });
  }

  it("keeps surfaces true gray by default and tints them when asked", () => {
    const gray = fromSeed({ primary: "#6750a4" });
    const [r, g, b] = [gray.surfaceContainer, gray.onSurface, gray.outline]
      .map((hex) => parseColor(hex)!)
      .map((c) => [c.r, c.g, c.b]) as number[][];
    for (const channels of [r!, g!, b!]) expect(new Set(channels).size).toBe(1);
    expect(fromSeed({ primary: "#6750a4", neutral: "#6750a4" }).surfaceContainer).not.toBe(
      gray.surfaceContainer,
    );
  });

  it("uses the given seeds for secondary, tertiary and the status families", () => {
    const a = fromSeed({ primary: "#6750a4" });
    const b = fromSeed({ primary: "#6750a4", secondary: "#006a6a", error: "#00668b" });
    expect(b.secondary).not.toBe(a.secondary);
    expect(b.error).not.toBe(a.error);
    expect(b.success).toBe(a.success);
  });

  it("rejects a seed that is not a plain color", () => {
    expect(() => fromSeed({ primary: "var(--brand)" })).toThrow(/not a color a seed can use/);
  });
});

interface ValidationCase {
  name: string;
  dark: boolean;
  neutral?: boolean;
  colors?: Record<string, string>;
  spacingM?: number;
  durationLong?: number;
  shapeSmall?: number;
  issues: { kind: string; pair?: string; token?: string; ratio?: number; required?: number }[];
}

describe("validateTheme", () => {
  const build = (c: ValidationCase): CamoTheme => {
    let colors = fromSeed({
      primary: "#6750a4",
      neutral: c.neutral === true ? "#6750a4" : null,
      dark: c.dark,
    });
    const over = c.colors ?? {};
    if ("onWarning" in over) colors = { ...colors, onWarning: colors.warning };
    for (const role of ["outline", "onSurface", "onSurfaceVariant"] as const)
      if (role in over) colors = { ...colors, [role]: over[role]! };
    return {
      ...base,
      colors,
      spacing: { ...base.spacing, m: `${c.spacingM ?? 12}px` },
      motion: { ...base.motion, durationLong: `${c.durationLong ?? 300}ms` },
      shapes: { ...base.shapes, small: `${c.shapeSmall ?? 6}px` },
    };
  };

  // The same themes, and the issues `validate()` returns for them in Dart, in the same order.
  for (const c of fixture<ValidationCase[]>("validation-cases.json")) {
    it(`reports what validate() reports for ${c.name}`, () => {
      const issues = validateTheme(build(c));
      expect(issues.map((i) => i.kind)).toEqual(c.issues.map((i) => i.kind));
      issues.forEach((issue, n) => {
        const expected = c.issues[n]!;
        if (issue.kind === "LowContrast") {
          expect(issue.pair).toBe(expected.pair);
          expect(issue.required).toBe(expected.required);
          expect(issue.ratio).toBeCloseTo(expected.ratio!, 2);
        } else if (issue.kind === "InvalidValue") {
          expect(issue.token).toBe(expected.token);
        }
      });
    });
  }

  it("passes Minimal's starter themes in light and dark", () => {
    expect(validateTheme(minimalThemes.light)).toEqual([]);
    expect(validateTheme(minimalThemes.dark)).toEqual([]);
  });

  // Apple's published system colors do not all reach WCAG AA (white on systemBlue is 4.0): Cupertino keeps them as
  // published, so these pairs are the known exceptions, the same list as the Dart skin's test. The page text must pass.
  const APPLE_KNOWN = new Set([
    "onPrimary/primary",
    "onPrimaryContainer/primaryContainer",
    "onSecondary/secondary",
    "onTertiaryContainer/tertiaryContainer",
    "onError/error",
    "onErrorContainer/errorContainer",
    "onSuccess/success",
    "onSuccessContainer/successContainer",
    "onWarning/warning",
    "onInfo/info",
    "onInfoContainer/infoContainer",
    "onSurfaceVariant/surface",
    "onSurfaceVariant/surfaceContainerLowest",
    "onSurfaceVariant/surfaceContainerLow",
    "onSurfaceVariant/surfaceContainer",
    "onSurfaceVariant/surfaceContainerHigh",
    "onSurfaceVariant/surfaceContainerHighest",
    "outline/surface",
    "onWarningContainer/warningContainer",
    "onTertiary/tertiary",
    "onSecondaryContainer/secondaryContainer",
  ]);

  it("fails Cupertino's starter themes only on Apple's known pairs", () => {
    for (const theme of [cupertinoThemes.light, cupertinoThemes.dark]) {
      const failing = validateTheme(theme).flatMap((i) =>
        i.kind === "LowContrast" ? [i.pair] : [],
      );
      expect(failing.filter((pair) => !APPLE_KNOWN.has(pair))).toEqual([]);
      expect(failing).not.toContain("onSurface/surface");
    }
  });

  it("names a missing role", () => {
    const broken = { ...base, colors: { ...base.colors, onSuccess: "" } };
    expect(validateTheme(broken)).toEqual([{ kind: "MissingRole", role: "colors.onSuccess" }]);
  });

  it("resolves a role that aliases the theme's own token set", () => {
    const aliased = createCamoTheme(base, {
      tokenSets: { brand: { "600": "#ffffff" } },
      colors: { primary: "var(--brand-600)", onPrimary: "#000000" },
    });
    expect(validateTheme(aliased)).toEqual([]);
    // The alias is followed: white ink on the white the alias stands for is the planted failure.
    const clash = createCamoTheme(aliased, { colors: { onPrimary: "#ffffff" } });
    expect(validateTheme(clash)).toContainEqual(
      expect.objectContaining({ kind: "LowContrast", pair: "onPrimary/primary" }),
    );
  });

  it("skips a color it cannot know before the page runs", () => {
    const theme = createCamoTheme(base, { colors: { primary: "var(--page-primary)" } });
    expect(validateTheme(theme)).toEqual([]);
  });

  it("reports two token sets that write the same variable", () => {
    // Set "brandX" step "y" and set "brand" step "xY" both write --brand-x-y.
    const clash = createCamoTheme(base, {
      tokenSets: { brandX: { y: "#fff" }, brand: { xY: "#eee" } },
    });
    expect(validateTheme(clash)).toContainEqual({ kind: "DuplicateTokenSet", key: "--brand-x-y" });
    const clean = createCamoTheme(base, { tokenSets: { brand: { "50": "#fff", "600": "#000" } } });
    expect(validateTheme(clean)).toEqual([]);
  });
});

describe("createCamoTheme", () => {
  it("merges a partial theme and leaves the rest of the base", () => {
    const theme = createCamoTheme(base, {
      colors: { primary: "#7c3aed" },
      shapes: { medium: "10px" },
      typography: { bodyMedium: { weight: "500" } },
    });
    expect(theme.colors.primary).toBe("#7c3aed");
    expect(theme.colors.onPrimary).toBe(base.colors.onPrimary);
    expect(theme.shapes.medium).toBe("10px");
    expect(theme.typography.bodyMedium.weight).toBe("500");
    expect(theme.typography.bodyMedium.size).toBe(base.typography.bodyMedium.size);
    expect(base.colors.primary).not.toBe("#7c3aed");
  });

  it("names the path of an unknown key", () => {
    expect(() => createCamoTheme(base, { colours: { primary: "#fff" } } as never)).toThrow(
      'Unknown theme key "colours".',
    );
    expect(() => createCamoTheme(base, { colors: { primry: "#fff" } } as never)).toThrow(
      'Unknown theme key "colors.primry".',
    );
    expect(() =>
      createCamoTheme(base, { typography: { bodyMedium: { colour: "red" } } } as never),
    ).toThrow('Unknown theme key "typography.bodyMedium.colour".');
  });

  it("takes component themes for the components that exist, and only their fields", () => {
    const theme = createCamoTheme(base, { components: { button: { height: "48px" } } });
    expect(theme.components.button).toEqual({ height: "48px" });
    expect(Object.keys(COMPONENT_FIELDS)).toEqual([
      "card",
      "listItem",
      "accordion",
      "skeleton",
      "bottomSheet",
      "menu",
      "tooltip",
      "topBar",
      "progressBar",
      "progressCircle",
      "snackbar",
      "banner",
      "chip",
      "badge",
      "avatar",
      "fab",
      "tabs",
      "navigationBar",
      "navigationRail",
      "navigationDrawer",
      "textField",
      "searchField",
      "checkbox",
      "switch",
      "radio",
      "segmentedControl",
      "slider",
      "stepper",
      "calendar",
      "timePicker",
      "surface",
      "divider",
      "iconButton",
      "button",
      "dialog",
    ]);
    expect(() =>
      createCamoTheme(base, { components: { button: { hieght: "48px" } } } as never),
    ).toThrow('Unknown theme key "components.button.hieght".');
    expect(() => createCamoTheme(base, { components: { dataTable: { x: "1" } } } as never)).toThrow(
      'Unknown theme key "components.dataTable".',
    );
  });

  it("takes the brand's own token sets under any name", () => {
    const theme = createCamoTheme(base, {
      tokenSets: { brand: { "50": "#f5f3ff", "600": "#7c3aed" }, radius: { card: "20px" } },
    });
    expect(theme.tokenSets).toEqual({
      brand: { "50": "#f5f3ff", "600": "#7c3aed" },
      radius: { card: "20px" },
    });
  });

  it("rejects a value that is not a string", () => {
    expect(() => createCamoTheme(base, { colors: { primary: 3 } } as never)).toThrow(
      'Theme value at "colors.primary" must be a string.',
    );
  });
});

describe("the theme as variables (no JavaScript needed on the page)", () => {
  const theme = createCamoTheme(base, {
    tokenSets: { brand: { "600": "#7c3aed" }, radius: { card: "20px" } },
    colors: { primary: "var(--brand-600)" },
    components: { button: { paddingWithIcon: "12px" }, dialog: { scrimAlpha: "55%" } },
  });
  const css = themeDeclarations(theme);

  it("names roles after the Figma path", () => {
    expect(css).toContain("--camo-color-on-primary-container: ");
    expect(css).toContain("--camo-shape-extra-large: 16px;");
    expect(css).toContain("--camo-spacing-xxl: 32px;");
    expect(css).toContain("--camo-elevation-level2: 3px;");
    expect(css).toContain("--camo-motion-duration-long: 300ms;");
    expect(css).toContain("--camo-type-label-small-size: 0.6875rem;");
    expect(css).toContain("--camo-type-label-small-letter-spacing: 0px;");
  });

  it("writes token sets in the brand's own names, unprefixed", () => {
    expect(css).toContain("--brand-600: #7c3aed;");
    expect(css).toContain("--radius-card: 20px;");
    expect(css).toContain("--camo-color-primary: var(--brand-600);");
  });

  it("writes component themes as --camo-<component>-<field>", () => {
    expect(componentVar("button", "paddingWithIcon")).toBe("--camo-button-padding-with-icon");
    expect(css).toContain("--camo-button-padding-with-icon: 12px;");
    expect(css).toContain("--camo-dialog-scrim-alpha: 55%;");
  });

  it("writes every role of a complete theme", () => {
    const count = (name: string): number => css.split(`--camo-${name}-`).length - 1;
    expect(count("color")).toBe(42);
    expect(count("type")).toBe(15 * 5);
  });

  it("wraps the light and dark blocks for the server, with reduced motion", () => {
    const sheet = schemeStylesheet("--a: 1;", "--a: 2;");
    expect(sheet).toContain(":host { --a: 1; }");
    expect(sheet).toContain(':host([data-camo-scheme="dark"]) { --a: 2; }');
    expect(sheet).toContain("prefers-color-scheme: dark");
    expect(sheet).toContain("--camo-motion-duration-long: 0ms");
  });

  it("applies a partial theme to an element and leaves other variables alone", () => {
    const set = new Map<string, string>([["--camo-color-primary", "#000"]]);
    const element = { style: { setProperty: (n: string, v: string) => set.set(n, v) } };
    applyTheme(element as unknown as HTMLElement, { shapes: { medium: "10px" } });
    expect(set.get("--camo-shape-medium")).toBe("10px");
    expect(set.get("--camo-color-primary")).toBe("#000");
    expect(set.size).toBe(2);
  });
});

describe("colors", () => {
  it("parses hex and rgb and leaves everything else to the page", () => {
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor("#1b1b1b80")).toEqual({ r: 27, g: 27, b: 27 });
    expect(parseColor("rgb(10, 20, 30)")).toEqual({ r: 10, g: 20, b: 30 });
    expect(parseColor("var(--x)")).toBeNull();
    expect(parseColor("red")).toBeNull();
  });

  it("measures black on white as 21", () => {
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(21, 2);
  });
});

describe("cupertinoTheme(accent)", () => {
  it("is the starter theme with no options", () => {
    expect(cupertinoTheme()).toEqual(cupertinoThemes);
  });

  it("replaces the primary family with the accent, in both appearances, and keeps Apple's other colors", () => {
    const theme = cupertinoTheme({ accent: "#0b57d0" });
    for (const scheme of ["light", "dark"] as const) {
      const { colors } = theme[scheme];
      expect(colors.primary).toBe("#0b57d0");
      expect(colors.onPrimaryContainer).toBe("#0b57d0");
      expect(colors.onPrimary).toBe("#ffffff");
      expect(colors.surface).toBe(cupertinoThemes[scheme].colors.surface);
      expect(colors.error).toBe(cupertinoThemes[scheme].colors.error);
    }
    // The container is the accent at 15% over white (light) and 22% over black (dark), as in the Dart skin.
    expect(theme.light.colors.primaryContainer).toBe("#dae6f8");
    expect(theme.dark.colors.primaryContainer).toBe("#02132e");
  });

  it("keeps Apple's own dark blue for the default accent only", () => {
    expect(cupertinoTheme().dark.colors.primary).toBe("#0a84ff");
    expect(cupertinoTheme({ accent: "#007aff" }).dark.colors.primary).toBe("#0a84ff");
    expect(cupertinoTheme({ accent: "#ff2d55" }).dark.colors.primary).toBe("#ff2d55");
  });

  it("sets a font family on every text style", () => {
    const theme = cupertinoTheme({ fontFamily: "Inter, sans-serif" });
    for (const style of Object.values(theme.light.typography))
      expect(style.family).toBe("Inter, sans-serif");
    expect(theme.light.typography.bodyMedium.size).toBe(
      cupertinoThemes.light.typography.bodyMedium.size,
    );
  });

  it("rejects an accent that is not a plain color", () => {
    expect(() => cupertinoTheme({ accent: "var(--brand)" })).toThrow(
      "is not a color the accent can use",
    );
  });
});
