import type { CSSResultGroup } from "lit";
import type { nothing, TemplateResult } from "lit";
import type { CamoTextStyle, CamoTheme } from "../theme/types.ts";

/** What a component asks a renderer to draw (the contract's `Renderer`, base Skin Contract §3). */
export interface Renderer<State, Slots extends string, Style> {
  /** A complete component theme (every field set). May reference global tokens, and component variables with a fallback. */
  defaults(theme: CamoTheme): Style;
  /** Pure: the output depends only on the arguments. No browser access, no timers, no network. */
  render(args: RenderArgs<State, Slots, Style>): TemplateResult;
  /** Styles for this renderer's shadow root. */
  readonly styles?: CSSResultGroup;
}

/** The arguments of every `render`. */
export interface RenderArgs<State, Slots extends string, Style> {
  state: State;
  /** The names of the `<slot>` elements the renderer may place. */
  slots: SlotNames<Slots>;
  /** Token references (`var(--camo-…)`), never values. */
  theme: CamoTheme;
  /** The resolved component theme: `defaults(theme)`, with the host's overrides applied through variables. */
  style: Style;
  /** The host skin's surface treatment and feedback, so a renderer paints and responds like its skin. */
  skin: SkinParts;
  /**
   * Nodes core built and the renderer only places: the editable `<input>` of a field, a stepper's buttons. They carry
   * their own behavior, so a skin never recreates them and never formats what they show.
   */
  nodes?: Nodes;
}

/** Pre-built nodes by name (`input`, `decrease`, …); `nothing` when a node does not apply now (a clear button). */
export type Nodes = { readonly [name: string]: TemplateResult | typeof nothing };

/** The names of the native `<slot>` elements a renderer may place. */
export type SlotNames<S extends string> = { readonly [K in S]: string };

/** The parts of a skin that every renderer may use. */
export interface SkinParts {
  readonly surfaceTreatment: SurfaceTreatment;
  readonly feedback: InteractionFeedback;
}

/** How a skin paints a region: background, border or shadow, blur, clip to a shape. Pure. */
export interface SurfaceTreatment {
  /** Wraps [child] in a region of [color], [shape] and [elevation]. */
  decorate(args: {
    child: TemplateResult;
    color: string;
    shape: string;
    elevation: string;
    border?: string | undefined;
    /** A region that holds content flowing in blocks (a surface), not one centered control (a button). */
    block?: boolean;
    theme: CamoTheme;
  }): TemplateResult;
}

/** A skin's visual response to hover, press and keyboard focus. Pure; the response is CSS over the host's states. */
export interface InteractionFeedback {
  /** Wraps [child] so it responds to the host's `:hover`, `:active` and `:focus-visible`. */
  wrap(args: {
    child: TemplateResult;
    contentColor: string;
    shape: string;
    theme: CamoTheme;
  }): TemplateResult;
}

// --- The spike's two components: state and style types --------------------------------------------------------

/** Visual weight (base Design Language). */
export type Appearance = "solid" | "soft" | "raised" | "outline" | "ghost" | "link";

/** Color family. */
export type Tone = "default" | "error" | "success" | "warning" | "info";

export interface ButtonState {
  text: string;
  appearance: Appearance;
  tone: Tone;
  disabled: boolean;
  loading: boolean;
}

/** Container, content and border colors of one appearance (CSS values). */
export interface ButtonColors {
  container: string;
  content: string;
  border?: string;
}

export interface ButtonStyle {
  defaultAppearance: Appearance;
  height: string;
  minWidth: string;
  shape: string;
  paddingInline: string;
  paddingInlineWithIcon: string;
  textStyle: CamoTextStyle;
  iconSize: string;
  iconGap: string;
  touchTarget: string;
  borderWidth: string;
  raisedElevation: string;
  solid: ButtonColors;
  soft: ButtonColors;
  raised: ButtonColors;
  outline: ButtonColors;
  ghost: ButtonColors;
  link: ButtonColors;
  disabledContainerAlpha: string;
  disabledContentAlpha: string;
}

export type ButtonSlots = "prefix-icon" | "suffix-icon";

export interface DialogState {
  title: string | null;
  message: string;
  /** The ids the host wires for the dialog's name and description (inside the shadow root). */
  titleId: string;
  messageId: string;
}

/** How the confirm and dismiss actions are arranged (ADR-28). */
export type DialogActionsLayout = "end" | "center" | "full-width-row" | "stacked";

