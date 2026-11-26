import { ContextProvider } from "@lit/context";
import { LitElement, css, html } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { chartRendererContext, defaultChartRenderer } from "../renderer.ts";
import type { ChartRenderer } from "../renderer.ts";

/**
 * `<camo-charts-provider .renderer=${mine}>`: replaces the drawing of the marks for the charts inside. The frame, axes,
 * legend, tooltip, keys and tables stay.
 *
 * @tagname camo-charts-provider
 * @slot - The subtree.
 */
export class CamoChartsProvider extends LitElement {
  static override properties: PropertyDeclarations = {
    renderer: { attribute: false },
  };

  static override styles: CSSResult = css`
    :host {
      display: contents;
    }
  `;

  declare renderer: ChartRenderer | null;

  readonly #provider = new ContextProvider(this, { context: chartRendererContext });

  constructor() {
    super();
    this.renderer = null;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("renderer")) this.#provider.setValue(this.renderer ?? defaultChartRenderer);
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
