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

/** Fluent's progress bar. */
export const fluentProgressBar: Renderer<ProgressState, ProgressBarSlots, ProgressBarStyle> = {
  ...progressBarBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      barHeight: field("progress-bar", "bar-height", "2px"),
      trackGap: field("progress-bar", "track-gap", "0px"),
      shape: theme.shapes.full,
      cycleDuration: "1.4s",
      showStopIndicator: false,
      active: c.primary,
      track: c.surfaceContainerHighest,
    };
  },
};

/** Fluent's progress circle. */
export const fluentProgressCircle: Renderer<
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
      circleSizeMedium: field("progress-circle", "circle-size-medium", "32px"),
      circleSizeLarge: field("progress-circle", "circle-size-large", "44px"),
      cycleDuration: "1s",
      indeterminate: "ring",
      active: c.primary,
      track: c.primaryContainer,
    };
  },
};

/** Fluent's toast: a card at the bottom end with its status icon. */
export const fluentSnackbar: Renderer<SnackbarState, SnackbarSlots, SnackbarStyle> = {
  ...snackbarBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      shape: field("snackbar", "shape", theme.shapes.small),
      maxWidth: field("snackbar", "max-width", "420px"),
      margin: field("snackbar", "margin", theme.spacing.l),
      minHeight: field("snackbar", "min-height", "48px"),
      padding: field("snackbar", "padding", `${theme.spacing.s} ${theme.spacing.l}`),
      elevation: field("snackbar", "elevation", theme.elevation.level2),
      position: "bottom",
      alignment: "end",
      showDismiss: false,
      showToneIcon: true,
      textStyle: theme.typography.bodyMedium,
      actionStyle: theme.typography.labelLarge,
      iconSize: "20px",
      container: c.surface,
      content: c.onSurface,
      action: c.primary,
    };
  },
};

/** Fluent's banner. */
export const fluentBanner: Renderer<BannerState, BannerSlots, BannerStyle> = {
  ...bannerBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "soft",
      shape: field("banner", "shape", theme.shapes.small),
      padding: field("banner", "padding", "12px"),
      iconSize: field("banner", "icon-size", "20px"),
      accentBorder: false,
      accentWidth: field("banner", "accent-width", "3px"),
      borderWidth: field("banner", "border-width", "1px"),
      titleStyle: theme.typography.titleSmall,
      messageStyle: theme.typography.bodyMedium,
      soft: { container: c.surfaceContainer, content: c.onSurface, accent: c.primary },
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
