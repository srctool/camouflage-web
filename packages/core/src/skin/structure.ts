// The shared drawing of the W4 containers: card, list item and section, accordion, skeleton, paged list. A skin supplies
// `defaults(theme)` and spreads the base. Pure.
import { css, html, nothing } from "lit";
import { camelOf } from "../theme/tokens.ts";
import type { CamoTheme } from "../theme/types.ts";
import { buttonColorsFor } from "./colors.ts";
import { surfaceColor } from "./primitives.ts";
import type {
  AccordionSlots,
  AccordionState,
  AccordionStyle,
  ButtonColors,
  CardSlots,
  CardState,
  CardStyle,
  ListItemSlots,
  ListItemState,
  ListItemStyle,
  ListSectionSlots,
  ListSectionState,
  ListSectionStyle,
  PagedListSlots,
  PagedListState,
  PagedListStyle,
  Renderer,
  SkeletonSlots,
  SkeletonState,
  SkeletonStyle,
} from "./types.ts";

type Base<State, Slots extends string, Style> = Pick<
  Renderer<State, Slots, Style>,
  "render" | "styles"
>;

const font = (x: CamoTheme["typography"]["bodyLarge"]): string =>
  `${x.weight} ${x.size}/${x.lineHeight} ${x.family}`;
const CHECK = "M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z";

// --- Card -----------------------------------------------------------------------------------------------------

/** The colors of a card for an appearance and a tone (the same rule as a button's). */
export function cardColorsFor(
  style: CardStyle,
  state: Pick<CardState, "appearance" | "tone">,
  theme: CamoTheme,
): ButtonColors {
  const clear: ButtonColors = { container: "transparent", content: style.outline.content };
  return buttonColorsFor(
    {
      solid: style.solid,
      soft: style.soft,
      raised: style.raised,
      outline: style.outline,
      ghost: clear,
      link: clear,
    },
    state.appearance,
    state.tone,
    theme,
  );
}

export const cardBase: Base<CardState, CardSlots, CardStyle> = {
  styles: css`
    :host {
      display: block;
      outline: none;
    }
    :host([clickable]) {
      cursor: pointer;
    }
    :host([disabled]) {
      cursor: default;
    }
    .card {
      display: flex;
      position: relative;
      color: var(--k-fg);
      opacity: var(--k-opacity);
    }
    .pad {
      padding: var(--k-padding);
      box-sizing: border-box;
      inline-size: 100%;
      min-inline-size: 0;
    }
    .check {
      position: absolute;
      inset-block-start: var(--camo-spacing-s);
      inset-inline-end: var(--camo-spacing-s);
      inline-size: 24px;
      block-size: 24px;
      border-radius: 50%;
      background: var(--camo-color-primary);
      fill: var(--camo-color-on-primary);
      display: grid;
      place-items: center;
    }
    .check svg {
      inline-size: 16px;
      block-size: 16px;
    }
    slot {
      display: block;
    }
  `,
  render({ state, theme, style, skin }) {
    const live = cardColorsFor(style, state, theme);
    const selected = state.selected === true;
    const border = selected
      ? `${style.selectedBorderWidth} solid ${style.selectedBorderColor}`
      : live.border === undefined
        ? undefined
        : `${style.borderWidth} solid ${live.border}`;
    const vars = [
      `--k-fg: ${live.content}`,
      `--k-padding: ${style.contentPadding}`,
      `--k-opacity: ${state.disabled ? 0.38 : 1}`,
      `--camo-content-color: ${live.content}`,
    ].join("; ");
    const body = skin.surfaceTreatment.decorate({
      child: html`<div class="pad"><slot></slot></div>`,
      color: live.container,
      shape: style.shape,
      elevation:
        state.appearance === "raised" && state.tone === "default"
          ? style.raisedElevation
          : theme.elevation.level0,
      border,
      block: true,
      theme,
    });
    const wrapped =
      state.clickable && !state.disabled
        ? skin.feedback.wrap({ child: body, contentColor: live.content, shape: style.shape, theme })
        : body;
    const check =
      selected && style.showSelectedCheck
        ? html`<span class="check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d=${CHECK} /></svg></span>`
        : nothing;
    return html`<div class="card" part="card" style=${vars}>${wrapped}${check}</div>`;
  },
};

// --- List item and section --------------------------------------------------------------------------------------

