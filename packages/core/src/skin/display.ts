// The shared drawing of the W5 data-display components and the floating action button: chip, badge, avatar, fab. A skin
// supplies `defaults(theme)` and spreads the base. Pure.
import { css, html, nothing } from "lit";
import type { CamoTextStyle, CamoTheme } from "../theme/types.ts";
import { buttonColorsFor, toneFamily } from "./colors.ts";
import type {
  Appearance,
  AvatarSlots,
  AvatarState,
  AvatarStyle,
  BadgeSlots,
  BadgeState,
  BadgeStyle,
  ButtonColors,
  ChipSlots,
  ChipState,
  ChipStyle,
  FabSlots,
  FabState,
  FabStyle,
  Renderer,
  Tone,
} from "./types.ts";

type Base<State, Slots extends string, Style> = Pick<
  Renderer<State, Slots, Style>,
  "render" | "styles"
>;

const font = (x: CamoTextStyle): string =>
  `${x.weight} ${x.size}/${x.lineHeight} ${x.family}; letter-spacing: ${x.letterSpacing}`;
const CHECK = "M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z";
const PERSON =
  "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z";

// --- Chip -------------------------------------------------------------------------------------------------------

/** The colors of a chip: a selected filter's own, else the appearance's (a chip has outline, soft and solid; the rest fall back to outline). */
export function chipColorsFor(
  style: ChipStyle,
  state: Pick<ChipState, "appearance" | "tone" | "selected" | "kind">,
  theme: CamoTheme,
): ButtonColors {
  if (state.selected && state.kind === "filter") {
    if (state.tone === "default") return style.selectedColors;
    const f = toneFamily(theme, state.tone);
    return { container: f.container, content: f.onContainer };
  }
  const appearance: Appearance =
    state.appearance === "solid" || state.appearance === "soft" ? state.appearance : "outline";
  const clear: ButtonColors = { container: "transparent", content: style.outline.content };
  return buttonColorsFor(
    {
      solid: style.solid,
      soft: style.soft,
      raised: style.outline,
      outline: style.outline,
      ghost: clear,
      link: clear,
    },
    appearance,
    state.tone,
    theme,
  );
}

export const chipBase: Base<ChipState, ChipSlots, ChipStyle> = {
  styles: css`
    :host {
      display: inline-flex;
      align-items: center;
      vertical-align: middle;
      max-inline-size: 100%;
      outline: none;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    :host([clickable]),
    :host([selectable]) {
      cursor: pointer;
    }
    :host([disabled]) {
      cursor: default;
    }
    .c {
      position: relative;
      display: inline-flex;
      align-items: stretch;
      box-sizing: border-box;
      min-block-size: var(--c-height);
      max-inline-size: 100%;
      color: var(--c-fg);
      opacity: var(--c-opacity);
      font: var(--c-font);
      border-radius: var(--c-shape);
    }
    .c::after {
      content: "";
      position: absolute;
      inset-block: calc((var(--c-height) - var(--c-touch)) / 2);
      inset-inline: 0;
    }
    .content {
      display: inline-flex;
      align-items: center;
      gap: var(--c-gap);
      padding-inline: var(--c-padding);
      min-inline-size: 0;
    }
    /* Every box between the chip and its label may shrink, or the label never reaches its ellipsis. */
    .camo-feedback,
    .camo-feedback-content,
    .camo-surface {
      min-inline-size: 0;
      max-inline-size: 100%;
    }
    .label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    slot {
      display: contents;
    }
    .check,
    ::slotted([slot="leading"]) {
      flex: none;
      inline-size: var(--c-icon);
      block-size: var(--c-icon);
      margin-inline-start: calc(var(--c-padding-icon) - var(--c-padding));
      --camo-content-color: var(--c-fg);
      --camo-icon-size: var(--c-icon);
    }
    .check {
      fill: currentColor;
    }
    .remove {
      all: unset;
      box-sizing: border-box;
      flex: none;
      display: inline-grid;
      place-items: center;
      inline-size: var(--c-icon);
      block-size: var(--c-icon);
      margin-inline-end: calc(var(--c-padding-icon) - var(--c-padding));
      border-radius: 50%;
      cursor: pointer;
      position: relative;
    }
    .remove::after {
      content: "";
      position: absolute;
      inset: calc((var(--c-icon) - var(--c-touch)) / 2);
    }
    .remove svg {
      inline-size: var(--c-icon);
      block-size: var(--c-icon);
      fill: currentColor;
    }
    .remove:focus-visible {
      outline: 2px solid currentColor;
    }
  `,
  render({ state, slots, theme, style, skin, nodes }) {
    const live = chipColorsFor(style, state, theme);
    const interactive = (state.kind === "action" || state.kind === "filter") && !state.disabled;
    const check = state.kind === "filter" && state.selected && style.showCheckWhenSelected;
    const vars = [
      `--c-height: ${style.height}`,
      `--c-shape: ${style.shape}`,
      `--c-padding: ${style.paddingInline}`,
      `--c-padding-icon: ${style.iconPadding}`,
      `--c-gap: ${style.iconGap}`,
      `--c-icon: ${style.iconSize}`,
      `--c-touch: ${style.touchTarget}`,
      `--c-fg: ${live.content}`,
      `--c-opacity: ${state.disabled ? 0.38 : 1}`,
      `--c-font: ${font(style.textStyle)}`,
    ].join("; ");
    const border =
      live.border === undefined ? undefined : `${style.borderWidth} solid ${live.border}`;
    const content = html`<span class="content"
      >${
        check
          ? html`<svg class="check" viewBox="0 0 24 24" aria-hidden="true"><path d=${CHECK} /></svg>`
          : html`<slot name=${slots.leading}></slot>`
      }<span class="label" part="label">${state.label}</span
      >${state.removable ? (nodes?.["remove"] ?? nothing) : nothing}</span
    >`;
    const surface = skin.surfaceTreatment.decorate({
      child: content,
      color: live.container,
      shape: style.shape,
      elevation: theme.elevation.level0,
      border,
      theme,
    });
    return html`<span class="c" part="chip" style=${vars}
      >${
        interactive
          ? skin.feedback.wrap({
              child: surface,
              contentColor: live.content,
              shape: style.shape,
              theme,
            })
          : surface
      }</span
    >`;
  },
};

