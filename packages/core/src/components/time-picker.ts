import { html } from "lit";
import type { PropertyDeclarations, TemplateResult } from "lit";
import type { ControlValue } from "../behavior/control.ts";
import { localeOf } from "./calendar.ts";
import { CamoPickerField } from "./picker-field.ts";
import { parseTime, periodNames, timeText, toIsoTime, uses24Hour } from "../date/iso.ts";
import type { HourCycle, TimePickerState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const CLOCK_ICON =
  "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z";

/**
 * `<camo-time-picker name="pickup" label="Pickup time" minute-step="15"></camo-time-picker>`
 *
 * A time of day as an ISO string (`13:45`, no date and no time zone), shown in the locale's short format. The panel is
 * number fields in Minimal and scrolling wheels in Cupertino (the skin's choice); each part is an adjustable control
 * (Up and Down change it by one, or by `minute-step`). It confirms with Cancel and OK, since a time has two parts, or
 * at once with `instant`. 12 or 24 hour follows the locale unless `hour-cycle` says. Form-associated.
 *
 * @tagname camo-time-picker
 * @attr {string} value - The chosen time, `13:45`.
 * @attr {string} label - The label.
 * @attr {string} placeholder - Hint text while nothing is chosen.
 * @attr {string} supporting-text - Helper text below the field.
 * @attr {string} error - A message: the field is in the error state, and invalid to its form.
 * @attr {number} minute-step - Minutes move in multiples of this; 1 by default.
 * @attr {"12"|"24"} hour-cycle - 12 or 24 hour; the locale's when absent (the contract's `use24Hour`).
 * @attr {string} min - The earliest allowed time.
 * @attr {string} max - The latest allowed time.
 * @attr {"auto"|"popup"|"sheet"} presentation - Where the panel opens; `auto` follows the window width.
 * @attr {boolean} instant - Every change commits at once, with no Cancel and OK.
 * @attr {string} locale - The language for the text and the AM and PM names.
 * @attr {boolean} disabled - Blocks use and focus (the contract's `enabled`, inverted).
 * @attr {boolean} required - Invalid to its form until a time is chosen.
 * @attr {string} name - The name the value is submitted under.
 * @fires {CustomEvent<CamoBeforeChangeDetail>} camo-before-change - Cancelable, before the value changes.
 * @fires input - The value changed.
 * @fires change - The value was confirmed.
 */
export class CamoTimePicker extends CamoPickerField {
  static override properties: PropertyDeclarations = {
    value: { type: String },
    minuteStep: { type: Number, attribute: "minute-step" },
    hourCycle: { type: String, attribute: "hour-cycle" },
    draft: { state: true },
  };

  declare value: string | null;
  declare minuteStep: number;
  declare hourCycle: HourCycle | null;
  declare protected draft: { hour: number; minute: number };

  #defaultValue: string | null = null;

  constructor() {
    super();
    this.value = null;
    this.minuteStep = 1;
    this.hourCycle = null;
    this.draft = { hour: 12, minute: 0 };
  }

  get #hour24(): boolean {
    return this.hourCycle === null
      ? uses24Hour(localeOf(this, this.locale))
      : this.hourCycle === "24";
  }

  protected override displayText(): string {
    const t = parseTime(this.value);
    return t === null ? "" : timeText(t, localeOf(this, this.locale), this.#hour24);
  }
  protected override panelLabel(): string {
    return this.label ?? "Choose a time";
  }
  protected override iconPath(): string {
    return CLOCK_ICON;
  }
  protected override formValue(): ControlValue {
    return this.value === "" ? null : this.value;
  }
  protected override isEmpty(): boolean {
    return this.value === null || this.value === "";
  }
  protected override captureDefault(): void {
    this.#defaultValue = this.value;
  }
  protected override resetToDefault(): void {
    this.value = this.#defaultValue;
  }
  protected override ownProblem(): string | null {
    const t = parseTime(this.value);
    if (t === null) return null;
    const at = t.hour * 60 + t.minute;
    const min = parseTime(this.min);
    const max = parseTime(this.max);
    if (
      (min !== null && at < min.hour * 60 + min.minute) ||
      (max !== null && at > max.hour * 60 + max.minute)
    )
      return "This time is not available.";
    return null;
  }
  protected override openDraft(): void {
    this.draft = parseTime(this.value) ?? { hour: 12, minute: 0 };
  }

  #commit(): void {
    const iso = toIsoTime(this.draft);
    if (iso === this.value || !this.beforeChange(iso)) return;
    this.value = iso;
    this.fireInput();
    this.fireChange();
  }

  protected override renderPanel(): TemplateResult {
    const skin = this.cx.skin;
    if (skin === undefined) return html``;
    const renderer = skin.timePicker;
    const hour24 = this.#hour24;
    const step = Math.max(1, Math.round(this.minuteStep));
    const set = (next: { hour: number; minute: number }): void => {
      this.draft = next;
      if (this.instant) this.#commit();
    };
    const state: TimePickerState = {
      hour: this.draft.hour,
      minute: this.draft.minute,
      is24Hour: hour24,
      period: this.draft.hour < 12 ? "am" : "pm",
      hours: hour24
        ? Array.from({ length: 24 }, (_, i) => i)
        : Array.from({ length: 12 }, (_, i) => i + 1),
      minutes: Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step),
      periodLabels: periodNames(localeOf(this, this.locale)),
      hourLabel: "Hour",
      minuteLabel: "Minute",
      actions: {
        setHour: (hour) => set({ ...this.draft, hour }),
        setMinute: (minute) => set({ ...this.draft, minute }),
        setPeriod: (period) => {
          const base = this.draft.hour % 12;
          set({ ...this.draft, hour: period === "pm" ? base + 12 : base });
        },
      },
    };
    const panel = html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: {},
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
    })}`;
    return html`${panel}${
      this.instant
        ? html``
        : this.renderActions(
            () => {
              this.#commit();
              this.hide();
            },
            () => this.hide(),
          )
    }`;
  }
}
