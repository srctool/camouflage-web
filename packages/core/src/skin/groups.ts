// The shared drawing of the W6 button group and split button. A skin supplies `defaults(theme)` and spreads the base. Pure:
// the buttons carry `data-part` attributes and the element listens (delegation), so no handler is a renderer's.
import { css, html, nothing } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import type { CamoTextStyle } from "../theme/types.ts";
import { buttonColorsFor } from "./colors.ts";
import type {
  ButtonColors,
  ButtonGroupSlots,
  ButtonGroupState,
  ButtonGroupStyle,
  GroupButtonSlots,
  GroupButtonState,
  Renderer,
  SplitButtonSlots,
  SplitButtonState,
  SplitButtonStyle,
} from "./types.ts";

type Base<State, Slots extends string, Style> = Pick<
  Renderer<State, Slots, Style>,
  "render" | "styles"
>;

const font = (x: CamoTextStyle): string =>
  `${x.weight} ${x.size}/${x.lineHeight} ${x.family}; letter-spacing: ${x.letterSpacing}`;

// --- Button group -----------------------------------------------------------------------------------------------

export const buttonGroupBase: Base<ButtonGroupState, ButtonGroupSlots, ButtonGroupStyle> = {
  styles: css`
    :host {
      display: inline-block;
      vertical-align: middle;
    }
    .group {
      display: inline-flex;
      align-items: stretch;
      gap: var(--bg-gap);
    }
    .connected ::slotted(*:not(:first-child)) {
      margin-inline-start: calc(var(--bg-border) * -1);
    }
    slot {
      display: contents;
    }
  `,
  render({ state, slots, style }) {
    // The corners come down to the buttons through inherited properties, so a server-rendered group (whose buttons cannot ask
    // their siblings) is already right: the first and last button keep the outer corners, the rest take the joint's.
    const vars = [
      `--bg-gap: ${state.connected ? "0px" : style.spacing}`,
      `--bg-border: ${style.borderWidth}`,
      `--gbg-outer: ${style.shape}`,
      `--gbg-inner: ${state.connected ? style.innerShape : style.shape}`,
    ].join("; ");
    return html`<div class="group ${state.connected ? "connected" : "spaced"}" part="group" style=${vars}
      ><slot name=${slots.content}></slot
    ></div>`;
  },
};

/** The colors of a group button: a toggle that is on takes the style's selected look (its tone's strong fill otherwise). */
export function groupColorsFor(
  style: ButtonGroupStyle,
  state: Pick<GroupButtonState, "appearance" | "tone" | "toggle" | "selected">,
  theme: Parameters<typeof buttonColorsFor>[3],
): ButtonColors {
  if (state.toggle && state.selected) {
    if (state.tone === "default") return style.selected;
    return buttonColorsFor(style, "solid", state.tone, theme);
  }
  return buttonColorsFor(style, state.appearance, state.tone, theme);
}

export const groupButtonBase: Base<GroupButtonState, GroupButtonSlots, ButtonGroupStyle> = {
  styles: css`
    :host {
      display: inline-flex;
      outline: none;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    :host([disabled]) {
      cursor: default;
    }
    .b {
      position: relative;
      display: inline-flex;
      flex: 1 1 auto;
      box-sizing: border-box;
      min-block-size: var(--gb-height);
      color: var(--gb-fg);
      opacity: var(--gb-opacity);
      font: var(--gb-font);
      border-radius: var(--gbg-inner, var(--gb-inner));
    }
    :host(:first-child) .b,
    :host(:only-child) .b {
      border-start-start-radius: var(--gbg-outer, var(--gb-outer));
      border-end-start-radius: var(--gbg-outer, var(--gb-outer));
    }
    :host(:last-child) .b,
    :host(:only-child) .b {
      border-start-end-radius: var(--gbg-outer, var(--gb-outer));
      border-end-end-radius: var(--gbg-outer, var(--gb-outer));
    }
    /* The surface paints its own corners; the group's are per corner, so they win. */
    .b .camo-surface {
      border-radius: inherit !important;
    }
    .b .camo-feedback,
    .b .camo-feedback-content {
      border-radius: inherit;
    }
    .b::after {
      content: "";
      position: absolute;
      inset-block: calc((var(--gb-height) - 48px) / 2);
      inset-inline: 0;
    }
    .content {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--gb-gap);
      padding-inline: var(--camo-spacing-l);
      min-inline-size: 0;
    }
    .icon-only .content {
      padding-inline: var(--camo-spacing-m);
    }
    .label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    slot {
      display: contents;
    }
    .glyph {
      display: inline-flex;
      inline-size: var(--gb-icon);
      block-size: var(--gb-icon);
      fill: currentColor;
      flex: none;
    }
    .glyph svg {
      inline-size: 100%;
      block-size: 100%;
    }
    ::slotted([slot="icon"]) {
      flex: none;
      inline-size: var(--gb-icon);
      block-size: var(--gb-icon);
      --camo-content-color: var(--gb-fg);
      --camo-icon-size: var(--gb-icon);
    }
  `,
  render({ state, slots, theme, style, skin }) {
    const live = groupColorsFor(style, state, theme);
    const outer = style.shape;
    const vars = [
      `--gb-height: ${style.height}`,
      `--gb-gap: ${style.iconGap}`,
      `--gb-icon: ${style.iconSize}`,
      `--gb-fg: ${live.content}`,
      `--gb-opacity: ${state.disabled ? 0.38 : 1}`,
      `--gb-font: ${font(style.textStyle)}`,
      `--gb-outer: ${style.shape}`,
      `--gb-inner: ${state.connected ? style.innerShape : style.shape}`,
    ].join("; ");
    const border =
      live.border === undefined ? undefined : `${style.borderWidth} solid ${live.border}`;
    const iconOnly = state.text === null || state.text === "";
    const body = skin.surfaceTreatment.decorate({
      child: html`<span class="content"
        ><slot name=${slots.icon}>${
          state.icon === null
            ? nothing
            : html`<span class="glyph"
                ><svg viewBox=${state.icon.viewBox} aria-hidden="true">${unsafeSVG(state.icon.svg)}</svg></span
              >`
        }</slot
        >${iconOnly ? nothing : html`<span class="label" part="label">${state.text}</span>`}</span
      >`,
      color: live.container,
      shape: outer,
      elevation: theme.elevation.level0,
      border,
      theme,
    });
    return html`<span class="b ${iconOnly ? "icon-only" : ""}" part="button" style=${vars}
      >${
        state.disabled
          ? body
          : skin.feedback.wrap({ child: body, contentColor: live.content, shape: outer, theme })
      }</span
    >`;
  },
};

