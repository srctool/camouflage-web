// The shared drawing of the W3 selection and value controls: checkbox, switch, radio, segmented control, slider,
// stepper. A skin supplies `defaults(theme)` and spreads the base. Pure: the renderers read arguments only.
import { css, html, nothing } from "lit";
import type { TemplateResult } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import type {
  CheckboxStyle,
  RadioStyle,
  Renderer,
  SegmentState,
  SegmentSlots,
  SegmentStyle,
  SegmentedControlSlots,
  SegmentedControlState,
  SegmentedControlStyle,
  SliderSlots,
  SliderState,
  SliderStyle,
  StepperSlots,
  StepperState,
  StepperStyle,
  SwitchStyle,
  ToggleSlots,
  ToggleState,
} from "./types.ts";
import type { CamoTheme } from "../theme/types.ts";

type Base<State, Slots extends string, Style> = Pick<
  Renderer<State, Slots, Style>,
  "render" | "styles"
>;

const CHECK = "M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z";

// --- Labels: the row every toggle shares ---------------------------------------------------------------------

const ROW = css`
  :host {
    display: inline-flex;
    flex-direction: column;
    gap: var(--camo-spacing-xs);
    vertical-align: middle;
    cursor: pointer;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }
  :host([disabled]) {
    cursor: default;
  }
  .row {
    display: flex;
    align-items: flex-start;
    gap: var(--t-gap);
    position: relative;
    min-block-size: var(--t-touch);
    color: var(--t-label);
  }
  .row.start {
    flex-direction: row-reverse;
    justify-content: space-between;
  }
  .row.start.alone {
    justify-content: flex-end;
  }
  .row.alone {
    min-inline-size: var(--t-touch);
    justify-content: center;
  }
  .control {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-block: auto;
  }
  .text {
    display: flex;
    flex-direction: column;
    min-inline-size: 0;
    margin-block: auto;
  }
  .label {
    font: var(--t-font);
  }
  .desc {
    font: var(--t-desc-font);
    color: var(--t-desc);
  }
  .desc:empty,
  .label:empty,
  .err:empty {
    display: none;
  }
  .err {
    font: var(--t-desc-font);
    color: var(--camo-color-error);
  }
  :host(:focus-visible) .control {
    outline: 2px solid var(--camo-color-primary);
    outline-offset: 2px;
  }
  :host([data-camo-pressed]) .control {
    opacity: 0.7;
  }
  slot {
    display: contents;
  }
`;

function rowVars(state: ToggleState, theme: CamoTheme, gap: string): string {
  const c = theme.colors;
  const body = theme.typography.bodyLarge;
  const small = theme.typography.bodyMedium;
  const dim = `color-mix(in srgb, ${c.onSurface} 38%, transparent)`;
  return [
    `--t-gap: ${gap}`,
    `--t-touch: 48px`,
    `--t-label: ${state.disabled ? dim : c.onSurface}`,
    `--t-desc: ${state.disabled ? dim : c.onSurfaceVariant}`,
    `--t-font: ${body.weight} ${body.size}/${body.lineHeight} ${body.family}`,
    `--t-desc-font: ${small.weight} ${small.size}/${small.lineHeight} ${small.family}`,
  ].join("; ");
}

function row(
  state: ToggleState,
  theme: CamoTheme,
  position: "start" | "end",
  gap: string,
  control: TemplateResult,
  extraVars: string,
  slotName: string,
): TemplateResult {
  const hasText = state.label !== null || state.description !== null;
  return html`<div
      class="row ${position === "start" ? "start" : ""} ${hasText ? "" : "alone"}"
      part="row"
      style="${rowVars(state, theme, gap)}; ${extraVars}"
    >
      <span class="control" part="control">${control}</span>
      <span class="text"
        ><span class="label" part="label">${state.label}<slot name=${slotName}></slot></span
        ><span class="desc" part="description">${state.description}</span></span
      >
    </div>
    <div class="err" part="error" style="padding-inline: ${gap}">${state.error}</div>`;
}

// --- Checkbox -------------------------------------------------------------------------------------------------

