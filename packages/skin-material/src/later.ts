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

/** The button's six appearances, which a group and a split button draw with (Material: ink, hairlines). */
function appearances(
  theme: CamoTheme,
): Pick<ButtonGroupStyle, "solid" | "soft" | "raised" | "outline" | "ghost" | "link"> {
  const c = theme.colors;
  const clear = "transparent";
  return {
    solid: { container: c.primary, content: c.onPrimary },
    soft: { container: c.secondaryContainer, content: c.onSecondaryContainer },
    raised: { container: c.surface, content: c.onSurface, border: c.outline },
    outline: { container: clear, content: c.primary, border: c.outline },
    ghost: { container: clear, content: c.primary },
    link: { container: clear, content: c.primary },
  };
}

/** Material's button group. */
export const materialButtonGroup: Renderer<ButtonGroupState, ButtonGroupSlots, ButtonGroupStyle> = {
  ...buttonGroupBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      ...appearances(theme),
      defaultAppearance: "outline",
      height: field("button-group", "height", "40px"),
      shape: field("button-group", "shape", theme.shapes.full),
      innerShape: field("button-group", "inner-shape", theme.shapes.small),
      spacing: field("button-group", "spacing", theme.spacing.xxs),
      borderWidth: field("button-group", "border-width", "1px"),
      iconSize: field("button-group", "icon-size", "16px"),
      iconGap: field("button-group", "icon-gap", theme.spacing.s),
      textStyle: theme.typography.labelLarge,
      selected: { container: c.primary, content: c.onPrimary },
    };
  },
};

/** Material's group button; a toggle that is on is the ink fill. */
export const materialGroupButton: Renderer<GroupButtonState, GroupButtonSlots, ButtonGroupStyle> = {
  ...groupButtonBase,
  defaults: (theme) => materialButtonGroup.defaults(theme),
};

/** Material's split button. */
export const materialSplitButton: Renderer<SplitButtonState, SplitButtonSlots, SplitButtonStyle> = {
  ...splitButtonBase,
  defaults(theme) {
    return {
      ...appearances(theme),
      defaultAppearance: "solid",
      height: field("split-button", "height", "40px"),
      shape: field("split-button", "shape", theme.shapes.full),
      innerShape: field("split-button", "inner-shape", theme.shapes.extraSmall),
      arrowWidth: field("split-button", "arrow-width", "40px"),
      gap: field("split-button", "gap", "2px"),
      padding: field("split-button", "padding", theme.spacing.l),
      iconSize: field("split-button", "icon-size", "16px"),
      iconGap: field("split-button", "icon-gap", theme.spacing.s),
      textStyle: theme.typography.labelLarge,
    };
  },
};

/** Material's popover. */
export const materialPopover: Renderer<PopoverState, PopoverSlots, PopoverStyle> = {
  ...popoverBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      shape: field("popover", "shape", theme.shapes.medium),
      maxWidth: field("popover", "max-width", "320px"),
      padding: field("popover", "padding", theme.spacing.l),
      showArrow: false,
      arrowWidth: field("popover", "arrow-width", "16px"),
      arrowHeight: field("popover", "arrow-height", "8px"),
      elevation: field("popover", "elevation", theme.elevation.level2),
      gap: field("popover", "gap", theme.spacing.s),
      titleStyle: theme.typography.titleSmall,
      container: c.surfaceContainer,
      titleColor: c.onSurface,
      contentColor: c.onSurfaceVariant,
      border: null,
    };
  },
};

/** Material's side sheet. */
export const materialSideSheet: Renderer<SideSheetState, SideSheetSlots, SideSheetStyle> = {
  ...sideSheetBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      width: field("side-sheet", "width", "360px"),
      modalShape: field("side-sheet", "modal-shape", theme.shapes.large),
      padding: field("side-sheet", "padding", theme.spacing.l),
      scrimAlpha: field("side-sheet", "scrim-alpha", "32%"),
      showDivider: true,
      titleStyle: theme.typography.titleLarge,
      container: c.surface,
      modalContainer: c.surfaceContainerLow,
      titleColor: c.onSurface,
      divider: c.outlineVariant,
    };
  },
};

/** Material's toolbar. */
export const materialToolbar: Renderer<ToolbarState, ToolbarSlots, ToolbarStyle> = {
  ...toolbarBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      placement: "docked",
      height: field("toolbar", "height", "64px"),
      floatingMargin: field("toolbar", "floating-margin", theme.spacing.l),
      floatingShape: field("toolbar", "floating-shape", theme.shapes.full),
      floatingElevation: theme.elevation.level3,
      actionSpacing: field("toolbar", "action-spacing", theme.spacing.xs),
      actionSize: field("toolbar", "action-size", "40px"),
      padding: field("toolbar", "padding", theme.spacing.s),
      showDivider: false,
      container: c.surfaceContainer,
      divider: c.outlineVariant,
    };
  },
};

