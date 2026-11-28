import {
  GLYPHS,
  breadcrumbBase,
  buttonGroupBase,
  carouselBase,
  dataTableBase,
  fileUploaderBase,
  groupButtonBase,
  imageBase,
  paginationBase,
  popoverBase,
  progressStepsBase,
  ratingBase,
  sideSheetBase,
  splitButtonBase,
  toolbarBase,
  treeBase,
} from "@srctool/camouflage-core";
import type {
  BreadcrumbSlots,
  BreadcrumbState,
  BreadcrumbStyle,
  ButtonGroupSlots,
  ButtonGroupState,
  ButtonGroupStyle,
  CamoTheme,
  CarouselSlots,
  CarouselState,
  CarouselStyle,
  DataTableSlots,
  DataTableState,
  DataTableStyle,
  FileUploaderSlots,
  FileUploaderState,
  FileUploaderStyle,
  GroupButtonSlots,
  GroupButtonState,
  ImageSlots,
  ImageState,
  ImageStyle,
  PaginationSlots,
  PaginationState,
  PaginationStyle,
  PopoverSlots,
  PopoverState,
  PopoverStyle,
  RatingSlots,
  RatingState,
  RatingStyle,
  Renderer,
  SideSheetSlots,
  SideSheetState,
  SideSheetStyle,
  SplitButtonSlots,
  SplitButtonState,
  SplitButtonStyle,
  StepSlots,
  StepState,
  StepStyle,
  ToolbarSlots,
  ToolbarState,
  ToolbarStyle,
  TreeSlots,
  TreeNodeState,
  TreeStyle,
} from "@srctool/camouflage-core";

/** A component-theme field as a custom property with the skin's default: `--camo-split-button-height`. */
const field = (component: string, name: string, fallback: string): string =>
  `var(--camo-${component}-${name}, ${fallback})`;

/** The button's six appearances, which a group and a split button draw with (Carbon: ink, hairlines). */
function appearances(
  theme: CamoTheme,
): Pick<ButtonGroupStyle, "solid" | "soft" | "raised" | "outline" | "ghost" | "link"> {
  const c = theme.colors;
  const clear = "transparent";
  return {
    solid: { container: c.primary, content: c.onPrimary },
    soft: { container: c.secondary, content: c.onSecondary },
    raised: { container: c.secondary, content: c.onSecondary },
    outline: { container: clear, content: c.primary, border: c.primary },
    ghost: { container: clear, content: c.primary },
    link: { container: clear, content: c.primary },
  };
}

/** Carbon's button group. */
export const carbonButtonGroup: Renderer<ButtonGroupState, ButtonGroupSlots, ButtonGroupStyle> = {
  ...buttonGroupBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      ...appearances(theme),
      defaultAppearance: "outline",
      height: field(
        "button-group",
        "height",
        "var(--camo-density-control, var(--carbon-density-control, calc(48px - var(--camo-input-pointer, 0) * 8px)))",
      ),
      shape: field("button-group", "shape", theme.shapes.none),
      innerShape: field("button-group", "inner-shape", theme.shapes.none),
      spacing: field("button-group", "spacing", "1px"),
      borderWidth: field("button-group", "border-width", "1px"),
      iconSize: field("button-group", "icon-size", "16px"),
      iconGap: field("button-group", "icon-gap", theme.spacing.s),
      textStyle: theme.typography.labelLarge,
      selected: { container: c.inverseSurface, content: c.inverseOnSurface },
    };
  },
};

/** Carbon's group button; a toggle that is on is the ink fill. */
export const carbonGroupButton: Renderer<GroupButtonState, GroupButtonSlots, ButtonGroupStyle> = {
  ...groupButtonBase,
  defaults: (theme) => carbonButtonGroup.defaults(theme),
};

/** Carbon's split button. */
export const carbonSplitButton: Renderer<SplitButtonState, SplitButtonSlots, SplitButtonStyle> = {
  ...splitButtonBase,
  defaults(theme) {
    return {
      ...appearances(theme),
      defaultAppearance: "solid",
      height: field(
        "split-button",
        "height",
        "var(--camo-density-control, var(--carbon-density-control, calc(48px - var(--camo-input-pointer, 0) * 8px)))",
      ),
      shape: field("split-button", "shape", theme.shapes.none),
      innerShape: field("split-button", "inner-shape", theme.shapes.none),
      arrowWidth: field(
        "split-button",
        "arrow-width",
        "var(--camo-density-control, var(--carbon-density-control, calc(48px - var(--camo-input-pointer, 0) * 8px)))",
      ),
      gap: field("split-button", "gap", "1px"),
      padding: field("split-button", "padding", theme.spacing.l),
      iconSize: field("split-button", "icon-size", "16px"),
      iconGap: field("split-button", "icon-gap", theme.spacing.s),
      textStyle: theme.typography.labelLarge,
    };
  },
};

