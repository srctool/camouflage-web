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

/** The button's six appearances, which a group and a split button draw with (Cupertino: ink, hairlines). */
function appearances(
  theme: CamoTheme,
): Pick<ButtonGroupStyle, "solid" | "soft" | "raised" | "outline" | "ghost" | "link"> {
  const c = theme.colors;
  const clear = "transparent";
  return {
    solid: { container: c.primary, content: c.onPrimary },
    soft: { container: c.surfaceContainerHigh, content: c.onSurface },
    raised: { container: c.surface, content: c.primary },
    outline: { container: clear, content: c.primary, border: c.primary },
    ghost: { container: clear, content: c.primary },
    link: { container: clear, content: c.primary },
  };
}

/** cupertino's button group: a grouped control, filled soft, rounded at the outer corners. */
export const cupertinoButtonGroup: Renderer<ButtonGroupState, ButtonGroupSlots, ButtonGroupStyle> =
  {
    ...buttonGroupBase,
    defaults(theme) {
      const c = theme.colors;
      const clear = "transparent";
      return {
        solid: { container: c.primary, content: c.onPrimary },
        soft: { container: c.surfaceContainerHigh, content: c.onSurface },
        raised: { container: c.surface, content: c.primary },
        outline: { container: clear, content: c.primary, border: c.primary },
        ghost: { container: clear, content: c.primary },
        link: { container: clear, content: c.primary },
        defaultAppearance: "soft",
        height: field("button-group", "height", "36px"),
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

/** cupertino's group button; a toggle that is on is the ink fill. */
export const cupertinoGroupButton: Renderer<GroupButtonState, GroupButtonSlots, ButtonGroupStyle> =
  {
    ...groupButtonBase,
    defaults: (theme) => cupertinoButtonGroup.defaults(theme),
  };

/** cupertino's split button: a capsule, the parts divided by a hairline. */
export const cupertinoSplitButton: Renderer<SplitButtonState, SplitButtonSlots, SplitButtonStyle> =
  {
    ...splitButtonBase,
    defaults(theme) {
      return {
        ...appearances(theme),
        defaultAppearance: "solid",
        height: field("split-button", "height", "40px"),
        shape: field("split-button", "shape", theme.shapes.full),
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

/** cupertino's popover: a lifted panel with an arrow, like iOS's popover. */
export const cupertinoPopover: Renderer<PopoverState, PopoverSlots, PopoverStyle> = {
  ...popoverBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      shape: field("popover", "shape", theme.shapes.large),
      maxWidth: field("popover", "max-width", "320px"),
      padding: field("popover", "padding", theme.spacing.l),
      showArrow: true,
      arrowWidth: field("popover", "arrow-width", "16px"),
      arrowHeight: field("popover", "arrow-height", "8px"),
      elevation: field("popover", "elevation", theme.elevation.level3),
      gap: field("popover", "gap", theme.spacing.s),
      titleStyle: theme.typography.titleSmall,
      container: c.surfaceContainerHigh,
      titleColor: c.onSurface,
      contentColor: c.onSurfaceVariant,
      border: null,
    };
  },
};

/** cupertino's side sheet: a hairline start edge when docked. */
export const cupertinoSideSheet: Renderer<SideSheetState, SideSheetSlots, SideSheetStyle> = {
  ...sideSheetBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      width: field("side-sheet", "width", "360px"),
      modalShape: field("side-sheet", "modal-shape", theme.shapes.extraLarge),
      padding: field("side-sheet", "padding", theme.spacing.l),
      scrimAlpha: field("side-sheet", "scrim-alpha", "32%"),
      showDivider: true,
      titleStyle: theme.typography.titleLarge,
      container: c.surfaceContainerLow,
      modalContainer: c.surfaceContainerLow,
      titleColor: c.onSurface,
      divider: c.outlineVariant,
    };
  },
};

/** cupertino's toolbar: a 44 bar on the grouped surface; floating is a lifted capsule. */
export const cupertinoToolbar: Renderer<ToolbarState, ToolbarSlots, ToolbarStyle> = {
  ...toolbarBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      placement: "docked",
      height: field("toolbar", "height", "44px"),
      floatingMargin: field("toolbar", "floating-margin", theme.spacing.l),
      floatingShape: field("toolbar", "floating-shape", theme.shapes.full),
      floatingElevation: theme.elevation.level3,
      actionSpacing: field("toolbar", "action-spacing", theme.spacing.xs),
      actionSize: field("toolbar", "action-size", "44px"),
      padding: field("toolbar", "padding", theme.spacing.s),
      showDivider: true,
      container: c.surfaceContainerLow,
      divider: c.outlineVariant,
    };
  },
};

