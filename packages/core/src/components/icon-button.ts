import { LitElement, css, html } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { attachActivation } from "../behavior/activation.ts";
import { applyAria } from "../behavior/aria.ts";
import { PressController } from "../behavior/press.ts";
import { CamouflageController } from "../controller.ts";
import type { Appearance, IconButtonState, Tone } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = { icon: "" } as const;

/**
 * `<camo-icon-button label="Close"><camo-icon name="close"></camo-icon></camo-icon-button>`
 *
 * A button that is only an icon. The `label` is required: it names the action ("Close", "Add to favorites"), not the
 * icon, and it is the accessible name. The default appearance is `ghost`, because most icon buttons sit in bars and
 * should stay quiet. A `toggle` is a button with an on/off state (favorite, bookmark): the app flips `checked` and
 * keeps the same label in both states. The touch target is at least 48 by 48 even though the container is 40.
 *
 * @tagname camo-icon-button
 * @slot - The icon, usually a `camo-icon`.
 * @attr {string} label - The action's name, and the accessible name (required).
 * @attr {"solid"|"soft"|"raised"|"outline"|"ghost"|"link"} appearance - Visual weight; absent means the skin's default (`ghost`). Raised falls back to Soft, and Link to Ghost.
 * @attr {"default"|"error"|"success"|"warning"|"info"} tone - The colour family.
 * @attr {boolean} disabled - Blocks clicks and focus (the contract's `enabled`, inverted).
 * @attr {boolean} toggle - Makes it a toggle button with `aria-pressed` (the contract's non-null `checked`).
 * @attr {boolean} checked - Whether a toggle is on; the app flips it from its `click` handler.
 * @attr {boolean} loading - A progress ring replaces the icon; focus is kept, clicks are ignored, `aria-busy` is set.
 * @attr {string} tooltip - Text shown on hover and keyboard focus.
 */
export class CamoIconButton extends LitElement {
  static override properties: PropertyDeclarations = {
    label: { type: String },
    appearance: { type: String, reflect: true },
    tone: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    toggle: { type: Boolean, reflect: true },
    checked: { type: Boolean, reflect: true },
    loading: { type: Boolean, reflect: true },
    tooltip: { type: String },
  };

  static override styles: CSSResult = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
      cursor: pointer;
      outline: none;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    :host([disabled]) {
      cursor: default;
    }
    :host([loading]) {
      cursor: progress;
    }
  `;

  declare label: string;
  declare appearance: Appearance | null;
  declare tone: Tone;
  declare disabled: boolean;
  declare toggle: boolean;
  declare checked: boolean;
  declare loading: boolean;
  declare tooltip: string | null;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  readonly #press: PressController = new PressController(this, () => this.disabled || this.loading);

  constructor() {
    super();
    this.label = "";
    this.appearance = null;
    this.tone = "default";
    this.disabled = false;
    this.toggle = false;
    this.checked = false;
    this.loading = false;
    this.tooltip = null;
    attachActivation(this, () => this.disabled || this.loading);
    void this.#press;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, {
      role: "button",
      label: this.label === "" ? null : this.label,
      disabled: this.disabled,
      busy: this.loading,
      pressed: this.toggle ? this.checked : null,
    });
    this.setAttribute("tabindex", this.disabled ? "-1" : "0");
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`<slot></slot>`;
    const renderer = skin.iconButton;
    const style = renderer.defaults(tokens);
    const state: IconButtonState = {
      label: this.label,
      appearance: this.appearance || style.defaultAppearance,
      tone: this.tone,
      disabled: this.disabled,
      loading: this.loading,
      toggle: this.toggle,
      checked: this.checked,
      tooltip: this.tooltip,
    };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: SLOTS,
      theme: tokens,
      style,
      skin,
    })}`;
  }
}