export interface DialogStyle {
  shape: string;
  minWidth: string;
  maxWidth: string;
  padding: string;
  titleStyle: CamoTextStyle;
  messageStyle: CamoTextStyle;
  titleAlign: "start" | "center";
  actionsLayout: DialogActionsLayout;
  actionGap: string;
  sectionGap: string;
  elevation: string;
  scrimAlpha: string;
  container: string;
  titleColor: string;
  messageColor: string;
  border: string | null;
}

export type DialogSlots = "confirm" | "dismiss" | "content";

// --- W2: text, icon, surface, divider, icon button -------------------------------------------------------------

/** The 15 type roles, in the contract's order. */
export type TextVariant =
  | "display-large"
  | "display-medium"
  | "display-small"
  | "headline-large"
  | "headline-medium"
  | "headline-small"
  | "title-large"
  | "title-medium"
  | "title-small"
  | "body-large"
  | "body-medium"
  | "body-small"
  | "label-large"
  | "label-medium"
  | "label-small";

export type TextOverflow = "clip" | "ellipsis";
export type TextAlign = "start" | "center" | "end";

export interface TextState {
  text: string;
  variant: TextVariant;
  /** A CSS color, or null for the content color the container set. */
  color: string | null;
  /** 0 is unlimited. */
  maxLines: number;
  overflow: TextOverflow;
  textAlign: TextAlign;
}

export interface TextStyle {
  /** What a link inside the text looks like (rich text is slotted markup: `<a>`, `<strong>`, `<em>`). */
  linkColor: string;
  linkDecoration: "underline" | "none";
}

export type TextSlots = "content";

export interface IconState {
  /** The resolved artwork, or null when the icon is drawn from slotted SVG. */
  artwork: IconArtwork | null;
  /** A CSS length, or null for the ambient icon size. */
  size: string | null;
  /** A CSS color, or null for the ambient content color. */
  tint: string | null;
  /** Mirrors in right-to-left (a back arrow, a chevron). */
  autoMirror: boolean;
  /** A multicolor asset: never tinted. */
  original: boolean;
}

/** An icon as `registerIcons` stores it: SVG content drawn in a `viewBox` (24 square by default). */
export interface IconArtwork {
  /** The inside of an `<svg>`: paths and shapes. Trusted markup, supplied by the app. */
  svg: string;
  viewBox: string;
}

export interface IconStyle {
  /** The size an icon takes when nothing around it sets one. */
  defaultSize: string;
}

export type IconSlots = "content";

export type SurfaceLevel = "lowest" | "low" | "surface" | "container" | "high" | "highest";
export type ShapeName =
  "none" | "extra-small" | "small" | "medium" | "large" | "extra-large" | "full";
export type ElevationName = "level0" | "level1" | "level2" | "level3" | "level4" | "level5";

export interface SurfaceState {
  level: SurfaceLevel;
  shape: ShapeName;
  elevation: ElevationName;
  border: boolean;
}

export interface SurfaceStyle {
  borderWidth: string;
  borderColor: string;
}

export type SurfaceSlots = "content";

export type DividerOrientation = "horizontal" | "vertical";
export type DividerInset = "none" | "start" | "middle";

export interface DividerState {
  orientation: DividerOrientation;
  inset: DividerInset;
}

export interface DividerStyle {
  thickness: string;
  color: string;
  startInset: string;
  endInset: string;
}

export type DividerSlots = never;

export interface IconButtonState {
  label: string;
  appearance: Appearance;
  tone: Tone;
  disabled: boolean;
  loading: boolean;
  /** A toggle button (favorite, bookmark), and whether it is on. */
  toggle: boolean;
  checked: boolean;
  tooltip: string | null;
}

export interface IconButtonStyle {
  defaultAppearance: Appearance;
  containerSize: string;
  shape: string;
  iconSize: string;
  touchTarget: string;
  borderWidth: string;
  solid: ButtonColors;
  soft: ButtonColors;
  outline: ButtonColors;
  ghost: ButtonColors;
  checked: ButtonColors;
  disabledContainerAlpha: string;
  disabledContentAlpha: string;
}

export type IconButtonSlots = "icon";

// --- W3: inputs ------------------------------------------------------------------------------------------------

export type LabelPlacement = "above" | "floating";
export type ButtonType = "button" | "submit" | "reset";
export type GroupOrientation = "vertical" | "horizontal";
/** When a form's fields validate. */
export type ValidateMode = "disabled" | "always" | "on-user-interaction" | "on-unfocus";
/** Where a picker's panel opens: below the field, from the bottom, or by the window width. */
export type Presentation = "auto" | "popup" | "menu" | "sheet";
export type HourCycle = "12" | "24";
export type LabelPosition = "start" | "end";

