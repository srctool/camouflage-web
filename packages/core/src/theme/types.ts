/**
 * The theme model (spike subset). A theme holds **values** (CSS strings), and the provider writes them as
 * `--camo-*` custom properties (ADR-43). Renderers never read these values: they read `tokens`, whose leaves
 * are `var(--camo-…)` references (see `tokens.ts`), so a theme change needs no re-render by the skin.
 */

/** The color roles: the same names as `CamoColors` in Kotlin and Dart. */
export interface CamoColors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  surface: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  success: string;
  onSuccess: string;
  successContainer: string;
  onSuccessContainer: string;
  warning: string;
  onWarning: string;
  warningContainer: string;
  onWarningContainer: string;
  info: string;
  onInfo: string;
  infoContainer: string;
  onInfoContainer: string;
  scrim: string;
}

/** Corner radii as CSS lengths. */
export interface CamoShapes {
  none: string;
  extraSmall: string;
  small: string;
  medium: string;
  large: string;
  extraLarge: string;
  full: string;
}

/** The spacing steps as CSS lengths. */
export interface CamoSpacing {
  none: string;
  xxs: string;
  xs: string;
  s: string;
  m: string;
  l: string;
  xl: string;
  xxl: string;
}

/** One text style; every field is a CSS value. */
export interface CamoTextStyle {
  family: string;
  size: string;
  lineHeight: string;
  weight: string;
  letterSpacing: string;
}

/** The text styles the spike's components use (the full scale arrives with W1). */
export interface CamoTypography {
  labelLarge: CamoTextStyle;
  titleMedium: CamoTextStyle;
  titleLarge: CamoTextStyle;
  headlineSmall: CamoTextStyle;
  bodyMedium: CamoTextStyle;
  bodySmall: CamoTextStyle;
}

/** Durations and easings. Reduced motion zeroes the durations (the provider does this). */
export interface CamoMotion {
  durationShort: string;
  durationMedium: string;
  easingStandard: string;
  easingEmphasized: string;
}

/** Elevation as the blur-and-offset unit a skin turns into a shadow. */
export interface CamoElevation {
  level0: string;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  level5: string;
}

/** A complete theme for one color scheme. */
export interface CamoTheme {
  colors: CamoColors;
  shapes: CamoShapes;
  spacing: CamoSpacing;
  typography: CamoTypography;
  motion: CamoMotion;
  elevation: CamoElevation;
}

/** A theme for both color schemes, as a skin's starter theme and as a provider's `theme` property. */
export interface CamoThemeSet {
  light: CamoTheme;
  dark: CamoTheme;
}

/** A recursive partial: what `createCamoTheme` and a provider's `theme` property accept on top of a base. */
export type PartialTheme<T> = {
  [K in keyof T]?: T[K] extends string ? string : PartialTheme<T[K]>;
};

/** A partial theme per scheme. */
export interface PartialThemeSet {
  light?: PartialTheme<CamoTheme>;
  dark?: PartialTheme<CamoTheme>;
}

/** The scheme names. */
export type CamoScheme = "light" | "dark";
