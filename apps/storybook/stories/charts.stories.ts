import { html } from "lit";
import { ref } from "lit/directives/ref.js";
import type { Meta, StoryObj } from "@storybook/web-components-vite";

const meta: Meta = { title: "Charts/Charts and dashboard" };
export default meta;
type Story = StoryObj;

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const revenue = [
  { name: "Subscriptions", values: [42, 51, 48, 60, 72, 81] },
  { name: "Services", values: [30, 28, 39, 44, 41, 55] },
];
const regions = [
  { name: "North", values: [120, 150, 138, 170] },
  { name: "South", values: [90, 85, 110, 130] },
  { name: "West", values: [60, 72, 80, 76] },
];
const traffic = [
  { label: "Search", value: 4500 },
  { label: "Direct", value: 2800 },
  { label: "Social", value: 1500 },
  { label: "Email", value: 900 },
];

type El = HTMLElement & Record<string, unknown>;

/** A segmented control that sets a property on the chart with `id`. */
const choose = (label: string, property: string, id: string, options: [string, string][]) =>
  html`<camo-segmented-control
    label=${label}
    value=${options[0]![0]}
    @change=${(e: Event) => {
      const control = e.target as HTMLElement & { value: string };
      const root = control.getRootNode() as Document | ShadowRoot;
      (root.querySelector(`#${id}`) as El)[property] = control.value;
    }}
  >
    ${options.map(([value, text]) => html`<camo-segment value=${value} label=${text}></camo-segment>`)}
  </camo-segmented-control>`;

const tile = (label: string, figure: string, values: number[], tone = "default") =>
  html`<camo-card appearance="outline">
    <div style="display:grid;gap:4px">
      <camo-text variant="label-large" text=${label}></camo-text>
      <div style="display:flex;justify-content:space-between;align-items:end;gap:12px">
        <camo-text variant="headline-small" text=${figure}></camo-text>
        <camo-sparkline .values=${values} kind="area" tone=${tone} description="${label}, last 8 weeks"></camo-sparkline>
      </div>
    </div>
  </camo-card>`;

export const Dashboard: Story = {
  render: () => html`<div style="display:grid;gap:16px;max-inline-size:760px">
    <div style="display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
      ${tile("Signups", "1,204", [3, 5, 4, 8, 6, 9, 7, 12], "success")}
      ${tile("Churn", "2.1%", [9, 8, 8, 6, 7, 5, 4, 3])}
      ${tile("Errors", "37", [2, 3, 2, 4, 9, 7, 12, 15], "error")}
    </div>
    <camo-card appearance="outline">
      <div style="display:grid;gap:12px">
        ${choose("Form", "kind", "revenue", [
          ["line", "Line"],
          ["area", "Area"],
          ["stacked-area", "Stacked"],
        ])}
        <camo-line-chart id="revenue" title="Revenue" curve="smooth" .categories=${months} .series=${revenue}></camo-line-chart>
      </div>
    </camo-card>
    <camo-card appearance="outline">
      <div style="display:grid;gap:12px">
        <div style="display:flex;flex-wrap:wrap;gap:12px">
          ${choose("Bars", "mode", "regions", [
            ["grouped", "Grouped"],
            ["stacked", "Stacked"],
          ])}
          ${choose("Direction", "orientation", "regions", [
            ["vertical", "Vertical"],
            ["horizontal", "Horizontal"],
          ])}
        </div>
        <camo-bar-chart id="regions" title="By region" value-labels .categories=${["Q1", "Q2", "Q3", "Q4"]} .series=${regions}></camo-bar-chart>
      </div>
    </camo-card>
    <camo-card appearance="outline">
      <camo-pie-chart
        title="Traffic sources"
        donut
        .slices=${traffic}
        ${ref((el) =>
          el?.addEventListener("camo-select", (e) => {
            (el as El)["selected"] = (e as CustomEvent<{ index: number | null }>).detail.index;
          }),
        )}
      >
        <camo-text slot="center" variant="title-large" text="9,700"></camo-text>
      </camo-pie-chart>
    </camo-card>
  </div>`,
};

export const LineCharts: Story = {
  render: () => html`<div style="display:grid;gap:24px;max-inline-size:480px">
    <camo-line-chart title="Linear" .categories=${months} .series=${revenue} markers="always"></camo-line-chart>
    <camo-line-chart title="Step" curve="step" .categories=${months} .series=${revenue}></camo-line-chart>
    <camo-line-chart
      title="Over time"
      kind="area"
      curve="catmull-rom"
      .categories=${months}
      .series=${[revenue[0]]}
      .times=${months.map((_, i) => Date.UTC(2026, i, 1))}
    ></camo-line-chart>
  </div>`,
};

export const States: Story = {
  render: () => html`<div style="display:grid;gap:24px;max-inline-size:480px">
    <camo-line-chart title="Loading" loading></camo-line-chart>
    <camo-bar-chart title="Nothing yet"></camo-bar-chart>
    <camo-pie-chart title="As a table" show-table .slices=${traffic}></camo-pie-chart>
  </div>`,
};