export interface TextFieldState {
  label: string | null;
  placeholder: string | null;
  supportingText: string | null;
  /** A message: the field is in the error state and the message replaces the supporting text. */
  error: string | null;
  prefixText: string | null;
  suffixText: string | null;
  disabled: boolean;
  focused: boolean;
  multiline: boolean;
  required: boolean;
  /** Nothing typed: a floating label rests inside the field, and prefix and suffix texts are hidden. */
  isEmpty: boolean;
  /** The attribute, else the skin's default. */
  labelPlacement: LabelPlacement;
}

export interface TextFieldStyle {
  labelPlacement: LabelPlacement;
  height: string;
  shape: string;
  borderWidth: string;
  padding: string;
  iconSize: string;
}

export type TextFieldSlots = "prefix-icon" | "suffix-icon";

export interface SearchFieldState {
  disabled: boolean;
  focused: boolean;
  isEmpty: boolean;
}

export interface SearchFieldStyle {
  height: string;
  shape: string;
  padding: string;
  iconSize: string;
}

export type SearchFieldSlots = "leading" | "trailing";

/** A checkbox, a switch or a radio: a box with a label, a description and an error. */
export interface ToggleState {
  checked: boolean;
  /** A checkbox that is neither on nor off. */
  indeterminate: boolean;
  label: string | null;
  description: string | null;
  error: string | null;
  disabled: boolean;
}

export interface CheckboxStyle {
  boxSize: string;
  shape: string;
  borderWidth: string;
  labelGap: string;
  labelPosition: LabelPosition;
}

export interface SwitchStyle {
  trackWidth: string;
  trackHeight: string;
  thumbSizeOff: string;
  thumbSizeOn: string;
  labelGap: string;
  labelPosition: LabelPosition;
}

export interface RadioStyle {
  size: string;
  dotSize: string;
  borderWidth: string;
  labelGap: string;
  labelPosition: LabelPosition;
}

/** The label of a toggle is the `label` value, or rich content in the default slot. */
export type ToggleSlots = "label";

export interface SegmentedControlState {
  disabled: boolean;
  multiple: boolean;
}

export interface SegmentedControlStyle {
  height: string;
  shape: string;
  borderWidth: string;
  iconSize: string;
  showCheckIcon: boolean;
}

export type SegmentedControlSlots = "content";

export type SegmentPosition = "first" | "middle" | "last" | "only";

export interface SegmentState {
  selected: boolean;
  disabled: boolean;
  multiple: boolean;
  position: SegmentPosition;
  label: string | null;
  icon: IconArtwork | null;
}

export type SegmentStyle = SegmentedControlStyle;
export type SegmentSlots = "content";

export interface SliderState {
  /** 0 to 1 along the track. */
  fraction: number;
  /** The number of stops, ends included, or 0 for a continuous slider. */
  stops: number;
  disabled: boolean;
  dragging: boolean;
  valueText: string | null;
}

export interface SliderStyle {
  trackHeight: string;
  thumbSize: string;
  showStopMarks: boolean;
  showValueLabel: boolean;
}

export type SliderSlots = never;

export interface StepperState {
  valueText: string;
  disabled: boolean;
  error: boolean;
  focused: boolean;
}

export interface StepperStyle {
  layout: "inline" | "split";
  height: string;
  shape: string;
  valueMinWidth: string;
  iconSize: string;
}

export type StepperSlots = never;

/** One day of a calendar grid. */
export interface CalendarDay {
  /** `2026-11-22`. */
  iso: string;
  day: number;
  /** The day's full name for screen readers: "Sunday, 22 November 2026". */
  label: string;
  inMonth: boolean;
  enabled: boolean;
  selected: boolean;
  today: boolean;
  /** Where in a range: `start`, `middle`, `end`, or `none`. */
  range: "none" | "start" | "middle" | "end";
  /** The one day in the tab order. */
  tabbable: boolean;
}

export interface CalendarState {
  monthLabel: string;
  /** Short and long weekday names, starting at the first day of the week. */
  weekdays: { short: string; long: string }[];
  weeks: CalendarDay[][];
  canPrevious: boolean;
  canNext: boolean;
  previousLabel: string;
  nextLabel: string;
  /** What the buttons do; the renderer binds them and decides nothing. */
  actions: {
    select(iso: string): void;
    previous(): void;
    next(): void;
  };
}

export interface CalendarStyle {
  daySize: string;
  shape: string;
  showOutsideDays: boolean;
}

export type CalendarSlots = never;

