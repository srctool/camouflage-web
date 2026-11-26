import { defineSkin } from "@srctool/camouflage-core";
import type { CamoSkin } from "@srctool/camouflage-core";
import {
  cupertinoTextField,
  cupertinoSearchField,
  cupertinoCheckbox,
  cupertinoSwitch,
  cupertinoRadio,
  cupertinoSegmentedControl,
  cupertinoSegment,
  cupertinoSlider,
  cupertinoStepper,
  cupertinoCalendar,
  cupertinoTimePicker,
} from "./inputs.ts";
import { materials } from "./material.ts";
import type { CupertinoSurface } from "./material.ts";
import { cupertinoButton } from "./button.ts";
import { cupertinoDivider } from "./divider.ts";
import { cupertinoIcon } from "./icon.ts";
import { cupertinoIconButton } from "./icon-button.ts";
import { cupertinoSurface } from "./surface-component.ts";
import {
  cupertinoCard,
  cupertinoListItem,
  cupertinoListSection,
  cupertinoAccordion,
  cupertinoSkeleton,
  cupertinoPagedList,
  cupertinoBottomSheet,
  cupertinoMenu,
  cupertinoMenuItem,
  cupertinoTooltip,
  cupertinoTopBar,
} from "./structure.ts";
import {
  cupertinoProgressBar,
  cupertinoProgressCircle,
  cupertinoSnackbar,
  cupertinoBanner,
} from "./status.ts";
import { cupertinoChip, cupertinoBadge, cupertinoAvatar, cupertinoFab } from "./display.ts";
import {
  cupertinoTabs,
  cupertinoTab,
  cupertinoNavItem,
  cupertinoNavigationBar,
  cupertinoNavigationRail,
  cupertinoNavigationDrawer,
} from "./navigation.ts";
import {
  cupertinoButtonGroup,
  cupertinoGroupButton,
  cupertinoSplitButton,
  cupertinoPopover,
  cupertinoSideSheet,
  cupertinoToolbar,
  cupertinoImage,
  cupertinoRating,
  cupertinoCarousel,
  cupertinoFileUploader,
  cupertinoDataTable,
  cupertinoTree,
  cupertinoPagination,
  cupertinoBreadcrumb,
  cupertinoProgressSteps,
} from "./later.ts";
import { cupertinoText } from "./text.ts";
import { cupertinoDialog } from "./dialog.ts";
import { opacity } from "./feedback.ts";
import { classic } from "./surface.ts";

const parts: CamoSkin = defineSkin({
  name: "cupertino",
  surfaceTreatment: classic,
  feedback: opacity,
  text: cupertinoText,
  icon: cupertinoIcon,
  surface: cupertinoSurface,
  divider: cupertinoDivider,
  button: cupertinoButton,
  iconButton: cupertinoIconButton,
  card: cupertinoCard,
  listItem: cupertinoListItem,
  listSection: cupertinoListSection,
  accordion: cupertinoAccordion,
  skeleton: cupertinoSkeleton,
  pagedList: cupertinoPagedList,
  bottomSheet: cupertinoBottomSheet,
  menu: cupertinoMenu,
  menuItem: cupertinoMenuItem,
  tooltip: cupertinoTooltip,
  topBar: cupertinoTopBar,
  textField: cupertinoTextField,
  searchField: cupertinoSearchField,
  checkbox: cupertinoCheckbox,
  switch: cupertinoSwitch,
  radio: cupertinoRadio,
  segmentedControl: cupertinoSegmentedControl,
  segment: cupertinoSegment,
  slider: cupertinoSlider,
  stepper: cupertinoStepper,
  calendar: cupertinoCalendar,
  timePicker: cupertinoTimePicker,
  dialog: cupertinoDialog,
  progressBar: cupertinoProgressBar,
  progressCircle: cupertinoProgressCircle,
  snackbar: cupertinoSnackbar,
  banner: cupertinoBanner,
  chip: cupertinoChip,
  badge: cupertinoBadge,
  avatar: cupertinoAvatar,
  fab: cupertinoFab,
  tabs: cupertinoTabs,
  tab: cupertinoTab,
  navItem: cupertinoNavItem,
  navigationBar: cupertinoNavigationBar,
  navigationRail: cupertinoNavigationRail,
  navigationDrawer: cupertinoNavigationDrawer,
  buttonGroup: cupertinoButtonGroup,
  groupButton: cupertinoGroupButton,
  splitButton: cupertinoSplitButton,
  popover: cupertinoPopover,
  sideSheet: cupertinoSideSheet,
  toolbar: cupertinoToolbar,
  image: cupertinoImage,
  rating: cupertinoRating,
  carousel: cupertinoCarousel,
  fileUploader: cupertinoFileUploader,
  dataTable: cupertinoDataTable,
  tree: cupertinoTree,
  pagination: cupertinoPagination,
  breadcrumb: cupertinoBreadcrumb,
  progressSteps: cupertinoProgressSteps,
});

