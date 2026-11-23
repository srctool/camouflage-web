import { html } from "lit";
import type { PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { CamoControl } from "../behavior/control.ts";
import type { ControlValue } from "../behavior/control.ts";
import { CamouflageController } from "../controller.ts";
import type { SliderState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

/** The decimals a step needs, so `0.1 + 0.2` becomes `0.3` and not `0.30000000000000004`. */
function decimalsOf(step: number): number {
  if (!Number.isFinite(step) || step <= 0) return 0;
  const [, fraction = ""] = String(step).split(".");
  return fraction.length;
}

/**
 * `<camo-slider name="volume" label="Volume" min="0" max="100" step="5" value="30"></camo-slider>`
 *
 * A value on a range. `step` 0 is continuous; a positive step snaps and draws a stop mark at each stop. Pointer: press
 * or drag anywhere on the track. Keyboard: arrows move one step (5% when continuous; horizontal arrows follow the
 * writing direction), PageUp and PageDown move 10%, Home and End jump to the ends. It is an adjustable element named
 * by `label` and valued by `valueLabel(value)` (a property) or the number. Form-associated.
 *
 * @tagname camo-slider
 * @attr {number} value - The value.
 * @attr {number} min - The lower end; 0 by default.
 * @attr {number} max - The upper end; 1 by default.
 * @attr {number} step - The stop spacing; 0 is continuous (the contract's `steps`, as a spacing like a native range).
 * @attr {string} label - The accessible name ("Volume").
 * @attr {boolean} disabled - Blocks use and focus (the contract's `enabled`, inverted).
 * @attr {string} name - The name the value is submitted under.
 * @fires {CustomEvent<CamoBeforeChangeDetail>} camo-before-change - Cancelable, before the value changes.
 * @fires input - The value changed while the user is dragging or pressing keys.
 * @fires change - The user finished (released, or pressed a key).
 */
export class CamoSlider extends CamoControl {
  static override properties: PropertyDeclarations = {
    value: { type: Number },
    min: { type: Number },
    max: { type: Number },
    step: { type: Number },
    label: { type: String },
    valueLabel: { attribute: false },
    dragging: { state: true },
  };

  declare value: number;
  declare min: number;
  declare max: number;
  declare step: number;
  declare label: string | null;
  /** Text for the drag label and for screen readers; a property, since it is a function. */
  declare valueLabel: ((value: number) => string) | null;
  declare protected dragging: boolean;

  readonly #cx: CamouflageController = new CamouflageController(this);
  #defaultValue = 0;

  constructor() {
    super();
    this.value = 0;
    this.min = 0;
    this.max = 1;
    this.step = 0;
    this.label = null;
    this.valueLabel = null;
    this.dragging = false;
    this.addEventListener("pointerdown", this.#onPointerDown);
    this.addEventListener("pointermove", this.#onPointerMove);
    this.addEventListener("pointerup", this.#onPointerUp);
    this.addEventListener("pointercancel", this.#onPointerUp);
    this.addEventListener("keydown", this.#onKeyDown);
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
  }

  /** The value inside the range and on a stop. */
  get #clamped(): number {
    return this.#snap(this.value);
  }

  #snap(raw: number): number {
    const { min, max, step } = this;
    const low = Math.min(min, max);
    const high = Math.max(min, max);
    let v = Math.min(Math.max(Number.isFinite(raw) ? raw : low, low), high);
    if (step > 0) {
      v = low + Math.round((v - low) / step) * step;
      v = Math.min(v, high);
      v = Number(v.toFixed(decimalsOf(step)));
    }
    return v;
  }

  get #fraction(): number {
    const span = this.max - this.min;
    return span === 0 ? 0 : (this.#clamped - this.min) / span;
  }

  get #stops(): number {
    return this.step > 0 ? Math.round((this.max - this.min) / this.step) + 1 : 0;
  }

  /** Moves to `raw`: snaps, asks, and fires `input`. Returns whether the value changed. */
  #set(raw: number): boolean {
    const next = this.#snap(raw);
    if (next === this.#clamped || this.isDisabled) return false;
    if (!this.beforeChange(next)) return false;
    this.value = next;
    this.fireInput();
    return true;
  }

  #fromPointer(event: PointerEvent): void {
    const rail = this.renderRoot.querySelector<HTMLElement>(".rail");
    if (rail === null) return;
    const box = rail.getBoundingClientRect();
    const thumb = parseFloat(getComputedStyle(rail).getPropertyValue("--s-thumb")) || 0;
    const usable = Math.max(box.width - thumb, 1);
    const rtl = getComputedStyle(this).direction === "rtl";
    const x = rtl ? box.right - thumb / 2 - event.clientX : event.clientX - box.left - thumb / 2;
    const fraction = Math.min(Math.max(x / usable, 0), 1);
    this.#set(this.min + fraction * (this.max - this.min));
  }

  readonly #onPointerDown = (event: PointerEvent): void => {
    if (this.isDisabled || event.button !== 0) return;
    this.setPointerCapture(event.pointerId);
    this.dragging = true;
    this.focus();
    this.#fromPointer(event);
  };

  readonly #onPointerMove = (event: PointerEvent): void => {
    if (this.dragging) this.#fromPointer(event);
  };

  readonly #onPointerUp = (): void => {
    if (!this.dragging) return;
    this.dragging = false;
    this.fireChange();
  };

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    if (this.isDisabled) return;
    const span = this.max - this.min;
    const unit = this.step > 0 ? this.step : span * 0.05;
    const rtl = getComputedStyle(this).direction === "rtl";
    let next: number | undefined;
    switch (event.key) {
      case "ArrowUp":
        next = this.#clamped + unit;
        break;
      case "ArrowDown":
        next = this.#clamped - unit;
        break;
      case "ArrowRight":
        next = this.#clamped + (rtl ? -unit : unit);
        break;
      case "ArrowLeft":
        next = this.#clamped + (rtl ? unit : -unit);
        break;
      case "PageUp":
        next = this.#clamped + span * 0.1;
        break;
      case "PageDown":
        next = this.#clamped - span * 0.1;
        break;
      case "Home":
        next = this.min;
        break;
      case "End":
        next = this.max;
        break;
      default:
        return;
    }
    event.preventDefault();
    if (this.#set(next)) this.fireChange();
  };

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    const v = this.#clamped;
    applyAria(this, this.internals, {
      role: "slider",
      label: this.label === "" ? null : this.label,
      disabled: this.isDisabled,
      value: { now: v, min: this.min, max: this.max, text: this.valueLabel?.(v) ?? null },
      orientation: "horizontal",
    });
    this.setAttribute("tabindex", this.isDisabled ? "-1" : "0");
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html``;
    const renderer = skin.slider;
    const v = this.#clamped;
    const state: SliderState = {
      fraction: this.#fraction,
      stops: this.#stops,
      disabled: this.isDisabled,
      dragging: this.dragging,
      valueText: this.valueLabel?.(v) ?? String(v),
    };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: {},
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
    })}`;
  }
}
