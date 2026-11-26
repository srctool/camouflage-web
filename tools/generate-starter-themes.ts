// Writes each skin's starter theme (`packages/skin-*/src/theme.ts`) from core's theme code, so a skin's theme is
// derived, not hand-copied, and ships as static data (no color math at runtime). Run it with `pnpm themes`; CI runs it
// with `--check` and fails when a committed file is out of date.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";
import {
  DEFAULT_ELEVATION,
  DEFAULT_MOTION,
  DEFAULT_SHAPES,
  DEFAULT_SPACING,
  rem,
  systemTypography,
} from "../packages/core/src/index.ts";
import { fromSeed } from "../packages/core/src/seed.ts";
import type {
  CamoColors,
  CamoTextStyle,
  CamoTheme,
  CamoTypography,
} from "../packages/core/src/index.ts";

// --- Minimal: true-gray surfaces and an ink primary (Dart `minimalTheme`) -------------------------------------------

const GRAY = "#777777";

function minimal(dark: boolean): CamoTheme {
  const seeded = fromSeed({ primary: GRAY, secondary: GRAY, tertiary: GRAY, dark });
  // Ink is the neutral palette's text tones (base Minimal Skin §3.2).
  const colors: CamoColors = {
    ...seeded,
    primary: seeded.onSurface,
    onPrimary: dark ? seeded.surfaceContainerLow : seeded.surface,
    primaryContainer: seeded.surfaceContainerHighest,
    onPrimaryContainer: seeded.onSurface,
  };
  return {
    colors,
    typography: systemTypography(),
    components: {},
    shapes: DEFAULT_SHAPES,
    spacing: DEFAULT_SPACING,
    elevation: DEFAULT_ELEVATION,
    motion: DEFAULT_MOTION,
    tokenSets: {},
  };
}

// --- Cupertino: Apple's system colors from the HIG tables (Dart `cupertinoTheme`) -----------------------------------

const BLUE = "#007aff";
const BLUE_DARK = "#0a84ff";

