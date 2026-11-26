import { applyAria, toneFamily } from "@srctool/camouflage-core";
import type { Tone } from "@srctool/camouflage-core";
import { LitElement, html } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { dataRange, downsample, sparklinePoints, sparklineSummary } from "../math/spark.ts";
import type { SparklineHighlight, SparklineKind } from "../renderer.ts";
import type { ChartStyle } from "../style.ts";
import { ChartContext } from "../shared/base.ts";
import { plotStyles, sharedStyles, sparklineStyles } from "../shared/styles.ts";

/** "0 100" (or "0,100") as a range; anything else reads the data. */
function parseRange(range: string | null): { low: number; high: number } | null {
  const [low, high] = (range ?? "")
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
  return low !== undefined && high !== undefined && Number.isFinite(low) && Number.isFinite(high)
    ? { low, high }
    : null;
}

/**
 * `<camo-sparkline values="[3,5,4,9]" description="Signups, last 30 days">`
 *
 * A small trend with no axes, grid or legend, for a row or a card. It is 100 by 28 px unless sized by CSS. It scales to
 * the data or to `range`, breaks the line at `null`, draws one value as a dot, and keeps the peaks when there are more
 * values than pixels. It is one image whose text is the summary ("Signups, last 30 days: from 3 to 9, up 200%"), so the
 * direction is never only a color, and it takes no focus.
 *
 * @tagname camo-sparkline
 * @attr {string} values - A JSON list of numbers; `null` is a gap.
 * @attr {"line"|"area"|"bars"} kind - The form.
 * @attr {string} range - "low high" to scale to; absent reads the data.
 * @attr {"none"|"last"|"extremes"} highlight - Which points get a dot.
 * @attr {"default"|"error"|"success"|"warning"|"info"} tone - The color family.
 * @attr {string} description - What the trend is of; it leads the spoken summary.
 * @attr {string} chart-style - JSON overrides of the chart style.
 */
export class CamoSparkline extends LitElement {
  static override properties: PropertyDeclarations = {
    values: { type: Array },
    kind: { type: String, reflect: true },
    range: { type: String },
    highlight: { type: String, reflect: true },
    tone: { type: String, reflect: true },
    description: { type: String },
    chartStyle: { type: Object, attribute: "chart-style" },
    pixels: { state: true, attribute: false },
  };

  static override styles: CSSResult[] = [sharedStyles, plotStyles, sparklineStyles];

  declare values: readonly (number | null)[];
  declare kind: SparklineKind;
  declare range: string | null;
  declare highlight: SparklineHighlight;
  declare tone: Tone;
  declare description: string | null;
  declare chartStyle: ChartStyle | null;
  /** The width in pixels, measured in the browser; a server assumes the default 100. */
  declare pixels: number;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #context: ChartContext = new ChartContext(this);
  #observer: ResizeObserver | null = null;

  constructor() {
    super();
    this.values = [];
    this.kind = "line";
    this.range = null;
    this.highlight = "last";
    this.tone = "default";
    this.description = null;
    this.chartStyle = null;
    this.pixels = 100;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof ResizeObserver === "undefined") return;
    this.#observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry!.contentRect.width);
      if (width > 0) this.pixels = width;
    });
    this.#observer.observe(this);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#observer?.disconnect();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, {
      role: "img",
      label: sparklineSummary(this.values ?? [], this.description),
    });
  }

  override render(): TemplateResult {
    // A sparkline's bars are thinner and its dot smaller than a chart's, unless asked otherwise.
    const resolved = this.#context.style(this.chartStyle);
    const style = {
      ...resolved,
      barRadius: Math.min(resolved.barRadius, 2),
      barGap: Math.min(resolved.barGap, 2),
      markerSize: Math.min(resolved.markerSize, 5),
      ...this.chartStyle,
      palette: resolved.palette,
    };
    const values = this.values ?? [];
    const range = parseRange(this.range) ?? dataRange(values, this.kind === "bars");
    const points = sparklinePoints(downsample(values, Math.max(1, this.pixels)), range);
    const color = toneFamily(this.#context.tokens, this.tone).strong;
    const inset = Math.max(style.lineWidth, style.markerSize) / 2;
    return html`<div class="box ${style.animate ? "animate" : ""}" style="padding:${inset}px" aria-hidden="true">
      <div class="area">
        ${this.#context.renderer.sparkline(
          { kind: this.kind, points, highlight: this.highlight, color },
          style,
        )}
      </div>
    </div>`;
  }
}
