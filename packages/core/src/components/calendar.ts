import { html } from "lit";
import type { PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { isServer } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { CamoControl } from "../behavior/control.ts";
import type { ControlValue } from "../behavior/control.ts";
import { CamouflageController } from "../controller.ts";
import {
  addDays,
  addMonths,
  compareDates,
  firstDayOfWeek,
  fullDate,
  monthGrid,
  monthLabel,
  parseDate,
  toIso,
  today,
  weekday,
  weekdayNames,
} from "../date/iso.ts";
import type { YearMonthDay } from "../date/iso.ts";
import type { CalendarDay, CalendarState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

/** The language to format dates in: the attribute, else the page's, else the browser's; `en` on a server. */
export function localeOf(host: HTMLElement, locale: string | null): string {
  if (locale !== null && locale !== "") return locale;
  if (isServer) return "en";
  const lang = host.closest("[lang]")?.getAttribute("lang");
  if (lang !== undefined && lang !== null && lang !== "") return lang;
  return isServer ? "en" : (navigator.language ?? "en");
}

/** What `camo-before-change` carries from a calendar: one date, or a range. */
export type CalendarSelection =
  { value: string | null } | { start: string | null; end: string | null };

/**
 * `<camo-calendar value="2026-11-22" min="2026-11-01" locale="en-GB"></camo-calendar>`
 *
 * A month grid for choosing a date (`value`) or a range (`range`, with `start` and `end`), as ISO strings. The month,
 * the weekday names and the first day of the week come from `Intl` and the locale; `min`, `max`, the `isSelectable`
 * property and, for a range, `max-length` decide which days can be chosen, and the rest are shown but unavailable. The
 * grid is one tab stop; arrow keys move by day, Up and Down by week, PageUp and PageDown by month (Shift: year), Home and
 * End to the week's ends, Enter or Space chooses. Each day is announced with its full date and state.
 *
 * @tagname camo-calendar
 * @attr {string} value - The chosen date, `2026-11-22`.
 * @attr {boolean} range - Choose a range: the first tap sets the start, the second the end.
 * @attr {string} start - The range's first day.
 * @attr {string} end - The range's last day (inclusive).
 * @attr {string} min - The earliest selectable date.
 * @attr {string} max - The latest selectable date.
 * @attr {number} max-length - The longest range, in days.
 * @attr {string} month - The visible month, `2026-11`; follows the selection when absent.
 * @attr {string} locale - The language for names and the first weekday; the page's by default.
 * @attr {number} first-day-of-week - 0 for Sunday to 6 for Saturday; the locale's by default.
 * @attr {string} today - Overrides today's date (tests, a booking cut-off).
 * @attr {boolean} disabled - Blocks choosing (the contract's `enabled`, inverted).
 * @attr {string} name - The name the value is submitted under; a range submits `start/end`.
 * @fires {CustomEvent<CamoBeforeChangeDetail>} camo-before-change - Cancelable, before the selection changes (`{ value }` or `{ start, end }`).
 * @fires input - The selection changed.
 * @fires change - The selection changed (a calendar commits at once).
 */
export class CamoCalendar extends CamoControl {
  static override properties: PropertyDeclarations = {
    value: { type: String },
    range: { type: Boolean, reflect: true },
    start: { type: String },
    end: { type: String },
    min: { type: String },
    max: { type: String },
    maxLength: { type: Number, attribute: "max-length" },
    month: { type: String },
    locale: { type: String },
    firstDayOfWeek: { type: Number, attribute: "first-day-of-week" },
    today: { type: String },
    isSelectable: { attribute: false },
    cursor: { state: true },
    paged: { state: true },
  };

  declare value: string | null;
  declare range: boolean;
  declare start: string | null;
  declare end: string | null;
  declare min: string | null;
  declare max: string | null;
  declare maxLength: number | null;
  declare month: string | null;
  declare locale: string | null;
  declare firstDayOfWeek: number | null;
  declare today: string | null;
  /** Which dates can be chosen, beyond `min` and `max` (no weekends, no holidays); a property, since it is a function. */
  declare isSelectable: ((iso: string) => boolean) | null;
  declare protected cursor: string | null;
  /** The month on screen when the user has paged away from the selection. */
  declare protected paged: string | null;

  readonly #cx: CamouflageController = new CamouflageController(this);
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
    this.min = null;
    this.max = null;
    this.maxLength = null;
    this.month = null;
    this.locale = null;
    this.firstDayOfWeek = null;
    this.today = null;
    this.isSelectable = null;
    this.cursor = null;
    this.paged = null;
    this.addEventListener("keydown", this.#onKeyDown);
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

  get #locale(): string {
    return localeOf(this, this.locale);
  }
  get #first(): number {
    return this.firstDayOfWeek ?? firstDayOfWeek(this.#locale);
  }
  get #today(): YearMonthDay {
    return parseDate(this.today) ?? today();
  }

  /** The month on screen: the one the user paged to, else `month`, else the selection's, else today's. */
  get #visible(): { year: number; month: number } {
    const text = this.paged ?? this.month;
    const m = text === null ? null : /^(\d{4})-(\d{2})$/.exec(text);
    if (m !== null) return { year: Number(m[1]), month: Number(m[2]) };
    const anchor = parseDate(this.range ? this.start : this.value) ?? this.#today;
    return { year: anchor.year, month: anchor.month };
  }

  #enabled(date: YearMonthDay): boolean {
    const min = parseDate(this.min);
    const max = parseDate(this.max);
    if (min !== null && compareDates(date, min) < 0) return false;
    if (max !== null && compareDates(date, max) > 0) return false;
    if (this.isSelectable !== null && !this.isSelectable(toIso(date))) return false;
    if (this.range && this.maxLength !== null) {
      const start = parseDate(this.start);
      if (
        start !== null &&
        parseDate(this.end) === null &&
        Math.abs(compareDates(date, start)) + 1 > this.maxLength
      )
        return false;
    }
    return true;
  }

  /** The day the grid's tab stop is on: the focus, else the selection, else today, kept inside the month. */
  #tabbableDate(): string {
    const { year, month } = this.#visible;
    const wanted =
      parseDate(this.cursor) ?? parseDate(this.range ? this.start : this.value) ?? this.#today;
    const inside = wanted.year === year && wanted.month === month;
    return toIso(inside ? wanted : { year, month, day: 1 });
  }

  #select(iso: string): void {
    const date = parseDate(iso);
    if (date === null || !this.#enabled(date)) return;
    if (!this.range) {
      if (iso === this.value || !this.beforeChange<CalendarSelection>({ value: iso })) return;
      this.value = iso;
    } else {
      const start = parseDate(this.start);
      const hasEnd = parseDate(this.end) !== null;
      let next: { start: string | null; end: string | null };
      if (start === null || hasEnd || compareDates(date, start) < 0)
        next = { start: iso, end: null };
      else next = { start: this.start, end: iso };
      if (!this.beforeChange<CalendarSelection>(next)) return;
      this.start = next.start;
      this.end = next.end;
    }
    this.cursor = iso;
    this.fireInput();
    this.fireChange();
  }

  #go(months: number): void {
    const { year, month } = this.#visible;
    const next = addMonths({ year, month, day: 1 }, months);
    this.paged = `${String(next.year).padStart(4, "0")}-${String(next.month).padStart(2, "0")}`;
    this.cursor = null;
  }

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    const target = event.composedPath()[0] as HTMLElement | undefined;
    const iso = target?.dataset?.["date"];
    const from = parseDate(iso);
    if (from === null) return;
    const rtl = getComputedStyle(this).direction === "rtl";
    let next: YearMonthDay | undefined;
    switch (event.key) {
      case "ArrowRight":
        next = addDays(from, rtl ? -1 : 1);
        break;
      case "ArrowLeft":
        next = addDays(from, rtl ? 1 : -1);
        break;
      case "ArrowDown":
        next = addDays(from, 7);
        break;
      case "ArrowUp":
        next = addDays(from, -7);
        break;
      case "PageDown":
        next = addMonths(from, event.shiftKey ? 12 : 1);
        break;
      case "PageUp":
        next = addMonths(from, event.shiftKey ? -12 : -1);
        break;
      case "Home":
        next = addDays(from, -((weekday(from) - this.#first + 7) % 7));
        break;
      case "End":
        next = addDays(from, 6 - ((weekday(from) - this.#first + 7) % 7));
        break;
      default:
        return;
    }
    event.preventDefault();
    this.cursor = toIso(next);
    this.paged = `${String(next.year).padStart(4, "0")}-${String(next.month).padStart(2, "0")}`;
    void this.updateComplete.then(() => {
      this.renderRoot.querySelector<HTMLElement>(`[data-date="${toIso(next!)}"]`)?.focus();
    });
  };

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.internals, {
      role: "group",
      label: monthLabel(this.#visible.year, this.#visible.month, this.#locale),
      disabled: this.isDisabled,
    });
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html``;
    const renderer = skin.calendar;
    const locale = this.#locale;
    const { year, month } = this.#visible;
    const first = this.#first;
    const todayDate = this.#today;
    const tabbable = this.#tabbableDate();
    const start = parseDate(this.range ? this.start : this.value);
    const end = this.range ? parseDate(this.end) : null;
    const min = parseDate(this.min);
    const max = parseDate(this.max);
    const day = (d: YearMonthDay): CalendarDay => {
      const iso = toIso(d);
      const isStart = start !== null && compareDates(d, start) === 0;
      const isEnd = end !== null && compareDates(d, end) === 0;
      const inside =
        start !== null && end !== null && compareDates(d, start) > 0 && compareDates(d, end) < 0;
      const base = fullDate(d, locale);
      return {
        iso,
        day: d.day,
        label:
          isStart && this.range
            ? `${base}, start of range`
            : isEnd
              ? `${base}, end of range`
              : base,
        inMonth: d.month === month,
        enabled: !this.isDisabled && this.#enabled(d),
        selected: this.range ? isStart || isEnd : isStart,
        today: compareDates(d, todayDate) === 0,
        range: isStart && end !== null ? "start" : isEnd ? "end" : inside ? "middle" : "none",
        tabbable: iso === tabbable,
      };
    };
    const monthStart: YearMonthDay = { year, month, day: 1 };
    const state: CalendarState = {
      monthLabel: monthLabel(year, month, locale),
      weekdays: weekdayNames(locale, first),
      weeks: monthGrid(year, month, first).map((week) => week.map(day)),
      canPrevious: min === null || compareDates(addDays(monthStart, -1), min) >= 0,
      canNext: max === null || compareDates(addMonths(monthStart, 1), max) <= 0,
      previousLabel: "Previous month",
      nextLabel: "Next month",
      actions: {
        select: (iso) => this.#select(iso),
        previous: () => this.#go(-1),
        next: () => this.#go(1),
      },
    };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: {},
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
    })}`;
  }
}
