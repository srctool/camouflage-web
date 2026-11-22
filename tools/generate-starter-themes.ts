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
];

const root = fileURLToPath(new URL("..", import.meta.url));
let stale = false;
for (const { dir, name, build, note } of skins) {
  const raw = `// Generated by tools/generate-starter-themes.ts; do not edit. ${note}
import type { CamoTheme, CamoThemeSet } from "@srctool/camouflage-core";

const light: CamoTheme = ${JSON.stringify(build(false), null, 2)};

const dark: CamoTheme = ${JSON.stringify(build(true), null, 2)};

/** The ${name} skin's starter theme, light and dark. */
export const ${name}Themes: CamoThemeSet = { light, dark };
`;
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
