import { html } from "lit";
import type { CSSResult, PropertyDeclarations } from "lit";
import { barRects, nearestBar } from "../math/bar.ts";
import type { BarMode, BarOrientation, BarRect } from "../math/bar.ts";
import { fraction, valueDomain } from "../math/scale.ts";
import type { ValueDomain } from "../math/scale.ts";
import type { ResolvedChartStyle } from "../style.ts";
import { CamoCartesianChart } from "../shared/cartesian.ts";
import type { CartesianScene, Tooltip } from "../shared/cartesian.ts";
import {
  cartesianStyles,
  frameStyles,
  plotStyles,
  sharedStyles,
  tooltipStyles,
} from "../shared/styles.ts";

/** The value axis of a bar chart: bars start at zero, and a stacked category reaches its positive and negative sums. */
export function barDomain(
  values: readonly (readonly (number | null)[])[],
  mode: BarMode,
  axis: Parameters<typeof valueDomain>[3] = {},
): ValueDomain {
  const categories = Math.max(0, ...values.map((v) => v.length));
  const extents =
    mode === "stacked"
      ? Array.from({ length: categories }, (_, c) => {
          const column = values.map((v) => v[c] ?? 0);
          return [
            column.reduce((sum, n) => sum + Math.max(0, n), 0),
            column.reduce((sum, n) => sum + Math.min(0, n), 0),
          ];
        }).flat()
      : values.flatMap((v) => v.filter((n): n is number => n !== null));
  return valueDomain(
    extents.length === 0 ? null : Math.min(...extents),
    extents.length === 0 ? null : Math.max(...extents),
    true,
    axis,
  );
}

/**
 * `<camo-bar-chart title="Revenue" categories='["Q1","Q2"]' series='[{"name":"North","values":[42,51]}]'>`
 *
 * Values compared across categories: vertical or horizontal bars, grouped side by side or stacked, with a legend that
 * toggles series, a tooltip on the bar under the pointer and the same data as a table. `y-axis` is always the value
 * axis and `x-axis` the category axis, whichever way the bars run. The plot is one Tab stop: Left and Right walk the
 * categories, Up and Down the series, and each bar is announced ("Q1, North, 42"). Bars grow from zero; negative bars
 * go the other way. In right-to-left vertical bars run from the right and horizontal bars start at the right edge.
 *
 * @tagname camo-bar-chart
 * @slot empty - What stands in when there is no data; by default "No data".
 * @attr {string} title - The chart's name.
 * @attr {string} categories - The category labels, a JSON list.
 * @attr {string} series - A JSON list of `{ name, values, color }`.
 * @attr {"vertical"|"horizontal"} orientation - Which way the bars run.
 * @attr {"grouped"|"stacked"} mode - Side by side, or piled up.
 * @attr {boolean} value-labels - Each bar's value at its free end (a stack's total at its end).
 * @attr {string} x-axis - JSON `{ title }`, the category axis.
 * @attr {string} y-axis - JSON `{ title, min, max, tickCount }`, the value axis.
 * @attr {boolean} loading - A skeleton stands in.
 * @attr {boolean} show-table - The data as a table instead of the plot.
 * @attr {number} plot-height - The plot's height in px.
 * @attr {string} chart-style - JSON overrides of the chart style.
 * @fires camo-show-table-change - The table switch was pressed; `detail.showTable`.
 */
export class CamoBarChart extends CamoCartesianChart {
  static override properties: PropertyDeclarations = {
    orientation: { type: String, reflect: true },
    mode: { type: String, reflect: true },
    valueLabels: { type: Boolean, attribute: "value-labels", reflect: true },
  };

  static override styles: CSSResult[] = [
    sharedStyles,
    frameStyles,
    plotStyles,
    cartesianStyles,
    tooltipStyles,
  ];

  declare orientation: BarOrientation;
  declare mode: BarMode;
  declare valueLabels: boolean;

  protected readonly kindName = "Bar chart";
  #bars: BarRect[] = [];
  #size = { across: 0, along: 0 };

  constructor() {
    super();
    this.orientation = "vertical";
    this.mode = "grouped";
    this.valueLabels = false;
  }

