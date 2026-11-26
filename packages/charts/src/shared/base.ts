// What the chart elements share: the skin, theme and style in force, the title, and for those with a plot, the legend's
// hidden series, the pointer, and the keyboard walk.
import { ContextConsumer } from "@lit/context";
import { CamouflageController, tokens } from "@srctool/camouflage-core";
import { LitElement, isServer } from "lit";
import type { PropertyDeclarations } from "lit";
import { walkTarget } from "../math/summary.ts";
import { chartRendererContext, defaultChartRenderer } from "../renderer.ts";
import type { ChartRenderer } from "../renderer.ts";
import { resolveChartStyle } from "../style.ts";
import type { ChartStyle, ResolvedChartStyle } from "../style.ts";
import type { CamoTheme } from "@srctool/camouflage-core";

/** Reads the skin, the theme, the renderer and the chart style for an element. */
export class ChartContext {
  readonly #cx: CamouflageController;
  readonly #renderer: ContextConsumer<typeof chartRendererContext, LitElement>;

  constructor(host: LitElement) {
    this.#cx = new CamouflageController(host);
    this.#renderer = new ContextConsumer(host, { context: chartRendererContext, subscribe: true });
  }

  get theme(): CamoTheme | undefined {
    return this.#cx.theme;
  }

  /** The theme's variables, to write into CSS. */
  get tokens(): CamoTheme {
    return tokens;
  }

  get renderer(): ChartRenderer {
    return this.#renderer.value ?? defaultChartRenderer;
  }

  style(overrides: ChartStyle | null): ResolvedChartStyle {
    return resolveChartStyle(this.#cx.skin?.name, this.#cx.theme, overrides);
  }
}

/** The base of every element with a frame: its title and the frame's switches. */
export class CamoChartBase extends LitElement {
  static override properties: PropertyDeclarations = {
    title: { type: String },
    loading: { type: Boolean, reflect: true },
    showTable: { type: Boolean, attribute: "show-table", reflect: true },
    plotHeight: { type: Number, attribute: "plot-height" },
    chartStyle: { type: Object, attribute: "chart-style" },
  };

  declare title: string;
  declare loading: boolean;
  declare showTable: boolean;
  declare plotHeight: number;
  declare chartStyle: ChartStyle | null;

  protected readonly context: ChartContext = new ChartContext(this);
  #stripping = false;

  constructor() {
    super();
    this.title = "";
    this.loading = false;
    this.showTable = false;
    this.plotHeight = 220;
    this.chartStyle = null;
  }

  /**
   * A `title` attribute would also show the browser's tooltip over the whole chart, so it is read into the property and
   * taken off.
   */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (name === "title" && value === null && this.#stripping) return;
    super.attributeChangedCallback(name, old, value);
    if (name === "title" && value !== null && !isServer) {
      this.#stripping = true;
      this.removeAttribute("title");
      this.#stripping = false;
    }
  }

  protected toggleTable(): void {
    this.showTable = !this.showTable;
    this.dispatchEvent(
      new CustomEvent("camo-show-table-change", {
        detail: { showTable: this.showTable },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

/** The base of a chart with a plot that can be pointed at and walked with the keys. */
export abstract class CamoPlotChart extends CamoChartBase {
  static override properties: PropertyDeclarations = {
    hiddenItems: { state: true, attribute: false },
    hover: { state: true, attribute: false },
    walk: { state: true, attribute: false },
  };

  /** The legend entries that are off, by index. */
  declare hiddenItems: ReadonlySet<number>;
  /** What the pointer is on: a category, a bar or a slice, as the chart counts them. */
  declare hover: number | null;
  /** Where the keyboard is, as `[category, series]`. */
  declare walk: [number, number] | null;

  constructor() {
    super();
    this.hiddenItems = new Set();
    this.hover = null;
    this.walk = null;
  }

  protected toggleItem(index: number): void {
    const next = new Set(this.hiddenItems);
    if (!next.delete(index)) next.add(index);
    this.hiddenItems = next;
    this.hover = null;
    this.walk = null;
  }

  /** How many categories and series the walk moves over. */
  protected abstract extent(): { categories: number; series: number; linear?: boolean };

  /** Enter or Space on the focused point. */
  protected activate(): boolean {
    return false;
  }

  protected readonly onFocus = (event: FocusEvent): void => {
    // A click focuses too; only keyboard focus starts the walk.
    if ((event.target as HTMLElement).matches(":focus-visible")) this.walk ??= [0, 0];
  };

  protected readonly onBlur = (): void => {
    this.walk = null;
  };

  protected readonly onLeave = (): void => {
    this.hover = null;
  };

  protected readonly onKey = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      if (this.walk === null && this.hover === null) return;
      this.walk = null;
      this.hover = null;
    } else if (event.key === "Enter" || event.key === " ") {
      if (!this.activate()) return;
    } else {
      const { categories, series, linear } = this.extent();
      const next = walkTarget(event.key, this.walk ?? [0, 0], categories, series, linear);
      if (next === null) return;
      // The first press from nowhere lands on the first point.
      this.walk = this.walk === null ? [0, 0] : next;
      this.hover = null;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  /** Where the pointer is over an element, from its left and top edges, as fractions of its size. */
  protected pointerFraction(event: PointerEvent, area: Element): { x: number; y: number } {
    const box = area.getBoundingClientRect();
    return {
      x: box.width === 0 ? 0 : (event.clientX - box.left) / box.width,
      y: box.height === 0 ? 0 : (event.clientY - box.top) / box.height,
    };
  }

  protected get isRtl(): boolean {
    return !isServer && getComputedStyle(this).direction === "rtl";
  }
}
