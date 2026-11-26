import { html, nothing } from "lit";
import type { CSSResult, PropertyDeclarations } from "lit";
import { nearestIndex, stack } from "../math/line.ts";
import type { LineCurve, LineKind, MarkerVisibility, StackBand } from "../math/line.ts";
import { fraction, valueDomain } from "../math/scale.ts";
import type { ValueDomain } from "../math/scale.ts";
import type { Point } from "../math/spark.ts";
import { formatChartTime, timeTicks, validTimes } from "../math/time.ts";
import type { ResolvedChartStyle } from "../style.ts";
import { CamoCartesianChart } from "../shared/cartesian.ts";
import type { AxisLabel, CartesianScene, Tooltip, TooltipRow } from "../shared/cartesian.ts";
import {
  cartesianStyles,
  frameStyles,
  plotStyles,
  sharedStyles,
  tooltipStyles,
} from "../shared/styles.ts";

/**
 * `<camo-line-chart title="Sales" categories='["Jan","Feb"]' series='[{"name":"North","values":[3,9]}]'>`
 *
 * Values over an ordered axis, as lines, areas or stacked areas, with a legend that toggles series, a tooltip and a
 * crosshair at the nearest category, and the same data as a table. `times` (epoch milliseconds, ascending) places the
 * categories on a time axis with calendar ticks. The plot is one Tab stop: Left and Right walk the categories, Up and
 * Down the series, Home and End jump, Escape hides, and each point is announced ("Jan, North, 3"). A `null` breaks the
 * line; a stacked area treats negative values as zero. A time axis keeps its direction in right-to-left.
 *
 * The data are JSON attributes (so a server renders the chart and the browser hydrates it) or properties; the axes'
 * `format` functions are properties only.
 *
 * @tagname camo-line-chart
 * @slot empty - What stands in when there is no data; by default "No data".
 * @attr {string} title - The chart's name, shown above it and read first.
 * @attr {string} categories - The x labels, a JSON list.
 * @attr {string} series - A JSON list of `{ name, values, color }`; `null` in `values` is a gap.
 * @attr {"line"|"area"|"stacked-area"} kind - The form.
 * @attr {"linear"|"smooth"|"catmull-rom"|"step"} curve - How points are joined; `smooth` never overshoots.
 * @attr {"always"|"on-hover"|"never"} markers - When points are marked.
 * @attr {string} x-axis - JSON `{ title }`.
 * @attr {string} y-axis - JSON `{ title, min, max, tickCount }`.
 * @attr {string} times - A JSON list of epoch milliseconds, one per category.
 * @attr {number} time-zone-offset-minutes - The zone of the time axis, from UTC.
 * @attr {boolean} loading - A skeleton stands in.
 * @attr {boolean} show-table - The data as a table instead of the plot.
 * @attr {number} plot-height - The plot's height in px.
 * @attr {string} chart-style - JSON overrides of the chart style.
 * @fires camo-show-table-change - The table switch was pressed; `detail.showTable`.
 */
export class CamoLineChart extends CamoCartesianChart {
  static override properties: PropertyDeclarations = {
    kind: { type: String, reflect: true },
    curve: { type: String, reflect: true },
    markers: { type: String, reflect: true },
    times: { type: Array },
    timeZoneOffsetMinutes: { type: Number, attribute: "time-zone-offset-minutes" },
  };

  static override styles: CSSResult[] = [
    sharedStyles,
    frameStyles,
    plotStyles,
    cartesianStyles,
    tooltipStyles,
  ];

  declare kind: LineKind;
  declare curve: LineCurve;
  declare markers: MarkerVisibility;
  declare times: readonly number[] | null;
  declare timeZoneOffsetMinutes: number;

  protected readonly kindName = "Line chart";
  #xs: number[] = [];

  constructor() {
    super();
    this.kind = "line";
    this.curve = "linear";
    this.markers = "on-hover";
    this.times = null;
    this.timeZoneOffsetMinutes = 0;
  }

  protected onPointer(event: PointerEvent): void {
    let { x } = this.pointerFraction(event, event.currentTarget as Element);
    if (this.isRtl && validTimes(this.times, this.categories.length) === null) x = 1 - x;
    this.hover = nearestIndex(this.#xs, x);
  }

  #positions(): number[] {
    const count = this.categories.length;
    const times = validTimes(this.times, count);
    if (times !== null) {
      const first = times[0]!;
      const span = times[count - 1]! - first;
      return times.map((t) => (t - first) / span);
    }
    if (count === 1) return [0.5];
    return Array.from({ length: count }, (_, i) => i / (count - 1));
  }

