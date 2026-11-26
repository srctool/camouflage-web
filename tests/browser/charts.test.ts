import { inspectAria } from "@srctool/camouflage-core";
import { CamoCharts, defaultChartRenderer } from "@srctool/camouflage-charts";
import { html } from "lit";
import { userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { mount, settled } from "./helpers.ts";

type El = HTMLElement & Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

async function page(skin: string, body: string, dir = "ltr"): Promise<HTMLElement> {
  const root = mount(
    `<div dir="${dir}"><camo-provider skin="${skin}" scheme="light" style="display:block;padding:24px">${body}</camo-provider></div>`,
  );
  await settled(root);
  return root;
}
const q = (root: ParentNode, selector: string): El => root.querySelector(selector) as El;
const inner = (el: Element, selector: string): HTMLElement =>
  el.shadowRoot!.querySelector<HTMLElement>(selector)!;
const all = (el: Element, selector: string): HTMLElement[] => [
  ...el.shadowRoot!.querySelectorAll<HTMLElement>(selector),
];
const live = (el: Element): string => inner(el, "[aria-live]").textContent!.trim();
/** The tooltip's lines, joined by spaces. */
const tip = (el: Element): string =>
  [...(el.shadowRoot!.querySelector(".tip")?.children ?? [])]
    .map((line) => line.textContent!.trim())
    .join(" ");
const json = (value: unknown): string => JSON.stringify(value).replace(/'/g, "&#39;");

/** Points at a place in an element, as fractions of its box. */
function point(target: Element, x: number, y: number, type = "pointermove"): void {
  const box = target.getBoundingClientRect();
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      composed: true,
      clientX: box.left + box.width * x,
      clientY: box.top + box.height * y,
    }),
  );
}

const cats = ["Jan", "Feb", "Mar"];
const two = [
  { name: "North", values: [10, 30, 20] },
  { name: "South", values: [5, 15, 25] },
];
const data = (extra = "", series: unknown = two): string =>
  `title="Sales" categories='${json(cats)}' series='${json(series)}' chart-style='{"animate":false}' style="width:400px" ${extra}`;

async function walkInto(el: El): Promise<void> {
  inner(el, ".plot").focus({ focusVisible: true } as FocusOptions);
  await userEvent.keyboard("{ArrowRight}");
  await el.updateComplete;
}

