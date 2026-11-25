import { html, isServer } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { css } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { CamoControl } from "../behavior/control.ts";
import type { ControlValue } from "../behavior/control.ts";
import { CamouflageController } from "../controller.ts";
import type { RatingSize, RatingState, RatingStep } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";
import { ratingAt, snapRating } from "./rating-value.ts";

const NO_SLOTS = {} as const;

/**
 * `<camo-rating label="Quality" value="3.5" step="half">` or `<camo-rating label="Quality" value="4" readonly>`
 *
 * A star rating from 0 to `max`, in whole or half steps. Read-only it is an image announcing "Quality, 3.5 of 5 stars".
 * Interactive it is an adjustable value (a slider): a click or a drag sets it, and the keyboard changes it by a step
 * (Up and Right raise it, Down and Left lower it, mirrored in right-to-left; Home sets 0 and End the maximum). Tapping the
 * current value does not clear it. The mouse shows a preview of the value under it. Form-associated: it submits `value`.
 * Fires the cancelable `camo-before-change`, then `input` while it is dragged and `change` when it is set.
 *
 * @tagname camo-rating
 * @attr {number} value - The rating, 0 to `max`, in steps.
 * @attr {number} max - How many stars; 5 by default.
 * @attr {"whole"|"half"} step - Whole or half stars.
 * @attr {"small"|"medium"|"large"} size - The star size.
 * @attr {boolean} readonly - Shows a value and cannot be changed (the contract's null `onValueChange`).
 * @attr {string} label - What is rated, and the accessible name ("Quality").
 * @attr {boolean} disabled - Blocks changes and focus (the contract's `enabled`, inverted).
 * @attr {string} name - The name the value is submitted under.
 * @fires {CustomEvent<CamoBeforeChangeDetail>} camo-before-change - Cancelable, before the value changes.
 * @fires input - The value changed while the pointer is dragged or a key pressed.
 * @fires change - The value was set.
 */
export class CamoRating extends CamoControl {
  static override properties: PropertyDeclarations = {
    value: { type: Number },
    max: { type: Number },
    step: { type: String, reflect: true },
    size: { type: String, reflect: true },
    readonly: { type: Boolean, reflect: true },
    label: { type: String },
    hover: { state: true },
  };

  static override styles: CSSResult = css``;

  declare value: number;
  declare max: number;
  declare step: RatingStep;
  declare size: RatingSize;
  declare readonly: boolean;
  declare label: string | null;
  declare protected hover: number | null;

  readonly #cx: CamouflageController = new CamouflageController(this);
  #default = 0;
  #dragging = false;

  constructor() {
    super();
    this.value = 0;
    this.max = 5;
    this.step = "whole";
    this.size = "medium";
    this.readonly = false;
    this.label = null;
    this.hover = null;
    this.addEventListener("pointermove", this.#onMove);
    this.addEventListener("pointerleave", this.#onLeave);
    this.addEventListener("pointerdown", this.#onDown);
    this.addEventListener("pointerup", this.#onUp);
    this.addEventListener("pointercancel", this.#onLeave);
    this.addEventListener("keydown", this.#onKey);
  }

  protected override formValue(): ControlValue {
    return this.value === 0 ? null : String(this.value);
  }
  protected override isEmpty(): boolean {
    return this.value === 0;
  }
  protected override captureDefault(): void {
    this.#default = this.value;
  }
  protected override resetToDefault(): void {
    this.value = this.#default;
  }

  get #interactive(): boolean {
    return !this.readonly && !this.isDisabled;
  }

  /** The value the pointer means, from where it is along the row (from the start edge). */
  #valueAt(event: PointerEvent): number {
    const row = this.renderRoot.querySelector<HTMLElement>(".rating");
    const box = (row ?? this).getBoundingClientRect();
    const rtl = getComputedStyle(this).direction === "rtl";
    const along = rtl ? box.right - event.clientX : event.clientX - box.left;
    return ratingAt(along / Math.max(box.width, 1), this.max, this.step);
  }

  #set(value: number, commit: boolean): void {
    const next = snapRating(value, this.max, this.step);
    if (next !== this.value) {
      if (!this.beforeChange(next)) return;
      this.value = next;
      this.fireInput();
    }
    if (commit) this.fireChange();
  }

  readonly #onMove = (event: PointerEvent): void => {
    if (!this.#interactive) return;
    if (this.#dragging) this.#set(this.#valueAt(event), false);
    else if (event.pointerType === "mouse") this.hover = this.#valueAt(event);
  };

  readonly #onLeave = (): void => {
    this.hover = null;
    this.#dragging = false;
  };

  readonly #onDown = (event: PointerEvent): void => {
    if (!this.#interactive || event.button !== 0) return;
    this.#dragging = true;
    this.setPointerCapture?.(event.pointerId);
    // Tapping the current value does not clear it: the value is set to what is under the pointer.
    this.#set(this.#valueAt(event), false);
  };

  readonly #onUp = (): void => {
    if (!this.#dragging) return;
    this.#dragging = false;
    this.fireChange();
  };

  readonly #onKey = (event: KeyboardEvent): void => {
    if (!this.#interactive) return;
    const rtl = getComputedStyle(this).direction === "rtl";
    const unit = this.step === "half" ? 0.5 : 1;
    let next: number | null = null;
    if (event.key === "ArrowUp" || event.key === (rtl ? "ArrowLeft" : "ArrowRight"))
      next = this.value + unit;
    else if (event.key === "ArrowDown" || event.key === (rtl ? "ArrowRight" : "ArrowLeft"))
      next = this.value - unit;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = this.max;
    if (next === null) return;
    event.preventDefault();
    this.#set(next, true);
  };

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    const text = `${this.value} of ${this.max} stars`;
    const label = this.label === null || this.label === "" ? null : this.label;
    applyAria(
      this,
      this.internals,
      this.#interactive || this.isDisabled
        ? {
            role: "slider",
            label,
            disabled: this.isDisabled,
            value: { now: this.value, min: 0, max: this.max, text },
          }
        : { role: "img", label: label === null ? text : `${label}, ${text}` },
    );
    if (!isServer) {
      if (this.#interactive) this.setAttribute("tabindex", "0");
      else this.removeAttribute("tabindex");
    }
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`${this.value} / ${this.max}`;
    const renderer = skin.rating;
    const state: RatingState = {
      value: this.value,
      max: this.max,
      step: this.step,
      size: this.size,
      hover: this.#interactive ? this.hover : null,
      interactive: this.#interactive,
      disabled: this.isDisabled,
    };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: NO_SLOTS,
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
    })}`;
  }
}
