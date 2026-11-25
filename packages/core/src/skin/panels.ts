// The shared drawing of the W6 panels: popover, side sheet and toolbar. A skin supplies `defaults(theme)` and spreads the
// base. The frame (the popover element in the top layer, the modal dialog, the overflow menu) is core's. Pure.
import { css, html, nothing } from "lit";
import { cssBlock } from "../style.ts";
import type { CamoTextStyle } from "../theme/types.ts";
import type {
  PopoverSlots,
  PopoverState,
  PopoverStyle,
  Renderer,
  SideSheetSlots,
  SideSheetState,
  SideSheetStyle,
  ToolbarSlots,
  ToolbarState,
  ToolbarStyle,
} from "./types.ts";

type Base<State, Slots extends string, Style> = Pick<
  Renderer<State, Slots, Style>,
  "render" | "styles"
>;

const font = (x: CamoTextStyle): string =>
  `${x.weight} ${x.size}/${x.lineHeight} ${x.family}; letter-spacing: ${x.letterSpacing}`;

// --- Popover ----------------------------------------------------------------------------------------------------

export const popoverBase: Base<PopoverState, PopoverSlots, PopoverStyle> = {
  styles: css`
    .pop {
      position: relative;
      box-sizing: border-box;
      max-inline-size: var(--po-max);
      /* The arrow lives in a margin of its own on the facing edge, so the gap to the anchor includes it. */
      padding-block-start: var(--po-pad-top);
      padding-block-end: var(--po-pad-bottom);
      padding-inline-start: var(--po-pad-left);
      padding-inline-end: var(--po-pad-right);
      color: var(--po-content);
    }
    .panel {
      display: flex;
      flex-direction: column;
      gap: var(--camo-spacing-s);
      box-sizing: border-box;
      padding: var(--po-padding);
    }
    .title {
      margin: 0;
      color: var(--po-title);
      font: var(--po-title-font);
    }
    .body {
      font: var(--camo-type-body-medium-weight) var(--camo-type-body-medium-size) /
        var(--camo-type-body-medium-line-height) var(--camo-type-body-medium-family);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--camo-spacing-s);
    }
    slot {
      display: contents;
    }
    .arrow {
      position: absolute;
      inline-size: var(--po-arrow-w);
      block-size: var(--po-arrow-h);
      background: var(--po-bg);
      pointer-events: none;
    }
    /* The arrow's position is measured from the panel's physical left or top, which is where the anchor's center is. */
    .bottom .arrow {
      top: 0;
      left: calc(var(--po-offset) - var(--po-arrow-w) / 2);
      clip-path: polygon(0 100%, 50% 0, 100% 100%);
    }
    .top .arrow {
      bottom: 0;
      left: calc(var(--po-offset) - var(--po-arrow-w) / 2);
      clip-path: polygon(0 0, 50% 100%, 100% 0);
    }
    .left .arrow {
      top: calc(var(--po-offset) - var(--po-arrow-w) / 2);
      inline-size: var(--po-arrow-h);
      block-size: var(--po-arrow-w);
      right: 0;
      clip-path: polygon(0 0, 100% 50%, 0 100%);
    }
    .right .arrow {
      top: calc(var(--po-offset) - var(--po-arrow-w) / 2);
      inline-size: var(--po-arrow-h);
      block-size: var(--po-arrow-w);
      left: 0;
      clip-path: polygon(100% 0, 0 50%, 100% 100%);
    }
  `,
  render({ state, slots, theme, style, skin }) {
    const arrow = style.showArrow ? style.arrowHeight : "0px";
    const vars = [
      `--po-max: ${style.maxWidth}`,
      `--po-padding: ${style.padding}`,
      `--po-arrow-w: ${style.arrowWidth}`,
      `--po-arrow-h: ${style.arrowHeight}`,
      `--po-bg: ${style.container}`,
      `--po-offset: ${state.arrowOffset ?? 0}px`,
      `--po-title: ${style.titleColor}`,
      `--po-content: ${style.contentColor}`,
      `--po-title-font: ${font(style.titleStyle)}`,
      `--po-pad-top: ${state.side === "bottom" ? arrow : "0px"}`,
      `--po-pad-bottom: ${state.side === "top" ? arrow : "0px"}`,
      `--po-pad-left: ${state.side === "right" ? arrow : "0px"}`,
      `--po-pad-right: ${state.side === "left" ? arrow : "0px"}`,
    ];
    return html`<div class="pop ${state.side}" part="popover" style=${vars.join("; ")}>
      ${style.showArrow && state.arrowOffset !== null ? html`<span class="arrow" part="arrow"></span>` : nothing}
      ${skin.surfaceTreatment.decorate({
        child: html`<div class="panel" part="panel">
          ${state.title === null ? nothing : html`<p class="title" part="title">${state.title}</p>`}
          <div class="body"><slot name=${slots.content}></slot></div>
          <div class="actions"><slot name=${slots.actions}></slot></div>
        </div>`,
        color: style.container,
        shape: style.shape,
        elevation: style.elevation,
        border: style.border ?? undefined,
        block: true,
        theme,
      })}
    </div>`;
  },
};

// --- Side sheet -------------------------------------------------------------------------------------------------

