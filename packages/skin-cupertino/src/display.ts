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

/** cupertino's chip: a capsule, a soft fill by default; a selected filter is the accent. */
export const cupertinoChip: Renderer<ChipState, ChipSlots, ChipStyle> = {
  ...chipBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "soft",
      height: field("chip", "height", "32px"),
      shape: field("chip", "shape", theme.shapes.full),
      paddingInline: field("chip", "padding", theme.spacing.l),
      iconPadding: field("chip", "icon-padding", theme.spacing.m),
      iconGap: field("chip", "icon-gap", theme.spacing.s),
      iconSize: field("chip", "icon-size", "18px"),
      borderWidth: field("chip", "border-width", "1px"),
      textStyle: theme.typography.labelLarge,
      touchTarget: "48px",
      groupSpacing: field("chip", "group-spacing", theme.spacing.s),
      showCheckWhenSelected: false,
      outline: { container: "transparent", content: c.primary, border: c.outlineVariant },
      soft: { container: c.surfaceContainerHigh, content: c.onSurface },
      solid: { container: c.primary, content: c.onPrimary },
      selectedColors: { container: c.primary, content: c.onPrimary },
    };
  },
};

/** cupertino's badge: iOS's red count pill. */
export const cupertinoBadge: Renderer<BadgeState, BadgeSlots, BadgeStyle> = {
  ...badgeBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "solid",
      defaultTone: "error",
      dotSize: field("badge", "dot-size", "10px"),
      height: field("badge", "height", "18px"),
      minWidth: field("badge", "min-width", "18px"),
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

/** cupertino's avatar: contact-style circles on tinted containers, 28, 40 and 56. */
export const cupertinoAvatar: Renderer<AvatarState, AvatarSlots, AvatarStyle> = {
  ...avatarBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      shape: "circle",
      roundedShape: field("avatar", "rounded-shape", theme.shapes.medium),
      sizeSmall: field("avatar", "size-small", "28px"),
      sizeMedium: field("avatar", "size-medium", "40px"),
      sizeLarge: field("avatar", "size-large", "56px"),
      presenceSize: field("avatar", "presence-size", "12px"),
      ringWidth: field("avatar", "ring-width", "2px"),
      groupOverlap: field("avatar", "group-overlap", theme.spacing.m),
      textStyleSmall: theme.typography.labelMedium,
      textStyleMedium: theme.typography.titleSmall,
      textStyleLarge: theme.typography.titleLarge,
      palette: [
        { container: c.primaryContainer, content: c.onPrimaryContainer },
        { container: c.secondaryContainer, content: c.onSecondaryContainer },
        { container: c.tertiaryContainer, content: c.onTertiaryContainer },
        { container: c.infoContainer, content: c.onInfoContainer },
        { container: c.successContainer, content: c.onSuccessContainer },
      ],
      neutral: { container: c.surfaceContainerHighest, content: c.onSurfaceVariant },
      presenceColors: { online: c.success, away: c.warning, busy: c.error, offline: c.outline },
      ringColor: c.surface,
    };
  },
};

/** cupertino's FAB: iOS has none, so a prominent circular button with a shadow. */
export const cupertinoFab: Renderer<FabState, FabSlots, FabStyle> = {
  ...fabBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "solid",
      size: "regular",
      sizeSmall: field("fab", "size-small", "44px"),
      sizeRegular: field("fab", "size-regular", "56px"),
      sizeLarge: field("fab", "size-large", "72px"),
      extendedHeight: field("fab", "extended-height", "52px"),
      shapeSmall: field("fab", "shape-small", theme.shapes.full),
      shapeRegular: field("fab", "shape-regular", theme.shapes.full),
      shapeLarge: field("fab", "shape-large", theme.shapes.full),
      iconSizeRegular: field("fab", "icon-size-regular", "24px"),
      iconSizeLarge: field("fab", "icon-size-large", "32px"),
      iconGap: field("fab", "icon-gap", theme.spacing.s),
      extendedPadding: field("fab", "extended-padding", theme.spacing.xl),
      elevation: field("fab", "elevation", theme.elevation.level3),
      textStyle: theme.typography.labelLarge,
      touchTarget: "48px",
      soft: { container: c.primaryContainer, content: c.onPrimaryContainer },
      solid: { container: c.primary, content: c.onPrimary },
      raised: { container: c.surface, content: c.primary },
    };
  },
};
