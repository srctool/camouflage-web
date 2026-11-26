// The look the charts share. Colors, type and spacing are the theme's variables; what a style decides arrives inline.
import { css } from "lit";
import type { CSSResult } from "lit";

export const sharedStyles: CSSResult = css`
  :host {
    display: block;
    color: var(--camo-color-on-surface);
    --camo-chart-center: -50%;
    --camo-chart-end: -100%;
  }
  :host(:dir(rtl)) {
    --camo-chart-center: 50%;
    --camo-chart-end: 100%;
  }
  :host([hidden]) {
    display: none;
  }
  .sr {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
`;

export const frameStyles: CSSResult = css`
  .frame {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--camo-spacing-s);
  }
  .title {
    font: var(--camo-type-title-small-weight) var(--camo-type-title-small-size) /
      var(--camo-type-title-small-line-height) var(--camo-type-title-small-family);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    column-gap: var(--camo-spacing-xs);
  }
  /* The ring keeps the color readable on a chip that is filled with a color close to it. */
  .key {
    display: inline-block;
    inline-size: 8px;
    block-size: 8px;
    border-radius: 50%;
    box-shadow: 0 0 0 2px var(--camo-color-surface);
  }
  .toggle {
    align-self: flex-start;
  }
  .message {
    display: grid;
    place-items: center;
    color: var(--camo-color-on-surface-variant);
    font: var(--camo-type-body-medium-weight) var(--camo-type-body-medium-size) /
      var(--camo-type-body-medium-line-height) var(--camo-type-body-medium-family);
  }
  .table {
    overflow: auto;
  }
`;

export const plotStyles: CSSResult = css`
  .plot {
    position: relative;
    box-sizing: border-box;
    outline: none;
    color: var(--camo-color-on-surface-variant);
    font: var(--camo-type-label-small-weight) var(--camo-type-label-small-size) /
      var(--camo-type-label-small-line-height) var(--camo-type-label-small-family);
    letter-spacing: var(--camo-type-label-small-letter-spacing);
    -webkit-tap-highlight-color: transparent;
  }
  .plot:focus-visible {
    outline: 2px solid var(--camo-color-primary);
    outline-offset: 2px;
  }
  .area {
    position: relative;
    min-inline-size: 0;
    min-block-size: 0;
    touch-action: pan-y;
  }
  .marks {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    overflow: visible;
  }
  :host(:dir(rtl)) .marks {
    transform: scaleX(-1);
  }
  .dot,
  .bar,
  .spark-bar {
    position: absolute;
    display: block;
    box-sizing: border-box;
  }
  .dot {
    border-radius: 50%;
  }
  .spark-bar {
    inset-block-end: 0;
  }

  /* The draw-in: once, when the marks first paint. */
  @media (prefers-reduced-motion: no-preference) {
    .animate .marks,
    .animate .pie {
      animation: camo-chart-reveal var(--camo-motion-duration-long, 400ms)
        var(--camo-motion-easing-standard, ease) both;
    }
    .animate .bar.up {
      transform-origin: bottom;
      animation: camo-chart-grow-y var(--camo-motion-duration-long, 400ms)
        var(--camo-motion-easing-standard, ease) both;
    }
    .animate .bar.up.negative {
      transform-origin: top;
    }
    .animate .bar.along {
      transform-origin: left;
      animation: camo-chart-grow-x var(--camo-motion-duration-long, 400ms)
        var(--camo-motion-easing-standard, ease) both;
    }
    .animate .bar.along.negative,
    :host(:dir(rtl)) .animate .bar.along {
      transform-origin: right;
    }
    :host(:dir(rtl)) .animate .bar.along.negative {
      transform-origin: left;
    }
  }
  @keyframes camo-chart-reveal {
    from {
      clip-path: inset(-10% 100% -10% -10%);
    }
    to {
      clip-path: inset(-10% -10% -10% -10%);
    }
  }
  @keyframes camo-chart-grow-y {
    from {
      transform: scaleY(0);
    }
  }
  @keyframes camo-chart-grow-x {
    from {
      transform: scaleX(0);
    }
  }
`;

