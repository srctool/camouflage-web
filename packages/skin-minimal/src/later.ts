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

/** The button's six appearances, which a group and a split button draw with (Minimal: ink, hairlines). */
function appearances(
  theme: CamoTheme,
): Pick<ButtonGroupStyle, "solid" | "soft" | "raised" | "outline" | "ghost" | "link"> {
  const c = theme.colors;
  const clear = "transparent";
  return {
    solid: { container: c.primary, content: c.onPrimary },
    soft: { container: c.surfaceContainerHigh, content: c.onSurface },
    raised: { container: c.surface, content: c.onSurface, border: c.outline },
    outline: { container: clear, content: c.primary, border: c.outlineVariant },
    ghost: { container: clear, content: c.primary },
    link: { container: clear, content: c.primary },
  };
}

/** minimal's button group: connected buttons that share one hairline, radius 8 at the outer corners only. */
export const minimalButtonGroup: Renderer<ButtonGroupState, ButtonGroupSlots, ButtonGroupStyle> = {
  ...buttonGroupBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      ...appearances(theme),
      defaultAppearance: "outline",
      height: field("button-group", "height", "40px"),
      shape: field("button-group", "shape", theme.shapes.medium),
      innerShape: field("button-group", "inner-shape", theme.shapes.none),
      spacing: field("button-group", "spacing", theme.spacing.xs),
      borderWidth: field("button-group", "border-width", "1px"),
      iconSize: field("button-group", "icon-size", "16px"),
      iconGap: field("button-group", "icon-gap", theme.spacing.s),
      textStyle: theme.typography.labelLarge,
      selected: { container: c.primary, content: c.onPrimary },
    };
  },
};

/** minimal's group button; a toggle that is on is the ink fill. */
export const minimalGroupButton: Renderer<GroupButtonState, GroupButtonSlots, ButtonGroupStyle> = {
  ...groupButtonBase,
  defaults: (theme) => minimalButtonGroup.defaults(theme),
};

/** minimal's split button: a 40 tall button, the parts divided by a line. */
export const minimalSplitButton: Renderer<SplitButtonState, SplitButtonSlots, SplitButtonStyle> = {
  ...splitButtonBase,
  defaults(theme) {
    return {
      ...appearances(theme),
      defaultAppearance: "solid",
      height: field("split-button", "height", "40px"),
      shape: field("split-button", "shape", theme.shapes.medium),
      innerShape: field("split-button", "inner-shape", theme.shapes.none),
      arrowWidth: field("split-button", "arrow-width", "40px"),
      gap: field("split-button", "gap", "0px"),
      padding: field("split-button", "padding", theme.spacing.l),
      iconSize: field("split-button", "icon-size", "16px"),
      iconGap: field("split-button", "icon-gap", theme.spacing.s),
      textStyle: theme.typography.labelLarge,
    };
  },
};

/** minimal's popover: a hairline panel with no arrow and no shadow. */
export const minimalPopover: Renderer<PopoverState, PopoverSlots, PopoverStyle> = {
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
      elevation: field("popover", "elevation", theme.elevation.level0),
      gap: field("popover", "gap", theme.spacing.s),
      titleStyle: theme.typography.titleSmall,
      container: c.surface,
      titleColor: c.onSurface,
      contentColor: c.onSurfaceVariant,
      border: `1px solid ${c.outlineVariant}`,
    };
  },
};

/** minimal's side sheet: a hairline start edge when docked. */
export const minimalSideSheet: Renderer<SideSheetState, SideSheetSlots, SideSheetStyle> = {
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
      modalContainer: c.surface,
      titleColor: c.onSurface,
      divider: c.outlineVariant,
    };
  },
};

/** minimal's toolbar: a 48 bar with a hairline above it; floating is a hairline pill. */
export const minimalToolbar: Renderer<ToolbarState, ToolbarSlots, ToolbarStyle> = {
  ...toolbarBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      placement: "docked",
      height: field("toolbar", "height", "48px"),
      floatingMargin: field("toolbar", "floating-margin", theme.spacing.l),
      floatingShape: field("toolbar", "floating-shape", theme.shapes.full),
      floatingElevation: theme.elevation.level2,
      actionSpacing: field("toolbar", "action-spacing", theme.spacing.xs),
      actionSize: field("toolbar", "action-size", "40px"),
      padding: field("toolbar", "padding", theme.spacing.s),
      showDivider: true,
      container: c.surface,
      divider: c.outlineVariant,
    };
  },
};

/** minimal's image frame. */
export const minimalImage: Renderer<ImageState, ImageSlots, ImageStyle> = {
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

/** minimal's rating: ink stars. */
export const minimalRating: Renderer<RatingState, RatingSlots, RatingStyle> = {
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
      empty: c.outlineVariant,
      hover: c.primary,
      disabled: c.outlineVariant,
    };
  },
};

/** minimal's carousel: rounded items, round scrim buttons, dots. */
export const minimalCarousel: Renderer<CarouselState, CarouselSlots, CarouselStyle> = {
  ...carouselBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      itemShape: field("carousel", "item-shape", theme.shapes.medium),
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

/** minimal's file uploader: a dashed zone, hairline rows. */
export const minimalFileUploader: Renderer<
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
      zone: c.surface,
      border: c.outline,
      dragBorder: c.primary,
      error: c.error,
      text: c.onSurface,
      mutedText: c.onSurfaceVariant,
    };
  },
};

/** minimal's data table: hairline rows, a quiet header, a soft selected row. */
export const minimalDataTable: Renderer<DataTableState, DataTableSlots, DataTableStyle> = {
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
      header: c.surface,
      row: c.surface,
      stripedRow: c.surfaceContainerLow,
      selectedRow: c.surfaceContainerHigh,
      divider: c.outlineVariant,
      text: c.onSurface,
      headerText: c.onSurfaceVariant,
    };
  },
};

/** minimal's tree: 40 tall rows, a soft selected row. */
export const minimalTree: Renderer<TreeNodeState, TreeSlots, TreeStyle> = {
  ...treeBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      rowHeight: field("tree", "row-height", "40px"),
      indent: field("tree", "indent", "24px"),
      iconSize: field("tree", "icon-size", "20px"),
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

/** minimal's pagination: square-ish buttons, the current page is ink. */
export const minimalPagination: Renderer<PaginationState, PaginationSlots, PaginationStyle> = {
  ...paginationBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      buttonSize: field("pagination", "button-size", "40px"),
      shape: field("pagination", "shape", theme.shapes.small),
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

/** minimal's breadcrumb: quiet links, a chevron between steps. */
export const minimalBreadcrumb: Renderer<BreadcrumbState, BreadcrumbSlots, BreadcrumbStyle> = {
  ...breadcrumbBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      itemPadding: field("breadcrumb", "item-padding", theme.spacing.s),
      separator: GLYPHS.chevronRight,
      overflowIcon: GLYPHS.moreHorizontal,
      textStyle: theme.typography.bodyMedium,
      link: c.onSurfaceVariant,
      current: c.onSurface,
      separatorColor: c.outline,
      hover: c.surfaceContainerHigh,
    };
  },
};

/** minimal's progress steps: 24 markers, a hairline connector, ink for done and current. */
export const minimalProgressSteps: Renderer<StepState, StepSlots, StepStyle> = {
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
      upcoming: c.outline,
      error: c.error,
      onError: c.onError,
      connector: c.outlineVariant,
      text: c.onSurface,
      mutedText: c.onSurfaceVariant,
    };
  },
};
