import { LitElement, css, html } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { attachActivation } from "../behavior/activation.ts";
import { applyAria } from "../behavior/aria.ts";
import { PressController } from "../behavior/press.ts";
import { CamouflageController } from "../controller.ts";
import type { Appearance, FabState, Tone } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = { icon: "icon" } as const;

/**
 * `<camo-fab content-description="Compose" text="Compose"><camo-icon slot="icon" name="edit"></camo-icon></camo-fab>`
 *
 * The floating action button: a screen's one main action. With `text` it is extended (icon and label); `collapsed` folds
 * it to the icon (while scrolling) and unfolds it again, and its accessible name stays the same. `hidden` scales it out
 * (hide on scroll); a hidden FAB cannot be focused, clicked or read. Placement is the app's layout (usually bottom-end,
 * lifted above a navigation bar and the snackbars: `--camo-messenger-inset-bottom`). Skins with no FAB (Cupertino, and
 * most others) draw a prominent circular button; they use their one size.
 *
 * @tagname camo-fab
 * @slot icon - The icon, usually a `camo-icon`.
 * @attr {string} content-description - The accessible name; also the label when it is not extended.
 * @attr {string} text - Makes it an extended FAB.
 * @attr {boolean} collapsed - An extended FAB folded to its icon (the contract's `expanded`, inverted).
 * @attr {boolean} hidden - Scales it out and takes it out of focus and reading (the contract's `visible`, inverted).
 * @attr {"solid"|"soft"|"raised"|"outline"|"ghost"|"link"} appearance - Absent means the skin's default (`soft`); the others fall back to it.
 * @attr {"default"|"error"|"success"|"warning"|"info"} tone - The colour family.
 * @attr {boolean} disabled - Blocks clicks and focus (the contract's `enabled`, inverted).
 */
export class CamoFab extends LitElement {
  static override properties: PropertyDeclarations = {
    contentDescription: { type: String, attribute: "content-description" },
    text: { type: String },
    collapsed: { type: Boolean, reflect: true },
    hidden: { type: Boolean, reflect: true },
    appearance: { type: String, reflect: true },
    tone: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  static override styles: CSSResult = css`
    /* Still laid out while it scales out; then invisible, which also takes it out of focus. */
    :host([hidden]) {
      display: inline-flex;
      pointer-events: none;
      visibility: hidden;
      transition: visibility 0s linear var(--camo-motion-duration-medium);
    }
  `;

  declare contentDescription: string;
  declare text: string | null;
  declare collapsed: boolean;
  declare hidden: boolean;
  declare appearance: Appearance | null;
  declare tone: Tone;
  declare disabled: boolean;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  readonly #press: PressController = new PressController(this, () => this.disabled || this.hidden);

  constructor() {
    super();
    this.contentDescription = "";
    this.text = null;
    this.collapsed = false;
    this.hidden = false;
    this.appearance = null;
    this.tone = "default";
    this.disabled = false;
    attachActivation(this, () => this.disabled || this.hidden);
    void this.#press;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    const extended = this.text !== null && this.text !== "";
    applyAria(this, this.#internals, {
      role: "button",
      // The name does not change when the FAB collapses.
      label: extended ? this.text : this.contentDescription === "" ? null : this.contentDescription,
      disabled: this.disabled,
      hidden: this.hidden,
    });
    this.setAttribute("tabindex", this.disabled || this.hidden ? "-1" : "0");
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`<slot name="icon"></slot>${this.text}`;
    const renderer = skin.fab;
    const style = renderer.defaults(tokens);
    const state: FabState = {
      text: this.text,
      extended: this.text !== null && this.text !== "",
      expanded: !this.collapsed,
      visible: !this.hidden,
      appearance: this.appearance || style.defaultAppearance,
      tone: this.tone,
      disabled: this.disabled,
    };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: SLOTS,
      theme: tokens,
      style,
      skin,
    })}`;
  }
}