// --- Badge ------------------------------------------------------------------------------------------------------

/** The colors of a badge for an appearance and a tone (a badge's tone defaults to the skin's attention family). */
export function badgeColorsFor(
  style: BadgeStyle,
  state: Pick<BadgeState, "appearance" | "tone">,
  theme: CamoTheme,
): ButtonColors {
  const clear: ButtonColors = { container: "transparent", content: style.outline.content };
  return buttonColorsFor(
    {
      solid: style.solid,
      soft: style.soft,
      raised: style.soft,
      outline: style.outline,
      ghost: clear,
      link: clear,
    },
    state.appearance === "soft" || state.appearance === "outline" ? state.appearance : "solid",
    state.tone,
    theme,
  );
}

export const badgeBase: Base<BadgeState, BadgeSlots, BadgeStyle> = {
  styles: css`
    :host {
      display: inline-block;
      vertical-align: middle;
      line-height: 0;
    }
    .badge {
      display: inline-flex;
      align-items: stretch;
      color: var(--bg-fg);
      font: var(--bg-font);
      white-space: nowrap;
    }
    /* The size is the colored shape's, so the pill and the dot are as big as the skin says. */
    .count .camo-surface {
      box-sizing: border-box;
      min-block-size: var(--bg-height);
      min-inline-size: var(--bg-min-width);
      padding-inline: var(--bg-padding);
      line-height: 1;
    }
    .dot .camo-surface {
      box-sizing: border-box;
      inline-size: var(--bg-dot);
      block-size: var(--bg-dot);
    }
  `,
  render({ state, theme, style, skin }) {
    const live = badgeColorsFor(style, state, theme);
    const dot = state.text === null;
    const vars = [
      `--bg-fg: ${live.content}`,
      `--bg-font: ${font(style.textStyle)}`,
      `--bg-height: ${style.height}`,
      `--bg-min-width: ${style.minWidth}`,
      `--bg-padding: ${style.padding}`,
      `--bg-dot: ${style.dotSize}`,
    ].join("; ");
    const border =
      live.border === undefined ? undefined : `${style.borderWidth} solid ${live.border}`;
    return html`<span class="badge ${dot ? "dot" : "count"}" part="badge" style=${vars}
      >${skin.surfaceTreatment.decorate({
        child: dot ? html`` : html`<span class="text">${state.text}</span>`,
        color: live.container,
        shape: theme.shapes.full,
        elevation: theme.elevation.level0,
        border,
        theme,
      })}</span
    >`;
  },
};

