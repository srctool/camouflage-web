// The shared drawing of the W5 navigation components: tabs and a tab, a navigation item, and the bar, rail and drawer
// that hold items. A skin supplies `defaults(theme)` and spreads the base. Pure.
import { css, html, nothing } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { cssBlock } from "../style.ts";
import type { CamoTextStyle } from "../theme/types.ts";
import type {
  IconArtwork,
  NavItemLook,
  NavItemSlots,
  NavItemState,
  NavItemStyle,
  NavigationBarSlots,
  NavigationBarState,
  NavigationBarStyle,
  NavigationDrawerSlots,
  NavigationDrawerState,
  NavigationDrawerStyle,
  NavigationRailSlots,
  NavigationRailState,
  NavigationRailStyle,
  Renderer,
  TabSlots,
  TabState,
  TabsColors,
  TabsSlots,
  TabsState,
  TabsStyle,
} from "./types.ts";

type Base<State, Slots extends string, Style> = Pick<
  Renderer<State, Slots, Style>,
  "render" | "styles"
>;

const font = (x: CamoTextStyle): string =>
  `${x.weight} ${x.size}/${x.lineHeight} ${x.family}; letter-spacing: ${x.letterSpacing}`;

const art = (a: IconArtwork | null): ReturnType<typeof html> | typeof nothing =>
  a === null
    ? nothing
    : html`<svg viewBox=${a.viewBox} aria-hidden="true" focusable="false">${unsafeSVG(a.svg)}</svg>`;

// --- Tabs -------------------------------------------------------------------------------------------------------

/** The colors of a tab bar for an appearance: `solid` is the prominent bar (top-level views), anything else the quiet one. */
export function tabsColorsFor(
  style: Pick<TabsStyle, "solid" | "ghost">,
  appearance: TabsState["appearance"],
): TabsColors {
  return appearance === "ghost" ? style.ghost : style.solid;
}

/** Whether a bar draws a pill behind the selected tab: the skin asks for it, and a bar that scrolls never does. */
export function isSegmented(style: Pick<TabsStyle, "kind">, scrollable: boolean): boolean {
  return style.kind === "segmented" && !scrollable;
}

export const tabsBase: Base<TabsState, TabsSlots, TabsStyle> = {
  styles: css`
    :host {
      display: block;
    }
    .tabs {
      position: relative;
      box-sizing: border-box;
      background: var(--t-container);
      border-radius: var(--t-radius);
      padding: var(--t-pad);
    }
    .row {
      position: relative;
      display: flex;
      align-items: stretch;
      overflow-x: auto;
      scrollbar-width: none;
      border-radius: var(--t-radius);
    }
    .row::-webkit-scrollbar {
      display: none;
    }
    ::slotted(*) {
      flex: 1 1 0;
      min-inline-size: 0;
      position: relative;
      z-index: 1;
    }
    .scroll ::slotted(*) {
      flex: none;
      min-inline-size: var(--t-min-tab);
    }
    .indicator {
      position: absolute;
      inset-inline-start: var(--camo-tabs-x, 0px);
      inline-size: var(--camo-tabs-w, 0px);
      opacity: var(--camo-tabs-ready, 0);
      pointer-events: none;
      transition:
        inset-inline-start var(--camo-motion-duration-medium) var(--camo-motion-easing-emphasized),
        inline-size var(--camo-motion-duration-medium) var(--camo-motion-easing-emphasized);
    }
    .underline .indicator {
      /* Above the hairline, so the line is as thick as the one a server-rendered tab draws for itself. */
      z-index: 2;
      inset-block-end: 0;
      block-size: var(--t-ind-height);
      background: var(--t-indicator);
      border-radius: var(--t-ind-height) var(--t-ind-height) 0 0;
    }
    .segmented .indicator {
      inset-block: 0;
      background: var(--t-indicator);
      border-radius: var(--t-radius);
      z-index: 0;
    }
    .divider {
      position: absolute;
      inset-inline: 0;
      inset-block-end: 0;
      block-size: 1px;
      background: var(--t-divider);
      pointer-events: none;
    }
    @media (prefers-reduced-motion: reduce) {
      .indicator {
        transition: none;
      }
    }
  `,
  render({ state, slots, style }) {
    const colors = tabsColorsFor(style, state.appearance);
    const segmented = isSegmented(style, state.scrollable);
    const vars = [
      `--t-container: ${segmented ? colors.container : "transparent"}`,
      `--t-radius: ${segmented ? style.shape : "0px"}`,
      `--t-pad: ${segmented ? "2px" : "0px"}`,
      `--t-min-tab: ${style.minTabWidth}`,
      `--t-ind-height: ${style.indicatorHeight}`,
      `--t-indicator: ${segmented ? colors.thumb : colors.indicator}`,
      `--t-divider: ${colors.divider}`,
    ].join("; ");
    return html`<div
      class="tabs ${segmented ? "segmented" : "underline"}"
      part="tabs"
      style=${vars}
    >
      <div class="row ${state.scrollable ? "scroll" : ""}" part="row">
        <slot name=${slots.content}></slot>
        <span class="indicator" part="indicator"></span>
      </div>
      ${style.showDivider && !segmented ? html`<span class="divider" part="divider"></span>` : nothing}
    </div>`;
  },
};