/** What `createCupertinoSkin` takes. */
export interface CupertinoSkinOptions {
  /** `classic` (the default): system blur on bars and sheets. `liquid-glass`: iOS 26's glass, with its fallbacks. */
  surface?: CupertinoSurface;
}

/** The Cupertino skin with the material you choose. */
export function createCupertinoSkin(options: CupertinoSkinOptions = {}): CamoSkin {
  return defineSkin({ ...parts, ...materials(options.surface ?? "classic", parts) });
}

/**
 * The Cupertino skin (Classic material): Apple's system colors, 44 pt controls, a dimming press, alerts whose actions
 * stack, and blurred bars and sheets. `createCupertinoSkin({ surface: "liquid-glass" })` is the glass one. The main
 * entry has no side effects.
 */
export const cupertinoSkin: CamoSkin = /* @__PURE__ */ createCupertinoSkin();

export {
  cupertinoText,
  cupertinoIcon,
  cupertinoSurface,
  cupertinoDivider,
  cupertinoButton,
  cupertinoIconButton,
  cupertinoTextField,
  cupertinoSearchField,
  cupertinoCheckbox,
  cupertinoSwitch,
  cupertinoRadio,
  cupertinoSegmentedControl,
  cupertinoSegment,
  cupertinoSlider,
  cupertinoStepper,
  cupertinoCalendar,
  cupertinoTimePicker,
  cupertinoDialog,
  cupertinoCard,
  cupertinoListItem,
  cupertinoListSection,
  cupertinoAccordion,
  cupertinoSkeleton,
  cupertinoPagedList,
  cupertinoBottomSheet,
  cupertinoMenu,
  cupertinoMenuItem,
  cupertinoTooltip,
  cupertinoTopBar,
  cupertinoProgressBar,
  cupertinoProgressCircle,
  cupertinoSnackbar,
  cupertinoBanner,
  cupertinoChip,
  cupertinoBadge,
  cupertinoAvatar,
  cupertinoFab,
  cupertinoTabs,
  cupertinoTab,
  cupertinoNavItem,
  cupertinoNavigationBar,
  cupertinoNavigationRail,
  cupertinoNavigationDrawer,
  cupertinoButtonGroup,
  cupertinoGroupButton,
  cupertinoSplitButton,
  cupertinoPopover,
  cupertinoSideSheet,
  cupertinoToolbar,
  cupertinoImage,
  cupertinoRating,
  cupertinoCarousel,
  cupertinoFileUploader,
  cupertinoDataTable,
  cupertinoTree,
  cupertinoPagination,
  cupertinoBreadcrumb,
  cupertinoProgressSteps,
  classic,
  opacity,
};
export type { CupertinoSurface } from "./material.ts";
export { cupertinoThemes } from "./theme.ts";
export { SYSTEM_BLUE, cupertinoTheme } from "./accent.ts";
export type { CupertinoThemeOptions } from "./accent.ts";
