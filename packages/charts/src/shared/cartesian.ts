// A chart over an ordered axis: the grid, the axis labels and titles, the crosshair and the tooltip around the marks,
// and the table fallback. Everything is placed by fractions, so the server's markup is right at any width; only the
// thinning of crowded labels needs a measurement, in the browser.
import { html, nothing } from "lit";
import type { PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import type { ChartAxis } from "../math/scale.ts";
import { formatChartNumber } from "../math/scale.ts";
import { chartSummary, noChartData } from "../math/summary.ts";
import type { ChartSeries } from "../math/summary.ts";
import { seriesColor } from "../style.ts";
import type { ChartColor, ResolvedChartStyle } from "../style.ts";
import { CamoPlotChart } from "./base.ts";
import { frameTemplate } from "./frame.ts";

/** A label beside the plot: at a fraction from the start (or bottom) of its axis. */
export interface AxisLabel {
  at: number;
  text: string;
}

export interface TooltipRow {
  color: string | null;
  text: string;
}

export interface Tooltip {
  title: string;
  rows: readonly TooltipRow[];
  /** Where along the plot it sits, from the start. */
  at: number;
}

export interface CartesianScene {
  /** Labels along the block axis (beside the plot) and along the inline axis (below it). */
  side: readonly AxisLabel[];
  below: readonly AxisLabel[];
  /** Whether `side` holds categories listed from the top (horizontal bars). */
  sideTopDown: boolean;
  grid: readonly number[];
  gridVertical: boolean;
  /** Edge labels below stay inside the plot (a line chart's first and last category). */
  edges: boolean;
  /** A time axis keeps its direction in right-to-left. */
  ltr: boolean;
  topTitle: string | undefined;
  bottomTitle: string | undefined;
  marks: unknown;
  crosshair: number | null;
  tooltip: Tooltip | null;
  announce: string;
}

const pct = (n: number): string => `${Math.round(n * 100000) / 1000}%`;

export function tooltipTemplate(tip: Tooltip, physical = false): TemplateResult {
  const after = tip.at <= 0.5;
  const side = physical
    ? after
      ? "left"
      : "right"
    : after
      ? "inset-inline-start"
      : "inset-inline-end";
  const offset = `calc(${pct(after ? tip.at : 1 - tip.at)} + 12px)`;
  return html`<div class="tip" part="tooltip" aria-hidden="true" style="${side}:${offset}">
    <span class="tip-title">${tip.title}</span>
    ${tip.rows.map(
      (row) =>
        html`<span class="tip-row"
          >${row.color === null ? nothing : html`<span class="key" style="background:${row.color}"></span>`}${row.text}</span
        >`,
    )}
  </div>`;
}

export abstract class CamoCartesianChart extends CamoPlotChart {
  static override properties: PropertyDeclarations = {
    categories: { type: Array },
    series: { type: Array },
    xAxis: { type: Object, attribute: "x-axis" },
    yAxis: { type: Object, attribute: "y-axis" },
    areaWidth: { state: true, attribute: false },
    labelWidth: { state: true, attribute: false },
  };

  declare categories: readonly string[];
  declare series: readonly ChartSeries[];
  declare xAxis: ChartAxis | null;
  declare yAxis: ChartAxis | null;
  /** Measured in the browser, to thin out crowded labels below the plot. */
  declare areaWidth: number;
  declare labelWidth: number;

  #observer: ResizeObserver | null = null;
  #observed: Element | null = null;

  constructor() {
    super();
    this.categories = [];
    this.series = [];
    this.xAxis = null;
    this.yAxis = null;
    this.areaWidth = 0;
    this.labelWidth = 0;
  }

  protected abstract readonly kindName: string;
  protected abstract scene(style: ResolvedChartStyle): CartesianScene;
  protected abstract onPointer(event: PointerEvent): void;

  protected formatValue(value: number): string {
    return (this.yAxis?.format ?? formatChartNumber)(value);
  }

  /** The series that are shown, with their colors and their place in `series`. */
  protected shown(style: ResolvedChartStyle): { series: ChartSeries; color: ChartColor }[] {
    return (this.series ?? []).flatMap((series, i) =>
      this.hiddenItems.has(i) ? [] : [{ series, color: seriesColor(style, i, series.color) }],
    );
  }

  protected extent(): { categories: number; series: number } {
    return {
      categories: this.categories?.length ?? 0,
      series: (this.series?.length ?? 0) - this.hiddenItems.size,
    };
  }

  protected pointText(category: number, series: ChartSeries | undefined): string {
    const label = this.categories[category] ?? "";
    if (series === undefined) return label;
    const value = series.values[category];
    return `${label}, ${series.name}, ${value === null || value === undefined ? "no data" : this.formatValue(value)}`;
  }

  override willUpdate(changed: PropertyValues): void {
    // A new set of series starts with all of them on.
    const before = changed.get("series") as readonly ChartSeries[] | undefined;
    if (before !== undefined && before.length !== (this.series?.length ?? 0))
      this.hiddenItems = new Set();
  }

  override updated(): void {
    this.#measure();
  }

  #measure(): void {
    const area = this.renderRoot.querySelector(".area");
    if (area !== this.#observed && typeof ResizeObserver !== "undefined") {
      this.#observer ??= new ResizeObserver(() => this.#measure());
      this.#observer.disconnect();
      if (area !== null) this.#observer.observe(area);
      this.#observed = area;
    }
    if (area === null) return;
    const widest = Math.max(
      0,
      ...[...this.renderRoot.querySelectorAll<HTMLElement>(".below > span")].map(
        (s) => s.offsetWidth,
      ),
    );
    const width = (area as HTMLElement).clientWidth;
    if (Math.abs(width - this.areaWidth) > 1) this.areaWidth = width;
    if (Math.abs(widest - this.labelWidth) > 1) this.labelWidth = widest;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#observer?.disconnect();
    this.#observer = null;
    this.#observed = null;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Reconnected: watch the plot again.
    if (this.hasUpdated) this.requestUpdate();
  }

  /** Every how many labels below are written, so they do not run into each other. */
  #labelStep(labels: readonly AxisLabel[]): number {
    if (this.areaWidth === 0 || labels.length < 2) return 1;
    const sorted = labels.map((l) => l.at).sort((a, b) => a - b);
    const slot = Math.min(...sorted.slice(1).map((at, i) => at - sorted[i]!)) * this.areaWidth;
    return slot <= 0 ? 1 : Math.max(1, Math.ceil((this.labelWidth * 1.25) / slot));
  }

  override render(): TemplateResult {
    const style = this.context.style(this.chartStyle);
    const all = this.series ?? [];
    const categories = this.categories ?? [];
    return frameTemplate({
      title: this.title,
      legend: all.map((s, i) => ({
        label: s.name,
        color: seriesColor(style, i, s.color).css,
        visible: !this.hiddenItems.has(i),
      })),
      loading: this.loading,
      empty: noChartData(categories, all),
      plotHeight: this.plotHeight,
      showTable: this.showTable,
      table: () =>
        html`<camo-chart-data-table
          caption="${this.title} data"
          .categories=${categories}
          .series=${all}
          .format=${this.yAxis?.format}
        ></camo-chart-data-table>`,
      plot: () => this.#plot(style),
      onLegend: (i) => this.toggleItem(i),
      onTable: () => this.toggleTable(),
    });
  }

  #plot(style: ResolvedChartStyle): TemplateResult {
    const scene = this.scene(style);
    const summary = `${this.title}. ${chartSummary(this.kindName, this.categories ?? [], this.series ?? [])}`;
    const step = this.#labelStep(scene.below);
    const line = `1px ${style.gridDashed ? "dashed" : "solid"} var(--camo-color-outline-variant)`;
    return html`<div
        class="plot cartesian ${style.animate ? "animate" : ""} ${scene.ltr ? "time" : ""}"
        part="plot"
        dir=${scene.ltr ? "ltr" : nothing}
        style=${styleMap({ blockSize: `${this.plotHeight}px` })}
        tabindex="0"
        role="application"
        aria-roledescription="chart"
        aria-label=${summary}
        @focus=${this.onFocus}
        @blur=${this.onBlur}
        @keydown=${this.onKey}
      >
        <div class="top-title" aria-hidden="true">${scene.topTitle ?? ""}</div>
        <div class="side" aria-hidden="true">
          ${scene.side.map((l) => html`<i>${l.text}</i>`)}
          ${scene.side.map(
            (l) =>
              html`<span
                style="${scene.sideTopDown ? "inset-block-start" : "inset-block-end"}:${pct(l.at)}"
                class=${scene.sideTopDown ? "down" : "up"}
                >${l.text}</span
              >`,
          )}
        </div>
        <div
          class="area"
          aria-hidden="true"
          @pointermove=${(e: PointerEvent) => this.onPointer(e)}
          @pointerdown=${(e: PointerEvent) => this.onPointer(e)}
          @pointerleave=${this.onLeave}
        >
          ${
            style.gridLines
              ? scene.grid.map((at) =>
                  scene.gridVertical
                    ? html`<span class="rule vertical" style="inset-inline-start:${pct(at)};border-inline-start:${line}"></span>`
                    : html`<span class="rule" style="inset-block-end:${pct(at)};border-block-end:${line}"></span>`,
                )
              : nothing
          }
          <span class="baseline"></span>
          ${scene.crosshair === null ? nothing : html`<span class="crosshair" style="inset-inline-start:${pct(scene.crosshair)}"></span>`}
          ${scene.marks}
          ${scene.tooltip === null ? nothing : tooltipTemplate(scene.tooltip)}
        </div>
        <div class="below" aria-hidden="true">
          ${scene.below.map(
            (l, i) =>
              html`<span
                class=${scene.edges && l.at <= 0 ? "first" : scene.edges && l.at >= 1 ? "last" : ""}
                style="inset-inline-start:${pct(l.at)};visibility:${i % step === 0 ? "visible" : "hidden"}"
                >${l.text}</span
              >`,
          )}
        </div>
        <div class="bottom-title" aria-hidden="true">${scene.bottomTitle ?? ""}</div>
      </div>
      <div class="sr" aria-live="polite">${scene.announce}</div>`;
  }
}
