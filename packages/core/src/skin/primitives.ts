// The shared drawing of the W2 components. A skin supplies `defaults(theme)` (its complete component theme, where
// literals belong) and borrows the rest, so Minimal and Cupertino differ only in their numbers and colors. A skin that
// draws differently replaces `render` and `styles` and keeps the contract. Pure: nothing here reads the browser.
import { css, html, nothing } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { camelOf } from "../theme/tokens.ts";
import type { CamoTheme } from "../theme/types.ts";
import { buttonColorsFor } from "./colors.ts";
import type {
  ButtonColors,
  DividerSlots,
  DividerState,
  DividerStyle,
  IconButtonSlots,
  IconButtonState,
  IconButtonStyle,
  IconSlots,
  IconState,
  IconStyle,
  Renderer,
  SurfaceLevel,
  SurfaceSlots,
  SurfaceState,
  SurfaceStyle,
  TextSlots,
  TextState,
  TextStyle,
} from "./types.ts";

type Base<State, Slots extends string, Style> = Pick<
  Renderer<State, Slots, Style>,
  "render" | "styles"
>;

// --- Text ----------------------------------------------------------------------------------------------------------

export const textBase: Base<TextState, TextSlots, TextStyle> = {
  styles: css`
    .t {
      display: block;
      color: var(--t-color);
      font: var(--t-font);
      letter-spacing: var(--t-letter-spacing);
      text-align: var(--t-align);
      min-block-size: var(--t-line-height);
      overflow-wrap: anywhere;
    }
    .t.ellipsis {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: var(--t-lines);
      line-clamp: var(--t-lines);
      overflow: hidden;
    }
    .t.clip {
      max-block-size: calc(var(--t-lines) * var(--t-line-height));
      overflow: hidden;
    }
    slot::slotted(a) {
      color: var(--t-link-color);
      text-decoration: var(--t-link-decoration);
    }
    slot::slotted(a:focus-visible) {
      outline: 2px solid var(--t-link-color);
      outline-offset: 2px;
    }
  `,

  render({ state, slots, theme, style }) {
    const type = theme.typography[camelOf(state.variant) as keyof CamoTheme["typography"]];
    const truncated = state.maxLines > 0;
    const vars = [
      `--t-color: ${state.color ?? "var(--camo-content-color)"}`,
      `--t-font: ${type.weight} ${type.size}/${type.lineHeight} ${type.family}`,
      `--t-letter-spacing: ${type.letterSpacing}`,
      `--t-line-height: ${type.lineHeight}`,
      `--t-align: ${state.textAlign}`,
      `--t-lines: ${state.maxLines}`,
      `--t-link-color: ${style.linkColor}`,
      `--t-link-decoration: ${style.linkDecoration}`,
    ].join("; ");
    const mode = truncated ? state.overflow : "";
    return html`<span class="t ${mode}" part="text" style=${vars}
      >${state.text}<slot name=${slots.content}></slot
    ></span>`;
  },
};

// --- Icon ----------------------------------------------------------------------------------------------------------

export const iconBase: Base<IconState, IconSlots, IconStyle> = {
  styles: css`
    .i {
      display: inline-flex;
      flex: none;
      inline-size: var(--i-size);
      block-size: var(--i-size);
      color: var(--i-color);
    }
    :host(:dir(rtl)) .i.mirror {
      transform: scaleX(-1);
    }
    svg,
    slot::slotted(svg) {
      inline-size: 100%;
      block-size: 100%;
      flex: none;
    }
    .i:not(.original) svg,
    .i:not(.original) slot::slotted(svg) {
      fill: currentColor;
    }
  `,

  render({ state, slots, style }) {
    const vars = [
      `--i-size: ${state.size ?? `var(--camo-icon-size, ${style.defaultSize})`}`,
      `--i-color: ${state.tint ?? "var(--camo-content-color)"}`,
    ].join("; ");
    const classes = ["i", state.autoMirror ? "mirror" : "", state.original ? "original" : ""]
      .filter((c) => c !== "")
      .join(" ");
    const art = state.artwork;
    const drawing =
      art === null
        ? html`<slot name=${slots.content}></slot>`
        : html`<svg viewBox=${art.viewBox} aria-hidden="true" focusable="false">${unsafeSVG(art.svg)}</svg>`;
    return html`<span class=${classes} part="icon" style=${vars}>${drawing}</span>`;
  },
};