export const listItemBase: Base<ListItemState, ListItemSlots, ListItemStyle> = {
  styles: css`
    :host {
      display: block;
      outline: none;
      -webkit-tap-highlight-color: transparent;
    }
    :host([clickable]) {
      cursor: pointer;
    }
    :host([disabled]) {
      cursor: default;
    }
    .row {
      position: relative;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      min-block-size: var(--li-min);
      padding-block: var(--camo-spacing-s);
      padding-inline: var(--li-padding);
      background: var(--li-bg);
      color: var(--li-fg);
      opacity: var(--li-opacity);
      border-radius: inherit;
    }
    :host(:focus-visible) .row {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: -2px;
    }
    :host([clickable]:hover:not([disabled])) .row {
      background: color-mix(in srgb, var(--li-fg) 6%, var(--li-bg));
    }
    :host([data-camo-pressed]) .row {
      background: color-mix(in srgb, var(--li-fg) 12%, var(--li-bg));
    }
    .text {
      flex: 1 1 auto;
      min-inline-size: 0;
      display: flex;
      flex-direction: column;
    }
    .overline {
      font: var(--li-overline-font);
      color: var(--li-sub);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .headline {
      font: var(--li-headline-font);
    }
    .supporting {
      font: var(--li-supporting-font);
      color: var(--li-sub);
    }
    .overline:empty,
    .supporting:empty {
      display: none;
    }
    /* The gaps belong to the slotted widgets, so an empty slot takes none (and no :has on the host is needed). */
    .lead,
    .trail {
      display: contents;
      color: var(--li-sub);
      --camo-content-color: var(--li-sub);
      --camo-icon-size: var(--li-icon);
    }
    ::slotted([slot="leading"]) {
      flex: none;
      margin-inline-end: var(--li-leading-gap);
    }
    ::slotted([slot="trailing"]) {
      flex: none;
      margin-inline-start: var(--li-trailing-gap);
    }
    slot {
      display: contents;
    }
    /* A divider the section asks for, from where the text starts (inset) or from the edge. */
    .row::after {
      content: "";
      position: absolute;
      inset-inline: calc(var(--camo-li-inset, 0) * var(--li-text-start)) 0;
      inset-block-end: 0;
      border-block-end: var(--camo-li-divider, 0px) solid var(--camo-color-outline-variant);
    }
    :host(:last-child) .row::after {
      display: none;
    }
  `,
  render({ state, slots, theme, style }) {
    const c = theme.colors;
    const t = theme.typography;
    const min =
      state.lines === 1
        ? style.minHeightOneLine
        : state.lines === 2
          ? style.minHeightTwoLines
          : style.minHeightThreeLines;
    const vars = [
      `--li-min: ${min}`,
      `--li-padding: ${style.contentPadding}`,
      `--li-leading-gap: ${style.leadingGap}`,
      `--li-trailing-gap: ${style.trailingGap}`,
      `--li-icon: ${style.iconSize}`,
      `--li-text-start: ${style.contentPadding}`,
      `--li-bg: ${state.selected ? c.secondaryContainer : "transparent"}`,
      `--li-fg: ${state.selected ? c.onSecondaryContainer : c.onSurface}`,
      `--li-sub: ${state.selected ? c.onSecondaryContainer : c.onSurfaceVariant}`,
      `--li-opacity: ${state.disabled ? 0.38 : 1}`,
      `--li-headline-font: ${font(t.bodyLarge)}`,
      `--li-supporting-font: ${font(t.bodyMedium)}`,
      `--li-overline-font: ${font(t.labelSmall)}`,
    ].join("; ");
    return html`<div class="row" part="row" style=${vars}>
      <span class="lead"><slot name=${slots.leading}></slot></span>
      <span class="text"
        ><span class="overline" part="overline">${state.overline}</span
        ><span class="headline" part="headline">${state.headline}</span
        ><span class="supporting" part="supporting">${state.supporting}</span></span
      >
      <span class="trail"><slot name=${slots.trailing}></slot></span>
    </div>`;
  },
};

