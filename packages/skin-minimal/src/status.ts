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

/** minimal's progress bar: a 2 px ink line on a hairline track, no gap. */
export const minimalProgressBar: Renderer<ProgressState, ProgressBarSlots, ProgressBarStyle> = {
  ...progressBarBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      barHeight: field("progress-bar", "bar-height", "2px"),
      trackGap: field("progress-bar", "track-gap", "0px"),
      shape: theme.shapes.none,
      cycleDuration: "1.4s",
      showStopIndicator: false,
      active: c.primary,
      track: c.outlineVariant,
    };
  },
};

/** minimal's progress circle: an ink arc on a hairline ring. */
export const minimalProgressCircle: Renderer<
  ProgressCircleState,
  ProgressCircleSlots,
  ProgressCircleStyle
> = {
  ...progressCircleBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      circleStroke: field("progress-circle", "circle-stroke", "2px"),
      circleSizeSmall: field("progress-circle", "circle-size-small", "24px"),
      circleSizeMedium: field("progress-circle", "circle-size-medium", "40px"),
      circleSizeLarge: field("progress-circle", "circle-size-large", "56px"),
      cycleDuration: "1s",
      indeterminate: "ring",
      active: c.primary,
      track: c.outlineVariant,
    };
  },
};

/** minimal's snackbar: the inverse surface, flat, at the bottom center. */
export const minimalSnackbar: Renderer<SnackbarState, SnackbarSlots, SnackbarStyle> = {
  ...snackbarBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      shape: field("snackbar", "shape", theme.shapes.small),
      maxWidth: field("snackbar", "max-width", "560px"),
      margin: field("snackbar", "margin", theme.spacing.l),
      minHeight: field("snackbar", "min-height", "48px"),
      padding: field("snackbar", "padding", `${theme.spacing.s} ${theme.spacing.l}`),
      elevation: field("snackbar", "elevation", theme.elevation.level0),
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

/** minimal's banner: a soft panel, radius 12. */
export const minimalBanner: Renderer<BannerState, BannerSlots, BannerStyle> = {
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
