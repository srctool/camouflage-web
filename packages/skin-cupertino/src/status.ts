import {
  bannerBase,
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

/** cupertino's progress bar: a 4 px rounded track, like iOS's progress view. */
export const cupertinoProgressBar: Renderer<ProgressState, ProgressBarSlots, ProgressBarStyle> = {
  ...progressBarBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      barHeight: field("progress-bar", "bar-height", "4px"),
      trackGap: field("progress-bar", "track-gap", "0px"),
      shape: theme.shapes.full,
      cycleDuration: "1.6s",
      showStopIndicator: false,
      active: c.primary,
      track: c.surfaceContainerHighest,
    };
  },
};

/** cupertino's progress circle: a ring of fading spokes for the unknown amount (iOS's activity indicator). */
export const cupertinoProgressCircle: Renderer<
  ProgressCircleState,
  ProgressCircleSlots,
  ProgressCircleStyle
> = {
  ...progressCircleBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      circleStroke: field("progress-circle", "circle-stroke", "2px"),
      circleSizeSmall: field("progress-circle", "circle-size-small", "20px"),
      circleSizeMedium: field("progress-circle", "circle-size-medium", "36px"),
      circleSizeLarge: field("progress-circle", "circle-size-large", "52px"),
      cycleDuration: "1s",
      indeterminate: "spokes",
      active: c.onSurfaceVariant,
      track: c.surfaceContainerHighest,
    };
  },
};

/** cupertino's snackbar: a banner at the top, a lifted card with its status icon. */
export const cupertinoSnackbar: Renderer<SnackbarState, SnackbarSlots, SnackbarStyle> = {
  ...snackbarBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      shape: field("snackbar", "shape", theme.shapes.large),
      maxWidth: field("snackbar", "max-width", "420px"),
      margin: field("snackbar", "margin", theme.spacing.m),
      minHeight: field("snackbar", "min-height", "52px"),
      padding: field("snackbar", "padding", `${theme.spacing.s} ${theme.spacing.l}`),
      elevation: field("snackbar", "elevation", theme.elevation.level3),
      position: "top",
      alignment: "center",
      showDismiss: false,
      showToneIcon: true,
      textStyle: theme.typography.bodyMedium,
      actionStyle: theme.typography.labelLarge,
      iconSize: "22px",
      container: c.surfaceContainerHigh,
      content: c.onSurface,
      action: c.primary,
    };
  },
};

/** cupertino's banner: a soft rounded panel. */
export const cupertinoBanner: Renderer<BannerState, BannerSlots, BannerStyle> = {
  ...bannerBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "soft",
      shape: field("banner", "shape", theme.shapes.large),
      padding: field("banner", "padding", theme.spacing.l),
      iconSize: field("banner", "icon-size", "22px"),
      accentBorder: false,
      accentWidth: field("banner", "accent-width", "3px"),
      borderWidth: field("banner", "border-width", "1px"),
      titleStyle: theme.typography.titleSmall,
      messageStyle: theme.typography.bodyMedium,
      soft: { container: c.surfaceContainerHigh, content: c.onSurface, accent: c.primary },
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
