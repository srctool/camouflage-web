import { parseColor } from "@srctool/camouflage-core";
import type { CamoTheme, CamoThemeSet } from "@srctool/camouflage-core";
import { cupertinoThemes } from "./theme.ts";

/** Apple's `systemBlue` (light): the default accent. The dark appearance's is `#0a84ff`. */
export const SYSTEM_BLUE = "#007aff";
const SYSTEM_BLUE_DARK = "#0a84ff";

/** What `cupertinoTheme` takes. */
export interface CupertinoThemeOptions {
  /** The accent: the `primary` family. Default `systemBlue`, and its dark variant in the dark appearance. */
  accent?: string;
  /** Replaces the font family of every text style (skins never bundle fonts, ADR-33); the default is the system font. */
  fontFamily?: string;
}

/** `color` at `alpha` over an opaque `background`, as Flutter's `Color.alphaBlend` does. */
function over(color: string, alpha: number, background: string): string {
  const [c, b] = [parseColor(color), parseColor(background)];
  if (c === null || b === null)
    throw new TypeError(`"${color}" is not a color the accent can use (use #rrggbb).`);
  const mix = (x: number, y: number): string =>
    Math.round(x * alpha + y * (1 - alpha))
      .toString(16)
      .padStart(2, "0");
  return `#${mix(c.r, b.r)}${mix(c.g, b.g)}${mix(c.b, b.b)}`;
}

function withAccent(theme: CamoTheme, accent: string, dark: boolean): CamoTheme {
  // Apple's dark appearance has its own systemBlue; a custom accent is used as given in both.
  const blue = dark && accent === SYSTEM_BLUE ? SYSTEM_BLUE_DARK : accent;
  return {
    ...theme,
    colors: {
      ...theme.colors,
      primary: blue,
      onPrimary: "#ffffff",
      primaryContainer: dark ? over(blue, 0.22, "#000000") : over(blue, 0.15, "#ffffff"),
      onPrimaryContainer: blue,
    },
  };
}

/**
 * The Cupertino starter theme with your accent (the `cupertinoTheme(accent)` of the Dart skin): Apple's system colors
 * with `primary` replaced by the accent, its container a tint of it, and everything else as Apple publishes it. With no
 * options it is `cupertinoThemes`. Pass it as the provider's `theme`, or merge it with `createCamoTheme`.
 */
export function cupertinoTheme(options: CupertinoThemeOptions = {}): CamoThemeSet {
  const { accent = SYSTEM_BLUE, fontFamily } = options;
  const restyle = (theme: CamoTheme, dark: boolean): CamoTheme => {
    const themed = withAccent(theme, accent, dark);
    if (fontFamily === undefined) return themed;
    return {
      ...themed,
      typography: Object.fromEntries(
        Object.entries(themed.typography).map(([name, style]) => [
          name,
          { ...style, family: fontFamily },
        ]),
      ) as CamoTheme["typography"],
    };
  };
  return {
    light: restyle(cupertinoThemes.light, false),
    dark: restyle(cupertinoThemes.dark, true),
  };
}
