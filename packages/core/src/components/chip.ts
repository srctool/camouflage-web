import { LitElement, css, html, isServer, nothing } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { attachActivation } from "../behavior/activation.ts";
import { applyAria } from "../behavior/aria.ts";
import { CamoControl } from "../behavior/control.ts";
import type { ControlValue } from "../behavior/control.ts";
import { PressController } from "../behavior/press.ts";
import { RovingTabindexController } from "../behavior/roving.ts";
import { CamouflageController } from "../controller.ts";
import { closeIcon } from "../skin/status.ts";
import type { Appearance, ChipKind, ChipLayout, ChipState, Tone } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = { leading: "leading" } as const;
const PICK = "camo-chip-pick";

/** What a chip is, from its parameters (the contract's `chipKind`): a toggle, a removable input, an action, or a plain tag. */
export function chipKind(chip: {
  selectable: boolean;
  removable: boolean;
  clickable: boolean;
}): ChipKind {
  if (chip.selectable) return "filter";
  if (chip.removable) return "input";
  return chip.clickable ? "action" : "tag";
}

/**
 * `<camo-chip label="Open now" selectable selected>`, `<camo-chip label="ada@example.com" removable>`,
 * `<camo-chip label="Add to calendar" clickable>` or `<camo-chip label="Paid" appearance="soft" tone="success">`
 *
 * One component whose parameters decide the kind: a **filter** (`selectable`, a toggle that the app flips from `click`),
 * an **input** chip (`removable`, a ✕ button that fires `camo-remove`, and Delete or Backspace on the focused chip), an
 * **action** (`clickable`, a button), or a static **tag** (none of them: status words with a tone color). An interactive
 * chip keeps a 48 px touch area around its 32 px look. A leading icon or small avatar goes in the `leading` slot. A
 * long label is one line with an ellipsis.
 *
 * @tagname camo-chip
 * @slot leading - An icon or a small `camo-avatar`.
 * @attr {string} label - The text, and the accessible name.
 * @attr {string} value - What a `camo-chip-group` reports when this chip is on.
 * @attr {boolean} clickable - The chip is a button (an action chip).
 * @attr {boolean} selectable - The chip is a toggle (a filter chip; the contract's non-null `selected`).
 * @attr {boolean} selected - Whether a filter chip is on.
 * @attr {boolean} removable - Shows a ✕ (the contract's non-null `onRemove`).
 * @attr {"solid"|"soft"|"raised"|"outline"|"ghost"|"link"} appearance - Absent means the skin's default (`outline`); the others fall back to it.
 * @attr {"default"|"error"|"success"|"warning"|"info"} tone - The colour family.
 * @attr {boolean} disabled - Blocks clicks and focus (the contract's `enabled`, inverted).
 * @fires camo-remove - The ✕ was pressed, or Delete or Backspace on the focused chip.
 */
export class CamoChip extends LitElement {
  static override properties: PropertyDeclarations = {
    label: { type: String },
    value: { type: String },
    appearance: { type: String, reflect: true },
    tone: { type: String, reflect: true },
    clickable: { type: Boolean, reflect: true },
    selectable: { type: Boolean, reflect: true },
    selected: { type: Boolean, reflect: true },
    removable: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    radio: { type: Boolean, attribute: false },
  };

  static override styles: CSSResult = css``;

