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

/** The next token for hover and press: brand steps for the brand button, neutral steps for the rest. */
function swap(
  step: "Hover" | "Pressed",
): (appearance: string, tone: string, rest: string) => string {
  const lower = step.toLowerCase();
  return (appearance, tone, rest) => {
    if (appearance === "solid")
      return tone === "default"
        ? `var(--fluent-brand-background-${lower}, ${rest})`
        : `color-mix(in srgb, ${rest}, black ${step === "Hover" ? "10%" : "22%"})`;
    if (appearance === "link") return rest;
    const set = appearance === "ghost" || appearance === "outline" ? "subtle" : "neutral";
    return set === "subtle"
      ? `var(--fluent-subtle-background-${lower}, ${rest})`
      : `var(--fluent-neutral-background1-${lower}, ${rest})`;
  };
}
const hover = swap("Hover");
const pressed = swap("Pressed");

const STYLES = css`
  :host(:hover:not([disabled]):not([loading])) .camo-surface {
    background: var(--b-hover) !important;
  }
  :host([data-camo-pressed]) .camo-surface {
    background: var(--b-active) !important;
  }
  /* The tokens above are the hover and press steps; the veil is left for the focus stroke. */
  :host(:not(:focus-visible)) .camo-feedback-veil {
    background: transparent;
  }
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

/** Fluent's button: 24, 32 or 40 by density, radius 4; hover and press swap to the next token. */
export const fluentButton: Renderer<ButtonState, ButtonSlots, ButtonStyle> = {
  defaults(theme) {
    const c = theme.colors;
    const clear = "transparent";
    return {
      defaultAppearance: "solid",
      height: field(
        "height",
        "var(--camo-density-control, var(--fluent-density-control, calc(40px - var(--camo-input-pointer, 0) * 8px)))",
      ),
      minWidth: field("min-width", "64px"),
      shape: field("shape", theme.shapes.small),
      paddingInline: field("padding", "12px"),
      paddingInlineWithIcon: field("padding-with-icon", "12px"),
      textStyle: theme.typography.labelLarge,
      iconSize: field("icon-size", "20px"),
      iconGap: field("icon-gap", "6px"),
      touchTarget: field("touch-target", "48px"),
      borderWidth: field("border-width", "1px"),
      raisedElevation: field("raised-elevation", theme.elevation.level0),
      solid: {
        container: "var(--fluent-brand-background, var(--camo-color-primary))",
        content: "var(--fluent-neutral-foreground-on-brand, var(--camo-color-on-primary))",
      },
      soft: {
        container: c.surface,
        content: c.onSurface,
        border: "var(--fluent-neutral-stroke1, var(--camo-color-outline-variant))",
      },
      raised: {
        container: c.surface,
        content: c.onSurface,
        border: "var(--fluent-neutral-stroke1, var(--camo-color-outline-variant))",
      },
      outline: {
        container: clear,
        content: c.onSurface,
        border: "var(--fluent-neutral-stroke1, var(--camo-color-outline-variant))",
      },
      // A container that sets `--camo-action-color` (a banner, a snackbar) retints quiet buttons inside it.
      ghost: { container: clear, content: `var(--camo-action-color, ${c.onSurface})` },
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
      `--b-hover: ${hover(state.appearance, state.tone, colors.container)}`,
      `--b-active: ${pressed(state.appearance, state.tone, colors.container)}`,
      `--b-font: ${style.textStyle.weight} ${style.textStyle.size}/${style.textStyle.lineHeight} ${style.textStyle.family}`,
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
