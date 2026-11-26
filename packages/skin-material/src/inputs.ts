import { css } from "lit";
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

/** Material's outlined text field: 56 tall with a floating label. */
export const materialTextField: Renderer<TextFieldState, TextFieldSlots, TextFieldStyle> = {
  ...textFieldBase,
  defaults(theme) {
    return {
      labelPlacement: "floating",
      height: field("text-field", "height", "56px"),
      shape: field("text-field", "shape", theme.shapes.extraSmall),
      borderWidth: field("text-field", "border-width", "1px"),
      padding: field("text-field", "padding", theme.spacing.l),
      iconSize: field("text-field", "icon-size", "24px"),
    };
  },
};

/** Material's search field. */
export const materialSearchField: Renderer<SearchFieldState, SearchFieldSlots, SearchFieldStyle> = {
  ...searchFieldBase,
  defaults(theme) {
    return {
      height: field("search-field", "height", "56px"),
      shape: field("search-field", "shape", theme.shapes.full),
      padding: field("search-field", "padding", theme.spacing.l),
      iconSize: field("search-field", "icon-size", "24px"),
    };
  },
};

/** Material's checkbox. */
export const materialCheckbox: Renderer<ToggleState, ToggleSlots, CheckboxStyle> = {
  ...checkboxBase,
  defaults(theme) {
    return {
      boxSize: field("checkbox", "box-size", "18px"),
      shape: field("checkbox", "shape", "2px"),
      borderWidth: field("checkbox", "border-width", "2px"),
      labelGap: field("checkbox", "label-gap", theme.spacing.m),
      labelPosition: "end",
    };
  },
};

/** Material's switch: a 52 by 32 track whose thumb grows from 16 to 24 (28 pressed). */
export const materialSwitch: Renderer<ToggleState, ToggleSlots, SwitchStyle> = {
  ...switchBase,
  styles: [
    switchBase.styles ?? [],
    css`
    :host([data-camo-pressed]) .thumb {
      inline-size: var(--camo-switch-thumb-size-pressed, 28px);
      block-size: var(--camo-switch-thumb-size-pressed, 28px);
    }
  `,
  ],
  defaults(theme) {
    return {
      trackWidth: field("switch", "track-width", "52px"),
      trackHeight: field("switch", "track-height", "32px"),
      thumbSizeOff: field("switch", "thumb-size-off", "16px"),
      thumbSizeOn: field("switch", "thumb-size-on", "24px"),
      labelGap: field("switch", "label-gap", theme.spacing.l),
      labelPosition: "start",
    };
  },
};

/** Material's radio. */
export const materialRadio: Renderer<ToggleState, ToggleSlots, RadioStyle> = {
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

/** Material's segmented control. */
export const materialSegmentedControl: Renderer<
  SegmentedControlState,
  SegmentedControlSlots,
  SegmentedControlStyle
> = { ...segmentedControlBase, ...segmented };

/** Material's segment. */
export const materialSegment: Renderer<SegmentState, SegmentSlots, SegmentStyle> = {
  ...segmentBase,
  ...segmented,
};

/** Material's slider: a 16 track and a 4 by 44 handle. */
export const materialSlider: Renderer<SliderState, SliderSlots, SliderStyle> = {
  ...sliderBase,
  styles: [
    sliderBase.styles ?? [],
    css`
    .thumb {
      block-size: var(--camo-slider-handle-height, 44px);
      border-radius: var(--camo-spacing-xxs);
    }
  `,
  ],
  defaults() {
    return {
      trackHeight: field("slider", "track-height", "16px"),
      thumbSize: field("slider", "thumb-size", "4px"),
      showStopMarks: true,
      showValueLabel: true,
    };
  },
};

/** Material's stepper. */
export const materialStepper: Renderer<StepperState, StepperSlots, StepperStyle> = {
  ...stepperBase,
  defaults(theme) {
    return {
      layout: "inline",
      height: field("stepper", "height", "40px"),
      shape: field("stepper", "shape", theme.shapes.full),
      valueMinWidth: field("stepper", "value-min-width", "48px"),
      iconSize: field("stepper", "icon-size", "18px"),
    };
  },
};

/** Material's calendar. */
export const materialCalendar: Renderer<CalendarState, CalendarSlots, CalendarStyle> = {
  ...calendarBase,
  defaults(theme) {
    return {
      daySize: field("calendar", "day-size", "40px"),
      shape: field("calendar", "shape", theme.shapes.full),
      showOutsideDays: false,
    };
  },
};

/** Material's time picker. */
export const materialTimePicker: Renderer<TimePickerState, TimePickerSlots, TimePickerStyle> = {
  ...timePickerBase,
  defaults(theme) {
    return {
      style: "fields",
      digitSize: field("time-picker", "digit-size", "48px"),
      shape: field("time-picker", "shape", theme.shapes.small),
    };
  },
};
