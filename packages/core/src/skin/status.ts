// The shared drawing of the W5 feedback components: progress bar and circle, snackbar, banner. A skin supplies
// `defaults(theme)` and spreads the base. Pure.
import { css, html, nothing, svg } from "lit";
import type { TemplateResult } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { cssBlock } from "../style.ts";
import type { CamoTextStyle, CamoTheme } from "../theme/types.ts";
import { toneFamily } from "./colors.ts";
import type {
  BannerColors,
  BannerSlots,
  BannerState,
  BannerStyle,
  IconArtwork,
  ProgressBarSlots,
  ProgressBarStyle,
  ProgressCircleSlots,
  ProgressCircleState,
  ProgressCircleStyle,
  ProgressState,
  Renderer,
  SnackbarSlots,
  SnackbarState,
  SnackbarStyle,
  Tone,
} from "./types.ts";

type Base<State, Slots extends string, Style> = Pick<
  Renderer<State, Slots, Style>,
  "render" | "styles"
>;

const font = (x: CamoTextStyle): string => `${x.weight} ${x.size}/${x.lineHeight} ${x.family}`;

const icon = (art: IconArtwork): TemplateResult =>
  html`<svg viewBox=${art.viewBox} aria-hidden="true" focusable="false">${unsafeSVG(art.svg)}</svg>`;

// --- Progress ---------------------------------------------------------------------------------------------------

/** The active and track colors of a progress indicator: the style's own for the default tone, the tone's family otherwise. */
export function progressColors(
  style: Pick<ProgressBarStyle, "active" | "track">,
  tone: Tone,
  theme: CamoTheme,
): { active: string; track: string } {
  if (tone === "default") return { active: style.active, track: style.track };
  const f = toneFamily(theme, tone);
  return { active: f.strong, track: f.container };
}

/** The value text a screen reader reads for a determinate indicator. */
export function progressText(progress: number | null): string | null {
  return progress === null ? null : `${Math.round(progress * 100)}%`;
}

export const progressBarBase: Base<ProgressState, ProgressBarSlots, ProgressBarStyle> = {
  styles: css`
    :host {
      display: block;
      inline-size: 100%;
    }
    .bar {
      position: relative;
      display: flex;
      align-items: stretch;
      gap: var(--pb-gap);
      block-size: var(--pb-height);
      overflow: hidden;
      border-radius: var(--pb-shape);
    }
    .track {
      flex: 1 1 0;
      min-inline-size: 0;
      background: var(--pb-track);
      border-radius: var(--pb-shape);
    }
    .fill {
      flex: 0 0 auto;
      background: var(--pb-active);
      border-radius: var(--pb-shape);
      transition: inline-size var(--camo-motion-duration-medium) var(--camo-motion-easing-standard);
    }
    .stop {
      position: absolute;
      inset-inline-end: 0;
      inset-block: 0;
      inline-size: var(--pb-height);
      border-radius: 50%;
      background: var(--pb-active);
      scale: 0.5;
    }
    .bar.indeterminate {
      background: var(--pb-track);
    }
    .indeterminate .fill {
      position: absolute;
      inset-block: 0;
      inline-size: 40%;
      inset-inline-start: -40%;
      animation: camo-bar-sweep var(--pb-cycle) var(--camo-motion-easing-standard) infinite;
    }
    @keyframes camo-bar-sweep {
      from {
        inset-inline-start: -40%;
      }
      to {
        inset-inline-start: 100%;
      }
    }
    @keyframes camo-bar-pulse {
      0%,
      100% {
        opacity: 0.4;
      }
      50% {
        opacity: 1;
      }
    }
    /* Reduced motion: a slow pulse of the whole bar instead of a sweep. */
    @media (prefers-reduced-motion: reduce) {
      .indeterminate .fill {
        inset-inline-start: 0;
        inline-size: 100%;
        animation: camo-bar-pulse var(--pb-cycle) ease-in-out infinite;
      }
      .fill {
        transition: none;
      }
    }
  `,
  render({ state, theme, style }) {
    const colors = progressColors(style, state.tone, theme);
    const vars = [
      `--pb-height: ${style.barHeight}`,
      `--pb-shape: ${style.shape}`,
      `--pb-active: ${colors.active}`,
      `--pb-track: ${colors.track}`,
      `--pb-cycle: ${style.cycleDuration}`,
    ];
    if (state.progress === null) {
      return html`<div class="bar indeterminate" part="bar" style=${vars.join("; ")}>
        <div class="fill"></div>
      </div>`;
    }
    const p = Math.min(Math.max(state.progress, 0), 1);
    // The gap exists only while both the active part and the rest of the track are visible.
    const gap = p > 0 && p < 1 ? style.trackGap : "0px";
    return html`<div
      class="bar"
      part="bar"
      style=${[...vars, `--pb-gap: ${gap}`].join("; ")}
    >
      <div class="fill" style="inline-size: ${p * 100}%"></div>
      ${p < 1 ? html`<div class="track"></div>` : nothing}
      ${style.showStopIndicator && p < 1 ? html`<span class="stop" part="stop"></span>` : nothing}
    </div>`;
  },
};

