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

/**
 * The renderer each component needs, by component name. A milestone that builds a component adds its line here, and
 * from then on every complete skin must provide it: `defineSkin` and `satisfies CamoSkin` report the missing one by
 * name. (Kotlin and Dart list all 54 at once; the web grows with its components, W2 to W9.)
 */
export interface SkinComponents {
  readonly button: Renderer<ButtonState, ButtonSlots, ButtonStyle>;
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
