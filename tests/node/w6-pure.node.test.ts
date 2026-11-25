import {
  fitCount,
  flattenTree,
  pageItems,
  placePanel,
  planBreadcrumb,
  ratingAt,
  snapRating,
} from "@srctool/camouflage-core";
import type { CamoTreeNode } from "@srctool/camouflage-core";
import { describe, expect, it } from "vitest";

const room = { width: 800, height: 600 };

describe("placePanel", () => {
  const panel = { width: 200, height: 100 };
  it("opens below the anchor, centered on it, and points the arrow at its center", () => {
    const anchor = { left: 300, top: 100, width: 80, height: 40 };
    const p = placePanel(anchor, panel, room, "auto", { rtl: false, gap: 8 });
    expect(p).toMatchObject({ side: "bottom", left: 240, top: 148 });
    expect(p.arrowOffset).toBe(100); // the anchor's center (340) minus the panel's left (240)
  });

  it("flips above when there is no room below, and back below when there is none above", () => {
    const low = { left: 300, top: 540, width: 80, height: 40 };
    expect(placePanel(low, panel, room, "auto", { rtl: false, gap: 8 })).toMatchObject({
      side: "top",
      top: 432,
    });
    const tall = { width: 200, height: 580 };
    expect(placePanel(low, tall, room, "top", { rtl: false, gap: 8 }).side).toBe("bottom");
  });

  it("keeps the panel inside the window, with the arrow still on the anchor's center", () => {
    const edge = { left: 10, top: 100, width: 40, height: 40 };
    const p = placePanel(edge, panel, room, "bottom", { rtl: false, gap: 8 });
    expect(p.left).toBe(4);
    expect(p.arrowOffset).toBe(26);
    const right = { left: 770, top: 100, width: 20, height: 40 };
    expect(placePanel(right, panel, room, "bottom", { rtl: false, gap: 8 }).left).toBe(596);
  });

  it("puts a side placement beside the anchor, as a physical side that follows the writing direction, and flips to the other side", () => {
    const anchor = { left: 400, top: 200, width: 80, height: 40 };
    expect(placePanel(anchor, panel, room, "end", { rtl: false, gap: 8 })).toMatchObject({
      side: "right",
      left: 488,
      top: 170,
    });
    expect(placePanel(anchor, panel, room, "start", { rtl: false, gap: 8 })).toMatchObject({
      side: "left",
      left: 192,
    });
    // In right-to-left, `start` is the right.
    expect(placePanel(anchor, panel, room, "start", { rtl: true, gap: 8 })).toMatchObject({
      side: "right",
      left: 488,
    });
    const near = { left: 700, top: 200, width: 80, height: 40 };
    expect(placePanel(near, panel, room, "end", { rtl: false, gap: 8 }).side).toBe("left");
    expect(
      placePanel(near, { width: 700, height: 100 }, room, "end", { rtl: false, gap: 8 }).side,
    ).toBe("bottom");
  });

  it("is clamped, not hidden, when there is room on no side", () => {
    const p = placePanel({ left: 0, top: 0, width: 800, height: 600 }, panel, room, "auto", {
      rtl: false,
      gap: 8,
    });
    expect(p.left).toBeGreaterThanOrEqual(4);
    expect(p.top).toBeGreaterThanOrEqual(4);
  });
});

describe("fitCount", () => {
  it("fits everything when it fits with no overflow button", () => {
    expect(fitCount(300, 48, 6, 48)).toBe(6);
  });
  it("makes room for the overflow button, and can fit none", () => {
    expect(fitCount(200, 48, 6, 48)).toBe(3);
    expect(fitCount(40, 48, 6, 48)).toBe(0);
    expect(fitCount(100, 48, 0, 48)).toBe(0);
  });
});

describe("planBreadcrumb", () => {
  const options = { separator: 20, overflow: 40 };
  it("shows everything when it fits and is within maxVisible", () => {
    expect(planBreadcrumb([50, 60, 70], 500, options)).toEqual({ shown: [0, 1, 2], folded: [] });
    expect(planBreadcrumb([50, 60, 70, 80], 500, { ...options, maxVisible: 3 })).toEqual({
      shown: [0, 2, 3],
      folded: [1],
    });
  });
  it("folds the middle, keeping the first and as many of the last as fit", () => {
    const widths = [50, 100, 100, 100, 60];
    const plan = planBreadcrumb(widths, 260, options);
    expect(plan.shown[0]).toBe(0);
    expect(plan.shown.at(-1)).toBe(4);
    expect(plan.folded).toEqual(plan.shown.length === 2 ? [1, 2, 3] : [1, 2]);
    expect([...plan.shown, ...plan.folded].sort()).toEqual([0, 1, 2, 3, 4]);
  });
  it("never folds a breadcrumb of two or fewer", () => {
    expect(planBreadcrumb([300, 300], 100, options)).toEqual({ shown: [0, 1], folded: [] });
  });
});

