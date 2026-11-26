import { LitElement, css, html } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { attachActivation } from "../behavior/activation.ts";
import { applyAria } from "../behavior/aria.ts";
import { PressController } from "../behavior/press.ts";
import { CamouflageController } from "../controller.ts";
import type { ListItemState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = { leading: "leading", trailing: "trailing" } as const;

/**
 * `<camo-list-item headline="Wi-Fi" supporting="Connected" clickable><camo-icon slot="leading" name="…"></…></camo-list-item>`
 *
 * One row: a headline, optional supporting text and overline, a leading and a trailing widget. With `clickable` the whole
 * row is one button (one merged element: headline, supporting text and trailing state, Enter and Space, a `click` event);
 * otherwise it keeps its children's semantics. A row with a switch is the row's job: slot a display-only `camo-switch` as
 * `trailing` and toggle it from the row's `click`. Dividers between rows come from the `camo-list-section` around them.
 *
 * @tagname camo-list-item
 * @slot leading - An icon, an avatar, an image or a display-only checkbox.
 * @slot trailing - An icon, meta text, a display-only switch or a chevron.
 * @attr {string} headline - The main text.
 * @attr {string} supporting - A second line.
 * @attr {string} overline - A line above the headline.
 * @attr {boolean} clickable - The row is one button.
 * @attr {boolean} selected - Highlights the row (navigation lists, pickers).
 * @attr {boolean} disabled - Blocks clicks and focus (the contract's `enabled`, inverted).
 */
export class CamoListItem extends LitElement {
  static override properties: PropertyDeclarations = {
    headline: { type: String },
    supporting: { type: String },
    overline: { type: String },
    clickable: { type: Boolean, reflect: true },
    selected: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  static override styles: CSSResult = css``;

  declare headline: string;
  declare supporting: string | null;
  declare overline: string | null;
  declare clickable: boolean;
  declare selected: boolean;
  declare disabled: boolean;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  readonly #press: PressController = new PressController(
    this,
    () => this.disabled || !this.clickable,
  );

  constructor() {
    super();
    this.headline = "";
    this.supporting = null;
    this.overline = null;
    this.clickable = false;
    this.selected = false;
    this.disabled = false;
    attachActivation(this, () => this.disabled || !this.clickable, {
      container: () => !this.disabled,
    });
    void this.#press;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    const name = [this.overline, this.headline, this.supporting]
      .filter((t) => t !== null && t !== "")
      .join(", ");
    applyAria(this, this.#internals, {
      role: this.clickable ? "button" : "generic",
      ...(this.clickable ? { label: name, disabled: this.disabled } : {}),
      ...(this.selected && this.clickable ? { pressed: true } : {}),
    });
    if (this.clickable) this.setAttribute("tabindex", this.disabled ? "-1" : "0");
    else this.removeAttribute("tabindex");
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`${this.headline}<slot name="trailing"></slot>`;
    const renderer = skin.listItem;
    const supporting = this.supporting === "" ? null : this.supporting;
    const overline = this.overline === "" ? null : this.overline;
    const state: ListItemState = {
      headline: this.headline,
      supporting,
      overline,
      lines:
        overline !== null && supporting !== null
          ? 3
          : overline !== null || supporting !== null
            ? 2
            : 1,
      clickable: this.clickable,
      selected: this.selected,
      disabled: this.disabled,
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
