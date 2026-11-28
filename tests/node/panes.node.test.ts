// The W9 layout rules, with no window: the split pane's shares and the scrollbar's geometry.
import {
  collapsePane,
  normalizeSizes,
  offsetOfThumb,
  pageFor,
  resizeSizes,
  restorePane,
  thumbOf,
} from "@srctool/camouflage-core";
import type { PaneLimits } from "@srctool/camouflage-core";
import { describe, expect, it } from "vitest";

const free: PaneLimits = { min: 0.1, max: 1, collapsible: false };
const sum = (sizes: number[]): number => sizes.reduce((a, b) => a + b, 0);
const close = (actual: number[], expected: number[]): void => {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((value, i) => expect(value).toBeCloseTo(expected[i]!, 6));
};

describe("a split's shares", () => {
  it("sum to 1, and bad ones count as equal", () => {
    close(normalizeSizes([2, 2]), [0.5, 0.5]);
    close(normalizeSizes([1, Number.NaN]), [2 / 3, 1 / 3]);
    close(normalizeSizes([0, 0]), [0.5, 0.5]);
    expect(normalizeSizes([])).toEqual([]);
  });

  it("move between a divider's two neighbours only", () => {
    const next = resizeSizes([0.3, 0.4, 0.3], [free, free, free], 0, 0.1);
    close(next, [0.4, 0.3, 0.3]);
    expect(sum(next)).toBeCloseTo(1);
  });

  it("stop at either neighbour's minimum and maximum", () => {
    close(resizeSizes([0.5, 0.5], [free, free], 0, -0.9), [0.1, 0.9]);
    close(resizeSizes([0.5, 0.5], [free, free], 0, 0.9), [0.9, 0.1]);
    close(resizeSizes([0.5, 0.5], [{ ...free, max: 0.6 }, free], 0, 0.4), [0.6, 0.4]);
    close(resizeSizes([0.5, 0.5], [free, { ...free, max: 0.7 }], 0, -0.4), [0.3, 0.7]);
  });

  it("snap a collapsible pane shut below half its minimum, on either side", () => {
    const shut = { ...free, min: 0.2, collapsible: true };
    close(resizeSizes([0.5, 0.5], [shut, free], 0, -0.45), [0, 1]);
    close(resizeSizes([0.5, 0.5], [shut, free], 0, -0.35), [0.2, 0.8]);
    close(resizeSizes([0.5, 0.5], [free, shut], 0, 0.45), [1, 0]);
  });

  it("give way together when the minimums cannot both hold", () => {
    const big = { ...free, min: 0.8 };
    close(resizeSizes([0.5, 0.5], [big, big], 0, 0.2), [0.5, 0.5]);
  });

  it("collapse into the next pane, the last into the one before, and restore", () => {
    close(collapsePane([0.2, 0.3, 0.5], 0), [0, 0.5, 0.5]);
    close(collapsePane([0.2, 0.3, 0.5], 2), [0.2, 0.8, 0]);
    close(restorePane([0, 0.5, 0.5], 0, 0.2), [0.2, 0.3, 0.5]);
    close(restorePane([0, 0.5, 0.5], 0, 0.9), [0.5, 0, 0.5]);
  });
});

describe("a scrollbar's geometry", () => {
  it("sizes the thumb by the share in view, with a shortest thumb", () => {
    expect(thumbOf(100, 400, 0, 100, 10)).toEqual({ start: 0, length: 25 });
    expect(thumbOf(100, 400, 300, 100, 10)).toEqual({ start: 75, length: 25 });
    expect(thumbOf(100, 10_000, 9900, 100, 32)).toEqual({ start: 68, length: 32 });
  });

  it("draws none when everything is in view", () => {
    expect(thumbOf(100, 100, 0, 100, 32)).toBeNull();
    expect(thumbOf(100, 80, 0, 100, 32)).toBeNull();
    expect(thumbOf(0, 400, 0, 0, 32)).toBeNull();
  });

  it("maps a dragged thumb back to an offset, within the content", () => {
    expect(offsetOfThumb(75, 100, 400, 100, 25)).toBe(300);
    expect(offsetOfThumb(-10, 100, 400, 100, 25)).toBe(0);
    expect(offsetOfThumb(200, 100, 400, 100, 25)).toBe(300);
    expect(offsetOfThumb(0, 100, 400, 20, 32)).toBe(0);
  });

  it("pages towards a press on the track", () => {
    const thumb = { start: 40, length: 20 };
    expect(pageFor(10, thumb, 100, 160)).toBe(60);
    expect(pageFor(90, thumb, 100, 160)).toBe(260);
    expect(pageFor(50, thumb, 100, 160)).toBe(160);
  });
});
