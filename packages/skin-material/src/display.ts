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

/** Material's chip. */
export const materialChip: Renderer<ChipState, ChipSlots, ChipStyle> = {
  ...chipBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "outline",
      height: field("chip", "height", "32px"),
      shape: field("chip", "shape", theme.shapes.small),
      paddingInline: field("chip", "padding", theme.spacing.l),
      iconPadding: field("chip", "icon-padding", theme.spacing.m),
      iconGap: field("chip", "icon-gap", theme.spacing.s),
      iconSize: field("chip", "icon-size", "18px"),
      borderWidth: field("chip", "border-width", "1px"),
      textStyle: theme.typography.labelLarge,
      touchTarget: "48px",
      groupSpacing: field("chip", "group-spacing", theme.spacing.s),
      showCheckWhenSelected: true,
      outline: { container: "transparent", content: c.onSurfaceVariant, border: c.outline },
      soft: { container: c.surfaceContainerLow, content: c.onSurfaceVariant },
      solid: { container: c.primary, content: c.onPrimary },
      selectedColors: { container: c.secondaryContainer, content: c.onSecondaryContainer },
    };
  },
};

/** Material's badge. */
export const materialBadge: Renderer<BadgeState, BadgeSlots, BadgeStyle> = {
  ...badgeBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "solid",
      defaultTone: "error",
      dotSize: field("badge", "dot-size", "6px"),
      height: field("badge", "height", "16px"),
      minWidth: field("badge", "min-width", "16px"),
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

/** Material's avatar. */
export const materialAvatar: Renderer<AvatarState, AvatarSlots, AvatarStyle> = {
  ...avatarBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      shape: "circle",
      roundedShape: field("avatar", "rounded-shape", theme.shapes.small),
      sizeSmall: field("avatar", "size-small", "24px"),
      sizeMedium: field("avatar", "size-medium", "40px"),
      sizeLarge: field("avatar", "size-large", "56px"),
      presenceSize: field("avatar", "presence-size", "10px"),
      ringWidth: field("avatar", "ring-width", "2px"),
      groupOverlap: field("avatar", "group-overlap", theme.spacing.s),
      textStyleSmall: theme.typography.labelSmall,
      textStyleMedium: theme.typography.labelLarge,
      textStyleLarge: theme.typography.titleMedium,
      palette: [
        { container: c.primaryContainer, content: c.onPrimaryContainer },
        { container: c.secondaryContainer, content: c.onSecondaryContainer },
        { container: c.tertiaryContainer, content: c.onTertiaryContainer },
      ],
      neutral: { container: c.surfaceContainerHigh, content: c.onSurfaceVariant },
      presenceColors: { online: c.success, away: c.warning, busy: c.error, offline: c.outline },
      ringColor: c.surface,
    };
  },
};

/** Material's FAB: `primaryContainer`, level 3. */
export const materialFab: Renderer<FabState, FabSlots, FabStyle> = {
  ...fabBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "soft",
      size: "regular",
      sizeSmall: field("fab", "size-small", "40px"),
      sizeRegular: field("fab", "size-regular", "56px"),
      sizeLarge: field("fab", "size-large", "96px"),
      extendedHeight: field("fab", "extended-height", "56px"),
      shapeSmall: field("fab", "shape-small", theme.shapes.medium),
      shapeRegular: field("fab", "shape-regular", theme.shapes.large),
      shapeLarge: field("fab", "shape-large", theme.shapes.extraLarge),
      iconSizeRegular: field("fab", "icon-size-regular", "24px"),
      iconSizeLarge: field("fab", "icon-size-large", "36px"),
      iconGap: field("fab", "icon-gap", theme.spacing.s),
      extendedPadding: field("fab", "extended-padding", theme.spacing.l),
      elevation: field("fab", "elevation", theme.elevation.level3),
      textStyle: theme.typography.labelLarge,
      touchTarget: "48px",
      soft: { container: c.primaryContainer, content: c.onPrimaryContainer },
      solid: { container: c.primary, content: c.onPrimary },
      raised: { container: c.surfaceContainerHigh, content: c.primary },
    };
  },
};
