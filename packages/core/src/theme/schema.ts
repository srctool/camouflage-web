import type {
  ButtonTheme,
  CamoColors,
  CamoComponentThemes,
  CamoElevation,
  CamoMotion,
  CamoShapes,
  CamoSpacing,
  CamoTextStyle,
  CamoTypography,
  DialogTheme,
} from "./types.ts";

/** The role names of each group, in declaration order: the one list that validation, merging and CSS all read. */
type Keys<T> = { [K in keyof Required<T>]: true };

const keys = <T>(shape: Keys<T>): readonly (keyof T & string)[] =>
  Object.keys(shape) as (keyof T & string)[];

/** The 42 color roles. */
export const COLOR_ROLES: readonly (keyof CamoColors & string)[] = keys<CamoColors>({
  primary: true,
  onPrimary: true,
  primaryContainer: true,
  onPrimaryContainer: true,
  secondary: true,
  onSecondary: true,
  secondaryContainer: true,
  onSecondaryContainer: true,
  tertiary: true,
  onTertiary: true,
  tertiaryContainer: true,
  onTertiaryContainer: true,
  surface: true,
  surfaceContainerLowest: true,
  surfaceContainerLow: true,
  surfaceContainer: true,
  surfaceContainerHigh: true,
  surfaceContainerHighest: true,
  onSurface: true,
  onSurfaceVariant: true,
  outline: true,
  outlineVariant: true,
  error: true,
  onError: true,
  errorContainer: true,
  onErrorContainer: true,
  success: true,
  onSuccess: true,
  successContainer: true,
  onSuccessContainer: true,
  warning: true,
  onWarning: true,
  warningContainer: true,
  onWarningContainer: true,
  info: true,
  onInfo: true,
  infoContainer: true,
  onInfoContainer: true,
  inverseSurface: true,
  inverseOnSurface: true,
  inversePrimary: true,
  scrim: true,
});

/** The 15 text styles. */
export const TYPE_ROLES: readonly (keyof CamoTypography & string)[] = keys<CamoTypography>({
  displayLarge: true,
  displayMedium: true,
  displaySmall: true,
  headlineLarge: true,
  headlineMedium: true,
  headlineSmall: true,
  titleLarge: true,
  titleMedium: true,
  titleSmall: true,
  bodyLarge: true,
  bodyMedium: true,
  bodySmall: true,
  labelLarge: true,
  labelMedium: true,
  labelSmall: true,
});

export const TEXT_STYLE_FIELDS: readonly (keyof CamoTextStyle & string)[] = keys<CamoTextStyle>({
  family: true,
  size: true,
  lineHeight: true,
  weight: true,
  letterSpacing: true,
});

export const SHAPE_ROLES: readonly (keyof CamoShapes & string)[] = keys<CamoShapes>({
  none: true,
  extraSmall: true,
  small: true,
  medium: true,
  large: true,
  extraLarge: true,
  full: true,
});

export const SPACING_ROLES: readonly (keyof CamoSpacing & string)[] = keys<CamoSpacing>({
  none: true,
  xxs: true,
  xs: true,
  s: true,
  m: true,
  l: true,
  xl: true,
  xxl: true,
});

export const ELEVATION_ROLES: readonly (keyof CamoElevation & string)[] = keys<CamoElevation>({
  level0: true,
  level1: true,
  level2: true,
  level3: true,
  level4: true,
  level5: true,
});

export const MOTION_ROLES: readonly (keyof CamoMotion & string)[] = keys<CamoMotion>({
  durationShort: true,
  durationMedium: true,
  durationLong: true,
  easingStandard: true,
  easingEmphasized: true,
});

/** The fields each component theme takes. A component joins this table when its milestone builds it. */
export const COMPONENT_FIELDS: { [C in keyof CamoComponentThemes]-?: readonly string[] } = {
  button: keys<ButtonTheme>({
    height: true,
    minWidth: true,
    padding: true,
    paddingWithIcon: true,
    iconSize: true,
    iconGap: true,
    shape: true,
    borderWidth: true,
    raisedElevation: true,
    touchTarget: true,
    disabledContentAlpha: true,
    disabledContainerAlpha: true,
  }),
  dialog: keys<DialogTheme>({
    shape: true,
    minWidth: true,
    maxWidth: true,
    padding: true,
    elevation: true,
    scrimAlpha: true,
    actionGap: true,
    sectionGap: true,
  }),
};
