import type {
  CamoMotion,
  CamoElevation,
  CamoShapes,
  CamoSpacing,
  CamoTextStyle,
  CamoTypography,
} from "./types.ts";

/** The system font stack: SF Pro on Apple platforms, Segoe UI on Windows, Roboto on Android, the UI font elsewhere. */
export const SYSTEM_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/**
 * A length in `rem` for a size given in CSS pixels at the default 16px root. Type sizes and line heights are `rem`, so
 * the user's own font-size setting scales every text style (WCAG 1.4.4), as the platform text scaler does in Kotlin
 * and Dart; at the default setting a style is the same number of pixels as in the notes.
 */
export function rem(pixels: number): string {
  return `${Number((pixels / 16).toFixed(4))}rem`;
}

/** Camouflage's default scale (base Theme §3.5), in the system font or in `fontFamily`. */
export function systemTypography(fontFamily: string = SYSTEM_FONT): CamoTypography {
  const style = (size: number, lineHeight: number, weight: number): CamoTextStyle => ({
    family: fontFamily,
    size: rem(size),
    lineHeight: rem(lineHeight),
    weight: String(weight),
    letterSpacing: "0px",
  });
  return {
    displayLarge: style(48, 56, 600),
    displayMedium: style(40, 48, 600),
    displaySmall: style(32, 40, 600),
    headlineLarge: style(28, 36, 600),
    headlineMedium: style(24, 32, 600),
    headlineSmall: style(20, 28, 600),
    titleLarge: style(18, 26, 600),
    titleMedium: style(16, 24, 600),
    titleSmall: style(14, 20, 600),
    bodyLarge: style(16, 24, 400),
    bodyMedium: style(14, 20, 400),
    bodySmall: style(12, 16, 400),
    labelLarge: style(14, 20, 500),
    labelMedium: style(12, 16, 500),
    labelSmall: style(11, 16, 500),
  };
}

/** Camouflage's default corner radii (ADR-24); `full` is a pill. */
export const DEFAULT_SHAPES: CamoShapes = {
  none: "0px",
  extraSmall: "4px",
  small: "6px",
  medium: "8px",
  large: "12px",
  extraLarge: "16px",
  full: "9999px",
};

/** The spacing steps, on a 4-point grid. */
export const DEFAULT_SPACING: CamoSpacing = {
  none: "0px",
  xxs: "2px",
  xs: "4px",
  s: "8px",
  m: "12px",
  l: "16px",
  xl: "24px",
  xxl: "32px",
};

/** Semantic depth as lengths (Kotlin and Dart use dp / logical pixels). */
export const DEFAULT_ELEVATION: CamoElevation = {
  level0: "0px",
  level1: "1px",
  level2: "3px",
  level3: "6px",
  level4: "8px",
  level5: "12px",
};

/** Camouflage's calm durations and its two easings. */
export const DEFAULT_MOTION: CamoMotion = {
  durationShort: "120ms",
  durationMedium: "200ms",
  durationLong: "300ms",
  easingStandard: "cubic-bezier(0.2, 0, 0, 1)",
  easingEmphasized: "cubic-bezier(0.05, 0.7, 0.1, 1)",
};