export const checkboxBase: Base<ToggleState, ToggleSlots, CheckboxStyle> = {
  styles: [
    ROW,
    css`
      .box {
        position: relative;
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        inline-size: var(--c-size);
        block-size: var(--c-size);
        border: var(--c-border-width) solid var(--c-border);
        border-radius: var(--c-shape);
        background: var(--c-fill);
        color: var(--c-mark);
        transition: background var(--camo-motion-duration-short);
      }
      .box svg {
        inline-size: 100%;
        block-size: 100%;
        fill: currentColor;
        opacity: var(--c-mark-opacity);
      }
      .dash {
        inline-size: 60%;
        block-size: 2px;
        background: currentColor;
        opacity: var(--c-dash-opacity);
        border-radius: 1px;
      }
    `,
  ],
  render({ state, slots, theme, style }) {
    const c = theme.colors;
    const on = state.checked || state.indeterminate;
    const dim = `color-mix(in srgb, ${c.onSurface} 38%, transparent)`;
    const tone = state.error !== null ? c.error : c.primary;
    const vars = [
      `--c-size: ${style.boxSize}`,
      `--c-shape: ${style.shape}`,
      `--c-border-width: ${style.borderWidth}`,
      `--c-border: ${state.disabled ? dim : on ? tone : state.error !== null ? c.error : c.outline}`,
      `--c-fill: ${on ? (state.disabled ? dim : tone) : "transparent"}`,
      `--c-mark: ${c.onPrimary}`,
      `--c-mark-opacity: ${state.checked && !state.indeterminate ? 1 : 0}`,
      `--c-dash-opacity: ${state.indeterminate ? 1 : 0}`,
    ].join("; ");
    const box = html`<span class="box" part="box"
      ><svg viewBox="0 0 24 24" aria-hidden="true"><path d=${CHECK} /></svg
      ><span class="dash" style="position:absolute"></span
    ></span>`;
    return row(state, theme, style.labelPosition, style.labelGap, box, vars, slots.label);
  },
};

// --- Switch ---------------------------------------------------------------------------------------------------

export const switchBase: Base<ToggleState, ToggleSlots, SwitchStyle> = {
  styles: [
    ROW,
    css`
      .track {
        box-sizing: border-box;
        position: relative;
        display: inline-block;
        inline-size: var(--s-track-width);
        block-size: var(--s-track-height);
        border-radius: calc(var(--s-track-height) / 2);
        background: var(--s-track);
        border: 2px solid var(--s-track-border);
        transition: background var(--camo-motion-duration-short);
      }
      .thumb {
        position: absolute;
        inset-block: 0;
        margin-block: auto;
        inset-inline-start: var(--s-thumb-start);
        inline-size: var(--s-thumb);
        block-size: var(--s-thumb);
        border-radius: 50%;
        background: var(--s-thumb-color);
        box-shadow: 0 1px 2px color-mix(in srgb, var(--camo-color-scrim) 30%, transparent);
        transition:
          inset-inline-start var(--camo-motion-duration-short),
          inline-size var(--camo-motion-duration-short),
          block-size var(--camo-motion-duration-short);
      }
      :host([data-camo-pressed]) .thumb {
        inline-size: calc(var(--s-thumb) + 4px);
        block-size: calc(var(--s-thumb) + 4px);
      }
    `,
  ],
  render({ state, slots, theme, style }) {
    const c = theme.colors;
    const dim = `color-mix(in srgb, ${c.onSurface} 38%, transparent)`;
    const on = state.checked;
    const thumb = on ? style.thumbSizeOn : style.thumbSizeOff;
    // The thumb sits an even margin from the track's edge: the track height minus the thumb, halved.
    const margin = `calc((${style.trackHeight} - ${thumb}) / 2 - 2px)`;
    const start = on ? `calc(${style.trackWidth} - ${thumb} - ${margin} - 4px)` : margin;
    const vars = [
      `--s-track-width: ${style.trackWidth}`,
      `--s-track-height: ${style.trackHeight}`,
      `--s-thumb: ${thumb}`,
      `--s-thumb-start: ${start}`,
      `--s-track: ${on ? (state.disabled ? dim : c.primary) : c.surfaceContainerHighest}`,
      `--s-track-border: ${on ? "transparent" : state.disabled ? dim : c.outline}`,
      `--s-thumb-color: ${on ? c.onPrimary : state.disabled ? dim : c.outline}`,
    ].join("; ");
    const control = html`<span class="track" part="track"><span class="thumb" part="thumb"></span></span>`;
    return row(state, theme, style.labelPosition, style.labelGap, control, vars, slots.label);
  },
};

// --- Radio ----------------------------------------------------------------------------------------------------

