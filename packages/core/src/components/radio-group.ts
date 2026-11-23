import { css, html, nothing } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { CamoControl } from "../behavior/control.ts";
import type { ControlValue } from "../behavior/control.ts";
import { RovingTabindexController } from "../behavior/roving.ts";
import type { GroupOrientation } from "../skin/types.ts";
import type { CamoRadio } from "./radio.ts";
import { RADIO_PICK } from "./radio.ts";

/**
 * `<camo-radio-group name="plan" label="Plan" value="pro"><camo-radio value="free" label="Free"></camo-radio>…</camo-radio-group>`
 *
 * A group of `camo-radio`s, one of which is on. Tab enters the group at the selected radio (or the first), the arrow
 * keys move and select (and wrap), Tab leaves. The group's `label` names it and its `error` is shown below and linked
 * to it. Form-associated: it submits the selected radio's `value` under `name`.
 *
 * @tagname camo-radio-group
 * @slot - The `camo-radio` options.
 * @attr {string} value - The selected radio's value; empty means none yet.
 * @attr {string} label - The group's name, announced with it.
 * @attr {string} error - A message shown below the group; marks the group invalid.
 * @attr {"vertical"|"horizontal"} orientation - A column or a row.
 * @attr {boolean} disabled - Disables every radio (the contract's `enabled`, inverted).
 * @attr {boolean} required - Invalid to its form until one is selected.
 * @attr {string} name - The name the value is submitted under.
 * @fires {CustomEvent<CamoBeforeChangeDetail>} camo-before-change - Cancelable, before the selection changes.
 * @fires input - The selection changed.
 * @fires change - The selection changed.
 */
export class CamoRadioGroup extends CamoControl {
  static override properties: PropertyDeclarations = {
    value: { type: String },
    label: { type: String },
    orientation: { type: String, reflect: true },
  };

  static override styles: CSSResult = css`
    :host {
      display: block;
    }
    .g {
      display: flex;
      flex-direction: column;
      gap: var(--camo-spacing-xs);
    }
    .legend {
      font: var(--camo-type-label-large-weight) var(--camo-type-label-large-size) /
        var(--camo-type-label-large-line-height) var(--camo-type-label-large-family);
      color: var(--camo-color-on-surface);
    }
    .options {
      display: flex;
      flex-direction: column;
    }
    :host([orientation="horizontal"]) .options {
      flex-direction: row;
      flex-wrap: wrap;
      gap: var(--camo-spacing-l);
    }
    .err {
      font: var(--camo-type-body-medium-weight) var(--camo-type-body-medium-size) /
        var(--camo-type-body-medium-line-height) var(--camo-type-body-medium-family);
      color: var(--camo-color-error);
    }
    .legend:empty,
    .err:empty {
      display: none;
    }
  `;

  declare value: string;
  declare label: string | null;
  declare orientation: GroupOrientation;

  #defaultValue = "";
  readonly #roving: RovingTabindexController = new RovingTabindexController(this, {
    items: () => this.#radios(),
    orientation: "both",
  });

  constructor() {
    super();
    this.value = "";
    this.label = null;
    this.orientation = "vertical";
    this.addEventListener(RADIO_PICK, this.#onPick as EventListener);
    this.addEventListener("focusin", this.#onFocusIn);
  }

  #radios(): CamoRadio[] {
    return [...this.querySelectorAll<CamoRadio>("camo-radio")];
  }

  protected override formValue(): ControlValue {
    return this.value === "" ? null : this.value;
  }
  protected override isEmpty(): boolean {
    return this.value === "";
  }
  protected override captureDefault(): void {
    this.#defaultValue = this.value;
  }
  protected override resetToDefault(): void {
    this.value = this.#defaultValue;
  }
  protected override restoreFormState(state: ControlValue): void {
    this.value = typeof state === "string" ? state : "";
  }
  protected override validationAnchor(): HTMLElement | undefined {
    return this.#radios().find((r) => r.checked) ?? this.#radios()[0];
  }

  /** Selects a radio: asks first (cancelable), then fires `input` and `change`. */
  #select(radio: CamoRadio): void {
    if (radio.disabled || this.isDisabled || radio.value === this.value) return;
    if (!this.beforeChange(radio.value)) return;
    this.value = radio.value;
    this.fireInput();
    this.fireChange();
  }

  readonly #onPick = (event: Event): void => {
    event.stopPropagation();
    const radio = event.target as CamoRadio;
    this.#select(radio);
    radio.focus();
  };

  // Arrow keys move focus (the roving controller) and select: focus arriving by key selects the radio.
  readonly #onFocusIn = (event: FocusEvent): void => {
    const radio = (event.target as Element).closest<CamoRadio>("camo-radio");
    if (radio === null || !radio.matches(":focus-visible")) return;
    this.#select(radio);
  };

  #sync(): void {
    const radios = this.#radios();
    radios.forEach((radio, i) => {
      radio.checked = radio.value === this.value;
      radio.invalid = this.error !== null;
      radio.disabled = radio.hasAttribute("disabled") || this.isDisabled;
      radio.position = { index: i + 1, size: radios.length };
    });
    // The tab stop is the selected radio, or the first usable one.
    const at = radios.findIndex((r) => r.checked && !r.disabled);
    this.#roving.setActive(at >= 0 ? at : 0);
    this.#roving.update();
    if (at >= 0) this.#roving.setActive(at);
  }

  protected override firstUpdated(): void {
    super.firstUpdated();
    this.renderRoot.addEventListener("slotchange", () => this.#sync());
    this.#sync();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.internals, {
      role: "radiogroup",
      label: this.label === "" ? null : this.label,
      disabled: this.isDisabled,
      invalid: this.error !== null,
      required: this.required,
      orientation: this.orientation,
    });
  }

  protected override updated(): void {
    super.updated();
    this.#sync();
  }

  override render(): TemplateResult {
    return html`<div class="g" part="group">
      <div class="legend" part="label">${this.label ?? nothing}</div>
      <div class="options" part="options"><slot></slot></div>
      <div class="err" part="error" role="alert">${this.error ?? nothing}</div>
    </div>`;
  }
}
