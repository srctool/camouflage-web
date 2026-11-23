import { LitElement, html, isServer } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { attachActivation } from "../behavior/activation.ts";
import { applyAria } from "../behavior/aria.ts";
import { PressController } from "../behavior/press.ts";
import { CamouflageController } from "../controller.ts";
import type { ToggleState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";
import { nameOf, onLink } from "./toggle.ts";

const SLOTS = { label: "" } as const;

/** What a radio asks of its group when the user picks it. */
export const RADIO_PICK = "camo-radio-pick";

/**
 * `<camo-radio value="card" label="Card" description="Visa, Mastercard"></camo-radio>`
 *
 * One option of a `camo-radio-group`. Inside a group the group owns which radio is on and the keyboard (arrow keys move
 * and select); alone, a radio is on or off by `checked`, and a click turns it on. The label is the `label` value or rich
 * markup in the default slot.
 *
 * @tagname camo-radio
 * @slot - A rich label, used when `label` is absent.
 * @attr {string} value - What the group's value becomes when this one is picked.
 * @attr {string} label - The label.
 * @attr {string} description - A second line under the label.
 * @attr {boolean} checked - Whether it is the selected one (the group sets it).
 * @attr {boolean} disabled - Blocks picking and focus (the contract's `enabled`, inverted).
 */
export class CamoRadio extends LitElement {
  static override properties: PropertyDeclarations = {
    value: { type: String },
    label: { type: String },
    description: { type: String },
    checked: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    invalid: { type: Boolean, attribute: false },
    position: { attribute: false },
  };

  static override styles: CSSResult | CSSResult[] = [];

  declare value: string;
  declare label: string | null;
  declare description: string | null;
  declare checked: boolean;
  declare disabled: boolean;
  /** Set by the group when it has an error: the ring turns to the error color. */
  declare invalid: boolean;
  /** Set by the group: "2 of 3". */
  declare position: { index: number; size: number } | null;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  readonly #press: PressController = new PressController(this, () => this.disabled);

  constructor() {
    super();
    this.value = "";
    this.label = null;
    this.description = null;
    this.checked = false;
    this.disabled = false;
    this.invalid = false;
    this.position = null;
    this.addEventListener("click", this.#onClick);
    attachActivation(this, () => this.disabled, { enter: false });
    void this.#press;
  }

  protected override firstUpdated(): void {
    this.renderRoot.addEventListener("slotchange", () => this.requestUpdate());
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, {
      role: "radio",
      label: nameOf(this.label, this),
      disabled: this.disabled,
      checked: this.checked,
      description: this.description === "" ? null : this.description,
      ...(this.position === null ? {} : { position: this.position }),
    });
    // Inside a group the group's roving tabindex owns this; alone, a radio is a tab stop.
    if (!isServer && this.closest("camo-radio-group") === null)
      this.setAttribute("tabindex", this.disabled ? "-1" : "0");
  }

  readonly #onClick = (event: Event): void => {
    if (this.disabled || onLink(event)) return;
    const group = this.closest("camo-radio-group");
    if (group !== null) {
      this.dispatchEvent(new CustomEvent(RADIO_PICK, { bubbles: true, composed: true }));
    } else if (!this.checked) {
      this.checked = true;
      this.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`<slot></slot>`;
    const renderer = skin.radio;
    const state: ToggleState = {
      checked: this.checked,
      indeterminate: false,
      label: this.label === "" ? null : this.label,
      description: this.description === "" ? null : this.description,
      error: this.invalid ? "" : null,
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
