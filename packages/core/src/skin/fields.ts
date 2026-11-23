// The shared drawing of the W3 field renderers: text field and search field. A skin supplies `defaults(theme)` and
// spreads the base, as for the W2 primitives. The editable node arrives pre-built in `nodes.input` (core owns it, so it
// filters, formats and keeps the cursor); the renderer places it and draws everything around it.
import { css, html, nothing } from "lit";
import { FIELD_IDS } from "./ids.ts";
import type {
  Renderer,
  SearchFieldSlots,
  SearchFieldState,
  SearchFieldStyle,
  TextFieldSlots,
  TextFieldState,
  TextFieldStyle,
} from "./types.ts";

type Base<State, Slots extends string, Style> = Pick<
  Renderer<State, Slots, Style>,
  "render" | "styles"
>;

const none = nothing;

export const textFieldBase: Base<TextFieldState, TextFieldSlots, TextFieldStyle> = {
  styles: css`
    :host {
      display: inline-block;
      min-inline-size: 0;
    }
    .f {
      display: flex;
      flex-direction: column;
      gap: var(--camo-spacing-xs);
      color: var(--f-text);
    }
    .label {
      font: var(--f-label-font);
      color: var(--f-label-color);
    }
    .box {
      position: relative;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: var(--camo-spacing-s);
      min-block-size: var(--f-height);
      padding-inline: var(--f-padding);
      border: var(--f-border-width) solid var(--f-border-color);
      border-radius: var(--f-shape);
      background: var(--f-container);
      transition: border-color var(--camo-motion-duration-short);
    }
    .f.focused .box {
      border-color: var(--f-focus-color);
      outline: 1px solid var(--f-focus-color);
    }
    .f.floating .label {
      position: absolute;
      inset-inline-start: var(--f-padding);
      inset-block-start: calc(var(--f-height) / 2);
      translate: 0 -50%;
      pointer-events: none;
      transition:
        inset-block-start var(--camo-motion-duration-short),
        font-size var(--camo-motion-duration-short);
      background: var(--f-container);
      padding-inline: var(--camo-spacing-xxs);
      margin-inline-start: calc(var(--camo-spacing-xxs) * -1);
    }
    .f.floating.raised .label {
      inset-block-start: 0;
      font: var(--f-label-small-font);
    }
    .f.floating .box {
      margin-block-start: 0;
    }
    .inputwrap {
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      gap: var(--camo-spacing-xs);
      min-inline-size: 0;
    }
    .camo-input {
      flex: 1 1 auto;
      min-inline-size: 0;
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      border: 0;
      outline: none;
      background: transparent;
      color: var(--f-text);
      font: var(--f-input-font);
      caret-color: var(--camo-color-primary);
    }
    textarea.camo-input {
      resize: vertical;
      min-block-size: 3lh;
      padding-block: var(--camo-spacing-s);
    }
    .camo-input::placeholder {
      color: var(--f-placeholder);
    }
    .affix {
      color: var(--f-placeholder);
      font: var(--f-input-font);
      white-space: nowrap;
      visibility: var(--f-affix-visibility);
    }
    ::slotted(*) {
      flex: none;
      color: var(--f-icon-color);
      --camo-content-color: var(--f-icon-color);
      --camo-icon-size: var(--f-icon-size);
    }
    slot {
      display: contents;
    }
    .support {
      font: var(--f-support-font);
      color: var(--f-support-color);
      padding-inline: var(--f-padding);
    }
    .support:empty {
      display: none;
    }
  `,

  render({ state, slots, theme, style, nodes }) {
    const c = theme.colors;
    const t = theme.typography;
    const font = (x: typeof t.bodyLarge): string =>
      `${x.weight} ${x.size}/${x.lineHeight} ${x.family}`;
    const error = state.error !== null;
    const floating = state.labelPlacement === "floating" && state.label !== null;
    const raised = state.focused || !state.isEmpty || state.placeholder !== null;
    const disabledText = `color-mix(in srgb, ${c.onSurface} 38%, transparent)`;
    const borderColor = state.disabled ? disabledText : error ? c.error : c.outline;
    const vars = [
      `--f-height: ${style.height}`,
      `--f-padding: ${style.padding}`,
      `--f-border-width: ${style.borderWidth}`,
      `--f-shape: ${style.shape}`,
      `--f-icon-size: ${style.iconSize}`,
      `--f-container: ${c.surface}`,
      `--f-text: ${state.disabled ? disabledText : c.onSurface}`,
      `--f-border-color: ${borderColor}`,
      `--f-focus-color: ${error ? c.error : c.primary}`,
      `--f-label-color: ${error ? c.error : state.focused ? c.primary : c.onSurfaceVariant}`,
      `--f-placeholder: ${state.disabled ? disabledText : c.onSurfaceVariant}`,
      `--f-icon-color: ${error ? c.error : state.disabled ? disabledText : c.onSurfaceVariant}`,
      `--f-support-color: ${error ? c.error : c.onSurfaceVariant}`,
      `--f-input-font: ${font(t.bodyLarge)}`,
      `--f-label-font: ${font(t.bodySmall)}`,
      `--f-label-small-font: ${font(t.bodySmall)}`,
      `--f-support-font: ${font(t.bodySmall)}`,
      `--f-affix-visibility: ${state.focused || !state.isEmpty ? "visible" : "hidden"}`,
    ].join("; ");
    const classes = [
      "f",
      floating ? "floating" : "above",
      raised ? "raised" : "",
      state.focused ? "focused" : "",
      error ? "error" : "",
    ]
      .filter((x) => x !== "")
      .join(" ");
    const label =
      state.label === null
        ? none
        : html`<label class="label" id=${FIELD_IDS.label} for=${FIELD_IDS.input}
            >${state.label}${state.required ? " *" : ""}</label
          >`;
    const support = error
      ? html`<div class="support" id=${FIELD_IDS.error} role="alert" part="error">${state.error}</div>`
      : html`<div class="support" id=${FIELD_IDS.supporting} part="supporting">${state.supportingText}</div>`;
    return html`<div class=${classes} style=${vars} part="field">
      ${floating ? none : label}
      <div class="box" part="box">
        ${floating ? label : none}
        <slot name=${slots["prefix-icon"]}></slot>
        <span class="inputwrap">
          ${state.prefixText === null ? none : html`<span class="affix">${state.prefixText}</span>`}
          ${nodes?.["input"] ?? none}
          ${state.suffixText === null ? none : html`<span class="affix">${state.suffixText}</span>`}
        </span>
        <slot name=${slots["suffix-icon"]}></slot>
      </div>
      ${support}
    </div>`;
  },
};

