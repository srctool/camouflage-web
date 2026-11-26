import { contrastRatio, parseColor } from "@srctool/camouflage-core";
import { html, nothing } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { PIE_TOP, pieSummary, polar, shareText, sliceAngles } from "../math/pie.ts";
import type { PieSlice, SliceAngle } from "../math/pie.ts";
import { formatChartNumber } from "../math/scale.ts";
import { seriesColor } from "../style.ts";
import type { ChartColor, ResolvedChartStyle } from "../style.ts";
import { CamoPlotChart } from "../shared/base.ts";
import { tooltipTemplate } from "../shared/cartesian.ts";
import { frameTemplate } from "../shared/frame.ts";
import {
  frameStyles,
  pieStyles,
  plotStyles,
  sharedStyles,
  tooltipStyles,
} from "../shared/styles.ts";

const BLACK = { r: 0, g: 0, b: 0, a: 1 };
const WHITE = { r: 255, g: 255, b: 255, a: 1 };

/** Black or white, whichever reads better on a slice; the surface color when the slice's value is not known. */
function onColor(color: ChartColor): string {
  const rgb = color.value === null ? null : parseColor(color.value);
  if (rgb === null) return "var(--camo-color-surface)";
  return contrastRatio(rgb, BLACK) >= contrastRatio(rgb, WHITE) ? "black" : "white";
}

/**
 * `<camo-pie-chart title="Traffic" donut slices='[{"label":"Search","value":4500}]'><b slot="center">6,100</b></camo-pie-chart>`
 *
 * Parts of a whole, as a pie or (with `donut`) a ring with content in the hole. Each slice shows its share when it is
 * wide enough; the legend lists every slice with its value and share and hides or shows slices. The app owns the
 * selection: a click, or Enter or Space on the focused slice, fires `camo-select` with its index (`null` when it was
 * selected already), and the app sets `selected`; that slice moves out. The plot is one Tab stop: all four arrows walk
 * the slices clockwise, and each is announced ("Search, 45%, 4500"). Negative values count as zero; with every value
 * zero the empty state shows. Angles keep their clockwise direction in right-to-left. For more than about six parts, use
 * a bar chart.
 *
 * @tagname camo-pie-chart
 * @slot center - What sits in a donut's hole: a total, a title.
 * @slot empty - What stands in when there is nothing to show.
 * @attr {string} title - The chart's name.
 * @attr {string} slices - A JSON list of `{ label, value, color }`.
 * @attr {boolean} donut - A ring with a hole.
 * @attr {number} selected - The selected slice's index.
 * @attr {number} start-angle - Where the first slice starts, in degrees; -90 is the top.
 * @attr {boolean} loading - A skeleton stands in.
 * @attr {boolean} show-table - The data as a table instead of the plot.
 * @attr {number} plot-height - The plot's height in px.
 * @attr {string} chart-style - JSON overrides of the chart style.
 * @fires camo-select - A slice was chosen; `detail.index` (or `null` to clear).
 * @fires camo-show-table-change - The table switch was pressed; `detail.showTable`.
 */
export class CamoPieChart extends CamoPlotChart {
  static override properties: PropertyDeclarations = {
    slices: { type: Array },
    donut: { type: Boolean, reflect: true },
    selected: { type: Number },
    startAngle: { type: Number, attribute: "start-angle" },
    valueFormat: { attribute: false },
  };

  static override styles: CSSResult[] = [
    sharedStyles,
    frameStyles,
    plotStyles,
    pieStyles,
    tooltipStyles,
  ];

  declare slices: readonly PieSlice[];
  declare donut: boolean;
  declare selected: number | null;
  declare startAngle: number;
  /** How values are written; a property only. */
  declare valueFormat: ((value: number) => string) | null;

  /** The indexes of the slices that are shown, in order. */
  #shown: number[] = [];

  constructor() {
    super();
    this.slices = [];
    this.donut = false;
    this.selected = null;
    this.startAngle = PIE_TOP;
    this.valueFormat = null;
  }

