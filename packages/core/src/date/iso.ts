// Calendar dates and clock times as ISO strings (`2026-11-22`, `13:45`), and the locale rules around them, from `Intl`.
// A date here has no time and no time zone, so there are no zone surprises: every calculation is on year, month and day.

export interface YearMonthDay {
  year: number;
  month: number; // 1 to 12
  day: number;
}

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^(\d{2}):(\d{2})$/;

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** `2026-11-22` to its parts, or `null` when it is not a real date (`2026-02-30`). */
export function parseDate(iso: string | null | undefined): YearMonthDay | null {
  const match = iso === null || iso === undefined ? null : DATE.exec(iso);
  if (match === null) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

const pad = (n: number, width = 2): string => String(n).padStart(width, "0");

export function toIso({ year, month, day }: YearMonthDay): string {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

function utc({ year, month, day }: YearMonthDay): number {
  return Date.UTC(year, month - 1, day);
}

function fromUtc(ms: number): YearMonthDay {
  const d = new Date(ms);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function addDays(date: YearMonthDay, days: number): YearMonthDay {
  return fromUtc(utc(date) + days * 86_400_000);
}

/** Adds months, keeping the day when the month has it and the last day when it does not. */
export function addMonths(date: YearMonthDay, months: number): YearMonthDay {
  const index = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
}

/** Negative, zero or positive, as `a - b` in days. */
export function compareDates(a: YearMonthDay, b: YearMonthDay): number {
  return Math.round((utc(a) - utc(b)) / 86_400_000);
}

/** 0 for Sunday to 6 for Saturday. */
export function weekday(date: YearMonthDay): number {
  return new Date(utc(date)).getUTCDay();
}

/** The first day of the week in a locale, 0 for Sunday to 6 for Saturday (from `Intl`, with a region table where the engine has none). */
export function firstDayOfWeek(locale: string): number {
  try {
    const l = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    const info = l.getWeekInfo?.() ?? l.weekInfo;
    if (info !== undefined) return info.firstDay % 7; // 1 Monday … 7 Sunday
    const region = l.maximize().region ?? "";
    const sunday = new Set([
      "US",
      "CA",
      "MX",
      "BR",
      "JP",
      "IN",
      "AU",
      "IL",
      "SA",
      "ZA",
      "KR",
      "TW",
      "PH",
      "ID",
      "TH",
      "PE",
      "CO",
      "VE",
    ]);
    const saturday = new Set([
      "EG",
      "IR",
      "AF",
      "DZ",
      "BH",
      "IQ",
      "JO",
      "KW",
      "LY",
      "OM",
      "QA",
      "SD",
      "SY",
      "AE",
    ]);
    return sunday.has(region) ? 0 : saturday.has(region) ? 6 : 1;
  } catch {
    return 1;
  }
}

/** The weeks of a month as dates, each week starting at `firstDay`; the grid always covers whole weeks. */
export function monthGrid(year: number, month: number, firstDay: number): YearMonthDay[][] {
  const first: YearMonthDay = { year, month, day: 1 };
  const lead = (weekday(first) - firstDay + 7) % 7;
  const start = addDays(first, -lead);
  const total = Math.ceil((lead + daysInMonth(year, month)) / 7) * 7;
  const weeks: YearMonthDay[][] = [];
  for (let i = 0; i < total; i += 7)
    weeks.push(Array.from({ length: 7 }, (_, d) => addDays(start, i + d)));
  return weeks;
}

/** "November 2026". */
export function monthLabel(year: number, month: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

/** Short and long weekday names starting at `firstDay`. */
export function weekdayNames(locale: string, firstDay: number): { short: string; long: string }[] {
  const short = new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" });
  const long = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" });
  // 2023-01-01 was a Sunday.
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.UTC(2023, 0, 1 + ((firstDay + i) % 7)));
    return { short: short.format(d), long: long.format(d) };
  });
}

/** "Sunday, 22 November 2026": what a screen reader reads for a day. */
export function fullDate(date: YearMonthDay, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" }).format(
    new Date(utc(date)),
  );
}

/** The text of a date in a field: the locale's medium format. */
export function mediumDate(date: YearMonthDay, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(utc(date)),
  );
}

/** Today in the user's time zone, as a date. */
export function today(): YearMonthDay {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

// --- Dates typed by hand: the order of day, month and year follows the locale -------------------------------

/** The order the locale writes a short date in, like `["month", "day", "year"]`, and its separator. */
export function shortDatePattern(locale: string): {
  order: ("day" | "month" | "year")[];
  separator: string;
} {
  const parts = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).formatToParts(new Date(Date.UTC(2023, 10, 22)));
  const order = parts
    .filter((p) => p.type === "day" || p.type === "month" || p.type === "year")
    .map((p) => p.type as "day" | "month" | "year");
  const separator = parts.find((p) => p.type === "literal")?.value.trim() || "/";
  return { order, separator };
}

/** The ISO date of text typed in the locale's short pattern, or `null` when it is not a date. */
export function parseTypedDate(text: string, locale: string): string | null {
  const { order } = shortDatePattern(locale);
  const numbers = text
    .trim()
    .split(/\D+/)
    .filter((s) => s !== "");
  if (numbers.length !== 3) return null;
  const byType = Object.fromEntries(order.map((type, i) => [type, Number(numbers[i])])) as Record<
    "day" | "month" | "year",
    number
  >;
  const year = byType.year < 100 ? 2000 + byType.year : byType.year;
  const iso = toIso({ year, month: byType.month, day: byType.day });
  return parseDate(iso) === null ? null : iso;
}

// --- Times ---------------------------------------------------------------------------------------------------

export interface HourMinute {
  hour: number;
  minute: number;
}

export function parseTime(iso: string | null | undefined): HourMinute | null {
  const match = iso === null || iso === undefined ? null : TIME.exec(iso);
  if (match === null) return null;
  const [hour, minute] = [Number(match[1]), Number(match[2])];
  return hour > 23 || minute > 59 ? null : { hour, minute };
}

export function toIsoTime({ hour, minute }: HourMinute): string {
  return `${pad(hour)}:${pad(minute)}`;
}

/** Whether the locale reads the clock in 24 hours (`14:30`) and not in 12 (`2:30 PM`). */
export function uses24Hour(locale: string): boolean {
  try {
    return !new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hour12;
  } catch {
    return true;
  }
}

/** The locale's short time text: `14:30` or `2:30 PM`. */
export function timeText(time: HourMinute, locale: string, hour24: boolean): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: !hour24,
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2023, 0, 1, time.hour, time.minute)));
}

/** The locale's names for AM and PM. */
export function periodNames(locale: string): { am: string; pm: string } {
  const f = new Intl.DateTimeFormat(locale, { hour: "numeric", hour12: true, timeZone: "UTC" });
  const part = (hour: number): string =>
    f.formatToParts(new Date(Date.UTC(2023, 0, 1, hour))).find((p) => p.type === "dayPeriod")
      ?.value ?? (hour < 12 ? "AM" : "PM");
  return { am: part(1), pm: part(13) };
}
