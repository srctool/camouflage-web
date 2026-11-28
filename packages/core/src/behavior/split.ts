// The split pane's layout rules as pure functions (base CamoSplitPane note, 4): no window, no element.

/** What a pane may be, as shares of the container. */
export interface PaneLimits {
  min: number;
  max: number;
  collapsible: boolean;
}

/** The sizes made to sum to 1, with anything that is not a positive number counted as an equal share. */
export function normalizeSizes(sizes: readonly number[]): number[] {
  if (sizes.length === 0) return [];
  const clean = sizes.map((s) => (Number.isFinite(s) && s >= 0 ? s : 1 / sizes.length));
  const total = clean.reduce((a, b) => a + b, 0);
  return total <= 0 ? clean.map(() => 1 / sizes.length) : clean.map((s) => s / total);
}

/**
 * Moves the divider after pane `divider` by `delta` (a share of the container): space moves between its two neighbours
 * only, within both neighbours' limits. A collapsible neighbour taken below half its minimum snaps shut.
 */
export function resizeSizes(
  sizes: readonly number[],
  limits: readonly PaneLimits[],
  divider: number,
  delta: number,
): number[] {
  const next = [...sizes];
  const [a, b] = [limits[divider], limits[divider + 1]];
  if (a === undefined || b === undefined) return next;
  const pair = next[divider]! + next[divider + 1]!;
  const wanted = next[divider]! + delta;
  const rest = pair - wanted;
  if (a.collapsible && wanted < a.min / 2) return give(next, divider, 0, pair);
  if (b.collapsible && rest < b.min / 2) return give(next, divider, pair, pair);
  // Both neighbours' limits, as bounds on the first one. When they cannot both hold, the minimums give way together.
  const low = Math.max(a.min, pair - b.max);
  const high = Math.min(a.max, pair - b.min);
  const size =
    low > high ? (pair * a.min) / (a.min + b.min || 1) : Math.min(Math.max(wanted, low), high);
  return give(next, divider, size, pair);
}

function give(sizes: number[], divider: number, first: number, pair: number): number[] {
  sizes[divider] = first;
  sizes[divider + 1] = pair - first;
  return sizes;
}

/** The pane next to `pane` that takes or gives its space: the one after, or before for the last. */
function neighbour(count: number, pane: number): number {
  return pane === count - 1 ? pane - 1 : pane + 1;
}

/** Shuts a pane; its space goes to its neighbour. */
export function collapsePane(sizes: readonly number[], pane: number): number[] {
  const next = [...sizes];
  const other = neighbour(next.length, pane);
  if (other < 0 || next[pane] === undefined) return next;
  next[other] = next[other]! + next[pane]!;
  next[pane] = 0;
  return next;
}

/** Opens a shut pane to `size` (what it had), taken from its neighbour. */
export function restorePane(sizes: readonly number[], pane: number, size: number): number[] {
  const next = [...sizes];
  const other = neighbour(next.length, pane);
  if (other < 0 || next[pane] === undefined) return next;
  const taken = Math.min(size, next[other]! + next[pane]!);
  next[other] = next[other]! + next[pane]! - taken;
  next[pane] = taken;
  return next;
}
