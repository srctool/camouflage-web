import { avatarBase, badgeBase, chipBase, fabBase } from "@srctool/camouflage-core";
import type {
  AvatarSlots,
  AvatarState,
  AvatarStyle,
  BadgeSlots,
  BadgeState,
  BadgeStyle,
  ChipSlots,
  ChipState,
  ChipStyle,
  FabSlots,
  FabState,
  FabStyle,
  Renderer,
} from "@srctool/camouflage-core";

const field = (component: string, name: string, fallback: string): string =>
  `var(--camo-${component}-${name}, ${fallback})`;

/** Fluent's chip. */
export const fluentChip: Renderer<ChipState, ChipSlots, ChipStyle> = {
  ...chipBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "soft",
      height: field("chip", "height", "32px"),
      shape: field("chip", "shape", theme.shapes.small),
      paddingInline: field("chip", "padding", theme.spacing.s),
      iconPadding: field("chip", "icon-padding", theme.spacing.m),
      iconGap: field("chip", "icon-gap", theme.spacing.s),
      iconSize: field("chip", "icon-size", "16px"),
      borderWidth: field("chip", "border-width", "1px"),
      textStyle: theme.typography.labelLarge,
      touchTarget: "48px",
      groupSpacing: field("chip", "group-spacing", theme.spacing.s),
      showCheckWhenSelected: false,
      outline: { container: "transparent", content: c.onSurface, border: c.outlineVariant },
      soft: { container: c.surfaceContainerHigh, content: c.onSurface },
      solid: { container: c.primary, content: c.onPrimary },
      selectedColors: { container: c.primaryContainer, content: c.onPrimaryContainer },
    };
  },
};

/** Fluent's badge. */
export const fluentBadge: Renderer<BadgeState, BadgeSlots, BadgeStyle> = {
  ...badgeBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "solid",
      defaultTone: "error",
      dotSize: field("badge", "dot-size", "8px"),
      height: field("badge", "height", "20px"),
      minWidth: field("badge", "min-width", "20px"),
      padding: field("badge", "padding", theme.spacing.xs),
      borderWidth: field("badge", "border-width", "1px"),
      offset: field("badge", "offset", theme.spacing.xs),
      textStyle: theme.typography.labelSmall,
      solid: { container: c.primary, content: c.onPrimary },
      soft: { container: c.surfaceContainerHigh, content: c.onSurface },
      outline: { container: "transparent", content: c.onSurface, border: c.outline },
    };
  },
};

/** Fluent's avatar. */
export const fluentAvatar: Renderer<AvatarState, AvatarSlots, AvatarStyle> = {
  ...avatarBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      shape: "circle",
      roundedShape: field("avatar", "rounded-shape", theme.shapes.small),
      sizeSmall: field("avatar", "size-small", "24px"),
      sizeMedium: field("avatar", "size-medium", "32px"),
      sizeLarge: field("avatar", "size-large", "48px"),
      presenceSize: field("avatar", "presence-size", "10px"),
      ringWidth: field("avatar", "ring-width", "2px"),
      groupOverlap: field("avatar", "group-overlap", theme.spacing.s),
      textStyleSmall: theme.typography.labelSmall,
      textStyleMedium: theme.typography.labelLarge,
      textStyleLarge: theme.typography.titleMedium,
      palette: [
        { container: c.primaryContainer, content: c.onPrimaryContainer },
        { container: c.surfaceContainerHighest, content: c.onSurface },
      ],
      neutral: { container: c.surfaceContainerHigh, content: c.onSurfaceVariant },
      presenceColors: { online: c.success, away: c.warning, busy: c.error, offline: c.outline },
      ringColor: c.surface,
    };
  },
};

/** Fluent's FAB. */
export const fluentFab: Renderer<FabState, FabSlots, FabStyle> = {
  ...fabBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "solid",
      size: "regular",
      sizeSmall: field("fab", "size-small", "40px"),
      sizeRegular: field("fab", "size-regular", "48px"),
      sizeLarge: field("fab", "size-large", "96px"),
      extendedHeight: field("fab", "extended-height", "48px"),
      shapeSmall: field("fab", "shape-small", theme.shapes.full),
      shapeRegular: field("fab", "shape-regular", theme.shapes.full),
      shapeLarge: field("fab", "shape-large", theme.shapes.full),
      iconSizeRegular: field("fab", "icon-size-regular", "24px"),
      iconSizeLarge: field("fab", "icon-size-large", "36px"),
      iconGap: field("fab", "icon-gap", theme.spacing.s),
      extendedPadding: field("fab", "extended-padding", theme.spacing.l),
      elevation: field("fab", "elevation", theme.elevation.level3),
      textStyle: theme.typography.labelLarge,
      touchTarget: "48px",
      soft: { container: c.surfaceContainerHigh, content: c.onSurface },
      solid: { container: c.primary, content: c.onPrimary },
      raised: { container: c.surface, content: c.onSurface, border: c.outlineVariant },
    };
  },
};
