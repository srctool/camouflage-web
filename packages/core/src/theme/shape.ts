import { createTokens } from "./tokens.ts";
import type { CamoColors, CamoTextStyle, CamoTheme } from "./types.ts";

const colors: CamoColors = {
  primary: "",
  onPrimary: "",
  primaryContainer: "",
  onPrimaryContainer: "",
  secondary: "",
  onSecondary: "",
  secondaryContainer: "",
  onSecondaryContainer: "",
  surface: "",
  surfaceContainerLowest: "",
  surfaceContainerLow: "",
  surfaceContainer: "",
  surfaceContainerHigh: "",
  surfaceContainerHighest: "",
  onSurface: "",
  onSurfaceVariant: "",
  outline: "",
  outlineVariant: "",
  error: "",
  onError: "",
  errorContainer: "",
  onErrorContainer: "",
  success: "",
  onSuccess: "",
  successContainer: "",
  onSuccessContainer: "",
  warning: "",
  onWarning: "",
  warningContainer: "",
  onWarningContainer: "",
  info: "",
  onInfo: "",
  infoContainer: "",
  onInfoContainer: "",
  scrim: "",
};

const text: CamoTextStyle = { family: "", size: "", lineHeight: "", weight: "", letterSpacing: "" };

/** A complete theme with empty values: the shape the token references are derived from. */
const shape: CamoTheme = {
  colors,
  shapes: { none: "", extraSmall: "", small: "", medium: "", large: "", extraLarge: "", full: "" },
  spacing: { none: "", xxs: "", xs: "", s: "", m: "", l: "", xl: "", xxl: "" },
  typography: {
    labelLarge: text,
    titleMedium: text,
    titleLarge: text,
    headlineSmall: text,
    bodyMedium: text,
    bodySmall: text,
  },
  motion: { durationShort: "", durationMedium: "", easingStandard: "", easingEmphasized: "" },
  elevation: { level0: "", level1: "", level2: "", level3: "", level4: "", level5: "" },
};

/**
 * The theme as references: `tokens.colors.primary` is `"var(--camo-color-primary)"`. A renderer's `theme` argument is
 * this object, so its CSS reads the live theme without any theme value passing through JavaScript.
 */
export const tokens: CamoTheme = createTokens(shape);