export const tabBase: Base<TabState, TabSlots, TabsStyle> = {
  styles: css`
    :host {
      display: block;
      outline: none;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    :host([disabled]) {
      cursor: default;
    }
    .t {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      gap: var(--tb-gap);
      min-block-size: var(--tb-height);
      padding-inline: var(--tb-pad);
      color: var(--tb-fg);
      opacity: var(--tb-opacity);
      font: var(--tb-font);
      border-radius: var(--tb-radius);
    }
    .content {
      display: inline-flex;
      align-items: center;
      gap: var(--tb-gap);
      position: relative;
    }
    .label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .icon {
      inline-size: var(--tb-icon);
      block-size: var(--tb-icon);
      fill: currentColor;
      flex: none;
    }
    .icon svg {
      inline-size: 100%;
      block-size: 100%;
    }
    slot {
      display: contents;
    }
    .self {
      position: absolute;
      pointer-events: none;
    }
    .self.line {
      inset-block-end: 0;
      inset-inline: var(--tb-self-inset);
      block-size: var(--tb-ind-height);
      background: var(--tb-indicator);
      border-radius: var(--tb-ind-height) var(--tb-ind-height) 0 0;
    }
    .self.pill {
      inset: 0;
      background: var(--tb-indicator);
      border-radius: var(--tb-radius);
      z-index: -1;
    }
    .touch {
      position: absolute;
      inset-inline: 0;
      inset-block: calc((100% - var(--tb-touch)) / 2);
    }
  `,
  render({ state, slots, theme, style, skin }) {
    const colors = tabsColorsFor(style, state.appearance);
    const segmented = isSegmented(style, state.scrollable);
    const withIcon = state.icon !== null && state.label !== null;
    const vars = [
      `--tb-height: ${withIcon && !segmented ? style.heightWithIcon : style.height}`,
      `--tb-pad: ${style.tabPadding}`,
      `--tb-gap: ${style.iconGap}`,
      `--tb-icon: ${style.iconSize}`,
      `--tb-fg: ${state.selected ? colors.selected : colors.unselected}`,
      `--tb-opacity: ${state.disabled ? 0.38 : 1}`,
      `--tb-font: ${font(style.labelStyle)}`,
      `--tb-radius: ${segmented ? style.shape : "0px"}`,
      `--tb-ind-height: ${style.indicatorHeight}`,
      `--tb-indicator: ${segmented ? colors.thumb : colors.indicator}`,
      `--tb-touch: 48px`,
      `--tb-self-inset: ${style.indicatorWidth === "content" ? style.tabPadding : "0px"}`,
      `--camo-content-color: ${state.selected ? colors.selected : colors.unselected}`,
      `--camo-icon-size: ${style.iconSize}`,
    ].join("; ");
    const own = state.selected && !state.indicated;
    return html`<span class="t" part="tab" style=${vars}
      >${
        own
          ? html`<span class="self ${segmented ? "pill" : "line"}" part="indicator"></span>`
          : nothing
      }${skin.feedback.wrap({
        child: html`<span class="content"
          >${state.icon === null ? nothing : html`<span class="icon">${art(state.icon)}</span>`}${
            state.label === null
              ? nothing
              : html`<span class="label" part="label">${state.label}</span>`
          }<slot name=${slots.content}></slot
          ><slot name=${slots.badge}></slot
        ></span>`,
        contentColor: state.selected ? colors.selected : colors.unselected,
        shape: segmented ? style.shape : theme.shapes.none,
        theme,
      })}<span class="touch"></span
    ></span>`;
  },
};