/** Carbon's popover. */
export const carbonPopover: Renderer<PopoverState, PopoverSlots, PopoverStyle> = {
  ...popoverBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      shape: field("popover", "shape", theme.shapes.none),
      maxWidth: field("popover", "max-width", "320px"),
      padding: field("popover", "padding", theme.spacing.l),
      showArrow: true,
      arrowWidth: field("popover", "arrow-width", "16px"),
      arrowHeight: field("popover", "arrow-height", "8px"),
      elevation: field("popover", "elevation", theme.elevation.level3),
      gap: field("popover", "gap", theme.spacing.s),
      titleStyle: theme.typography.titleSmall,
      container: c.surfaceContainerLow,
      titleColor: c.onSurface,
      contentColor: c.onSurfaceVariant,
      border: `1px solid ${c.outlineVariant}`,
    };
  },
};

/** Carbon's side sheet. */
export const carbonSideSheet: Renderer<SideSheetState, SideSheetSlots, SideSheetStyle> = {
  ...sideSheetBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      width: field("side-sheet", "width", "320px"),
      modalShape: field("side-sheet", "modal-shape", theme.shapes.none),
      padding: field("side-sheet", "padding", theme.spacing.l),
      scrimAlpha: field("side-sheet", "scrim-alpha", "50%"),
      showDivider: true,
      titleStyle: theme.typography.titleLarge,
      container: c.surfaceContainerLow,
      modalContainer: c.surfaceContainerLow,
      titleColor: c.onSurface,
      divider: c.outlineVariant,
    };
  },
};

/** Carbon's toolbar. */
export const carbonToolbar: Renderer<ToolbarState, ToolbarSlots, ToolbarStyle> = {
  ...toolbarBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      placement: "docked",
      height: field("toolbar", "height", "48px"),
      floatingMargin: field("toolbar", "floating-margin", theme.spacing.l),
      floatingShape: field("toolbar", "floating-shape", theme.shapes.none),
      floatingElevation: theme.elevation.level2,
      actionSpacing: field("toolbar", "action-spacing", "0px"),
      actionSize: field(
        "toolbar",
        "action-size",
        "var(--camo-density-control, var(--carbon-density-control, calc(48px - var(--camo-input-pointer, 0) * 8px)))",
      ),
      padding: field("toolbar", "padding", theme.spacing.s),
      showDivider: true,
      container: c.surface,
      divider: c.outlineVariant,
    };
  },
};

/** Carbon's image frame. */
export const carbonImage: Renderer<ImageState, ImageSlots, ImageStyle> = {
  ...imageBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      borderWidth: field("image", "border-width", "0px"),
      fade: "200ms",
      placeholderIcon: GLYPHS.image,
      errorIcon: GLYPHS.brokenImage,
      placeholder: c.surfaceContainerHigh,
      icon: c.onSurfaceVariant,
      border: c.outlineVariant,
    };
  },
};

/** Carbon's rating. */
export const carbonRating: Renderer<RatingState, RatingSlots, RatingStyle> = {
  ...ratingBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      icon: GLYPHS.star,
      smallSize: field("rating", "small-size", "16px"),
      mediumSize: field("rating", "medium-size", "20px"),
      largeSize: field("rating", "large-size", "32px"),
      gap: field("rating", "gap", theme.spacing.xs),
      filled: c.onSurface,
      empty: c.outlineVariant,
      hover: c.onSurface,
      disabled: c.outlineVariant,
    };
  },
};

/** Carbon's carousel. */
export const carbonCarousel: Renderer<CarouselState, CarouselSlots, CarouselStyle> = {
  ...carouselBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      itemShape: field("carousel", "item-shape", theme.shapes.none),
      itemSpacing: field("carousel", "item-spacing", theme.spacing.m),
      peek: field("carousel", "peek", "24px"),
      buttonSize: field("carousel", "button-size", "40px"),
      buttonContainer: `color-mix(in srgb, ${c.scrim} 48%, transparent)`,
      buttonContent: c.inverseOnSurface,
      dot: c.outlineVariant,
      activeDot: c.primary,
      dotSize: "8px",
      previousIcon: GLYPHS.chevronLeft,
      nextIcon: GLYPHS.chevronRight,
    };
  },
};

