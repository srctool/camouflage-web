import { html } from "lit";
import type { PropertyDeclarations, TemplateResult } from "lit";
import type { ControlValue } from "../behavior/control.ts";
import { localeOf } from "./calendar.ts";
import type { CamoCalendar } from "./calendar.ts";
import { CamoPickerField } from "./picker-field.ts";
import { mediumDate, parseDate } from "../date/iso.ts";

const CALENDAR_ICON =
  "M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 16H5V10h14zm0-12H5V6h14z";

/**
 * `<camo-date-picker name="birth" label="Birth date" min="1900-01-01"></camo-date-picker>`
 *
 * A date as an ISO string (`2026-11-22`; a range is `start` and `end`), shown in the locale's medium format, chosen in a
 * calendar that opens below the field (a popup) or from the bottom (a sheet on a compact window). A single date is
 * confirmed with Cancel and OK, or at once with `instant`; a range has Done and Clear. The field announces itself as a
 * pop-up button; Enter, Space and the Down arrow open it, Escape closes it and returns focus. Form-associated: a single
 * date submits `2026-11-22`, a range submits `2026-11-22/2026-11-28`.
 *
 * @tagname camo-date-picker
 * @attr {string} value - The chosen date.
 * @attr {boolean} range - Choose a range; use `start` and `end`.
 * @attr {string} start - The range's first day.
 * @attr {string} end - The range's last day.
 * @attr {string} label - The label.
 * @attr {string} placeholder - Hint text while nothing is chosen.
 * @attr {string} supporting-text - Helper text below the field.
 * @attr {string} error - A message: the field is in the error state, and invalid to its form.
 * @attr {string} min - The earliest selectable date.
 * @attr {string} max - The latest selectable date.
 * @attr {number} max-length - The longest range, in days.
 * @attr {"auto"|"popup"|"sheet"} presentation - Where the calendar opens; `auto` follows the window width.
 * @attr {boolean} instant - A single date is chosen and the panel closes at once, with no Cancel and OK.
 * @attr {string} locale - The language for the text, names and first weekday.
 * @attr {boolean} disabled - Blocks use and focus (the contract's `enabled`, inverted).
 * @attr {boolean} required - Invalid to its form until a date is chosen.
 * @attr {string} name - The name the value is submitted under.
 * @fires {CustomEvent<CamoBeforeChangeDetail>} camo-before-change - Cancelable, before the value changes (`{ value }` or `{ start, end }`).
 * @fires input - The value changed.
 * @fires change - The value was confirmed.
 */
export class CamoDatePicker extends CamoPickerField {
  static override properties: PropertyDeclarations = {
    value: { type: String },
    range: { type: Boolean, reflect: true },
    start: { type: String },
    end: { type: String },
    maxLength: { type: Number, attribute: "max-length" },
    isSelectable: { attribute: false },
    doneLabel: { type: String, attribute: "done-label" },
    clearLabel: { type: String, attribute: "clear-label" },
    draft: { state: true },
  };

  declare value: string | null;
  declare range: boolean;
  declare start: string | null;
  declare end: string | null;
  declare maxLength: number | null;
  /** Which dates can be chosen, beyond `min` and `max`; a property, since it is a function. */
  declare isSelectable: ((iso: string) => boolean) | null;
  declare doneLabel: string;
  declare clearLabel: string;
  declare protected draft: { value: string | null; start: string | null; end: string | null };

  #defaults: { value: string | null; start: string | null; end: string | null } = {
    value: null,
    start: null,
    end: null,
  };

  constructor() {
    super();
    this.value = null;
    this.range = false;
    this.start = null;
    this.end = null;
    this.maxLength = null;
    this.isSelectable = null;
    this.doneLabel = "Done";
    this.clearLabel = "Clear";
    this.draft = { value: null, start: null, end: null };
  }

  protected override displayText(): string {
    const locale = localeOf(this, this.locale);
    const text = (iso: string | null): string => {
      const d = parseDate(iso);
      return d === null ? "" : mediumDate(d, locale);
    };
    if (!this.range) return text(this.value);
    const [a, b] = [text(this.start), text(this.end)];
    return a === "" ? "" : b === "" ? a : `${a} – ${b}`;
  }
  protected override panelLabel(): string {
    return this.label ?? "Choose a date";
  }
  protected override iconPath(): string {
    return CALENDAR_ICON;
  }
  protected override formValue(): ControlValue {
    if (!this.range) return this.value;
    return this.start !== null && this.end !== null ? `${this.start}/${this.end}` : null;
  }
  protected override isEmpty(): boolean {
    return this.range
      ? this.start === null || this.end === null
      : this.value === null || this.value === "";
  }
  protected override captureDefault(): void {
    this.#defaults = { value: this.value, start: this.start, end: this.end };
  }
  protected override resetToDefault(): void {
    this.value = this.#defaults.value;
    this.start = this.#defaults.start;
    this.end = this.#defaults.end;
  }
  protected override openDraft(): void {
    this.draft = { value: this.value, start: this.start, end: this.end };
  }

  #commit(next: { value: string | null; start: string | null; end: string | null }): void {
    const detail = this.range ? { start: next.start, end: next.end } : { value: next.value };
    if (!this.beforeChange(detail)) return;
    if (this.range) {
      this.start = next.start;
      this.end = next.end;
    } else {
      this.value = next.value;
    }
    this.fireInput();
    this.fireChange();
  }

  #onCalendar = (event: Event): void => {
    const cal = event.target as CamoCalendar;
    event.stopPropagation();
    this.draft = { value: cal.value, start: cal.start, end: cal.end };
    if (!this.range && this.instant) {
      this.#commit(this.draft);
      this.hide();
    }
  };

  protected override renderPanel(): TemplateResult {
    const complete = this.range
      ? parseDate(this.draft.start) !== null && parseDate(this.draft.end) !== null
      : true;
    const actions = this.range
      ? html`<div class="actions">
          <camo-button
            text=${this.clearLabel}
            appearance="ghost"
            @click=${(): void => void (this.draft = { value: null, start: null, end: null })}
          ></camo-button>
          <camo-button
            text=${this.doneLabel}
            ?disabled=${!complete}
            @click=${(): void => {
              this.#commit(this.draft);
              this.hide();
            }}
          ></camo-button>
        </div>`
      : this.instant
        ? html``
        : this.renderActions(
            () => {
              this.#commit(this.draft);
              this.hide();
            },
            () => this.hide(),
          );
    return html`<camo-calendar
        .value=${this.draft.value}
        .start=${this.draft.start}
        .end=${this.draft.end}
        ?range=${this.range}
        .min=${this.min}
        .max=${this.max}
        .maxLength=${this.maxLength}
        .isSelectable=${this.isSelectable}
        .locale=${this.locale}
        @change=${this.#onCalendar}
      ></camo-calendar>
      ${actions}`;
  }
}