  #format(value: number): string {
    return (this.valueFormat ?? formatChartNumber)(value);
  }

  protected extent(): { categories: number; series: number; linear: boolean } {
    return { categories: this.#shown.length, series: 1, linear: true };
  }

  protected override activate(): boolean {
    if (this.walk === null) return false;
    this.#select(this.walk[0]);
    return true;
  }

  #select(position: number): void {
    const index = this.#shown[position];
    if (index === undefined) return;
    this.dispatchEvent(
      new CustomEvent("camo-select", {
        detail: { index: index === this.selected ? null : index },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #position(event: Event): number | null {
    const slice = event.composedPath()[0];
    const index = slice instanceof Element ? slice.getAttribute("data-index") : null;
    return index === null ? null : Number(index);
  }

  override willUpdate(changed: PropertyValues): void {
    const before = changed.get("slices") as readonly PieSlice[] | undefined;
    if (before !== undefined && before.length !== (this.slices?.length ?? 0))
      this.hiddenItems = new Set();
  }

  #share(index: number): number {
    const total = this.#shown.reduce((sum, i) => sum + Math.max(0, this.slices[i]!.value), 0);
    return total <= 0 ? 0 : Math.max(0, this.slices[index]?.value ?? 0) / total;
  }

  override render(): TemplateResult {
    const style = this.context.style(this.chartStyle);
    const slices = this.slices ?? [];
    this.#shown = slices.map((_, i) => i).filter((i) => !this.hiddenItems.has(i));
    return frameTemplate({
      title: this.title,
      legend: slices.map((s, i) => {
        const share = this.hiddenItems.has(i) ? "" : `, ${shareText(this.#share(i))}`;
        return {
          label: `${s.label}: ${this.#format(s.value)}${share}`,
          color: seriesColor(style, i, s.color).css,
          visible: !this.hiddenItems.has(i),
        };
      }),
      loading: this.loading,
      empty: slices.every((s) => s.value <= 0),
      plotHeight: this.plotHeight,
      showTable: this.showTable,
      table: () =>
        html`<camo-chart-data-table
          caption="${this.title} data"
          .categories=${slices.map((s) => s.label)}
          .series=${[{ name: "Value", values: slices.map((s) => Math.max(0, s.value)) }]}
          .format=${this.valueFormat ?? undefined}
        ></camo-chart-data-table>`,
      plot: () => this.#plot(style),
      onLegend: (i) => this.toggleItem(i),
      onTable: () => this.toggleTable(),
    });
  }

  #plot(style: ResolvedChartStyle): TemplateResult {
    const size = this.plotHeight;
    const outer = Math.max(0, size / 2 - 8 - style.selectedOffset);
    const inner = this.donut ? outer * (1 - style.donutThickness) : 0;
    const angles: SliceAngle[] = sliceAngles(
      this.#shown.map((i) => this.slices[i]!.value),
      this.startAngle,
    );
    const colors = this.#shown.map((i) => seriesColor(style, i, this.slices[i]!.color));
    const walk = this.walk !== null && this.walk[0] < this.#shown.length ? this.walk[0] : null;
    const hover = this.hover !== null && this.hover < this.#shown.length ? this.hover : null;
    const active = hover ?? walk;
    const selected = this.selected === null ? null : this.#shown.indexOf(this.selected);
    const labels = this.#shown.map((i, position) => {
      const share = this.#share(i);
      return share < style.labelThreshold
        ? null
        : { text: shareText(share), color: onColor(colors[position]!) };
    });
    const summary = `${this.title}. ${pieSummary(this.donut ? "Donut chart" : "Pie chart", this.slices)}`;
    return html`<div
        class="plot pie-plot ${style.animate ? "animate" : ""}"
        part="plot"
        style="block-size:${size}px"
        tabindex="0"
        role="application"
        aria-roledescription="chart"
        aria-label=${summary}
        @focus=${this.onFocus}
        @blur=${this.onBlur}
        @keydown=${this.onKey}
      >
        <div
          class="area square"
          style="inline-size:min(100%, ${size}px)"
          @pointermove=${(e: PointerEvent) => (this.hover = this.#position(e))}
          @pointerleave=${this.onLeave}
          @click=${(e: Event) => {
            const position = this.#position(e);
            if (position !== null) this.#select(position);
          }}
        >
          <div aria-hidden="true">
            ${this.context.renderer.pieChart(
              {
                size,
                outer,
                inner,
                angles,
                colors,
                labels,
                selected: selected === null || selected < 0 ? null : selected,
                active,
              },
              style,
            )}
          </div>
          ${
            this.donut && inner > 0
              ? html`<div class="hole" style="inline-size:${((inner * 2) / size) * 100}%">
                  <slot name="center"></slot>
                </div>`
              : nothing
          }
          ${
            active === null
              ? nothing
              : this.#tooltip(active, angles[active]!, colors[active]!, size, (outer + inner) / 2)
          }
        </div>
      </div>
      <div class="sr" aria-live="polite">${walk === null ? "" : this.#text(this.#shown[walk]!)}</div>`;
  }

  #tooltip(
    position: number,
    angle: SliceAngle,
    color: ChartColor,
    size: number,
    radius: number,
  ): TemplateResult {
    const index = this.#shown[position]!;
    const slice = this.slices[index]!;
    const anchor = polar(size / 2, size / 2, radius, angle.start + angle.sweep / 2);
    return tooltipTemplate(
      {
        title: slice.label,
        rows: [
          {
            color: color.css,
            text: `${this.#format(slice.value)} (${shareText(this.#share(index))})`,
          },
        ],
        at: anchor.x / size,
      },
      true,
    );
  }

  #text(index: number): string {
    const slice = this.slices[index]!;
    const selected = index === this.selected ? ", selected" : "";
    return `${slice.label}, ${shareText(this.#share(index))}, ${this.#format(slice.value)}${selected}`;
  }
}
