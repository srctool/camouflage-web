import { LitElement, css, html } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { attachActivation } from "../behavior/activation.ts";
import { applyAria } from "../behavior/aria.ts";
import { PressController } from "../behavior/press.ts";

/**
 * `<camo-field-action slot="suffix-icon" label="Show password"><camo-icon name="eye"></camo-icon></camo-field-action>`
 *
 * An action inside a field, like show password. Unlike an icon button it has no container and no 48 px target of its own,
 * so a field with an action is not taller than its neighbours: it measures the icon plus a small margin, takes the field's
 * icon size and color (so it turns red with the field's error), and is still its own focusable button after the input,
 * with its own label.
 *
 * @tagname camo-field-action
 * @slot - The icon.
 * @attr {string} label - What the action does; required, and its accessible name.
 * @attr {boolean} disabled - Blocks clicks and focus (the contract's `enabled`, inverted).
 */
export class CamoFieldAction extends LitElement {
  static override properties: PropertyDeclarations = {
    label: { type: String },
    disabled: { type: Boolean, reflect: true },
  };

  static override styles: CSSResult = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      inline-size: calc(var(--camo-icon-size, 24px) + var(--camo-spacing-s));
      block-size: calc(var(--camo-icon-size, 24px) + var(--camo-spacing-s));
      border-radius: 50%;
      cursor: pointer;
      outline: none;
      color: inherit;
      -webkit-tap-highlight-color: transparent;
    }
    :host(:hover:not([disabled])) {
      background: color-mix(in srgb, currentColor 8%, transparent);
    }
    :host([data-camo-pressed]) {
      background: color-mix(in srgb, currentColor 16%, transparent);
    }
    :host(:focus-visible) {
      outline: 2px solid var(--camo-color-primary);
    }
    :host([disabled]) {
      cursor: default;
      opacity: 0.38;
    }
    ::slotted(*) {
      --camo-content-color: currentColor;
    }
  `;

  declare label: string;
  declare disabled: boolean;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #press: PressController = new PressController(this, () => this.disabled);

  constructor() {
    super();
    this.label = "";
    this.disabled = false;
    attachActivation(this, () => this.disabled);
    void this.#press;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, {
      role: "button",
      label: this.label === "" ? null : this.label,
      disabled: this.disabled,
    });
    this.setAttribute("tabindex", this.disabled ? "-1" : "0");
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
