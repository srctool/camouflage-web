import type { CamoColors, CamoTheme, CamoThemeSet } from "@srctool/camouflage-core";
import { fromSeed } from "@srctool/camouflage-core/seed";
import { materialThemes } from "./theme.ts";

/** What `materialTheme` takes. */
export interface MaterialThemeOptions {
  /** The seed color of M3's tonal palettes; without it, the baseline scheme. */
  seed?: string;
  /** Replaces the font family of every text style (skins never bundle fonts, ADR-33). */
  fontFamily?: string;
}

/** M3 "tonal spot" colors from a seed: the surfaces carry its hue; the status families are Camouflage's. */
export function materialColors(seed: string, dark: boolean = false): CamoColors {
  return fromSeed({ primary: seed, neutral: seed, dark });
}

/**
 * Material 3's starter theme: the baseline scheme, or tonal palettes from your `seed`, with M3's shapes, motion and
 * type scale. With no options it is `materialThemes`. Pass it as the provider's `theme`.
 */
export function materialTheme(options: MaterialThemeOptions = {}): CamoThemeSet {
  const { seed, fontFamily } = options;
  const restyle = (theme: CamoTheme, dark: boolean): CamoTheme => ({
    ...theme,
    colors: seed === undefined ? theme.colors : materialColors(seed, dark),
    typography:
      fontFamily === undefined
        ? theme.typography
        : (Object.fromEntries(
            Object.entries(theme.typography).map(([name, style]) => [
              name,
              { ...style, family: fontFamily },
            ]),
          ) as unknown as CamoTheme["typography"]),
  });
  return {
    light: restyle(materialThemes.light, false),
    dark: restyle(materialThemes.dark, true),
  };
}
