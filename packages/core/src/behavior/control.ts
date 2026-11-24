import { LitElement, isServer } from "lit";
import type { PropertyDeclarations, PropertyValues } from "lit";
import { reportFormState } from "./internals.ts";

/** What `camo-before-change` carries: the value the edit would produce. */
export interface CamoBeforeChangeDetail<T = unknown> {
  value: T;
}

/** The form value a control reports. */
export type ControlValue = string | File | FormData | null;

function serialize(value: ControlValue): string {
  if (value instanceof FormData)
    return JSON.stringify([...value.entries()].map(([k, v]) => [k, String(v)]));
  return value instanceof File ? value.name : String(value);
}

/**
 * The base of every input: a form-associated element (`ElementInternals`) with a `name`, `required`, `disabled` and
 * `error`. It takes part in `FormData`, `reset`, `checkValidity` and `reportValidity` like a native control, and fires
 * the events of the inputs rule (Components note, 3.5): a cancelable `camo-before-change` first (`preventDefault()`
 * rejects the edit, so a framework can keep the value controlled), then `input` and, on commit, `change`.
 *
 * A subclass says what its value is (`formValue`), when it is empty (`isEmpty`), what it starts as
 * (`captureDefault` and `resetToDefault`) and where a browser message should point (`validationAnchor`).
 */
export abstract class CamoControl extends LitElement {
  static formAssociated = true;

  static override properties: PropertyDeclarations = {
    name: { type: String, reflect: true },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    error: { type: String },
  };

  /** The name the value is submitted under. */
  declare name: string;
  declare required: boolean;
  /** The contract's `enabled`, inverted: absent means enabled. */
  declare disabled: boolean;
  /** A message that puts the control in the error state and in the form's invalid state; `null` is none. */
  declare error: string | null;

  protected readonly internals: ElementInternals = this.attachInternals();
  #formDisabled = false;
  #defaultCaptured = false;
  #initialEntry = "";

  constructor() {
    super();
    this.name = "";
    this.required = false;
    this.disabled = false;
    this.error = null;
  }

  /** Disabled by the attribute, or by a disabled `<fieldset>` around it. */
  get isDisabled(): boolean {
    return this.disabled || this.#formDisabled;
  }

  get form(): HTMLFormElement | null {
    return this.internals.form;
  }
  get validity(): ValidityState {
    return this.internals.validity;
  }
  get validationMessage(): string {
    return this.internals.validationMessage;
  }
  get willValidate(): boolean {
    return this.internals.willValidate;
  }
  checkValidity(): boolean {
    return this.internals.checkValidity();
  }
  reportValidity(): boolean {
    return this.internals.reportValidity();
  }

  formDisabledCallback(disabled: boolean): void {
    this.#formDisabled = disabled;
    this.requestUpdate();
  }

  formResetCallback(): void {
    this.resetToDefault();
    this.error = null;
    this.requestUpdate();
  }

  formStateRestoreCallback(state: ControlValue): void {
    this.restoreFormState(state);
  }

  /** The value submitted with the form, or `null` to submit nothing. */
  protected abstract formValue(): ControlValue;

  /** What this control submits now: its form value, or `null` while disabled. */
  get entry(): ControlValue {
    return this.isDisabled ? null : this.formValue();
  }

  /** Whether the value differs from what it was at first render. */
  get isDirty(): boolean {
    return serialize(this.formValue()) !== this.#initialEntry;
  }

  /**
   * Submits the form around this control: the native `<form>` when there is one, else a `camo-request-submit` event
   * that a `camo-form` handles.
   */
  protected requestSubmit(): void {
    if (this.form !== null) this.form.requestSubmit();
    else this.dispatchEvent(new Event("camo-request-submit", { bubbles: true, composed: true }));
  }
  /** Whether there is no value yet (a required control that is empty is invalid). */
  protected abstract isEmpty(): boolean;
  /** Remembers what `reset` returns to; called once, after the first render. */
  protected abstract captureDefault(): void;
  /** Puts the value back to what `captureDefault` remembered. */
  protected abstract resetToDefault(): void;
  /** Puts back a value the browser restored (navigation, autofill). The default does nothing. */
  protected restoreFormState(_state: ControlValue): void {}
  /** The element a browser message should point at and focus. */
  protected validationAnchor(): HTMLElement | undefined {
    return undefined;
  }
  /** A message for a value the control itself finds unacceptable (a typed date that does not exist). */
  protected ownProblem(): string | null {
    return null;
  }

  protected override firstUpdated(): void {
    if (!this.#defaultCaptured) {
      this.#defaultCaptured = true;
      this.captureDefault();
      this.#initialEntry = serialize(this.formValue());
    }
  }

  protected override updated(_changed: PropertyValues = new Map()): void {
    if (isServer) return;
    const problem = this.error ?? this.ownProblem();
    reportFormState(this.internals, {
      value: this.isDisabled ? null : this.formValue(),
      required: this.required && this.isEmpty(),
      valid: problem === null,
      ...(problem === null ? {} : { message: problem }),
      ...(this.validationAnchor() === undefined ? {} : { anchor: this.validationAnchor()! }),
    });
  }

  /**
   * Asks to change the value: fires the cancelable `camo-before-change`. Returns `false` when the app cancelled it,
   * and the control must then keep what it had.
   */
  protected beforeChange<T>(value: T): boolean {
    return this.dispatchEvent(
      new CustomEvent<CamoBeforeChangeDetail<T>>("camo-before-change", {
        detail: { value },
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
  }

  /** `input`: the value changed while the user is still editing. Fired once per edit. */
  protected fireInput(): void {
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  }

  /** `change`: the user committed the value. */
  protected fireChange(): void {
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }
}