export const listSectionBase: Base<ListSectionState, ListSectionSlots, ListSectionStyle> = {
  styles: css`
    :host {
      display: block;
    }
    .sec {
      display: flex;
      flex-direction: column;
      gap: var(--camo-spacing-xs);
      margin-inline: var(--ls-margin);
    }
    .title,
    .footer {
      margin: 0;
      padding-inline: var(--camo-spacing-l);
      color: var(--camo-color-on-surface-variant);
    }
    .title {
      font: var(--ls-title-font);
    }
    .footer {
      font: var(--ls-footer-font);
    }
    .title:empty,
    .footer:empty {
      display: none;
    }
    .panel {
      background: var(--ls-bg);
      border-radius: var(--ls-shape);
      overflow: hidden;
      --camo-li-divider: var(--ls-divider);
      --camo-li-inset: var(--ls-inset);
    }
    slot {
      display: block;
    }
  `,
  render({ state, slots, theme, style }) {
    const t = theme.typography;
    const vars = [
      `--ls-bg: ${surfaceColor(state.level, theme)}`,
      `--ls-shape: ${style.sectionShape}`,
      `--ls-margin: ${style.inset ? theme.spacing.l : theme.spacing.none}`,
      `--ls-divider: ${style.dividers === "none" ? "0px" : "1px"}`,
      `--ls-inset: ${style.dividers === "inset" ? 1 : 0}`,
      `--ls-title-font: ${font(t.titleSmall)}`,
      `--ls-footer-font: ${font(t.bodySmall)}`,
    ].join("; ");
    return html`<section class="sec" part="section" style=${vars}>
      <h2 class="title" part="title">${state.title}</h2>
      <div class="panel" part="panel"><slot name=${slots.content}></slot></div>
      <p class="footer" part="footer">${state.footer}</p>
    </section>`;
  },
};

// --- Accordion --------------------------------------------------------------------------------------------------

export const accordionBase: Base<AccordionState, AccordionSlots, AccordionStyle> = {
  styles: css`
    :host {
      display: block;
    }
    .a {
      color: var(--ac-fg);
      background: var(--ac-bg);
    }
    h3 {
      margin: 0;
    }
    .head {
      all: unset;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: var(--camo-spacing-m);
      inline-size: 100%;
      min-block-size: var(--ac-min);
      padding-inline: var(--camo-spacing-l);
      cursor: pointer;
      color: inherit;
      opacity: var(--ac-opacity);
    }
    .head[aria-disabled="true"] {
      cursor: default;
    }
    .head:focus-visible {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: -2px;
    }
    .head:hover:not([aria-disabled="true"]) {
      background: color-mix(in srgb, currentColor 6%, transparent);
    }
    .head.start {
      flex-direction: row-reverse;
      justify-content: flex-end;
    }
    .titles {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      min-inline-size: 0;
    }
    .head.start .titles {
      flex: 0 1 auto;
    }
    .title {
      font: var(--ac-title-font);
    }
    .subtitle {
      font: var(--ac-subtitle-font);
      color: var(--camo-color-on-surface-variant);
    }
    .subtitle:empty {
      display: none;
    }
    .lead {
      display: contents;
      color: var(--camo-color-on-surface-variant);
      --camo-content-color: var(--camo-color-on-surface-variant);
    }
    .ind {
      position: relative;
      flex: none;
      inline-size: 24px;
      block-size: 24px;
    }
    .ind::before,
    .ind::after {
      content: "";
      position: absolute;
      inset: 0;
      margin: auto;
    }
    .chevron .ind::before {
      inline-size: 8px;
      block-size: 8px;
      border-inline-end: 2px solid currentColor;
      border-block-end: 2px solid currentColor;
      rotate: 45deg;
      translate: 0 -2px;
      transition: rotate var(--camo-motion-duration-short);
    }
    .chevron.open .ind::before {
      rotate: 225deg;
      translate: 0 2px;
    }
    .plus-minus .ind::before,
    .plus-minus .ind::after {
      inline-size: 12px;
      block-size: 2px;
      background: currentColor;
      border-radius: 1px;
    }
    .plus-minus .ind::after {
      rotate: 90deg;
      transition: rotate var(--camo-motion-duration-short);
    }
    .plus-minus.open .ind::after {
      rotate: 0deg;
    }
    .panel {
      padding: 0 var(--camo-spacing-l) var(--ac-pad);
    }
    .panel[hidden] {
      display: none;
    }
    slot {
      display: contents;
    }
  `,
  render({ state, slots, theme, style }) {
    const t = theme.typography;
    const vars = [
      `--ac-min: ${style.headerMinHeight}`,
      `--ac-pad: ${style.contentPadding}`,
      `--ac-fg: ${theme.colors.onSurface}`,
      `--ac-bg: transparent`,
      `--ac-opacity: ${state.disabled ? 0.38 : 1}`,
      `--ac-title-font: ${font(t.bodyLarge)}`,
      `--ac-subtitle-font: ${font(t.bodyMedium)}`,
    ].join("; ");
    return html`<div class="a ${style.indicator} ${state.expanded ? "open" : ""}" part="accordion" style=${vars}>
      <h3>
        <button
          class="head ${style.indicatorPosition}"
          type="button"
          id="head"
          aria-expanded=${state.expanded ? "true" : "false"}
          aria-controls="panel"
          aria-disabled=${state.disabled ? "true" : "false"}
          @click=${() => !state.disabled && state.actions.toggle()}
        >
          <span class="lead"><slot name=${slots.leading}></slot></span>
          <span class="titles"
            ><span class="title">${state.title}</span><span class="subtitle">${state.subtitle}</span></span
          >
          <span class="ind" aria-hidden="true"></span>
        </button>
      </h3>
      <div class="panel" id="panel" role="region" aria-labelledby="head" ?hidden=${!state.expanded}>
        <slot name=${slots.content}></slot>
      </div>
    </div>`;
  },
};