/** `color` at `alpha` over an opaque `background`, as Flutter's `Color.alphaBlend`. */
function over(color: string, alpha: number, background: string): string {
  const parse = (hex: string): number[] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [c, b] = [parse(color), parse(background)];
  const mixed = c.map((v, i) => Math.round(v * alpha + b[i]! * (1 - alpha)));
  return `#${mixed.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function cupertinoColors(dark: boolean): CamoColors {
  const blue = dark ? BLUE_DARK : BLUE;
  return dark
    ? {
        primary: blue,
        onPrimary: "#ffffff",
        primaryContainer: over(blue, 0.22, "#000000"),
        onPrimaryContainer: blue,
        secondary: "#8e8e93",
        onSecondary: "#000000",
        secondaryContainer: "#2c2c2e",
        onSecondaryContainer: "#ffffff",
        tertiary: "#5e5ce6",
        onTertiary: "#ffffff",
        tertiaryContainer: "#26264f",
        onTertiaryContainer: "#7d7aff",
        surface: "#000000",
        surfaceContainerLowest: "#000000",
        surfaceContainerLow: "#1c1c1e",
        surfaceContainer: "#1c1c1e",
        surfaceContainerHigh: "#2c2c2e",
        surfaceContainerHighest: "#3a3a3c",
        onSurface: "#ffffff",
        onSurfaceVariant: "#8e8e93",
        outline: "#48484a",
        outlineVariant: "#38383a",
        error: "#ff453a",
        onError: "#ffffff",
        errorContainer: "#4a1a17",
        onErrorContainer: "#ff453a",
        success: "#30d158",
        onSuccess: "#000000",
        successContainer: "#123f1d",
        onSuccessContainer: "#30d158",
        warning: "#ff9f0a",
        onWarning: "#000000",
        warningContainer: "#4a2f05",
        onWarningContainer: "#ff9f0a",
        info: "#40cbe0",
        onInfo: "#000000",
        infoContainer: "#123c44",
        onInfoContainer: "#40cbe0",
        inverseSurface: "#f2f2f7",
        inverseOnSurface: "#1c1c1e",
        inversePrimary: BLUE,
        scrim: "#000000",
      }
    : {
        primary: blue,
        onPrimary: "#ffffff",
        primaryContainer: over(blue, 0.15, "#ffffff"),
        onPrimaryContainer: blue,
        secondary: "#8e8e93",
        onSecondary: "#ffffff",
        secondaryContainer: "#e5e5ea",
        onSecondaryContainer: "#000000",
        tertiary: "#5856d6",
        onTertiary: "#ffffff",
        tertiaryContainer: "#e0e0f8",
        onTertiaryContainer: "#5856d6",
        surface: "#f2f2f7",
        surfaceContainerLowest: "#ffffff",
        surfaceContainerLow: "#ffffff",
        surfaceContainer: "#f2f2f7",
        surfaceContainerHigh: "#e5e5ea",
        surfaceContainerHighest: "#d1d1d6",
        onSurface: "#000000",
        onSurfaceVariant: "#8a8a8e",
        outline: "#c7c7cc",
        outlineVariant: "#c6c6c8",
        error: "#ff3b30",
        onError: "#ffffff",
        errorContainer: "#ffe1df",
        onErrorContainer: "#ff3b30",
        success: "#34c759",
        onSuccess: "#ffffff",
        successContainer: "#ddf6e3",
        onSuccessContainer: "#248a3d",
        warning: "#ff9500",
        onWarning: "#ffffff",
        warningContainer: "#ffeacc",
        onWarningContainer: "#c93400",
        info: "#30b0c7",
        onInfo: "#ffffff",
        infoContainer: "#daf1f5",
        onInfoContainer: "#008299",
        inverseSurface: "#1c1c1e",
        inverseOnSurface: "#f2f2f7",
        inversePrimary: BLUE_DARK,
        scrim: "#000000",
      };
}

const CUPERTINO_FAMILY = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';

// SF's text styles, size / line height, weight and the tracking at that size (Dart `_typography`).
function cupertinoTypography(): CamoTypography {
  const style = (size: number, line: number, weight: number, tracking: number): CamoTextStyle => ({
    family: CUPERTINO_FAMILY,
    size: rem(size),
    lineHeight: rem(line),
    weight: String(weight),
    letterSpacing: `${tracking}px`,
  });
  return {
    displayLarge: style(48, 56, 700, 0.37),
    displayMedium: style(40, 48, 700, 0.37),
    displaySmall: style(34, 41, 700, 0.37),
    headlineLarge: style(28, 34, 700, 0.36),
    headlineMedium: style(22, 28, 700, 0.35),
    headlineSmall: style(20, 25, 600, 0.38),
    titleLarge: style(20, 25, 600, 0.38),
    titleMedium: style(17, 22, 600, -0.41),
    titleSmall: style(15, 20, 600, -0.24),
    bodyLarge: style(17, 22, 400, -0.41),
    bodyMedium: style(15, 20, 400, -0.24),
    bodySmall: style(13, 18, 400, -0.08),
    labelLarge: style(16, 21, 500, -0.32),
    labelMedium: style(12, 16, 500, 0),
    labelSmall: style(11, 13, 500, 0.07),
  };
}

function cupertino(dark: boolean): CamoTheme {
  return {
    colors: cupertinoColors(dark),
    typography: cupertinoTypography(),
    components: {},
    shapes: {
      ...DEFAULT_SHAPES,
      extraSmall: "6px",
      small: "8px",
      medium: "12px",
      large: "14px",
      extraLarge: "26px",
    },
    spacing: DEFAULT_SPACING,
    elevation: DEFAULT_ELEVATION,
    motion: {
      durationShort: "200ms",
      durationMedium: "350ms",
      durationLong: "500ms",
      easingStandard: "cubic-bezier(0.25, 0.1, 0.25, 1)",
      easingEmphasized: "cubic-bezier(0.2, 0.9, 0.1, 1)",
    },
    tokenSets: {},
  };
}

// --- Shared by the Material, Fluent and Carbon builders -------------------------------------------------------------

/** A theme from colors, a type scale (size, line height, weight, tracking by role) and what differs from the defaults. */
function themed(
  colors: CamoColors,
  family: string,
  scale: readonly (readonly [number, number, number, number])[],
  rest: Partial<CamoTheme>,
): CamoTheme {
  const roles = Object.keys(systemTypography()) as (keyof CamoTypography)[];
  const typography = Object.fromEntries(
    roles.map((role, i) => {
      const [size, line, weight, tracking] = scale[i]!;
      return [
        role,
        {
          family,
          size: rem(size),
          lineHeight: rem(line),
          weight: String(weight),
          letterSpacing: `${tracking}px`,
        },
      ];
    }),
  ) as unknown as CamoTypography;
  return {
    colors,
    typography,
    components: {},
    shapes: DEFAULT_SHAPES,
    spacing: DEFAULT_SPACING,
    elevation: DEFAULT_ELEVATION,
    motion: DEFAULT_MOTION,
    tokenSets: {},
    ...rest,
  };
}

/** Colors in the contract's order, from a compact list. */
function colorsOf(values: string): CamoColors {
  const roles = Object.keys(fromSeed({ primary: GRAY })) as (keyof CamoColors)[];
  const list = values.trim().split(/\s+/);
  if (list.length !== roles.length)
    throw new Error(`Expected ${roles.length} colors, got ${list.length}.`);
  return Object.fromEntries(roles.map((role, i) => [role, list[i]!])) as unknown as CamoColors;
}

// --- Material: the M3 baseline scheme (Kotlin `MaterialTheme`) ------------------------------------------------------

const MATERIAL_FAMILY = 'Roboto, system-ui, -apple-system, "Segoe UI", sans-serif';

function material(dark: boolean): CamoTheme {
  // primary, secondary, tertiary (4 each); surfaces (6); content and lines (4); error, success, warning, info (4 each);
  // inverse (3) and scrim.
  const colors = dark
    ? colorsOf(`#d0bcff #381e72 #4f378b #eaddff #ccc2dc #332d41 #4a4458 #e8def8 #efb8c8 #492532 #633b48 #ffd8e4
        #141218 #0f0d13 #1d1b20 #211f26 #2b2930 #36343b #e6e0e9 #cac4d0 #938f99 #49454f
        #f2b8b5 #601410 #8c1d18 #f9dedc #88d982 #003909 #005312 #a3f69c #ffb957 #462b00 #643f00 #ffddb5
        #96ccff #003353 #004a75 #cee5ff #e6e0e9 #322f35 #6750a4 #000000`)
    : colorsOf(`#6750a4 #ffffff #eaddff #21005d #625b71 #ffffff #e8def8 #1d192b #7d5260 #ffffff #ffd8e4 #31111d
        #fef7ff #ffffff #f7f2fa #f3edf7 #ece6f0 #e6e0e9 #1d1b20 #49454f #79747e #cac4d0
        #b3261e #ffffff #f9dedc #410e0b #1b6d24 #ffffff #a3f69c #002204 #835400 #ffffff #ffddb5 #2a1800
        #00639a #ffffff #cee5ff #001d32 #322f35 #f5eff7 #d0bcff #000000`);
  return themed(
    colors,
    MATERIAL_FAMILY,
    [
      [57, 64, 400, -0.25],
      [45, 52, 400, 0],
      [36, 44, 400, 0],
      [32, 40, 400, 0],
      [28, 36, 400, 0],
      [24, 32, 400, 0],
      [22, 28, 400, 0],
      [16, 24, 500, 0.15],
      [14, 20, 500, 0.1],
      [16, 24, 400, 0.5],
      [14, 20, 400, 0.25],
      [12, 16, 400, 0.4],
      [14, 20, 500, 0.1],
      [12, 16, 500, 0.5],
      [11, 16, 500, 0.5],
    ],
    {
      shapes: {
        ...DEFAULT_SHAPES,
        small: "8px",
        medium: "12px",
        large: "16px",
        extraLarge: "28px",
      },
      motion: {
        durationShort: "150ms",
        durationMedium: "300ms",
        durationLong: "500ms",
        easingStandard: "cubic-bezier(0.2, 0, 0, 1)",
        easingEmphasized: "cubic-bezier(0.05, 0.7, 0.1, 1)",
      },
    },
  );
}