// --- Surface -------------------------------------------------------------------------------------------------------

/** The surface role of a level, as a token reference. */
export function surfaceColor(level: SurfaceLevel, theme: CamoTheme): string {
  const c = theme.colors;
  return {
    lowest: c.surfaceContainerLowest,
    low: c.surfaceContainerLow,
    surface: c.surface,
    container: c.surfaceContainer,
    high: c.surfaceContainerHigh,
    highest: c.surfaceContainerHighest,
  }[level];
}

export const surfaceBase: Base<SurfaceState, SurfaceSlots, SurfaceStyle> = {
  styles: css`
    :host {
      display: block;
    }
    .s {
      display: contents;
      color: var(--camo-color-on-surface);
      --camo-content-color: var(--camo-color-on-surface);
    }
  `,

  render({ state, slots, theme, style, skin }) {
    const border = state.border ? `${style.borderWidth} solid ${style.borderColor}` : undefined;
    const content = html`<span class="s" part="surface"><slot name=${slots.content}></slot></span>`;
    return skin.surfaceTreatment.decorate({
      child: content,
      color: surfaceColor(state.level, theme),
      shape: theme.shapes[camelOf(state.shape) as keyof CamoTheme["shapes"]],
      elevation: theme.elevation[state.elevation],
      border,
      block: true,
      theme,
    });
  },
};

// --- Divider -------------------------------------------------------------------------------------------------------

export const dividerBase: Base<DividerState, DividerSlots, DividerStyle> = {
  styles: css`
    .d {
      display: block;
      box-sizing: border-box;
    }
    .d.horizontal {
      inline-size: auto;
      border-block-start: var(--d-thickness) solid var(--d-color);
      margin-inline: var(--d-start) var(--d-end);
    }
    .d.vertical {
      block-size: 100%;
      min-block-size: 1em;
      border-inline-start: var(--d-thickness) solid var(--d-color);
      margin-block: var(--d-start) var(--d-end);
    }
  `,

  render({ state, theme, style }) {
    const none = theme.spacing.none;
    const start = state.inset === "none" ? none : style.startInset;
    const end = state.inset === "middle" ? style.endInset : none;
    const vars = [
      `--d-thickness: ${style.thickness}`,
      `--d-color: ${style.color}`,
      `--d-start: ${start}`,
      `--d-end: ${end}`,
    ].join("; ");
    return html`<span class="d ${state.orientation}" part="divider" style=${vars}></span>`;
  },
};

// --- Icon button ---------------------------------------------------------------------------------------------------

/** The colors of an icon button: Raised falls back to Soft, Link to Ghost, and a toggle that is on has its own look. */
export function iconButtonColorsFor(
  style: IconButtonStyle,
  state: Pick<IconButtonState, "appearance" | "tone" | "checked" | "toggle">,
  theme: CamoTheme,
): ButtonColors {
  const colors = {
    solid: style.solid,
    soft: style.soft,
    raised: style.soft,
    outline: style.outline,
    ghost: style.ghost,
    link: style.ghost,
  };
  if (state.toggle && state.checked) {
    return state.tone === "default"
      ? style.checked
      : buttonColorsFor(colors, "soft", state.tone, theme);
  }
  return buttonColorsFor(colors, state.appearance, state.tone, theme);
}

