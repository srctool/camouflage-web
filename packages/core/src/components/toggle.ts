import { html, isServer } from "lit";
import type { PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { attachActivation } from "../behavior/activation.ts";
import { applyAria } from "../behavior/aria.ts";
import { CamoControl } from "../behavior/control.ts";
import type { ControlValue } from "../behavior/control.ts";
import { PressController } from "../behavior/press.ts";
import { CamouflageController, warnOnce } from "../controller.ts";
import type { CamoSkin, Renderer, ToggleSlots, ToggleState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = { label: "" } as const;

/** The accessible name of a toggle: its `label`, else the text of its rich label. */
function nameOf(label: string | null, host: HTMLElement): string | null {
  if (label !== null && label !== "") return label;
  // A server has no light DOM to read; a rich label names the control once it is on the client.
  if (isServer) return null;
  const text = host.textContent?.replace(/\s+/g, " ").trim() ?? "";
  return text === "" ? null : text;
}

/** True for a click that landed on a link inside a rich label: following the link must not also toggle. */
function onLink(event: Event): boolean {
  return event.composedPath().some((n) => n instanceof HTMLAnchorElement);
}

/**
 * The base of the checkbox and the switch: a form-associated control with a boolean `checked`, a label (a value or rich
 * content in the default slot), a description and an error. The host is the focusable control (role, name, state
 * through `ElementInternals`); Space toggles it, a click anywhere on the row toggles it, and `change` fires once per
 * toggle after a cancelable `camo-before-change`.
 */
export abstract class CamoToggle extends CamoControl {
  static override properties: PropertyDeclarations = {
    checked: { type: Boolean, reflect: true },
    label: { type: String },
    description: { type: String },
    value: { type: String },
  };

  declare checked: boolean;
  declare label: string | null;
  declare description: string | null;
  /** What is submitted when it is on; "on" like a native checkbox. */
  declare value: string;

  protected readonly cx: CamouflageController = new CamouflageController(this);
  readonly #press: PressController = new PressController(this, () => this.isDisabled);
  #defaultChecked = false;

  constructor() {
    super();
    this.checked = false;
    this.label = null;
    this.description = null;
    this.value = "on";
    this.addEventListener("click", this.#onClick);
    attachActivation(this, () => this.isDisabled, { enter: false });
    void this.#press;
  }

  /** The ARIA role: `checkbox` or `switch`. */
  protected abstract ariaRole(): string;
  protected abstract renderer(skin: CamoSkin): Renderer<ToggleState, ToggleSlots, unknown>;
  protected isIndeterminate(): boolean {
    return false;
  }
  /** Called after the user toggled, to clear a state the toggle replaces (indeterminate). */
  protected toggled(): void {}

  protected override formValue(): ControlValue {
    return this.checked ? this.value : null;
  }
  protected override isEmpty(): boolean {
    return !this.checked;
  }
  protected override captureDefault(): void {
    this.#defaultChecked = this.checked;
  }
  protected override resetToDefault(): void {
    this.checked = this.#defaultChecked;
  }
  protected override restoreFormState(state: ControlValue): void {
    this.checked = state !== null;
  }

  protected override firstUpdated(): void {
    super.firstUpdated();
    // A rich label changes without a property changing: its name follows the slot.
    this.renderRoot.addEventListener("slotchange", () => {
      this.#warnOnInteractiveLabel();
      this.requestUpdate();
    });
    this.#warnOnInteractiveLabel();
  }

  // A checkbox, switch or radio makes its children presentational, so a link or a button in its label would be
  // focusable but invisible to a screen reader (axe: nested-interactive). Say so once, where the author can see it.
  #warnOnInteractiveLabel(): void {
    if (this.querySelector("a[href], button, input, select, textarea, [tabindex]") !== null)
      warnOnce(
        `<${this.localName}> has a link or a control in its label: a ${this.ariaRole()} hides its content from assistive technology. Use formatting (<strong>, <em>) in the label, and put the link next to the control.`,
      );
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    const label = nameOf(this.label, this);
    const checked: boolean | "mixed" = this.isIndeterminate() ? "mixed" : this.checked;
    applyAria(this, this.internals, {
      role: this.ariaRole(),
      label,
      disabled: this.isDisabled,
      checked,
      invalid: this.error !== null,
      required: this.required,
      description: this.description === "" ? null : this.description,
    });
    this.setAttribute("tabindex", this.isDisabled ? "-1" : "0");
  }

  readonly #onClick = (event: Event): void => {
    if (this.isDisabled || onLink(event)) return;
    const next = !this.checked;
    if (!this.beforeChange(next)) return;
    this.checked = next;
    this.toggled();
    this.fireInput();
    this.fireChange();
  };

  override render(): TemplateResult {
    const skin = this.cx.skin;
    if (skin === undefined) return html`<slot></slot>`;
    const renderer = this.renderer(skin);
    const state: ToggleState = {
      checked: this.checked,
      indeterminate: this.isIndeterminate(),
      label: this.label === "" ? null : this.label,
      description: this.description === "" ? null : this.description,
      error: this.error,
      disabled: this.isDisabled,
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

export { nameOf, onLink };
