import { LitElement, css, html } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { attachActivation } from "../behavior/activation.ts";
import { applyAria } from "../behavior/aria.ts";
import { CamouflageController } from "../controller.ts";
import type { Appearance, ButtonState, Tone } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

/** The slots a `camo-button` offers (the contract's `prefixIcon` and `suffixIcon`). */
const SLOTS = { "prefix-icon": "prefix-icon", "suffix-icon": "suffix-icon" } as const;

/**
 * `<camo-button text="Save" appearance="solid" tone="default" disabled loading>`
 *
 * The element owns state, behavior and accessibility; the skin's `button` renderer draws it. The host itself is
 * the focusable button (role, name, disabled and busy through `ElementInternals`), so no id has to cross a shadow
 * root. `click` is the native event and is not fired when the button is disabled or loading.
 *
 * @tagname camo-button
 * @slot prefix-icon - An icon before the text.
 * @slot suffix-icon - An icon after the text.
 * @attr {string} text - The label.
 * @attr {"solid"|"soft"|"raised"|"outline"|"ghost"|"link"} appearance - Visual weight; absent means the skin's default.
 * @attr {"default"|"error"|"success"|"warning"|"info"} tone - The colour family.
 * @attr {boolean} disabled - Blocks clicks and focus (the contract's `enabled`, inverted).
 * @attr {boolean} loading - Shows progress in place of the text, keeps focus, sets `aria-busy`.
 */
export class CamoButton extends LitElement {
  static override properties: PropertyDeclarations = {
    text: { type: String },
    appearance: { type: String, reflect: true },
    tone: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    loading: { type: Boolean, reflect: true },
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

  /** The label: a value, drawn by the renderer in the skin's style. */
  declare text: string;
  /** Visual weight; absent means the skin's default (`solid` in Minimal and Cupertino). */
  declare appearance: Appearance | null;
  declare tone: Tone;
  /** The contract's `enabled`, inverted: absent means enabled. */
  declare disabled: boolean;
  declare loading: boolean;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);

  constructor() {
    super();
    this.text = "";
    this.appearance = null;
    this.tone = "default";
    this.disabled = false;
    this.loading = false;
    attachActivation(this, () => this.disabled || this.loading);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    // Set here, not in `updated`, so a server-rendered page carries them in its first bytes.
    applyAria(this, this.#internals, {
      role: "button",
      label: this.text === "" ? null : this.text,
      disabled: this.disabled,
      busy: this.loading,
    });
    this.setAttribute("tabindex", this.disabled ? "-1" : "0");
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) {
      // No provider and no fallback skin: an unstyled but working button.
      return html`<slot name="prefix-icon"></slot>${this.text}<slot name="suffix-icon"></slot>`;
    }
    const renderer = skin.button;
    const style = renderer.defaults(tokens);
    const state: ButtonState = {
      text: this.text,
      appearance: this.appearance ?? style.defaultAppearance,
      tone: this.tone,
      disabled: this.disabled,
      loading: this.loading,
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

declare global {
  interface HTMLElementTagNameMap {
    "camo-button": CamoButton;
  }
}
