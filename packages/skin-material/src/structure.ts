import {
  accordionBase,
  bottomSheetBase,
  cardBase,
  listItemBase,
  listSectionBase,
  menuBase,
  menuItemBase,
  pagedListBase,
  skeletonBase,
  tooltipBase,
  topBarBase,
} from "@srctool/camouflage-core";
import type {
  AccordionSlots,
  AccordionState,
  AccordionStyle,
  BottomSheetSlots,
  BottomSheetState,
  BottomSheetStyle,
  CardSlots,
  CardState,
  CardStyle,
  ListItemSlots,
  ListItemState,
  ListItemStyle,
  ListSectionSlots,
  ListSectionState,
  ListSectionStyle,
  MenuItemSlots,
  MenuItemState,
  MenuItemStyle,
  MenuSlots,
  MenuState,
  MenuStyle,
  PagedListSlots,
  PagedListState,
  PagedListStyle,
  Renderer,
  SkeletonSlots,
  SkeletonState,
  SkeletonStyle,
  TooltipSlots,
  TooltipState,
  TooltipStyle,
  TopBarSlots,
  TopBarState,
  TopBarStyle,
} from "@srctool/camouflage-core";

/** A component-theme field as a custom property with the skin's default: `--camo-list-item-icon-size`. */
const field = (component: string, name: string, fallback: string): string =>
  `var(--camo-${component}-${name}, ${fallback})`;

/** Material's card: Filled by default, Elevated and Outlined beside it. */
export const materialCard: Renderer<CardState, CardSlots, CardStyle> = {
  ...cardBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "soft",
      shape: field("card", "shape", theme.shapes.medium),
      contentPadding: field("card", "content-padding", theme.spacing.l),
      borderWidth: field("card", "border-width", "1px"),
      raisedElevation: field("card", "raised-elevation", theme.elevation.level1),
      selectedBorderWidth: field("card", "selected-border-width", "2px"),
      selectedBorderColor: c.primary,
      showSelectedCheck: false,
      solid: { container: c.primary, content: c.onPrimary },
      soft: { container: c.surfaceContainerHighest, content: c.onSurface },
      raised: { container: c.surfaceContainerLow, content: c.onSurface },
      outline: { container: c.surface, content: c.onSurface, border: c.outlineVariant },
    };
  },
};

/** Material's list item. */
export const materialListItem: Renderer<ListItemState, ListItemSlots, ListItemStyle> = {
  ...listItemBase,
  defaults(theme) {
    return {
      minHeightOneLine: field("list-item", "min-height-one-line", "56px"),
      minHeightTwoLines: field("list-item", "min-height-two-lines", "72px"),
      minHeightThreeLines: field("list-item", "min-height-three-lines", "88px"),
      contentPadding: field("list-item", "content-padding", theme.spacing.l),
      leadingGap: field("list-item", "leading-gap", theme.spacing.l),
      trailingGap: field("list-item", "trailing-gap", theme.spacing.l),
      iconSize: field("list-item", "icon-size", "24px"),
      sectionShape: field("list-item", "section-shape", theme.shapes.none),
      dividers: "inset",
    };
  },
};

/** Material's list section. */
export const materialListSection: Renderer<ListSectionState, ListSectionSlots, ListSectionStyle> = {
  ...listSectionBase,
  defaults(theme) {
    return {
      sectionShape: field("list-item", "section-shape", theme.shapes.none),
      dividers: "inset",
      inset: false,
    };
  },
};

/** Material's accordion. */
export const materialAccordion: Renderer<AccordionState, AccordionSlots, AccordionStyle> = {
  ...accordionBase,
  defaults(theme) {
    return {
      indicator: "chevron",
      indicatorPosition: "end",
      headerMinHeight: field("accordion", "header-min-height", "56px"),
      contentPadding: field("accordion", "content-padding", theme.spacing.l),
    };
  },
};

/** Material's skeleton. */
export const materialSkeleton: Renderer<SkeletonState, SkeletonSlots, SkeletonStyle> = {
  ...skeletonBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      animation: "shimmer",
      baseColor: field("skeleton", "base-color", c.surfaceContainerHighest),
      highlightColor: field("skeleton", "highlight-color", c.surfaceContainerLow),
      cycleDuration: field("skeleton", "cycle-duration", "1500ms"),
      textLineGap: field("skeleton", "text-line-gap", theme.spacing.s),
    };
  },
};

/** Material's paged list. */
export const materialPagedList: Renderer<PagedListState, PagedListSlots, PagedListStyle> = {
  ...pagedListBase,
  defaults(theme) {
    return { gap: theme.spacing.none, indicatorSize: "32px" };
  },
};

/** Material's bottom sheet. */
export const materialBottomSheet: Renderer<BottomSheetState, BottomSheetSlots, BottomSheetStyle> = {
  ...bottomSheetBase,
  defaults(theme) {
    return {
      shape: field("bottom-sheet", "shape", theme.shapes.extraLarge),
      maxWidth: field("bottom-sheet", "max-width", "640px"),
      contentPadding: field("bottom-sheet", "content-padding", theme.spacing.l),
      scrimAlpha: field("bottom-sheet", "scrim-alpha", "32%"),
      handleWidth: field("bottom-sheet", "handle-width", "32px"),
      handleHeight: field("bottom-sheet", "handle-height", "4px"),
      showHandle: true,
      titleAlign: "start",
      showCloseButton: false,
    };
  },
};

/** Material's menu. */
export const materialMenu: Renderer<MenuState, MenuSlots, MenuStyle> = {
  ...menuBase,
  defaults(theme) {
    return {
      shape: field("menu", "shape", theme.shapes.extraSmall),
      minWidth: field("menu", "min-width", "112px"),
      maxWidth: field("menu", "max-width", "280px"),
      contentPadding: field("menu", "content-padding", theme.spacing.s),
      elevation: field("menu", "elevation", theme.elevation.level2),
      itemHeight: field("menu", "item-height", "48px"),
      iconSize: field("menu", "icon-size", "24px"),
    };
  },
};

/** Material's menu item. */
export const materialMenuItem: Renderer<MenuItemState, MenuItemSlots, MenuItemStyle> = {
  ...menuItemBase,
  defaults() {
    return {
      itemHeight: field("menu", "item-height", "48px"),
      iconSize: field("menu", "icon-size", "24px"),
      checkPosition: "trailing",
    };
  },
};

/** Material's tooltip. */
export const materialTooltip: Renderer<TooltipState, TooltipSlots, TooltipStyle> = {
  ...tooltipBase,
  defaults(theme) {
    return {
      shape: field("tooltip", "shape", theme.shapes.extraSmall),
      padding: field("tooltip", "padding", `${theme.spacing.xs} ${theme.spacing.s}`),
      offset: field("tooltip", "offset", "8px"),
      maxWidth: field("tooltip", "max-width", "240px"),
    };
  },
};

/** Material's top bar. */
export const materialTopBar: Renderer<TopBarState, TopBarSlots, TopBarStyle> = {
  ...topBarBase,
  defaults() {
    return {
      titleAlign: "start",
      divider: "never",
      largeTitle: false,
      height: field("top-bar", "height", "64px"),
      iconSize: field("top-bar", "icon-size", "24px"),
    };
  },
};
