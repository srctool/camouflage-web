import type { CamoSkin, Renderer, ToggleSlots, ToggleState } from "../skin/types.ts";
import { CamoToggle } from "./toggle.ts";

/**
 * `<camo-switch name="wifi" label="Wi-Fi" checked></camo-switch>`
 *
 * An on/off switch, announced as a switch ("on" and "off", not "checked"). The state is told apart without color: by the
 * thumb's position and size. With a label the whole row is the target; Space toggles it.
 *
 * @tagname camo-switch
 * @slot - A rich label, used when `label` is absent.
 * @attr {boolean} checked - Whether it is on.
 * @attr {string} label - The label.
 * @attr {string} description - A second line under the label ("Uses more battery").
 * @attr {string} error - A message shown below the row.
 * @attr {string} value - What is submitted while it is on; "on" by default.
 * @attr {boolean} disabled - Blocks toggling and focus (the contract's `enabled`, inverted).
 * @attr {boolean} required - Invalid to its form until it is on.
 * @attr {string} name - The name the value is submitted under.
 * @fires {CustomEvent<CamoBeforeChangeDetail>} camo-before-change - Cancelable, before it toggles.
 * @fires input - It toggled.
 * @fires change - It toggled.
 */
export class CamoSwitch extends CamoToggle {
  protected override ariaRole(): string {
    return "switch";
  }
  protected override renderer(skin: CamoSkin): Renderer<ToggleState, ToggleSlots, unknown> {
    return skin.switch as Renderer<ToggleState, ToggleSlots, unknown>;
  }
}