// --- Skeleton ---------------------------------------------------------------------------------------------------

export const skeletonBase: Base<SkeletonState, SkeletonSlots, SkeletonStyle> = {
  styles: css`
    :host {
      display: block;
    }
    :host([variant="circle"]) {
      display: inline-block;
    }
    .sk {
      display: block;
      background-color: var(--sk-base);
      background-image: linear-gradient(90deg, transparent, var(--sk-hi), transparent);
      background-size: 200% 100%;
      background-repeat: no-repeat;
      animation: var(--sk-anim);
      animation-delay: var(--sk-delay);
    }
    .sk.pulse {
      background-image: none;
    }
    @keyframes camo-shimmer {
      from {
        background-position: 200% 0;
      }
      to {
        background-position: -100% 0;
      }
    }
    @keyframes camo-pulse {
      50% {
        opacity: 0.5;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .sk {
        animation: none;
      }
    }
    .lines {
      display: flex;
      flex-direction: column;
      gap: var(--sk-gap);
    }
    .row {
      display: flex;
      align-items: center;
      gap: var(--camo-spacing-l);
      padding-block: var(--camo-spacing-s);
    }
    .row .lines {
      flex: 1 1 auto;
    }
  `,
  render({ state, theme, style }) {
    const shape = theme.shapes[camelOf(state.shape) as keyof CamoTheme["shapes"]];
    const anim =
      style.animation === "none"
        ? "none"
        : style.animation === "pulse"
          ? `camo-pulse ${style.cycleDuration} ease-in-out infinite`
          : `camo-shimmer ${style.cycleDuration} linear infinite`;
    const vars = [
      `--sk-base: ${style.baseColor}`,
      `--sk-hi: ${style.highlightColor}`,
      `--sk-anim: ${anim}`,
      `--sk-delay: -${Math.round(state.phase)}ms`,
      `--sk-gap: ${style.textLineGap}`,
    ].join("; ");
    const cls = `sk ${style.animation === "pulse" ? "pulse" : ""}`;
    const lineHeight = theme.typography.bodyMedium.lineHeight;
    const text = (lines: number, last: number): ReturnType<typeof html> =>
      html`<span class="lines"
        >${Array.from(
          { length: lines },
          (_, i) =>
            html`<span
            class=${cls}
            style="block-size: ${lineHeight}; border-radius: ${theme.shapes.small}; inline-size: ${i === lines - 1 && lines > 1 ? `${Math.round(last * 100)}%` : "100%"}"
          ></span>`,
        )}</span
      >`;
    let body;
    if (state.variant === "text") body = text(Math.max(1, state.lines), state.lastLineFraction);
    else if (state.variant === "circle") {
      const size = state.size ?? "40px";
      body = html`<span class=${cls} style="inline-size: ${size}; block-size: ${size}; border-radius: ${theme.shapes.full}"></span>`;
    } else if (state.variant === "list-item") {
      const lead =
        state.leading === "none"
          ? nothing
          : html`<span
              class=${cls}
              style="flex: none; inline-size: 40px; block-size: 40px; border-radius: ${state.leading === "circle" ? theme.shapes.full : theme.shapes.small}"
            ></span>`;
      body = html`<span class="row">${lead}${text(Math.max(1, state.lines), state.lastLineFraction)}</span>`;
    } else
      body = html`<span
        class=${cls}
        style="inline-size: ${state.width ?? "100%"}; block-size: ${state.height ?? "1rem"}; border-radius: ${shape}"
      ></span>`;
    return html`<span style=${vars} aria-hidden="true" part="skeleton">${body}</span>`;
  },
};

