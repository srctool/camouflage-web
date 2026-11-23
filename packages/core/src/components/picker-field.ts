import { LitElement, css, html, nothing } from "lit";
import type { CSSResult, PropertyDeclarations, TemplateResult } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { CamoControl } from "../behavior/control.ts";
import type { ControlValue } from "../behavior/control.ts";
import { CamouflageController } from "../controller.ts";
import { FIELD_IDS } from "../skin/ids.ts";
import type { LabelPlacement, Presentation, TextFieldState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = { "prefix-icon": "prefix-icon", "suffix-icon": "suffix-icon" } as const;

/**
 * The base of the date and time pickers: a field that shows the chosen value and opens a panel to choose it. The field
 * is the text field's renderer; the panel is a native popover (`popover="auto"`, so Escape, a click outside and focus
 * return are the browser's), shown below the field on a wide window or as a bottom sheet on a compact one. A subclass
 * says what the field shows (`displayText`) and what the panel holds (`renderPanel`).
 */
export abstract class CamoPickerField extends CamoControl {
  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override properties: PropertyDeclarations = {
    label: { type: String },
    placeholder: { type: String },
    supportingText: { type: String, attribute: "supporting-text" },
    labelPlacement: { type: String, attribute: "label-placement", reflect: true },
    presentation: { type: String },
    instant: { type: Boolean },
    locale: { type: String },
    min: { type: String },
    max: { type: String },
    okLabel: { type: String, attribute: "ok-label" },
    cancelLabel: { type: String, attribute: "cancel-label" },
    open: { state: true },
    focused: { state: true },
  };

  static override styles: CSSResult = css`
    :host {
      display: inline-block;
    }
    .camo-popup {
      position: fixed;
      inset: auto;
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
      overflow: visible;
      color: var(--camo-color-on-surface);
      max-inline-size: 100vw;
    }
    .camo-popup.sheet {
      inset-inline: 0;
      inset-block-end: 0;
      inline-size: 100%;
    }
    .camo-popup.sheet::backdrop {
      background: color-mix(in srgb, var(--camo-color-scrim) 32%, transparent);
    }
    .panel {
      padding: var(--camo-spacing-m);
      display: flex;
      flex-direction: column;
      gap: var(--camo-spacing-m);
      align-items: center;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--camo-spacing-s);
      align-self: stretch;
    }
    .camo-input {
      cursor: pointer;
      text-overflow: ellipsis;
    }
    .glyph {
      inline-size: 20px;
      block-size: 20px;
      fill: currentColor;
    }
  `;

  declare label: string | null;
  declare placeholder: string | null;
  declare supportingText: string | null;
  declare labelPlacement: LabelPlacement | null;
  /** `auto` is a popup on a wide window and a sheet on a compact one. */
  declare presentation: Presentation;
  /** Choose and close in one step, with no Cancel and OK. */
  declare instant: boolean;
  declare locale: string | null;
  declare min: string | null;
  declare max: string | null;
  declare okLabel: string;
  declare cancelLabel: string;
  declare protected open: boolean;
  declare protected focused: boolean;

  protected readonly cx: CamouflageController = new CamouflageController(this);

  constructor() {
    super();
    this.label = null;
    this.placeholder = null;
    this.supportingText = null;
    this.labelPlacement = null;
    this.presentation = "auto";
    this.instant = false;
    this.locale = null;
    this.min = null;
    this.max = null;
    this.okLabel = "OK";
    this.cancelLabel = "Cancel";
    this.open = false;
    this.focused = false;
  }

  /** The text the field shows for the value now. */
  protected abstract displayText(): string;
  /** The panel's content: the calendar or the time picker, and its buttons. */
  protected abstract renderPanel(): TemplateResult;
  /** The panel's accessible name. */
  protected abstract panelLabel(): string;
  /** The path of the field's icon (a calendar, a clock), 24 by 24. */
  protected abstract iconPath(): string;
  /** Called as the panel opens: start a draft from the value. */
  protected abstract openDraft(): void;

  protected get popup(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>(".camo-popup") ?? null;
  }

  protected override isEmpty(): boolean {
    return this.displayText() === "";
  }
  protected override validationAnchor(): HTMLElement | undefined {
    return this.renderRoot?.querySelector<HTMLElement>(".camo-input") ?? undefined;
  }
  protected override formValue(): ControlValue {
    return null;
  }
  override focus(options?: FocusOptions): void {
    (this.renderRoot?.querySelector<HTMLElement>(".camo-input") ?? this).focus(options);
  }

  get #sheet(): boolean {
    if (this.presentation !== "auto") return this.presentation === "sheet";
    return this.cx.environment.windowSize === "compact";
  }

  async show(): Promise<void> {
    if (this.open || this.isDisabled) return;
    this.openDraft();
    this.open = true;
    await this.updateComplete;
    const popup = this.popup;
    if (popup === null) return;
    popup.showPopover();
    // The panel was drawn while hidden, where nothing has a size: draw it again now that it has (a wheel scrolls to its value).
    this.requestUpdate();
    await this.updateComplete;
    this.#position(popup);
    const target =
      popup.querySelector<HTMLElement>(
        '[tabindex="0"], button:not([disabled]), input, [role="spinbutton"]',
      ) ?? popup;
    // The calendar is a nested custom element: its tab stop is inside its shadow root.
    const inner = (target.shadowRoot?.querySelector<HTMLElement>('[tabindex="0"]') ??
      target) as HTMLElement;
    inner.focus({ preventScroll: true });
  }

  /** Closes the panel and puts focus back on the field, as closing a native dialog does. */
  hide(): void {
    this.#returnFocus = true;
    this.popup?.hidePopover?.();
  }

  #position(popup: HTMLElement): void {
    if (this.#sheet) return;
    const anchor = this.getBoundingClientRect();
    const width = popup.offsetWidth;
    const height = popup.offsetHeight;
    const rtl = getComputedStyle(this).direction === "rtl";
    let left = rtl ? anchor.right - width : anchor.left;
    left = Math.min(Math.max(left, 4), Math.max(window.innerWidth - width - 4, 4));
    let top = anchor.bottom + 4;
    if (top + height > window.innerHeight && anchor.top - height - 4 > 0)
      top = anchor.top - height - 4;
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
  }

  // Escape and the buttons return focus to the field; a click elsewhere leaves it where the user put it.
  #returnFocus = false;

  readonly #onToggle = (event: Event): void => {
    const state = (event as ToggleEvent).newState;
    this.open = state === "open";
    if (state === "closed" && this.#returnFocus) this.focus({ preventScroll: true });
    this.#returnFocus = false;
  };

  readonly #onPopupKey = (event: KeyboardEvent): void => {
    if (event.key === "Escape") this.#returnFocus = true;
  };

  // Enter and Down open on key down; Space opens on key up, as a native button does, so the key's release does not land
  // on whatever the panel focused.
  #onKey(event: KeyboardEvent): void {
    if (this.isDisabled) return;
    if (event.key === "Enter" || event.key === "ArrowDown") {
      event.preventDefault();
      void this.show();
    } else if (event.key === " ") {
      event.preventDefault();
    }
  }

  #onKeyUp(event: KeyboardEvent): void {
    if (this.isDisabled || event.key !== " ") return;
    event.preventDefault();
    void this.show();
  }

  /** The field's editable node: a read-only input that shows the value and opens the panel. */
  protected renderInput(): TemplateResult {
    const labelled = this.label !== null && this.label !== "";
    const described =
      this.error !== null
        ? FIELD_IDS.error
        : this.supportingText !== null && this.supportingText !== ""
          ? FIELD_IDS.supporting
          : undefined;
    return html`<input
      id=${FIELD_IDS.input}
      class="camo-input"
      type="text"
      readonly
      role="combobox"
      aria-haspopup="dialog"
      aria-expanded=${this.open ? "true" : "false"}
      aria-labelledby=${ifDefined(labelled ? FIELD_IDS.label : undefined)}
      aria-label=${ifDefined(labelled ? undefined : (this.placeholder ?? undefined))}
      aria-describedby=${ifDefined(described)}
      aria-invalid=${this.error === null ? nothing : "true"}
      aria-required=${this.required ? "true" : nothing}
      placeholder=${ifDefined(this.placeholder ?? undefined)}
      value=${this.displayText()}
      .value=${this.displayText()}
      ?disabled=${this.isDisabled}
      @click=${(): void => void this.show()}
      @keydown=${(e: KeyboardEvent): void => this.#onKey(e)}
      @keyup=${(e: KeyboardEvent): void => this.#onKeyUp(e)}
      @focus=${(): void => void (this.focused = true)}
      @blur=${(): void => void (this.focused = false)}
    />`;
  }

  /** Cancel and OK, for a panel that confirms; or nothing when it chooses at once. */
  protected renderActions(
    confirm: () => void,
    cancel: () => void,
    confirmLabel?: string,
  ): TemplateResult {
    return html`<div class="actions">
      <camo-button text=${this.cancelLabel} appearance="ghost" @click=${cancel}></camo-button>
      <camo-button text=${confirmLabel ?? this.okLabel} @click=${confirm}></camo-button>
    </div>`;
  }

  override render(): TemplateResult {
    const skin = this.cx.skin;
    if (skin === undefined) return html`${this.renderInput()}`;
    const renderer = skin.textField;
    const style = renderer.defaults(tokens);
    const state: TextFieldState = {
      label: this.label === "" ? null : this.label,
      placeholder: this.placeholder,
      supportingText: this.supportingText,
      error: this.error ?? this.ownProblem(),
      prefixText: null,
      suffixText: null,
      disabled: this.isDisabled,
      focused: this.focused || this.open,
      multiline: false,
      required: this.required,
      isEmpty: this.displayText() === "",
      labelPlacement: this.labelPlacement || style.labelPlacement,
    };
    // The field's own icon sits at the end of the input row, inside the box, and opens the panel like the input does.
    const icon = html`<svg class="glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path d=${this.iconPath()} />
    </svg>`;
    const panel = this.open
      ? skin.surfaceTreatment.decorate({
          child: html`<div class="panel">${this.renderPanel()}</div>`,
          color: tokens.colors.surfaceContainerHigh,
          shape: this.#sheet
            ? `${tokens.shapes.extraLarge} ${tokens.shapes.extraLarge} 0 0`
            : tokens.shapes.large,
          elevation: tokens.elevation.level3,
          block: true,
          theme: tokens,
        })
      : nothing;
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: SLOTS,
      theme: tokens,
      style,
      skin,
      nodes: { input: html`${this.renderInput()}${icon}` },
    })}
    <div
      class="camo-popup ${this.#sheet ? "sheet" : ""}"
      popover="auto"
      role="dialog"
      aria-label=${this.panelLabel()}
      @toggle=${this.#onToggle}
      @keydown=${this.#onPopupKey}
    >
      ${panel}
    </div>`;
  }
}