// --- Split button -----------------------------------------------------------------------------------------------

const chevron = html`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
</svg>`;

export const splitButtonBase: Base<SplitButtonState, SplitButtonSlots, SplitButtonStyle> = {
  styles: css`
    :host {
      display: inline-block;
      vertical-align: middle;
    }
    .split {
      display: inline-flex;
      align-items: stretch;
      gap: var(--sp-gap);
      block-size: var(--sp-height);
      color: var(--sp-fg);
      opacity: var(--sp-opacity);
      font: var(--sp-font);
    }
    .part {
      all: unset;
      position: relative;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--sp-fg);
      background: var(--sp-bg);
      border: var(--sp-border);
      min-inline-size: 0;
    }
    .part:focus-visible {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: 2px;
    }
    .part:disabled {
      cursor: default;
    }
    .main {
      flex: 1 1 auto;
      gap: var(--sp-icon-gap);
      padding-inline: var(--sp-padding);
      border-start-start-radius: var(--sp-outer);
      border-end-start-radius: var(--sp-outer);
      border-start-end-radius: var(--sp-inner);
      border-end-end-radius: var(--sp-inner);
    }
    .arrow {
      flex: none;
      inline-size: var(--sp-arrow);
      border-start-start-radius: var(--sp-inner);
      border-end-start-radius: var(--sp-inner);
      border-start-end-radius: var(--sp-outer);
      border-end-end-radius: var(--sp-outer);
    }
    .menu-only .main {
      border-radius: var(--sp-outer);
    }
    .menu-only .arrow {
      display: none;
    }
    /* With no gap the parts meet on a line. */
    .split.joined .arrow {
      border-inline-start: 1px solid color-mix(in srgb, var(--sp-fg) 40%, transparent);
    }
    .label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .chevron {
      inline-size: var(--sp-icon);
      block-size: var(--sp-icon);
      fill: currentColor;
      transition: rotate var(--camo-motion-duration-short);
    }
    .expanded .chevron {
      rotate: 180deg;
    }
    slot {
      display: contents;
    }
    ::slotted([slot="prefix-icon"]) {
      flex: none;
      inline-size: var(--sp-icon);
      block-size: var(--sp-icon);
      --camo-content-color: var(--sp-fg);
      --camo-icon-size: var(--sp-icon);
    }
    .part::after {
      content: "";
      position: absolute;
      inset-block: calc((var(--sp-height) - 48px) / 2);
      inset-inline: 0;
    }
  `,
  render({ state, slots, theme, style }) {
    const live = buttonColorsFor(style, state.appearance, state.tone, theme);
    const joined = style.gap === "0px";
    const vars = [
      `--sp-height: ${style.height}`,
      `--sp-gap: ${style.gap}`,
      `--sp-fg: ${live.content}`,
      `--sp-bg: ${live.container}`,
      `--sp-border: ${live.border === undefined ? "0" : `1px solid ${live.border}`}`,
      `--sp-opacity: ${state.disabled ? 0.38 : 1}`,
      `--sp-font: ${font(style.textStyle)}`,
      `--sp-outer: ${style.shape}`,
      `--sp-inner: ${style.innerShape}`,
      `--sp-arrow: ${style.arrowWidth}`,
      `--sp-padding: ${style.padding}`,
      `--sp-icon: ${style.iconSize}`,
      `--sp-icon-gap: ${style.iconGap}`,
    ].join("; ");
    const arrow = html`<button
      class="part arrow"
      type="button"
      data-part="arrow"
      aria-label=${state.menuLabel}
      aria-haspopup="menu"
      aria-expanded=${state.expanded ? "true" : "false"}
      ?disabled=${state.disabled}
    >
      <span class="chevron">${chevron}</span>
    </button>`;
    return html`<div
      class="split ${joined ? "joined" : ""} ${state.hasAction ? "" : "menu-only"} ${
        state.expanded ? "expanded" : ""
      }"
      part="split"
      style=${vars}
    >
      <button
        class="part main"
        type="button"
        data-part="main"
        ?disabled=${state.disabled}
        aria-haspopup=${state.hasAction ? nothing : "menu"}
        aria-expanded=${state.hasAction ? nothing : state.expanded ? "true" : "false"}
      >
        <slot name=${slots["prefix-icon"]}></slot><span class="label" part="label">${state.text}</span>${
          state.hasAction ? nothing : html`<span class="chevron">${chevron}</span>`
        }
      </button>
      ${state.hasAction ? arrow : nothing}
    </div>`;
  },
};
