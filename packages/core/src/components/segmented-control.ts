import { LitElement, html, isServer } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { attachActivation } from "../behavior/activation.ts";
import { applyAria } from "../behavior/aria.ts";
import { CamoControl } from "../behavior/control.ts";
import type { ControlValue } from "../behavior/control.ts";
import { PressController } from "../behavior/press.ts";
import { RovingTabindexController } from "../behavior/roving.ts";
import { CamouflageController } from "../controller.ts";
import { resolveIcon } from "../icons.ts";
import type { SegmentPosition, SegmentState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";
import { nameOf } from "./toggle.ts";

const SLOTS = { content: "" } as const;
const PICK = "camo-segment-pick";

/**
 * `<camo-segment value="week" label="Week">` or `<camo-segment value="list" icon="list" content-description="List">`
 *
 * One segment of a `camo-segmented-control`. It needs a `label` or an `icon`; an icon-only segment needs
 * `content-description`. Custom content (an icon with a count) goes in the default slot.
 *
 * @tagname camo-segment
 * @slot - Custom content, drawn after the label.
 * @attr {string} value - What the control's value becomes when this one is picked.
 * @attr {string} label - The text.
 * @attr {string} icon - The name of a registered icon.
 * @attr {string} content-description - The accessible name of an icon-only segment.
 * @attr {boolean} disabled - Blocks picking and focus (the contract's `enabled`, inverted).
 */
export class CamoSegment extends LitElement {
  static override properties: PropertyDeclarations = {
    value: { type: String },
    label: { type: String },
    icon: { type: String },
    contentDescription: { type: String, attribute: "content-description" },
    disabled: { type: Boolean, reflect: true },
    selected: { type: Boolean, reflect: true },
    position: { attribute: false },
    multiple: { type: Boolean, attribute: false },
  };

  static override styles: CSSResult[] = [];

  declare value: string;
  declare label: string | null;
  declare icon: string | null;
  declare contentDescription: string | null;
  declare disabled: boolean;
  /** Set by the control. */
  declare selected: boolean;
  declare position: SegmentPosition;
  declare multiple: boolean;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  readonly #press: PressController = new PressController(this, () => this.disabled);

  constructor() {
    super();
    this.value = "";
    this.label = null;
    this.icon = null;
    this.contentDescription = null;
    this.disabled = false;
    this.selected = false;
    this.position = "only";
    this.multiple = false;
    this.addEventListener("click", () => {
      if (!this.disabled)
        this.dispatchEvent(new CustomEvent(PICK, { bubbles: true, composed: true }));
    });
    attachActivation(this, () => this.disabled, { enter: false });
    void this.#press;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    const name = this.contentDescription ?? nameOf(this.label, this);
    applyAria(this, this.#internals, {
      role: this.multiple ? "button" : "radio",
      label: name,
      disabled: this.disabled,
      ...(this.multiple ? { pressed: this.selected } : { checked: this.selected }),
    });
    if (!isServer && this.closest("camo-segmented-control") === null)
      this.setAttribute("tabindex", this.disabled ? "-1" : "0");
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`${this.label}<slot></slot>`;
    const renderer = skin.segment;
    const state: SegmentState = {
      selected: this.selected,
      disabled: this.disabled,
      multiple: this.multiple,
      position: this.position,
      label: this.label,
      icon: this.icon === null ? null : resolveIcon(this.icon),
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

/**
 * `<camo-segmented-control name="range" value="week" label="Range"><camo-segment value="day" label="Day">…</…>`
 *
 * A row of segments, one on (a radio group) or any number on (`multiple`, toggle buttons). Equal widths; arrow keys
 * move, and in single mode select; Space toggles in multiple mode. Form-associated: single submits `value`; multiple
 * submits one entry per selected segment, from the `values` property.
 *
 * @tagname camo-segmented-control
 * @slot - The `camo-segment` options.
 * @attr {string} value - The selected segment's value (single selection).
 * @attr {boolean} multiple - Any number of segments can be on; use the `values` property.
 * @attr {string} label - The control's accessible name.
 * @attr {boolean} disabled - Disables the control (the contract's `enabled`, inverted).
 * @attr {string} name - The name the value is submitted under.
 * @fires {CustomEvent<CamoBeforeChangeDetail>} camo-before-change - Cancelable, before the selection changes.
 * @fires input - The selection changed.
 * @fires change - The selection changed.
 */
export class CamoSegmentedControl extends CamoControl {
  static override properties: PropertyDeclarations = {
    value: { type: String },
    values: { attribute: false },
    multiple: { type: Boolean, reflect: true },
    label: { type: String },
  };

  static override styles: CSSResult[] = [];

  declare value: string;
  /** The selected values in multiple mode; a property, since it is a list. */
  declare values: string[];
  declare multiple: boolean;
  declare label: string | null;

  readonly #cx: CamouflageController = new CamouflageController(this);
  readonly #roving: RovingTabindexController = new RovingTabindexController(this, {
    items: () => this.#segments(),
    orientation: "horizontal",
  });
  #defaultValue = "";
  #defaultValues: string[] = [];

  constructor() {
    super();
    this.value = "";
    this.values = [];
    this.multiple = false;
    this.label = null;
    this.addEventListener(PICK, this.#onPick as EventListener);
    this.addEventListener("focusin", this.#onFocusIn);
  }

  #segments(): CamoSegment[] {
    return [...this.querySelectorAll<CamoSegment>("camo-segment")];
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

  #isOn(segment: CamoSegment): boolean {
    return this.multiple ? this.values.includes(segment.value) : segment.value === this.value;
  }

  #pick(segment: CamoSegment): void {
    if (segment.disabled || this.isDisabled) return;
    if (this.multiple) {
      const next = this.values.includes(segment.value)
        ? this.values.filter((v) => v !== segment.value)
        : [...this.values, segment.value];
      if (!this.beforeChange(next)) return;
      this.values = next;
    } else {
      if (segment.value === this.value || !this.beforeChange(segment.value)) return;
      this.value = segment.value;
    }
    this.fireInput();
    this.fireChange();
  }

  readonly #onPick = (event: Event): void => {
    event.stopPropagation();
    this.#pick(event.target as CamoSegment);
  };

  // As a radio group: an arrow key moves focus and, in single mode, selects.
  readonly #onFocusIn = (event: FocusEvent): void => {
    if (this.multiple) return;
    const segment = (event.target as Element).closest<CamoSegment>("camo-segment");
    if (segment !== null && segment.matches(":focus-visible")) this.#pick(segment);
  };

  #sync(): void {
    const segments = this.#segments();
    segments.forEach((segment, i) => {
      segment.selected = this.#isOn(segment);
      segment.multiple = this.multiple;
      segment.disabled = segment.hasAttribute("disabled") || this.isDisabled;
      segment.position =
        segments.length === 1
          ? "only"
          : i === 0
            ? "first"
            : i === segments.length - 1
              ? "last"
              : "middle";
    });
    const at = segments.findIndex((s) => s.selected && !s.disabled);
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
    const skin = this.#cx.skin;
    if (skin === undefined) return html`<slot></slot>`;
    const renderer = skin.segmentedControl;
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state: { disabled: this.isDisabled, multiple: this.multiple },
      slots: SLOTS,
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
    })}`;
  }
}
