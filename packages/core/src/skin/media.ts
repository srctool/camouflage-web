// The shared drawing of the W6 media and input components: image, rating, carousel, file uploader. A skin supplies
// `defaults(theme)` and spreads the base. Pure; interactive parts carry `data-part` and the element listens.
import { css, html, nothing } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { camelOf } from "../theme/tokens.ts";
import type { CamoTextStyle } from "../theme/types.ts";
import type {
  CarouselSlots,
  CarouselState,
  CarouselStyle,
  FileUploaderSlots,
  FileUploaderState,
  FileUploaderStyle,
  IconArtwork,
  ImageSlots,
  ImageState,
  ImageStyle,
  RatingSlots,
  RatingState,
  RatingStyle,
  Renderer,
  UploadFile,
} from "./types.ts";

type Base<State, Slots extends string, Style> = Pick<
  Renderer<State, Slots, Style>,
  "render" | "styles"
>;

const font = (x: CamoTextStyle): string =>
  `${x.weight} ${x.size}/${x.lineHeight} ${x.family}; letter-spacing: ${x.letterSpacing}`;

const svg = (art: IconArtwork): ReturnType<typeof html> =>
  html`<svg viewBox=${art.viewBox} aria-hidden="true" focusable="false">${unsafeSVG(art.svg)}</svg>`;

// --- Image ------------------------------------------------------------------------------------------------------

export const imageBase: Base<ImageState, ImageSlots, ImageStyle> = {
  styles: css`
    :host {
      display: block;
      min-inline-size: 0;
    }
    .frame {
      position: relative;
      box-sizing: border-box;
      inline-size: 100%;
      block-size: 100%;
      overflow: hidden;
      background: var(--im-bg);
      border-radius: var(--im-radius);
      border: var(--im-border);
    }
    .frame.ratio {
      block-size: auto;
      aspect-ratio: var(--im-ratio);
    }
    .img {
      position: absolute;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
      object-fit: var(--im-fit, cover);
      object-position: var(--im-position, center);
      transition: opacity var(--im-fade);
    }
    .loading .img {
      opacity: 0;
    }
    .failed .img {
      display: none;
    }
    .fallback {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      color: var(--im-fg);
    }
    .fallback svg {
      inline-size: min(40%, 48px);
      block-size: min(40%, 48px);
      fill: currentColor;
    }
    @media (prefers-reduced-motion: reduce) {
      .img {
        transition: none;
      }
    }
  `,
  render({ state, theme, style, nodes }) {
    const radius = theme.shapes[camelOf(state.shape) as keyof typeof theme.shapes];
    const vars = [
      `--im-bg: ${style.placeholder}`,
      `--im-fg: ${style.icon}`,
      `--im-radius: ${radius}`,
      `--im-fade: ${style.fade}`,
      `--im-border: ${style.borderWidth === "0px" ? "0" : `${style.borderWidth} solid ${style.border}`}`,
      ...(state.aspectRatio === null ? [] : [`--im-ratio: ${state.aspectRatio}`]),
    ].join("; ");
    return html`<div
      class="frame ${state.phase} ${state.aspectRatio === null ? "" : "ratio"}"
      part="image"
      style=${vars}
    >
      ${nodes?.["image"] ?? nothing}
      ${
        state.phase === "loaded"
          ? nothing
          : html`<span class="fallback" part="placeholder"
              >${svg(state.phase === "failed" ? style.errorIcon : style.placeholderIcon)}</span
            >`
      }
    </div>`;
  },
};

// --- Rating -----------------------------------------------------------------------------------------------------

export const ratingBase: Base<RatingState, RatingSlots, RatingStyle> = {
  styles: css`
    :host {
      display: inline-block;
      vertical-align: middle;
      outline: none;
      touch-action: pan-y;
      -webkit-tap-highlight-color: transparent;
    }
    :host(:focus-visible) .rating {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: 2px;
      border-radius: var(--camo-shape-small);
    }
    .rating {
      display: inline-flex;
      gap: var(--r-gap);
      cursor: var(--r-cursor);
    }
    .star {
      position: relative;
      inline-size: var(--r-size);
      block-size: var(--r-size);
      flex: none;
    }
    .star svg {
      position: absolute;
      inset-block: 0;
      inset-inline-start: 0;
      inline-size: var(--r-size);
      block-size: var(--r-size);
    }
    .empty {
      fill: var(--r-empty);
    }
    .fill {
      position: absolute;
      inset-block: 0;
      inset-inline-start: 0;
      overflow: hidden;
    }
    .fill svg {
      fill: var(--r-fill);
    }
  `,
  render({ state, style }) {
    const size = { small: style.smallSize, medium: style.mediumSize, large: style.largeSize }[
      state.size
    ];
    const shown = state.hover ?? state.value;
    const fillColor = state.disabled
      ? style.disabled
      : state.hover !== null
        ? style.hover
        : style.filled;
    const vars = [
      `--r-size: ${size}`,
      `--r-gap: ${style.gap}`,
      `--r-empty: ${style.empty}`,
      `--r-fill: ${fillColor}`,
      `--r-cursor: ${state.interactive && !state.disabled ? "pointer" : "default"}`,
    ].join("; ");
    const stars = Array.from({ length: state.max }, (_, i) => {
      const fill = Math.min(Math.max(shown - i, 0), 1);
      return html`<span class="star" part="star"
        ><span class="empty">${svg(style.icon)}</span
        ><span class="fill" style="inline-size: ${fill * 100}%">${svg(style.icon)}</span></span
      >`;
    });
    return html`<div class="rating" part="rating" style=${vars}>${stars}</div>`;
  },
};

