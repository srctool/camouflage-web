// The parts around every chart: the title, the legend of toggle chips, the plot (or the skeleton, the empty slot or the
// table) and the switch to the table. A template function, so the charts and `camo-chart-frame` draw it the same way.
import { html, nothing } from "lit";
import type { TemplateResult } from "lit";

/** One legend entry. */
export interface LegendItem {
  label: string;
  color: string;
  visible?: boolean;
}

export interface FrameParts {
  title: string;
  legend: readonly LegendItem[];
  loading: boolean;
  empty: boolean;
  plotHeight: number;
  showTable: boolean;
  /** The table, when the chart has one: it replaces the plot while `showTable`. */
  table: (() => unknown) | null;
  plot: () => unknown;
  onLegend: (index: number) => void;
  onTable: () => void;
}

export function frameTemplate(f: FrameParts): TemplateResult {
  const shown = !f.loading && !f.empty;
  return html`<div class="frame" part="frame">
    ${f.title === "" ? nothing : html`<div class="title" part="title">${f.title}</div>`}
    ${
      f.legend.length === 0
        ? nothing
        : html`<div class="legend" part="legend">
            ${f.legend.map(
              (item, i) =>
                html`<camo-chip
                  label=${item.label}
                  selectable
                  ?selected=${item.visible !== false}
                  @click=${() => f.onLegend(i)}
                  ><span slot="leading" class="key" style="background:${item.color}"></span
                ></camo-chip>`,
            )}
          </div>`
    }
    ${
      f.loading
        ? html`<camo-skeleton height="${f.plotHeight}px"></camo-skeleton>`
        : f.empty
          ? html`<div class="message" style="min-block-size:${f.plotHeight}px">
              <slot name="empty">No data</slot>
            </div>`
          : f.showTable && f.table !== null
            ? html`<div class="table" style="block-size:${f.plotHeight}px">${f.table()}</div>`
            : f.plot()
    }
    ${
      shown && f.table !== null
        ? html`<camo-chip
            class="toggle"
            label="View as table"
            selectable
            ?selected=${f.showTable}
            @click=${f.onTable}
          ></camo-chip>`
        : nothing
    }
  </div>`;
}
