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

/** Carbon's text input: the field fill with a bottom border only. */
export const carbonTextField: Renderer<TextFieldState, TextFieldSlots, TextFieldStyle> = {
  ...textFieldBase,
  styles: [
    textFieldBase.styles ?? [],
    css`
    .box {
      background: var(--camo-color-surface-container-low);
      border-width: 0 0 var(--camo-text-field-underline, 1px);
    }
    .f.floating .label {
      background: var(--camo-color-surface-container-low);
    }
    .f.focused .box,
    .f.error .box {
      border-width: 0 0 var(--camo-text-field-underline, 1px);
      outline: var(--camo-spacing-xxs) solid var(--f-focus-color);
      outline-offset: calc(var(--camo-spacing-xxs) * -1);
    }
  `,
  ],
  defaults(theme) {
    return {
      labelPlacement: "above",
      height: field(
        "text-field",
        "height",
        "var(--carbon-density-control, calc(48px - var(--camo-input-pointer, 0) * 8px))",
      ),
      shape: field("text-field", "shape", theme.shapes.none),
      borderWidth: field("text-field", "border-width", "1px"),
      padding: field("text-field", "padding", theme.spacing.l),
      iconSize: field("text-field", "icon-size", "16px"),
    };
  },
};

/** Carbon's search field. */
export const carbonSearchField: Renderer<SearchFieldState, SearchFieldSlots, SearchFieldStyle> = {
  ...searchFieldBase,
  styles: [
    searchFieldBase.styles ?? [],
    css`
    .s {
      background: var(--camo-color-surface-container-low);
      border-block-end: var(--camo-search-field-underline, 1px) solid var(--camo-color-outline);
    }
    .s.focused {
      outline-offset: calc(var(--camo-spacing-xxs) * -1);
    }
  `,
  ],
  defaults(theme) {
    return {
      height: field(
        "search-field",
        "height",
        "var(--carbon-density-control, calc(48px - var(--camo-input-pointer, 0) * 8px))",
      ),
      shape: field("search-field", "shape", theme.shapes.none),
      padding: field("search-field", "padding", theme.spacing.l),
      iconSize: field("search-field", "icon-size", "16px"),
    };
  },
};

/** Carbon's checkbox. */
export const carbonCheckbox: Renderer<ToggleState, ToggleSlots, CheckboxStyle> = {
  ...checkboxBase,
  defaults(theme) {
    return {
      boxSize: field("checkbox", "box-size", "16px"),
      shape: field("checkbox", "shape", theme.shapes.none),
      borderWidth: field("checkbox", "border-width", "1px"),
      labelGap: field("checkbox", "label-gap", theme.spacing.s),
      labelPosition: "end",
    };
  },
};

/** Carbon's toggle: 48 by 24, green when on. */
export const carbonSwitch: Renderer<ToggleState, ToggleSlots, SwitchStyle> = {
  ...switchBase,
  styles: [
    switchBase.styles ?? [],
    css`
    /* The toggle is green when on; the focus stroke stays blue. */
    .row {
      --camo-color-primary: var(--camo-color-success);
    }
    :host(:focus-visible) .control {
      outline-color: var(--camo-color-info);
    }
  `,
  ],
  defaults(theme) {
    return {
      trackWidth: field("switch", "track-width", "48px"),
      trackHeight: field("switch", "track-height", "24px"),
      thumbSizeOff: field("switch", "thumb-size-off", "18px"),
      thumbSizeOn: field("switch", "thumb-size-on", "18px"),
      labelGap: field("switch", "label-gap", theme.spacing.l),
      labelPosition: "start",
    };
  },
};

/** Carbon's radio. */
export const carbonRadio: Renderer<ToggleState, ToggleSlots, RadioStyle> = {
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
      height: field(
        "segmented-control",
        "height",
        "var(--carbon-density-control, calc(48px - var(--camo-input-pointer, 0) * 8px))",
      ),
      shape: field("segmented-control", "shape", theme.shapes.none),
      borderWidth: field("segmented-control", "border-width", "1px"),
      iconSize: field("segmented-control", "icon-size", "18px"),
      showCheckIcon: false,
    };
  },
};

/** Carbon's segmented control. */
export const carbonSegmentedControl: Renderer<
  SegmentedControlState,
  SegmentedControlSlots,
  SegmentedControlStyle
> = { ...segmentedControlBase, ...segmented };

/** Carbon's segment. */
export const carbonSegment: Renderer<SegmentState, SegmentSlots, SegmentStyle> = {
  ...segmentBase,
  styles: [
    segmentBase.styles ?? [],
    css`
    /* The content switcher: the selected segment is the inverse fill. */
    :host {
      --camo-color-secondary-container: var(--camo-color-inverse-surface);
      --camo-color-on-secondary-container: var(--camo-color-inverse-on-surface);
    }
  `,
  ],
  ...segmented,
};

/** Carbon's slider. */
export const carbonSlider: Renderer<SliderState, SliderSlots, SliderStyle> = {
  ...sliderBase,
  defaults() {
    return {
      trackHeight: field("slider", "track-height", "2px"),
      thumbSize: field("slider", "thumb-size", "14px"),
      showStopMarks: false,
      showValueLabel: true,
    };
  },
};

/** Carbon's stepper. */
export const carbonStepper: Renderer<StepperState, StepperSlots, StepperStyle> = {
  ...stepperBase,
  defaults(theme) {
    return {
      layout: "split",
      height: field(
        "stepper",
        "height",
        "var(--carbon-density-control, calc(48px - var(--camo-input-pointer, 0) * 8px))",
      ),
      shape: field("stepper", "shape", theme.shapes.none),
      valueMinWidth: field("stepper", "value-min-width", "48px"),
      iconSize: field("stepper", "icon-size", "14px"),
    };
  },
};

/** Carbon's calendar. */
export const carbonCalendar: Renderer<CalendarState, CalendarSlots, CalendarStyle> = {
  ...calendarBase,
  defaults(theme) {
    return {
      daySize: field("calendar", "day-size", "40px"),
      shape: field("calendar", "shape", theme.shapes.none),
      showOutsideDays: false,
    };
  },
};

/** Carbon's time picker. */
export const carbonTimePicker: Renderer<TimePickerState, TimePickerSlots, TimePickerStyle> = {
  ...timePickerBase,
  defaults(theme) {
    return {
      style: "fields",
      digitSize: field("time-picker", "digit-size", "48px"),
      shape: field("time-picker", "shape", theme.shapes.none),
    };
  },
};
