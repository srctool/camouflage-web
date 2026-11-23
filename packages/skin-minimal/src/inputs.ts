import {
  calendarBase,
  checkboxBase,
  radioBase,
  searchFieldBase,
  segmentBase,
  segmentedControlBase,
  sliderBase,
  stepperBase,
  switchBase,
  textFieldBase,
  timePickerBase,
} from "@srctool/camouflage-core";
import type {
  CalendarSlots,
  CalendarState,
  CalendarStyle,
  CheckboxStyle,
  RadioStyle,
  Renderer,
  SearchFieldSlots,
  SearchFieldState,
  SearchFieldStyle,
  SegmentSlots,
  SegmentState,
  SegmentStyle,
  SegmentedControlSlots,
  SegmentedControlState,
  SegmentedControlStyle,
  SliderSlots,
  SliderState,
  SliderStyle,
  StepperSlots,
  StepperState,
  StepperStyle,
  SwitchStyle,
  TextFieldSlots,
  TextFieldState,
  TextFieldStyle,
  TimePickerSlots,
  TimePickerState,
  TimePickerStyle,
  ToggleSlots,
  ToggleState,
} from "@srctool/camouflage-core";

/** A component-theme field as a custom property with the skin's default: `--camo-text-field-height`. */
const field = (component: string, name: string, fallback: string): string =>
  `var(--camo-${component}-${name}, ${fallback})`;

/** Minimal's text field. */
export const minimalTextField: Renderer<TextFieldState, TextFieldSlots, TextFieldStyle> = {
  ...textFieldBase,
  defaults(theme) {
    return {
      labelPlacement: "above",
      height: field("text-field", "height", "44px"),
      shape: field("text-field", "shape", theme.shapes.medium),
      borderWidth: field("text-field", "border-width", "1px"),
      padding: field("text-field", "padding", theme.spacing.m),
      iconSize: field("text-field", "icon-size", "20px"),
    };
  },
};

/** Minimal's search field. */
export const minimalSearchField: Renderer<SearchFieldState, SearchFieldSlots, SearchFieldStyle> = {
  ...searchFieldBase,
  defaults(theme) {
    return {
      height: field("search-field", "height", "44px"),
      shape: field("search-field", "shape", theme.shapes.full),
      padding: field("search-field", "padding", theme.spacing.m),
      iconSize: field("search-field", "icon-size", "20px"),
    };
  },
};

/** Minimal's checkbox. */
export const minimalCheckbox: Renderer<ToggleState, ToggleSlots, CheckboxStyle> = {
  ...checkboxBase,
  defaults(theme) {
    return {
      boxSize: field("checkbox", "box-size", "18px"),
      shape: field("checkbox", "shape", theme.shapes.extraSmall),
      borderWidth: field("checkbox", "border-width", "2px"),
      labelGap: field("checkbox", "label-gap", theme.spacing.m),
      labelPosition: "end",
    };
  },
};

/** Minimal's switch. */
export const minimalSwitch: Renderer<ToggleState, ToggleSlots, SwitchStyle> = {
  ...switchBase,
  defaults(theme) {
    return {
      trackWidth: field("switch", "track-width", "44px"),
      trackHeight: field("switch", "track-height", "24px"),
      thumbSizeOff: field("switch", "thumb-size-off", "12px"),
      thumbSizeOn: field("switch", "thumb-size-on", "16px"),
      labelGap: field("switch", "label-gap", theme.spacing.l),
      labelPosition: "start",
    };
  },
};

/** Minimal's radio. */
export const minimalRadio: Renderer<ToggleState, ToggleSlots, RadioStyle> = {
  ...radioBase,
  defaults(theme) {
    return {
      size: field("radio", "size", "20px"),
      dotSize: field("radio", "dot-size", "10px"),
      borderWidth: field("radio", "border-width", "2px"),
      labelGap: field("radio", "label-gap", theme.spacing.m),
      labelPosition: "end",
    };
  },
};

const segmented: Pick<
  Renderer<SegmentedControlState, SegmentedControlSlots, SegmentedControlStyle>,
  "defaults"
> = {
  defaults(theme) {
    return {
      height: field("segmented-control", "height", "40px"),
      shape: field("segmented-control", "shape", theme.shapes.medium),
      borderWidth: field("segmented-control", "border-width", "1px"),
      iconSize: field("segmented-control", "icon-size", "18px"),
      showCheckIcon: false,
    };
  },
};

/** Minimal's segmented control: the track. */
export const minimalSegmentedControl: Renderer<
  SegmentedControlState,
  SegmentedControlSlots,
  SegmentedControlStyle
> = { ...segmentedControlBase, ...segmented };

/** Minimal's segment. */
export const minimalSegment: Renderer<SegmentState, SegmentSlots, SegmentStyle> = {
  ...segmentBase,
  ...segmented,
};

/** Minimal's slider. */
export const minimalSlider: Renderer<SliderState, SliderSlots, SliderStyle> = {
  ...sliderBase,
  defaults() {
    return {
      trackHeight: field("slider", "track-height", "4px"),
      thumbSize: field("slider", "thumb-size", "20px"),
      showStopMarks: true,
      showValueLabel: true,
    };
  },
};

/** Minimal's stepper. */
export const minimalStepper: Renderer<StepperState, StepperSlots, StepperStyle> = {
  ...stepperBase,
  defaults(theme) {
    return {
      layout: "inline",
      height: field("stepper", "height", "40px"),
      shape: field("stepper", "shape", theme.shapes.medium),
      valueMinWidth: field("stepper", "value-min-width", "48px"),
      iconSize: field("stepper", "icon-size", "14px"),
    };
  },
};

/** Minimal's calendar. */
export const minimalCalendar: Renderer<CalendarState, CalendarSlots, CalendarStyle> = {
  ...calendarBase,
  defaults(theme) {
    return {
      daySize: field("calendar", "day-size", "40px"),
      shape: field("calendar", "shape", theme.shapes.full),
      showOutsideDays: false,
    };
  },
};

/** Minimal's time picker: number fields. */
export const minimalTimePicker: Renderer<TimePickerState, TimePickerSlots, TimePickerStyle> = {
  ...timePickerBase,
  defaults(theme) {
    return {
      style: "fields",
      digitSize: field("time-picker", "digit-size", "48px"),
      shape: field("time-picker", "shape", theme.shapes.medium),
    };
  },
};
