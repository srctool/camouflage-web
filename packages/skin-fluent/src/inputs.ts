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

/** Fluent's input: a stroke with a darker bottom edge that turns brand on focus. */
export const fluentTextField: Renderer<TextFieldState, TextFieldSlots, TextFieldStyle> = {
  ...textFieldBase,
  styles: [
    textFieldBase.styles ?? [],
    css`
    .box {
      border-color: var(--fluent-neutral-stroke1, var(--camo-color-outline-variant));
      border-block-end-color: var(--camo-color-outline);
    }
    .f.error .box {
      border-color: var(--camo-color-error);
    }
    .f.focused .box {
      outline: none;
      border-color: var(--fluent-neutral-stroke1, var(--camo-color-outline-variant));
      border-block-end-color: transparent;
      box-shadow: inset 0 calc(var(--camo-spacing-xxs) * -1) 0 var(--f-focus-color);
    }
  `,
  ],
  defaults(theme) {
    return {
      labelPlacement: "above",
      height: field("text-field", "height", "32px"),
      shape: field("text-field", "shape", theme.shapes.small),
      borderWidth: field("text-field", "border-width", "1px"),
      padding: field("text-field", "padding", "10px"),
      iconSize: field("text-field", "icon-size", "20px"),
    };
  },
};

/** Fluent's search field. */
export const fluentSearchField: Renderer<SearchFieldState, SearchFieldSlots, SearchFieldStyle> = {
  ...searchFieldBase,
  styles: [
    searchFieldBase.styles ?? [],
    css`
    .s {
      background: var(--camo-color-surface);
      border: var(--camo-hairline, 1px) solid var(--fluent-neutral-stroke1, var(--camo-color-outline-variant));
      border-block-end-color: var(--camo-color-outline);
    }
    .s.focused {
      outline: none;
      box-shadow: inset 0 calc(var(--camo-spacing-xxs) * -1) 0 var(--camo-color-primary);
    }
  `,
  ],
  defaults(theme) {
    return {
      height: field("search-field", "height", "32px"),
      shape: field("search-field", "shape", theme.shapes.small),
      padding: field("search-field", "padding", "10px"),
      iconSize: field("search-field", "icon-size", "16px"),
    };
  },
};

/** Fluent's checkbox. */
export const fluentCheckbox: Renderer<ToggleState, ToggleSlots, CheckboxStyle> = {
  ...checkboxBase,
  defaults(theme) {
    return {
      boxSize: field("checkbox", "box-size", "16px"),
      shape: field("checkbox", "shape", theme.shapes.extraSmall),
      borderWidth: field("checkbox", "border-width", "1px"),
      labelGap: field("checkbox", "label-gap", theme.spacing.s),
      labelPosition: "end",
    };
  },
};

/** Fluent's switch. */
export const fluentSwitch: Renderer<ToggleState, ToggleSlots, SwitchStyle> = {
  ...switchBase,
  defaults(theme) {
    return {
      trackWidth: field("switch", "track-width", "40px"),
      trackHeight: field("switch", "track-height", "20px"),
      thumbSizeOff: field("switch", "thumb-size-off", "14px"),
      thumbSizeOn: field("switch", "thumb-size-on", "14px"),
      labelGap: field("switch", "label-gap", theme.spacing.s),
      labelPosition: "end",
    };
  },
};

/** Fluent's radio. */
export const fluentRadio: Renderer<ToggleState, ToggleSlots, RadioStyle> = {
  ...radioBase,
  defaults(theme) {
    return {
      size: field("radio", "size", "16px"),
      dotSize: field("radio", "dot-size", "8px"),
      borderWidth: field("radio", "border-width", "1px"),
      labelGap: field("radio", "label-gap", theme.spacing.s),
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
      height: field("segmented-control", "height", "32px"),
      shape: field("segmented-control", "shape", theme.shapes.small),
      borderWidth: field("segmented-control", "border-width", "1px"),
      iconSize: field("segmented-control", "icon-size", "18px"),
      showCheckIcon: false,
    };
  },
};

/** Fluent's segmented control. */
export const fluentSegmentedControl: Renderer<
  SegmentedControlState,
  SegmentedControlSlots,
  SegmentedControlStyle
> = { ...segmentedControlBase, ...segmented };

/** Fluent's segment. */
export const fluentSegment: Renderer<SegmentState, SegmentSlots, SegmentStyle> = {
  ...segmentBase,
  ...segmented,
};

/** Fluent's slider. */
export const fluentSlider: Renderer<SliderState, SliderSlots, SliderStyle> = {
  ...sliderBase,
  styles: [
    sliderBase.styles ?? [],
    css`
    .thumb {
      border: var(--camo-hairline, 1px) solid var(--fluent-neutral-stroke1, var(--camo-color-outline-variant));
      background: radial-gradient(circle, var(--s-handle) 0 42%, var(--camo-color-surface) 46%);
    }
  `,
  ],
  defaults() {
    return {
      trackHeight: field("slider", "track-height", "4px"),
      thumbSize: field("slider", "thumb-size", "20px"),
      showStopMarks: false,
      showValueLabel: false,
    };
  },
};

/** Fluent's stepper. */
export const fluentStepper: Renderer<StepperState, StepperSlots, StepperStyle> = {
  ...stepperBase,
  defaults(theme) {
    return {
      layout: "split",
      height: field("stepper", "height", "32px"),
      shape: field("stepper", "shape", theme.shapes.small),
      valueMinWidth: field("stepper", "value-min-width", "48px"),
      iconSize: field("stepper", "icon-size", "14px"),
    };
  },
};

/** Fluent's calendar. */
export const fluentCalendar: Renderer<CalendarState, CalendarSlots, CalendarStyle> = {
  ...calendarBase,
  defaults(theme) {
    return {
      daySize: field("calendar", "day-size", "32px"),
      shape: field("calendar", "shape", theme.shapes.full),
      showOutsideDays: false,
    };
  },
};

/** Fluent's time picker. */
export const fluentTimePicker: Renderer<TimePickerState, TimePickerSlots, TimePickerStyle> = {
  ...timePickerBase,
  defaults(theme) {
    return {
      style: "fields",
      digitSize: field("time-picker", "digit-size", "32px"),
      shape: field("time-picker", "shape", theme.shapes.small),
    };
  },
};
