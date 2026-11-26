// The sparkline's text and geometry. Pure.
import { formatChartNumber } from "./scale.ts";

/** A point in the unit square: `x` from the start edge, `y` from the bottom. */
export interface Point {
  x: number;
  y: number;
}

/** The data's own extent; bars always include zero so they grow from a baseline. */
export function dataRange(
  values: readonly (number | null)[],
  includeZero = false,
): { low: number; high: number } {
  const present = values.filter((v): v is number => v !== null);
  if (present.length === 0) return { low: 0, high: 1 };
  let low = Math.min(...present);
  let high = Math.max(...present);
  if (includeZero) {
    low = Math.min(low, 0);
    high = Math.max(high, 0);
  }
  return { low, high };
}

function changeText(first: number, last: number): string {
  if (last === first) return "flat";
  const direction = last > first ? "up" : "down";
  return first === 0
    ? `${direction} by ${formatChartNumber(Math.abs(last - first))}`
    : `${direction} ${Math.round((Math.abs(last - first) / Math.abs(first)) * 100)}%`;
}

/** The text a screen reader gets for a sparkline: "Trend from 3 to 9, up 200%", led by `description` when given. */
export function sparklineSummary(
  values: readonly (number | null)[],
  description: string | null = null,
): string {
  const present = values.filter((v): v is number => v !== null);
  const first = present[0];
  const last = present[present.length - 1];
  const body =
    first === undefined || last === undefined
      ? "no data"
      : present.length === 1
        ? `at ${formatChartNumber(first)}`
        : `from ${formatChartNumber(first)} to ${formatChartNumber(last)}, ${changeText(first, last)}`;
  return description === null || description === "" ? `Trend ${body}` : `${description}: ${body}`;
}

/**
 * Reduces `values` to about `buckets` columns, keeping each column's lowest and highest value (in their original order)
 * so a peak survives; a column of only gaps stays a gap.
 */
export function downsample(values: readonly (number | null)[], buckets: number): (number | null)[] {
  if (values.length <= buckets * 2) return [...values];
  const result: (number | null)[] = [];
  for (let b = 0; b < buckets; b++) {
    const from = Math.floor((b * values.length) / buckets);
    const to = Math.floor(((b + 1) * values.length) / buckets);
    let low = -1;
    let high = -1;
    for (let i = from; i < to; i++) {
      const v = values[i];
      if (v === null || v === undefined) continue;
      if (low < 0 || v < values[low]!) low = i;
      if (high < 0 || v > values[high]!) high = i;
    }
    if (low < 0) result.push(null);
    else for (const i of [...new Set([low, high])].sort((a, b2) => a - b2)) result.push(values[i]!);
  }
  return result;
}

/** Each value in the unit square; `null` stays a gap. One value sits in the middle; an empty range is a middle line. */
export function sparklinePoints(
  values: readonly (number | null)[],
  range: { low: number; high: number },
): (Point | null)[] {
  const span = range.high - range.low;
  return values.map((v, i) =>
    v === null
      ? null
      : {
          x: values.length === 1 ? 0.5 : i / (values.length - 1),
          y: span === 0 ? 0.5 : (v - range.low) / span,
        },
  );
}

/** The highest and the lowest point (one when they are the same). */
export function extremes(points: readonly (Point | null)[]): Point[] {
  const present = points.filter((p): p is Point => p !== null);
  if (present.length === 0) return [];
  let high = present[0]!;
  let low = present[0]!;
  for (const p of present) {
    if (p.y > high.y) high = p;
    if (p.y < low.y) low = p;
  }
  return high === low ? [high] : [high, low];
}