export const progressCircleBase: Base<
  ProgressCircleState,
  ProgressCircleSlots,
  ProgressCircleStyle
> = {
  styles: css`
    :host {
      display: inline-block;
      line-height: 0;
    }
    svg {
      display: block;
      inline-size: var(--pc-size);
      block-size: var(--pc-size);
      overflow: visible;
    }
    .determinate {
      rotate: -90deg;
      transform-origin: center;
    }
    circle {
      cx: 50%;
      cy: 50%;
      r: calc(50% - var(--pc-stroke) / 2);
      fill: none;
      stroke-width: var(--pc-stroke);
    }
    .ring {
      stroke: var(--pc-track);
    }
    .arc {
      stroke: var(--pc-active);
      stroke-linecap: round;
      stroke-dasharray: 1;
      stroke-dashoffset: var(--pc-offset);
      transition: stroke-dashoffset var(--camo-motion-duration-medium)
        var(--camo-motion-easing-standard);
    }
    .spin {
      transform-origin: center;
      animation: camo-ring-spin var(--pc-cycle) linear infinite;
    }
    .spokes line {
      stroke: var(--pc-active);
      stroke-width: var(--pc-stroke);
      stroke-linecap: round;
      vector-effect: non-scaling-stroke;
      animation: camo-spoke var(--pc-cycle) linear infinite;
      animation-delay: calc(var(--i) * var(--pc-cycle) / 12 - var(--pc-cycle));
    }
    @keyframes camo-ring-spin {
      to {
        rotate: 360deg;
      }
    }
    @keyframes camo-spoke {
      from {
        opacity: 1;
      }
      to {
        opacity: 0.15;
      }
    }
    @keyframes camo-ring-pulse {
      0%,
      100% {
        opacity: 0.4;
      }
      50% {
        opacity: 1;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .spin,
      .spokes {
        animation: camo-ring-pulse var(--pc-cycle) ease-in-out infinite;
      }
      .spokes line {
        animation: none;
      }
      .arc {
        transition: none;
      }
    }
  `,
  render({ state, theme, style }) {
    const colors = progressColors(style, state.tone, theme);
    const size = {
      small: style.circleSizeSmall,
      medium: style.circleSizeMedium,
      large: style.circleSizeLarge,
    }[state.size];
    const vars = [
      `--pc-size: ${size}`,
      `--pc-stroke: ${style.circleStroke}`,
      `--pc-active: ${colors.active}`,
      `--pc-track: ${colors.track}`,
      `--pc-cycle: ${style.cycleDuration}`,
    ];
    if (state.progress === null && style.indeterminate === "spokes") {
      const spokes = Array.from({ length: 12 }, (_, i) => i);
      return html`<svg
        class="spokes"
        viewBox="0 0 100 100"
        style=${vars.join("; ")}
        aria-hidden="true"
        part="circle"
      >
        ${spokes.map(
          (i) => svg`<line
            x1="50"
            y1="6"
            x2="50"
            y2="26"
            transform="rotate(${i * 30} 50 50)"
            style="--i: ${i}"
          ></line>`,
        )}
      </svg>`;
    }
    // An unknown amount is a quarter of the ring, spinning; a fraction is that part of the ring.
    const p = state.progress === null ? 0.28 : Math.min(Math.max(state.progress, 0), 1);
    return html`<svg
      class=${state.progress === null ? "spin" : "determinate"}
      style=${[...vars, `--pc-offset: ${1 - p}`].join("; ")}
      aria-hidden="true"
      part="circle"
    >
      <circle class="ring"></circle>
      <circle class="arc" pathLength="1"></circle>
    </svg>`;
  },
};

