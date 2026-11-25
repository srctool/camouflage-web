// The shared drawing of the W6 structured data: data table and tree. Core builds the semantic markup (a real table, real
// tree items) and the renderer gives it its look; a skin supplies `defaults(theme)` and spreads the base. Pure.
import { css, html, nothing } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import type { CamoTextStyle } from "../theme/types.ts";
import type {
  DataTableSlots,
  DataTableState,
  DataTableStyle,
  IconArtwork,
  Renderer,
  TreeNodeState,
  TreeSlots,
  TreeStyle,
} from "./types.ts";

type Base<State, Slots extends string, Style> = Pick<
  Renderer<State, Slots, Style>,
  "render" | "styles"
>;

const font = (x: CamoTextStyle): string =>
  `${x.weight} ${x.size}/${x.lineHeight} ${x.family}; letter-spacing: ${x.letterSpacing}`;

const svg = (art: IconArtwork): ReturnType<typeof html> =>
  html`<svg viewBox=${art.viewBox} aria-hidden="true" focusable="false">${unsafeSVG(art.svg)}</svg>`;

// --- Data table -------------------------------------------------------------------------------------------------

export const dataTableBase: Base<DataTableState, DataTableSlots, DataTableStyle> = {
  styles: css`
    :host {
      display: block;
      block-size: 100%;
      min-inline-size: 0;
    }
    .dt {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      block-size: 100%;
      color: var(--dt-text);
      background: var(--dt-container);
    }
    .scroller {
      flex: 1 1 auto;
      min-block-size: 0;
      overflow: auto;
    }
    table {
      inline-size: 100%;
      border-collapse: separate;
      border-spacing: 0;
      table-layout: fixed;
      font: var(--dt-cell-font);
    }
    caption {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
    th {
      box-sizing: border-box;
      block-size: var(--dt-head-height);
      padding-inline: var(--dt-pad);
      text-align: start;
      font: var(--dt-head-font);
      color: var(--dt-head-text);
      background: var(--dt-head);
      border-block-end: var(--dt-line);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sticky th {
      position: sticky;
      inset-block-start: 0;
      z-index: 1;
    }
    td {
      box-sizing: border-box;
      block-size: var(--dt-row-height);
      padding-inline: var(--dt-pad);
      border-block-end: var(--dt-line);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .center {
      text-align: center;
    }
    .end {
      text-align: end;
    }
    tbody tr {
      background: var(--dt-row);
      outline: none;
    }
    .striped tbody tr:nth-child(even) {
      background: var(--dt-striped);
    }
    tbody tr[aria-selected="true"] {
      background: var(--dt-selected);
    }
    tbody tr:focus-visible {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: -2px;
    }
    tbody tr[data-clickable] {
      cursor: pointer;
    }
    .select {
      inline-size: 48px;
      padding-inline: var(--camo-spacing-s);
    }
    .sortable {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      gap: var(--camo-spacing-xs);
      cursor: pointer;
      max-inline-size: 100%;
      font: inherit;
      color: inherit;
    }
    .sortable:focus-visible {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: 2px;
    }
    .sortable svg {
      inline-size: 16px;
      block-size: 16px;
      fill: currentColor;
      flex: none;
      opacity: 0.4;
    }
    th[aria-sort] .sortable svg {
      opacity: 1;
    }
    th[aria-sort="descending"] .sortable svg {
      rotate: 180deg;
    }
    .empty,
    .loading {
      display: grid;
      place-items: center;
      padding: var(--camo-spacing-xl);
      color: var(--dt-head-text);
    }
    slot {
      display: contents;
    }
    .footer {
      flex: none;
      border-block-start: var(--dt-line);
    }
    :host(:dir(rtl)) .sortable svg {
      margin-inline: 0;
    }
  `,
  render({ state, slots, style, nodes }) {
    const line = style.dividers ? `1px solid ${style.divider}` : "0";
    const vars = [
      `--dt-text: ${style.text}`,
      `--dt-head-text: ${style.headerText}`,
      `--dt-container: ${style.container}`,
      `--dt-head: ${style.header}`,
      `--dt-row: ${style.row}`,
      `--dt-striped: ${style.stripedRow}`,
      `--dt-selected: ${style.selectedRow}`,
      `--dt-line: ${line}`,
      `--dt-head-height: ${style.headerHeight}`,
      `--dt-row-height: ${style.rowHeight}`,
      `--dt-pad: ${style.cellPadding}`,
      `--dt-head-font: ${font(style.headerStyle)}`,
      `--dt-cell-font: ${font(style.cellStyle)}`,
    ].join("; ");
    return html`<div
      class="dt ${style.stickyHeader ? "sticky" : ""} ${style.striped ? "striped" : ""}"
      part="table"
      style=${vars}
    >
      <div class="scroller">${nodes?.["table"] ?? nothing}</div>
      ${state.empty && !state.loading ? html`<div class="empty"><slot name=${slots.empty}></slot></div>` : nothing}
      ${state.loading ? html`<div class="loading">${nodes?.["loading"] ?? nothing}</div>` : nothing}
      <div class="footer"><slot name=${slots.footer}></slot></div>
    </div>`;
  },
};