export const radioBase: Base<ToggleState, ToggleSlots, RadioStyle> = {
  styles: [
    ROW,
    css`
      .ring {
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        inline-size: var(--r-size);
        block-size: var(--r-size);
        border: var(--r-border-width) solid var(--r-ring);
        border-radius: 50%;
      }
      .dot {
        inline-size: var(--r-dot);
        block-size: var(--r-dot);
        border-radius: 50%;
        background: var(--r-ring);
        transform: scale(var(--r-dot-scale));
        transition: transform var(--camo-motion-duration-short);
      }
    `,
  ],
  render({ state, slots, theme, style }) {
    const c = theme.colors;
    const dim = `color-mix(in srgb, ${c.onSurface} 38%, transparent)`;
    const ring = state.disabled
      ? dim
      : state.error !== null
        ? c.error
        : state.checked
          ? c.primary
          : c.onSurfaceVariant;
    const vars = [
      `--r-size: ${style.size}`,
      `--r-dot: ${style.dotSize}`,
      `--r-border-width: ${style.borderWidth}`,
      `--r-ring: ${ring}`,
      `--r-dot-scale: ${state.checked ? 1 : 0}`,
    ].join("; ");
    const control = html`<span class="ring" part="ring"><span class="dot"></span></span>`;
    return row(state, theme, style.labelPosition, style.labelGap, control, vars, slots.label);
  },
};

/** A radio drawn as a checkmark at the end of its row, as iOS draws a list of choices. */
export const checkmarkRadioBase: Base<ToggleState, ToggleSlots, RadioStyle> = {
  styles: [
    ROW,
    css`
      .tick {
        inline-size: var(--r-size);
        block-size: var(--r-size);
        fill: var(--camo-color-primary);
        opacity: var(--r-tick);
      }
    `,
  ],
  render({ state, slots, theme, style }) {
    const dim = `color-mix(in srgb, ${theme.colors.onSurface} 38%, transparent)`;
    const vars = [
      `--r-size: ${style.size}`,
      `--r-tick: ${state.checked ? 1 : 0}`,
      state.disabled ? `--camo-color-primary: ${dim}` : "",
    ].join("; ");
    const control = html`<svg class="tick" viewBox="0 0 24 24" aria-hidden="true"><path d=${CHECK} /></svg>`;
    return row(state, theme, style.labelPosition, style.labelGap, control, vars, slots.label);
  },
};

// --- Segmented control ----------------------------------------------------------------------------------------

export const segmentedControlBase: Base<
  SegmentedControlState,
  SegmentedControlSlots,
  SegmentedControlStyle
> = {
  styles: css`
    :host {
      display: inline-block;
      outline: none;
    }
    .track {
      box-sizing: border-box;
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: 1fr;
      min-block-size: var(--g-height);
      border: var(--g-border-width) solid var(--g-border);
      border-radius: var(--g-shape);
      background: var(--g-track);
      overflow: hidden;
      opacity: var(--g-opacity);
    }
    slot {
      display: contents;
    }
  `,
  render({ state, slots, theme, style }) {
    const c = theme.colors;
    const vars = [
      `--g-height: ${style.height}`,
      `--g-shape: ${style.shape}`,
      `--g-border-width: ${style.borderWidth}`,
      `--g-border: ${c.outline}`,
      `--g-track: ${c.surfaceContainer}`,
      `--g-opacity: ${state.disabled ? 0.38 : 1}`,
    ].join("; ");
    return html`<div class="track" part="track" style=${vars}><slot name=${slots.content}></slot></div>`;
  },
};

export const segmentBase: Base<SegmentState, SegmentSlots, SegmentStyle> = {
  styles: css`
    :host {
      display: flex;
      cursor: pointer;
      outline: none;
      min-block-size: 48px;
      -webkit-tap-highlight-color: transparent;
    }
    :host([disabled]) {
      cursor: default;
      opacity: 0.38;
    }
    .seg {
      flex: 1 1 auto;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--camo-spacing-xs);
      padding-inline: var(--camo-spacing-m);
      min-block-size: var(--g-height);
      margin-block: auto;
      color: var(--g-content);
      background: var(--g-fill);
      border-inline-start: var(--g-border-width) solid var(--g-divider);
      font: var(--g-font);
      white-space: nowrap;
      transition: background var(--camo-motion-duration-short);
    }
    :host(:focus-visible) .seg {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: -2px;
    }
    :host([data-camo-pressed]) .seg {
      opacity: 0.8;
    }
    /* By structure, not by state: a server render has no sibling count to put in a class. */
    :host(:first-child) .seg {
      border-inline-start-color: transparent;
    }
    svg {
      inline-size: var(--g-icon-size);
      block-size: var(--g-icon-size);
      fill: currentColor;
      flex: none;
    }
    slot {
      display: contents;
    }
  `,
  render({ state, slots, theme, style }) {
    const c = theme.colors;
    const t = theme.typography.labelLarge;
    const vars = [
      `--g-height: ${style.height}`,
      `--g-border-width: ${style.borderWidth}`,
      `--g-icon-size: ${style.iconSize}`,
      `--g-content: ${state.selected ? c.onSecondaryContainer : c.onSurface}`,
      `--g-fill: ${state.selected ? c.secondaryContainer : "transparent"}`,
      `--g-divider: ${c.outline}`,
      `--g-font: ${t.weight} ${t.size}/${t.lineHeight} ${t.family}`,
    ].join("; ");
    const check =
      state.selected && style.showCheckIcon && state.icon === null
        ? html`<svg viewBox="0 0 24 24" aria-hidden="true"><path d=${CHECK} /></svg>`
        : nothing;
    const icon =
      state.icon === null
        ? nothing
        : html`<svg viewBox=${state.icon.viewBox} aria-hidden="true">${unsafeSVG(state.icon.svg)}</svg>`;
    return html`<span class="seg ${state.position}" part="segment" style=${vars}
      >${check}${icon}${state.label === null ? nothing : html`<span>${state.label}</span>`}<slot
        name=${slots.content}
      ></slot
    ></span>`;
  },
};

