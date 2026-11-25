/**
 * How many of `count` items of `itemWidth` fit in `available`, when the rest move into an overflow button of
 * `overflowWidth`: all of them when they fit with no button, else as many as fit beside the button. Pure.
 */
export function fitCount(
  available: number,
  itemWidth: number,
  count: number,
  overflowWidth: number,
): number {
  if (count <= 0 || itemWidth <= 0) return Math.max(count, 0);
  if (count * itemWidth <= available) return count;
  return Math.max(Math.floor((available - overflowWidth) / itemWidth), 0);
}

/**
 * Which breadcrumb items to show: everything when it fits (and within `maxVisible`), else the first item, the overflow
 * and as many of the last items as fit. Returns the indexes shown and the indexes folded away, in order. `widths` are the
 * items' natural widths, `separator` the space each item after the first also takes, `overflow` the button's.
 */
export function planBreadcrumb(
  widths: readonly number[],
  available: number,
  options: { maxVisible?: number | null; separator: number; overflow: number },
): { shown: number[]; folded: number[] } {
  const count = widths.length;
  const all = widths.map((_, i) => i);
  const total = (indexes: readonly number[]): number =>
    indexes.reduce((sum, i, n) => sum + (widths[i] ?? 0) + (n > 0 ? options.separator : 0), 0);
  const cap =
    options.maxVisible === null || options.maxVisible === undefined
      ? count
      : Math.max(options.maxVisible, 2);
  if (count <= cap && total(all) <= available) return { shown: all, folded: [] };
  if (count <= 2) return { shown: all, folded: [] };
  // The first item, the overflow button, then the last items that fit (at least the last one).
  let tail = Math.min(cap - 1, count - 1);
  const room = (n: number): number =>
    (widths[0] ?? 0) +
    options.separator +
    options.overflow +
    total(all.slice(count - n)) +
    options.separator;
  while (tail > 1 && room(tail) > available) tail--;
  const shown = [0, ...all.slice(count - tail)];
  return { shown, folded: all.slice(1, count - tail) };
}