export const sideSheetBase: Base<SideSheetState, SideSheetSlots, SideSheetStyle> = {
  styles: css`
    :host {
      display: block;
      block-size: 100%;
    }
    .sheet {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      block-size: 100%;
      inline-size: var(--ss-width);
      max-inline-size: 100%;
      color: var(--ss-fg);
      border-inline-start: var(--ss-hairline) solid var(--ss-divider);
    }
    .camo-surface {
      block-size: 100%;
    }
    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--camo-spacing-m);
      padding: var(--ss-padding);
      padding-block-end: var(--camo-spacing-s);
    }
    .title {
      margin: 0;
      flex: 1 1 auto;
      min-inline-size: 0;
      font: var(--ss-title-font);
    }
    .close {
      all: unset;
      box-sizing: border-box;
      flex: none;
      display: grid;
      place-items: center;
      inline-size: 48px;
      block-size: 48px;
      margin: -8px;
      cursor: pointer;
      border-radius: 50%;
      position: relative;
    }
    .close svg {
      inline-size: 24px;
      block-size: 24px;
      fill: currentColor;
    }
    .close:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: -2px;
    }
    .body {
      flex: 1 1 auto;
      min-block-size: 0;
      overflow: auto;
      padding: var(--ss-padding);
      padding-block-start: var(--camo-spacing-s);
    }
    .actions {
      flex: none;
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--camo-spacing-s);
      padding: var(--ss-padding);
      border-block-start: var(--ss-hairline) solid var(--ss-divider);
    }
    slot {
      display: contents;
    }
  `,
  render({ state, slots, theme, style, skin, nodes }) {
    const vars = [
      `--ss-width: ${style.width}`,
      `--ss-padding: ${style.padding}`,
      `--ss-fg: ${style.titleColor}`,
      `--ss-divider: ${state.modal || !style.showDivider ? "transparent" : style.divider}`,
      `--ss-hairline: 1px`,
      `--ss-title-font: ${font(style.titleStyle)}`,
    ].join("; ");
    const body = html`<div class="sheet" part="sheet" style=${vars}>
      ${
        state.title !== null || state.closable
          ? html`<div class="head">
              <h2 class="title" part="title">${state.title}</h2>
              ${nodes?.["close"] ?? nothing}
            </div>`
          : nothing
      }
      <div class="body"><slot name=${slots.content}></slot></div>
      <div class="actions"><slot name=${slots.actions}></slot></div>
    </div>`;
    const decorated = skin.surfaceTreatment.decorate({
      child: body,
      color: state.modal ? style.modalContainer : style.container,
      shape: state.modal ? style.modalShape : theme.shapes.none,
      elevation: state.modal ? theme.elevation.level1 : theme.elevation.level0,
      block: true,
      theme,
    });
    return html`${
      state.modal
        ? cssBlock(
            `dialog::backdrop { background: color-mix(in srgb, ${theme.colors.scrim} ${style.scrimAlpha}, transparent); }`,
            // Rounded only on the side away from the edge it slides from (logical, so it mirrors).
            `.camo-surface { border-start-end-radius: 0 !important; border-end-end-radius: 0 !important; }`,
          )
        : nothing
    }${decorated}`;
  },
};

// --- Toolbar ----------------------------------------------------------------------------------------------------

export const toolbarBase: Base<ToolbarState, ToolbarSlots, ToolbarStyle> = {
  styles: css`
    :host {
      display: block;
    }
    .bar {
      display: flex;
      align-items: center;
      box-sizing: border-box;
      min-block-size: var(--tb-height);
      padding-inline: var(--tb-padding);
      gap: var(--tb-spacing);
      color: var(--camo-color-on-surface-variant);
      --camo-content-color: var(--camo-color-on-surface-variant);
    }
    .docked {
      border-block-start: var(--tb-hairline) solid var(--tb-divider);
    }
    .floating {
      margin: var(--tb-margin);
    }
    .actions {
      display: flex;
      align-items: center;
      flex: 1 1 auto;
      min-inline-size: 0;
      gap: var(--tb-spacing);
    }
    slot {
      display: contents;
    }
    .actions ::slotted([data-camo-overflowed]) {
      display: none;
    }
    .leading,
    .trailing {
      display: flex;
      align-items: center;
      flex: none;
      gap: var(--tb-spacing);
    }
  `,
  render({ state, slots, theme, style, skin, nodes }) {
    const floating = state.placement === "floating";
    const vars = [
      `--tb-height: ${style.height}`,
      `--tb-padding: ${style.padding}`,
      `--tb-spacing: ${style.actionSpacing}`,
      `--tb-margin: ${style.floatingMargin}`,
      `--tb-divider: ${!floating && style.showDivider ? style.divider : "transparent"}`,
      `--tb-hairline: 1px`,
    ].join("; ");
    return skin.surfaceTreatment.decorate({
      child: html`<div class="bar ${floating ? "floating" : "docked"}" part="bar" style=${vars}>
        <div class="leading"><slot name=${slots.leading}></slot></div>
        <div class="actions"><slot name=${slots.content}></slot>${nodes?.["overflow"] ?? nothing}</div>
        <div class="trailing"><slot name=${slots.trailing}></slot></div>
      </div>`,
      color: style.container,
      shape: floating ? style.floatingShape : theme.shapes.none,
      elevation: floating ? style.floatingElevation : theme.elevation.level0,
      // A flat skin has no shadow to show a floating bar, so it gets a hairline.
      border: floating ? `1px solid ${style.divider}` : undefined,
      block: true,
      theme,
    });
  },
};
