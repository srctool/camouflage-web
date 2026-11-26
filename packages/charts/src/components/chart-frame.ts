import { html } from "lit";
import type { CSSResult, PropertyDeclarations, TemplateResult } from "lit";
import { CamoChartBase } from "../shared/base.ts";
import { frameTemplate } from "../shared/frame.ts";
import type { LegendItem } from "../shared/frame.ts";
import { frameStyles, sharedStyles } from "../shared/styles.ts";

/**
 * `<camo-chart-frame title="Uptime" summary="Uptime, 99.9% this month"><my-drawing></my-drawing></camo-chart-frame>`
 *
 * What the charts are wrapped in, for a drawing of your own: the title, a legend of toggle chips, the plot (one image
 * named by the title and `summary`) and, when there is a `table` slot, a switch to the same data as a table. The frame
 * reports; the app owns the legend's state and `show-table`.
 *
 * @tagname camo-chart-frame
 * @slot - The plot.
 * @slot table - The same data as a table.
 * @slot empty - What stands in when `is-empty` is set; by default "No data".
 * @attr {string} title - The chart's name.
 * @attr {string} summary - What the plot shows, in words.
 * @attr {string} legend - A JSON list of `{ label, color, visible }`.
 * @attr {boolean} loading - A skeleton stands in.
 * @attr {boolean} is-empty - There is nothing to draw.
 * @attr {boolean} show-table - The table replaces the plot.
 * @attr {number} plot-height - The plot's height in px.
 * @fires camo-legend-toggle - A legend chip was pressed; `detail.index`.
 * @fires camo-show-table-change - The table switch was pressed; `detail.showTable`.
 */
export class CamoChartFrame extends CamoChartBase {
  static override properties: PropertyDeclarations = {
    summary: { type: String },
    legend: { type: Array },
    isEmpty: { type: Boolean, attribute: "is-empty", reflect: true },
    hasTable: { state: true, attribute: false },
  };

  static override styles: CSSResult[] = [sharedStyles, frameStyles];

  declare summary: string;
  declare legend: readonly LegendItem[];
  declare isEmpty: boolean;
  /** Whether the app slotted a table; only a browser can tell. */
  declare hasTable: boolean;

  constructor() {
    super();
    this.summary = "";
    this.legend = [];
    this.isEmpty = false;
    this.hasTable = false;
  }

  override firstUpdated(): void {
    this.hasTable = this.querySelector(':scope > [slot="table"]') !== null;
  }

  override render(): TemplateResult {
    return frameTemplate({
      title: this.title,
      legend: this.legend ?? [],
      loading: this.loading,
      empty: this.isEmpty,
      plotHeight: this.plotHeight,
      showTable: this.showTable,
      table: this.hasTable ? () => html`<slot name="table"></slot>` : null,
      plot: () =>
        html`<div role="img" aria-label="${this.title}. ${this.summary}" style="min-block-size:${this.plotHeight}px">
          <slot></slot>
        </div>`,
      onLegend: (index) =>
        this.dispatchEvent(
          new CustomEvent("camo-legend-toggle", {
            detail: { index },
            bubbles: true,
            composed: true,
          }),
        ),
      onTable: () => this.toggleTable(),
    });
  }
}
