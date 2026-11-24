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

/** minimal's card. */
export const minimalCard: Renderer<CardState, CardSlots, CardStyle> = {
  ...cardBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "raised",
      shape: field("card", "shape", theme.shapes.medium),
      contentPadding: field("card", "content-padding", theme.spacing.l),
      borderWidth: field("card", "border-width", "1px"),
      raisedElevation: field("card", "raised-elevation", theme.elevation.level0),
      selectedBorderWidth: field("card", "selected-border-width", "2px"),
      selectedBorderColor: c.primary,
      showSelectedCheck: false,
      solid: { container: c.primary, content: c.onPrimary },
      soft: { container: c.surfaceContainerHigh, content: c.onSurface },
      raised: { container: c.surface, content: c.onSurface, border: c.outlineVariant },
      outline: { container: "transparent", content: c.onSurface, border: c.outline },
    };
  },
};

/** minimal's list item. */
export const minimalListItem: Renderer<ListItemState, ListItemSlots, ListItemStyle> = {
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

/** minimal's list section: edge to edge, hairlines inset. */
export const minimalListSection: Renderer<ListSectionState, ListSectionSlots, ListSectionStyle> = {
  ...listSectionBase,
  defaults(theme) {
    return {
      sectionShape: field("list-item", "section-shape", theme.shapes.none),
      dividers: "inset",
      inset: false,
    };
  },
};

/** minimal's accordion. */
export const minimalAccordion: Renderer<AccordionState, AccordionSlots, AccordionStyle> = {
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

/** minimal's skeleton. */
export const minimalSkeleton: Renderer<SkeletonState, SkeletonSlots, SkeletonStyle> = {
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

/** minimal's paged list. */
export const minimalPagedList: Renderer<PagedListState, PagedListSlots, PagedListStyle> = {
  ...pagedListBase,
  defaults(theme) {
    return { gap: theme.spacing.none, indicatorSize: "32px" };
  },
};

/** minimal's bottom sheet. */
export const minimalBottomSheet: Renderer<BottomSheetState, BottomSheetSlots, BottomSheetStyle> = {
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

/** minimal's menu. */
export const minimalMenu: Renderer<MenuState, MenuSlots, MenuStyle> = {
  ...menuBase,
  defaults(theme) {
    return {
      shape: field("menu", "shape", theme.shapes.medium),
      minWidth: field("menu", "min-width", "160px"),
      maxWidth: field("menu", "max-width", "280px"),
      contentPadding: field("menu", "content-padding", theme.spacing.s),
      elevation: field("menu", "elevation", theme.elevation.level2),
      itemHeight: field("menu", "item-height", "44px"),
      iconSize: field("menu", "icon-size", "20px"),
    };
  },
};

/** minimal's menu item. */
export const minimalMenuItem: Renderer<MenuItemState, MenuItemSlots, MenuItemStyle> = {
  ...menuItemBase,
  defaults() {
    return {
      itemHeight: field("menu", "item-height", "44px"),
      iconSize: field("menu", "icon-size", "20px"),
      checkPosition: "trailing",
    };
  },
};

/** minimal's tooltip. */
export const minimalTooltip: Renderer<TooltipState, TooltipSlots, TooltipStyle> = {
  ...tooltipBase,
  defaults(theme) {
    return {
      shape: field("tooltip", "shape", theme.shapes.small),
      padding: field("tooltip", "padding", `${theme.spacing.xs} ${theme.spacing.s}`),
      offset: field("tooltip", "offset", "8px"),
      maxWidth: field("tooltip", "max-width", "240px"),
    };
  },
};

/** minimal's top bar: flat, a hairline when scrolled. */
export const minimalTopBar: Renderer<TopBarState, TopBarSlots, TopBarStyle> = {
  ...topBarBase,
  defaults() {
    return {
      titleAlign: "start",
      divider: "when-scrolled",
      largeTitle: false,
      height: field("top-bar", "height", "56px"),
      iconSize: field("top-bar", "icon-size", "24px"),
    };
  },
};
