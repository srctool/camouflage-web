// Bar geometry. Pure. A bar is placed with percentages and pixels apart, so CSS `calc` gives the exact box at any width
// and a server can draw it: along the category axis `start = startPercent% + startPixels px` (the same for the size);
// along the value axis it covers the fractions `from`..`to` of the plot.
import { fraction } from "./scale.ts";
import type { ValueDomain } from "./scale.ts";

export type BarOrientation = "vertical" | "horizontal";
export type BarMode = "grouped" | "stacked";

export interface BarRect {
  category: number;
  series: number;
  value: number;
  startPercent: number;
  startPixels: number;
  sizePercent: number;
  sizePixels: number;
  from: number;
  to: number;
  /** The free end, which gets the radius: `"end"` away from zero upward (or toward the inline end), `"start"` the other way; `null` inside a stack. */
  free: "start" | "end" | null;
}

/**
 * The bars of a chart: one list of values per visible series, one value per category, against `domain`. Grouped bars sit
 * side by side, `barGap` pixels apart; stacked bars pile positives up and negatives down, separately. `groupGap` is the
 * space between groups as a share of a group.
 */
export function barRects(
  categories: number,
  series: readonly (readonly (number | null)[])[],
  mode: BarMode,
  domain: ValueDomain,
  barGap: number,
  groupGap: number,
): BarRect[] {
  if (categories === 0 || series.length === 0) return [];
  const band = 100 / categories;
  const group = band / (1 + groupGap);
  const zero = fraction(domain, Math.min(Math.max(0, domain.low), domain.high));
  const groupStart = (c: number): number => c * band + (band - group) / 2;
  const bars: BarRect[] = [];
  for (let c = 0; c < categories; c++) {
    if (mode === "grouped") {
      const k = series.length;
      series.forEach((values, s) => {
        const value = values[c];
        if (value === null || value === undefined) return;
        const at = fraction(domain, value);
        bars.push({
          category: c,
          series: s,
          value,
          startPercent: groupStart(c) + (s * group) / k,
          // Each bar is (group - (k-1) gaps) / k wide, so bar s starts s widths and s gaps in.
          startPixels: s * barGap - (s * (k - 1) * barGap) / k,
          sizePercent: group / k,
          sizePixels: -((k - 1) * barGap) / k,
          from: Math.min(zero, at),
          to: Math.max(zero, at),
          free: value >= 0 ? "end" : "start",
        });
      });
      continue;
    }
    const present = series.flatMap((values, s) => {
      const value = values[c];
      return value === null || value === undefined ? [] : [{ s, value }];
    });
    const lastUp = present.filter((p) => p.value >= 0).pop()?.s;
    const lastDown = present.filter((p) => p.value < 0).pop()?.s;
    let up = zero;
    let down = zero;
    for (const { s, value } of present) {
      const size = fraction(domain, value) - zero;
      const from = value >= 0 ? up : down;
      const to = from + size;
      if (value >= 0) up = to;
      else down = to;
      bars.push({
        category: c,
        series: s,
        value,
        startPercent: groupStart(c),
        startPixels: 0,
        sizePercent: group,
        sizePixels: 0,
        from: Math.min(from, to),
        to: Math.max(from, to),
        free: s === (value >= 0 ? lastUp : lastDown) ? (value >= 0 ? "end" : "start") : null,
      });
    }
  }
  return bars;
}

/**
 * The bar the pointer is at, for a plot `across` pixels long on the category axis and `along` on the value axis: the one
 * whose column (row) is nearest across the category axis, and among those the nearest along the value axis. `point` is
 * measured from the start of the category axis and from the low end of the value axis.
 */
export function nearestBar(
  bars: readonly BarRect[],
  point: { across: number; along: number },
  across: number,
  along: number,
): BarRect | null {
  const gap = (low: number, high: number, at: number): number => Math.max(low - at, 0, at - high);
  let best: BarRect | null = null;
  let bestKey: [number, number] = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  for (const bar of bars) {
    const start = (bar.startPercent / 100) * across + bar.startPixels;
    const size = (bar.sizePercent / 100) * across + bar.sizePixels;
    const key: [number, number] = [
      gap(start, start + size, point.across),
      gap(bar.from * along, bar.to * along, point.along),
    ];
    if (key[0] < bestKey[0] || (key[0] === bestKey[0] && key[1] < bestKey[1])) {
      best = bar;
      bestKey = key;
    }
  }
  return best;
}
