// The drawing of the marks, apart from the frame, the axes and the behaviour. Each method returns the template for one
// plot area, which fills its box: positions are fractions (0 at the start or bottom edge, 1 at the other), so the same
// template is right at any width and on a server. Replace some or all of it with `<camo-charts-provider>`.
import { createContext } from "@lit/context";
import type { Context } from "@lit/context";
import { html, nothing, svg } from "lit";
import type { TemplateResult } from "lit";
import type { BarRect } from "./math/bar.ts";
import { gapRuns, pathData } from "./math/line.ts";
import type { LineCurve } from "./math/line.ts";
import { sectorPath, polar } from "./math/pie.ts";
import type { SliceAngle } from "./math/pie.ts";
import { extremes } from "./math/spark.ts";
import type { Point } from "./math/spark.ts";
import type { ChartColor, ResolvedChartStyle } from "./style.ts";

export type SparklineKind = "line" | "area" | "bars";
export type SparklineHighlight = "none" | "last" | "extremes";

export interface SparklineSpec {
  kind: SparklineKind;
  points: readonly (Point | null)[];
  highlight: SparklineHighlight;
  color: string;
}

export interface LineSeriesSpec {
  color: ChartColor;
  /** One per category, in the unit square; `null` is a gap. */
  upper: readonly (Point | null)[];
  /** The edge an area fills down to, or `null` for a line. */
  lower: readonly (Point | null)[] | null;
}

export interface LineChartSpec {
  series: readonly LineSeriesSpec[];
  curve: LineCurve;
  /** A dot on every point. */
  markers: boolean;
  /** The category under the pointer or focus, and the series the keyboard is on. */
  active: number | null;
  focused: number | null;
}

export interface BarChartSpec {
  bars: readonly BarRect[];
  colors: readonly ChartColor[];
  vertical: boolean;
  /** The bar under the pointer or focus; the others dim. */
  active: BarRect | null;
}

export interface PieChartSpec {
  /** The side of the square the pie is drawn in (the SVG's own units), and its radii. */
  size: number;
  outer: number;
  inner: number;
  angles: readonly SliceAngle[];
  colors: readonly ChartColor[];
  /** The label of each slice, or `null` for none (too thin). */
  labels: readonly ({ text: string; color: string } | null)[];
  selected: number | null;
  active: number | null;
}

export interface ChartRenderer {
  sparkline(spec: SparklineSpec, style: ResolvedChartStyle): TemplateResult;
  lineChart(spec: LineChartSpec, style: ResolvedChartStyle): TemplateResult;
  barChart(spec: BarChartSpec, style: ResolvedChartStyle): TemplateResult;
  pieChart(spec: PieChartSpec, style: ResolvedChartStyle): TemplateResult;
}

const pct = (n: number): string => `${Math.round(n * 100000) / 1000}%`;
/** The unit square, in the coordinates of the stretched SVG (y down). */
const stretched = (p: Point): Point => ({ x: p.x * 1000, y: (1 - p.y) * 1000 });

/** A round dot centered on a point, placed from the logical start and the bottom (so it mirrors by itself). */
function dot(p: Point, size: number, color: string, extra = ""): TemplateResult {
  return html`<span
    class="dot"
    style="inset-inline-start:${pct(p.x)};inset-block-end:${pct(p.y)};inline-size:${size}px;block-size:${size}px;margin-inline-start:${-size / 2}px;margin-block-end:${-size / 2}px;background:${color};${extra}"
  ></span>`;
}

const present = (points: readonly (Point | null)[], from: number, to: number): Point[] =>
  points.slice(from, to + 1).filter((p): p is Point => p !== null);

/** A stretched SVG whose strokes keep their width: paths are given in the unit square times 1000. */
function stretchedSvg(content: unknown): TemplateResult {
  return html`<svg class="marks" viewBox="0 0 1000 1000" preserveAspectRatio="none">
    ${content}
  </svg>`;
}

function strokePath(d: string, color: string, width: number): TemplateResult {
  return svg`<path d=${d} fill="none" style="stroke:${color};stroke-width:${width}px" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"></path>`;
}

function fillPath(d: string, color: string, opacity: number): TemplateResult {
  return svg`<path d=${d} style="fill:${color};fill-opacity:${opacity}" stroke="none"></path>`;
}

