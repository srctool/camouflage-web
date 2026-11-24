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

/** cupertino's card. */
export const cupertinoCard: Renderer<CardState, CardSlots, CardStyle> = {
  ...cardBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "raised",
      shape: field("card", "shape", theme.shapes.large),
      contentPadding: field("card", "content-padding", theme.spacing.l),
      borderWidth: field("card", "border-width", "1px"),
      raisedElevation: field("card", "raised-elevation", theme.elevation.level0),
      selectedBorderWidth: field("card", "selected-border-width", "2px"),
      selectedBorderColor: c.primary,
      showSelectedCheck: true,
      solid: { container: c.primary, content: c.onPrimary },
      soft: { container: c.surfaceContainerHigh, content: c.onSurface },
      raised: { container: c.surfaceContainerLowest, content: c.onSurface },
      outline: { container: "transparent", content: c.onSurface, border: c.outline },
    };
  },
};

/** cupertino's list item. */
export const cupertinoListItem: Renderer<ListItemState, ListItemSlots, ListItemStyle> = {
  ...listItemBase,
  defaults(theme) {
    return {
      minHeightOneLine: field("list-item", "min-height-one-line", "48px"),
      minHeightTwoLines: field("list-item", "min-height-two-lines", "64px"),
      minHeightThreeLines: field("list-item", "min-height-three-lines", "80px"),
      contentPadding: field("list-item", "content-padding", theme.spacing.l),
      leadingGap: field("list-item", "leading-gap", theme.spacing.l),
      trailingGap: field("list-item", "trailing-gap", theme.spacing.l),
      iconSize: field("list-item", "icon-size", "28px"),
      sectionShape: field("list-item", "section-shape", theme.shapes.medium),
      dividers: "inset",
    };
  },
};

/** cupertino's list section: inset grouped. */
export const cupertinoListSection: Renderer<ListSectionState, ListSectionSlots, ListSectionStyle> =
  {
    ...listSectionBase,
    defaults(theme) {
      return {
        sectionShape: field("list-item", "section-shape", theme.shapes.medium),
        dividers: "inset",
        inset: true,
      };
    },
  };

/** cupertino's accordion. */
export const cupertinoAccordion: Renderer<AccordionState, AccordionSlots, AccordionStyle> = {
  ...accordionBase,
  defaults(theme) {
    return {
      indicator: "chevron",
      indicatorPosition: "start",
      headerMinHeight: field("accordion", "header-min-height", "44px"),
      contentPadding: field("accordion", "content-padding", theme.spacing.l),
    };
  },
};

/** cupertino's skeleton. */
export const cupertinoSkeleton: Renderer<SkeletonState, SkeletonSlots, SkeletonStyle> = {
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

/** cupertino's paged list. */
export const cupertinoPagedList: Renderer<PagedListState, PagedListSlots, PagedListStyle> = {
  ...pagedListBase,
  defaults(theme) {
    return { gap: theme.spacing.none, indicatorSize: "32px" };
  },
};

/** cupertino's bottom sheet. */
export const cupertinoBottomSheet: Renderer<BottomSheetState, BottomSheetSlots, BottomSheetStyle> =
  {
    ...bottomSheetBase,
    defaults(theme) {
      return {
        shape: field("bottom-sheet", "shape", theme.shapes.large),
        maxWidth: field("bottom-sheet", "max-width", "640px"),
        contentPadding: field("bottom-sheet", "content-padding", theme.spacing.l),
        scrimAlpha: field("bottom-sheet", "scrim-alpha", "32%"),
        handleWidth: field("bottom-sheet", "handle-width", "36px"),
        handleHeight: field("bottom-sheet", "handle-height", "5px"),
        showHandle: true,
        titleAlign: "center",
        showCloseButton: false,
      };
    },
  };

/** cupertino's menu. */
export const cupertinoMenu: Renderer<MenuState, MenuSlots, MenuStyle> = {
  ...menuBase,
  defaults(theme) {
    return {
      shape: field("menu", "shape", theme.shapes.large),
      minWidth: field("menu", "min-width", "200px"),
      maxWidth: field("menu", "max-width", "280px"),
      contentPadding: field("menu", "content-padding", theme.spacing.s),
      elevation: field("menu", "elevation", theme.elevation.level3),
      itemHeight: field("menu", "item-height", "44px"),
      iconSize: field("menu", "icon-size", "20px"),
    };
  },
};

/** cupertino's menu item. */
export const cupertinoMenuItem: Renderer<MenuItemState, MenuItemSlots, MenuItemStyle> = {
  ...menuItemBase,
  defaults() {
    return {
      itemHeight: field("menu", "item-height", "44px"),
      iconSize: field("menu", "icon-size", "20px"),
      checkPosition: "leading",
    };
  },
};

/** cupertino's tooltip. */
export const cupertinoTooltip: Renderer<TooltipState, TooltipSlots, TooltipStyle> = {
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

/** cupertino's top bar: a large title that collapses, a centered small one. */
export const cupertinoTopBar: Renderer<TopBarState, TopBarSlots, TopBarStyle> = {
  ...topBarBase,
  defaults() {
    return {
      titleAlign: "center",
      divider: "when-scrolled",
      largeTitle: true,
      height: field("top-bar", "height", "44px"),
      iconSize: field("top-bar", "icon-size", "24px"),
    };
  },
};
