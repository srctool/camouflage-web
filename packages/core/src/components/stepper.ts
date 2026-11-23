import { html } from "lit";
import type { PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { CamoControl } from "../behavior/control.ts";
import type { ControlValue } from "../behavior/control.ts";
import { CamouflageController } from "../controller.ts";
import { FIELD_IDS } from "../skin/ids.ts";
import type { StepperState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const REPEAT_AFTER_MS = 400;
const REPEAT_EVERY_MS = 100;

/**
 * `<camo-stepper name="quantity" label="Quantity" min="1" max="10" value="2"></camo-stepper>`
 *
 * A number with minus and plus buttons: three stops in the tab order (decrease, the value, increase). The buttons
 * disable at the ends and repeat while held (after 400 ms, ten changes a second). The value is an editable number
 * field unless `readonly`; a typed value is clamped to the range and snapped to the step when focus leaves. On the value,
 * Up and Down change it by `step`, PageUp and PageDown by ten steps, Home and End go to the ends. Decimals are computed
 * in fixed point (`decimals`), never as binary floats: 0.1 + 0.2 is 0.3. Form-associated.
 *
 * @tagname camo-stepper
 * @attr {number} value - The value.
 * @attr {number} min - The lowest value; 0 by default.
 * @attr {number} max - The highest value; unlimited by default.
 * @attr {number} step - How much a change moves; 1 by default.
 * @attr {number} decimals - Digits after the separator, shown and typed; 0 by default.
 * @attr {string} label - The accessible name ("Quantity").
 * @attr {string} decrease-label - The minus button's name; "Decrease" by default, followed by the label.
 * @attr {string} increase-label - The plus button's name; "Increase" by default, followed by the label.
 * @attr {boolean} readonly - The value cannot be typed (the contract's `allowTyping`, inverted).
 * @attr {string} error - A message that puts the stepper in the error state.
 * @attr {boolean} disabled - Blocks use and focus (the contract's `enabled`, inverted).
 * @attr {boolean} required - Part of the form's validity (a stepper always has a value).
 * @attr {string} name - The name the value is submitted under.
 * @fires {CustomEvent<CamoBeforeChangeDetail>} camo-before-change - Cancelable, before the value changes.
 * @fires input - The value changed.
 * @fires change - The user finished a change (a press, a typed value on blur).
 */
export class CamoStepper extends CamoControl {
  static override properties: PropertyDeclarations = {
    value: { type: Number },
    min: { type: Number },
    max: { type: Number },
    step: { type: Number },
    decimals: { type: Number },
    label: { type: String },
    decreaseLabel: { type: String, attribute: "decrease-label" },
    increaseLabel: { type: String, attribute: "increase-label" },
    readonly: { type: Boolean, reflect: true },
    valueText: { attribute: false },
    focused: { state: true },
    draft: { state: true },
  };

  declare value: number;
  declare min: number;
  declare max: number;
  declare step: number;
  declare decimals: number;
  declare label: string | null;
  declare decreaseLabel: string;
  declare increaseLabel: string;
  declare readonly: boolean;
  /** Text for the value, like "2 nights"; a property, since it is a function. */
  declare valueText: ((value: number) => string) | null;
  declare protected focused: boolean;
  /** What the user is typing, until focus leaves. */
  declare protected draft: string | null;

  readonly #cx: CamouflageController = new CamouflageController(this);
  #defaultValue = 0;
  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    super();
    this.value = 0;
    this.min = 0;
    this.max = Number.MAX_SAFE_INTEGER;
    this.step = 1;
    this.decimals = 0;
    this.label = null;
    this.decreaseLabel = "Decrease";
    this.increaseLabel = "Increase";
    this.readonly = false;
    this.valueText = null;
    this.focused = false;
    this.draft = null;
    this.addEventListener("focusin", () => (this.focused = true));
    this.addEventListener("focusout", (event) => {
      if (
        !this.contains(event.relatedTarget as Node | null) &&
        !this.renderRoot.contains(event.relatedTarget as Node | null)
      )
        this.focused = false;
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#stopRepeat();
  }

  protected override formValue(): ControlValue {
    return String(this.#clamped);
  }
  protected override isEmpty(): boolean {
    return false;
  }
  protected override captureDefault(): void {
    this.#defaultValue = this.value;
  }
  protected override resetToDefault(): void {
    this.value = this.#defaultValue;
    this.draft = null;
  }
  protected override validationAnchor(): HTMLElement | undefined {
    return this.renderRoot.querySelector<HTMLElement>(".camo-input") ?? undefined;
  }
  override focus(options?: FocusOptions): void {
    (this.renderRoot.querySelector<HTMLElement>(".camo-input") ?? this).focus(options);
  }

  // Fixed point: every value is an integer count of 10^-decimals, so sums are exact.
  get #scale(): number {
    return 10 ** Math.max(0, Math.round(this.decimals));
  }
  #toInt(v: number): number {
    return Math.round(v * this.#scale);
  }
  #fromInt(i: number): number {
    return i / this.#scale;
  }

  /** The value inside the range and on a step from the lower end. */
  #snap(raw: number): number {
    const low = this.#toInt(this.min);
    const high = Math.min(this.#toInt(this.max), Number.MAX_SAFE_INTEGER);
    const unit = Math.max(this.#toInt(this.step), 1);
    let i = Math.min(Math.max(this.#toInt(Number.isFinite(raw) ? raw : this.min), low), high);
    i = low + Math.round((i - low) / unit) * unit;
    if (i > high) i = low + Math.floor((high - low) / unit) * unit;
    return this.#fromInt(i);
  }

  get #clamped(): number {
    return this.#snap(this.value);
  }

  #format(v: number): string {
    return this.valueText?.(v) ?? v.toFixed(Math.max(0, Math.round(this.decimals)));
  }

  /** Moves the value by `steps` steps, or to `to`. Returns whether it changed. */
  #change(next: number): boolean {
    const v = this.#snap(next);
    if (v === this.#clamped || this.isDisabled) return false;
    if (!this.beforeChange(v)) return false;
    this.value = v;
    this.draft = null;
    this.fireInput();
    return true;
  }

  #by(steps: number): boolean {
    return this.#change(this.#fromInt(this.#toInt(this.#clamped) + steps * this.#toInt(this.step)));
  }

  #startRepeat(steps: number): void {
    this.#stopRepeat();
    if (!this.#by(steps)) return;
    this.fireChange();
    const tick = (): void => {
      if (!this.#by(steps)) return this.#stopRepeat();
      this.fireChange();
      this.#timer = setTimeout(tick, REPEAT_EVERY_MS);
    };
    this.#timer = setTimeout(tick, REPEAT_AFTER_MS);
  }

  #stopRepeat(): void {
    clearTimeout(this.#timer);
    this.#timer = undefined;
  }

  #commitDraft(): void {
    if (this.draft === null) return;
    const text = this.draft.replace(",", ".");
    const parsed = Number(text);
    this.draft = null;
    if (text.trim() !== "" && Number.isFinite(parsed) && this.#change(parsed)) this.fireChange();
    else this.requestUpdate();
  }

  get #atMin(): boolean {
    return this.#toInt(this.#clamped) <= this.#toInt(this.min);
  }
  get #atMax(): boolean {
    return this.#toInt(this.#clamped) + this.#toInt(this.step) > this.#toInt(this.max);
  }

  #button(kind: "decrease" | "increase"): TemplateResult {
    const dec = kind === "decrease";
    const steps = dec ? -1 : 1;
    const base = dec ? this.decreaseLabel : this.increaseLabel;
    const name = `${base}${this.label === null || this.label === "" ? "" : ` ${this.label.toLowerCase()}`}`;
    const blocked = this.isDisabled || (dec ? this.#atMin : this.#atMax);
    return html`<button
      class="camo-step camo-${kind}"
      type="button"
      aria-label=${name}
      ?disabled=${blocked}
      @pointerdown=${(e: PointerEvent): void => {
        if (blocked || e.button !== 0) return;
        e.preventDefault();
        this.#startRepeat(steps);
      }}
      @pointerup=${(): void => this.#stopRepeat()}
      @pointerleave=${(): void => this.#stopRepeat()}
      @pointercancel=${(): void => this.#stopRepeat()}
      @click=${(e: MouseEvent): void => {
        // A pointer press was handled on pointerdown; a click with no pointer (Enter, Space) steps here.
        if (e.detail === 0 && this.#by(steps)) this.fireChange();
      }}
    ></button>`;
  }

  #input(): TemplateResult {
    const v = this.#clamped;
    const text = this.draft ?? this.#format(v);
    const named = this.label === null || this.label === "" ? undefined : this.label;
    return html`<input
      id=${FIELD_IDS.input}
      class="camo-input"
      type="text"
      inputmode=${this.decimals > 0 ? "decimal" : "numeric"}
      role="spinbutton"
      aria-label=${named ?? "Value"}
      aria-valuenow=${v}
      aria-valuemin=${this.min}
      aria-valuemax=${this.max === Number.MAX_SAFE_INTEGER ? "" : this.max}
      aria-valuetext=${this.valueText === null ? "" : this.#format(v)}
      aria-invalid=${this.error === null ? "false" : "true"}
      value=${text}
      .value=${text}
      ?readonly=${this.readonly}
      ?disabled=${this.isDisabled}
      @input=${(e: Event): void => {
        e.stopPropagation();
        this.draft = (e.target as HTMLInputElement).value;
      }}
      @change=${(e: Event): void => e.stopPropagation()}
      @blur=${(): void => this.#commitDraft()}
      @keydown=${(e: KeyboardEvent): void => this.#onKey(e)}
    />`;
  }

  #onKey(event: KeyboardEvent): void {
    let handled = true;
    switch (event.key) {
      case "ArrowUp":
        if (this.#by(1)) this.fireChange();
        break;
      case "ArrowDown":
        if (this.#by(-1)) this.fireChange();
        break;
      case "PageUp":
        if (this.#by(10)) this.fireChange();
        break;
      case "PageDown":
        if (this.#by(-10)) this.fireChange();
        break;
      case "Home":
        if (this.#change(this.min)) this.fireChange();
        break;
      case "End":
        if (this.max !== Number.MAX_SAFE_INTEGER) if (this.#change(this.max)) this.fireChange();
        break;
      case "Enter":
        this.#commitDraft();
        this.requestSubmit();
        break;
      default:
        handled = false;
    }
    if (handled) event.preventDefault();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.internals, {
      role: "group",
      label: this.label === "" ? null : this.label,
      disabled: this.isDisabled,
      invalid: this.error !== null,
    });
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`${this.#input()}`;
    const renderer = skin.stepper;
    const state: StepperState = {
      valueText: this.#format(this.#clamped),
      disabled: this.isDisabled,
      error: this.error !== null,
      focused: this.focused,
    };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: {},
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
      nodes: {
        input: this.#input(),
        decrease: this.#button("decrease"),
        increase: this.#button("increase"),
      },
    })}`;
  }
}
