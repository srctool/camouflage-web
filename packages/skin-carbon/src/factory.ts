import type { CamoTheme, CamoThemeSet } from "@srctool/camouflage-core";
import { fromSeed } from "@srctool/camouflage-core/seed";
import { carbonG10, carbonG90, carbonThemes } from "./theme.ts";

/** Carbon's control sizes: `xs` 24, `sm` 32, `md` 40 and `lg` 48. */
export type CarbonDensity = "xs" | "sm" | "md" | "lg";

const HEIGHTS: Record<CarbonDensity, string> = { xs: "24px", sm: "32px", md: "40px", lg: "48px" };

/** What `carbonTheme` takes. */
export interface CarbonThemeOptions {
  /** The theme of the light scheme. */
  light?: "white" | "g10";
  /** The theme of the dark scheme. */
  dark?: "g90" | "g100";
  /** A brand color: only the `primary` family changes. */
  accent?: string;
  /** The controls' size; without it they follow the input, `md` with a pointer and `lg` with fingers. */
  density?: CarbonDensity;
  /** Replaces the font family of every text style, for example IBM Plex Sans your app loads (ADR-33). */
  fontFamily?: string;
}

/**
 * Carbon's starter themes (White and G10 light, G90 and G100 dark) with your accent, density or font. With no options
 * it is `carbonThemes`. Pass it as the provider's `theme`.
 */
export function carbonTheme(options: CarbonThemeOptions = {}): CamoThemeSet {
  const { light = "white", dark = "g100", accent, density, fontFamily } = options;
  const restyle = (theme: CamoTheme, isDark: boolean): CamoTheme => {
    let next = theme;
    if (accent !== undefined) {
      const seeded = fromSeed({ primary: accent, dark: isDark });
      next = {
        ...next,
        colors: {
          ...next.colors,
          primary: seeded.primary,
          onPrimary: seeded.onPrimary,
          primaryContainer: seeded.primaryContainer,
          onPrimaryContainer: seeded.onPrimaryContainer,
          inversePrimary: seeded.inversePrimary,
        },
      };
    }
    if (density !== undefined)
      next = {
        ...next,
        tokenSets: { ...next.tokenSets, carbonDensity: { control: HEIGHTS[density] } },
      };
    if (fontFamily !== undefined)
      next = {
        ...next,
        typography: Object.fromEntries(
          Object.entries(next.typography).map(([name, style]) => [
            name,
            { ...style, family: fontFamily },
          ]),
        ) as unknown as CamoTheme["typography"],
      };
    return next;
  };
  return {
    light: restyle(light === "g10" ? carbonG10 : carbonThemes.light, false),
    dark: restyle(dark === "g90" ? carbonG90 : carbonThemes.dark, true),
  };
}
