import type { PageItem } from "../skin/types.ts";

/**
 * The items of a numbered pagination: always the first and last page, the `siblings` pages around the current one, and a
 * gap where pages are folded. Once there are more pages than fit, the length is fixed at `2 * siblings + 5` so the items
 * do not shift as the page changes (the first, the last, the current with its siblings, and two gaps). Pure.
 */
export function pageItems(pageCount: number, page: number, siblings = 1): PageItem[] {
  const total = Math.max(Math.floor(pageCount), 0);
  const s = Math.max(Math.floor(siblings), 0);
  const current = Math.min(Math.max(Math.floor(page), 0), Math.max(total - 1, 0));
  const length = 2 * s + 5;
  const pages = (from: number, to: number): PageItem[] =>
    Array.from({ length: Math.max(to - from + 1, 0) }, (_, i) => ({
      kind: "page",
      index: from + i,
    }));
  if (total <= length) return pages(0, total - 1);
  const last = total - 1;
  const run = 2 * s + 3; // the pages shown beside one gap, at an end
  if (current <= s + 2)
    return [...pages(0, run - 1), { kind: "gap", key: "end" }, ...pages(last, last)];
  if (current >= last - (s + 2))
    return [...pages(0, 0), { kind: "gap", key: "start" }, ...pages(last - run + 1, last)];
  return [
    ...pages(0, 0),
    { kind: "gap", key: "start" },
    ...pages(current - s, current + s),
    { kind: "gap", key: "end" },
    ...pages(last, last),
  ];
}
