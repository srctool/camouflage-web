import { buttonColorsFor } from "@srctool/camouflage-core";
import type {
  ButtonColors,
  ButtonSlots,
  ButtonState,
  ButtonStyle,
  Renderer,
} from "@srctool/camouflage-core";
import { css, html, nothing } from "lit";

/** A component-theme field as a custom property with the skin's default: `--camo-button-height` (Theme note, 3.5). */
const field = (name: string, fallback: string): string => `var(--camo-button-${name}, ${fallback})`;

const STYLES = css`
  .b {
    box-sizing: border-box;
    display: inline-flex;
    flex: 1 1 auto;
    align-items: stretch;
    position: relative;
    min-height: var(--b-height);
    min-width: var(--b-min-width);
    color: var(--b-fg);
    font: var(--b-font);
    letter-spacing: var(--b-letter-spacing);
    border-radius: var(--b-shape);
  }
  .content {
    display: inline-flex;
    align-items: center;
    gap: var(--b-icon-gap);
    padding-inline: var(--b-padding);
    min-width: 0;
    visibility: var(--b-content-visibility);
  }
  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-decoration: var(--b-label-decoration);
  }
  slot {
    display: contents;
  }
  /* A button with an icon is padded less on that side: the icon pulls itself toward the edge (no :has on the host). */
  ::slotted([slot="prefix-icon"]) {
    margin-inline-start: calc(var(--b-padding-icon) - var(--b-padding));
  }
  ::slotted([slot="suffix-icon"]) {
    margin-inline-end: calc(var(--b-padding-icon) - var(--b-padding));
  }
  ::slotted(*) {
    flex: none;
    width: var(--b-icon-size);
    height: var(--b-icon-size);
    color: var(--b-fg);
    --camo-content-color: var(--b-fg);
    --camo-icon-size: var(--b-icon-size);
  }
  /* A touch area of at least the style's target, whatever the visual size. */
  .b::after {
    content: "";
    position: absolute;
    inset-block: calc((var(--b-height) - var(--b-touch-target)) / 2);
    inset-inline: min(var(--camo-spacing-none), calc((100% - var(--b-touch-target)) / 2));
  }
  .spinner {
    position: absolute;
    inset: 0;
    margin: auto;
    width: var(--b-icon-size);
    height: var(--b-icon-size);
    box-sizing: border-box;
    border: var(--camo-spacing-xxs) solid currentColor;
    border-inline-end-color: transparent;
    border-radius: 50%;
    animation: camo-spin calc(var(--camo-motion-duration-medium) * 3) linear infinite;
  }
  @keyframes camo-spin {
    to {
      transform: rotate(1turn);
    }
  }
`;

/** Cupertino's button: 44 tall, radius 12, accent solid, accent-tinted soft; Raised and Outline fold into Soft. */
export const cupertinoButton: Renderer<ButtonState, ButtonSlots, ButtonStyle> = {
  defaults(theme) {
    const c = theme.colors;
    const clear = "transparent";
    const tinted: ButtonColors = { container: c.primaryContainer, content: c.primary };
    return {
      defaultAppearance: "solid",
      height: field("height", "44px"),
      minWidth: field("min-width", "44px"),
      shape: field("shape", theme.shapes.medium),
      paddingInline: field("padding", "16px"),
      paddingInlineWithIcon: field("padding-with-icon", theme.spacing.m),
      textStyle: theme.typography.labelLarge,
      iconSize: field("icon-size", "20px"),
      iconGap: field("icon-gap", theme.spacing.s),
      touchTarget: field("touch-target", "48px"),
      borderWidth: field("border-width", "0px"),
      raisedElevation: field("raised-elevation", theme.elevation.level0),
      solid: { container: c.primary, content: c.onPrimary },
      soft: tinted,
      raised: tinted,
      outline: tinted,
      // A container that sets `--camo-action-color` (a banner, a snackbar) retints quiet buttons inside it.
      ghost: { container: clear, content: `var(--camo-action-color, ${c.primary})` },
      link: { container: clear, content: `var(--camo-action-color, ${c.primary})` },
      disabledContainerAlpha: field("disabled-container-alpha", "12%"),
      disabledContentAlpha: field("disabled-content-alpha", "38%"),
    };
  },

  styles: STYLES,

  render({ state, slots, theme, style, skin }) {
    const enabled = !state.disabled;
    const live = buttonColorsFor(style, state.appearance, state.tone, theme);
    const disabledContent = `color-mix(in srgb, ${theme.colors.onSurface} ${style.disabledContentAlpha}, transparent)`;
    const colors: ButtonColors = enabled
      ? live
      : {
          container:
            live.container === "transparent"
              ? live.container
              : `color-mix(in srgb, ${theme.colors.onSurface} ${style.disabledContainerAlpha}, transparent)`,
          content: disabledContent,
          ...(live.border !== undefined ? { border: disabledContent } : {}),
        };
    const link = state.appearance === "link";
    const vars = [
      `--b-height: ${style.height}`,
      `--b-min-width: ${link ? theme.spacing.none : style.minWidth}`,
      `--b-shape: ${style.shape}`,
      `--b-padding: ${link ? theme.spacing.none : style.paddingInline}`,
      `--b-padding-icon: ${style.paddingInlineWithIcon}`,
      `--b-icon-size: ${style.iconSize}`,
      `--b-icon-gap: ${style.iconGap}`,
      `--b-touch-target: ${style.touchTarget}`,
      `--b-fg: ${colors.content}`,
      `--b-font: ${state.appearance === "solid" ? "600" : style.textStyle.weight} ${style.textStyle.size}/${style.textStyle.lineHeight} ${style.textStyle.family}`,
      `--b-letter-spacing: ${style.textStyle.letterSpacing}`,
      `--b-label-decoration: ${link ? "underline" : "none"}`,
      `--b-content-visibility: ${state.loading ? "hidden" : "visible"}`,
    ].join("; ");
    const border =
      colors.border === undefined ? undefined : `${style.borderWidth} solid ${colors.border}`;
    const content = html`<span class="content"
        ><slot name=${slots["prefix-icon"]}></slot
        ><span class="label" part="label">${state.text}</span
        ><slot name=${slots["suffix-icon"]}></slot></span
      >${state.loading ? html`<span class="spinner" part="spinner"></span>` : nothing}`;
    return html`<span class="b" part="button" style=${vars}
      >${skin.feedback.wrap({
        child: skin.surfaceTreatment.decorate({
          child: content,
          color: colors.container,
          shape: style.shape,
          elevation: style.raisedElevation,
          border,
          theme,
        }),
        contentColor: colors.content,
        shape: style.shape,
        theme,
      })}</span
    >`;
  },
};
