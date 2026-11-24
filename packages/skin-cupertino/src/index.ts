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
import { cupertinoText } from "./text.ts";
import { cupertinoDialog } from "./dialog.ts";
import { opacity } from "./feedback.ts";
import { classic } from "./surface.ts";

/**
 * The Cupertino skin (Classic material; Liquid Glass arrives in W8): Apple's system colors, 44 pt controls, a dimming
 * press, and alerts whose actions stack. The main entry has no side effects.
 */
export const cupertinoSkin: CamoSkin = defineSkin({
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
});

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
  classic,
  opacity,
};
export { cupertinoThemes } from "./theme.ts";
export { SYSTEM_BLUE, cupertinoTheme } from "./accent.ts";
export type { CupertinoThemeOptions } from "./accent.ts";