describe.each(["minimal", "cupertino"])("camo-line-chart under %s", (skin) => {
  const chart = async (extra = "", series: unknown = two, dir = "ltr"): Promise<El> =>
    q(
      await page(skin, `<camo-line-chart ${data(extra, series)}></camo-line-chart>`, dir),
      "camo-line-chart",
    );

  it("is one named plot, with the title read and not left as a tooltip", async () => {
    const el = await chart();
    expect(el.hasAttribute("title")).toBe(false);
    const plot = inner(el, ".plot");
    expect(plot.getAttribute("role")).toBe("application");
    expect(plot.getAttribute("aria-label")).toContain("Sales. Line chart, 2 series, 3 categories");
    expect(plot.tabIndex).toBe(0);
    expect(all(el, "svg.marks path")).toHaveLength(2);
  });

  it("walks the points with the keys, announces them, and Escape hides", async () => {
    const el = await chart();
    await walkInto(el);
    expect(live(el)).toMatch(/^(Jan, North, 10|Feb, North, 30)$/);
    await userEvent.keyboard("{Home}{ArrowRight}{ArrowDown}");
    await el.updateComplete;
    expect(live(el)).toBe("Feb, South, 15");
    expect(tip(el)).toBe("Feb North: 30 South: 15");
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    expect(live(el)).toBe("");
    expect(tip(el)).toBe("");
  });

  it("shows the nearest category under the pointer, and mirrors that in right-to-left", async () => {
    const el = await chart();
    point(inner(el, ".area"), 0.95, 0.5);
    await el.updateComplete;
    expect(tip(el)).toBe("Mar North: 20 South: 25");
    inner(el, ".area").dispatchEvent(new PointerEvent("pointerleave"));
    await el.updateComplete;
    expect(tip(el)).toBe("");
    const rtl = await chart("", two, "rtl");
    point(inner(rtl, ".area"), 0.95, 0.5);
    await rtl.updateComplete;
    expect(tip(rtl)).toContain("Jan");
  });

  it("keeps a time axis running left to right", async () => {
    const el = await chart(`times="[1767225600000,1769904000000,1772323200000]"`, two, "rtl");
    expect(inner(el, ".plot").getAttribute("dir")).toBe("ltr");
    point(inner(el, ".area"), 0.95, 0.5);
    await el.updateComplete;
    expect(tip(el)).toContain("Mar");
  });

  it("turns a series off from the legend, and back", async () => {
    const el = await chart();
    const chips = all(el, ".legend camo-chip");
    expect(chips.map((c) => c.getAttribute("label"))).toEqual(["North", "South"]);
    chips[0]!.click();
    await el.updateComplete;
    expect(all(el, "svg.marks path")).toHaveLength(1);
    expect(chips[0]!.hasAttribute("selected")).toBe(false);
    await walkInto(el);
    expect(live(el)).toContain("South");
    chips[0]!.click();
    await el.updateComplete;
    expect(all(el, "svg.marks path")).toHaveLength(2);
  });

  it("shows the same data as a table, with gaps as a dash", async () => {
    const el = await chart("", [{ name: "North", values: [10, null, 20] }]);
    let shown: boolean | undefined;
    el.addEventListener("camo-show-table-change", (e: CustomEvent) => (shown = e.detail.showTable));
    inner(el, ".toggle").click();
    await settled(el.shadowRoot!);
    expect(shown).toBe(true);
    expect(el.shadowRoot!.querySelector(".plot")).toBeNull();
    const table = inner(el, "camo-chart-data-table");
    expect(inner(table, "table caption").textContent).toBe("Sales data");
    expect(all(table, "tbody tr").map((r) => r.textContent!.replace(/\s+/g, " ").trim())).toEqual([
      "Jan 10",
      "Feb -",
      "Mar 20",
    ]);
  });

  it("adds the total to a stacked area's tooltip", async () => {
    const el = await chart(`kind="stacked-area"`);
    point(inner(el, ".area"), 0, 0.5);
    await el.updateComplete;
    expect(tip(el)).toContain("Total: 15");
  });

  it("has an empty state and a loading one", async () => {
    const empty = await chart("", []);
    expect(inner(empty, ".message slot").textContent).toBe("No data");
    expect(empty.shadowRoot!.querySelector(".toggle")).toBeNull();
    const loading = await chart("loading");
    expect(inner(loading, "camo-skeleton")).not.toBeNull();
    expect(loading.shadowRoot!.querySelector(".plot")).toBeNull();
  });

  it("takes data and axis formats as properties", async () => {
    const el = await chart();
    el.series = [{ name: "East", values: [1, 2, 3] }];
    el.yAxis = { format: (v: number) => `${v} kg` };
    await el.updateComplete;
    await walkInto(el);
    expect(live(el)).toMatch(/East, [12] kg/);
  });
});