  #below(xs: readonly number[]): AxisLabel[] {
    const times = validTimes(this.times, this.categories.length);
    if (times === null) return this.categories.map((text, i) => ({ at: xs[i]!, text }));
    const first = times[0]!;
    const last = times[times.length - 1]!;
    // A server assumes a width for six ticks; the browser fits them to the width it has.
    const max = this.areaWidth === 0 ? 6 : Math.max(2, Math.floor(this.areaWidth / 64));
    const offset = this.timeZoneOffsetMinutes;
    const { ticks, step } = timeTicks(first, last, max, offset);
    return ticks.map((t) => ({
      at: (t - first) / (last - first),
      text: formatChartTime(t, step, offset),
    }));
  }

  protected scene(style: ResolvedChartStyle): CartesianScene {
    const shown = this.shown(style);
    const values = shown.map((s) => s.series.values);
    const bands: (StackBand | null)[][] | null =
      this.kind === "stacked-area" ? stack(values) : null;
    const flat = bands
      ? bands.flatMap((row) => row.flatMap((b) => (b === null ? [] : [b.top])))
      : values.flatMap((v) => v.filter((n): n is number => n !== null));
    const domain: ValueDomain = valueDomain(
      flat.length === 0 ? null : Math.min(...flat),
      flat.length === 0 ? null : Math.max(...flat),
      this.kind !== "line",
      this.yAxis ?? {},
    );
    const xs = (this.#xs = this.#positions());
    const baseline = fraction(domain, Math.min(Math.max(0, domain.low), domain.high));
    const point = (c: number, v: number): Point => ({ x: xs[c]!, y: fraction(domain, v) });
    const series = shown.map((s, i) => {
      const upper = xs.map((_, c) => {
        const top = bands ? bands[i]![c]?.top : s.series.values[c];
        return top === null || top === undefined ? null : point(c, top);
      });
      const lower =
        this.kind === "line"
          ? null
          : this.kind === "area"
            ? upper.map((p) => (p === null ? null : { x: p.x, y: baseline }))
            : xs.map((_, c) => {
                const band = bands![i]![c];
                return band === null || band === undefined ? null : point(c, band.base);
              });
      return { color: s.color, upper, lower };
    });
    const walk = this.walk;
    const active =
      this.markers === "never"
        ? null
        : this.hover !== null && this.hover < xs.length
          ? this.hover
          : (walk?.[0] ?? null);
    return {
      side: domain.ticks.map((t) => ({ at: fraction(domain, t), text: this.formatValue(t) })),
      below: this.#below(xs),
      sideTopDown: false,
      grid: domain.ticks.map((t) => fraction(domain, t)),
      gridVertical: false,
      edges: true,
      ltr: validTimes(this.times, this.categories.length) !== null,
      topTitle: this.yAxis?.title,
      bottomTitle: this.xAxis?.title,
      marks: html`${this.context.renderer.lineChart(
        {
          series,
          curve: this.curve,
          markers: this.markers === "always",
          active,
          focused: walk?.[1] ?? null,
        },
        style,
      )}${nothing}`,
      crosshair: active === null ? null : xs[active]!,
      tooltip: active === null ? null : this.#tooltip(active, shown, xs[active]!),
      announce: walk === null ? "" : this.pointText(walk[0], shown[walk[1]]?.series),
    };
  }

  #tooltip(category: number, shown: ReturnType<CamoCartesianChart["shown"]>, at: number): Tooltip {
    const rows: TooltipRow[] = shown.flatMap(({ series, color }) => {
      const v = series.values[category];
      return v === null || v === undefined
        ? []
        : [{ color: color.css, text: `${series.name}: ${this.formatValue(v)}` }];
    });
    if (this.kind === "stacked-area") {
      const total = shown.reduce((sum, s) => sum + Math.max(0, s.series.values[category] ?? 0), 0);
      rows.push({ color: null, text: `Total: ${this.formatValue(total)}` });
    }
    return { title: this.categories[category] ?? "", rows, at };
  }
}