export interface TimePickerState {
  hour: number;
  minute: number;
  is24Hour: boolean;
  period: "am" | "pm";
  /** The values each column offers (hours as the user reads them: 1 to 12, or 0 to 23). */
  hours: number[];
  minutes: number[];
  periodLabels: { am: string; pm: string };
  hourLabel: string;
  minuteLabel: string;
  actions: {
    setHour(hour: number): void;
    setMinute(minute: number): void;
    setPeriod(period: "am" | "pm"): void;
  };
}

export interface TimePickerStyle {
  /** The picker's form: number fields, or scrolling wheels. */
  style: "fields" | "wheel";
  digitSize: string;
  shape: string;
}

export type TimePickerSlots = never;

// --- W4: structure and overlays ----------------------------------------------------------------------------------

export interface CardState {
  appearance: Appearance;
  tone: Tone;
  clickable: boolean;
  disabled: boolean;
  /** A selectable card (a plan, a payment method) is `true` or `false`; otherwise `null`. */
  selected: boolean | null;
}

export interface CardStyle {
  defaultAppearance: Appearance;
  shape: string;
  contentPadding: string;
  borderWidth: string;
  raisedElevation: string;
  selectedBorderWidth: string;
  selectedBorderColor: string;
  showSelectedCheck: boolean;
  solid: ButtonColors;
  soft: ButtonColors;
  raised: ButtonColors;
  outline: ButtonColors;
}

export type CardSlots = "content";

export type ListDividers = "none" | "full" | "inset";

export interface ListItemState {
  headline: string;
  supporting: string | null;
  overline: string | null;
  /** 1 to 3: the row's height class, from how many texts it has. */
  lines: 1 | 2 | 3;
  clickable: boolean;
  selected: boolean;
  disabled: boolean;
}

export interface ListItemStyle {
  minHeightOneLine: string;
  minHeightTwoLines: string;
  minHeightThreeLines: string;
  contentPadding: string;
  leadingGap: string;
  trailingGap: string;
  iconSize: string;
  sectionShape: string;
  dividers: ListDividers;
}

export type ListItemSlots = "leading" | "trailing";

export interface ListSectionState {
  title: string | null;
  footer: string | null;
  level: SurfaceLevel;
}

export interface ListSectionStyle {
  sectionShape: string;
  dividers: ListDividers;
  /** Inset grouped (iOS): the rows sit in a rounded panel with a margin; else edge to edge. */
  inset: boolean;
}

export type ListSectionSlots = "content";

export interface AccordionState {
  title: string;
  subtitle: string | null;
  expanded: boolean;
  disabled: boolean;
  actions: { toggle(): void };
}

export interface AccordionStyle {
  indicator: "chevron" | "plus-minus";
  indicatorPosition: "end" | "start";
  headerMinHeight: string;
  contentPadding: string;
}

export type AccordionSlots = "leading" | "content";

export type SkeletonVariant = "block" | "text" | "circle" | "list-item";
export type SkeletonLeading = "circle" | "square" | "none";

export interface SkeletonState {
  variant: SkeletonVariant;
  shape: ShapeName;
  width: string | null;
  height: string | null;
  lines: number;
  lastLineFraction: number;
  size: string | null;
  leading: SkeletonLeading;
  /** Milliseconds into the cycle now, so every skeleton on the page shimmers in step. */
  phase: number;
}

export interface SkeletonStyle {
  animation: "shimmer" | "pulse" | "none";
  baseColor: string;
  highlightColor: string;
  cycleDuration: string;
  textLineGap: string;
}

export type SkeletonSlots = never;

export type PagedLoad = "none" | "initial" | "refresh" | "more";

export interface PagedListState {
  /** The list's accessible name. */
  label: string | null;
  loading: PagedLoad;
  endReached: boolean;
  errorScope: "first-page" | "next-page" | null;
  errorMessage: string | null;
  isEmpty: boolean;
  /** A pull to refresh is in progress or the state says `refresh`. */
  refreshing: boolean;
  /** How far the pull has gone, 0 to 1. */
  pull: number;
  texts: {
    emptyTitle: string;
    emptyMessage: string;
    errorTitle: string;
    retryLabel: string;
    loadingLabel: string;
    loadingMoreLabel: string;
  };
  actions: { retry(): void };
}

export interface PagedListStyle {
  gap: string;
  indicatorSize: string;
}

export type PagedListSlots = "empty" | "error";

export type Detent = "auto" | "medium" | "large";

export interface BottomSheetState {
  title: string | null;
  dismissible: boolean;
  /** 0 resting to 1 dragged fully down. */
  dragProgress: number;
  detent: Detent;
  actions: { close(): void };
}