describe("pageItems", () => {
  const show = (n: number, page: number, siblings = 1): string =>
    pageItems(n, page, siblings)
      .map((i) => (i.kind === "page" ? String(i.index + 1) : "…"))
      .join(" ");
  it("lists every page while they fit", () => {
    expect(show(5, 2)).toBe("1 2 3 4 5");
    expect(show(7, 0)).toBe("1 2 3 4 5 6 7");
  });
  it("keeps the first and last page, the siblings and a gap, at a fixed length", () => {
    expect(show(20, 0)).toBe("1 2 3 4 5 … 20");
    expect(show(20, 10)).toBe("1 … 10 11 12 … 20");
    expect(show(20, 19)).toBe("1 … 16 17 18 19 20");
    for (let page = 0; page < 20; page++) expect(pageItems(20, page).length).toBe(7);
  });
  it("takes more siblings, clamps the page, and handles none", () => {
    expect(show(30, 15, 2)).toBe("1 … 14 15 16 17 18 … 30");
    expect(show(20, 99)).toBe("1 … 16 17 18 19 20");
    expect(pageItems(0, 0)).toEqual([]);
  });
});

describe("flattenTree", () => {
  const roots: CamoTreeNode[] = [
    {
      key: "docs",
      label: "Documents",
      children: [
        { key: "a", label: "A", children: null },
        { key: "sub", label: "Sub", children: [{ key: "b", label: "B" }] },
      ],
    },
    { key: "lazy", label: "Lazy", hasChildren: true },
    { key: "leaf", label: "Leaf" },
  ];
  const keys = (expanded: string[]): string[] =>
    flattenTree(roots, new Set(expanded)).map((r) => `${r.level}:${r.node.key}`);
  it("shows the roots, and the children of each expanded node, with levels", () => {
    expect(keys([])).toEqual(["1:docs", "1:lazy", "1:leaf"]);
    expect(keys(["docs"])).toEqual(["1:docs", "2:a", "2:sub", "1:lazy", "1:leaf"]);
    expect(keys(["docs", "sub"])).toEqual(["1:docs", "2:a", "2:sub", "3:b", "1:lazy", "1:leaf"]);
  });
  it("ignores stale keys and the expansion of a leaf, and knows what is expandable", () => {
    expect(keys(["gone", "leaf"])).toEqual(["1:docs", "1:lazy", "1:leaf"]);
    const rows = flattenTree(roots, new Set(["lazy"]));
    expect(rows.map((r) => r.expandable)).toEqual([true, true, false]);
    expect(rows[1]!.expanded).toBe(true); // an unloaded node is open; it has no children to show yet
  });
  it("gives each row its place among its siblings and its parent", () => {
    const rows = flattenTree(roots, new Set(["docs"]));
    expect(rows[2]).toMatchObject({ index: 1, size: 2, parent: "docs" });
    expect(rows[0]).toMatchObject({ index: 0, size: 3, parent: null });
  });
});

describe("rating values", () => {
  it("maps the point on the row to a value, rounding up to the step", () => {
    expect(ratingAt(0.5, 5, "whole")).toBe(3);
    expect(ratingAt(0.45, 5, "whole")).toBe(3);
    expect(ratingAt(0.45, 5, "half")).toBe(2.5);
    expect(ratingAt(0.3, 5, "half")).toBe(1.5);
  });
  it("never goes below one step or above the maximum", () => {
    expect(ratingAt(0, 5, "whole")).toBe(1);
    expect(ratingAt(0, 5, "half")).toBe(0.5);
    expect(ratingAt(2, 5, "whole")).toBe(5);
    expect(ratingAt(-1, 5, "half")).toBe(0.5);
  });
  it("snaps a value to the step, inside the range", () => {
    expect(snapRating(3.4, 5, "whole")).toBe(3);
    expect(snapRating(3.3, 5, "half")).toBe(3.5);
    expect(snapRating(9, 5, "half")).toBe(5);
    expect(snapRating(-2, 5, "whole")).toBe(0);
  });
});
