import type { PropertyDeclarations } from "lit";
import type { CamoSkin, Renderer, ToggleSlots, ToggleState } from "../skin/types.ts";
import { CamoToggle } from "./toggle.ts";

/**
 * `<camo-checkbox name="consent" label="Remember me" description="On this device"></camo-checkbox>`
 *
 * A checkbox. With a label the whole row is the target. The label is the `label`
 * value or rich markup in the default slot. `indeterminate` shows a neither-on-nor-off state until the user toggles it.
 * Form-associated: submits `value` ("on") under `name` while checked; `required` makes it invalid until checked.
 *
 * @tagname camo-checkbox
 * @slot - A rich label: text with `<strong>` and `<em>`, used when `label` is absent. Not links or controls: a checkbox hides its content from assistive technology.
 * @attr {boolean} checked - Whether it is on.
 * @attr {boolean} indeterminate - Neither on nor off, until the user toggles it.
 * @attr {string} label - The label.
 * @attr {string} description - A second line under the label, announced as the description.
 * @attr {string} error - A message shown below the row; marks the checkbox invalid.
 * @attr {string} value - What is submitted while it is on; "on" by default.
 * @attr {boolean} disabled - Blocks toggling and focus (the contract's `enabled`, inverted).
 * @attr {boolean} required - Invalid to its form until it is checked.
 * @attr {string} name - The name the value is submitted under.
 * @fires {CustomEvent<CamoBeforeChangeDetail>} camo-before-change - Cancelable, before it toggles.
 * @fires input - It toggled.
 * @fires change - It toggled (the same moment; a checkbox commits at once).
 */
export class CamoCheckbox extends CamoToggle {
  static override properties: PropertyDeclarations = {
    indeterminate: { type: Boolean, reflect: true },
  };

  declare indeterminate: boolean;

  constructor() {
    super();
    this.indeterminate = false;
  }

  protected override ariaRole(): string {
    return "checkbox";
  }
  protected override isIndeterminate(): boolean {
    return this.indeterminate;
  }
  protected override toggled(): void {
    this.indeterminate = false;
  }
  protected override renderer(skin: CamoSkin): Renderer<ToggleState, ToggleSlots, unknown> {
    return skin.checkbox as Renderer<ToggleState, ToggleSlots, unknown>;
  }
}
