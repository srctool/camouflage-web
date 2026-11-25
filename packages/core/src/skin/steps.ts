// The shared drawing of the W6 navigation helpers: pagination, breadcrumb and a progress step. A skin supplies
// `defaults(theme)` and spreads the base. Pure; interactive parts carry `data-part` and the element listens.
import { css, html, nothing } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import type { CamoTextStyle } from "../theme/types.ts";
import type {
  BreadcrumbSlots,
  BreadcrumbState,
  BreadcrumbStyle,
  IconArtwork,
  PaginationSlots,
  PaginationState,
  PaginationStyle,
  Renderer,
  StepSlots,
  StepState,
  StepStyle,
} from "./types.ts";

type Base<State, Slots extends string, Style> = Pick<
  Renderer<State, Slots, Style>,
  "render" | "styles"
>;

const font = (x: CamoTextStyle): string =>
  `${x.weight} ${x.size}/${x.lineHeight} ${x.family}; letter-spacing: ${x.letterSpacing}`;

const svg = (art: IconArtwork): ReturnType<typeof html> =>
  html`<svg viewBox=${art.viewBox} aria-hidden="true" focusable="false">${unsafeSVG(art.svg)}</svg>`;

// --- Pagination -------------------------------------------------------------------------------------------------

export const paginationBase: Base<PaginationState, PaginationSlots, PaginationStyle> = {
  styles: css`
    :host {
      display: block;
    }
    .pg {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: var(--camo-spacing-xs);
      color: var(--pg-fg);
      font: var(--pg-font);
    }
    button {
      all: unset;
      box-sizing: border-box;
      position: relative;
      display: inline-grid;
      place-items: center;
      min-inline-size: var(--pg-size);
      block-size: var(--pg-size);
      padding-inline: var(--camo-spacing-s);
      border-radius: var(--pg-shape);
      cursor: pointer;
      color: var(--pg-fg);
    }
    button::after {
      content: "";
      position: absolute;
      inset: calc((var(--pg-size) - 48px) / 2);
    }
    button:disabled {
      opacity: 0.38;
      cursor: default;
    }
    button:focus-visible {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: 2px;
    }
    .cur {
      background: var(--pg-cur-bg);
      color: var(--pg-cur-fg);
    }
    .nav svg {
      inline-size: 24px;
      block-size: 24px;
      fill: currentColor;
    }
    :host(:dir(rtl)) .nav svg {
      scale: -1 1;
    }
    .gap {
      min-inline-size: var(--pg-size);
      text-align: center;
    }
    .summary {
      padding-inline: var(--camo-spacing-m);
    }
    .dots {
      display: flex;
      align-items: center;
      gap: var(--camo-spacing-s);
      padding-inline: var(--camo-spacing-m);
    }
    .dot {
      padding: 0;
      min-inline-size: var(--pg-dot);
      block-size: var(--pg-dot);
      border-radius: 50%;
      background: var(--pg-dot-bg);
    }
    .dot.cur {
      background: var(--pg-active);
    }
    .dot::after {
      inset: calc((var(--pg-dot) - 24px) / 2);
    }
  `,
  render({ state, style }) {
    const vars = [
      `--pg-size: ${style.buttonSize}`,
      `--pg-shape: ${style.shape}`,
      `--pg-dot: ${style.dotSize}`,
      `--pg-fg: ${style.content}`,
      `--pg-cur-bg: ${style.currentContainer}`,
      `--pg-cur-fg: ${style.currentContent}`,
      `--pg-dot-bg: ${style.dot}`,
      `--pg-active: ${style.activeDot}`,
      `--pg-font: ${font(style.textStyle)}`,
    ].join("; ");
    const first = state.page <= 0;
    const last = state.page >= state.pageCount - 1;
    const body =
      state.variant === "numbered"
        ? state.items.map((item) =>
            item.kind === "gap"
              ? html`<span class="gap" aria-hidden="true">…</span>`
              : html`<button
                  type="button"
                  class="page ${item.index === state.page ? "cur" : ""}"
                  data-part="page"
                  data-index=${item.index}
                  aria-label="${state.texts.page} ${item.index + 1}"
                  aria-current=${item.index === state.page ? "page" : nothing}
                  ?disabled=${state.disabled}
                >
                  ${item.index + 1}
                </button>`,
          )
        : state.variant === "compact"
          ? html`<span class="summary" aria-live="polite">${state.texts.summary}</span>`
          : html`<div class="dots" part="dots">
              ${Array.from(
                { length: state.pageCount },
                (_, i) => html`<button
                  type="button"
                  class="dot ${i === state.page ? "cur" : ""}"
                  data-part="page"
                  data-index=${i}
                  aria-label="${state.texts.page} ${i + 1}"
                  aria-current=${i === state.page ? "page" : nothing}
                  ?disabled=${state.disabled}
                ></button>`,
              )}
            </div>`;
    return html`<div class="pg ${state.variant}" part="pagination" style=${vars}>
      <button
        type="button"
        class="nav"
        data-part="prev"
        aria-label=${state.texts.previous}
        ?disabled=${state.disabled || first}
      >
        ${svg(style.previousIcon)}
      </button>
      ${body}
      <button
        type="button"
        class="nav"
        data-part="next"
        aria-label=${state.texts.next}
        ?disabled=${state.disabled || last}
      >
        ${svg(style.nextIcon)}
      </button>
    </div>`;
  },
};

