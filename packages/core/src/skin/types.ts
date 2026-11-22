import type { CSSResultGroup, TemplateResult } from "lit";
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
}

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
  readonly dialog: Renderer<DialogState, DialogSlots, DialogStyle>;
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
