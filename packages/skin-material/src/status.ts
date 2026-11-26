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

/** Material's linear indicator: 4 px with a gap and a stop dot. */
export const materialProgressBar: Renderer<ProgressState, ProgressBarSlots, ProgressBarStyle> = {
  ...progressBarBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      barHeight: field("progress-bar", "bar-height", "4px"),
      trackGap: field("progress-bar", "track-gap", "4px"),
      shape: theme.shapes.full,
      cycleDuration: "1.4s",
      showStopIndicator: true,
      active: c.primary,
      track: c.secondaryContainer,
    };
  },
};

/** Material's progress circle. */
export const materialProgressCircle: Renderer<
  ProgressCircleState,
  ProgressCircleSlots,
  ProgressCircleStyle
> = {
  ...progressCircleBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      circleStroke: field("progress-circle", "circle-stroke", "4px"),
      circleSizeSmall: field("progress-circle", "circle-size-small", "24px"),
      circleSizeMedium: field("progress-circle", "circle-size-medium", "48px"),
      circleSizeLarge: field("progress-circle", "circle-size-large", "64px"),
      cycleDuration: "1s",
      indeterminate: "ring",
      active: c.primary,
      track: c.secondaryContainer,
    };
  },
};

/** Material's snackbar. */
export const materialSnackbar: Renderer<SnackbarState, SnackbarSlots, SnackbarStyle> = {
  ...snackbarBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      shape: field("snackbar", "shape", theme.shapes.extraSmall),
      maxWidth: field("snackbar", "max-width", "560px"),
      margin: field("snackbar", "margin", theme.spacing.l),
      minHeight: field("snackbar", "min-height", "48px"),
      padding: field("snackbar", "padding", `${theme.spacing.s} ${theme.spacing.l}`),
      elevation: field("snackbar", "elevation", theme.elevation.level3),
      position: "bottom",
      alignment: "center",
      showDismiss: false,
      showToneIcon: false,
      textStyle: theme.typography.bodyMedium,
      actionStyle: theme.typography.labelLarge,
      iconSize: "20px",
      container: c.inverseSurface,
      content: c.inverseOnSurface,
      action: c.inversePrimary,
    };
  },
};

/** Material's banner. */
export const materialBanner: Renderer<BannerState, BannerSlots, BannerStyle> = {
  ...bannerBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "soft",
      shape: field("banner", "shape", theme.shapes.medium),
      padding: field("banner", "padding", theme.spacing.l),
      iconSize: field("banner", "icon-size", "20px"),
      accentBorder: false,
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