/** Carbon's file uploader. */
export const carbonFileUploader: Renderer<FileUploaderState, FileUploaderSlots, FileUploaderStyle> =
  {
    ...fileUploaderBase,
    defaults(theme) {
      const c = theme.colors;
      return {
        zoneShape: field("file-uploader", "zone-shape", theme.shapes.none),
        zoneHeight: field("file-uploader", "zone-height", "120px"),
        dashed: true,
        icon: GLYPHS.upload,
        removeIcon: GLYPHS.close,
        retryIcon: GLYPHS.retry,
        titleStyle: theme.typography.labelLarge,
        hintStyle: theme.typography.bodySmall,
        zone: c.surfaceContainerLow,
        border: c.outline,
        dragBorder: c.primary,
        error: c.error,
        text: c.onSurface,
        mutedText: c.onSurfaceVariant,
      };
    },
  };

/** Carbon's data table. */
export const carbonDataTable: Renderer<DataTableState, DataTableSlots, DataTableStyle> = {
  ...dataTableBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      headerHeight: field(
        "data-table",
        "header-height",
        "var(--camo-density-control, var(--carbon-density-control, calc(48px - var(--camo-input-pointer, 0) * 8px)))",
      ),
      rowHeight: field(
        "data-table",
        "row-height",
        "var(--camo-density-control, var(--carbon-density-control, calc(48px - var(--camo-input-pointer, 0) * 8px)))",
      ),
      cellPadding: field("data-table", "cell-padding", theme.spacing.l),
      striped: false,
      dividers: true,
      stickyHeader: true,
      headerStyle: theme.typography.labelLarge,
      cellStyle: theme.typography.bodyMedium,
      sortIcon: GLYPHS.arrowUp,
      container: c.surface,
      header: c.surfaceContainerHigh,
      row: c.surface,
      stripedRow: c.surfaceContainerLow,
      selectedRow: c.surfaceContainerHigh,
      divider: c.outlineVariant,
      text: c.onSurface,
      headerText: c.onSurface,
    };
  },
};

/** Carbon's tree. */
export const carbonTree: Renderer<TreeNodeState, TreeSlots, TreeStyle> = {
  ...treeBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      rowHeight: field(
        "tree",
        "row-height",
        "var(--camo-density-control, var(--carbon-density-control, calc(48px - var(--camo-input-pointer, 0) * 16px)))",
      ),
      indent: field("tree", "indent", "24px"),
      iconSize: field("tree", "icon-size", "16px"),
      showLines: false,
      textStyle: theme.typography.bodyMedium,
      chevron: GLYPHS.chevronRight,
      selected: c.surfaceContainerHigh,
      selectedText: c.onSurface,
      line: c.outlineVariant,
      text: c.onSurface,
      chevronColor: c.onSurfaceVariant,
    };
  },
};

/** Carbon's pagination. */
export const carbonPagination: Renderer<PaginationState, PaginationSlots, PaginationStyle> = {
  ...paginationBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      buttonSize: field(
        "pagination",
        "button-size",
        "var(--camo-density-control, var(--carbon-density-control, calc(48px - var(--camo-input-pointer, 0) * 8px)))",
      ),
      shape: field("pagination", "shape", theme.shapes.none),
      dotSize: field("pagination", "dot-size", "8px"),
      textStyle: theme.typography.labelLarge,
      previousIcon: GLYPHS.chevronLeft,
      nextIcon: GLYPHS.chevronRight,
      currentContainer: c.primary,
      currentContent: c.onPrimary,
      content: c.onSurface,
      dot: c.outlineVariant,
      activeDot: c.primary,
    };
  },
};

/** Carbon's breadcrumb. */
export const carbonBreadcrumb: Renderer<BreadcrumbState, BreadcrumbSlots, BreadcrumbStyle> = {
  ...breadcrumbBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      itemPadding: field("breadcrumb", "item-padding", theme.spacing.s),
      separator: { svg: '<path d="M14.6 5l1.4.5L9.4 19 8 18.5z"/>', viewBox: "0 0 24 24" },
      overflowIcon: GLYPHS.moreHorizontal,
      textStyle: theme.typography.bodyMedium,
      link: c.primary,
      current: c.onSurface,
      separatorColor: c.outline,
      hover: c.surfaceContainerHigh,
    };
  },
};

/** Carbon's progress steps. */
export const carbonProgressSteps: Renderer<StepState, StepSlots, StepStyle> = {
  ...progressStepsBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      markerSize: field("progress-steps", "marker-size", "16px"),
      connectorWidth: field("progress-steps", "connector-width", "1px"),
      showNumbers: false,
      labelStyle: theme.typography.labelLarge,
      descriptionStyle: theme.typography.bodySmall,
      checkIcon: GLYPHS.check,
      errorIcon: GLYPHS.alert,
      complete: c.primary,
      onComplete: c.onPrimary,
      current: c.primary,
      onCurrent: c.onPrimary,
      upcoming: c.outline,
      error: c.error,
      onError: c.onError,
      connector: c.outlineVariant,
      text: c.onSurface,
      mutedText: c.onSurfaceVariant,
    };
  },
};