  declare label: string;
  declare value: string;
  declare appearance: Appearance | null;
  declare tone: Tone;
  declare clickable: boolean;
  declare selectable: boolean;
  declare selected: boolean;
  declare removable: boolean;
  declare disabled: boolean;
  /** Set by a single-choice `camo-chip-group`: the chip is a radio, not a toggle button. */
  declare radio: boolean;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  readonly #press: PressController = new PressController(
    this,
    () => this.disabled || !this.#interactive,
  );

  constructor() {
    super();
    this.label = "";
    this.value = "";
    this.appearance = null;
    this.tone = "default";
    this.clickable = false;
    this.selectable = false;
    this.selected = false;
    this.removable = false;
    this.disabled = false;
    this.radio = false;
    // Only a disabled chip swallows clicks: a tag or an input chip has no click of its own, but its ✕ does.
    attachActivation(this, () => this.disabled);
    void this.#press;
    this.addEventListener("click", () => {
      if (this.selectable && !this.disabled)
        this.dispatchEvent(new CustomEvent(PICK, { bubbles: true, composed: true }));
    });
    this.addEventListener("keydown", (event) => {
      if (event.target !== this || this.disabled || !this.removable) return;
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        this.#remove();
      }
    });
  }

  get kind(): ChipKind {
    return chipKind(this);
  }

  get #interactive(): boolean {
    return this.selectable || this.clickable;
  }

  #remove(): void {
    this.dispatchEvent(new CustomEvent("camo-remove", { bubbles: true, composed: true }));
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    const interactive = this.#interactive;
    applyAria(this, this.#internals, {
      role: !interactive ? "generic" : this.radio && this.selectable ? "radio" : "button",
      label: this.label === "" ? null : this.label,
      disabled: interactive && this.disabled,
      ...(this.selectable
        ? this.radio
          ? { checked: this.selected }
          : { pressed: this.selected }
        : {}),
    });
    if (!isServer && this.closest("camo-chip-group") !== null) return; // the group owns the tab order
    if (interactive) this.setAttribute("tabindex", this.disabled ? "-1" : "0");
    else this.removeAttribute("tabindex");
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`${this.label}<slot name="leading"></slot>`;
    const renderer = skin.chip;
    const style = renderer.defaults(tokens);
    const interactive = this.#interactive;
    const state: ChipState = {
      label: this.label,
      kind: this.kind,
      selected: this.selected,
      appearance: this.appearance || style.defaultAppearance,
      tone: this.tone,
      disabled: this.disabled,
      removable: this.removable,
    };
    // Inside an interactive chip the ✕ would nest a button in a button for assistive technology: it is pointer-only
    // there (Delete and Backspace remove from the keyboard); on its own it is a real, labelled button.
    const remove = this.removable
      ? html`<button
          class="remove"
          type="button"
          part="remove"
          aria-label=${interactive ? nothing : `Remove ${this.label}`}
          aria-hidden=${interactive ? "true" : nothing}
          tabindex=${interactive || this.disabled ? "-1" : "0"}
          ?disabled=${this.disabled}
          @click=${(event: Event): void => {
            event.stopPropagation();
            if (!this.disabled) this.#remove();
          }}
        >
          ${closeIcon}
        </button>`
      : nothing;
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: SLOTS,
      theme: tokens,
      style,
      skin,
      nodes: { remove },
    })}`;
  }
}

/**
 * `<camo-chip-group name="filters" label="Filters" multiple><camo-chip value="open" label="Open now" selectable>…</…>`
 *
 * A group of filter chips: any number on (`multiple`, toggle buttons), or one at a time (a radio group; arrow keys move
 * and select). `required` keeps one on in single choice (the last one cannot be turned off); without it a tap on the chosen
 * chip turns it off. `layout` is `wrap` (rows) or `scroll` (one horizontal row, e.g. under a search field; a chip that takes
 * focus scrolls into view). Form-associated: single submits `value`, multiple one entry per chip from `values`.
 *
 * @tagname camo-chip-group
 * @slot - The `camo-chip` options, each `selectable` and with a `value`.
 * @attr {string} value - The selected chip's value (single choice).
 * @attr {boolean} multiple - Any number of chips can be on; use the `values` property.
 * @attr {"wrap"|"scroll"} layout - Rows that wrap, or one scrolling row.
 * @attr {string} label - The group's accessible name.
 * @attr {boolean} required - Single choice: the last chosen chip cannot be turned off.
 * @attr {boolean} disabled - Disables the group (the contract's `enabled`, inverted).
 * @attr {string} name - The name the value is submitted under.
 * @fires {CustomEvent<CamoBeforeChangeDetail>} camo-before-change - Cancelable, before the selection changes.
 * @fires input - The selection changed.
 * @fires change - The selection changed.
 */
export class CamoChipGroup extends CamoControl {
  static override properties: PropertyDeclarations = {
    value: { type: String },
    values: { attribute: false },
    multiple: { type: Boolean, reflect: true },
    layout: { type: String, reflect: true },
    label: { type: String },
  };

  static override styles: CSSResult = css`
    :host {
      display: block;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--camo-chip-group-spacing, var(--camo-spacing-s));
    }
    :host([layout="scroll"]) .row {
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
    }
    :host([layout="scroll"]) ::slotted(*) {
      flex: none;
    }
    slot {
      display: contents;
    }
  `;

  declare value: string;
  declare values: string[];
  declare multiple: boolean;
  declare layout: ChipLayout;
  declare label: string | null;

  readonly #roving: RovingTabindexController = new RovingTabindexController(this, {
    items: () => this.#chips(),
    orientation: "horizontal",
  });
  #defaultValue = "";
  #defaultValues: string[] = [];

  constructor() {
    super();
    this.value = "";
    this.values = [];
    this.multiple = false;
    this.layout = "wrap";
    this.label = null;
    this.addEventListener(PICK, this.#onPick as EventListener);
    this.addEventListener("focusin", this.#onFocusIn);
  }

  #chips(): CamoChip[] {
    return [...this.querySelectorAll<CamoChip>("camo-chip")];
  }

  protected override formValue(): ControlValue {
    if (!this.multiple) return this.value === "" ? null : this.value;
    const data = new FormData();
    for (const v of this.values) data.append(this.name, v);
    return data;
  }
  protected override isEmpty(): boolean {
    return this.multiple ? this.values.length === 0 : this.value === "";
  }
  protected override captureDefault(): void {
    this.#defaultValue = this.value;
    this.#defaultValues = [...this.values];
  }
  protected override resetToDefault(): void {
    this.value = this.#defaultValue;
    this.values = [...this.#defaultValues];
  }

  #isOn(chip: CamoChip): boolean {
    return this.multiple ? this.values.includes(chip.value) : chip.value === this.value;
  }

  #pick(chip: CamoChip): void {
    if (chip.disabled || this.isDisabled) return;
    if (this.multiple) {
      const next = this.values.includes(chip.value)
        ? this.values.filter((v) => v !== chip.value)
        : [...this.values, chip.value];
      if (!this.beforeChange(next)) return;
      this.values = next;
    } else {
      const on = chip.value === this.value;
      // Required single choice: the chosen chip stays on. Otherwise a tap on it turns it off.
      if (on && this.required) return;
      const next = on ? "" : chip.value;
      if (!this.beforeChange(next)) return;
      this.value = next;
    }
    this.fireInput();
    this.fireChange();
  }

  readonly #onPick = (event: Event): void => {
    event.stopPropagation();
    this.#pick(event.target as CamoChip);
  };

  // As a radio group: an arrow key moves focus and selects.
  readonly #onFocusIn = (event: FocusEvent): void => {
    const chip = (event.target as Element).closest<CamoChip>("camo-chip");
    if (chip !== null && !this.multiple && chip.matches(":focus-visible") && !this.#isOn(chip))
      this.#pick(chip);
    if (chip !== null && this.layout === "scroll")
      chip.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  #sync(): void {
    const chips = this.#chips();
    chips.forEach((chip) => {
      chip.selectable = true;
      chip.selected = this.#isOn(chip);
      chip.radio = !this.multiple;
      chip.disabled = chip.hasAttribute("disabled") || this.isDisabled;
    });
    const at = chips.findIndex((c) => c.selected && !c.disabled);
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
      role: this.multiple ? "group" : "radiogroup",
      label: this.label === "" ? null : this.label,
      disabled: this.isDisabled,
    });
  }

  protected override updated(): void {
    super.updated();
    this.#sync();
  }

  override render(): TemplateResult {
    return html`<div class="row" part="group"><slot></slot></div>`;
  }
}