// --- Breadcrumb -------------------------------------------------------------------------------------------------

export const breadcrumbBase: Base<BreadcrumbState, BreadcrumbSlots, BreadcrumbStyle> = {
  styles: css`
    :host {
      display: block;
    }
    ol {
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      margin: 0;
      padding: 0;
      list-style: none;
      font: var(--bc-font);
      min-inline-size: 0;
    }
    li {
      display: flex;
      align-items: center;
      min-inline-size: 0;
    }
    .sep {
      display: inline-grid;
      place-items: center;
      color: var(--bc-sep);
    }
    .sep svg {
      inline-size: 20px;
      block-size: 20px;
      fill: currentColor;
    }
    :host(:dir(rtl)) .sep svg {
      scale: -1 1;
    }
    .item {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      gap: var(--camo-spacing-xs);
      min-block-size: 48px;
      padding-inline: var(--bc-pad);
      min-inline-size: 0;
      max-inline-size: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .link {
      color: var(--bc-link);
      cursor: pointer;
    }
    .link:hover {
      background: var(--bc-hover);
    }
    .link:focus-visible {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: -2px;
    }
    .current {
      color: var(--bc-current);
      font-weight: var(--camo-type-label-large-weight);
    }
    .item svg {
      inline-size: 18px;
      block-size: 18px;
      fill: currentColor;
      flex: none;
    }
    .more {
      display: inline-grid;
      place-items: center;
      inline-size: 48px;
      block-size: 48px;
      cursor: pointer;
      color: var(--bc-link);
    }
    slot {
      display: contents;
    }
  `,
  render({ state, style, nodes }) {
    const vars = [
      `--bc-font: ${font(style.textStyle)}`,
      `--bc-pad: ${style.itemPadding}`,
      `--bc-link: ${style.link}`,
      `--bc-current: ${style.current}`,
      `--bc-sep: ${style.separatorColor}`,
      `--bc-hover: ${style.hover}`,
    ].join("; ");
    const separator = html`<span class="sep" aria-hidden="true">${svg(style.separator)}</span>`;
    const item = (e: BreadcrumbState["items"][number]): ReturnType<typeof html> =>
      e.current
        ? html`<span class="item current" aria-current="page" part="current" data-part="item" data-key=${e.key}
            >${e.icon === null ? nothing : svg(e.icon)}${e.label}</span
          >`
        : html`<button class="item link" type="button" part="item" data-part="item" data-key=${e.key}>
            ${e.icon === null ? nothing : svg(e.icon)}${e.label}
          </button>`;
    return html`<nav aria-label=${state.label} part="breadcrumb" style=${vars}>
      <ol>
        ${state.items.map(
          (e, i) => html`<li>
              ${i > 0 ? separator : nothing}${item(e)}
            </li>
            ${i === 0 && state.folded.length > 0 ? html`<li>${separator}${nodes?.["overflow"] ?? nothing}</li>` : nothing}`,
        )}
      </ol>
    </nav>`;
  },
};

