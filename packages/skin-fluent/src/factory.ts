import { Hct, TonalPalette, argbFromHex, hexFromArgb } from "@material/material-color-utilities";
import type { CamoTheme, CamoThemeSet } from "@srctool/camouflage-core";
import { fluentThemes } from "./theme.ts";

/** Fluent's default brand color, `brandWeb[80]`. */
export const FLUENT_BRAND_BLUE = "#0f6cbd";

// brandWeb, steps 10..160: a custom brand keeps its hue and chroma at these tones.
const BRAND_WEB =
  "#061724 #082338 #0a2e4a #0c3b5e #0e4775 #0f548c #115ea3 #0f6cbd #2886de #479ef5 #62abf5 #77b7f7 #96c6fa #b4d6fa #cfe4fa #ebf3fc".split(
    " ",
  );

/** The control sizes: `small` 24, `medium` 32 and `touch` 40. */
export type FluentDensity = "small" | "medium" | "touch";

const HEIGHTS: Record<FluentDensity, string> = { small: "24px", medium: "32px", touch: "40px" };

/** What `fluentTheme` takes. */
export interface FluentThemeOptions {
  /** The brand color (`#rrggbb`): the `primary` family and the brand tokens. */
  brand?: string;
  /** The controls' size; without it they follow the input, `medium` with a pointer and `touch` with fingers. */
  density?: FluentDensity;
  /** Replaces the font family of every text style (skins never bundle fonts, ADR-33). */
  fontFamily?: string;
}

function ramp(brand: string): (step: number) => string {
  const hct = Hct.fromInt(argbFromHex(brand));
  const palette = TonalPalette.fromHueAndChroma(hct.hue, hct.chroma);
  return (step) =>
    step === 80
      ? brand
      : hexFromArgb(
          palette.tone(Math.floor(Hct.fromInt(argbFromHex(BRAND_WEB[step / 10 - 1]!)).tone)),
        );
}

function withBrand(theme: CamoTheme, b: (step: number) => string, dark: boolean): CamoTheme {
  const primary = dark ? b(100) : b(80);
  const container = dark ? b(20) : b(160);
  const onContainer = dark ? b(110) : b(70);
  return {
    ...theme,
    colors: {
      ...theme.colors,
      primary,
      onPrimary: dark ? "#000000" : "#ffffff",
      primaryContainer: container,
      onPrimaryContainer: onContainer,
      info: primary,
      infoContainer: dark ? b(30) : b(160),
      onInfoContainer: dark ? b(130) : b(70),
      inversePrimary: dark ? b(80) : b(100),
    },
    tokenSets: {
      ...theme.tokenSets,
      fluent: {
        ...theme.tokenSets["fluent"],
        brandBackground: dark ? b(70) : b(80),
        brandBackgroundHover: dark ? b(80) : b(70),
        brandBackgroundPressed: b(40),
      },
    },
  };
}

/**
 * Fluent 2's starter theme with your brand, density or font. With no options it is `fluentThemes`, whose controls
 * follow the input. Pass it as the provider's `theme`.
 */
export function fluentTheme(options: FluentThemeOptions = {}): CamoThemeSet {
  const { brand, density, fontFamily } = options;
  const restyle = (theme: CamoTheme, dark: boolean): CamoTheme => {
    let next = brand === undefined ? theme : withBrand(theme, ramp(brand.toLowerCase()), dark);
    if (density !== undefined)
      next = {
        ...next,
        tokenSets: { ...next.tokenSets, fluentDensity: { control: HEIGHTS[density] } },
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
  return { light: restyle(fluentThemes.light, false), dark: restyle(fluentThemes.dark, true) };
}