// --- Tree -------------------------------------------------------------------------------------------------------

export const treeBase: Base<TreeNodeState, TreeSlots, TreeStyle> = {
  styles: css`
    :host {
      display: block;
    }
    .row {
      position: relative;
      display: flex;
      align-items: center;
      box-sizing: border-box;
      min-block-size: var(--tr-height);
      padding-inline-start: calc((var(--tr-level) - 1) * var(--tr-indent));
      padding-inline-end: var(--camo-spacing-m);
      color: var(--tr-fg);
      background: var(--tr-bg);
      font: var(--tr-font);
      cursor: pointer;
      user-select: none;
    }
    .lines .row::before {
      content: "";
      position: absolute;
      inset-block: 0;
      inset-inline-start: calc((var(--tr-level) - 1) * var(--tr-indent) - var(--tr-indent) / 2);
      border-inline-start: 1px solid var(--tr-line);
    }
    .toggle {
      flex: none;
      display: grid;
      place-items: center;
      inline-size: var(--tr-indent);
      block-size: var(--tr-height);
      color: var(--tr-chevron);
    }
    .toggle svg {
      inline-size: var(--tr-icon);
      block-size: var(--tr-icon);
      fill: currentColor;
      transition: rotate var(--camo-motion-duration-short);
    }
    .open .toggle svg {
      rotate: 90deg;
    }
    :host(:dir(rtl)) .toggle svg {
      scale: -1 1;
    }
    .leaf .toggle {
      visibility: hidden;
    }
    .icon {
      flex: none;
      display: grid;
      place-items: center;
      margin-inline-end: var(--camo-spacing-s);
    }
    .icon svg {
      inline-size: var(--tr-icon);
      block-size: var(--tr-icon);
      fill: currentColor;
    }
    .label {
      flex: 1 1 auto;
      min-inline-size: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
  render({ state, style }) {
    const vars = [
      `--tr-level: ${state.level}`,
      `--tr-height: ${style.rowHeight}`,
      `--tr-indent: ${style.indent}`,
      `--tr-icon: ${style.iconSize}`,
      `--tr-fg: ${state.selected ? style.selectedText : style.text}`,
      `--tr-bg: ${state.selected ? style.selected : "transparent"}`,
      `--tr-font: ${font(style.textStyle)}`,
      `--tr-chevron: ${style.chevronColor}`,
      `--tr-line: ${style.line}`,
    ].join("; ");
    return html`<div
      class="row ${state.expanded ? "open" : ""} ${state.hasChildren ? "" : "leaf"} ${style.showLines ? "lines" : ""}"
      part="node"
      style=${vars}
    >
      <span class="toggle" data-part="toggle">${svg(style.chevron)}</span>
      ${state.icon === null ? nothing : html`<span class="icon">${svg(state.icon)}</span>`}
      <span class="label">${state.label}</span>
      ${state.loading ? html`<camo-progress-circle size="small" label="Loading"></camo-progress-circle>` : nothing}
    </div>`;
  },
};
