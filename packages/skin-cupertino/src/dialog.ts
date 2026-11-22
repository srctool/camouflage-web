import { cssBlock } from "@srctool/camouflage-core";
import type { DialogSlots, DialogState, DialogStyle, Renderer } from "@srctool/camouflage-core";
import { css, html, nothing } from "lit";

const field = (name: string, fallback: string): string => `var(--camo-dialog-${name}, ${fallback})`;

const STYLES = css`
  dialog {
    border: 0;
    padding: 0;
    background: transparent;
    color: inherit;
    overflow: visible;
  }
  /* An open dialog is a flex box, so the skin's surface fills its width. */
  dialog[open] {
    display: flex;
  }
  .d {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: 100%;
  }
  .title {
    margin: 0;
  }
  .message {
    margin: 0;
  }
  .body {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: auto;
  }
  .actions {
    display: flex;
  }
  .actions-end {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .actions-center {
    flex-wrap: wrap;
    justify-content: center;
  }
  .actions-full-width-row > ::slotted(*) {
    flex: 1 1 0;
  }
  .actions-stacked {
    flex-direction: column;
    align-items: stretch;
  }
  slot {
    display: contents;
  }
`;

/** Cupertino's dialog: an alert, 270 wide, radius 14, a centered title, the actions stacked (confirm on top). */
export const cupertinoDialog: Renderer<DialogState, DialogSlots, DialogStyle> = {
  defaults(theme) {
    const c = theme.colors;
    return {
      shape: field("shape", theme.shapes.large),
      minWidth: field("min-width", "270px"),
      maxWidth: field("max-width", "270px"),
      padding: field("padding", "20px"),
      titleStyle: theme.typography.titleMedium,
      messageStyle: theme.typography.bodySmall,
      titleAlign: "center",
      actionsLayout: "stacked",
      actionGap: field("action-gap", theme.spacing.s),
      sectionGap: field("section-gap", theme.spacing.m),
      elevation: field("elevation", theme.elevation.level4),
      scrimAlpha: field("scrim-alpha", "40%"),
      container: c.surfaceContainerHigh,
      titleColor: c.onSurface,
      messageColor: c.onSurface,
      border: null,
    };
  },

  styles: STYLES,

  render({ state, slots, theme, style, skin }) {
    const align = style.titleAlign === "center" ? "center" : "start";
    // The skin places the actions; the same markup stacks them under another skin (Skin Contract, section 2).
    const actions =
      style.actionsLayout === "stacked"
        ? html`<slot name=${slots.confirm}></slot><slot name=${slots.dismiss}></slot>`
        : html`<slot name=${slots.dismiss}></slot><slot name=${slots.confirm}></slot>`;
    const body = html`<div
      class="d"
      part="dialog"
      style="padding: ${style.padding}; gap: ${style.sectionGap}; text-align: ${align}"
    >
      ${
        state.title === null
          ? nothing
          : html`<h2
              class="title"
              id=${state.titleId}
              part="title"
              style="color: ${style.titleColor}; font: ${style.titleStyle.weight} ${style.titleStyle.size}/${style.titleStyle.lineHeight} ${style.titleStyle.family}; letter-spacing: ${style.titleStyle.letterSpacing}"
            >${state.title}</h2>`
      }
      <div class="body" style="gap: ${style.sectionGap}">
        <p
          class="message"
          id=${state.messageId}
          part="message"
          style="color: ${style.messageColor}; font: ${style.messageStyle.weight} ${style.messageStyle.size}/${style.messageStyle.lineHeight} ${style.messageStyle.family}; letter-spacing: ${style.messageStyle.letterSpacing}"
        >${state.message}</p>
        <slot name=${slots.content}></slot>
      </div>
      <div
        class="actions actions-${style.actionsLayout}"
        part="actions"
        style="gap: ${style.actionGap}"
      >
        ${actions}
      </div>
    </div>`;
    return html`${cssBlock(
      `dialog { min-width: ${style.minWidth}; max-width: ${style.maxWidth}; width: calc(100% - ${theme.spacing.xl} * 2); border-radius: ${style.shape}; }`,
      // The modal's scrim, and the same scrim for a server-rendered dialog before it becomes modal (it has no backdrop).
      `dialog::backdrop { background: color-mix(in srgb, ${theme.colors.scrim} ${style.scrimAlpha}, transparent); }`,
      `dialog[open]:not(:modal) { box-shadow: 0 0 0 100vmax color-mix(in srgb, ${theme.colors.scrim} ${style.scrimAlpha}, transparent); }`,
    )}${skin.surfaceTreatment.decorate({
      child: body,
      color: style.container,
      shape: style.shape,
      elevation: style.elevation,
      border: style.border ?? undefined,
      theme,
    })}`;
  },
};
