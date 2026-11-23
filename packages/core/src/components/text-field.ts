import { css, html } from "lit";
import type { CSSResult, PropertyDeclarations, TemplateResult } from "lit";
import { CamouflageController } from "../controller.ts";
import { FIELD_IDS } from "../skin/ids.ts";
import type { LabelPlacement, TextFieldState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";
import { CamoTextInput } from "./text-input.ts";

const SLOTS = { "prefix-icon": "prefix-icon", "suffix-icon": "suffix-icon" } as const;

/**
 * `<camo-text-field label="Phone" name="phone" prefix-text="+62" supporting-text="Digits only"></camo-text-field>`
 *
 * A text input with a label, helper text, an error, prefix and suffix, filters and formats. It is form-associated:
 * it takes `name`, `value`, `required` and `disabled`, takes part in `FormData`, `reset` and `checkValidity`.
 * `value` is the raw text; the element updates it as the user types, after a cancelable `camo-before-change`
 * (`preventDefault()` rejects the edit, which makes the field controlled), then fires `input`, and `change` on commit.
 * The editable node is core's, so `inputFilter` and `displayFormat` (properties) never move the cursor.
 *
 * @tagname camo-text-field
 * @slot prefix-icon - A decorative icon at the start.
 * @slot suffix-icon - An icon at the end, or a `camo-field-action`.
 * @attr {string} value - The raw text.
 * @attr {string} label - The label; where it sits is `label-placement`.
 * @attr {string} placeholder - Hint text while empty.
 * @attr {string} supporting-text - Helper text below the field; the error replaces it.
 * @attr {string} error - A message: the field is in the error state, and invalid to its form.
 * @attr {string} prefix-text - Fixed text before the input ("+62"); never part of the value.
 * @attr {string} suffix-text - Fixed text after the input ("kg").
 * @attr {boolean} multiline - A textarea instead of a single line (the contract's `singleLine`, inverted).
 * @attr {boolean} secure - Obscures the text (a password).
 * @attr {boolean} disabled - Blocks editing and focus (the contract's `enabled`, inverted).
 * @attr {boolean} required - Invalid to its form while empty.
 * @attr {string} name - The name the value is submitted under.
 * @attr {"above"|"floating"} label-placement - A static label above, or one that floats; absent means the skin's.
 * @fires {CustomEvent<CamoBeforeChangeDetail>} camo-before-change - Cancelable, before the value changes.
 * @fires input - The value changed while the user is typing.
 * @fires change - The user committed the value.
 */
export class CamoTextField extends CamoTextInput {
  static override properties: PropertyDeclarations = {
    label: { type: String },
    supportingText: { type: String, attribute: "supporting-text" },
    prefixText: { type: String, attribute: "prefix-text" },
    suffixText: { type: String, attribute: "suffix-text" },
    multiline: { type: Boolean, reflect: true },
    secure: { type: Boolean, reflect: true },
    type: { type: String },
    labelPlacement: { type: String, attribute: "label-placement", reflect: true },
  };

  static override styles: CSSResult = css`
    :host {
      display: inline-block;
    }
  `;

  declare label: string | null;
  declare supportingText: string | null;
  declare prefixText: string | null;
  declare suffixText: string | null;
  declare multiline: boolean;
  declare secure: boolean;
  /** The input type (`text`, `email`, `tel`, `url`); `secure` wins. */
  declare type: string;
  declare labelPlacement: LabelPlacement | null;

  readonly #cx: CamouflageController = new CamouflageController(this);

  constructor() {
    super();
    this.label = null;
    this.supportingText = null;
    this.prefixText = null;
    this.suffixText = null;
    this.multiline = false;
    this.secure = false;
    this.type = "text";
    this.labelPlacement = null;
  }

  protected override inputType(): string {
    return this.secure ? "password" : this.type;
  }
  protected override isMultiline(): boolean {
    return this.multiline;
  }
  protected override hasLabel(): boolean {
    return this.label !== null && this.label !== "";
  }
  protected override accessibleName(): string | null {
    return this.placeholder;
  }
  protected override describedBy(): string | undefined {
    if (this.error !== null) return FIELD_IDS.error;
    return this.supportingText === null || this.supportingText === ""
      ? undefined
      : FIELD_IDS.supporting;
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`${this.renderInput()}`;
    const renderer = skin.textField;
    const style = renderer.defaults(tokens);
    const state: TextFieldState = {
      label: this.label === "" ? null : this.label,
      placeholder: this.placeholder,
      supportingText: this.supportingText,
      error: this.error,
      prefixText: this.prefixText,
      suffixText: this.suffixText,
      disabled: this.isDisabled,
      focused: this.focused,
      multiline: this.multiline,
      required: this.required,
      isEmpty: this.value === "",
      labelPlacement: this.labelPlacement || style.labelPlacement,
    };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: SLOTS,
      theme: tokens,
      style,
      skin,
      nodes: { input: this.renderInput() },
    })}`;
  }
}
