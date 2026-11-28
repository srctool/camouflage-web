import { themedScrollbar } from "../style.ts";
// The shared drawing of the W4 overlays and the bar: bottom sheet, menu and its items, tooltip, top bar. The overlay
// frame (the native `<dialog>` or `popover`, the scrim, positioning, focus, keys) is core's; the renderer draws what is
// inside it. A skin supplies `defaults(theme)` and spreads the base. Pure.
import { css, html, nothing } from "lit";
import type { CamoTheme } from "../theme/types.ts";
import { cssBlock } from "../style.ts";
import type {
  BottomSheetSlots,
  BottomSheetState,
  BottomSheetStyle,
  MenuItemSlots,
  MenuItemState,
  MenuItemStyle,
  MenuSlots,
  MenuState,
  MenuStyle,
  Renderer,
  TooltipSlots,
  TooltipState,
  TooltipStyle,
  TopBarSlots,
  TopBarState,
  TopBarStyle,
} from "./types.ts";

type Base<State, Slots extends string, Style> = Pick<
  Renderer<State, Slots, Style>,
  "render" | "styles"
>;

const font = (x: CamoTheme["typography"]["bodyLarge"]): string =>
  `${x.weight} ${x.size}/${x.lineHeight} ${x.family}`;
const CHECK = "M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z";

// --- Bottom sheet -----------------------------------------------------------------------------------------------

export const bottomSheetBase: Base<BottomSheetState, BottomSheetSlots, BottomSheetStyle> = {
  styles: [
    css`
    dialog {
      border: 0;
      padding: 0;
      background: transparent;
      color: inherit;
      overflow: visible;
      margin: auto auto 0;
      inset-inline: 0;
      inline-size: 100%;
      max-inline-size: var(--bs-max-width);
      transition: translate var(--camo-motion-duration-medium);
    }
    dialog:focus {
      outline: none;
    }
    .s {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      max-block-size: var(--bs-max-height);
      min-block-size: var(--bs-min-height);
      padding: var(--bs-padding);
      padding-block-start: 0;
    }
    .drag {
      touch-action: none;
      cursor: grab;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .handle {
      inline-size: var(--bs-handle-w);
      block-size: var(--bs-handle-h);
      margin-block: var(--camo-spacing-s);
      border-radius: calc(var(--bs-handle-h) / 2);
      background: color-mix(in srgb, var(--camo-color-on-surface-variant) 40%, transparent);
    }
    .head {
      display: flex;
      /* The head is also a drag region, which is a column: the title and the close button stay in a row. */
      flex-direction: row;
      align-items: center;
      align-self: stretch;
      justify-content: space-between;
      gap: var(--camo-spacing-m);
      padding-block: var(--camo-spacing-s);
      text-align: var(--bs-title-align);
    }
    .title {
      margin: 0;
      flex: 1 1 auto;
      font: var(--bs-title-font);
    }
    .close {
      all: unset;
      box-sizing: border-box;
      inline-size: 48px;
      block-size: 48px;
      display: grid;
      place-items: center;
      cursor: pointer;
      border-radius: 50%;
      position: relative;
    }
    .close::before,
    .close::after {
      content: "";
      position: absolute;
      inline-size: 16px;
      block-size: 2px;
      background: currentColor;
      rotate: 45deg;
    }
    .close::after {
      rotate: -45deg;
    }
    .close:focus-visible {
      outline: 2px solid var(--camo-color-primary);
    }
    .body {
      overflow: auto;
      min-block-size: 0;
    }
    slot {
      display: block;
    }
  `,
    themedScrollbar(".body"),
  ],
  render({ state, slots, theme, style, skin }) {
    const c = theme.colors;
    const heights = { auto: "92dvh", medium: "50dvh", large: "92dvh" } as const;
    const vars = [
      `--bs-max-width: ${style.maxWidth}`,
      `--bs-padding: ${style.contentPadding}`,
      `--bs-handle-w: ${style.handleWidth}`,
      `--bs-handle-h: ${style.handleHeight}`,
      `--bs-title-align: ${style.titleAlign}`,
      `--bs-title-font: ${font(theme.typography.titleLarge)}`,
      `--bs-max-height: ${heights[state.detent]}`,
      `--bs-min-height: ${state.detent === "auto" ? "0px" : heights[state.detent]}`,
    ].join("; ");
    const dragged =
      state.dragProgress > 0 ? `translate: 0 calc(${state.dragProgress} * 100%);` : "";
    const header =
      state.title !== null || (style.showCloseButton && state.dismissible)
        ? html`<div class="head drag">
            ${
              state.title === null
                ? html`<span class="title"></span>`
                : html`<h2 class="title" id="title" part="title">${state.title}</h2>`
            }
            ${
              style.showCloseButton && state.dismissible
                ? html`<button class="close" type="button" aria-label="Close" @click=${() => state.actions.close()}></button>`
                : nothing
            }
          </div>`
        : nothing;
    const body = html`<div class="s" part="sheet" style=${vars}>
      ${
        style.showHandle
          ? html`<div class="drag" aria-hidden="true"><span class="handle" part="handle"></span></div>`
          : nothing
      }
      ${header}
      <div class="body"><slot name=${slots.content}></slot></div>
    </div>`;
    return html`${cssBlock(
      `dialog { ${dragged} }`,
      `dialog::backdrop { background: color-mix(in srgb, ${c.scrim} ${style.scrimAlpha}, transparent); }`,
    )}${skin.surfaceTreatment.decorate({
      child: body,
      color: c.surfaceContainerLow,
      shape: `${style.shape} ${style.shape} 0 0`,
      elevation: theme.elevation.level3,
      block: true,
      theme,
    })}`;
  },
};