// --- Carousel ---------------------------------------------------------------------------------------------------

export const carouselBase: Base<CarouselState, CarouselSlots, CarouselStyle> = {
  styles: css`
    :host {
      display: block;
      position: relative;
    }
    .carousel {
      position: relative;
    }
    .strip {
      display: flex;
      gap: var(--ca-gap);
      overflow-x: auto;
      overscroll-behavior-x: contain;
      scroll-snap-type: x mandatory;
      scrollbar-width: none;
      /* A little room at the start so a peeking layout is not cut. */
      scroll-padding-inline: 0;
    }
    .strip::-webkit-scrollbar {
      display: none;
    }
    .strip:focus-visible {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: 2px;
    }
    ::slotted(*) {
      flex: 0 0 var(--ca-item);
      min-inline-size: 0;
      scroll-snap-align: start;
      overflow: hidden;
      border-radius: var(--ca-shape);
    }
    .btn {
      all: unset;
      position: absolute;
      inset-block-start: calc(50% - var(--ca-button) / 2);
      box-sizing: border-box;
      inline-size: var(--ca-button);
      block-size: var(--ca-button);
      display: grid;
      place-items: center;
      cursor: pointer;
      border-radius: 50%;
      background: var(--ca-btn-bg);
      color: var(--ca-btn-fg);
      z-index: 1;
    }
    .btn[data-part="prev"] {
      inset-inline-start: var(--camo-spacing-s);
    }
    .btn[data-part="next"] {
      inset-inline-end: var(--camo-spacing-s);
    }
    .btn svg {
      inline-size: 24px;
      block-size: 24px;
      fill: currentColor;
    }
    :host(:dir(rtl)) .btn svg {
      scale: -1 1;
    }
    .btn:disabled {
      opacity: 0;
      pointer-events: none;
    }
    .btn:focus-visible {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: 2px;
    }
    .dots {
      display: flex;
      justify-content: center;
      gap: var(--camo-spacing-s);
      padding-block-start: var(--camo-spacing-m);
    }
    .dot {
      inline-size: var(--ca-dot-size);
      block-size: var(--ca-dot-size);
      border-radius: 50%;
      background: var(--ca-dot);
    }
    .dot.active {
      background: var(--ca-active);
    }
    slot {
      display: contents;
    }
  `,
  render({ state, slots, style }) {
    const item = state.layout === "peek" ? `calc(100% - ${style.peek} * 2)` : "100%";
    const vars = [
      `--ca-gap: ${style.itemSpacing}`,
      `--ca-item: ${item}`,
      `--ca-shape: ${style.itemShape}`,
      `--ca-button: ${style.buttonSize}`,
      `--ca-btn-bg: ${style.buttonContainer}`,
      `--ca-btn-fg: ${style.buttonContent}`,
      `--ca-dot: ${style.dot}`,
      `--ca-active: ${style.activeDot}`,
      `--ca-dot-size: ${style.dotSize}`,
    ].join("; ");
    return html`<div class="carousel ${state.layout}" part="carousel" style=${vars}>
      <div class="strip" part="strip" tabindex="0"><slot name=${slots.content}></slot></div>
      ${
        state.buttons
          ? html`<button
                class="btn"
                type="button"
                data-part="prev"
                aria-label=${state.texts.previous}
                ?disabled=${!state.hasPrevious}
              >
                ${svg(style.previousIcon)}</button
              ><button
                class="btn"
                type="button"
                data-part="next"
                aria-label=${state.texts.next}
                ?disabled=${!state.hasNext}
              >
                ${svg(style.nextIcon)}
              </button>`
          : nothing
      }
      ${
        state.indicator && state.pageCount > 1
          ? html`<div class="dots" part="dots" aria-hidden="true">
              ${Array.from(
                { length: state.pageCount },
                (_, i) => html`<span class="dot ${i === state.page ? "active" : ""}"></span>`,
              )}
            </div>`
          : nothing
      }
    </div>`;
  },
};

// --- File uploader ----------------------------------------------------------------------------------------------

