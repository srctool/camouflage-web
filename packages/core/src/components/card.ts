import { LitElement, css, html } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { attachActivation } from "../behavior/activation.ts";
import { applyAria } from "../behavior/aria.ts";
import { PressController } from "../behavior/press.ts";
import { CamouflageController } from "../controller.ts";
import type { Appearance, CardState, Tone } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = { content: "" } as const;

/**
 * `<camo-card appearance="outline" clickable>…</camo-card>`
 *
 * A container for related content, drawn by the skin: raised, outlined, soft or solid, in a status tone. With `clickable`
 * the whole card is one button (focusable, Enter and Space, a `click` event, hover and press feedback); with `selectable`
 * it is also a toggle with `selected` (a plan, a payment method). A card that is not clickable has no role of its own and
 * its content keeps its semantics. Do not put a link or a button inside a clickable card: assistive technology cannot
 * reach it.
 *
 * @tagname camo-card
 * @slot - The content.
 * @attr {"solid"|"soft"|"raised"|"outline"|"ghost"|"link"} appearance - Visual weight; absent means the skin's default (`raised`).
 * @attr {"default"|"error"|"success"|"warning"|"info"} tone - The colour family; a status tone makes it a status panel.
 * @attr {boolean} clickable - The card is one button.
 * @attr {boolean} selectable - The card can be selected (the contract's non-null `selected`).
 * @attr {boolean} selected - Whether a selectable card is selected.
 * @attr {boolean} disabled - Blocks clicks and focus (the contract's `enabled`, inverted).
 */
export class CamoCard extends LitElement {
  static override properties: PropertyDeclarations = {
    appearance: { type: String, reflect: true },
    tone: { type: String, reflect: true },
    clickable: { type: Boolean, reflect: true },
    selectable: { type: Boolean, reflect: true },
    selected: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  static override styles: CSSResult = css``;

  declare appearance: Appearance | null;
  declare tone: Tone;
  declare clickable: boolean;
  declare selectable: boolean;
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
    this.appearance = null;
    this.tone = "default";
    this.clickable = false;
    this.selectable = false;
    this.selected = false;
    this.disabled = false;
    attachActivation(this, () => this.disabled || !this.clickable, {
      container: () => !this.disabled,
    });
    void this.#press;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, {
      role: this.clickable ? "button" : "generic",
      disabled: this.clickable && this.disabled,
      ...(this.clickable && this.selectable ? { pressed: this.selected } : {}),
    });
    if (this.clickable) this.setAttribute("tabindex", this.disabled ? "-1" : "0");
    else this.removeAttribute("tabindex");
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`<slot></slot>`;
    const renderer = skin.card;
    const style = renderer.defaults(tokens);
    const state: CardState = {
      appearance: this.appearance || style.defaultAppearance,
      tone: this.tone,
      clickable: this.clickable,
      disabled: this.disabled,
      selected: this.selectable ? this.selected : null,
    };
    return html`${cssBlock(renderer.styles)}${renderer.render({ state, slots: SLOTS, theme: tokens, style, skin })}`;
  }
}