const MAGNIFIER =
  "M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14";

export const searchFieldBase: Base<SearchFieldState, SearchFieldSlots, SearchFieldStyle> = {
  styles: css`
    :host {
      display: inline-block;
      min-inline-size: 0;
    }
    .s {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: var(--camo-spacing-s);
      min-block-size: var(--s-height);
      padding-inline: var(--s-padding);
      border-radius: var(--s-shape);
      background: var(--s-container);
      color: var(--s-text);
    }
    .s.focused {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: 2px;
    }
    .camo-input {
      flex: 1 1 auto;
      min-inline-size: 0;
      margin: 0;
      padding: 0;
      border: 0;
      outline: none;
      background: transparent;
      color: var(--s-text);
      font: var(--s-font);
      caret-color: var(--camo-color-primary);
    }
    .camo-input::placeholder {
      color: var(--s-icon);
    }
    .camo-input::-webkit-search-cancel-button {
      display: none;
    }
    ::slotted(*),
    .glyph {
      flex: none;
      color: var(--s-icon);
      --camo-content-color: var(--s-icon);
      --camo-icon-size: var(--s-icon-size);
    }
    .glyph {
      inline-size: var(--s-icon-size);
      block-size: var(--s-icon-size);
      fill: currentColor;
    }
    slot {
      display: contents;
    }
  `,

  render({ state, slots, theme, style, nodes }) {
    const c = theme.colors;
    const t = theme.typography.bodyLarge;
    const disabledText = `color-mix(in srgb, ${c.onSurface} 38%, transparent)`;
    const vars = [
      `--s-height: ${style.height}`,
      `--s-padding: ${style.padding}`,
      `--s-shape: ${style.shape}`,
      `--s-icon-size: ${style.iconSize}`,
      `--s-container: ${c.surfaceContainerHigh}`,
      `--s-text: ${state.disabled ? disabledText : c.onSurface}`,
      `--s-icon: ${state.disabled ? disabledText : c.onSurfaceVariant}`,
      `--s-font: ${t.weight} ${t.size}/${t.lineHeight} ${t.family}`,
    ].join("; ");
    return html`<div class="s ${state.focused ? "focused" : ""}" style=${vars} part="field">
      <slot name=${slots["leading"]}
        ><svg class="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d=${MAGNIFIER} /></svg
      ></slot>
      ${nodes?.["input"] ?? none} ${nodes?.["clear"] ?? none}
      <slot name=${slots["trailing"]}></slot>
    </div>`;
  },
};