/** cupertino's image frame. */
export const cupertinoImage: Renderer<ImageState, ImageSlots, ImageStyle> = {
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

/** cupertino's rating: orange stars. */
export const cupertinoRating: Renderer<RatingState, RatingSlots, RatingStyle> = {
  ...ratingBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      icon: GLYPHS.star,
      smallSize: field("rating", "small-size", "16px"),
      mediumSize: field("rating", "medium-size", "24px"),
      largeSize: field("rating", "large-size", "32px"),
      gap: field("rating", "gap", theme.spacing.xs),
      filled: c.warning,
      empty: c.outlineVariant,
      hover: c.warning,
      disabled: c.outlineVariant,
    };
  },
};

/** cupertino's carousel: rounded items, round scrim buttons, dots. */
export const cupertinoCarousel: Renderer<CarouselState, CarouselSlots, CarouselStyle> = {
  ...carouselBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      itemShape: field("carousel", "item-shape", theme.shapes.large),
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

/** cupertino's file uploader: a filled, undashed zone. */
export const cupertinoFileUploader: Renderer<
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
      dashed: false,
      icon: GLYPHS.upload,
      removeIcon: GLYPHS.close,
      retryIcon: GLYPHS.retry,
      titleStyle: theme.typography.labelLarge,
      hintStyle: theme.typography.bodySmall,
      zone: c.surfaceContainerHigh,
      border: c.surfaceContainerHigh,
      dragBorder: c.primary,
      error: c.error,
      text: c.onSurface,
      mutedText: c.onSurfaceVariant,
    };
  },
};

/** cupertino's data table: hairline rows, a quiet header, a tinted selected row. */
export const cupertinoDataTable: Renderer<DataTableState, DataTableSlots, DataTableStyle> = {
  ...dataTableBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      headerHeight: field("data-table", "header-height", "44px"),
      rowHeight: field("data-table", "row-height", "48px"),
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
      selectedRow: c.primaryContainer,
      divider: c.outlineVariant,
      text: c.onSurface,
      headerText: c.onSurfaceVariant,
    };
  },
};

/** cupertino's tree: 44 tall rows, a tinted selected row. */
export const cupertinoTree: Renderer<TreeNodeState, TreeSlots, TreeStyle> = {
  ...treeBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      rowHeight: field("tree", "row-height", "44px"),
      indent: field("tree", "indent", "24px"),
      iconSize: field("tree", "icon-size", "20px"),
      showLines: false,
      textStyle: theme.typography.bodyMedium,
      chevron: GLYPHS.chevronRight,
      selected: c.primaryContainer,
      selectedText: c.onPrimaryContainer,
      line: c.outlineVariant,
      text: c.onSurface,
      chevronColor: c.onSurfaceVariant,
    };
  },
};

/** cupertino's pagination: round buttons, the current page is the accent. */
export const cupertinoPagination: Renderer<PaginationState, PaginationSlots, PaginationStyle> = {
  ...paginationBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      buttonSize: field("pagination", "button-size", "36px"),
      shape: field("pagination", "shape", theme.shapes.full),
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

/** cupertino's breadcrumb: accent links, a chevron between steps. */
export const cupertinoBreadcrumb: Renderer<BreadcrumbState, BreadcrumbSlots, BreadcrumbStyle> = {
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

/** cupertino's progress steps: 28 markers, the accent for done and current. */
export const cupertinoProgressSteps: Renderer<StepState, StepSlots, StepStyle> = {
  ...progressStepsBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      markerSize: field("progress-steps", "marker-size", "28px"),
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