  protected onPointer(event: PointerEvent): void {
    const area = event.currentTarget as HTMLElement;
    const at = this.pointerFraction(event, area);
    const x = this.isRtl ? 1 - at.x : at.x;
    const vertical = this.orientation === "vertical";
    this.#size = vertical
      ? { across: area.clientWidth, along: area.clientHeight }
      : { across: area.clientHeight, along: area.clientWidth };
    const point = vertical
      ? { across: x * this.#size.across, along: (1 - at.y) * this.#size.along }
      : { across: at.y * this.#size.across, along: x * this.#size.along };
    const bar = nearestBar(this.#bars, point, this.#size.across, this.#size.along);
    this.hover = bar === null ? null : this.#bars.indexOf(bar);
  }

  protected scene(style: ResolvedChartStyle): CartesianScene {
    const shown = this.shown(style);
    const values = shown.map((s) => s.series.values);
    const vertical = this.orientation === "vertical";
    const domain = barDomain(values, this.mode, this.yAxis ?? {});
    const count = this.categories.length;
    const bars = (this.#bars = barRects(
      count,
      values,
      this.mode,
      domain,
      style.barGap,
      style.groupGap,
    ));
    const walk = this.walk;
    const hovered = this.hover === null ? undefined : bars[this.hover];
    const focused = walk
      ? bars.find((b) => b.category === walk[0] && b.series === walk[1])
      : undefined;
    const active = hovered ?? focused ?? null;
    const ticks = domain.ticks.map((t) => ({ at: fraction(domain, t), text: this.formatValue(t) }));
    const names = this.categories.map((text, c) => ({ at: (c + 0.5) / count, text }));
    const marks = html`${this.context.renderer.barChart(
      { bars, colors: shown.map((s) => s.color), vertical, active },
      style,
    )}${this.valueLabels ? this.#values(bars, vertical) : ""}`;
    return {
      side: vertical ? ticks : names,
      below: vertical ? names : ticks,
      sideTopDown: !vertical,
      grid: ticks.map((t) => t.at),
      gridVertical: !vertical,
      edges: false,
      ltr: false,
      topTitle: vertical ? this.yAxis?.title : this.xAxis?.title,
      bottomTitle: vertical ? this.xAxis?.title : this.yAxis?.title,
      marks,
      crosshair: null,
      tooltip: active === null ? null : this.#tooltip(active, shown, vertical),
      announce: walk === null ? "" : this.pointText(walk[0], shown[walk[1]]?.series),
    };
  }

  /** A value at each bar's free end; a stack gets its side's total there. */
  #values(bars: readonly BarRect[], vertical: boolean): unknown {
    return bars
      .filter((b) => b.free !== null)
      .map((bar) => {
        const shown =
          this.mode === "stacked"
            ? bars
                .filter((b) => b.category === bar.category && b.value >= 0 === bar.value >= 0)
                .reduce((sum, b) => sum + b.value, 0)
            : bar.value;
        const middle = `calc(${bar.startPercent + bar.sizePercent / 2}% + ${bar.startPixels + bar.sizePixels / 2}px)`;
        const up = bar.free === "end";
        const edge = up ? `calc(${bar.to * 100}% + 3px)` : `calc(${(1 - bar.from) * 100}% + 3px)`;
        const place = vertical
          ? `inset-inline-start:${middle};transform:translateX(var(--camo-chart-center));${up ? "inset-block-end" : "inset-block-start"}:${edge}`
          : `inset-block-start:${middle};translate:0 -50%;${up ? "inset-inline-start" : "inset-inline-end"}:${edge}`;
        return html`<span class="value" style=${place}>${this.formatValue(shown)}</span>`;
      });
  }

  #tooltip(
    bar: BarRect,
    shown: ReturnType<CamoCartesianChart["shown"]>,
    vertical: boolean,
  ): Tooltip {
    const { series, color } = shown[bar.series]!;
    const value = series.values[bar.category];
    const rows = [
      {
        color: color.css,
        text: `${series.name}: ${value === null || value === undefined ? "-" : this.formatValue(value)}`,
      } as { color: string | null; text: string },
    ];
    if (this.mode === "stacked") {
      const total = shown.reduce((sum, s) => sum + (s.series.values[bar.category] ?? 0), 0);
      rows.push({ color: null, text: `Total: ${this.formatValue(total)}` });
    }
    // Beside the bar across the plot: its middle for vertical bars, its end for horizontal ones.
    const at = vertical
      ? (bar.startPercent + bar.sizePercent / 2) / 100
      : bar.value >= 0
        ? bar.to
        : bar.from;
    return { title: this.categories[bar.category] ?? "", rows, at };
  }
}
