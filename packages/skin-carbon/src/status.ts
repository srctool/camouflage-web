import { html } from "lit";
import { css } from "lit";
import {
  bannerBase,
  cssBlock,
  progressBarBase,
  progressCircleBase,
  snackbarBase,
} from "@srctool/camouflage-core";
import type {
  BannerSlots,
  BannerState,
  BannerStyle,
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
} from "@srctool/camouflage-core";

/** A component-theme field as a custom property with the skin's default: `--camo-progress-bar-bar-height`. */
const field = (component: string, name: string, fallback: string): string =>
  `var(--camo-${component}-${name}, ${fallback})`;

/** Carbon's progress bar. */
export const carbonProgressBar: Renderer<ProgressState, ProgressBarSlots, ProgressBarStyle> = {
  ...progressBarBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      barHeight: field("progress-bar", "bar-height", "4px"),
      trackGap: field("progress-bar", "track-gap", "0px"),
      shape: theme.shapes.none,
      cycleDuration: "1.4s",
      showStopIndicator: false,
      active: c.primary,
      track: c.surfaceContainerHigh,
    };
  },
};

/** Carbon's progress circle. */
export const carbonProgressCircle: Renderer<
  ProgressCircleState,
  ProgressCircleSlots,
  ProgressCircleStyle
> = {
  ...progressCircleBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      circleStroke: field("progress-circle", "circle-stroke", "4px"),
      circleSizeSmall: field("progress-circle", "circle-size-small", "16px"),
      circleSizeMedium: field("progress-circle", "circle-size-medium", "44px"),
      circleSizeLarge: field("progress-circle", "circle-size-large", "88px"),
      cycleDuration: "1s",
      indeterminate: "ring",
      active: c.primary,
      track: c.surfaceContainerHigh,
    };
  },
};

/** Carbon's toast: square, a colored start border, at the top end. */
export const carbonSnackbar: Renderer<SnackbarState, SnackbarSlots, SnackbarStyle> = {
  ...snackbarBase,
  styles: [
    snackbarBase.styles ?? [],
    css`
    .snack {
      border-inline-start: var(--camo-snackbar-accent-width, 3px) solid var(--sb-action);
    }
  `,
  ],
  defaults(theme) {
    const c = theme.colors;
    return {
      shape: field("snackbar", "shape", theme.shapes.none),
      maxWidth: field("snackbar", "max-width", "360px"),
      margin: field("snackbar", "margin", theme.spacing.l),
      minHeight: field("snackbar", "min-height", "48px"),
      padding: field("snackbar", "padding", `${theme.spacing.s} ${theme.spacing.l}`),
      elevation: field("snackbar", "elevation", theme.elevation.level3),
      position: "top",
      alignment: "end",
      showDismiss: true,
      showToneIcon: true,
      textStyle: theme.typography.bodyMedium,
      actionStyle: theme.typography.labelLarge,
      iconSize: "20px",
      container: c.inverseSurface,
      content: c.inverseOnSurface,
      action: c.inversePrimary,
    };
  },
};

/** Carbon's banner. */
export const carbonBanner: Renderer<BannerState, BannerSlots, BannerStyle> = {
  ...bannerBase,
  render(args) {
    // A notification's action is a link blue, since the status colors are not all readable as text; on a solid
    // fill it keeps the content color.
    const link =
      args.state.appearance === "solid"
        ? ""
        : cssBlock(".actions { --camo-action-color: var(--camo-color-primary); }");
    return html`${link}${bannerBase.render(args)}`;
  },
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "soft",
      shape: field("banner", "shape", theme.shapes.none),
      padding: field("banner", "padding", theme.spacing.l),
      iconSize: field("banner", "icon-size", "20px"),
      accentBorder: true,
      accentWidth: field("banner", "accent-width", "3px"),
      borderWidth: field("banner", "border-width", "1px"),
      titleStyle: theme.typography.titleSmall,
      messageStyle: theme.typography.bodyMedium,
      soft: { container: c.surfaceContainerLow, content: c.onSurface, accent: c.primary },
      solid: { container: c.primary, content: c.onPrimary, accent: c.onPrimary },
      outline: {
        container: "transparent",
        content: c.onSurface,
        accent: c.primary,
        border: c.outlineVariant,
      },
    };
  },
};
