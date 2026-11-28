/**
 * The theme model. A theme holds **values** (CSS strings), and the provider writes them as
 * `--camo-*` custom properties (ADR-43). Renderers never read these values: they read `tokens`, whose leaves
 * are `var(--camo-…)` references (see `tokens.ts`), so a theme change needs no re-render by the skin.
 */

/** The 42 color roles in 7 groups: the same names as `CamoColors` in Kotlin and Dart. */
export interface CamoColors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
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
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
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

/** The 15 text styles: five roles by three sizes, each complete with its weight. */
export interface CamoTypography {
  displayLarge: CamoTextStyle;
  displayMedium: CamoTextStyle;
  displaySmall: CamoTextStyle;
  headlineLarge: CamoTextStyle;
  headlineMedium: CamoTextStyle;
  headlineSmall: CamoTextStyle;
  titleLarge: CamoTextStyle;
  titleMedium: CamoTextStyle;
  titleSmall: CamoTextStyle;
  bodyLarge: CamoTextStyle;
  bodyMedium: CamoTextStyle;
  bodySmall: CamoTextStyle;
  labelLarge: CamoTextStyle;
  labelMedium: CamoTextStyle;
  labelSmall: CamoTextStyle;
}

/** Durations and easings. Reduced motion zeroes the durations (the provider does this). */
export interface CamoMotion {
  durationShort: string;
  durationMedium: string;
  durationLong: string;
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

/** A numbered color scale as brands name them (`brand[600]`): the step is the key, the value a CSS color. */
export type CamoColorScale = Readonly<Record<string, string>>;

/** A named scale of lengths (`radius-card`, `space-3`): the name is the key, the value a CSS length. */
export type CamoDimensionScale = Readonly<Record<string, string>>;

/**
 * A brand's own tokens (ADR-32): `tokenSets.brand = { 50: "#f5f3ff", 600: "#7c3aed" }` becomes `--brand-50` and
 * `--brand-600`, in the brand's own naming and unprefixed. A role or component theme refers to one with
 * `var(--brand-600)`; a token set changes the UI only where something does.
 */
export type CamoTokenSets = Readonly<Record<string, CamoColorScale | CamoDimensionScale>>;

/**
 * Component themes: how one kind of component looks across the app. Every field is optional and a CSS value; the
 * skin's `defaults(theme)` supplies the rest. Each field is the variable `--camo-<component>-<field>` (kebab-case).
 */
export interface CamoComponentThemes {
  card?: CardTheme;
  listItem?: ListItemTheme;
  accordion?: AccordionTheme;
  skeleton?: SkeletonTheme;
  bottomSheet?: BottomSheetTheme;
  menu?: MenuTheme;
  tooltip?: TooltipTheme;
  topBar?: TopBarTheme;
  progressBar?: ProgressBarTheme;
  progressCircle?: ProgressCircleTheme;
  snackbar?: SnackbarTheme;
  banner?: BannerTheme;
  chip?: ChipTheme;
  badge?: BadgeTheme;
  avatar?: AvatarTheme;
  fab?: FabTheme;
  tabs?: TabsTheme;
  navigationBar?: NavigationBarTheme;
  navigationRail?: NavigationRailTheme;
  navigationDrawer?: NavigationDrawerTheme;
  buttonGroup?: ButtonGroupTheme;
  splitButton?: SplitButtonTheme;
  popover?: PopoverTheme;
  sideSheet?: SideSheetTheme;
  toolbar?: ToolbarTheme;
  image?: ImageTheme;
  rating?: RatingTheme;
  carousel?: CarouselTheme;
  fileUploader?: FileUploaderTheme;
  dataTable?: DataTableTheme;
  tree?: TreeTheme;
  pagination?: PaginationTheme;
  breadcrumb?: BreadcrumbTheme;
  progressSteps?: ProgressStepsTheme;
  textField?: TextFieldTheme;
  searchField?: SearchFieldTheme;
  checkbox?: CheckboxTheme;
  switch?: SwitchTheme;
  radio?: RadioTheme;
  segmentedControl?: SegmentedControlTheme;
  slider?: SliderTheme;
  stepper?: StepperTheme;
  calendar?: CalendarTheme;
  timePicker?: TimePickerTheme;
  surface?: SurfaceTheme;
  divider?: DividerTheme;
  splitPane?: SplitPaneTheme;
  scrollbar?: ScrollbarTheme;
  button?: ButtonTheme;
  iconButton?: IconButtonTheme;
  dialog?: DialogTheme;
}

/** The fields of a card theme. */
export interface CardTheme {
  shape?: string;
  contentPadding?: string;
  borderWidth?: string;
  raisedElevation?: string;
  selectedBorderWidth?: string;
}

/** The fields of a listItem theme. */
export interface ListItemTheme {
  minHeightOneLine?: string;
  minHeightTwoLines?: string;
  minHeightThreeLines?: string;
  contentPadding?: string;
  leadingGap?: string;
  trailingGap?: string;
  iconSize?: string;
  sectionShape?: string;
}

/** The fields of a accordion theme. */
export interface AccordionTheme {
  headerMinHeight?: string;
  contentPadding?: string;
}

/** The fields of a skeleton theme. */
export interface SkeletonTheme {
  baseColor?: string;
  highlightColor?: string;
  cycleDuration?: string;
  textLineGap?: string;
}

/** The fields of a bottomSheet theme. */
export interface BottomSheetTheme {
  shape?: string;
  maxWidth?: string;
  contentPadding?: string;
  scrimAlpha?: string;
  handleWidth?: string;
  handleHeight?: string;
}

/** The fields of a menu theme. */
export interface MenuTheme {
  shape?: string;
  minWidth?: string;
  maxWidth?: string;
  contentPadding?: string;
  elevation?: string;
  itemHeight?: string;
  iconSize?: string;
}

/** The fields of a tooltip theme. */
export interface TooltipTheme {
  shape?: string;
  padding?: string;
  offset?: string;
  maxWidth?: string;
}

/** The fields of a topBar theme. */
export interface TopBarTheme {
  height?: string;
  iconSize?: string;
}

/** The fields of a progressBar theme. */
export interface ProgressBarTheme {
  barHeight?: string;
  trackGap?: string;
}

/** The fields of a progressCircle theme. */
export interface ProgressCircleTheme {
  circleStroke?: string;
  circleSizeSmall?: string;
  circleSizeMedium?: string;
  circleSizeLarge?: string;
}

/** The fields of a snackbar theme. */
export interface SnackbarTheme {
  shape?: string;
  maxWidth?: string;
  margin?: string;
  minHeight?: string;
  padding?: string;
  elevation?: string;
}

/** The fields of a banner theme. */
export interface BannerTheme {
  shape?: string;
  padding?: string;
  iconSize?: string;
  accentWidth?: string;
  borderWidth?: string;
}

/** The fields of a chip theme. */
export interface ChipTheme {
  height?: string;
  shape?: string;
  padding?: string;
  iconPadding?: string;
  iconGap?: string;
  iconSize?: string;
  borderWidth?: string;
  groupSpacing?: string;
}

/** The fields of a badge theme. */
export interface BadgeTheme {
  dotSize?: string;
  height?: string;
  minWidth?: string;
  padding?: string;
  borderWidth?: string;
  offset?: string;
}

/** The fields of an avatar theme. */
export interface AvatarTheme {
  roundedShape?: string;
  sizeSmall?: string;
  sizeMedium?: string;
  sizeLarge?: string;
  presenceSize?: string;
  ringWidth?: string;
  groupOverlap?: string;
}

/** The fields of a fab theme. */
export interface FabTheme {
  sizeSmall?: string;
  sizeRegular?: string;
  sizeLarge?: string;
  extendedHeight?: string;
  shapeSmall?: string;
  shapeRegular?: string;
  shapeLarge?: string;
  iconSizeRegular?: string;
  iconSizeLarge?: string;
  iconGap?: string;
  extendedPadding?: string;
  elevation?: string;
}

/** The fields of a tabs theme. */
export interface TabsTheme {
  height?: string;
  heightWithIcon?: string;
  indicatorHeight?: string;
  minTabWidth?: string;
  iconSize?: string;
  iconGap?: string;
  tabPadding?: string;
}

/** The fields of a navigationBar theme. */
export interface NavigationBarTheme {
  height?: string;
  floatingMargin?: string;
  floatingShape?: string;
  iconSize?: string;
  indicatorWidth?: string;
  indicatorHeight?: string;
  indicatorShape?: string;
}

/** The fields of a navigationRail theme. */
export interface NavigationRailTheme {
  width?: string;
  itemSpacing?: string;
  iconSize?: string;
  indicatorWidth?: string;
  indicatorHeight?: string;
}

/** The fields of a navigationDrawer theme. */
export interface NavigationDrawerTheme {
  width?: string;
  itemHeight?: string;
  itemShape?: string;
  modalShape?: string;
  scrimAlpha?: string;
}

/** The fields of a buttonGroup theme. */
export interface ButtonGroupTheme {
  height?: string;
  shape?: string;
  innerShape?: string;
  spacing?: string;
  borderWidth?: string;
  iconSize?: string;
  iconGap?: string;
}

/** The fields of a splitButton theme. */
export interface SplitButtonTheme {
  height?: string;
  shape?: string;
  innerShape?: string;
  arrowWidth?: string;
  gap?: string;
  padding?: string;
  iconSize?: string;
  iconGap?: string;
}

/** The fields of a popover theme. */
export interface PopoverTheme {
  shape?: string;
  maxWidth?: string;
  padding?: string;
  arrowWidth?: string;
  arrowHeight?: string;
  elevation?: string;
  gap?: string;
}

/** The fields of a sideSheet theme. */
export interface SideSheetTheme {
  width?: string;
  modalShape?: string;
  padding?: string;
  scrimAlpha?: string;
}

/** The fields of a toolbar theme. */
export interface ToolbarTheme {
  height?: string;
  floatingMargin?: string;
  floatingShape?: string;
  actionSpacing?: string;
  actionSize?: string;
  padding?: string;
}

/** The fields of an image theme. */
export interface ImageTheme {
  borderWidth?: string;
}

/** The fields of a rating theme. */
export interface RatingTheme {
  smallSize?: string;
  mediumSize?: string;
  largeSize?: string;
  gap?: string;
}

/** The fields of a carousel theme. */
export interface CarouselTheme {
  itemShape?: string;
  itemSpacing?: string;
  peek?: string;
  buttonSize?: string;
}

/** The fields of a fileUploader theme. */
export interface FileUploaderTheme {
  zoneShape?: string;
  zoneHeight?: string;
}

/** The fields of a dataTable theme. */
export interface DataTableTheme {
  headerHeight?: string;
  rowHeight?: string;
  cellPadding?: string;
}

/** The fields of a tree theme. */
export interface TreeTheme {
  rowHeight?: string;
  indent?: string;
  iconSize?: string;
}

/** The fields of a pagination theme. */
export interface PaginationTheme {
  buttonSize?: string;
  shape?: string;
  dotSize?: string;
}

/** The fields of a breadcrumb theme. */
export interface BreadcrumbTheme {
  itemPadding?: string;
}

/** The fields of a progressSteps theme. */
export interface ProgressStepsTheme {
  markerSize?: string;
  connectorWidth?: string;
}

/** The fields of a textField theme. */
export interface TextFieldTheme {
  height?: string;
  shape?: string;
  borderWidth?: string;
  padding?: string;
  iconSize?: string;
}

/** The fields of a searchField theme. */
export interface SearchFieldTheme {
  height?: string;
  shape?: string;
  padding?: string;
  iconSize?: string;
}

/** The fields of a checkbox theme. */
export interface CheckboxTheme {
  boxSize?: string;
  shape?: string;
  borderWidth?: string;
  labelGap?: string;
}

/** The fields of a switch theme. */
export interface SwitchTheme {
  trackWidth?: string;
  trackHeight?: string;
  thumbSizeOff?: string;
  thumbSizeOn?: string;
  labelGap?: string;
}

/** The fields of a radio theme. */
export interface RadioTheme {
  size?: string;
  dotSize?: string;
  borderWidth?: string;
  labelGap?: string;
}

/** The fields of a segmentedControl theme. */
export interface SegmentedControlTheme {
  height?: string;
  shape?: string;
  borderWidth?: string;
  iconSize?: string;
}

/** The fields of a slider theme. */
export interface SliderTheme {
  trackHeight?: string;
  thumbSize?: string;
}

/** The fields of a stepper theme. */
export interface StepperTheme {
  height?: string;
  shape?: string;
  valueMinWidth?: string;
  iconSize?: string;
}

/** The fields of a calendar theme. */
export interface CalendarTheme {
  daySize?: string;
  shape?: string;
}

/** The fields of a timePicker theme. */
export interface TimePickerTheme {
  digitSize?: string;
  shape?: string;
}

/** The fields of a surface's theme. */
export interface SurfaceTheme {
  borderWidth?: string;
  borderColor?: string;
}

/** The fields of a divider's theme. */
export interface DividerTheme {
  thickness?: string;
  color?: string;
  startInset?: string;
  endInset?: string;
}

/** The fields of an icon button's theme. */
export interface IconButtonTheme {
  containerSize?: string;
  shape?: string;
  iconSize?: string;
  /** Not in the base contract: the touch area kept around the container (48px by default). */
  touchTarget?: string;
  disabledContentAlpha?: string;
  disabledContainerAlpha?: string;
}

/** The fields of a button's theme; a field the theme leaves out comes from the skin. */
export interface ButtonTheme {
  height?: string;
  minWidth?: string;
  padding?: string;
  paddingWithIcon?: string;
  iconSize?: string;
  iconGap?: string;
  shape?: string;
  borderWidth?: string;
  raisedElevation?: string;
  /** Not in the base contract: the touch area Camouflage keeps around a smaller button (48px by default). */
  touchTarget?: string;
  disabledContentAlpha?: string;
  disabledContainerAlpha?: string;
}

/** The fields of a dialog's theme. */
export interface DialogTheme {
  shape?: string;
  minWidth?: string;
  maxWidth?: string;
  padding?: string;
  elevation?: string;
  scrimAlpha?: string;
  /** Not in the base contract: the gap between actions, and between the title, message and content. */
  actionGap?: string;
  sectionGap?: string;
}

/** A complete theme for one color scheme. */
export interface CamoTheme {
  colors: CamoColors;
  typography: CamoTypography;
  components: CamoComponentThemes;
  shapes: CamoShapes;
  spacing: CamoSpacing;
  elevation: CamoElevation;
  motion: CamoMotion;
  tokenSets: CamoTokenSets;
}

/** A theme for both color schemes, as a skin's starter theme and as a provider's `theme` property. */
export interface CamoThemeSet {
  light: CamoTheme;
  dark: CamoTheme;
}

/** A recursive partial: what `createCamoTheme` and a provider's `theme` property accept on top of a base. */
export type PartialTheme<T> = {
  [K in keyof T]?: T[K] extends string | undefined ? string : PartialTheme<NonNullable<T[K]>>;
};

/** A partial theme per scheme. */
export interface PartialThemeSet {
  light?: PartialTheme<CamoTheme>;
  dark?: PartialTheme<CamoTheme>;
}

/** The scheme names. */
export type CamoScheme = "light" | "dark";

/** The fields of a splitPane theme. */
export interface SplitPaneTheme {
  thickness?: string;
  hitSize?: string;
  keyStep?: string;
  keyStepLarge?: string;
}

/** The fields of a scrollbar theme. */
export interface ScrollbarTheme {
  thickness?: string;
  hoverThickness?: string;
  minThumb?: string;
  hideDelay?: string;
}
