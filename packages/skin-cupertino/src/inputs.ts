import {
  calendarBase,
  checkboxBase,
  checkmarkRadioBase,
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

/** Cupertino's text field. */
export const cupertinoTextField: Renderer<TextFieldState, TextFieldSlots, TextFieldStyle> = {
  ...textFieldBase,
  defaults(theme) {
    return {
      labelPlacement: "above",
      height: field("text-field", "height", "44px"),
      shape: field("text-field", "shape", theme.shapes.medium),
      borderWidth: field("text-field", "border-width", "0.5px"),
      padding: field("text-field", "padding", theme.spacing.m),
      iconSize: field("text-field", "icon-size", "20px"),
    };
  },
};

/** Cupertino's search field. */
export const cupertinoSearchField: Renderer<SearchFieldState, SearchFieldSlots, SearchFieldStyle> =
  {
    ...searchFieldBase,
    defaults(theme) {
      return {
        height: field("search-field", "height", "36px"),
        shape: field("search-field", "shape", theme.shapes.medium),
        padding: field("search-field", "padding", theme.spacing.m),
        iconSize: field("search-field", "icon-size", "18px"),
      };
    },
  };

/** Cupertino's checkbox. */
export const cupertinoCheckbox: Renderer<ToggleState, ToggleSlots, CheckboxStyle> = {
  ...checkboxBase,
  defaults(theme) {
    return {
      boxSize: field("checkbox", "box-size", "22px"),
      shape: field("checkbox", "shape", theme.shapes.full),
      borderWidth: field("checkbox", "border-width", "1.5px"),
      labelGap: field("checkbox", "label-gap", theme.spacing.m),
      labelPosition: "start",
    };
  },
};

/** Cupertino's switch. */
export const cupertinoSwitch: Renderer<ToggleState, ToggleSlots, SwitchStyle> = {
  ...switchBase,
  defaults(theme) {
    return {
      trackWidth: field("switch", "track-width", "51px"),
      trackHeight: field("switch", "track-height", "31px"),
      thumbSizeOff: field("switch", "thumb-size-off", "27px"),
      thumbSizeOn: field("switch", "thumb-size-on", "27px"),
      labelGap: field("switch", "label-gap", theme.spacing.l),
      labelPosition: "start",
    };
  },
};

/** Cupertino's radio. */
export const cupertinoRadio: Renderer<ToggleState, ToggleSlots, RadioStyle> = {
  ...checkmarkRadioBase,
  defaults(theme) {
    return {
      size: field("radio", "size", "22px"),
      dotSize: field("radio", "dot-size", "0px"),
      borderWidth: field("radio", "border-width", "0px"),
      labelGap: field("radio", "label-gap", theme.spacing.m),
      labelPosition: "start",
    };
  },
};

const segmented: Pick<
  Renderer<SegmentedControlState, SegmentedControlSlots, SegmentedControlStyle>,
  "defaults"
> = {
  defaults(theme) {
    return {
      height: field("segmented-control", "height", "32px"),
      shape: field("segmented-control", "shape", theme.shapes.medium),
      borderWidth: field("segmented-control", "border-width", "0px"),
      iconSize: field("segmented-control", "icon-size", "18px"),
      showCheckIcon: false,
    };
  },
};

/** Cupertino's segmented control: the track. */
export const cupertinoSegmentedControl: Renderer<
  SegmentedControlState,
  SegmentedControlSlots,
  SegmentedControlStyle
> = { ...segmentedControlBase, ...segmented };

/** Cupertino's segment. */
export const cupertinoSegment: Renderer<SegmentState, SegmentSlots, SegmentStyle> = {
  ...segmentBase,
  ...segmented,
};

/** Cupertino's slider. */
export const cupertinoSlider: Renderer<SliderState, SliderSlots, SliderStyle> = {
  ...sliderBase,
  defaults() {
    return {
      trackHeight: field("slider", "track-height", "4px"),
      thumbSize: field("slider", "thumb-size", "28px"),
      showStopMarks: true,
      showValueLabel: false,
    };
  },
};

/** Cupertino's stepper. */
export const cupertinoStepper: Renderer<StepperState, StepperSlots, StepperStyle> = {
  ...stepperBase,
  defaults(theme) {
    return {
      layout: "inline",
      height: field("stepper", "height", "32px"),
      shape: field("stepper", "shape", theme.shapes.medium),
      valueMinWidth: field("stepper", "value-min-width", "44px"),
      iconSize: field("stepper", "icon-size", "14px"),
    };
  },
};

/** Cupertino's calendar. */
export const cupertinoCalendar: Renderer<CalendarState, CalendarSlots, CalendarStyle> = {
  ...calendarBase,
  defaults(theme) {
    return {
      daySize: field("calendar", "day-size", "40px"),
      shape: field("calendar", "shape", theme.shapes.full),
      showOutsideDays: false,
    };
  },
};

/** Cupertino's time picker: wheels. */
export const cupertinoTimePicker: Renderer<TimePickerState, TimePickerSlots, TimePickerStyle> = {
  ...timePickerBase,
  defaults(theme) {
    return {
      style: "wheel",
      digitSize: field("time-picker", "digit-size", "40px"),
      shape: field("time-picker", "shape", theme.shapes.medium),
    };
  },
};