/** "1.0 MB": the size of a file in the largest unit that keeps it above one. */
export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = Math.max(bytes, 0);
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`;
}

function rowInfo(file: UploadFile, texts: FileUploaderState["texts"]): string {
  const size =
    file.sizeBytes === undefined || file.sizeBytes === null ? null : formatBytes(file.sizeBytes);
  const status = file.status ?? "uploading";
  const part =
    status === "failed"
      ? (file.message ?? null)
      : status === "done"
        ? texts.done
        : file.progress === undefined || file.progress === null
          ? texts.waiting
          : `${Math.round(file.progress * 100)}%`;
  return [size, part].filter((x): x is string => x !== null && x !== "").join(" · ");
}

export const fileUploaderBase: Base<FileUploaderState, FileUploaderSlots, FileUploaderStyle> = {
  styles: css`
    :host {
      display: block;
    }
    .up {
      display: flex;
      flex-direction: column;
      gap: var(--camo-spacing-m);
    }
    .zone {
      all: unset;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--camo-spacing-xs);
      min-block-size: var(--fu-height);
      padding: var(--camo-spacing-l);
      text-align: center;
      cursor: pointer;
      color: var(--fu-text);
      background: var(--fu-zone);
      border: 2px var(--fu-dash) var(--fu-border);
      border-radius: var(--fu-shape);
    }
    .zone.drag {
      border-color: var(--fu-drag);
    }
    .zone:disabled {
      cursor: default;
      opacity: 0.38;
    }
    .zone:focus-visible {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: 2px;
    }
    .ic svg {
      inline-size: 32px;
      block-size: 32px;
      fill: currentColor;
    }
    .t {
      font: var(--fu-title-font);
    }
    .h {
      color: var(--fu-muted);
      font: var(--fu-hint-font);
    }
    .rows {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--camo-spacing-s);
      overflow: auto;
    }
    .row {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      gap: var(--camo-spacing-xs) var(--camo-spacing-s);
      color: var(--fu-text);
    }
    .meta {
      min-inline-size: 0;
      display: flex;
      flex-direction: column;
    }
    .name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font: var(--fu-title-font);
    }
    .info {
      color: var(--fu-muted);
      font: var(--fu-hint-font);
    }
    .failed .info {
      color: var(--fu-error);
    }
    .bar {
      grid-column: 1 / -1;
    }
    .actions {
      display: flex;
    }
    .act {
      all: unset;
      box-sizing: border-box;
      display: grid;
      place-items: center;
      inline-size: 48px;
      block-size: 48px;
      margin-block: -8px;
      cursor: pointer;
      border-radius: 50%;
      color: var(--fu-muted);
    }
    .act svg {
      inline-size: 20px;
      block-size: 20px;
      fill: currentColor;
    }
    .act:focus-visible {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: -2px;
    }
  `,
  render({ state, style }) {
    const vars = [
      `--fu-height: ${style.zoneHeight}`,
      `--fu-shape: ${style.zoneShape}`,
      `--fu-dash: ${style.dashed ? "dashed" : "solid"}`,
      `--fu-zone: ${style.zone}`,
      `--fu-border: ${style.border}`,
      `--fu-drag: ${style.dragBorder}`,
      `--fu-error: ${style.error}`,
      `--fu-text: ${style.text}`,
      `--fu-muted: ${style.mutedText}`,
      `--fu-title-font: ${font(style.titleStyle)}`,
      `--fu-hint-font: ${font(style.hintStyle)}`,
    ].join("; ");
    return html`<div class="up" part="uploader" style=${vars}>
      <button
        class="zone ${state.dragOver ? "drag" : ""}"
        type="button"
        data-part="zone"
        part="zone"
        aria-describedby=${state.hint === null ? nothing : "hint"}
        ?disabled=${state.disabled}
      >
        <span class="ic">${svg(style.icon)}</span>
        <span class="t">${state.label}</span>
        ${state.hint === null ? nothing : html`<span class="h" id="hint">${state.hint}</span>`}
      </button>
      ${
        state.files.length === 0
          ? nothing
          : html`<ul class="rows" part="rows" aria-label=${state.label}>
              ${state.files.map((file) => {
                const status = file.status ?? "uploading";
                return html`<li class="row ${status}" data-id=${file.id} part="row">
                  <div class="meta">
                    <span class="name">${file.name}</span>
                    <span class="info" role=${status === "failed" ? "alert" : nothing}>${rowInfo(file, state.texts)}</span>
                  </div>
                  <div class="actions">
                    ${
                      status === "failed" && state.hasRetry
                        ? html`<button
                            class="act"
                            type="button"
                            data-part="retry"
                            data-id=${file.id}
                            aria-label="${state.texts.retry} ${file.name}"
                          >
                            ${svg(style.retryIcon)}
                          </button>`
                        : nothing
                    }
                    <button
                      class="act"
                      type="button"
                      data-part="remove"
                      data-id=${file.id}
                      aria-label="${state.texts.remove} ${file.name}"
                    >
                      ${svg(style.removeIcon)}
                    </button>
                  </div>
                  ${
                    status === "uploading"
                      ? html`<camo-progress-bar
                          class="bar"
                          label=${file.name}
                          .progress=${file.progress ?? null}
                        ></camo-progress-bar>`
                      : status === "failed"
                        ? html`<camo-progress-bar
                            class="bar"
                            tone="error"
                            label=${file.name}
                            .progress=${file.progress ?? 1}
                          ></camo-progress-bar>`
                        : nothing
                  }
                </li>`;
              })}
            </ul>`
      }
    </div>`;
  },
};