export interface BottomSheetStyle {
  shape: string;
  maxWidth: string;
  contentPadding: string;
  scrimAlpha: string;
  handleWidth: string;
  handleHeight: string;
  showHandle: boolean;
  titleAlign: "start" | "center";
  showCloseButton: boolean;
}

export type BottomSheetSlots = "content";

export interface MenuState {
  open: boolean;
}

export interface MenuStyle {
  shape: string;
  minWidth: string;
  maxWidth: string;
  contentPadding: string;
  elevation: string;
  itemHeight: string;
  iconSize: string;
}

export type MenuSlots = "entries";

export interface MenuItemState {
  text: string;
  trailingText: string | null;
  tone: Tone;
  disabled: boolean;
  /** `menuitem`, or a checkable `checkbox` or an exclusive-group `radio`. */
  kind: "menuitem" | "checkbox" | "radio";
  checked: boolean;
}

export interface MenuItemStyle {
  itemHeight: string;
  iconSize: string;
  checkPosition: "leading" | "trailing";
}

export type MenuItemSlots = "leading-icon";

export interface TooltipState {
  text: string;
  visible: boolean;
}

export interface TooltipStyle {
  shape: string;
  padding: string;
  offset: string;
  maxWidth: string;
}

export type TooltipSlots = never;

export interface TopBarState {
  title: string;
  /** How far the content has scrolled under the bar, in px. */
  scrollOffset: number;
  scrolled: boolean;
  visible: boolean;
}

export interface TopBarStyle {
  titleAlign: "start" | "center";
  divider: "never" | "when-scrolled" | "always";
  /** A large title under the bar that collapses into it as the content scrolls (iOS). */
  largeTitle: boolean;
  height: string;
  iconSize: string;
}

export type TopBarSlots = "navigation" | "actions" | "title-content";

// --- W5: feedback, data display and navigation ------------------------------------------------------------------

export type ProgressSize = "small" | "medium" | "large";

export interface ProgressState {
  /** 0 to 1 (clamped), or null while the amount is unknown. */
  progress: number | null;
  tone: Tone;
}

export interface ProgressBarStyle {
  barHeight: string;
  /** The gap between the active part and the rest of the track (Material's look; 0 for a flat bar). */
  trackGap: string;
  shape: string;
  cycleDuration: string;
  showStopIndicator: boolean;
  active: string;
  track: string;
}

export type ProgressBarSlots = never;

export interface ProgressCircleState extends ProgressState {
  size: ProgressSize;
}

export interface ProgressCircleStyle {
  circleStroke: string;
  circleSizeSmall: string;
  circleSizeMedium: string;
  circleSizeLarge: string;
  cycleDuration: string;
  /** `ring` draws an arc on a track; `spokes` a ring of fading spokes (iOS's activity indicator, for the unknown amount). */
  indeterminate: "ring" | "spokes";
  active: string;
  track: string;
}

export type ProgressCircleSlots = never;

export type SnackbarPosition = "bottom" | "top";
export type SnackbarAlignment = "start" | "center" | "end";

export interface SnackbarState {
  message: string;
  action: string | null;
  tone: Tone;
  withDismiss: boolean;
  showToneIcon: boolean;
  position: SnackbarPosition;
  /** The tone's status icon (registered `tone-<tone>` icons, else the built-in ones); null for the default tone. */
  toneIcon: IconArtwork | null;
}

export interface SnackbarStyle {
  shape: string;
  maxWidth: string;
  margin: string;
  minHeight: string;
  padding: string;
  elevation: string;
  position: SnackbarPosition;
  alignment: SnackbarAlignment;
  showDismiss: boolean;
  showToneIcon: boolean;
  textStyle: CamoTextStyle;
  actionStyle: CamoTextStyle;
  iconSize: string;
  /** For the default tone; a status tone takes its family. */
  container: string;
  content: string;
  action: string;
}

/** The action and the dismiss button are nodes core builds (`action`, `dismiss`); the icon is `toneIcon`. */
export type SnackbarSlots = never;

export interface BannerState {
  title: string | null;
  message: string;
  tone: Tone;
  appearance: Appearance;
  dismissible: boolean;
  toneIcon: IconArtwork;
}

/** Colors of one banner appearance: the container, the text and icon, the accent bar and the border. */
export interface BannerColors {
  container: string;
  content: string;
  accent: string;
  border?: string;
}

export interface BannerStyle {
  defaultAppearance: Appearance;
  shape: string;
  padding: string;
  iconSize: string;
  accentBorder: boolean;
  accentWidth: string;
  borderWidth: string;
  titleStyle: CamoTextStyle;
  messageStyle: CamoTextStyle;
  soft: BannerColors;
  solid: BannerColors;
  outline: BannerColors;
}

