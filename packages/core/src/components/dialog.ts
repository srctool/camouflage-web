import { html, isServer } from "lit";
import type { PropertyDeclarations, TemplateResult } from "lit";
import { CamoModal } from "../behavior/modal.ts";
import type { CamoCloseDetail } from "../behavior/modal.ts";
import type { DialogState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

// The contract's `content` is the one layout slot, so it is the default (unnamed) slot.
const SLOTS = { confirm: "confirm", dismiss: "dismiss", content: "" } as const;

export type { CamoCloseDetail };

/**
 * `<camo-dialog open title="Delete item?" message="This can't be undone.">`
 *
 * A native `<dialog>` shown as a modal in the top layer (the overlay frame, `CamoModal`): focus is trapped, Escape and a
 * click on the scrim dismiss it, and the page behind is inert, all by the platform. The skin decides how the `confirm`
 * and `dismiss` slots are laid out (side by side in Minimal, stacked in Cupertino) from the same markup.
 *
 * @tagname camo-dialog
 * @slot - The `content` of the contract: richer content below the message (a list, a form).
 * @slot confirm - The confirming action (required).
 * @slot dismiss - The dismissing action.
 * @fires {CustomEvent<CamoCloseDetail>} camo-close - Once, when the dialog has closed; `detail.result` is the result or `undefined`.
 * @attr {string} title - The heading, and the dialog's accessible name.
 * @attr {string} message - The main text.
 * @attr {boolean} open - Shown as a modal in the top layer.
 */
export class CamoDialog extends CamoModal {
  static override properties: PropertyDeclarations = {
    title: { type: String },
    message: { type: String },
  };

  /** The heading, and the dialog's accessible name. Absent means no heading. */
  declare title: string;
  declare message: string;

  #stripping = false;

  constructor() {
    super();
    this.title = "";
    this.message = "";
  }

  /**
   * A `title` attribute would also show the browser's tooltip over the whole dialog, so it is read into the property
   * and removed (a spike finding: the contract's name collides with the global attribute).
   */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (name === "title" && value === null && this.#stripping) return;
    super.attributeChangedCallback(name, old, value);
    if (name === "title" && value !== null && !isServer) {
      this.#stripping = true;
      this.removeAttribute("title");
      this.#stripping = false;
    }
  }

  /** An action marked `autofocus`, else the dismiss action (the safe default), else the first. */
  protected override initialFocus(): HTMLElement | null {
    return (
      super.initialFocus() ??
      this.querySelector<HTMLElement>('[slot="dismiss"]') ??
      this.querySelector<HTMLElement>('[slot="confirm"]')
    );
  }

  protected override frameAttributes(): { labelledBy?: string; describedBy?: string } {
    return this.cx.skin === undefined
      ? {}
      : { ...(this.title === "" ? {} : { labelledBy: "title" }), describedBy: "message" };
  }

  protected override renderFrame(): TemplateResult {
    const skin = this.cx.skin;
    const title = this.title === "" ? null : this.title;
    if (skin === undefined) {
      return html`${title}
        <p>${this.message}</p>
        <slot></slot><slot name="dismiss"></slot><slot name="confirm"></slot>`;
    }
    const renderer = skin.dialog;
    const state: DialogState = {
      title,
      message: this.message,
      titleId: "title",
      messageId: "message",
    };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: SLOTS,
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
    })}`;
  }

  override render(): TemplateResult {
    return this.renderDialog();
  }
}