// --- Navigation items and chrome --------------------------------------------------------------------------------

const lookOf = (style: NavItemStyle, placement: NavItemState["placement"]): NavItemLook =>
  style[placement];

export const navItemBase: Base<NavItemState, NavItemSlots, NavItemStyle> = {
  styles: css`
    :host {
      display: block;
      outline: none;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      min-inline-size: 0;
    }
    :host([disabled]) {
      cursor: default;
    }
    .i {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      min-block-size: var(--n-height);
      gap: var(--n-gap);
      color: var(--n-fg);
      opacity: var(--n-opacity);
      font: var(--n-font);
      --camo-content-color: var(--n-fg);
      --camo-icon-size: var(--n-icon);
    }
    .i.column {
      flex-direction: column;
    }
    .i.row {
      flex-direction: row;
      justify-content: flex-start;
      padding-inline: var(--camo-spacing-l);
      border-radius: var(--n-shape);
    }
    .box {
      position: relative;
      display: inline-grid;
      place-items: center;
      inline-size: var(--n-ind-width);
      block-size: var(--n-ind-height);
      border-radius: var(--n-shape);
      transition: background-color var(--camo-motion-duration-medium);
    }
    .row .box {
      inline-size: var(--n-icon);
      block-size: var(--n-icon);
      background: transparent;
    }
    .pill .box {
      background: var(--n-ind);
    }
    .pill.row {
      background: var(--n-ind);
    }
    .fill {
      background: var(--n-ind);
      border-radius: var(--n-shape);
    }
    .line.column::before {
      content: "";
      position: absolute;
      inset-block-start: 0;
      inset-inline: calc(50% - var(--n-ind-width) / 2);
      block-size: var(--n-ind-height);
      background: var(--n-ind);
      border-radius: var(--n-shape);
    }
    .line.row::before {
      content: "";
      position: absolute;
      inset-inline-start: 0;
      inset-block: 25%;
      inline-size: var(--n-ind-height);
      background: var(--n-ind);
      border-radius: var(--n-shape);
    }
    .dot::after {
      content: "";
      position: absolute;
      inset-block-end: var(--camo-spacing-xxs);
      inset-inline-start: calc(50% - var(--n-ind-height) / 2);
      inline-size: var(--n-ind-height);
      block-size: var(--n-ind-height);
      border-radius: 50%;
      background: var(--n-ind);
    }
    .icon {
      display: inline-flex;
      inline-size: var(--n-icon);
      block-size: var(--n-icon);
      fill: currentColor;
      flex: none;
    }
    .icon svg {
      inline-size: 100%;
      block-size: 100%;
    }
    slot {
      display: contents;
    }
    ::slotted([slot="icon"]),
    ::slotted([slot="selected-icon"]) {
      inline-size: var(--n-icon);
      block-size: var(--n-icon);
      flex: none;
    }
    .badge {
      position: absolute;
      inset-block-start: calc(var(--camo-spacing-xs) * -1);
      inset-inline-start: calc(50% + var(--n-icon) / 4);
    }
    .row .badge {
      inset-inline-start: auto;
      inset-inline-end: calc(var(--camo-spacing-l) * -1);
      inset-block-start: 50%;
      translate: 0 -50%;
    }
    .label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-inline-size: 100%;
    }
    .touch {
      position: absolute;
      inset: 0;
    }
  `,
  render({ state, slots, style, skin, theme }) {
    const look = lookOf(style, state.placement);
    const column = look.direction === "column";
    const showLabel =
      look.showLabels === "always" || (look.showLabels === "selected" && state.selected);
    const fg = state.selected ? look.selectedLabel : look.label;
    const iconFg = state.selected ? look.selectedIcon : look.icon;
    const vars = [
      `--n-height: ${look.itemHeight}`,
      `--n-gap: ${look.iconGap}`,
      `--n-fg: ${fg}`,
      `--n-icon-fg: ${iconFg}`,
      `--n-opacity: ${state.disabled ? 0.38 : 1}`,
      `--n-font: ${font(look.labelStyle)}`,
      `--n-icon: ${look.iconSize}`,
      `--n-ind: ${state.selected ? look.indicatorColor : "transparent"}`,
      `--n-ind-width: ${look.indicatorWidth}`,
      `--n-ind-height: ${look.indicatorHeight}`,
      `--n-shape: ${look.indicatorShape}`,
    ].join("; ");
    const indicator = look.indicator === "none" ? "none" : look.indicator;
    // With a pill or a fill the icon is not tinted by the label color: it follows the indicator's contrast.
    const icon = state.selected
      ? html`<slot name=${slots["selected-icon"]}
          ><slot name=${slots.icon}
            ><span class="icon">${art(state.selectedIcon ?? state.icon)}</span></slot
          ></slot
        >`
      : html`<slot name=${slots.icon}><span class="icon">${art(state.icon)}</span></slot>`;
    const body = html`<span class="i ${column ? "column" : "row"} ${indicator}" part="item" style=${vars}
      ><span class="box" style="color: ${iconFg}">${icon}<span class="badge"
          ><slot name=${slots.badge}></slot></span
      ></span
      >${showLabel ? html`<span class="label" part="label">${state.label}</span>` : nothing}<span class="touch"></span
    ></span>`;
    return state.disabled
      ? body
      : skin.feedback.wrap({
          child: body,
          contentColor: fg,
          shape: look.indicatorShape,
          theme,
        });
  },
};

