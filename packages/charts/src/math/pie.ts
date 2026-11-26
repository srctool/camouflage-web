// Pie geometry and text. Pure. Angles are degrees clockwise from 3 o'clock, so -90 is the top.

/** The angle of 12 o'clock: slices start there by default. */
export const PIE_TOP = -90;

/** A slice of a pie: its label, value and optional color. A negative value counts as zero. */
export interface PieSlice {
  label: string;
  value: number;
  color?: string;
}

export interface SliceAngle {
  start: number;
  sweep: number;
}

/** The start and sweep of each value, clockwise from `startAngle`. A total of zero gives zero sweeps. */
export function sliceAngles(values: readonly number[], startAngle: number): SliceAngle[] {
  const total = values.reduce((sum, v) => sum + Math.max(0, v), 0);
  let start = startAngle;
  return values.map((v) => {
    const sweep = total <= 0 ? 0 : (Math.max(0, v) / total) * 360;
    const angle = { start, sweep };
    start += sweep;
    return angle;
  });
}

/** The index of the slice at `(dx, dy)` from the center, between the radii; `null` when none. */
export function sliceAt(
  dx: number,
  dy: number,
  outer: number,
  inner: number,
  angles: readonly SliceAngle[],
): number | null {
  const radius = Math.hypot(dx, dy);
  if (radius < inner || radius > outer) return null;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const index = angles.findIndex(({ start, sweep }) => {
    const relative = (((angle - start) % 360) + 360) % 360;
    return sweep > 0 && relative < sweep;
  });
  return index < 0 ? null : index;
}

/** The point at `radius` from `(cx, cy)` in direction `angle` degrees. */
export function polar(
  cx: number,
  cy: number,
  radius: number,
  angle: number,
): { x: number; y: number } {
  const radians = (angle * Math.PI) / 180;
  return { x: cx + Math.cos(radians) * radius, y: cy + Math.sin(radians) * radius };
}

const number = (n: number): string => String(Math.round(n * 100) / 100);

/** SVG path data for a sector, or a ring sector when `inner` is above zero. A full turn is drawn as two halves. */
export function sectorPath(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  start: number,
  sweep: number,
): string {
  const point = (r: number, a: number): string => {
    const p = polar(cx, cy, r, a);
    return `${number(p.x)} ${number(p.y)}`;
  };
  const arc = (r: number, from: number, to: number): string =>
    `A${number(r)} ${number(r)} 0 ${Math.abs(to - from) > 180 ? 1 : 0} ${to > from ? 1 : 0} ${point(r, to)}`;
  if (sweep >= 359.99) {
    const ring = (r: number, direction: 1 | -1): string =>
      `M${point(r, start)}${arc(r, start, start + 180 * direction)}${arc(r, start + 180 * direction, start + 360 * direction)}Z`;
    return inner > 0 ? ring(outer, 1) + ring(inner, -1) : ring(outer, 1);
  }
  const end = start + sweep;
  return inner > 0
    ? `M${point(outer, start)}${arc(outer, start, end)}L${point(inner, end)}${arc(inner, end, start)}Z`
    : `M${number(cx)} ${number(cy)}L${point(outer, start)}${arc(outer, start, end)}Z`;
}

/** A share as a person reads it: "45%", or "<1%" for a sliver. */
export function shareText(share: number): string {
  const percent = share * 100;
  return percent > 0 && percent < 1 ? "<1%" : `${Math.round(percent)}%`;
}

/** The screen reader text of a pie: "Pie chart, 4 slices, largest: Search 45%". */
export function pieSummary(kind: string, slices: readonly PieSlice[]): string {
  const head = `${kind}, ${slices.length} ${slices.length === 1 ? "slice" : "slices"}`;
  const total = slices.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  let largest: PieSlice | undefined;
  for (const s of slices) if (largest === undefined || s.value > largest.value) largest = s;
  if (largest === undefined || total <= 0) return head;
  return `${head}, largest: ${largest.label} ${shareText(Math.max(0, largest.value) / total)}`;
}
