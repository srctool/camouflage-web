import { css } from "lit";
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

/** Fluent's card: radius 8 with shadow4. */
export const fluentCard: Renderer<CardState, CardSlots, CardStyle> = {
  ...cardBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "raised",
      shape: field("card", "shape", theme.shapes.large),
      contentPadding: field("card", "content-padding", "12px"),
      borderWidth: field("card", "border-width", "1px"),
      raisedElevation: field("card", "raised-elevation", theme.elevation.level2),
      selectedBorderWidth: field("card", "selected-border-width", "2px"),
      selectedBorderColor: c.primary,
      showSelectedCheck: false,
      solid: { container: c.primary, content: c.onPrimary },
      soft: { container: c.surfaceContainerLow, content: c.onSurface },
      raised: { container: c.surface, content: c.onSurface },
      outline: { container: "transparent", content: c.onSurface, border: c.outlineVariant },
    };
  },
};

/** Fluent's list item. */
export const fluentListItem: Renderer<ListItemState, ListItemSlots, ListItemStyle> = {
  ...listItemBase,
  styles: [
    listItemBase.styles ?? [],
    css`
    /* A row shorter than 48 (a pointer's density) still answers to a 48 touch. */
    :host([clickable]) .row::before,
    :host([selectable]) .row::before {
      content: "";
      position: absolute;
      inset-inline: 0;
      inset-block: min(var(--camo-spacing-none), calc((100% - var(--camo-list-item-touch-target, 48px)) / 2));
    }
    `,
  ],
  defaults(theme) {
    return {
      minHeightOneLine: field("list-item", "min-height-one-line", "40px"),
      minHeightTwoLines: field("list-item", "min-height-two-lines", "56px"),
      minHeightThreeLines: field("list-item", "min-height-three-lines", "72px"),
      contentPadding: field("list-item", "content-padding", "12px"),
      leadingGap: field("list-item", "leading-gap", "12px"),
      trailingGap: field("list-item", "trailing-gap", theme.spacing.l),
      iconSize: field("list-item", "icon-size", "20px"),
      sectionShape: field("list-item", "section-shape", theme.shapes.none),
      dividers: "inset",
    };
  },
};

/** Fluent's list section. */
export const fluentListSection: Renderer<ListSectionState, ListSectionSlots, ListSectionStyle> = {
  ...listSectionBase,
  defaults(theme) {
    return {
      sectionShape: field("list-item", "section-shape", theme.shapes.none),
      dividers: "inset",
      inset: false,
    };
  },
};

/** Fluent's accordion. */
export const fluentAccordion: Renderer<AccordionState, AccordionSlots, AccordionStyle> = {
  ...accordionBase,
  defaults() {
    return {
      indicator: "chevron",
      indicatorPosition: "start",
      headerMinHeight: field("accordion", "header-min-height", "44px"),
      contentPadding: field("accordion", "content-padding", "12px"),
    };
  },
};

/** Fluent's skeleton. */
export const fluentSkeleton: Renderer<SkeletonState, SkeletonSlots, SkeletonStyle> = {
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

/** Fluent's paged list. */
export const fluentPagedList: Renderer<PagedListState, PagedListSlots, PagedListStyle> = {
  ...pagedListBase,
  defaults(theme) {
    return { gap: theme.spacing.none, indicatorSize: "32px" };
  },
};

/** Fluent's bottom sheet. */
export const fluentBottomSheet: Renderer<BottomSheetState, BottomSheetSlots, BottomSheetStyle> = {
  ...bottomSheetBase,
  defaults(theme) {
    return {
      shape: field("bottom-sheet", "shape", theme.shapes.large),
      maxWidth: field("bottom-sheet", "max-width", "640px"),
      contentPadding: field("bottom-sheet", "content-padding", theme.spacing.l),
      scrimAlpha: field("bottom-sheet", "scrim-alpha", "40%"),
      handleWidth: field("bottom-sheet", "handle-width", "32px"),
      handleHeight: field("bottom-sheet", "handle-height", "4px"),
      showHandle: false,
      titleAlign: "start",
      showCloseButton: true,
    };
  },
};

/** Fluent's menu. */
export const fluentMenu: Renderer<MenuState, MenuSlots, MenuStyle> = {
  ...menuBase,
  defaults(theme) {
    return {
      shape: field("menu", "shape", theme.shapes.small),
      minWidth: field("menu", "min-width", "160px"),
      maxWidth: field("menu", "max-width", "280px"),
      contentPadding: field("menu", "content-padding", theme.spacing.xs),
      elevation: field("menu", "elevation", theme.elevation.level4),
      itemHeight: field("menu", "item-height", "32px"),
      iconSize: field("menu", "icon-size", "16px"),
    };
  },
};

/** Fluent's menu item. */
export const fluentMenuItem: Renderer<MenuItemState, MenuItemSlots, MenuItemStyle> = {
  ...menuItemBase,
  defaults() {
    return {
      itemHeight: field("menu", "item-height", "32px"),
      iconSize: field("menu", "icon-size", "16px"),
      checkPosition: "leading",
    };
  },
};

/** Fluent's tooltip. */
export const fluentTooltip: Renderer<TooltipState, TooltipSlots, TooltipStyle> = {
  ...tooltipBase,
  styles: [
    tooltipBase.styles ?? [],
    css`
    :host {
      --camo-color-inverse-surface: var(--camo-color-surface);
      --camo-color-inverse-on-surface: var(--camo-color-on-surface);
    }
    .tip {
      box-shadow:
        0 0 var(--camo-spacing-xxs) var(--fluent-shadow-ambient),
        0 var(--camo-spacing-xs) var(--camo-spacing-s) var(--fluent-shadow-key);
    }
  `,
  ],
  defaults(theme) {
    return {
      shape: field("tooltip", "shape", theme.shapes.small),
      padding: field("tooltip", "padding", `${theme.spacing.xs} ${theme.spacing.s}`),
      offset: field("tooltip", "offset", "4px"),
      maxWidth: field("tooltip", "max-width", "240px"),
    };
  },
};

/** Fluent's top bar. */
export const fluentTopBar: Renderer<TopBarState, TopBarSlots, TopBarStyle> = {
  ...topBarBase,
  defaults() {
    return {
      titleAlign: "start",
      divider: "when-scrolled",
      largeTitle: false,
      height: field("top-bar", "height", "48px"),
      iconSize: field("top-bar", "icon-size", "20px"),
    };
  },
};