// --- Slider ---------------------------------------------------------------------------------------------------

export const sliderBase: Base<SliderState, SliderSlots, SliderStyle> = {
  styles: css`
    :host {
      display: inline-block;
      min-inline-size: 120px;
      cursor: pointer;
      outline: none;
      touch-action: pan-y;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    :host([disabled]) {
      cursor: default;
    }
    .s {
      position: relative;
      box-sizing: border-box;
      min-block-size: 48px;
      display: flex;
      align-items: center;
      --s-frac: 0;
    }
    .rail {
      position: relative;
      flex: 1 1 auto;
      block-size: var(--s-track);
      border-radius: calc(var(--s-track) / 2);
      background: var(--s-inactive);
    }
    .fill {
      position: absolute;
      inset-block: 0;
      inset-inline-start: 0;
      inline-size: calc(var(--s-frac) * (100% - var(--s-thumb)) + var(--s-thumb) / 2);
      border-radius: inherit;
      background: var(--s-active);
    }
    .thumb {
      position: absolute;
      inset-block: 0;
      margin-block: auto;
      inset-inline-start: calc(var(--s-frac) * (100% - var(--s-thumb)));
      inline-size: var(--s-thumb);
      block-size: var(--s-thumb);
      border-radius: 50%;
      background: var(--s-handle);
      box-shadow: 0 1px 3px color-mix(in srgb, var(--camo-color-scrim) 35%, transparent);
      transition: transform var(--camo-motion-duration-short);
    }
    :host(:focus-visible) .thumb {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: 3px;
    }
    .s.dragging .thumb {
      transform: scale(1.15);
    }
    .stop {
      position: absolute;
      inset-block: 0;
      margin-block: auto;
      inline-size: 4px;
      block-size: 4px;
      border-radius: 50%;
      background: var(--s-stop);
      inset-inline-start: calc(var(--stop) * (100% - var(--s-thumb)) + var(--s-thumb) / 2 - 2px);
    }
    .bubble {
      position: absolute;
      inset-block-end: calc(100% - 4px);
      inset-inline-start: calc(var(--s-frac) * (100% - var(--s-thumb)) + var(--s-thumb) / 2);
      translate: -50% 0;
      padding: var(--camo-spacing-xs) var(--camo-spacing-s);
      border-radius: var(--camo-shape-small);
      background: var(--camo-color-inverse-surface);
      color: var(--camo-color-inverse-on-surface);
      font: var(--s-font);
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
    }
    .s.dragging .bubble {
      opacity: 1;
    }
  `,
  render({ state, theme, style }) {
    const c = theme.colors;
    const dim = `color-mix(in srgb, ${c.onSurface} 38%, transparent)`;
    const t = theme.typography.labelMedium;
    const vars = [
      `--s-frac: ${state.fraction}`,
      `--s-track: ${style.trackHeight}`,
      `--s-thumb: ${style.thumbSize}`,
      `--s-active: ${state.disabled ? dim : c.primary}`,
      `--s-inactive: ${c.secondaryContainer}`,
      `--s-handle: ${state.disabled ? dim : c.primary}`,
      `--s-stop: ${c.onSecondaryContainer}`,
      `--s-font: ${t.weight} ${t.size}/${t.lineHeight} ${t.family}`,
    ].join("; ");
    const marks =
      style.showStopMarks && state.stops > 1 && state.stops <= 101
        ? Array.from(
            { length: state.stops },
            (_, i) => html`<span class="stop" style="--stop: ${i / (state.stops - 1)}"></span>`,
          )
        : nothing;
    const bubble =
      style.showValueLabel && state.valueText !== null
        ? html`<span class="bubble" part="value-label" aria-hidden="true">${state.valueText}</span>`
        : nothing;
    return html`<div class="s ${state.dragging ? "dragging" : ""}" part="slider" style=${vars}>
      <div class="rail" part="rail">
        <span class="fill" part="fill"></span>${marks}<span class="thumb" part="thumb"></span>${bubble}
      </div>
    </div>`;
  },
};