describe.each(["minimal", "cupertino"])("camo-bar-chart under %s", (skin) => {
  const chart = async (extra = "", series: unknown = two, dir = "ltr"): Promise<El> =>
    q(
      await page(skin, `<camo-bar-chart ${data(extra, series)}></camo-bar-chart>`, dir),
      "camo-bar-chart",
    );
  const rects = (el: El): DOMRect[] => all(el, ".bar").map((b) => b.getBoundingClientRect());

  it("puts grouped bars side by side from zero, a gap apart", async () => {
    const el = await chart();
    const [north, south] = rects(el);
    expect(south!.left).toBeGreaterThan(north!.right);
    expect(south!.left - north!.right).toBeLessThanOrEqual(4.5);
    expect(north!.bottom).toBeCloseTo(south!.bottom, 0);
    // 10 is twice 5.
    expect(north!.height / south!.height).toBeCloseTo(2, 0);
  });

  it("piles stacked bars, and runs them sideways when horizontal", async () => {
    const stacked = await chart(`mode="stacked"`);
    const [a, b] = rects(stacked);
    expect(b!.left).toBeCloseTo(a!.left, 0);
    expect(b!.bottom).toBeCloseTo(a!.top, 0);
    const flat = await chart(`orientation="horizontal"`);
    const [c, d] = rects(flat);
    expect(d!.top).toBeGreaterThan(c!.bottom);
    expect(c!.left).toBeCloseTo(d!.left, 0);
    expect(c!.width).toBeGreaterThan(d!.width);
  });

  it("goes the other way below zero, with the radius on the free end only", async () => {
    const el = await chart("", [{ name: "P", values: [10, -10, 5] }]);
    const [up, down] = rects(el);
    expect(down!.top).toBeCloseTo(up!.bottom, 0);
    const style = getComputedStyle(all(el, ".bar")[1]!);
    expect(parseFloat(style.borderBottomLeftRadius)).toBeGreaterThan(0);
    expect(parseFloat(style.borderTopLeftRadius)).toBe(0);
  });

  it("runs from the right in right-to-left", async () => {
    const el = await chart("", two, "rtl");
    const bars = rects(el);
    expect(bars[0]!.left).toBeGreaterThan(bars[4]!.left);
    const flat = await chart(`orientation="horizontal"`, two, "rtl");
    const [a, b] = rects(flat);
    expect(a!.right).toBeCloseTo(b!.right, 0);
  });

  it("writes values at the ends, and a stack's total", async () => {
    const el = await chart("value-labels");
    expect(all(el, ".value").map((v) => v.textContent)).toEqual([
      "10",
      "5",
      "30",
      "15",
      "20",
      "25",
    ]);
    const stacked = await chart(`value-labels mode="stacked"`);
    expect(all(stacked, ".value").map((v) => v.textContent)).toEqual(["15", "45", "45"]);
  });

  it("points at the bar under the pointer, even above it, and dims the rest", async () => {
    const el = await chart();
    const area = inner(el, ".area").getBoundingClientRect();
    const target = rects(el)[1]!;
    point(inner(el, ".area"), (target.left + 2 - area.left) / area.width, 0.02);
    await el.updateComplete;
    expect(tip(el)).toBe("Jan South: 5");
    expect(all(el, ".bar").map((b) => b.style.opacity)).toEqual([
      "0.55",
      "1",
      "0.55",
      "0.55",
      "0.55",
      "0.55",
    ]);
  });

  it("walks the bars with the keys", async () => {
    const el = await chart();
    await walkInto(el);
    await userEvent.keyboard("{Home}{ArrowDown}{End}");
    await el.updateComplete;
    expect(live(el)).toBe("Mar, South, 25");
  });

  it("thins out crowded labels", async () => {
    const many = Array.from({ length: 40 }, (_, i) => `Week ${i + 1}`);
    const root = await page(
      skin,
      `<camo-bar-chart title="W" style="width:300px" categories='${json(many)}' series='${json([{ name: "n", values: many.map(() => 1) }])}'></camo-bar-chart>`,
    );
    const el = q(root, "camo-bar-chart");
    await new Promise((r) => setTimeout(r, 200));
    const visible = all(el, ".below > span").filter((s) => s.style.visibility === "visible");
    expect(visible.length).toBeLessThan(10);
    expect(visible.length).toBeGreaterThan(1);
  });
});

describe.each(["minimal", "cupertino"])("camo-pie-chart under %s", (skin) => {
  const slices = [
    { label: "Search", value: 60 },
    { label: "Direct", value: 40 },
    { label: "Other", value: 0 },
  ];
  const chart = async (extra = "", of: unknown = slices): Promise<El> =>
    q(
      await page(
        skin,
        `<camo-pie-chart title="Traffic" slices='${json(of)}' chart-style='{"animate":false}' style="width:400px" ${extra}><b slot="center">100</b></camo-pie-chart>`,
      ),
      "camo-pie-chart",
    );

  it("names itself by its largest slice, and lists every slice in the legend", async () => {
    const el = await chart();
    expect(inner(el, ".plot").getAttribute("aria-label")).toBe(
      "Traffic. Pie chart, 3 slices, largest: Search 60%",
    );
    expect(all(el, ".legend camo-chip").map((c) => c.getAttribute("label"))).toEqual([
      "Search: 60, 60%",
      "Direct: 40, 40%",
      "Other: 0, 0%",
    ]);
    expect(all(el, "path.slice")).toHaveLength(2);
    expect(all(el, "text.share").map((t) => t.textContent)).toEqual(["60%", "40%"]);
  });

  it("asks the app to select, and to clear, and moves the selected slice out", async () => {
    const el = await chart();
    const chosen: (number | null)[] = [];
    el.addEventListener("camo-select", (e: CustomEvent) => chosen.push(e.detail.index));
    await userEvent.click(all(el, "path.slice")[1]!);
    el.selected = 1;
    await el.updateComplete;
    expect(all(el, "path.slice")[1]!.getAttribute("transform")).not.toBe("translate(0 0)");
    await userEvent.click(all(el, "path.slice")[1]!);
    expect(chosen).toEqual([1, null]);
  });

  it("walks the slices with any arrow and selects with Enter", async () => {
    const el = await chart();
    const chosen: (number | null)[] = [];
    el.addEventListener("camo-select", (e: CustomEvent) => chosen.push(e.detail.index));
    await walkInto(el);
    await userEvent.keyboard("{Home}{ArrowDown}");
    await el.updateComplete;
    expect(live(el)).toBe("Direct, 40%, 40");
    await userEvent.keyboard("{Enter}");
    expect(chosen).toEqual([1]);
  });

  it("recomputes the angles when a slice is turned off", async () => {
    const el = await chart();
    all(el, ".legend camo-chip")[0]!.click();
    await el.updateComplete;
    expect(all(el, "path.slice")).toHaveLength(1);
    expect(all(el, "text.share").map((t) => t.textContent)).toEqual(["100%"]);
  });

  it("holds content in a donut's hole, and is empty when nothing is above zero", async () => {
    const donut = await chart("donut");
    const hole = inner(donut, ".hole").getBoundingClientRect();
    const b = donut.querySelector("b")!.getBoundingClientRect();
    expect(b.left).toBeGreaterThanOrEqual(hole.left);
    expect(b.right).toBeLessThanOrEqual(hole.right);
    const none = await chart("", [{ label: "a", value: 0 }]);
    expect(none.shadowRoot!.querySelector(".plot")).toBeNull();
    expect(inner(none, ".message")).not.toBeNull();
  });
});