// --- Progress step ----------------------------------------------------------------------------------------------

export const progressStepsBase: Base<StepState, StepSlots, StepStyle> = {
  styles: css`
    :host {
      display: block;
      outline: none;
      min-inline-size: 0;
    }
    :host([clickable]) {
      cursor: pointer;
    }
    :host(:focus-visible) .step {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: 2px;
      border-radius: var(--camo-shape-small);
    }
    .step {
      display: flex;
      color: var(--st-text);
      gap: var(--camo-spacing-s);
    }
    .h {
      flex-direction: column;
    }
    .v {
      flex-direction: row;
    }
    .track {
      display: flex;
      align-items: center;
      gap: var(--camo-spacing-xs);
      min-inline-size: 0;
    }
    .v .track {
      flex-direction: column;
      align-self: stretch;
    }
    .marker {
      flex: none;
      display: inline-grid;
      place-items: center;
      box-sizing: border-box;
      inline-size: var(--st-marker);
      block-size: var(--st-marker);
      border-radius: 50%;
      background: var(--st-bg);
      color: var(--st-fg);
      border: 2px solid var(--st-ring);
      font: var(--st-label-font);
    }
    .marker svg {
      inline-size: 70%;
      block-size: 70%;
      fill: currentColor;
    }
    .connector {
      flex: 1 1 auto;
      background: var(--st-connector);
    }
    .h .connector {
      block-size: var(--st-line);
      min-inline-size: 8px;
    }
    .v .connector {
      inline-size: var(--st-line);
      min-block-size: 16px;
    }
    .text {
      display: flex;
      flex-direction: column;
      min-inline-size: 0;
      padding-block-end: var(--camo-spacing-m);
    }
    .label {
      font: var(--st-label-font);
      color: var(--st-label);
    }
    .desc {
      font: var(--st-desc-font);
      color: var(--st-muted);
    }
  `,
  render({ state, style }) {
    const done = state.status === "complete";
    const current = state.status === "current";
    const error = state.status === "error";
    const bg = done
      ? style.complete
      : current
        ? style.current
        : error
          ? style.error
          : "transparent";
    const fg = done
      ? style.onComplete
      : current
        ? style.onCurrent
        : error
          ? style.onError
          : style.upcoming;
    const ring = done
      ? style.complete
      : current
        ? style.current
        : error
          ? style.error
          : style.upcoming;
    const vars = [
      `--st-marker: ${style.markerSize}`,
      `--st-line: ${style.connectorWidth}`,
      `--st-text: ${style.text}`,
      `--st-muted: ${style.mutedText}`,
      `--st-bg: ${bg}`,
      `--st-fg: ${fg}`,
      `--st-ring: ${ring}`,
      `--st-connector: ${done ? style.complete : style.connector}`,
      `--st-label: ${error ? style.error : style.text}`,
      `--st-label-font: ${font(style.labelStyle)}`,
      `--st-desc-font: ${font(style.descriptionStyle)}`,
    ].join("; ");
    const marker = done
      ? svg(style.checkIcon)
      : error
        ? svg(style.errorIcon)
        : style.showNumbers
          ? html`${state.index + 1}`
          : nothing;
    return html`<div class="step ${state.orientation === "horizontal" ? "h" : "v"}" part="step" style=${vars}>
      <div class="track">
        <span class="marker" part="marker">${marker}</span>${state.last ? nothing : html`<span class="connector" part="connector"></span>`}
      </div>
      <div class="text">
        <span class="label" part="label">${state.label}</span>
        ${state.description === null ? nothing : html`<span class="desc" part="description">${state.description}</span>`}
      </div>
    </div>`;
  },
};