// --- Avatar -----------------------------------------------------------------------------------------------------

export const avatarBase: Base<AvatarState, AvatarSlots, AvatarStyle> = {
  styles: css`
    :host {
      display: inline-block;
      vertical-align: middle;
      line-height: 0;
    }
    .a {
      position: relative;
      display: inline-grid;
      place-items: center;
      box-sizing: border-box;
      inline-size: var(--a-size);
      block-size: var(--a-size);
      flex: none;
      color: var(--a-fg);
      background: var(--a-bg);
      border-radius: var(--a-radius);
      font: var(--a-font);
      line-height: 1;
      overflow: hidden;
      user-select: none;
    }
    .initials {
      text-transform: uppercase;
    }
    .person {
      inline-size: 60%;
      block-size: 60%;
      fill: currentColor;
    }
    .img {
      position: absolute;
      inset: 0;
      opacity: 0;
    }
    .img.loaded {
      opacity: 1;
    }
    .img slot {
      display: contents;
    }
    ::slotted(img),
    ::slotted([slot="image"]) {
      inline-size: 100%;
      block-size: 100%;
      object-fit: cover;
      display: block;
    }
    .presence {
      position: absolute;
      inset-inline-end: 0;
      inset-block-end: 0;
      inline-size: var(--a-presence);
      block-size: var(--a-presence);
      box-sizing: border-box;
      border-radius: 50%;
      background: var(--a-presence-color);
      border: var(--a-ring-width) solid var(--a-ring);
    }
    .wrap {
      position: relative;
      display: inline-block;
      line-height: 0;
    }
  `,
  render({ state, slots, theme, style }) {
    const size = { small: style.sizeSmall, medium: style.sizeMedium, large: style.sizeLarge }[
      state.size
    ];
    const text = {
      small: style.textStyleSmall,
      medium: style.textStyleMedium,
      large: style.textStyleLarge,
    }[state.size];
    const colors: ButtonColors =
      state.colorSeed === null || state.initials === null
        ? style.neutral
        : style.palette[state.colorSeed % style.palette.length]!;
    const radius =
      state.shape === "circle"
        ? theme.shapes.full
        : state.shape === "square"
          ? theme.shapes.none
          : style.roundedShape;
    const vars = [
      `--a-size: ${size}`,
      `--a-bg: ${colors.container}`,
      `--a-fg: ${colors.content}`,
      `--a-radius: ${radius}`,
      `--a-font: ${font(text)}`,
      `--a-presence: ${style.presenceSize}`,
      `--a-ring: ${style.ringColor}`,
      `--a-ring-width: ${style.ringWidth}`,
      ...(state.presence === null
        ? []
        : [`--a-presence-color: ${style.presenceColors[state.presence]}`]),
    ].join("; ");
    const face =
      state.initials === null
        ? html`<svg class="person" viewBox="0 0 24 24" aria-hidden="true"><path d=${PERSON} /></svg>`
        : html`<span class="initials" part="initials">${state.initials}</span>`;
    return html`<span class="wrap" style=${vars}
      ><span class="a" part="avatar"
        >${face}<span class="img ${state.imageLoaded ? "loaded" : ""}"
          ><slot name=${slots.image}></slot></span
        ></span
      >${state.presence === null ? nothing : html`<span class="presence" part="presence"></span>`}</span
    >`;
  },
};

// --- Floating action button -------------------------------------------------------------------------------------

/** The colors of a FAB for an appearance and a tone (a FAB has soft, solid and raised; the rest fall back to soft). */
export function fabColorsFor(
  style: FabStyle,
  state: Pick<FabState, "appearance" | "tone">,
  theme: CamoTheme,
): ButtonColors {
  const appearance: Appearance =
    state.appearance === "solid" || state.appearance === "raised" ? state.appearance : "soft";
  const clear: ButtonColors = { container: "transparent", content: style.soft.content };
  return buttonColorsFor(
    {
      solid: style.solid,
      soft: style.soft,
      raised: style.raised,
      outline: style.soft,
      ghost: clear,
      link: clear,
    },
    appearance,
    state.tone as Tone,
    theme,
  );
}

