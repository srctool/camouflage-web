import { LitElement, css, html } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { CamouflageController } from "../controller.ts";
import { resolveIcon } from "../icons.ts";
import type { IconState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = { content: "" } as const;

/**
 * `<camo-icon name="close" label="Close"></camo-icon>` or `<camo-icon><svg …></svg></camo-icon>`
 *
 * One icon, at the size and in the color its container set (`--camo-icon-size`, `--camo-content-color`), so the same
 * markup follows a button, a toolbar or a list row. The artwork is a name registered with `registerIcons`, or an inline
 * `<svg>` child. With no `label` the icon is decorative and hidden from assistive technology, which is right for every
 * icon inside a component, because the component carries the name.
 *
 * @tagname camo-icon
 * @slot - An inline `<svg>`, when the icon is not registered.
 * @attr {string} name - A name registered with `registerIcons`.
 * @attr {string} label - What the icon means (the contract's `contentDescription`); absent means decorative.
 * @attr {string} size - A CSS length; absent means the container's icon size.
 * @attr {string} tint - A CSS color; absent means the content color of the container.
 * @attr {boolean} auto-mirror - Flips in right-to-left (a back arrow, a chevron).
 * @attr {boolean} original - A multicolor asset: never tinted.
 */
export class CamoIcon extends LitElement {
  static override properties: PropertyDeclarations = {
    name: { type: String },
    label: { type: String },
    size: { type: String },
    tint: { type: String },
    autoMirror: { type: Boolean, attribute: "auto-mirror", reflect: true },
    original: { type: Boolean, reflect: true },
  };

  static override styles: CSSResult = css`
    :host {
      display: inline-flex;
      flex: none;
      vertical-align: middle;
    }
  `;

  declare name: string;
  declare label: string;
  declare size: string | null;
  declare tint: string | null;
  declare autoMirror: boolean;
  declare original: boolean;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);

  constructor() {
    super();
    this.name = "";
    this.label = "";
    this.size = null;
    this.tint = null;
    this.autoMirror = false;
    this.original = false;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    const labelled = this.label !== "";
    applyAria(this, this.#internals, {
      role: labelled ? "img" : "presentation",
      label: labelled ? this.label : null,
      hidden: !labelled,
    });
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`<slot></slot>`;
    const renderer = skin.icon;
    const artwork = this.name === "" ? null : resolveIcon(this.name);
    const state: IconState = {
      artwork,
      size: this.size,
      tint: this.tint,
      autoMirror: this.autoMirror || artwork?.autoMirror === true,
      original: this.original || artwork?.original === true,
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