// --- Menu -------------------------------------------------------------------------------------------------------

export const menuBase: Base<MenuState, MenuSlots, MenuStyle> = {
  styles: css`
    .menu {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      min-inline-size: var(--m-min);
      max-inline-size: var(--m-max);
      padding-block: var(--m-padding);
      color: var(--camo-color-on-surface);
      --camo-icon-size: var(--m-icon);
    }
    slot {
      display: contents;
    }
  `,
  render({ slots, theme, style, skin }) {
    const vars = [
      `--m-min: ${style.minWidth}`,
      `--m-max: ${style.maxWidth}`,
      `--m-padding: ${style.contentPadding}`,
      `--m-icon: ${style.iconSize}`,
    ].join("; ");
    return skin.surfaceTreatment.decorate({
      child: html`<div class="menu" role="menu" part="menu" style=${vars}><slot name=${slots.entries}></slot></div>`,
      color: theme.colors.surfaceContainer,
      shape: style.shape,
      elevation: style.elevation,
      block: true,
      theme,
    });
  },
};

const SUBMENU = "M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z";

export const menuItemBase: Base<MenuItemState, MenuItemSlots, MenuItemStyle> = {
  styles: css`
    :host {
      display: block;
      outline: none;
      cursor: pointer;
    }
    :host([disabled]) {
      cursor: default;
    }
    .i {
      display: flex;
      align-items: center;
      gap: var(--camo-spacing-m);
      box-sizing: border-box;
      min-block-size: var(--mi-height);
      padding-inline: var(--camo-spacing-l);
      color: var(--mi-fg);
      opacity: var(--mi-opacity);
      font: var(--mi-font);
    }
    :host(:focus) .i,
    :host(:hover:not([disabled])) .i {
      background: color-mix(in srgb, var(--mi-fg) 10%, transparent);
    }
    :host(:focus-visible) .i {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: -2px;
    }
    .text {
      flex: 1 1 auto;
      min-inline-size: 0;
      white-space: nowrap;
    }
    .lead {
      display: contents;
      color: var(--camo-color-on-surface-variant);
      --camo-content-color: var(--camo-color-on-surface-variant);
    }
    .trail {
      color: var(--camo-color-on-surface-variant);
      font: var(--mi-small-font);
    }
    .trail:empty {
      display: none;
    }
    .tick {
      inline-size: var(--mi-icon);
      block-size: var(--mi-icon);
      fill: currentColor;
      flex: none;
      visibility: hidden;
    }
    .tick.on {
      visibility: visible;
    }
    .tick.hide {
      display: none;
    }
    .more {
      inline-size: var(--mi-icon);
      block-size: var(--mi-icon);
      fill: currentColor;
      flex: none;
      color: var(--camo-color-on-surface-variant);
      margin-inline-end: calc(var(--camo-spacing-s) * -1);
    }
    :host(:dir(rtl)) .more {
      scale: -1 1;
    }
    /* The row whose submenu is open stays marked while the pointer is in the child. */
    :host([data-camo-open]) .i {
      background: color-mix(in srgb, var(--mi-fg) 10%, transparent);
    }
    slot {
      display: contents;
    }
  `,
  render({ state, slots, theme, style }) {
    const c = theme.colors;
    const t = theme.typography;
    const fg = state.tone === "error" ? c.error : c.onSurface;
    const vars = [
      `--mi-height: ${style.itemHeight}`,
      `--mi-icon: ${style.iconSize}`,
      `--mi-fg: ${fg}`,
      `--mi-opacity: ${state.disabled ? 0.38 : 1}`,
      `--mi-font: ${font(t.labelLarge)}`,
      `--mi-small-font: ${font(t.labelMedium)}`,
    ].join("; ");
    const checkable = state.kind !== "menuitem";
    const tick = (placement: "leading" | "trailing") =>
      html`<svg
        class="tick ${state.checked ? "on" : ""} ${!checkable || style.checkPosition !== placement ? "hide" : ""}"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d=${CHECK} />
      </svg>`;
    return html`<div class="i" part="item" style=${vars}>
      ${tick("leading")}
      <span class="lead"><slot name=${slots["leading-icon"]}></slot></span>
      <span class="text">${state.text}</span>
      <span class="trail">${state.trailingText}</span>
      ${tick("trailing")}
      ${
        state.hasSubmenu
          ? html`<svg class="more" part="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d=${SUBMENU} /></svg>`
          : nothing
      }
    </div>`;
  },
};

// --- Tooltip ----------------------------------------------------------------------------------------------------

export const tooltipBase: Base<TooltipState, TooltipSlots, TooltipStyle> = {
  styles: css`
    .tip {
      box-sizing: border-box;
      max-inline-size: var(--tt-max);
      padding: var(--tt-padding);
      border-radius: var(--tt-shape);
      background: var(--camo-color-inverse-surface);
      color: var(--camo-color-inverse-on-surface);
      font: var(--tt-font);
      overflow-wrap: anywhere;
    }
  `,
  render({ state, theme, style }) {
    const vars = [
      `--tt-max: ${style.maxWidth}`,
      `--tt-padding: ${style.padding}`,
      `--tt-shape: ${style.shape}`,
      `--tt-font: ${font(theme.typography.bodySmall)}`,
    ].join("; ");
    return html`<div class="tip" part="tooltip" style=${vars}>${state.text}</div>`;
  },
};

// --- Top bar ----------------------------------------------------------------------------------------------------

const LARGE_TITLE = 44;

export const topBarBase: Base<TopBarState, TopBarSlots, TopBarStyle> = {
  styles: css`
    :host {
      display: block;
      position: sticky;
      inset-block-start: 0;
      z-index: 1;
      transition: translate var(--camo-motion-duration-medium);
    }
    :host([hidden]) {
      display: block;
      translate: 0 -100%;
    }
    .bar {
      box-sizing: border-box;
      background: var(--tb-bg);
      color: var(--tb-fg);
      border-block-end: var(--tb-rule) solid var(--camo-color-outline-variant);
    }
    .row {
      display: flex;
      align-items: center;
      gap: var(--camo-spacing-s);
      min-block-size: var(--tb-height);
      padding-inline: var(--camo-spacing-s);
    }
    .nav,
    .actions {
      flex: none;
      display: inline-flex;
      align-items: center;
      gap: var(--camo-spacing-xs);
      --camo-content-color: var(--tb-fg);
      --camo-icon-size: var(--tb-icon);
    }
    .actions {
      color: var(--camo-color-on-surface-variant);
    }
    .title {
      flex: 1 1 auto;
      margin: 0;
      min-inline-size: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font: var(--tb-title-font);
      text-align: var(--tb-align);
      padding-inline: var(--camo-spacing-s);
      opacity: var(--tb-title-opacity);
    }
    .title-content {
      flex: 0 1 auto;
      min-inline-size: 0;
      display: flex;
      align-items: center;
    }
    ::slotted([slot="title-content"]) {
      flex: 1 1 auto;
    }
    .large {
      margin: 0;
      overflow: hidden;
      block-size: var(--tb-large-height);
      padding-inline: var(--camo-spacing-l);
      font: var(--tb-large-font);
      display: flex;
      align-items: flex-end;
      opacity: var(--tb-large-opacity);
    }
    slot {
      display: contents;
    }
    :host([data-camo-title-content]) .title-content {
      flex: 1 1 auto;
    }
    /* A custom title replaces the drawn one on screen; the heading stays for assistive technology. */
    :host([data-camo-title-content]) .title {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
    }
  `,
  render({ state, slots, theme, style }) {
    const c = theme.colors;
    const t = theme.typography;
    const progress = style.largeTitle
      ? Math.min(Math.max(state.scrollOffset / LARGE_TITLE, 0), 1)
      : 1;
    const rule =
      style.divider === "always" || (style.divider === "when-scrolled" && state.scrolled)
        ? "1px"
        : "0px";
    const vars = [
      `--tb-height: ${style.height}`,
      `--tb-icon: ${style.iconSize}`,
      `--tb-bg: ${state.scrolled && style.divider === "never" ? c.surfaceContainer : c.surface}`,
      `--tb-fg: ${c.onSurface}`,
      `--tb-rule: ${rule}`,
      `--tb-align: ${style.titleAlign}`,
      `--tb-title-font: ${font(t.titleLarge)}`,
      `--tb-large-font: ${font(t.headlineMedium)}`,
      `--tb-title-opacity: ${progress}`,
      `--tb-large-height: ${Math.round(LARGE_TITLE * (1 - progress) * 10) / 10}px`,
      `--tb-large-opacity: ${1 - progress}`,
    ].join("; ");
    return html`<header class="bar" part="bar" style=${vars}>
      <div class="row">
        <span class="nav"><slot name=${slots.navigation}></slot></span>
        ${
          style.largeTitle
            ? html`<span class="title" aria-hidden="true">${state.title}</span>`
            : html`<h1 class="title">${state.title}</h1>`
        }
        <span class="title-content"><slot name=${slots["title-content"]}></slot></span>
        <span class="actions"><slot name=${slots.actions}></slot></span>
      </div>
      ${style.largeTitle ? html`<h1 class="large" part="large-title">${state.title}</h1>` : nothing}
    </header>`;
  },
};
