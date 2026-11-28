// The main entry: types, the registry and the element classes. Importing it defines nothing and touches no browser
// API, so it is safe on a server and for type-only use. Import "@srctool/camouflage-core/define" to register elements.
// The global tag and event maps, generated from the manifest (`pnpm typings`).
export type {} from "./elements.ts";
export { CamoProvider } from "./provider/camo-provider.ts";
export { CamoButton } from "./components/button.ts";
export { CamoText } from "./components/text.ts";
export { CamoIcon } from "./components/icon.ts";
export { CamoSurface } from "./components/surface.ts";
export { CamoDivider } from "./components/divider.ts";
export { CamoIconButton } from "./components/icon-button.ts";
export { registerIcons, registeredIconNames, resolveIcon } from "./icons.ts";
export type { IconDefinition } from "./icons.ts";
export { CamoTextField } from "./components/text-field.ts";
export { CamoSearchField } from "./components/search-field.ts";
export { CamoCheckbox } from "./components/checkbox.ts";
export { CamoSwitch } from "./components/switch.ts";
export { CamoRadio } from "./components/radio.ts";
export { CamoRadioGroup } from "./components/radio-group.ts";
export { CamoSegment, CamoSegmentedControl } from "./components/segmented-control.ts";
export { CamoSlider } from "./components/slider.ts";
export { CamoStepper } from "./components/stepper.ts";
export { CamoCalendar } from "./components/calendar.ts";
export { CamoDatePicker } from "./components/date-picker.ts";
export { CamoTimePicker } from "./components/time-picker.ts";
export { CamoForm } from "./components/form.ts";
export { CamoControl } from "./behavior/control.ts";
export type { CamoBeforeChangeDetail, ControlValue } from "./behavior/control.ts";
export type { CamoSearchDetail } from "./components/search-field.ts";
export type { CamoSubmitDetail, CamoInvalidDetail } from "./components/form.ts";
export type { CalendarSelection } from "./components/calendar.ts";
export { CamoRules, firstFailure } from "./form-rules.ts";
export type { CamoFormValues, CamoRule } from "./form-rules.ts";
export { applyEdit, displayFormats, inputFilters } from "./input/format.ts";
export type { CamoDisplayFormat, CamoInputFilter } from "./input/format.ts";
export * as dates from "./date/iso.ts";
export { CamoFieldAction } from "./components/field-action.ts";
export { CamoCard } from "./components/card.ts";
export { CamoListItem } from "./components/list-item.ts";
export { CamoListSection } from "./components/list-section.ts";
export { CamoAccordion, CamoAccordionGroup } from "./components/accordion.ts";
export { CamoSkeleton } from "./components/skeleton.ts";
export { CamoPagedList } from "./components/paged-list.ts";
export { CamoBottomSheet } from "./components/bottom-sheet.ts";
export {
  CamoMenu,
  CamoMenuItem,
  CamoMenuDivider,
  CamoMenuGroup,
  CamoMenuSubmenu,
} from "./components/menu.ts";
export { CamoPane, CamoSplitPane } from "./components/split-pane.ts";
export type { CamoResizeDetail } from "./components/split-pane.ts";
export { CamoScrollbar } from "./components/scrollbar.ts";
export type { ControlDensity, ScrollOrientation, ScrollbarShow, SplitAxis } from "./skin/types.ts";
export { collapsePane, normalizeSizes, resizeSizes, restorePane } from "./behavior/split.ts";
export type { PaneLimits } from "./behavior/split.ts";
export { offsetOfThumb, pageFor, thumbOf } from "./behavior/scroll-geometry.ts";
export type { Thumb } from "./behavior/scroll-geometry.ts";
export { scrollbarBase, splitPaneBase } from "./skin/panes.ts";
export { themedScrollbar } from "./style.ts";
export { CamoTooltip } from "./components/tooltip.ts";
export { CamoTopBar } from "./components/top-bar.ts";
export { CamoSelect, CamoOption } from "./components/select.ts";
export { CamoProgressBar, CamoProgressCircle } from "./components/progress.ts";
export { CamoSnackbar, CamoMessenger, messengerOf } from "./components/snackbar.ts";
export type { SnackbarOptions, SnackbarResult } from "./components/snackbar.ts";
export { CamoBanner } from "./components/banner.ts";
export { CamoChip, CamoChipGroup, chipKind } from "./components/chip.ts";
export { CamoBadge, CamoBadgedBox } from "./components/badge.ts";
export { CamoAvatar, CamoAvatarGroup } from "./components/avatar.ts";
export { avatarColorSeed, avatarInitials } from "./components/avatar-name.ts";
export { CamoFab } from "./components/fab.ts";
export { CamoTab, CamoTabs } from "./components/tabs.ts";
export {
  CamoModalDrawer,
  CamoNavItem,
  CamoNavSection,
  CamoNavigationBar,
  CamoNavigationDrawer,
  CamoNavigationRail,
} from "./components/navigation.ts";
export { NavigationController } from "./behavior/navigation.ts";
export { toneIcon } from "./icons-tone.ts";
export { CamoGroupButton, CamoButtonGroup, CamoSplitButton } from "./components/button-group.ts";
export { CamoPopover } from "./components/popover.ts";
export { CamoSideSheet, CamoModalSideSheet } from "./components/side-sheet.ts";
export { CamoToolbar } from "./components/toolbar.ts";
export { CamoImage } from "./components/image.ts";
export { CamoRating } from "./components/rating.ts";
export { CamoCarousel } from "./components/carousel.ts";
export type { CamoPageChangeDetail } from "./components/carousel.ts";
export { CamoFileUploader } from "./components/file-uploader.ts";
export type { CamoFilesDetail, CamoUploadRowDetail } from "./components/file-uploader.ts";
export { CamoDataTable } from "./components/data-table.ts";
export type {
  CamoRowClickDetail,
  CamoSortChangeDetail,
  TableColumn,
  TableSort,
} from "./components/data-table.ts";
export { CamoTree } from "./components/tree.ts";
export type { CamoKeysDetail, CamoLoadChildrenDetail } from "./components/tree.ts";
export { CamoPagination } from "./components/pagination.ts";
export { CamoBreadcrumb, CamoBreadcrumbItem } from "./components/breadcrumb.ts";
export { CamoStep, CamoProgressSteps } from "./components/progress-steps.ts";
export { CamoModal } from "./behavior/modal.ts";
export { fitCount, planBreadcrumb } from "./behavior/fit.ts";
export { pageItems } from "./components/pagination-items.ts";
export { flattenTree } from "./components/tree-rows.ts";
export type { CamoTreeNode, TreeRow } from "./components/tree-rows.ts";
export { ratingAt, snapRating } from "./components/rating-value.ts";
export { placePanel, placePopover } from "./behavior/popover.ts";
export type { Box, Placed } from "./behavior/popover.ts";
export type { CamoPagedState } from "./components/paged-list.ts";
export type { SelectOption, CamoQueryDetail } from "./components/select.ts";
export type { CamoExpandedDetail } from "./components/accordion.ts";
export { CamoDialog } from "./components/dialog.ts";
export type { CamoCloseDetail } from "./behavior/modal.ts";
export { showCamoDialog } from "./components/overlay.ts";
export type { DialogAction, ShowDialogOptions } from "./components/overlay.ts";
export { defineElement } from "./define-element.ts";
export { applyAria, inspectAria } from "./behavior/aria.ts";
export { attachActivation } from "./behavior/activation.ts";
export { PRESSED_ATTRIBUTE, PressController } from "./behavior/press.ts";
export {
  FOCUS_RING,
  TABBABLE,
  hasVisibleFocus,
  initialFocusTarget,
  rememberFocus,
  tabbables,
} from "./behavior/focus.ts";
export { RovingTabindexController } from "./behavior/roving.ts";
export type { Orientation, RovingOptions } from "./behavior/roving.ts";
export { reportFormState, setCustomState } from "./behavior/internals.ts";
export type { FormState } from "./behavior/internals.ts";
export { contentVariables } from "./behavior/content.ts";
export type { AriaState } from "./behavior/aria.ts";
export { CamouflageController, camouflage, defaultEnvironment, warnOnce } from "./controller.ts";
export {
  BREAKPOINTS,
  browserSources,
  environmentSources,
  measure,
  setEnvironmentSources,
  watchEnvironment,
  windowSizeOf,
} from "./environment.ts";
export type { EnvironmentSources, Measured, WatchedQuery } from "./environment.ts";
export { skinContext, themeContext, environmentContext } from "./context.ts";
export type { SkinInfo, ThemeInfo } from "./context.ts";
export {
  registerSkin,
  resolveSkin,
  starterTheme,
  fallbackSkin,
  registeredSkinNames,
} from "./skin/registry.ts";
export type { SkinRegistration } from "./skin/registry.ts";
export { cssBlock, cssText, textStyleCss } from "./style.ts";
export { GLYPHS, glyphPath } from "./skin/glyphs.ts";
export type { Glyph } from "./skin/glyphs.ts";
export { buttonColorsFor, toneFamily } from "./skin/colors.ts";
export type { ToneFamily } from "./skin/colors.ts";
export { textFieldBase, searchFieldBase } from "./skin/fields.ts";
export {
  checkboxBase,
  checkmarkRadioBase,
  radioBase,
  segmentBase,
  segmentedControlBase,
  sliderBase,
  stepperBase,
  switchBase,
} from "./skin/controls.ts";
export { calendarBase, timePickerBase } from "./skin/pickers.ts";
export {
  accordionBase,
  cardBase,
  cardColorsFor,
  listItemBase,
  listSectionBase,
  pagedListBase,
  skeletonBase,
} from "./skin/structure.ts";
export {
  bottomSheetBase,
  menuBase,
  menuItemBase,
  tooltipBase,
  topBarBase,
} from "./skin/overlays.ts";
export {
  bannerBase,
  bannerColorsFor,
  closeIcon,
  progressBarBase,
  progressCircleBase,
  progressColors,
  progressText,
  snackbarBase,
} from "./skin/status.ts";
export {
  avatarBase,
  badgeBase,
  badgeColorsFor,
  chipBase,
  chipColorsFor,
  fabBase,
  fabColorsFor,
} from "./skin/display.ts";
export {
  isSegmented,
  navItemBase,
  navigationBarBase,
  navigationDrawerBase,
  navigationRailBase,
  tabBase,
  tabsBase,
  tabsColorsFor,
} from "./skin/navigation.ts";
export {
  buttonGroupBase,
  groupButtonBase,
  groupColorsFor,
  splitButtonBase,
} from "./skin/groups.ts";
export { popoverBase, sideSheetBase, toolbarBase } from "./skin/panels.ts";
export {
  carouselBase,
  fileUploaderBase,
  formatBytes,
  imageBase,
  ratingBase,
} from "./skin/media.ts";
export { dataTableBase, treeBase } from "./skin/data.ts";
export { breadcrumbBase, paginationBase, progressStepsBase } from "./skin/steps.ts";
export { FIELD_IDS } from "./skin/ids.ts";
export {
  dividerBase,
  iconBase,
  iconButtonBase,
  iconButtonColorsFor,
  surfaceBase,
  surfaceColor,
  textBase,
} from "./skin/primitives.ts";
export { createCamoTheme } from "./theme/merge.ts";
export {
  applyTheme,
  componentVar,
  themeDeclarations,
  themeEntries,
  schemeStylesheet,
  tokenSetVar,
} from "./theme/css.ts";
export { validateTheme } from "./theme/validate.ts";
export type { ThemeIssue } from "./theme/validate.ts";
export { contrastRatio, parseColor } from "./theme/color.ts";
export {
  DEFAULT_ELEVATION,
  DEFAULT_MOTION,
  DEFAULT_SHAPES,
  DEFAULT_SPACING,
  SYSTEM_FONT,
  rem,
  systemTypography,
} from "./theme/system.ts";
export {
  COLOR_ROLES,
  COMPONENT_FIELDS,
  ELEVATION_ROLES,
  MOTION_ROLES,
  SHAPE_ROLES,
  SPACING_ROLES,
  TYPE_ROLES,
} from "./theme/schema.ts";
export { tokens } from "./theme/shape.ts";
export { kebab, varName, createTokens } from "./theme/tokens.ts";
export type * from "./theme/types.ts";
export {
  COMPONENT_NAMES,
  assertCompleteSkin,
  defineSkin,
  inProgressSkin,
  missingRenderers,
} from "./skin/define.ts";
export { classic, flat } from "./skin/surfaces.ts";
export { fade, opacity } from "./skin/feedback.ts";
export type * from "./skin/types.ts";