export const cartesianStyles: CSSResult = css`
  .cartesian {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr) auto auto;
    column-gap: 6px;
  }
  .top-title {
    grid-column: 1 / -1;
  }
  .side {
    position: relative;
    grid-area: 2 / 1;
    margin-block: 8px 0;
    text-align: end;
  }
  /* The column is as wide as its widest label. */
  .side i {
    display: block;
    block-size: 0;
    visibility: hidden;
    overflow: hidden;
    font-style: normal;
    white-space: nowrap;
  }
  .side span {
    position: absolute;
    inset-inline-end: 0;
    white-space: nowrap;
  }
  .side span.up {
    translate: 0 50%;
  }
  .side span.down {
    translate: 0 -50%;
  }
  .cartesian .area {
    grid-area: 2 / 2;
    margin-block-start: 8px;
    margin-inline-end: 12px;
  }
  .below {
    position: relative;
    grid-area: 3 / 2;
    margin-inline-end: 12px;
    margin-block-start: 6px;
    block-size: var(--camo-type-label-small-line-height);
  }
  .below span {
    position: absolute;
    white-space: nowrap;
    transform: translateX(var(--camo-chart-center));
  }
  .below span.first {
    transform: none;
  }
  .below span.last {
    transform: translateX(var(--camo-chart-end));
  }
  .bottom-title {
    grid-area: 4 / 2;
    text-align: center;
  }
  :host(:dir(rtl)) .cartesian.time {
    --camo-chart-center: -50%;
    --camo-chart-end: -100%;
  }
  :host(:dir(rtl)) .cartesian.time .marks {
    transform: none;
  }
  .rule {
    position: absolute;
    inset-inline: 0;
    block-size: 0;
  }
  .rule.vertical {
    inset-inline: auto;
    inset-block: 0;
    inline-size: 0;
    block-size: auto;
  }
  .baseline {
    position: absolute;
    inset-inline: 0;
    inset-block-end: 0;
    border-block-end: 1px solid var(--camo-color-outline);
  }
  .crosshair {
    position: absolute;
    inset-block: 0;
    border-inline-start: 1px solid var(--camo-color-outline);
  }
  .value {
    position: absolute;
    white-space: nowrap;
    color: var(--camo-color-on-surface-variant);
    pointer-events: none;
  }
`;

export const pieStyles: CSSResult = css`
  .pie-plot {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .square {
    aspect-ratio: 1;
  }
  .pie {
    display: block;
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    overflow: visible;
  }
  .slice {
    cursor: pointer;
  }
  .share {
    pointer-events: none;
  }
  .hole {
    position: absolute;
    inset: 0;
    margin: auto;
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    border-radius: 50%;
    color: var(--camo-color-on-surface);
    pointer-events: none;
  }
`;

export const sparklineStyles: CSSResult = css`
  :host {
    display: inline-block;
    inline-size: 100px;
    block-size: 28px;
    vertical-align: middle;
  }
  .box {
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 100%;
  }
  .box .area {
    inline-size: 100%;
    block-size: 100%;
  }
`;

export const tooltipStyles: CSSResult = css`
  .tip {
    position: absolute;
    inset-block-start: 0;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: var(--camo-spacing-xxs);
    padding: var(--camo-spacing-s);
    border-radius: var(--camo-shape-small);
    background: var(--camo-color-inverse-surface);
    color: var(--camo-color-inverse-on-surface);
    font: var(--camo-type-label-medium-weight) var(--camo-type-label-medium-size) /
      var(--camo-type-label-medium-line-height) var(--camo-type-label-medium-family);
    white-space: nowrap;
    pointer-events: none;
  }
  .tip-title {
    font-size: var(--camo-type-label-small-size);
  }
  .tip-row {
    display: flex;
    align-items: center;
    gap: var(--camo-spacing-xs);
  }
  .tip .key {
    display: inline-block;
    inline-size: 8px;
    block-size: 8px;
    border-radius: 50%;
  }
`;