export type BannerSlots = "icon" | "actions";

export type ChipKind = "action" | "filter" | "input" | "tag";
/** How a chip group lays its chips out: rows that wrap, or one scrolling row. */
export type ChipLayout = "wrap" | "scroll";

export interface ChipState {
  label: string;
  kind: ChipKind;
  selected: boolean;
  appearance: Appearance;
  tone: Tone;
  disabled: boolean;
  /** An input chip, or a removable filter: the remove node is placed after the label. */
  removable: boolean;
}

export interface ChipStyle {
  defaultAppearance: Appearance;
  height: string;
  shape: string;
  paddingInline: string;
  /** The tighter side next to a leading icon, the check or the remove button. */
  iconPadding: string;
  iconGap: string;
  iconSize: string;
  borderWidth: string;
  textStyle: CamoTextStyle;
  touchTarget: string;
  groupSpacing: string;
  showCheckWhenSelected: boolean;
  outline: ButtonColors;
  soft: ButtonColors;
  solid: ButtonColors;
  /** The colors of a selected filter chip. */
  selectedColors: ButtonColors;
}

export type ChipSlots = "leading";

export interface BadgeState {
  /** The count's text ("3", "99+"), or null for a dot. */
  text: string | null;
  tone: Tone;
  appearance: Appearance;
}

export interface BadgeStyle {
  defaultAppearance: Appearance;
  defaultTone: Tone;
  dotSize: string;
  height: string;
  minWidth: string;
  padding: string;
  borderWidth: string;
  /** How far the badge's center sits from the anchor's top-end corner; a negative value moves it outward. */
  offset: string;
  textStyle: CamoTextStyle;
  solid: ButtonColors;
  soft: ButtonColors;
  outline: ButtonColors;
}

export type BadgeSlots = never;

export type AvatarSize = "small" | "medium" | "large";
export type AvatarShape = "circle" | "rounded" | "square";
export type Presence = "online" | "away" | "busy" | "offline";

export interface AvatarState {
  /** One or two letters, or null for the person icon. */
  initials: string | null;
  /** The name's 32-bit hash, which picks the background; null for the icon. */
  colorSeed: number | null;
  size: AvatarSize;
  shape: AvatarShape;
  presence: Presence | null;
  /** The slotted image loaded; until then the initials show. */
  imageLoaded: boolean;
}

export interface AvatarStyle {
  shape: AvatarShape;
  roundedShape: string;
  sizeSmall: string;
  sizeMedium: string;
  sizeLarge: string;
  presenceSize: string;
  ringWidth: string;
  groupOverlap: string;
  textStyleSmall: CamoTextStyle;
  textStyleMedium: CamoTextStyle;
  textStyleLarge: CamoTextStyle;
  /** Backgrounds picked by the name's hash. */
  palette: ButtonColors[];
  /** The person icon and a group's "+N". */
  neutral: ButtonColors;
  presenceColors: Record<Presence, string>;
  ringColor: string;
}

export type AvatarSlots = "image";

export type FabSize = "small" | "regular" | "large";

export interface FabState {
  text: string | null;
  extended: boolean;
  expanded: boolean;
  visible: boolean;
  appearance: Appearance;
  tone: Tone;
  disabled: boolean;
}

export interface FabStyle {
  defaultAppearance: Appearance;
  size: FabSize;
  sizeSmall: string;
  sizeRegular: string;
  sizeLarge: string;
  extendedHeight: string;
  shapeSmall: string;
  shapeRegular: string;
  shapeLarge: string;
  iconSizeRegular: string;
  iconSizeLarge: string;
  iconGap: string;
  extendedPadding: string;
  elevation: string;
  textStyle: CamoTextStyle;
  touchTarget: string;
  soft: ButtonColors;
  solid: ButtonColors;
  raised: ButtonColors;
}

export type FabSlots = "icon";

/** The colors of a tab bar: the surface, the selected and the other tabs, the indicator and the hairline. */
export interface TabsColors {
  container: string;
  selected: string;
  unselected: string;
  /** The line under the selected tab. */
  indicator: string;
  /** The pill behind the selected tab, when the bar is segmented. */
  thumb: string;
  divider: string;
}

