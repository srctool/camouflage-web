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

/** Carbon's tile: a square layer; a tile inside a tile steps one gray. */
export const carbonCard: Renderer<CardState, CardSlots, CardStyle> = {
  ...cardBase,
  styles: [
    cardBase.styles ?? [],
    css`
    /* Layering: what a tile holds sits one layer up. */
    ::slotted(*) {
      --camo-color-surface-container-low: var(--camo-color-surface-container);
    }
  `,
  ],
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "soft",
      shape: field("card", "shape", theme.shapes.none),
      contentPadding: field("card", "content-padding", theme.spacing.l),
      borderWidth: field("card", "border-width", "1px"),
      raisedElevation: field("card", "raised-elevation", theme.elevation.level0),
      selectedBorderWidth: field("card", "selected-border-width", "2px"),
      selectedBorderColor: c.primary,
      showSelectedCheck: true,
      solid: { container: c.primary, content: c.onPrimary },
      soft: { container: c.surfaceContainerLow, content: c.onSurface },
      raised: { container: c.surfaceContainerLow, content: c.onSurface },
      outline: { container: "transparent", content: c.onSurface, border: c.outline },
    };
  },
};

/** Carbon's list item. */
export const carbonListItem: Renderer<ListItemState, ListItemSlots, ListItemStyle> = {
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
      minHeightOneLine: field(
        "list-item",
        "min-height-one-line",
        "var(--carbon-density-control, calc(48px - var(--camo-input-pointer, 0) * 8px))",
      ),
      minHeightTwoLines: field("list-item", "min-height-two-lines", "64px"),
      minHeightThreeLines: field("list-item", "min-height-three-lines", "80px"),
      contentPadding: field("list-item", "content-padding", theme.spacing.l),
      leadingGap: field("list-item", "leading-gap", theme.spacing.l),
      trailingGap: field("list-item", "trailing-gap", theme.spacing.l),
      iconSize: field("list-item", "icon-size", "16px"),
      sectionShape: field("list-item", "section-shape", theme.shapes.none),
      dividers: "full",
    };
  },
};

/** Carbon's list section. */
export const carbonListSection: Renderer<ListSectionState, ListSectionSlots, ListSectionStyle> = {
  ...listSectionBase,
  defaults(theme) {
    return {
      sectionShape: field("list-item", "section-shape", theme.shapes.none),
      dividers: "full",
      inset: false,
    };
  },
};

/** Carbon's accordion. */
export const carbonAccordion: Renderer<AccordionState, AccordionSlots, AccordionStyle> = {
  ...accordionBase,
  defaults(theme) {
    return {
      indicator: "chevron",
      indicatorPosition: "end",
      headerMinHeight: field(
        "accordion",
        "header-min-height",
        "var(--carbon-density-control, calc(48px - var(--camo-input-pointer, 0) * 8px))",
      ),
      contentPadding: field("accordion", "content-padding", theme.spacing.l),
    };
  },
};

/** Carbon's skeleton. */
export const carbonSkeleton: Renderer<SkeletonState, SkeletonSlots, SkeletonStyle> = {
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

/** Carbon's paged list. */
export const carbonPagedList: Renderer<PagedListState, PagedListSlots, PagedListStyle> = {
  ...pagedListBase,
  defaults(theme) {
    return { gap: theme.spacing.none, indicatorSize: "32px" };
  },
};

/** Carbon's bottom sheet. */
export const carbonBottomSheet: Renderer<BottomSheetState, BottomSheetSlots, BottomSheetStyle> = {
  ...bottomSheetBase,
  defaults(theme) {
    return {
      shape: field("bottom-sheet", "shape", theme.shapes.none),
      maxWidth: field("bottom-sheet", "max-width", "640px"),
      contentPadding: field("bottom-sheet", "content-padding", theme.spacing.l),
      scrimAlpha: field("bottom-sheet", "scrim-alpha", "50%"),
      handleWidth: field("bottom-sheet", "handle-width", "32px"),
      handleHeight: field("bottom-sheet", "handle-height", "4px"),
      showHandle: false,
      titleAlign: "start",
      showCloseButton: true,
    };
  },
};

/** Carbon's menu. */
export const carbonMenu: Renderer<MenuState, MenuSlots, MenuStyle> = {
  ...menuBase,
  defaults(theme) {
    return {
      shape: field("menu", "shape", theme.shapes.none),
      minWidth: field("menu", "min-width", "160px"),
      maxWidth: field("menu", "max-width", "280px"),
      contentPadding: field("menu", "content-padding", "0px"),
      elevation: field("menu", "elevation", theme.elevation.level3),
      itemHeight: field(
        "menu",
        "item-height",
        "var(--carbon-density-control, calc(48px - var(--camo-input-pointer, 0) * 8px))",
      ),
      iconSize: field("menu", "icon-size", "16px"),
    };
  },
};

/** Carbon's menu item. */
export const carbonMenuItem: Renderer<MenuItemState, MenuItemSlots, MenuItemStyle> = {
  ...menuItemBase,
  defaults() {
    return {
      itemHeight: field(
        "menu",
        "item-height",
        "var(--carbon-density-control, calc(48px - var(--camo-input-pointer, 0) * 8px))",
      ),
      iconSize: field("menu", "icon-size", "16px"),
      checkPosition: "trailing",
    };
  },
};

/** Carbon's tooltip. */
export const carbonTooltip: Renderer<TooltipState, TooltipSlots, TooltipStyle> = {
  ...tooltipBase,
  defaults(theme) {
    return {
      shape: field("tooltip", "shape", theme.shapes.none),
      padding: field("tooltip", "padding", `${theme.spacing.xs} ${theme.spacing.s}`),
      offset: field("tooltip", "offset", "8px"),
      maxWidth: field("tooltip", "max-width", "240px"),
    };
  },
};

/** Carbon's UI shell header: 48 tall and gray 100 in every theme. */
export const carbonTopBar: Renderer<TopBarState, TopBarSlots, TopBarStyle> = {
  ...topBarBase,
  styles: [
    topBarBase.styles ?? [],
    css`
    /* The UI shell header is gray 100 in every Carbon theme. */
    :host {
      --camo-color-surface: var(--carbon-header-background);
      --camo-color-surface-container: var(--carbon-header-background);
      --camo-color-on-surface: var(--carbon-header-text);
      --camo-color-on-surface-variant: var(--carbon-header-text-secondary);
      --camo-color-outline-variant: var(--carbon-header-border);
      --camo-color-primary: var(--carbon-header-interactive);
      color: var(--carbon-header-text);
    }
  `,
  ],
  defaults() {
    return {
      titleAlign: "start",
      divider: "always",
      largeTitle: false,
      height: field("top-bar", "height", "48px"),
      iconSize: field("top-bar", "icon-size", "20px"),
    };
  },
};
