import { LitElement, css, html } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { CamouflageController } from "../controller.ts";
import type { DividerInset, DividerOrientation, DividerState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

/**
 * `<camo-divider orientation="vertical" inset="middle"></camo-divider>`
 *
 * A hairline between groups. Decorative: hidden from assistive technology, because grouping is conveyed by lists and
 * headings, not by the line. A vertical divider takes the height of the row it sits in.
 *
 * @tagname camo-divider
 * @attr {"horizontal"|"vertical"} orientation - The direction of the line.
 * @attr {"none"|"start"|"middle"} inset - Leaves space at the start, or at both ends (the line starts after a list's icon column).
 */
export class CamoDivider extends LitElement {
  static override properties: PropertyDeclarations = {
    orientation: { type: String, reflect: true },
    inset: { type: String, reflect: true },
  };

  static override styles: CSSResult = css`
    :host {
      display: block;
      flex: none;
    }
    :host([orientation="vertical"]) {
      display: inline-block;
      align-self: stretch;
      vertical-align: middle;
    }
  `;

  declare orientation: DividerOrientation;
  declare inset: DividerInset;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);

  constructor() {
    super();
    this.orientation = "horizontal";
    this.inset = "none";
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, { role: "presentation", hidden: true });
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html``;
    const renderer = skin.divider;
    const state: DividerState = { orientation: this.orientation, inset: this.inset };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: {},
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
    })}`;
  }
}