export const iconButtonBase: Base<IconButtonState, IconButtonSlots, IconButtonStyle> = {
  styles: css`
    .b {
      box-sizing: border-box;
      display: inline-flex;
      position: relative;
      inline-size: var(--b-size);
      block-size: var(--b-size);
      color: var(--b-fg);
      border-radius: var(--b-shape);
    }
    .content {
      display: inline-flex;
      flex: 1 1 auto;
      align-items: center;
      justify-content: center;
      visibility: var(--b-content-visibility);
    }
    slot {
      display: contents;
    }
    ::slotted(*) {
      flex: none;
      inline-size: var(--b-icon-size);
      block-size: var(--b-icon-size);
      color: var(--b-fg);
      --camo-content-color: var(--b-fg);
      --camo-icon-size: var(--b-icon-size);
    }
    /* A touch area of at least the style's target, whatever the visual size. */
    .b::after {
      content: "";
      position: absolute;
      inset: calc((var(--b-size) - var(--b-touch-target)) / 2);
    }
    .spinner {
      position: absolute;
      inset: 0;
      margin: auto;
      inline-size: var(--b-icon-size);
      block-size: var(--b-icon-size);
      box-sizing: border-box;
      border: var(--camo-spacing-xxs) solid currentColor;
      border-inline-end-color: transparent;
      border-radius: 50%;
      animation: camo-spin calc(var(--camo-motion-duration-medium) * 3) linear infinite;
    }
    @keyframes camo-spin {
      to {
        transform: rotate(1turn);
      }
    }
    .tip {
      position: absolute;
      inset-block-start: 100%;
      inset-inline-start: 50%;
      translate: -50% 0;
      margin-block-start: var(--camo-spacing-xs);
      padding: var(--camo-spacing-xs) var(--camo-spacing-s);
      border-radius: var(--camo-shape-small);
      background: var(--camo-color-inverse-surface);
      color: var(--camo-color-inverse-on-surface);
      font: var(--camo-type-label-small-weight) var(--camo-type-label-small-size) /
        var(--camo-type-label-small-line-height) var(--camo-type-label-small-family);
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--camo-motion-duration-short);
      z-index: 1;
    }
    :host(:hover) .tip,
    :host(:focus-visible) .tip {
      opacity: 1;
    }
  `,

  render({ state, slots, theme, style, skin }) {
    const live = iconButtonColorsFor(style, state, theme);
    const disabledContent = `color-mix(in srgb, ${theme.colors.onSurface} ${style.disabledContentAlpha}, transparent)`;
    const colors: ButtonColors = !state.disabled
      ? live
      : {
          container:
            live.container === "transparent"
              ? live.container
              : `color-mix(in srgb, ${theme.colors.onSurface} ${style.disabledContainerAlpha}, transparent)`,
          content: disabledContent,
          ...(live.border !== undefined ? { border: disabledContent } : {}),
        };
    const vars = [
      `--b-size: ${style.containerSize}`,
      `--b-shape: ${style.shape}`,
      `--b-icon-size: ${style.iconSize}`,
      `--b-touch-target: ${style.touchTarget}`,
      `--b-fg: ${colors.content}`,
      `--b-content-visibility: ${state.loading ? "hidden" : "visible"}`,
    ].join("; ");
    const border =
      colors.border === undefined ? undefined : `${style.borderWidth} solid ${colors.border}`;
    const content = html`<span class="content"><slot name=${slots.icon}></slot></span>${
      state.loading ? html`<span class="spinner" part="spinner"></span>` : nothing
    }`;
    return html`<span class="b" part="button" style=${vars}
      >${skin.feedback.wrap({
        child: skin.surfaceTreatment.decorate({
          child: content,
          color: colors.container,
          shape: style.shape,
          elevation: theme.elevation.level0,
          border,
          theme,
        }),
        contentColor: colors.content,
        shape: style.shape,
        theme,
      })}${
        state.tooltip === null
          ? nothing
          : html`<span class="tip" role="tooltip" aria-hidden="true">${state.tooltip}</span>`
      }</span
    >`;
  },
};