/** The container of every navigation chrome: a surface, the system insets, and the scrolling or flexing items. */
export const navigationBarBase: Base<NavigationBarState, NavigationBarSlots, NavigationBarStyle> = {
  styles: css`
    :host {
      display: block;
      transition:
        translate var(--camo-motion-duration-medium) var(--camo-motion-easing-emphasized),
        visibility 0s;
    }
    :host([hidden]) {
      display: block;
      translate: 0 100%;
      visibility: hidden;
      transition:
        translate var(--camo-motion-duration-medium) var(--camo-motion-easing-emphasized),
        visibility 0s linear var(--camo-motion-duration-medium);
    }
    .bar {
      display: flex;
      align-items: stretch;
      box-sizing: border-box;
      border-block-start: var(--nb-hairline) solid var(--nb-divider);
      min-block-size: var(--nb-height);
      padding-block-end: env(safe-area-inset-bottom, 0px);
      color: var(--camo-color-on-surface);
    }
    .floating {
      margin: var(--nb-margin);
      border-block-start: 0;
    }
    slot {
      display: contents;
    }
    ::slotted(*) {
      flex: 1 1 0;
      min-inline-size: 0;
    }
    @media (prefers-reduced-motion: reduce) {
      :host,
      :host([hidden]) {
        transition: none;
      }
    }
  `,
  render({ slots, theme, style, skin }) {
    const floating = style.placement === "floating";
    const vars = `--nb-height: ${style.height}; --nb-margin: ${style.floatingMargin}; --nb-divider: ${style.divider}; --nb-hairline: ${style.hairline}`;
    return skin.surfaceTreatment.decorate({
      child: html`<div class="bar ${floating ? "floating" : ""}" part="bar" style=${vars}
        ><slot name=${slots.content}></slot
      ></div>`,
      color: style.container,
      shape: floating ? style.floatingShape : theme.shapes.none,
      elevation: floating ? theme.elevation.level3 : theme.elevation.level0,
      block: true,
      theme,
    });
  },
};

