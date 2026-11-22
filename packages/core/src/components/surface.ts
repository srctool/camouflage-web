import { LitElement, css, html } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { CamouflageController } from "../controller.ts";
import type { ElevationName, ShapeName, SurfaceLevel, SurfaceState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = { content: "" } as const;

/**
 * `<camo-surface level="low" shape="large" elevation="level1" border>…</camo-surface>`
 *
 * A region of a surface level, a shape and a depth, painted by the skin's surface treatment (flat in Minimal, a soft
 * shadow in Cupertino Classic). It sets the content color for everything inside, so text and icons in it are readable
 * on any level. A pure container: no role, not focusable.
 *
 * @tagname camo-surface
 * @slot - The content.
 * @attr {"lowest"|"low"|"surface"|"container"|"high"|"highest"} level - Which surface role to paint.
 * @attr {"none"|"extra-small"|"small"|"medium"|"large"|"extra-large"|"full"} shape - The corner radius role; the content is clipped to it.
 * @attr {"level0"|"level1"|"level2"|"level3"|"level4"|"level5"} elevation - Semantic depth; the skin decides how it looks.
 * @attr {boolean} border - A hairline outline, for panels.
 */
export class CamoSurface extends LitElement {
  static override properties: PropertyDeclarations = {
    level: { type: String, reflect: true },
    shape: { type: String, reflect: true },
    elevation: { type: String, reflect: true },
    border: { type: Boolean, reflect: true },
  };

  static override styles: CSSResult = css`
    :host {
      display: block;
    }
  `;

  declare level: SurfaceLevel;
  declare shape: ShapeName;
  declare elevation: ElevationName;
  declare border: boolean;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);

  constructor() {
    super();
    this.level = "surface";
    this.shape = "none";
    this.elevation = "level0";
    this.border = false;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    // A container with no role of its own: its content keeps its semantics.
    applyAria(this, this.#internals, { role: "generic" });
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`<slot></slot>`;
    const renderer = skin.surface;
    const state: SurfaceState = {
      level: this.level,
      shape: this.shape,
      elevation: this.elevation,
      border: this.border,
    };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: SLOTS,
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
    })}`;
  }
}