// --- Snackbar ---------------------------------------------------------------------------------------------------

const CLOSE =
  "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z";

/** The dismiss button's drawing, for the node core builds. */
export const closeIcon: TemplateResult = html`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d=${CLOSE} />
</svg>`;

export const snackbarBase: Base<SnackbarState, SnackbarSlots, SnackbarStyle> = {
  styles: css`
    :host {
      position: fixed;
      inset: auto;
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
      overflow: visible;
      color: inherit;
      box-sizing: border-box;
      max-inline-size: calc(100% - 2 * var(--sb-margin));
      inline-size: max-content;
      min-inline-size: 0;
      animation: camo-snack-in var(--camo-motion-duration-medium) var(--camo-motion-easing-emphasized);
    }
    :host([data-position="bottom"]) {
      inset-block-end: calc(var(--sb-margin) + var(--camo-messenger-inset-bottom, 0px));
    }
    :host([data-position="top"]) {
      inset-block-start: calc(var(--sb-margin) + var(--camo-messenger-inset-top, 0px));
    }
    :host([data-alignment="start"]) {
      inset-inline-start: var(--sb-margin);
    }
    :host([data-alignment="end"]) {
      inset-inline-end: var(--sb-margin);
    }
    :host([data-alignment="center"]) {
      inset-inline: 0;
      margin-inline: auto;
    }
    /* A compact window (below 600) has no side to hold to: the snackbar is centered (Fluent's and Carbon's toasts). */
    @media (width < 600px) {
      :host([data-alignment]) {
        inset-inline: 0;
        margin-inline: auto;
      }
    }
    @keyframes camo-snack-in {
      from {
        opacity: 0;
        translate: 0 var(--sb-from);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :host {
        animation: none;
      }
    }
    .snack {
      display: flex;
      align-items: center;
      gap: var(--camo-spacing-m);
      box-sizing: border-box;
      min-block-size: var(--sb-min-height);
      max-inline-size: var(--sb-max-width);
      padding: var(--sb-padding);
      color: var(--sb-fg);
      font: var(--sb-font);
      --camo-content-color: var(--sb-fg);
      --camo-icon-size: var(--sb-icon);
    }
    .icon {
      display: inline-flex;
      flex: none;
      inline-size: var(--sb-icon);
      block-size: var(--sb-icon);
      fill: currentColor;
    }
    .icon svg {
      inline-size: 100%;
      block-size: 100%;
    }
    .message {
      flex: 1 1 auto;
      min-inline-size: 0;
      overflow-wrap: anywhere;
    }
    .action,
    .dismiss {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
      cursor: pointer;
      border-radius: var(--camo-shape-small);
      min-block-size: 48px;
      margin-block: -8px;
    }
    .action {
      padding-inline: var(--camo-spacing-m);
      color: var(--sb-action);
      font: var(--sb-action-font);
    }
    .dismiss {
      inline-size: 48px;
      color: var(--sb-fg);
    }
    .dismiss svg {
      inline-size: 20px;
      block-size: 20px;
      fill: currentColor;
    }
    .action:focus-visible,
    .dismiss:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: -2px;
    }
  `,
  render({ state, theme, style, skin, nodes }) {
    const live =
      state.tone === "default"
        ? { container: style.container, content: style.content, action: style.action }
        : (() => {
            const f = toneFamily(theme, state.tone);
            return { container: f.container, content: f.onContainer, action: f.onContainer };
          })();
    const vars = [
      `--sb-max-width: ${style.maxWidth}`,
      `--sb-min-height: ${style.minHeight}`,
      `--sb-padding: ${style.padding}`,
      `--sb-fg: ${live.content}`,
      `--sb-action: ${live.action}`,
      `--sb-font: ${font(style.textStyle)}`,
      `--sb-action-font: ${font(style.actionStyle)}`,
      `--sb-icon: ${style.iconSize}`,
    ].join("; ");
    // The host's own rules (where it sits, how it enters) read these, so they are set on the host.
    const host = cssBlock(
      `:host { --sb-margin: ${style.margin}; --sb-from: ${state.position === "top" ? "-100%" : "100%"}; }`,
    );
    return html`${host}${skin.surfaceTreatment.decorate({
      child: html`<div class="snack" part="snackbar" style=${vars}>
        ${
          state.showToneIcon && state.toneIcon !== null
            ? html`<span class="icon" part="icon">${icon(state.toneIcon)}</span>`
            : nothing
        }
        <span class="message" part="message">${state.message}</span>
        ${nodes?.["action"] ?? nothing}${nodes?.["dismiss"] ?? nothing}
      </div>`,
      color: live.container,
      shape: style.shape,
      elevation: style.elevation,
      block: true,
      theme,
    })}`;
  },
};