describe.each(["minimal", "cupertino"])("camo-sparkline under %s", (skin) => {
  it("is one image that says the trend, and takes no focus", async () => {
    const root = await page(
      skin,
      `<camo-sparkline values="[3,5,9]" description="Signups"></camo-sparkline>`,
    );
    const el = q(root, "camo-sparkline");
    expect(inspectAria(el)).toMatchObject({ role: "img", label: "Signups: from 3 to 9, up 200%" });
    expect(el.shadowRoot!.querySelector("[tabindex]")).toBeNull();
    expect(el.getBoundingClientRect().width).toBe(100);
    expect(el.getBoundingClientRect().height).toBe(28);
  });

  it("breaks at gaps, draws a lone value as a dot, and marks the extremes", async () => {
    const root = await page(
      skin,
      `<camo-sparkline values="[1,2,null,5]" highlight="extremes"></camo-sparkline><camo-sparkline id="bars" values="[1,2,null,5]" kind="bars" highlight="none"></camo-sparkline>`,
    );
    const el = q(root, "camo-sparkline");
    expect(all(el, "svg path")).toHaveLength(1);
    expect(all(el, ".dot")).toHaveLength(3); // the lone 5, and the highest and lowest
    expect(all(q(root, "#bars"), ".spark-bar")).toHaveLength(3);
    expect(all(q(root, "#bars"), ".dot")).toHaveLength(0);
  });
});

describe("the chart parts", () => {
  it("follows a registered preset for the skin's name", async () => {
    CamoCharts.registerPreset("minimal", { lineWidth: 5 });
    try {
      const root = await page("minimal", `<camo-line-chart ${data()}></camo-line-chart>`);
      const path = inner(q(root, "camo-line-chart"), "svg.marks path");
      expect(getComputedStyle(path).strokeWidth).toBe("5px");
    } finally {
      CamoCharts.registerPreset("minimal", {
        lineWidth: 1.5,
        areaOpacity: 0.12,
        barRadius: 2,
        markerSize: 5,
      });
    }
  });

  it("lets a renderer of your own draw the marks inside the frame", async () => {
    const root = await page(
      "minimal",
      `<camo-charts-provider><camo-bar-chart ${data()}></camo-bar-chart></camo-charts-provider>`,
    );
    q(root, "camo-charts-provider").renderer = {
      ...defaultChartRenderer,
      barChart: () => html`<span class="mine"></span>`,
    };
    await settled(root);
    const el = q(root, "camo-bar-chart");
    await el.updateComplete;
    expect(inner(el, ".mine")).not.toBeNull();
    expect(all(el, ".bar")).toHaveLength(0);
    expect(all(el, ".legend camo-chip")).toHaveLength(2);
  });

  it("frames a drawing of the app's own, reporting the legend and the table switch", async () => {
    const root = await page(
      "minimal",
      `<camo-chart-frame title="Uptime" summary="99.9% this month" legend='[{"label":"API","color":"teal"}]'><p>drawing</p><p slot="table">numbers</p></camo-chart-frame>`,
    );
    const el = q(root, "camo-chart-frame");
    await el.updateComplete;
    expect(inner(el, "[role=img]").getAttribute("aria-label")).toBe("Uptime. 99.9% this month");
    const events: unknown[] = [];
    el.addEventListener("camo-legend-toggle", (e: CustomEvent) => events.push(e.detail));
    el.addEventListener("camo-show-table-change", (e: CustomEvent) => events.push(e.detail));
    inner(el, ".legend camo-chip").click();
    inner(el, ".toggle").click();
    await el.updateComplete;
    expect(events).toEqual([{ index: 0 }, { showTable: true }]);
    expect(el.querySelector("[slot=table]")!.getBoundingClientRect().height).toBeGreaterThan(0);
  });
});