// --- Paged list -------------------------------------------------------------------------------------------------

export const pagedListBase: Base<PagedListState, PagedListSlots, PagedListStyle> = {
  styles: css`
    :host {
      display: block;
    }
    .pl {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--pl-gap);
    }
    .sr {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    .refresh {
      display: flex;
      justify-content: center;
      block-size: calc(var(--pl-ind) * var(--pl-pull));
      overflow: hidden;
      transition: block-size var(--camo-motion-duration-short);
    }
    .spinner {
      inline-size: var(--pl-ind);
      block-size: var(--pl-ind);
      box-sizing: border-box;
      border: 2px solid var(--camo-color-primary);
      border-inline-end-color: transparent;
      border-radius: 50%;
      animation: camo-spin calc(var(--camo-motion-duration-medium) * 3) linear infinite;
      align-self: center;
    }
    @keyframes camo-spin {
      to {
        transform: rotate(1turn);
      }
    }
    .state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--camo-spacing-s);
      padding: var(--camo-spacing-xl) var(--camo-spacing-l);
      text-align: center;
      color: var(--camo-color-on-surface-variant);
    }
    .state .t {
      font: var(--pl-title-font);
      color: var(--camo-color-on-surface);
    }
    .state .m {
      font: var(--pl-body-font);
    }
    .m:empty {
      display: none;
    }
    .retry {
      all: unset;
      box-sizing: border-box;
      cursor: pointer;
      padding: var(--camo-spacing-s) var(--camo-spacing-l);
      min-block-size: 48px;
      display: inline-flex;
      align-items: center;
      color: var(--camo-color-primary);
      font: var(--pl-label-font);
    }
    .retry:focus-visible {
      outline: 2px solid var(--camo-color-primary);
    }
    .more {
      display: flex;
      justify-content: center;
      padding: var(--camo-spacing-m);
    }
    slot {
      display: contents;
    }
  `,
  render({ state, slots, theme, style, nodes }) {
    const t = theme.typography;
    const vars = [
      `--pl-gap: ${style.gap}`,
      `--pl-ind: ${style.indicatorSize}`,
      `--pl-pull: ${state.refreshing ? 1 : state.pull}`,
      `--pl-title-font: ${font(t.titleMedium)}`,
      `--pl-body-font: ${font(t.bodyMedium)}`,
      `--pl-label-font: ${font(t.labelLarge)}`,
    ].join("; ");
    const x = state.texts;
    const firstLoading =
      state.loading === "initial" || (state.loading === "refresh" && state.isEmpty);
    const firstError = state.errorScope === "first-page";
    const status =
      firstLoading || state.loading === "refresh"
        ? x.loadingLabel
        : state.loading === "more"
          ? x.loadingMoreLabel
          : "";
    return html`<div class="pl" part="list" style=${vars}>
      <div class="sr" role="status" aria-live="polite">${status}</div>
      <div class="refresh" aria-hidden="true">${state.refreshing || state.pull > 0 ? html`<span class="spinner"></span>` : nothing}</div>
      ${
        firstError
          ? html`<slot name=${slots.error}
            ><div class="state" part="error">
              <span class="t">${x.errorTitle}</span><span class="m">${state.errorMessage}</span>
              <button class="retry" type="button" @click=${() => state.actions.retry()}>${x.retryLabel}</button>
            </div></slot
          >`
          : nothing
      }
      ${nodes?.["skeletons"] !== undefined && firstLoading ? nodes["skeletons"] : nothing}
      ${
        !firstError && !firstLoading && state.isEmpty && state.loading === "none"
          ? html`<slot name=${slots.empty}
            ><div class="state" part="empty"><span class="t">${x.emptyTitle}</span><span class="m">${x.emptyMessage}</span></div></slot
          >`
          : nothing
      }
      <div role="list" aria-label=${state.label ?? nothing} aria-busy=${state.loading === "none" ? "false" : "true"}>
        ${nodes?.["items"] ?? nothing}
      </div>
      ${state.loading === "more" ? html`<div class="more">${nodes?.["skeletons"] ?? nothing}</div>` : nothing}
      ${
        state.errorScope === "next-page"
          ? html`<div class="state" part="retry-row">
            <span class="m">${state.errorMessage}</span>
            <button class="retry" type="button" @click=${() => state.actions.retry()}>${x.retryLabel}</button>
          </div>`
          : nothing
      }
    </div>`;
  },
};
