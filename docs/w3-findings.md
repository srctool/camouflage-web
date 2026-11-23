# W3 findings

What building the inputs (text and search field, checkbox, switch, radio, segmented control, slider, stepper, form,
calendar, date and time pickers) settled, and what it did not.

## Decisions

- **One base for every input.** `CamoControl` (`behavior/control.ts`) is a form-associated element with `name`, `required`,
  `disabled` and `error`. It reports value and validity through `ElementInternals`, takes part in `FormData`, `reset`,
  `checkValidity` and a disabled `<fieldset>`, and fires the events of the inputs rule: a cancelable `camo-before-change`
  (`{ value }`), then `input` (once per edit), and `change` on commit. `preventDefault()` on the first keeps the previous
  value, which is how a framework keeps the input controlled. Every input below is a subclass.
- **An `error` is also a validity.** A control with an `error` is `customError` to its form, so `form.checkValidity()` is
  false and `form.requestSubmit()` stops, as for a native control with `setCustomValidity`. A stale message is cleared by
  the user's next edit (by `camo-form`), not by a programmatic `value` change.
- **The editable node is core's.** A text field builds its `<input>` (or `<textarea>`) and passes it to the renderer as
  `nodes.input`; the renderer places it and draws the label, helper text and error around it. The two meet through fixed ids
  inside the shadow root (`FIELD_IDS`: `input`, `label`, `supporting`, `error`), so no id crosses a shadow root and the
  input is named by a real `<label for>`. The same node serves the search field, the stepper, and the date and time fields.
- **`inputFilter` and `displayFormat` are pure objects** (`inputFilters.digitsOnly`, `displayFormats.pattern("####-####")`,
  `grouping`, `decimal`) applied by `applyEdit(previous, typed, cursor, filter, format)` around each edit, so the cursor
  maps between the raw and the shown text and never jumps. They run in Node and are tested there.
- **Children, not lists.** Radio options and segments are child elements (`camo-radio`, `camo-segment`), not an `options`
  property: they render on the server, work in plain HTML, and a framework passes them as children. The group owns the
  selection, the roving tab stop and the arrow keys (move and select, wrapping, skipping disabled).
- **Form rules by name.** `camo-form` finds every named input inside it, so no field wrapper is needed (the issue's
  "form-field wrappers" are the inputs themselves). `rules` is a property: a rule or a list of rules per name, rules are plain
  functions (`CamoRules.required("…")`, or any function), and the first failure wins. It works with a native `<form>` around
  it (their `submit` is validated, `FormData` has every input) or alone (`camo-button type="submit"`, Enter in a field).
- **`value` is what rules see.** A checkbox is a boolean, a multiple segmented control a list, a date range
  `{ start, end }`, everything else its `value`, with an empty string as `null`.
- **Dates and times are ISO strings; the locale comes from `Intl`.** `date/iso.ts` does the calendar arithmetic on year,
  month and day (no time zone), the first weekday (`Intl.Locale.getWeekInfo`, with a region table where the engine has
  none), the month and weekday names, and the full date a screen reader reads for each day.
- **The pickers open a native popover.** `popover="auto"` gives Escape, a click outside and light dismissal for free;
  the panel is a popup below the field on a wide window and a bottom sheet on a compact one (`presentation`), and focus
  returns to the field on Escape and on the buttons. The calendar is its own element, so an inline booking calendar and the
  picker use the same code.
- **The skin decides the picker's form.** `timePicker` is `fields` (two number fields and a period control) in Minimal and
  `wheel` (scroll-snapped columns, each one adjustable control) in Cupertino. A wheel scrolls to its value when the panel opens.
- **Names that differ from the base notes** (listed in `contract/camouflage-contract.json`): `value` for `query`;
  `step` (a spacing, like a native range) for `steps`; `checked` for `selected`; `variant` as in W2; `toggle` is not needed
  here (a checkbox is already boolean); `readonly` is the inverted `allowTyping`; `hour-cycle` is `use24Hour`.

## Findings

- **A role hides its content.** A checkbox, switch or radio makes its children presentational, so a link in a rich label is
  focusable but invisible to a screen reader (axe: `nested-interactive`). The base note's "rich label with links" cannot be
  met by a role on the host. The labels take `<strong>` and `<em>`; a link or a control in one logs a warning. The terms
  link goes next to the checkbox. This is a gap against Kotlin and Dart, recorded here and in the Components note.
- **Adopted styles beat a `<style>` in the shadow root.** A component's `static styles` are applied after the `<style>` the
  renderer injects, so a rule in `static styles` (a picker's `font: inherit`) overrode the skin's. Core elements keep
  `static styles` to layout the skin does not set. The picker's field was in the wrong font until it was seen.
- **A custom property misspelt is silently unset.** `--camo-typography-*` is `--camo-type-*`; two core files used the wrong
  one (W2's tooltip too) and nothing failed. `tests/node/variables.node.test.ts` now reads every `var(--camo-…)` in the
  source and checks it against the theme.
- **A native `<form>` does not see a shadow-DOM input.** `delegatesFocus` and `ElementInternals` do the work: the host is
  the form-associated element, its inner `<input>` is only the editing surface. Enter in a field calls `form.requestSubmit()`
  (or `camo-request-submit` where there is no native form), because implicit submission looks for a submit button the form owns.
- **Server rendering needs no selection state in the HTML you did not write.** A server cannot tell a radio it is the
  selected one from the group's `value`: render `checked` on the radio and `selected` on the segment (the sample does) to avoid
  a flash; the group fixes it on hydration either way. Segment borders use `:host(:first-child)` for the same reason.
- **Space opens on key up.** A picker that opens on Space key down moves focus into the panel, and the key's release then
  lands on a day button and clicks it. A native button activates on key up; so does the picker.
- **Date wheel is not built.** Cupertino's single date is the calendar like Minimal's. A date wheel (and a time dial for
  Material) is a later skin task; `time-picker`'s style is a gap, listed in the contract.

## Gaps

- Theme fields a CSS variable cannot carry: `labelPlacement`, `labelPosition` (checkbox, switch, radio), `showCheckIcon`,
  `showStopMarks`, `showValueLabel`, the stepper's `layout`, `showOutsideDays` and the time picker's `style`. Listed and tested.
- Typing a date into the field (`allowTyping`): the field is read-only and opens the calendar. `parseTypedDate` exists in
  `date/iso.ts` for it.
- `CamoFieldFrame` (the text field's frame around any input, ADR-30) is not exposed as an element; the pickers and the
  stepper reuse the text field's renderer instead.
- Firefox for the new tests (CI only), and the Linux baselines of the new scenarios (from the CI artifact after merge).

## Sizes

gzip, from `pnpm size`: core 26 892 (budget 28 500), core + Minimal 40 837 (43 000), core + Minimal + Cupertino 42 595
(45 000), Minimal alone 19 685 (21 000). Fourteen elements, twenty-two renderers and the date and form logic. The budgets
were raised in this milestone; W10 (#66) is where tree-shaking and splitting the date code out is planned.
