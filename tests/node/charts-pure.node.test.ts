import { createCamoTheme } from "@srctool/camouflage-core";
import {
  CamoCharts,
  TIME_STEPS,
  barDomain,
  barRects,
  chartSummary,
  curvePieces,
  downsample,
  formatChartNumber,
  formatChartTime,
  gapRuns,
  nearestBar,
  niceTicks,
  noChartData,
  pathData,
  pieSummary,
  resolveChartStyle,
  sectorPath,
  shareText,
  sliceAngles,
  sliceAt,
  sparklinePoints,
  sparklineSummary,
  stack,
  stepPoints,
  styleFromTokens,
  timeTicks,
  validTimes,
  valueDomain,
  walkTarget,
} from "@srctool/camouflage-charts";
import { minimalThemes } from "@srctool/camouflage-skin-minimal";
import { describe, expect, it } from "vitest";

describe("numbers and axes", () => {
  it("writes whole numbers plainly and the rest with one decimal", () => {
    expect([3, 3.25, -0.04, -2.5, 1000].map(formatChartNumber)).toEqual([
      "3",
      "3.3",
      "0",
      "-2.5",
      "1000",
    ]);
  });

  it("picks 1, 2 or 5 steps that cover the data, widening an empty range", () => {
    expect(niceTicks(3, 97)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(niceTicks(0, 1)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
    expect(niceTicks(5, 5).length).toBeGreaterThan(1);
    expect(() => niceTicks(0, 1, 1)).toThrow();
  });

  it("includes zero when asked, and honors fixed bounds", () => {
    expect(valueDomain(40, 90, true).low).toBe(0);
    expect(valueDomain(40, 90, false).low).toBeGreaterThan(0);
    expect(valueDomain(40, 90, false, { min: 10, max: 95 })).toMatchObject({ low: 10, high: 95 });
    expect(valueDomain(null, null, false)).toMatchObject({ low: 0, high: 1 });
  });
});

describe("sparklines", () => {
  it("says the trend, with the direction in words", () => {
    expect(sparklineSummary([3, 5, 9])).toBe("Trend from 3 to 9, up 200%");
    expect(sparklineSummary([9, 3], "Signups")).toBe("Signups: from 9 to 3, down 67%");
    expect(sparklineSummary([4, 8, 4])).toBe("Trend from 4 to 4, flat");
    expect(sparklineSummary([0, 5])).toBe("Trend from 0 to 5, up by 5");
    expect(sparklineSummary([7])).toBe("Trend at 7");
    expect(sparklineSummary([null])).toBe("Trend no data");
  });

  it("keeps peaks when it reduces, and puts values in the unit square", () => {
    const values = Array.from({ length: 1000 }, (_, i) => (i === 500 ? 99 : 1));
    const reduced = downsample(values, 10);
    expect(reduced.length).toBeLessThanOrEqual(20);
    expect(reduced).toContain(99);
    expect(downsample([1, 2, 3], 10)).toEqual([1, 2, 3]);
    expect(sparklinePoints([5], { low: 5, high: 5 })).toEqual([{ x: 0.5, y: 0.5 }]);
    expect(sparklinePoints([0, null, 10], { low: 0, high: 10 })).toEqual([
      { x: 0, y: 0 },
      null,
      { x: 1, y: 1 },
    ]);
  });
});

describe("lines", () => {
  const p = (x: number, y: number) => ({ x, y });

  it("stacks, leaving a gap in its own series and adding nothing for negatives", () => {
    const bands = stack([
      [1, null, 3],
      [2, 2, -5],
    ]);
    expect(bands[0]![1]).toBeNull();
    expect(bands[1]).toEqual([
      { base: 1, top: 3 },
      { base: 0, top: 2 },
      { base: 3, top: 3 },
    ]);
  });

  it("finds the runs between gaps", () => {
    expect(gapRuns([p(0, 0), null, p(2, 0), p(3, 0), null])).toEqual([
      [0, 0],
      [2, 3],
    ]);
  });

  it("smooths without overshooting, and steps along first", () => {
    const points = [p(0, 0), p(1, 10), p(2, 10), p(3, 0)];
    for (const piece of curvePieces(points, "smooth")) {
      expect(Math.max(piece.c1.y, piece.c2.y)).toBeLessThanOrEqual(10);
      expect(Math.min(piece.c1.y, piece.c2.y)).toBeGreaterThanOrEqual(0);
    }
    expect(curvePieces(points, "catmull-rom")).toHaveLength(3);
    expect(curvePieces(points, "linear")).toEqual([]);
    expect(stepPoints([p(0, 1), p(1, 5)])).toEqual([p(0, 1), p(1, 1), p(1, 5)]);
  });

  it("writes path data, forwards and backwards", () => {
    const points = [p(0, 0), p(1, 2)];
    expect(pathData(points, "linear")).toBe("M0 0L1 2");
    expect(pathData(points, "linear", { connect: true, reverse: true })).toBe("L1 2L0 0");
    const forward = pathData(points, "smooth");
    expect(forward.startsWith("M0 0C")).toBe(true);
    expect(pathData(points, "smooth", { reverse: true }).endsWith("0 0")).toBe(true);
  });
});

describe("bars", () => {
  const domain = barDomain(
    [
      [10, 20],
      [30, -10],
    ],
    "grouped",
  );

  it("places grouped bars side by side, a gap apart, at any width", () => {
    const [a, b] = barRects(
      2,
      [
        [10, 20],
        [30, -10],
      ],
      "grouped",
      domain,
      4,
      0.3,
    );
    const width = 400;
    const left = (bar: typeof a) => (bar!.startPercent / 100) * width + bar!.startPixels;
    const size = (bar: typeof a) => (bar!.sizePercent / 100) * width + bar!.sizePixels;
    expect(left(b) - (left(a) + size(a))).toBeCloseTo(4);
    // The pair is centered in its category's half.
    expect((left(a) + left(b) + size(b)) / 2).toBeCloseTo(width / 4);
  });

  it("grows from zero both ways, and stacks each sign by itself", () => {
    const grouped = barRects(1, [[10], [-10]], "grouped", valueDomain(-10, 10, true), 0, 0);
    expect(grouped.map((b) => b.free)).toEqual(["end", "start"]);
    expect(grouped[0]!.from).toBeCloseTo(0.5);
    expect(grouped[1]!.to).toBeCloseTo(0.5);
    const stacked = barRects(1, [[5], [-5], [3]], "stacked", valueDomain(-5, 8, true), 4, 0.3);
    expect(stacked[2]!.from).toBeCloseTo(stacked[0]!.to);
    expect(stacked.map((b) => b.free)).toEqual([null, "start", "end"]);
    expect(barDomain([[5], [-5], [3]], "stacked").high).toBeGreaterThanOrEqual(8);
  });

  it("finds the bar nearest across the category axis, even above a short bar", () => {
    const bars = barRects(2, [[1, 100]], "grouped", valueDomain(1, 100, true), 4, 0.3);
    expect(nearestBar(bars, { across: 60, along: 190 }, 400, 200)!.category).toBe(0);
    expect(nearestBar(bars, { across: 340, along: 10 }, 400, 200)!.category).toBe(1);
    expect(nearestBar([], { across: 0, along: 0 }, 1, 1)).toBeNull();
  });
});

describe("pies", () => {
  it("shares a full turn from the top, counting negatives as zero", () => {
    const angles = sliceAngles([1, 3, -2], -90);
    expect(angles.map((a) => a.sweep)).toEqual([90, 270, 0]);
    expect(angles[1]!.start).toBe(0);
    expect(sliceAngles([0, 0], -90).map((a) => a.sweep)).toEqual([0, 0]);
  });

  it("hits by angle and radius", () => {
    const angles = sliceAngles([1, 1], -90);
    expect(sliceAt(5, 0, 10, 0, angles)).toBe(0);
    expect(sliceAt(-5, 0, 10, 0, angles)).toBe(1);
    expect(sliceAt(20, 0, 10, 0, angles)).toBeNull();
    expect(sliceAt(1, 0, 10, 5, angles)).toBeNull();
  });

  it("draws sectors, rings and full turns", () => {
    expect(sectorPath(50, 50, 40, 0, -90, 90)).toBe("M50 50L50 10A40 40 0 0 1 90 50Z");
    expect(sectorPath(50, 50, 40, 20, -90, 90)).toContain("A20 20 0 0 0");
    expect(sectorPath(50, 50, 40, 0, -90, 360).match(/A/g)).toHaveLength(2);
  });

  it("reads shares and the largest slice", () => {
    expect([0.452, 0.004, 0].map(shareText)).toEqual(["45%", "<1%", "0%"]);
    const slices = [
      { label: "Search", value: 45 },
      { label: "Other", value: 55 },
    ];
    expect(pieSummary("Pie chart", slices)).toBe("Pie chart, 2 slices, largest: Other 55%");
  });
});

describe("time axes", () => {
  const at = (iso: string) => Date.parse(iso);

  it("ticks on calendar steps in the zone given", () => {
    const months = timeTicks(at("2026-01-01T00:00Z"), at("2026-06-01T00:00Z"), 6);
    expect(months.step.name).toBe("month");
    expect(months.ticks.map((t) => formatChartTime(t, months.step))).toEqual([
      "2026",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
    ]);
    const hours = timeTicks(at("2026-03-10T00:00Z"), at("2026-03-10T12:00Z"), 5, 420);
    expect(formatChartTime(hours.ticks[0]!, hours.step, 420)).toBe("09:00");
    const weeks = timeTicks(at("2026-03-01T00:00Z"), at("2026-03-31T00:00Z"), 5);
    expect(new Date(weeks.ticks[0]!).getUTCDay()).toBe(1);
  });

  it("does not build millions of ticks to reject a step", () => {
    const years = timeTicks(at("1990-01-01T00:00Z"), at("2030-01-01T00:00Z"), 5);
    expect(years.step.name).toBe("ten-years");
    expect(TIME_STEPS.at(-1)!.name).toBe("ten-years");
  });

  it("takes only strictly ascending times, one per category", () => {
    expect(validTimes([1, 2, 3], 3)).not.toBeNull();
    expect(validTimes([1, 1, 3], 3)).toBeNull();
    expect(validTimes([1, 2], 3)).toBeNull();
    expect(validTimes([1], 1)).toBeNull();
  });
});

describe("summaries, keys and style", () => {
  it("names a chart's data", () => {
    expect(chartSummary("Line chart", ["Jan"], [{ name: "Sales", values: [3] }])).toBe(
      "Line chart, 1 series, 1 category. Sales: at 3",
    );
    expect(noChartData([], [])).toBe(true);
    expect(noChartData(["a"], [{ name: "s", values: [null] }])).toBe(true);
  });

  it("walks the points, and a pie one way", () => {
    expect(walkTarget("ArrowRight", [0, 0], 3, 2)).toEqual([1, 0]);
    expect(walkTarget("ArrowDown", [1, 1], 3, 2)).toEqual([1, 1]);
    expect(walkTarget("End", [0, 1], 3, 2)).toEqual([2, 1]);
    expect(walkTarget("ArrowDown", [0, 0], 3, 1, true)).toEqual([1, 0]);
    expect(walkTarget("a", [0, 0], 3, 1)).toBeNull();
  });

  it("layers the theme, the skin's preset, the brand's tokens and the chart's own", () => {
    const theme = createCamoTheme(minimalThemes.light, {
      tokenSets: { chart: { "line-width": "3", "grid-dashed": "true" } },
    });
    const style = resolveChartStyle("minimal", theme, { markerSize: 9 });
    expect(style).toMatchObject({ lineWidth: 3, gridDashed: true, markerSize: 9, barRadius: 2 });
    expect(resolveChartStyle("unknown", theme).barRadius).toBe(4);
    CamoCharts.registerPreset("mine", { barRadius: 11 });
    expect(resolveChartStyle("mine", undefined).barRadius).toBe(11);
    expect(styleFromTokens({ chart: { palette: "#111, rgb(1, 2, 3)", "bar-gap": "x" } })).toEqual({
      palette: ["#111", "rgb(1, 2, 3)"],
    });
  });

  it("takes series colors from the theme's families, leaving out the faint ones", () => {
    const live = resolveChartStyle("minimal", minimalThemes.light);
    expect(live.palette.length).toBeGreaterThanOrEqual(3);
    expect(live.palette[0]!.css).toBe("var(--camo-color-primary)");
    expect(live.palette[0]!.value).toBe(minimalThemes.light.colors.primary);
    expect(resolveChartStyle("minimal", undefined).palette).toHaveLength(7);
    expect(resolveChartStyle("minimal", undefined, { palette: ["red"] }).palette).toEqual([
      { css: "red", value: "red" },
    ]);
  });
});
