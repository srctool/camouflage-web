// Line and area geometry: stacking, gaps, curves and nearest-point. Pure. Curves are affine-invariant, so they may be
// built in any linear coordinate space and stretched afterwards.
import type { Point } from "./spark.ts";

export type LineKind = "line" | "area" | "stacked-area";
export type LineCurve = "linear" | "smooth" | "catmull-rom" | "step";
export type MarkerVisibility = "always" | "on-hover" | "never";

/** One series' band in a stack: from `base` up to `top`. */
export interface StackBand {
  base: number;
  top: number;
}

/**
 * Stacks series (one list of values per series, one value per category) in order. A `null` leaves a gap in that series; a
 * negative value adds nothing (stacked areas treat negatives as zero).
 */
export function stack(series: readonly (readonly (number | null)[])[]): (StackBand | null)[][] {
  const categories = Math.max(0, ...series.map((s) => s.length));
  const running = new Array<number>(categories).fill(0);
  return series.map((values) =>
    Array.from({ length: categories }, (_, c) => {
      const value = values[c];
      if (value === null || value === undefined) return null;
      const base = running[c]!;
      const top = base + Math.max(0, value);
      running[c] = top;
      return { base, top };
    }),
  );
}

/** The index of the entry of `positions` nearest to `x`, or `null` for an empty list. */
export function nearestIndex(positions: readonly number[], x: number): number | null {
  let best: number | null = null;
  positions.forEach((p, i) => {
    if (best === null || Math.abs(p - x) < Math.abs(positions[best]! - x)) best = i;
  });
  return best;
}

/** The runs of indexes between gaps, as `[first, last]`. */
export function gapRuns(points: readonly (Point | null)[]): [number, number][] {
  const runs: [number, number][] = [];
  let start = -1;
  points.forEach((p, i) => {
    if (p === null) {
      if (start >= 0) runs.push([start, i - 1]);
      start = -1;
    } else if (start < 0) start = i;
  });
  if (start >= 0) runs.push([start, points.length - 1]);
  return runs;
}

/** One cubic piece of a smoothed line: two control points and where it ends. */
export interface Cubic {
  c1: Point;
  c2: Point;
  end: Point;
}

function catmullRom(points: readonly Point[]): Cubic[] {
  return points.slice(0, -1).map((from, i) => {
    const before = points[Math.max(0, i - 1)]!;
    const to = points[i + 1]!;
    const after = points[Math.min(points.length - 1, i + 2)]!;
    return {
      c1: { x: from.x + (to.x - before.x) / 6, y: from.y + (to.y - before.y) / 6 },
      c2: { x: to.x - (after.x - from.x) / 6, y: to.y - (after.y - from.y) / 6 },
      end: to,
    };
  });
}

// Fritsch-Carlson: tangents are limited so the curve between two points stays between their values.
function monotone(points: readonly Point[]): Cubic[] {
  const n = points.length;
  const width = points.slice(0, -1).map((p, i) => points[i + 1]!.x - p.x);
  const secant = width.map((w, i) => (w === 0 ? 0 : (points[i + 1]!.y - points[i]!.y) / w));
  const slope = points.map((_, i) =>
    i === 0
      ? secant[0]!
      : i === n - 1
        ? secant[n - 2]!
        : secant[i - 1]! * secant[i]! <= 0
          ? 0
          : (secant[i - 1]! + secant[i]!) / 2,
  );
  for (let i = 0; i < n - 1; i++) {
    if (secant[i] === 0) {
      slope[i] = 0;
      slope[i + 1] = 0;
      continue;
    }
    const a = slope[i]! / secant[i]!;
    const b = slope[i + 1]! / secant[i]!;
    const sum = a * a + b * b;
    if (sum > 9) {
      const scale = 3 / Math.sqrt(sum);
      slope[i] = scale * a * secant[i]!;
      slope[i + 1] = scale * b * secant[i]!;
    }
  }
  return points.slice(0, -1).map((from, i) => {
    const to = points[i + 1]!;
    const third = width[i]! / 3;
    return {
      c1: { x: from.x + third, y: from.y + slope[i]! * third },
      c2: { x: to.x - third, y: to.y - slope[i + 1]! * third },
      end: to,
    };
  });
}

/** The cubic pieces joining `points` (x strictly increasing) for a smoothed curve; none for the others. */
export function curvePieces(points: readonly Point[], curve: LineCurve): Cubic[] {
  if (points.length < 2) return [];
  if (curve === "smooth") return monotone(points);
  return curve === "catmull-rom" ? catmullRom(points) : [];
}

/** The points of a step line: each step goes along first, then across. */
export function stepPoints(points: readonly Point[]): Point[] {
  const result = points.slice(0, 1);
  for (let i = 1; i < points.length; i++)
    result.push({ x: points[i]!.x, y: points[i - 1]!.y }, points[i]!);
  return result;
}

const number = (n: number): string => String(Math.round(n * 100) / 100);
const at = (p: Point): string => `${number(p.x)} ${number(p.y)}`;

/**
 * SVG path data through `points` shaped by `curve`: it starts with `M`, or `L` to continue a path when `connect`.
 * `reverse` walks the same shape backwards, for the lower edge of an area.
 */
export function pathData(
  points: readonly Point[],
  curve: LineCurve,
  { connect = false, reverse = false }: { connect?: boolean; reverse?: boolean } = {},
): string {
  if (points.length === 0) return "";
  const move = (p: Point): string => `${connect ? "L" : "M"}${at(p)}`;
  if (curve === "smooth" || curve === "catmull-rom") {
    const pieces = curvePieces(points, curve);
    if (!reverse)
      return [move(points[0]!), ...pieces.map((p) => `C${at(p.c1)} ${at(p.c2)} ${at(p.end)}`)].join(
        "",
      );
    return [
      move(points[points.length - 1]!),
      ...pieces.map((p, i) => `C${at(p.c2)} ${at(p.c1)} ${at(points[i]!)}`).reverse(),
    ].join("");
  }
  const walk = curve === "step" ? stepPoints(points) : [...points];
  if (reverse) walk.reverse();
  return [move(walk[0]!), ...walk.slice(1).map((p) => `L${at(p)}`)].join("");
}
