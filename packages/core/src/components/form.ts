import { LitElement, css, html } from "lit";
import type { CSSResult, PropertyDeclarations, TemplateResult } from "lit";
import { CamoControl } from "../behavior/control.ts";
import { firstFailure } from "../form-rules.ts";
import type { CamoFormValues, CamoRule } from "../form-rules.ts";
import type { ValidateMode } from "../skin/types.ts";

/** What `camo-submit` carries: the values by name, and the same as `FormData`. */
export interface CamoSubmitDetail {
  values: Record<string, unknown>;
  formData: FormData;
}

/** What `camo-invalid` carries: the messages by name, and the first invalid control (which now has focus). */
export interface CamoInvalidDetail {
  errors: Record<string, string>;
  first: HTMLElement | null;
}

type Entry = CamoControl & Record<string, unknown>;

/** The value rules see for a control: a checkbox's boolean, a list for `multiple`, the date range's start and end, else `value`. */
function valueOf(control: Entry): unknown {
  const tag = control.localName;
  if (tag === "camo-checkbox" || tag === "camo-switch") return control["checked"] === true;
  if (control["multiple"] === true) return control["values"];
  if (control["range"] === true) return { start: control["start"], end: control["end"] };
  const value = control["value"];
  return value === "" ? null : value;
}

/**
 * `<camo-form validate-mode="on-user-interaction"><camo-text-field name="email" label="Email"></…><camo-button type="submit" text="Save"></…></camo-form>`
 *
 * Validation for the inputs inside it. Every input with a `name` takes part: no wrapper is needed. `rules` (a property)
 * maps a name to a rule or a list of rules (`CamoRules.required("…")`, or any function), and the first failure wins and
 * becomes that input's `error`. `validate-mode` says when: `disabled` (only on submit, the default), `always`,
 * `on-user-interaction` (after the user first edits a field) or `on-unfocus`. A `camo-button type="submit"` or Enter in a
 * field validates, then fires `camo-submit` (cancelable) with the values, or `camo-invalid` and focuses the first invalid
 * input. It works with a native `<form>` around it (their `submit` event is validated and `FormData` includes every
 * input) or alone.
 *
 * @tagname camo-form
 * @slot - The inputs, and the submit and reset buttons.
 * @attr {"disabled"|"always"|"on-user-interaction"|"on-unfocus"} validate-mode - When fields validate; on submit only by default.
 * @attr {string} required-message - What a `required` input that is empty says; "This field is required." by default.
 * @fires {CustomEvent<CamoSubmitDetail>} camo-submit - Valid, and submitted. Cancelable: `preventDefault()` stops a native submit.
 * @fires {CustomEvent<CamoInvalidDetail>} camo-invalid - A submit found invalid inputs.
 * @fires camo-changed - Any input changed.
 */
export class CamoForm extends LitElement {
  static override properties: PropertyDeclarations = {
    rules: { attribute: false },
    validateMode: { type: String, attribute: "validate-mode", reflect: true },
    requiredMessage: { type: String, attribute: "required-message" },
  };

  static override styles: CSSResult = css`
    :host {
      display: block;
    }
  `;

  /** A rule or a list of rules by input name; a property, since it holds functions. */
  declare rules: Record<string, CamoRule | readonly CamoRule[]>;
  declare validateMode: ValidateMode;
  declare requiredMessage: string;

  // The messages this form put on controls, so it clears its own and never an app's.
  readonly #mine = new WeakMap<CamoControl, string>();
  readonly #touched = new WeakSet<CamoControl>();
  #valid = true;
  #native: HTMLFormElement | null = null;