/** Material's image frame. */
export const materialImage: Renderer<ImageState, ImageSlots, ImageStyle> = {
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

/** Material's rating. */
export const materialRating: Renderer<RatingState, RatingSlots, RatingStyle> = {
  ...ratingBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      icon: GLYPHS.star,
      smallSize: field("rating", "small-size", "16px"),
      mediumSize: field("rating", "medium-size", "24px"),
      largeSize: field("rating", "large-size", "32px"),
      gap: field("rating", "gap", theme.spacing.xs),
      filled: c.primary,
      empty: c.outline,
      hover: c.primary,
      disabled: c.outlineVariant,
    };
  },
};

/** Material's carousel. */
export const materialCarousel: Renderer<CarouselState, CarouselSlots, CarouselStyle> = {
  ...carouselBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      itemShape: field("carousel", "item-shape", theme.shapes.extraLarge),
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

/** Material's file uploader. */
export const materialFileUploader: Renderer<
  FileUploaderState,
  FileUploaderSlots,
  FileUploaderStyle
> = {
  ...fileUploaderBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      zoneShape: field("file-uploader", "zone-shape", theme.shapes.medium),
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

/** Material's data table. */
export const materialDataTable: Renderer<DataTableState, DataTableSlots, DataTableStyle> = {
  ...dataTableBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      headerHeight: field("data-table", "header-height", "48px"),
      rowHeight: field("data-table", "row-height", "52px"),
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
      selectedRow: c.secondaryContainer,
      divider: c.outlineVariant,
      text: c.onSurface,
      headerText: c.onSurfaceVariant,
    };
  },
};

/** Material's tree. */
export const materialTree: Renderer<TreeNodeState, TreeSlots, TreeStyle> = {
  ...treeBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      rowHeight: field("tree", "row-height", "48px"),
      indent: field("tree", "indent", "24px"),
      iconSize: field("tree", "icon-size", "20px"),
      showLines: false,
      textStyle: theme.typography.bodyMedium,
      chevron: GLYPHS.chevronRight,
      selected: c.secondaryContainer,
      selectedText: c.onSecondaryContainer,
      line: c.outlineVariant,
      text: c.onSurface,
      chevronColor: c.onSurfaceVariant,
    };
  },
};

/** Material's pagination. */
export const materialPagination: Renderer<PaginationState, PaginationSlots, PaginationStyle> = {
  ...paginationBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      buttonSize: field("pagination", "button-size", "40px"),
      shape: field("pagination", "shape", theme.shapes.full),
      dotSize: field("pagination", "dot-size", "8px"),
      textStyle: theme.typography.labelLarge,
      previousIcon: GLYPHS.chevronLeft,
      nextIcon: GLYPHS.chevronRight,
      currentContainer: c.secondaryContainer,
      currentContent: c.onSecondaryContainer,
      content: c.onSurface,
      dot: c.outlineVariant,
      activeDot: c.primary,
    };
  },
};

/** Material's breadcrumb. */
export const materialBreadcrumb: Renderer<BreadcrumbState, BreadcrumbSlots, BreadcrumbStyle> = {
  ...breadcrumbBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      itemPadding: field("breadcrumb", "item-padding", theme.spacing.s),
      separator: GLYPHS.chevronRight,
      overflowIcon: GLYPHS.moreHorizontal,
      textStyle: theme.typography.bodyMedium,
      link: c.primary,
      current: c.onSurface,
      separatorColor: c.outline,
      hover: c.surfaceContainerHigh,
    };
  },
};

/** Material's progress steps. */
export const materialProgressSteps: Renderer<StepState, StepSlots, StepStyle> = {
  ...progressStepsBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      markerSize: field("progress-steps", "marker-size", "24px"),
      connectorWidth: field("progress-steps", "connector-width", "2px"),
      showNumbers: true,
      labelStyle: theme.typography.labelLarge,
      descriptionStyle: theme.typography.bodySmall,
      checkIcon: GLYPHS.check,
      errorIcon: GLYPHS.alert,
      complete: c.primary,
      onComplete: c.onPrimary,
      current: c.primary,
      onCurrent: c.onPrimary,
      upcoming: c.outlineVariant,
      error: c.error,
      onError: c.onError,
      connector: c.outlineVariant,
      text: c.onSurface,
      mutedText: c.onSurfaceVariant,
    };
  },
};
