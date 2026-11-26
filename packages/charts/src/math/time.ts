// A time axis over epoch milliseconds: ticks fall on calendar steps (minutes, hours, days, weeks, months, years) in the
// zone given as a UTC offset. No time library: the app passes the offset. Pure.

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
/** 1970-01-01 was a Thursday, so Monday is day 4 (mod 7). */
const WEEKDAY_SHIFT = 4;

/** A calendar step between two ticks: a fixed length, or a number of months. */
export interface TimeStep {
  name: string;
  millis: number;
  months: number;
}

const fixed = (name: string, millis: number): TimeStep => ({ name, millis, months: 0 });
const monthly = (name: string, months: number): TimeStep => ({ name, millis: 0, months });

export const TIME_STEPS: readonly TimeStep[] = [
  fixed("minute", MINUTE),
  fixed("five-minutes", 5 * MINUTE),
  fixed("fifteen-minutes", 15 * MINUTE),
  fixed("thirty-minutes", 30 * MINUTE),
  fixed("hour", HOUR),
  fixed("three-hours", 3 * HOUR),
  fixed("six-hours", 6 * HOUR),
  fixed("twelve-hours", 12 * HOUR),
  fixed("day", DAY),
  fixed("two-days", 2 * DAY),
  fixed("week", 7 * DAY),
  monthly("month", 1),
  monthly("quarter", 3),
  monthly("half-year", 6),
  monthly("year", 12),
  monthly("two-years", 24),
  monthly("five-years", 60),
  monthly("ten-years", 120),
];

export interface TimeTicks {
  ticks: number[];
  step: TimeStep;
}

/** Epoch milliseconds of the first day of a month, counted as `year * 12 + month0`. */
function monthStart(index: number): number {
  const date = new Date(0);
  date.setUTCFullYear(Math.floor(index / 12), ((index % 12) + 12) % 12, 1);
  return date.getTime();
}

function ticksAt(low: number, high: number, step: TimeStep): number[] {
  const ticks: number[] = [];
  if (step.months === 0) {
    const anchor = step.name === "week" ? WEEKDAY_SHIFT * DAY : 0;
    const first = Math.floor((low - anchor + step.millis - 1) / step.millis) * step.millis + anchor;
    for (let t = first; t <= high; t += step.millis) ticks.push(t);
    return ticks;
  }
  const date = new Date(low);
  let index = date.getUTCFullYear() * 12 + date.getUTCMonth();
  // Quarters, years and multiples of them start on a multiple of the step: Jan Apr Jul Oct, then 2020 2025 2030.
  if (step.months > 1) index = Math.floor(index / step.months) * step.months;
  for (let t = monthStart(index); t <= high; index += step.months, t = monthStart(index))
    if (t >= low) ticks.push(t);
  return ticks;
}

// A lower bound of how many ticks a step makes (the range over the longest the step can be) rules it out before its list
// is built: over years, minutes alone would be millions of ticks.
function fits(low: number, high: number, step: TimeStep, max: number): boolean {
  const longest = step.months === 0 ? step.millis : step.months * 31 * DAY;
  return (high - low) / longest <= max && ticksAt(low, high, step).length <= max;
}

/**
 * Ticks for `start`..`end` (epoch milliseconds) at the finest calendar step that gives no more than `maxTicks`, as local
 * times at `offsetMinutes` from UTC; the values are still epoch milliseconds.
 */
export function timeTicks(
  start: number,
  end: number,
  maxTicks: number,
  offsetMinutes = 0,
): TimeTicks {
  if (maxTicks < 2) throw new RangeError("A time axis needs at least 2 ticks");
  const offset = offsetMinutes * MINUTE;
  const low = Math.min(start, end) + offset;
  const high = Math.max(start, end) + offset;
  const step =
    TIME_STEPS.find((s) => fits(low, high, s, maxTicks)) ?? TIME_STEPS[TIME_STEPS.length - 1]!;
  return { ticks: ticksAt(low, high, step).map((t) => t - offset), step };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const two = (n: number): string => String(n).padStart(2, "0");

/** A tick's label for its step: a time of day, a short date, a month (with the year in January) or a year. */
export function formatChartTime(epochMillis: number, step: TimeStep, offsetMinutes = 0): string {
  const local = new Date(epochMillis + offsetMinutes * MINUTE);
  if (step.months === 0)
    return step.millis < DAY
      ? `${two(local.getUTCHours())}:${two(local.getUTCMinutes())}`
      : `${MONTHS[local.getUTCMonth()]} ${local.getUTCDate()}`;
  const month = local.getUTCMonth();
  return step.months >= 12 || month === 0 ? String(local.getUTCFullYear()) : MONTHS[month]!;
}

/** The times when they place `count` categories: one per category, strictly ascending; else `null`. */
export function validTimes(
  times: readonly number[] | null,
  count: number,
): readonly number[] | null {
  if (times === null || times.length !== count || count < 2) return null;
  return times.every((t, i) => i === 0 || t > times[i - 1]!) ? times : null;
}