// --- Banner -----------------------------------------------------------------------------------------------------

/** The colors of a banner for an appearance and a tone: the style's own for the default tone, the tone's family otherwise. */
export function bannerColorsFor(
  style: Pick<BannerStyle, "soft" | "solid" | "outline">,
  appearance: BannerState["appearance"],
  tone: Tone,
  theme: CamoTheme,
): BannerColors {
  const base =
    appearance === "solid" ? style.solid : appearance === "outline" ? style.outline : style.soft;
  if (tone === "default") return base;
  const f = toneFamily(theme, tone);
  if (appearance === "solid")
    return { container: f.strong, content: f.onStrong, accent: f.onStrong };
  if (appearance === "outline")
    return {
      container: base.container,
      content: base.content,
      accent: f.strong,
      border: f.strong,
    };
  return { container: f.container, content: f.onContainer, accent: f.strong };
}

export const bannerBase: Base<BannerState, BannerSlots, BannerStyle> = {
  styles: css`
    :host {
      display: block;
    }
    .banner {
      display: flex;
      align-items: flex-start;
      gap: var(--camo-spacing-m);
      box-sizing: border-box;
      padding: var(--bn-padding);
      color: var(--bn-fg);
      --camo-content-color: var(--bn-accent);
      --camo-icon-size: var(--bn-icon);
      border-inline-start: var(--bn-accent-width) solid var(--bn-accent);
    }
    .icon {
      display: inline-flex;
      flex: none;
      inline-size: var(--bn-icon);
      block-size: var(--bn-icon);
      color: var(--bn-accent);
      fill: currentColor;
    }
    .icon svg {
      inline-size: 100%;
      block-size: 100%;
    }
    .texts {
      flex: 1 1 auto;
      min-inline-size: 0;
      display: flex;
      flex-direction: column;
      gap: var(--camo-spacing-xs);
    }
    .title {
      margin: 0;
      font: var(--bn-title-font);
    }
    .message {
      margin: 0;
      font: var(--bn-message-font);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--camo-spacing-s);
      margin-block-start: var(--camo-spacing-s);
    }
    .actions slot {
      display: contents;
    }
    .actions {
      --camo-action-color: var(--bn-accent);
    }
    .dismiss {
      all: unset;
      box-sizing: border-box;
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 48px;
      block-size: 48px;
      margin: -12px;
      margin-inline-start: 0;
      cursor: pointer;
      border-radius: 50%;
      color: var(--bn-fg);
    }
    .dismiss svg {
      inline-size: 20px;
      block-size: 20px;
      fill: currentColor;
    }
    .dismiss:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: -2px;
    }
  `,
  render({ state, slots, theme, style, skin, nodes }) {
    const live = bannerColorsFor(style, state.appearance, state.tone, theme);
    const vars = [
      `--bn-padding: ${style.padding}`,
      `--bn-fg: ${live.content}`,
      `--bn-accent: ${live.accent}`,
      `--bn-accent-width: ${style.accentBorder ? style.accentWidth : "0px"}`,
      `--bn-icon: ${style.iconSize}`,
      `--bn-title-font: ${font(style.titleStyle)}`,
      `--bn-message-font: ${font(style.messageStyle)}`,
    ].join("; ");
    return skin.surfaceTreatment.decorate({
      child: html`<div class="banner" part="banner" style=${vars}>
        <span class="icon" part="icon"
          ><slot name=${slots.icon}>${icon(state.toneIcon)}</slot></span
        >
        <div class="texts">
          ${state.title === null ? nothing : html`<p class="title" part="title">${state.title}</p>`}
          <p class="message" part="message">${state.message}</p>
          <div class="actions" part="actions"><slot name=${slots.actions}></slot></div>
        </div>
        ${nodes?.["dismiss"] ?? nothing}
      </div>`,
      color: live.container,
      shape: style.shape,
      elevation: theme.elevation.level0,
      border: live.border === undefined ? undefined : `${style.borderWidth} solid ${live.border}`,
      block: true,
      theme,
    });
  },
};
