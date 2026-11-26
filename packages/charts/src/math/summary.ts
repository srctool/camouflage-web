// The data model of a cartesian chart and its screen reader text. Pure.
import { sparklineSummary } from "./spark.ts";

/** One data series: a name for the legend, one value per category (`null` is a gap) and an optional color. */
export interface ChartSeries {
  name: string;
  values: readonly (number | null)[];
  color?: string;
}

/** "Line chart, 2 series, 12 categories", then each series' trend ("Sales: from 3 to 9, up 200%"). */
export function chartSummary(
  kind: string,
  categories: readonly string[],
  series: readonly ChartSeries[],
): string {
  const noun = categories.length === 1 ? "category" : "categories";
  const head = `${kind}, ${series.length} series, ${categories.length} ${noun}`;
  if (series.length === 0) return head;
  return `${head}. ${series.map((s) => sparklineSummary(s.values, s.name)).join("; ")}`;
}

/** True when there is nothing to draw: no categories, or every value is a gap. */
export function noChartData(
  categories: readonly string[],
  series: readonly ChartSeries[],
): boolean {
  return categories.length === 0 || series.every((s) => s.values.every((v) => v === null));
}

export type WalkKey = "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown" | "Home" | "End";

/**
 * Where a key moves the keyboard walk over `(category, series)`: Left and Right along the categories, Up and Down between
 * series, Home and End to the ends. `linear` (a pie) makes Down act as Right and Up as Left. `null` for other keys.
 */
export function walkTarget(
  key: string,
  at: readonly [number, number],
  categories: number,
  series: number,
  linear = false,
): [number, number] | null {
  if (categories === 0 || series === 0) return null;
  const [category, current] = at;
  const k = linear
    ? key === "ArrowDown"
      ? "ArrowRight"
      : key === "ArrowUp"
        ? "ArrowLeft"
        : key
    : key;
  switch (k) {
    case "ArrowRight":
      return [Math.min(category + 1, categories - 1), current];
    case "ArrowLeft":
      return [Math.max(category - 1, 0), current];
    case "ArrowDown":
      return [category, Math.min(current + 1, series - 1)];
    case "ArrowUp":
      return [category, Math.max(current - 1, 0)];
    case "Home":
      return [0, current];
    case "End":
      return [categories - 1, current];
    default:
      return null;
  }
}