// --- Fluent 2: the neutral ramp, brandWeb and the shared status colors (Kotlin `FluentTheme`) -----------------------

const FLUENT_FAMILY = '"Segoe UI Variable", "Segoe UI", system-ui, -apple-system, sans-serif';

/** Fluent's `grey[n]`: n is the lightness percentage. */
function grey(n: number): string {
  const v = Math.round((n * 255) / 100)
    .toString(16)
    .padStart(2, "0");
  return `#${v}${v}${v}`;
}

// brandWeb, steps 10..160.
const BRAND =
  "#061724 #082338 #0a2e4a #0c3b5e #0e4775 #0f548c #115ea3 #0f6cbd #2886de #479ef5 #62abf5 #77b7f7 #96c6fa #b4d6fa #cfe4fa #ebf3fc".split(
    " ",
  );
const b = (step: number): string => BRAND[step / 10 - 1]!;

function fluent(dark: boolean): CamoTheme {
  const list = (parts: string[]): CamoColors => colorsOf(parts.join(" "));
  const colors = dark
    ? list([
        b(100),
        "#000000",
        b(20),
        b(110),
        grey(68),
        grey(14),
        grey(24),
        "#ffffff",
        b(120),
        b(20),
        b(40),
        b(150),
        grey(16),
        grey(12),
        grey(20),
        grey(22),
        grey(24),
        grey(28),
        "#ffffff",
        grey(84),
        grey(68),
        grey(40),
        "#ee8f94",
        "#000000",
        "#3b0509",
        "#ee8f94",
        "#54b054",
        "#000000",
        "#052505",
        "#9fd89f",
        "#faa06b",
        "#000000",
        "#4a1e04",
        "#faa06b",
        b(100),
        "#000000",
        b(30),
        b(130),
        "#ffffff",
        grey(14),
        b(80),
        "#000000",
      ])
    : list([
        b(80),
        "#ffffff",
        b(160),
        b(70),
        grey(38),
        "#ffffff",
        grey(94),
        grey(14),
        b(60),
        "#ffffff",
        b(150),
        b(40),
        "#ffffff",
        "#ffffff",
        grey(98),
        grey(96),
        grey(94),
        grey(92),
        grey(14),
        grey(26),
        grey(38),
        grey(82),
        "#c50f1f",
        "#ffffff",
        "#fdf3f4",
        "#b10e1c",
        "#107c10",
        "#ffffff",
        "#f1faf1",
        "#0e700e",
        "#bc4b09",
        "#ffffff",
        "#fff9f5",
        "#bc4b09",
        b(80),
        "#ffffff",
        b(160),
        b(70),
        grey(16),
        "#ffffff",
        b(100),
        "#000000",
      ]);
  // The state steps core's roles don't cover: Fluent shows hover and press by swapping to the next token.
  const tokens: Record<string, string> = dark
    ? {
        brandBackground: b(70),
        brandBackgroundHover: b(80),
        brandBackgroundPressed: b(40),
        neutralForegroundOnBrand: "#ffffff",
        neutralBackground1Hover: grey(24),
        neutralBackground1Pressed: grey(12),
        subtleBackgroundHover: grey(22),
        subtleBackgroundPressed: grey(18),
        neutralStroke1: grey(40),
        neutralStroke1Hover: grey(46),
        neutralStroke1Pressed: grey(42),
        neutralStroke2: grey(32),
        strokeFocus1: "#000000",
        strokeFocus2: "#ffffff",
        shadowAmbient: "rgb(0 0 0 / 0.24)",
        shadowKey: "rgb(0 0 0 / 0.28)",
      }
    : {
        brandBackground: b(80),
        brandBackgroundHover: b(70),
        brandBackgroundPressed: b(40),
        neutralForegroundOnBrand: "#ffffff",
        neutralBackground1Hover: grey(96),
        neutralBackground1Pressed: grey(88),
        subtleBackgroundHover: grey(96),
        subtleBackgroundPressed: grey(88),
        neutralStroke1: grey(82),
        neutralStroke1Hover: grey(78),
        neutralStroke1Pressed: grey(70),
        neutralStroke2: grey(88),
        strokeFocus1: "#ffffff",
        strokeFocus2: "#000000",
        shadowAmbient: "rgb(0 0 0 / 0.12)",
        shadowKey: "rgb(0 0 0 / 0.14)",
      };
  const regular = (size: number, line: number): [number, number, number, number] => [
    size,
    line,
    400,
    0,
  ];
  const semibold = (size: number, line: number): [number, number, number, number] => [
    size,
    line,
    600,
    0,
  ];
  return themed(
    colors,
    FLUENT_FAMILY,
    [
      semibold(68, 92),
      semibold(40, 52),
      semibold(32, 40),
      semibold(28, 36),
      semibold(24, 32),
      semibold(20, 28),
      semibold(20, 28),
      semibold(16, 22),
      semibold(14, 20),
      regular(16, 22),
      regular(14, 20),
      regular(12, 16),
      semibold(14, 20),
      semibold(12, 16),
      regular(10, 14),
    ],
    {
      shapes: {
        ...DEFAULT_SHAPES,
        extraSmall: "2px",
        small: "4px",
        medium: "6px",
        large: "8px",
        extraLarge: "12px",
      },
      elevation: {
        level0: "0px",
        level1: "2px",
        level2: "4px",
        level3: "8px",
        level4: "16px",
        level5: "64px",
      },
      motion: {
        durationShort: "100ms",
        durationMedium: "200ms",
        durationLong: "300ms",
        easingStandard: "cubic-bezier(0.33, 0, 0.67, 1)",
        easingEmphasized: "cubic-bezier(0.1, 0.9, 0.2, 1)",
      },
      tokenSets: { fluent: tokens },
    },
  );
}