export interface TabsStyle {
  defaultAppearance: Appearance;
  /** `underline`: a line under the selected tab. `segmented`: a pill behind it (iOS), for a bar that does not scroll. */
  kind: "underline" | "segmented";
  height: string;
  heightWithIcon: string;
  indicatorHeight: string;
  indicatorWidth: "content" | "tab";
  minTabWidth: string;
  showDivider: boolean;
  iconSize: string;
  iconGap: string;
  tabPadding: string;
  shape: string;
  labelStyle: CamoTextStyle;
  solid: TabsColors;
  ghost: TabsColors;
}

export interface TabsState {
  scrollable: boolean;
  appearance: Appearance;
  count: number;
}

export type TabsSlots = "content";

export interface TabState {
  selected: boolean;
  disabled: boolean;
  label: string | null;
  icon: IconArtwork | null;
  scrollable: boolean;
  appearance: Appearance;
  /** The container draws one sliding indicator; until it has measured (and on the server) the tab draws its own. */
  indicated: boolean;
}

export type TabSlots = "badge" | "content";

export type NavIndicator = "pill" | "line" | "dot" | "fill" | "none";
export type LabelVisibility = "always" | "selected" | "never";
export type NavPlacement = "bar" | "rail" | "drawer";
export type RailAlignment = "top" | "center";

/** How an item looks inside one kind of navigation chrome. */
export interface NavItemLook {
  indicator: NavIndicator;
  indicatorWidth: string;
  indicatorHeight: string;
  indicatorShape: string;
  itemHeight: string;
  iconSize: string;
  iconGap: string;
  labelStyle: CamoTextStyle;
  /** The label's place: below the icon (bar, rail) or beside it (drawer). */
  direction: "column" | "row";
  showLabels: LabelVisibility;
  indicatorColor: string;
  selectedIcon: string;
  selectedLabel: string;
  icon: string;
  label: string;
}

export interface NavItemState {
  selected: boolean;
  disabled: boolean;
  label: string;
  placement: NavPlacement;
  icon: IconArtwork | null;
  selectedIcon: IconArtwork | null;
}

export interface NavItemStyle {
  bar: NavItemLook;
  rail: NavItemLook;
  drawer: NavItemLook;
}

export type NavItemSlots = "icon" | "selected-icon" | "badge";

export interface NavigationBarState {
  visible: boolean;
}

export interface NavigationBarStyle {
  placement: "pinned" | "floating";
  height: string;
  floatingMargin: string;
  floatingShape: string;
  iconSize: string;
  indicatorWidth: string;
  indicatorHeight: string;
  indicatorShape: string;
  container: string;
  divider: string;
  /** The hairline above the bar. */
  hairline: string;
}

export type NavigationBarSlots = "content";

export interface NavigationRailState {
  alignment: RailAlignment;
}

export interface NavigationRailStyle {
  alignment: RailAlignment;
  width: string;
  itemSpacing: string;
  iconSize: string;
  indicatorWidth: string;
  indicatorHeight: string;
  container: string;
  divider: string;
  /** The hairline on the end edge. */
  hairline: string;
}

export type NavigationRailSlots = "header" | "content";

export interface NavigationDrawerState {
  modal: boolean;
}

export interface NavigationDrawerStyle {
  width: string;
  itemHeight: string;
  itemShape: string;
  modalShape: string;
  scrimAlpha: string;
  container: string;
  modalContainer: string;
  divider: string;
  /** The hairline on the end edge of a permanent drawer. */
  hairline: string;
}

export type NavigationDrawerSlots = "header" | "content";

/**
 * The renderer each component needs, by component name. A milestone that builds a component adds its line here, and
 * from then on every complete skin must provide it: `defineSkin` and `satisfies CamoSkin` report the missing one by
 * name. (Kotlin and Dart list all 54 at once; the web grows with its components, W2 to W9.)
 */