export const fabBase: Base<FabState, FabSlots, FabStyle> = {
  styles: css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      cursor: pointer;
      outline: none;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      min-inline-size: var(--f-touch);
      min-block-size: var(--f-touch);
    }
    :host([disabled]) {
      cursor: default;
    }
    .f {
      position: relative;
      display: inline-flex;
      color: var(--f-fg);
      opacity: var(--f-opacity);
      border-radius: var(--f-shape);
      transition:
        scale var(--camo-motion-duration-medium) var(--camo-motion-easing-emphasized),
        opacity var(--camo-motion-duration-medium);
    }
    .f.hidden {
      scale: 0;
      opacity: 0;
      visibility: hidden;
      transition:
        scale var(--camo-motion-duration-medium) var(--camo-motion-easing-emphasized),
        opacity var(--camo-motion-duration-medium),
        visibility 0s linear var(--camo-motion-duration-medium);
    }
    .inner {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      min-inline-size: var(--f-size);
      block-size: var(--f-height);
      padding-inline: var(--f-padding);
      color: var(--f-fg);
      font: var(--f-font);
      transition:
        padding-inline var(--camo-motion-duration-medium) var(--camo-motion-easing-emphasized),
        block-size var(--camo-motion-duration-medium) var(--camo-motion-easing-emphasized);
      --camo-content-color: var(--f-fg);
      --camo-icon-size: var(--f-icon);
    }
    ::slotted([slot="icon"]) {
      flex: none;
      inline-size: var(--f-icon);
      block-size: var(--f-icon);
    }
    slot {
      display: contents;
    }
    .text {
      display: grid;
      grid-template-columns: 1fr;
      transition: grid-template-columns var(--camo-motion-duration-medium)
        var(--camo-motion-easing-emphasized);
    }
    .text.collapsed {
      grid-template-columns: 0fr;
    }
    .text > span {
      overflow: hidden;
      white-space: nowrap;
      min-inline-size: 0;
      padding-inline-start: var(--f-gap);
    }
    .text.collapsed > span {
      padding-inline-start: 0;
    }
    @media (prefers-reduced-motion: reduce) {
      .f,
      .f.hidden,
      .text {
        transition: none;
      }
    }
  `,
  render({ state, slots, theme, style, skin }) {
    const live = fabColorsFor(style, state, theme);
    const size = { small: style.sizeSmall, regular: style.sizeRegular, large: style.sizeLarge }[
      style.size
    ];
    const shape = {
      small: style.shapeSmall,
      regular: style.shapeRegular,
      large: style.shapeLarge,
    }[style.size];
    const icon = style.size === "large" ? style.iconSizeLarge : style.iconSizeRegular;
    // A plain FAB, and an extended one folded to its icon, are the skin's regular size; only an unfolded one is a wide pill.
    const folded = !state.extended || !state.expanded;
    const vars = [
      `--f-size: ${size}`,
      `--f-height: ${folded ? size : style.extendedHeight}`,
      `--f-shape: ${shape}`,
      `--f-padding: ${folded ? "0px" : style.extendedPadding}`,
      `--f-icon: ${icon}`,
      `--f-gap: ${style.iconGap}`,
      `--f-fg: ${live.content}`,
      `--f-opacity: ${state.disabled ? 0.38 : 1}`,
      `--f-font: ${font(style.textStyle)}`,
      `--f-touch: ${style.touchTarget}`,
    ].join("; ");
    const inner = html`<span class="inner"
      ><slot name=${slots.icon}></slot
      >${
        state.extended
          ? html`<span class="text ${state.expanded ? "" : "collapsed"}"
              ><span part="label">${state.text}</span></span
            >`
          : nothing
      }</span
    >`;
    const body = skin.surfaceTreatment.decorate({
      child: inner,
      color: live.container,
      shape,
      elevation: style.elevation,
      border: live.border === undefined ? undefined : `1px solid ${live.border}`,
      theme,
    });
    return html`<span class="f ${state.visible ? "" : "hidden"}" part="fab" style=${vars}
      >${
        state.disabled
          ? body
          : skin.feedback.wrap({ child: body, contentColor: live.content, shape, theme })
      }</span
    >`;
  },
};