export const defaultChartRenderer: ChartRenderer = {
  sparkline(spec, style) {
    const { points, color } = spec;
    if (spec.kind === "bars") {
      const slot = 100 / Math.max(1, points.length);
      const width = `max(1px, calc(${slot}% - ${style.barGap}px))`;
      return html`${points.map((p, i) =>
        p === null
          ? nothing
          : html`<span
              class="spark-bar"
              style="inset-inline-start:calc(${(i + 0.5) * slot}% - ${width} / 2);inline-size:${width};block-size:max(1px, ${pct(p.y)});border-radius:${style.barRadius}px;background:${color}"
            ></span>`,
      )}${highlights(spec, style)}`;
    }
    const runs = gapRuns(points).map(([from, to]) => present(points, from, to).map(stretched));
    return html`${stretchedSvg(
      runs
        .filter((run) => run.length > 1)
        .map((run) => {
          const line = pathData(run, "linear");
          const area = `${line}L${run[run.length - 1]!.x} 1000L${run[0]!.x} 1000Z`;
          return svg`${spec.kind === "area" ? fillPath(area, color, style.areaOpacity) : nothing}${strokePath(line, color, style.lineWidth)}`;
        }),
    )}${gapRuns(points)
      .filter(([from, to]) => from === to)
      .map(([from]) =>
        dot(points[from]!, style.lineWidth * 1.5 + 2, color),
      )}${highlights(spec, style)}`;
  },

  lineChart(spec, style) {
    const areas = spec.series.flatMap((s) => {
      if (s.lower === null) return [];
      return gapRuns(s.upper)
        .filter(([from, to]) => to > from)
        .map(([from, to]) => {
          const top = present(s.upper, from, to).map(stretched);
          const bottom = present(s.lower!, from, to).map(stretched);
          const d =
            pathData(top, spec.curve) +
            pathData(bottom, spec.curve, { connect: true, reverse: true }) +
            "Z";
          return fillPath(d, s.color.css, style.areaOpacity);
        });
    });
    const lines = spec.series.flatMap((s) =>
      gapRuns(s.upper)
        .filter(([from, to]) => to > from)
        .map(([from, to]) =>
          strokePath(
            pathData(present(s.upper, from, to).map(stretched), spec.curve),
            s.color.css,
            style.lineWidth,
          ),
        ),
    );
    const dots = spec.series.flatMap((s, index) => {
      const alone = new Set(
        gapRuns(s.upper)
          .filter(([from, to]) => from === to)
          .map(([from]) => from),
      );
      return s.upper.map((p, category) => {
        if (p === null) return nothing;
        const active = category === spec.active;
        if (!spec.markers && !active && !alone.has(category)) return nothing;
        const ring =
          active && index === spec.focused
            ? `box-shadow:0 0 0 ${style.markerSize / 2}px color-mix(in srgb, ${s.color.css} 30%, transparent)`
            : "";
        return dot(p, style.markerSize, s.color.css, ring);
      });
    });
    return html`${stretchedSvg([areas, lines])}${dots}`;
  },

  barChart(spec, style) {
    return html`${spec.bars.map((bar) => {
      const start = `calc(${bar.startPercent}% + ${bar.startPixels}px)`;
      const size = `max(1px, calc(${bar.sizePercent}% + ${bar.sizePixels}px))`;
      const dim = spec.active !== null && spec.active !== bar;
      // The radius is on the free end only, by the logical corners, so it mirrors with the bar.
      const r = `${style.barRadius}px`;
      const corners =
        bar.free === null
          ? ""
          : spec.vertical
            ? bar.free === "end"
              ? `border-start-start-radius:${r};border-start-end-radius:${r}`
              : `border-end-start-radius:${r};border-end-end-radius:${r}`
            : bar.free === "end"
              ? `border-start-end-radius:${r};border-end-end-radius:${r}`
              : `border-start-start-radius:${r};border-end-start-radius:${r}`;
      const box = spec.vertical
        ? `inset-inline-start:${start};inline-size:${size};inset-block-end:${pct(bar.from)};block-size:${pct(bar.to - bar.from)}`
        : `inset-block-start:${start};block-size:${size};inset-inline-start:${pct(bar.from)};inline-size:${pct(bar.to - bar.from)}`;
      return html`<span
        class="bar ${spec.vertical ? "up" : "along"} ${bar.value < 0 ? "negative" : ""}"
        data-category=${bar.category}
        data-series=${bar.series}
        style="${box};background:${spec.colors[bar.series]!.css};${corners};opacity:${dim ? 0.55 : 1}"
      ></span>`;
    })}`;
  },

  pieChart(spec, style) {
    const center = spec.size / 2;
    const drawn = spec.angles.filter((a) => a.sweep > 0).length;
    const middle = (spec.outer + spec.inner) / 2;
    // The gap is an angle: the pixels of the style over the radius it is measured at.
    const gap = drawn > 1 && middle > 0 ? ((style.sliceGap / middle) * 180) / Math.PI : 0;
    const offset = (index: number, angle: number): { x: number; y: number } =>
      index === spec.selected ? polar(0, 0, style.selectedOffset, angle) : { x: 0, y: 0 };
    return html`<svg class="pie" viewBox="0 0 ${spec.size} ${spec.size}">
      ${spec.angles.map(({ start, sweep }, i) => {
        if (sweep <= 0 || sweep - gap <= 0) return nothing;
        const shift = offset(i, start + sweep / 2);
        const dim = spec.active !== null && spec.active !== i;
        const d = sectorPath(center, center, spec.outer, spec.inner, start + gap / 2, sweep - gap);
        return svg`<path class="slice" data-index=${i} d=${d} fill-rule="nonzero" transform="translate(${shift.x} ${shift.y})" style="fill:${spec.colors[i]!.css};opacity:${dim ? 0.55 : 1}"></path>`;
      })}
      ${spec.angles.map(({ start, sweep }, i) => {
        const label = spec.labels[i];
        if (label === null || label === undefined || sweep <= 0) return nothing;
        const angle = start + sweep / 2;
        const shift = offset(i, angle);
        const radius = spec.inner > 0 ? middle : spec.outer * 0.62;
        const at = polar(center + shift.x, center + shift.y, radius, angle);
        return svg`<text class="share" x=${at.x} y=${at.y} text-anchor="middle" dominant-baseline="central" style="fill:${label.color}">${label.text}</text>`;
      })}
    </svg>`;
  },
};

function highlights(spec: SparklineSpec, style: ResolvedChartStyle): unknown {
  const last = [...spec.points].reverse().find((p): p is Point => p !== null);
  const shown =
    spec.highlight === "extremes"
      ? extremes(spec.points)
      : spec.highlight === "last" && last !== undefined
        ? [last]
        : [];
  return shown.map((p) => dot(p, style.markerSize, spec.color));
}

/** The renderer in force for a subtree. */
export const chartRendererContext: Context<symbol, ChartRenderer> = createContext<
  ChartRenderer,
  symbol
>(Symbol.for("@srctool/camouflage-charts/renderer"));
