import { LitElement, css, html, isServer } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { CamouflageController } from "../controller.ts";
import type { ListSectionState, SurfaceLevel } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = { content: "" } as const;

/**
 * `<camo-list-section title="Network" footer="Wi-Fi uses your plan when off"><camo-list-item …></…></camo-list-section>`
 *
 * A titled group of `camo-list-item`s. It draws the dividers between its rows as the skin's list theme says (inset from
 * where the text starts, or full, or none) and the section's fill and shape: edge to edge in Minimal, an inset grouped
 * panel in Cupertino. The title is a heading and names the group.
 *
 * @tagname camo-list-section
 * @slot - The `camo-list-item` rows.
 * @attr {string} title - The section's title, a heading.
 * @attr {string} footer - A note under the section.
 * @attr {"lowest"|"low"|"surface"|"container"|"high"|"highest"} level - The fill of the section (a surface role).
 */
export class CamoListSection extends LitElement {
  static override properties: PropertyDeclarations = {
    title: { type: String },
    footer: { type: String },
    level: { type: String, reflect: true },
  };

  static override styles: CSSResult = css``;

  declare title: string;
  declare footer: string | null;
  declare level: SurfaceLevel;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  #stripping = false;

  constructor() {
    super();
    this.title = "";
    this.footer = null;
    this.level = "surface";
  }

  /** A `title` attribute would also show the browser's tooltip over the whole section, so it is read and removed. */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (name === "title" && value === null && this.#stripping) return;
    super.attributeChangedCallback(name, old, value);
    if (name === "title" && value !== null && !isServer) {
      this.#stripping = true;
      this.removeAttribute("title");
      this.#stripping = false;
    }
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, {
      role: "group",
      label: this.title === "" ? null : this.title,
    });
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`<slot></slot>`;
    const renderer = skin.listSection;
    const state: ListSectionState = {
      title: this.title === "" ? null : this.title,
      footer: this.footer === "" ? null : this.footer,
      level: this.level,
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