// --- Carbon: IBM's four themes (Kotlin `CarbonTheme`) ---------------------------------------------------------------

const CARBON_FAMILY = '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif';

function carbon(family: "white" | "g10" | "g90" | "g100"): CamoTheme {
  const dark = family === "g90" || family === "g100";
  // background, layer 1 to 3, the subtle border and the highest layer.
  const [bg, l1, l2, l3, subtle, highest] = {
    white: ["#ffffff", "#f4f4f4", "#ffffff", "#f4f4f4", "#c6c6c6", "#e0e0e0"],
    g10: ["#f4f4f4", "#ffffff", "#f4f4f4", "#ffffff", "#e0e0e0", "#e0e0e0"],
    g90: ["#262626", "#393939", "#525252", "#6f6f6f", "#525252", "#6f6f6f"],
    g100: ["#161616", "#262626", "#393939", "#525252", "#393939", "#525252"],
  }[family] as [string, string, string, string, string, string];
  const surfaces = `${bg} ${bg} ${l1} ${l2} ${l3} ${highest}`;
  const colors = dark
    ? colorsOf(`#4589ff #161616 #001d6c #a6c8ff #6f6f6f #ffffff #393939 #f4f4f4 #a56eff #161616 #31135e #d4bbff
        ${surfaces} #f4f4f4 #c6c6c6 #8d8d8d ${subtle}
        #ff8389 #161616 #520408 #ffb3b8 #42be65 #161616 #022d0d #a7f0ba #f1c21b #161616 #302400 #f1c21b
        #78a9ff #161616 #001141 #a6c8ff #f4f4f4 #161616 #0f62fe #000000`)
    : colorsOf(`#0f62fe #ffffff #d0e2ff #001d6c #393939 #ffffff #e0e0e0 #161616 #8a3ffc #ffffff #f6f2ff #491d8b
        ${surfaces} #161616 #525252 #8d8d8d ${subtle}
        #da1e28 #ffffff #fff1f1 #a2191f #198038 #ffffff #defbe6 #0e6027 #f1c21b #161616 #fcf4d6 #5e4800
        #0043ce #ffffff #edf5ff #002d9c #393939 #f4f4f4 #78a9ff #161616`);
  const style = (
    size: number,
    line: number,
    weight: number,
    tracking = 0,
  ): [number, number, number, number] => [size, line, weight, tracking];
  return themed(
    colors,
    CARBON_FAMILY,
    [
      style(54, 60, 300),
      style(42, 50, 300),
      style(32, 40, 400),
      style(28, 36, 400),
      style(20, 28, 400),
      style(16, 24, 600),
      style(20, 28, 400),
      style(16, 22, 600, 0.16),
      style(14, 18, 600, 0.16),
      style(16, 24, 400),
      style(14, 18, 400, 0.16),
      style(12, 16, 400, 0.32),
      style(14, 18, 400, 0.16),
      style(12, 16, 400, 0.32),
      style(12, 16, 400, 0.32),
    ],
    {
      // The UI shell header is gray 100 in every theme.
      tokenSets: {
        carbon: {
          headerBackground: "#161616",
          headerText: "#f4f4f4",
          headerTextSecondary: "#c6c6c6",
          headerBorder: "#393939",
          headerInteractive: "#4589ff",
        },
      },
      // Square everything; `full` is for toggles and tags, the only rounded elements.
      shapes: {
        none: "0px",
        extraSmall: "0px",
        small: "0px",
        medium: "0px",
        large: "0px",
        extraLarge: "0px",
        full: "9999px",
      },
      motion: {
        durationShort: "110ms",
        durationMedium: "150ms",
        durationLong: "240ms",
        easingStandard: "cubic-bezier(0.2, 0, 0.38, 0.9)",
        easingEmphasized: "cubic-bezier(0.4, 0.14, 0.3, 1)",
      },
    },
  );
}