export interface SkinComponents {
  readonly text: Renderer<TextState, TextSlots, TextStyle>;
  readonly icon: Renderer<IconState, IconSlots, IconStyle>;
  readonly surface: Renderer<SurfaceState, SurfaceSlots, SurfaceStyle>;
  readonly divider: Renderer<DividerState, DividerSlots, DividerStyle>;
  readonly button: Renderer<ButtonState, ButtonSlots, ButtonStyle>;
  readonly iconButton: Renderer<IconButtonState, IconButtonSlots, IconButtonStyle>;
  readonly textField: Renderer<TextFieldState, TextFieldSlots, TextFieldStyle>;
  readonly searchField: Renderer<SearchFieldState, SearchFieldSlots, SearchFieldStyle>;
  readonly checkbox: Renderer<ToggleState, ToggleSlots, CheckboxStyle>;
  readonly switch: Renderer<ToggleState, ToggleSlots, SwitchStyle>;
  readonly radio: Renderer<ToggleState, ToggleSlots, RadioStyle>;
  readonly segmentedControl: Renderer<
    SegmentedControlState,
    SegmentedControlSlots,
    SegmentedControlStyle
  >;
  readonly segment: Renderer<SegmentState, SegmentSlots, SegmentStyle>;
  readonly slider: Renderer<SliderState, SliderSlots, SliderStyle>;
  readonly stepper: Renderer<StepperState, StepperSlots, StepperStyle>;
  readonly calendar: Renderer<CalendarState, CalendarSlots, CalendarStyle>;
  readonly timePicker: Renderer<TimePickerState, TimePickerSlots, TimePickerStyle>;
  readonly card: Renderer<CardState, CardSlots, CardStyle>;
  readonly listItem: Renderer<ListItemState, ListItemSlots, ListItemStyle>;
  readonly listSection: Renderer<ListSectionState, ListSectionSlots, ListSectionStyle>;
  readonly accordion: Renderer<AccordionState, AccordionSlots, AccordionStyle>;
  readonly skeleton: Renderer<SkeletonState, SkeletonSlots, SkeletonStyle>;
  readonly pagedList: Renderer<PagedListState, PagedListSlots, PagedListStyle>;
  readonly bottomSheet: Renderer<BottomSheetState, BottomSheetSlots, BottomSheetStyle>;
  readonly menu: Renderer<MenuState, MenuSlots, MenuStyle>;
  readonly menuItem: Renderer<MenuItemState, MenuItemSlots, MenuItemStyle>;
  readonly tooltip: Renderer<TooltipState, TooltipSlots, TooltipStyle>;
  readonly topBar: Renderer<TopBarState, TopBarSlots, TopBarStyle>;
  readonly dialog: Renderer<DialogState, DialogSlots, DialogStyle>;
  readonly progressBar: Renderer<ProgressState, ProgressBarSlots, ProgressBarStyle>;
  readonly progressCircle: Renderer<ProgressCircleState, ProgressCircleSlots, ProgressCircleStyle>;
  readonly snackbar: Renderer<SnackbarState, SnackbarSlots, SnackbarStyle>;
  readonly banner: Renderer<BannerState, BannerSlots, BannerStyle>;
  readonly chip: Renderer<ChipState, ChipSlots, ChipStyle>;
  readonly badge: Renderer<BadgeState, BadgeSlots, BadgeStyle>;
  readonly avatar: Renderer<AvatarState, AvatarSlots, AvatarStyle>;
  readonly fab: Renderer<FabState, FabSlots, FabStyle>;
  readonly tabs: Renderer<TabsState, TabsSlots, TabsStyle>;
  readonly tab: Renderer<TabState, TabSlots, TabsStyle>;
  readonly navItem: Renderer<NavItemState, NavItemSlots, NavItemStyle>;
  readonly navigationBar: Renderer<NavigationBarState, NavigationBarSlots, NavigationBarStyle>;
  readonly navigationRail: Renderer<NavigationRailState, NavigationRailSlots, NavigationRailStyle>;
  readonly navigationDrawer: Renderer<
    NavigationDrawerState,
    NavigationDrawerSlots,
    NavigationDrawerStyle
  >;
}

/** A complete skin: a surface treatment, interaction feedback, and one required renderer per component. */
export interface CamoSkin extends SkinParts, SkinComponents {
  /** For debugging and tests: "minimal". */
  readonly name: string;
}

/**
 * A skin being written: every renderer is optional, so it compiles while a skin is half built (a new skin starts as
 * the Minimal one with a few renderers replaced). It cannot be registered or published: `registerSkin` and the
 * `skins` check need a `CamoSkin`, and `defineSkin` turns this into one or fails naming what is missing.
 */
export interface InProgressSkin extends SkinParts, Partial<SkinComponents> {
  readonly name: string;
}

/** What a skin can ask of the environment (ADR-42), measured on the client and defaulted on the server. */
export interface CamoCapabilities {
  backdropBlur: boolean;
  runtimeShaders: boolean;
  windowMaterial: boolean;
  reduceTransparency: boolean;
}

export type WindowSize = "compact" | "medium" | "expanded" | "large";
export type InputKind = "touch" | "pointer";

/** The environment the provider computes (ADR-41, ADR-42). */
export interface CamoEnvironment {
  windowSize: WindowSize;
  input: InputKind;
  platform: string;
  capabilities: CamoCapabilities;
  /** `prefers-reduced-motion: reduce`, kept live. The theme's durations are already zero when it is set. */
  reducedMotion: boolean;
}