export const navigationRailBase: Base<
  NavigationRailState,
  NavigationRailSlots,
  NavigationRailStyle
> = {
  styles: css`
    :host {
      display: block;
      block-size: 100%;
    }
    .rail {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      block-size: 100%;
      padding-block: var(--camo-spacing-l);
      padding-inline-start: env(safe-area-inset-left, 0px);
      color: var(--camo-color-on-surface);
      border-inline-end: var(--nr-hairline) solid var(--nr-divider);
    }
    .header {
      display: flex;
      justify-content: center;
      padding-block-end: var(--camo-spacing-l);
    }
    .items {
      display: flex;
      flex-direction: column;
      gap: var(--nr-spacing);
      flex: 1 1 auto;
      min-block-size: 0;
      overflow-y: auto;
      scrollbar-width: none;
    }
    .items.center {
      justify-content: center;
    }
    slot {
      display: contents;
    }
  `,
  render({ state, slots, theme, style, skin }) {
    const vars = `--nr-spacing: ${style.itemSpacing}; --nr-divider: ${style.divider}; --nr-hairline: ${style.hairline}`;
    return html`${cssBlock(`:host { inline-size: ${style.width}; }`)}${skin.surfaceTreatment.decorate(
      {
        child: html`<div class="rail" part="rail" style=${vars}
        ><div class="header"><slot name=${slots.header}></slot></div
        ><div class="items ${state.alignment}"><slot name=${slots.content}></slot></div></div
      >`,
        color: style.container,
        shape: theme.shapes.none,
        elevation: theme.elevation.level0,
        block: true,
        theme,
      },
    )}`;
  },
};

export const navigationDrawerBase: Base<
  NavigationDrawerState,
  NavigationDrawerSlots,
  NavigationDrawerStyle
> = {
  styles: css`
    :host {
      display: block;
      max-inline-size: 100%;
    }
    .drawer {
      inline-size: var(--nd-width);
      max-inline-size: 100%;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      block-size: 100%;
      padding: var(--camo-spacing-m);
      color: var(--camo-color-on-surface);
      border-inline-end: var(--nd-hairline) solid var(--nd-divider);
    }
    .camo-surface {
      block-size: 100%;
    }
    .header {
      flex: none;
      padding-block-end: var(--camo-spacing-m);
    }
    .items {
      display: flex;
      flex-direction: column;
      gap: var(--camo-spacing-xxs);
      flex: 1 1 auto;
      min-block-size: 0;
      overflow-y: auto;
    }
    slot {
      display: contents;
    }
  `,
  render({ state, slots, theme, style, skin }) {
    const vars = `--nd-width: ${style.width}; --nd-divider: ${state.modal ? "transparent" : style.divider}; --nd-hairline: ${style.hairline}`;
    return html`${
      state.modal
        ? cssBlock(
            `dialog::backdrop { background: color-mix(in srgb, ${theme.colors.scrim} ${style.scrimAlpha}, transparent); }`,
            // Rounded only on the side away from the edge it slides from (logical, so it mirrors).
            `.camo-surface { border-start-start-radius: 0 !important; border-end-start-radius: 0 !important; }`,
          )
        : cssBlock(`:host { inline-size: ${style.width}; }`)
    }${skin.surfaceTreatment.decorate({
      child: html`<div class="drawer" part="drawer" style=${vars}
        ><div class="header"><slot name=${slots.header}></slot></div
        ><div class="items"><slot name=${slots.content}></slot></div></div
      >`,
      color: state.modal ? style.modalContainer : style.container,
      shape: state.modal ? style.modalShape : theme.shapes.none,
      elevation: state.modal ? theme.elevation.level1 : theme.elevation.level0,
      block: true,
      theme,
    })}`;
  },
};