// --- Output ---------------------------------------------------------------------------------------------------------

const skins = [
  {
    dir: "skin-minimal",
    name: "minimal",
    build: minimal,
    note: "Minimal: true-gray surfaces and an ink primary.",
  },
  {
    dir: "skin-cupertino",
    name: "cupertino",
    build: cupertino,
    note: "Cupertino: Apple's system colors, SF type and iOS radii.",
  },
  {
    dir: "skin-material",
    name: "material",
    build: material,
    note: "Material: the M3 baseline scheme, shapes, motion and type scale.",
  },
  {
    dir: "skin-fluent",
    name: "fluent",
    build: fluent,
    note: "Fluent 2: the neutral ramp, brandWeb, the status colors and the state tokens.",
  },
  {
    dir: "skin-carbon",
    name: "carbon",
    build: (dark: boolean) => carbon(dark ? "g100" : "white"),
    note: "Carbon: IBM's White and G100 themes (G10 and G90 beside them), square shapes and productive motion.",
    extra: { G10: carbon("g10"), G90: carbon("g90") },
  },
];

const root = fileURLToPath(new URL("..", import.meta.url));
let stale = false;
for (const { dir, name, build, note, extra } of skins) {
  const raw = `// Generated by tools/generate-starter-themes.ts; do not edit. ${note}
import type { CamoTheme, CamoThemeSet } from "@srctool/camouflage-core";

const light: CamoTheme = ${JSON.stringify(build(false), null, 2)};

const dark: CamoTheme = ${JSON.stringify(build(true), null, 2)};

/** The ${name} skin's starter theme, light and dark. */
export const ${name}Themes: CamoThemeSet = { light, dark };
${Object.entries(extra ?? {})
  .map(
    ([key, theme]) =>
      `\n/** The ${name} skin's ${key} theme. */\nexport const ${name}${key}: CamoTheme = ${JSON.stringify(theme, null, 2)};\n`,
  )
  .join("")}`;
  const file = `${root}packages/${dir}/src/theme.ts`;
  // Formatted as the repository is, so the committed file and a fresh one compare equal.
  const body = await format(raw, { ...(await resolveConfig(file)), filepath: file });
  if (process.argv.includes("--check")) {
    if (readFileSync(file, "utf8") !== body) {
      console.error(
        `${dir}/src/theme.ts is out of date; run \`pnpm themes\` and commit the result.`,
      );
      stale = true;
    }
  } else {
    writeFileSync(file, body);
    console.warn(`wrote ${dir}/src/theme.ts`);
  }
}
if (stale) process.exit(1);
