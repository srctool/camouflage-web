import { LitElement, html, nothing } from "lit";
import type { PropertyDeclarations, TemplateResult } from "lit";
import { live } from "lit/directives/live.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { CamoControl } from "../behavior/control.ts";
import type { ControlValue } from "../behavior/control.ts";
import { applyEdit } from "../input/format.ts";
import type { CamoDisplayFormat, CamoInputFilter } from "../input/format.ts";
import { FIELD_IDS } from "../skin/ids.ts";

/**
 * The text-input engine under `camo-text-field`, `camo-search-field` and the date and time fields: the editable node,
 * the value, the filter and the format, focus, and the field events. The node lives here, not in the skin, so every
 * skin gets the same cursor-safe filtering and formatting; a skin only places it (`nodes.input`).
 *
 * `value` is the raw text. A `displayFormat` shows it formatted (`0812-3456`) and the cursor is mapped between the two
 * texts, so it never jumps; an `inputFilter` decides what is accepted before the app sees it.
 */
export abstract class CamoTextInput extends CamoControl {
  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override properties: PropertyDeclarations = {
    value: { type: String },
    placeholder: { type: String },
    autocomplete: { type: String },
    inputmode: { type: String },
    inputFilter: { attribute: false },
    displayFormat: { attribute: false },
    focused: { state: true },
  };

  declare value: string;
  declare placeholder: string | null;
  declare autocomplete: string | null;
  declare inputmode: string | null;
  /** Which input is accepted, before `input` fires; a property, since it is an object with a function. */
  declare inputFilter: CamoInputFilter | null;
  /** How the raw `value` is shown; a property, since it is an object with functions. */
  declare displayFormat: CamoDisplayFormat | null;
  declare protected focused: boolean;

  #defaultValue = "";

  constructor() {
    super();
    this.value = "";
    this.placeholder = null;
    this.autocomplete = null;
    this.inputmode = null;
    this.inputFilter = null;
    this.displayFormat = null;
    this.focused = false;
  }

  protected get inputElement(): HTMLInputElement | HTMLTextAreaElement | null {
    return (
      this.renderRoot?.querySelector<HTMLInputElement | HTMLTextAreaElement>(".camo-input") ?? null
    );
  }

  override focus(options?: FocusOptions): void {
    (this.inputElement ?? this).focus(options);
  }

  protected override formValue(): ControlValue {
    return this.value;
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
    if (typeof state === "string") this.value = state;
  }
  protected override validationAnchor(): HTMLElement | undefined {
    return this.inputElement ?? undefined;
  }

  /** The text the input shows for the value now. */
  protected get shown(): string {
    return this.displayFormat === null ? this.value : this.displayFormat.format(this.value);
  }

  protected inputType(): string {
    return "text";
  }
  protected isMultiline(): boolean {
    return false;
  }
  protected keyHint(): string | undefined {
    return undefined;
  }
  /** Describes the field to assistive technology: `aria-label` when there is no visible label. */
  protected accessibleName(): string | null {
    return this.placeholder;
  }
  protected hasLabel(): boolean {
    return false;
  }
  protected describedBy(): string | undefined {
    return undefined;
  }
  /** Called for Enter in a single-line field. */
  protected submitted(): void {
    this.requestSubmit();
  }

  /** The editable node: an `<input>`, or a `<textarea>` for a multiline field. */
  protected renderInput(): TemplateResult {
    const common = {
      id: FIELD_IDS.input,
      class: "camo-input",
    };
    const labelled = this.hasLabel();
    const name = labelled ? undefined : (this.accessibleName() ?? undefined);
    const invalid = this.error !== null;
    if (this.isMultiline()) {
      return html`<textarea
        id=${common.id}
        class=${common.class}
        rows="3"
        placeholder=${ifDefined(this.placeholder ?? undefined)}
        aria-labelledby=${ifDefined(labelled ? FIELD_IDS.label : undefined)}
        aria-label=${ifDefined(name)}
        aria-describedby=${ifDefined(this.describedBy())}
        aria-invalid=${invalid ? "true" : nothing}
        aria-required=${this.required ? "true" : nothing}
        ?disabled=${this.isDisabled}
        .value=${live(this.shown)}
        @input=${this.#onInput}
        @change=${this.#onChange}
        @focus=${this.#onFocus}
        @blur=${this.#onBlur}
      ></textarea>`;
    }
    return html`<input
      id=${common.id}
      class=${common.class}
      type=${this.inputType()}
      value=${this.shown}
      placeholder=${ifDefined(this.placeholder ?? undefined)}
      autocomplete=${ifDefined(this.autocomplete ?? undefined)}
      inputmode=${ifDefined(this.inputmode ?? undefined)}
      enterkeyhint=${ifDefined(this.keyHint())}
      aria-labelledby=${ifDefined(labelled ? FIELD_IDS.label : undefined)}
      aria-label=${ifDefined(name)}
      aria-describedby=${ifDefined(this.describedBy())}
      aria-invalid=${invalid ? "true" : nothing}
      aria-required=${this.required ? "true" : nothing}
      ?disabled=${this.isDisabled}
      .value=${live(this.shown)}
      @input=${this.#onInput}
      @change=${this.#onChange}
      @focus=${this.#onFocus}
      @blur=${this.#onBlur}
      @keydown=${this.#onKeyDown}
    />`;
  }

  readonly #onInput = (event: Event): void => {
    // The native `input` is composed and would reach the app twice; the element fires its own, once per edit.
    event.stopPropagation();
    const el = event.target as HTMLInputElement | HTMLTextAreaElement;
    const edit = applyEdit(
      this.value,
      el.value,
      el.selectionStart ?? el.value.length,
      this.inputFilter,
      this.displayFormat,
    );
    const rejected = edit.raw !== this.value && !this.beforeChange(edit.raw);
    const accepted = rejected ? this.value : edit.raw;
    const shown = this.displayFormat === null ? accepted : this.displayFormat.format(accepted);
    const changed = accepted !== this.value;
    this.value = accepted;
    if (el.value !== shown) el.value = shown;
    if (!rejected) {
      try {
        el.setSelectionRange(edit.cursor, edit.cursor);
      } catch {
        // A type that has no selection (email, number) keeps its own caret.
      }
    }
    if (changed) this.fireInput();
  };

  readonly #onChange = (event: Event): void => {
    event.stopPropagation();
    this.fireChange();
  };

  readonly #onFocus = (): void => {
    this.focused = true;
  };

  readonly #onBlur = (): void => {
    this.focused = false;
  };

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Enter" && !event.isComposing && !this.isMultiline()) this.submitted();
  };
}