// --- Stepper --------------------------------------------------------------------------------------------------

export const stepperBase: Base<StepperState, StepperSlots, StepperStyle> = {
  styles: css`
    :host {
      display: inline-block;
    }
    .p {
      box-sizing: border-box;
      display: inline-flex;
      align-items: stretch;
      min-block-size: var(--p-height);
      border: 1px solid var(--p-border);
      border-radius: var(--p-shape);
      background: var(--camo-color-surface);
      overflow: hidden;
      color: var(--p-text);
    }
    .p.focused {
      outline: 2px solid var(--p-focus);
      outline-offset: 1px;
    }
    .camo-input {
      box-sizing: border-box;
      min-inline-size: var(--p-value-min);
      inline-size: var(--p-value-min);
      margin: 0;
      padding: 0 var(--camo-spacing-s);
      border: 0;
      outline: none;
      background: transparent;
      color: inherit;
      font: var(--p-font);
      text-align: center;
      font-variant-numeric: tabular-nums;
    }
    .camo-step {
      all: unset;
      box-sizing: border-box;
      position: relative;
      flex: none;
      inline-size: var(--p-height);
      cursor: pointer;
      color: var(--p-glyph);
    }
    .camo-step[disabled] {
      cursor: default;
      color: color-mix(in srgb, var(--camo-color-on-surface) 38%, transparent);
    }
    .camo-step:focus-visible {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: -2px;
    }
    .camo-step::before,
    .camo-step::after {
      content: "";
      position: absolute;
      inset: 0;
      margin: auto;
      inline-size: var(--p-icon);
      block-size: 2px;
      border-radius: 1px;
      background: currentColor;
    }
    .camo-increase::after {
      transform: rotate(90deg);
    }
    .camo-decrease::after {
      display: none;
    }
    .camo-step:not([disabled]):hover {
      background: color-mix(in srgb, currentColor 8%, transparent);
    }
    .p.split {
      flex-direction: row;
    }
    .p.split .camo-input {
      text-align: start;
      flex: 1 1 auto;
    }
    .p.split .pair {
      display: flex;
      flex-direction: column;
      border-inline-start: 1px solid var(--p-border);
    }
    .p.split .camo-step {
      flex: 1 1 50%;
      inline-size: calc(var(--p-height) * 0.8);
    }
    .p.split .camo-step::before {
      inline-size: var(--p-icon);
    }
    .p.split .camo-decrease::before {
      inline-size: 0;
    }
    .p.split .camo-decrease::after {
      display: block;
      inline-size: 0;
      block-size: 0;
      border-inline: 4px solid transparent;
      border-block-start: 5px solid currentColor;
      background: none;
      transform: none;
    }
    .p.split .camo-increase::before {
      inline-size: 0;
      block-size: 0;
      border-inline: 4px solid transparent;
      border-block-end: 5px solid currentColor;
      background: none;
    }
    .p.split .camo-increase::after {
      display: none;
    }
  `,
  render({ state, theme, style, nodes }) {
    const c = theme.colors;
    const t = theme.typography.bodyLarge;
    const dim = `color-mix(in srgb, ${c.onSurface} 38%, transparent)`;
    const vars = [
      `--p-height: ${style.height}`,
      `--p-shape: ${style.shape}`,
      `--p-value-min: ${style.valueMinWidth}`,
      `--p-icon: ${style.iconSize}`,
      `--p-border: ${state.error ? c.error : c.outline}`,
      `--p-focus: ${state.error ? c.error : c.primary}`,
      `--p-text: ${state.disabled ? dim : c.onSurface}`,
      `--p-glyph: ${state.error ? c.error : c.primary}`,
      `--p-font: ${t.weight} ${t.size}/${t.lineHeight} ${t.family}`,
    ].join("; ");
    const body =
      style.layout === "split"
        ? html`${nodes?.["input"] ?? nothing}<span class="pair">${nodes?.["increase"] ?? nothing}${nodes?.["decrease"] ?? nothing}</span>`
        : html`${nodes?.["decrease"] ?? nothing}${nodes?.["input"] ?? nothing}${nodes?.["increase"] ?? nothing}`;
    return html`<div class="p ${style.layout} ${state.focused ? "focused" : ""}" part="stepper" style=${vars}>${body}</div>`;
  },
};
