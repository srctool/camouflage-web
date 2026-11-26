import { LitElement, css, html } from "lit";
import type { CSSResult, PropertyDeclarations, TemplateResult } from "lit";
import { formatChartNumber } from "../math/scale.ts";
import type { ChartSeries } from "../math/summary.ts";

/**
 * `<camo-chart-data-table caption="Sales" categories='["Jan"]' series='[{"name":"North","values":[3]}]'>`
 *
 * A chart's data as a table: a row per category, a column per series, "-" for a gap. Nothing a chart shows is only
 * visual.
 *
 * @tagname camo-chart-data-table
 * @attr {string} caption - The table's accessible name.
 * @attr {string} categories - The row headings, a JSON list.
 * @attr {string} series - A JSON list of `{ name, values }`.
 */
export class CamoChartDataTable extends LitElement {
  static override properties: PropertyDeclarations = {
    caption: { type: String },
    categories: { type: Array },
    series: { type: Array },
    format: { attribute: false },
  };

  static override styles: CSSResult = css`
    :host {
      display: block;
      block-size: 100%;
      color: var(--camo-color-on-surface);
    }
    .scroll {
      block-size: 100%;
      overflow: auto;
    }
    .scroll:focus-visible {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: -2px;
    }
    table {
      inline-size: 100%;
      border-collapse: collapse;
      font: var(--camo-type-body-medium-weight) var(--camo-type-body-medium-size) /
        var(--camo-type-body-medium-line-height) var(--camo-type-body-medium-family);
    }
    caption {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
    th,
    td {
      padding: var(--camo-spacing-xs) var(--camo-spacing-s);
      border-block-end: 1px solid var(--camo-color-outline-variant);
      text-align: start;
    }
    thead th {
      position: sticky;
      inset-block-start: 0;
      background: var(--camo-color-surface);
      font-size: var(--camo-type-label-large-size);
    }
    th[scope="row"] {
      font-weight: inherit;
    }
    td {
      text-align: end;
      font-variant-numeric: tabular-nums;
    }
    thead th + th {
      text-align: end;
    }
  `;

  declare caption: string;
  declare categories: readonly string[];
  declare series: readonly ChartSeries[];
  /** How values are written; a property only. */
  declare format: ((value: number) => string) | undefined;

  constructor() {
    super();
    this.caption = "";
    this.categories = [];
    this.series = [];
    this.format = undefined;
  }

  override render(): TemplateResult {
    const format = this.format ?? formatChartNumber;
    const series = this.series ?? [];
    return html`<div class="scroll" tabindex="0" role="region" aria-label=${this.caption}>
      <table>
        <caption>${this.caption}</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            ${series.map((s) => html`<th scope="col">${s.name}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${(this.categories ?? []).map(
            (category, row) =>
              html`<tr>
                <th scope="row">${category}</th>
                ${series.map((s) => {
                  const v = s.values[row];
                  return html`<td>${v === null || v === undefined ? "-" : format(v)}</td>`;
                })}
              </tr>`,
          )}
        </tbody>
      </table>
    </div>`;
  }
}