  constructor() {
    super();
    this.rules = {};
    this.validateMode = "disabled";
    this.requiredMessage = "This field is required.";
    this.addEventListener("input", this.#onInput);
    this.addEventListener("change", this.#onChange);
    this.addEventListener("focusout", this.#onFocusOut);
    this.addEventListener("click", this.#onClick);
    this.addEventListener("camo-request-submit", this.#onRequest);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#native = this.closest("form") ?? this.querySelector("form");
    this.#native?.addEventListener("submit", this.#onNativeSubmit);
    this.#native?.addEventListener("reset", this.#onNativeReset);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#native?.removeEventListener("submit", this.#onNativeSubmit);
    this.#native?.removeEventListener("reset", this.#onNativeReset);
    this.#native = null;
  }

  /** Every named input inside, in document order. */
  get controls(): CamoControl[] {
    return [...this.querySelectorAll("*")].filter(
      (el): el is CamoControl => el instanceof CamoControl && el.name !== "",
    );
  }

  /** The values by name, as rules see them. */
  get values(): Record<string, unknown> {
    return Object.fromEntries(this.controls.map((c) => [c.name, valueOf(c as Entry)]));
  }

  /** What the last validation found: true until an input was found invalid. */
  get valid(): boolean {
    return this.#valid;
  }

  /** Whether any input differs from what it was when it first rendered. */
  get dirty(): boolean {
    return this.controls.some((c) => c.isDirty);
  }

  /** The inputs' entries as `FormData`: what a native form would send. */
  get formData(): FormData {
    const data = new FormData();
    for (const c of this.controls) {
      const entry = c.entry;
      if (entry instanceof FormData) for (const [k, v] of entry) data.append(k, v);
      else if (entry !== null) data.append(c.name, entry);
    }
    return data;
  }

  /** Checks one input (or all) against the rules and shows the first failure. Returns whether it is valid. */
  validateField(control: CamoControl): boolean {
    if (control.isDisabled || control.closest("[hidden]") !== null) return this.#set(control, null);
    const form: CamoFormValues = this.values;
    const own = firstFailure(this.rules[control.name], valueOf(control as Entry), form);
    const missing =
      own === null && control.required && this.#empty(control as Entry)
        ? this.requiredMessage
        : null;
    return this.#set(control, own ?? missing);
  }

  #empty(control: Entry): boolean {
    const v = valueOf(control);
    return (
      v === null ||
      v === undefined ||
      v === false ||
      v === "" ||
      (Array.isArray(v) && v.length === 0)
    );
  }

  /** Puts `message` on the control, or clears this form's own message. Returns whether the control is valid. */
  #set(control: CamoControl, message: string | null): boolean {
    if (message !== null) {
      this.#mine.set(control, message);
      control.error = message;
    } else if (this.#mine.has(control)) {
      this.#mine.delete(control);
      control.error = null;
    }
    return message === null && control.error === null;
  }

  /** Validates every input. Focuses the first invalid one and fires `camo-invalid`, unless all are fine. */
  validate(): boolean {
    const errors: Record<string, string> = {};
    let first: CamoControl | null = null;
    for (const control of this.controls) {
      if (!this.validateField(control) && control.error !== null) {
        errors[control.name] = control.error;
        first ??= control;
      }
    }
    this.#valid = first === null;
    if (first !== null) {
      first.focus();
      this.dispatchEvent(
        new CustomEvent<CamoInvalidDetail>("camo-invalid", {
          detail: { errors, first },
          bubbles: true,
          composed: true,
        }),
      );
    }
    return this.#valid;
  }

  /** Server errors by input name; each shows on its input until the user changes it. */
  setErrors(errors: Record<string, string>): void {
    for (const control of this.controls) {
      const message = errors[control.name];
      if (message !== undefined) this.#set(control, message);
    }
    this.#valid = Object.keys(errors).length === 0;
  }

  /** Every input back to what it started as, errors cleared. */
  reset(): void {
    if (this.#native !== null) this.#native.reset();
    else for (const c of this.controls) c.formResetCallback();
    for (const c of this.controls) this.#set(c, null);
    this.#valid = true;
  }

  /** Validates, then fires `camo-submit` (and submits the native form, unless the app cancelled). */
  requestSubmit(): void {
    if (!this.validate()) return;
    const detail: CamoSubmitDetail = { values: this.values, formData: this.formData };
    const go = this.dispatchEvent(
      new CustomEvent<CamoSubmitDetail>("camo-submit", {
        detail,
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
    if (go && this.#native !== null) this.#native.submit();
  }

  readonly #onNativeSubmit = (event: Event): void => {
    // The form's own submit: validate, tell the app, and let the browser go on only if all is well and not cancelled.
    event.preventDefault();
    if (!this.validate()) return;
    const detail: CamoSubmitDetail = { values: this.values, formData: this.formData };
    const go = this.dispatchEvent(
      new CustomEvent<CamoSubmitDetail>("camo-submit", {
        detail,
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
    if (go) this.#native?.submit();
  };

  readonly #onNativeReset = (): void => {
    for (const c of this.controls) this.#set(c, null);
    this.#valid = true;
  };

  readonly #onRequest = (event: Event): void => {
    event.stopPropagation();
    if (this.#native === null) this.requestSubmit();
    else this.#native.requestSubmit();
  };

  #controlOf(event: Event): CamoControl | null {
    const target = event.composedPath().find((n) => n instanceof CamoControl);
    return target instanceof CamoControl && target.name !== "" ? target : null;
  }

  readonly #onInput = (event: Event): void => {
    const control = this.#controlOf(event);
    if (control === null) return;
    this.#touched.add(control);
    // The user changed it: a message from the form (or the server) is stale now.
    if (this.#mine.has(control) && this.validateMode !== "always") this.#set(control, null);
    if (this.validateMode === "on-user-interaction") this.validateField(control);
    if (this.validateMode === "always") for (const c of this.controls) this.validateField(c);
    this.dispatchEvent(new Event("camo-changed", { bubbles: true, composed: true }));
  };

  readonly #onChange = (event: Event): void => {
    const control = this.#controlOf(event);
    if (
      control !== null &&
      this.validateMode === "on-user-interaction" &&
      this.#touched.has(control)
    )
      this.validateField(control);
  };

  readonly #onFocusOut = (event: FocusEvent): void => {
    const control = this.#controlOf(event);
    if (control === null || this.validateMode !== "on-unfocus") return;
    if (control.contains(event.relatedTarget as Node | null)) return;
    this.validateField(control);
  };

  readonly #onClick = (event: Event): void => {
    const button = event
      .composedPath()
      .find((n) => n instanceof HTMLElement && n.localName === "camo-button");
    if (!(button instanceof HTMLElement) || button.hasAttribute("disabled")) return;
    const type = button.getAttribute("type");
    if (type === "submit") {
      if (this.#native !== null) this.#native.requestSubmit();
      else this.requestSubmit();
    } else if (type === "reset") this.reset();
  };

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
