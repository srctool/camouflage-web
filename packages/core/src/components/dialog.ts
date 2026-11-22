import { LitElement, css, html, isServer, nothing } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { CamouflageController } from "../controller.ts";
import type { DialogState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

// The contract's `content` is the one layout slot, so it is the default (unnamed) slot.
const SLOTS = { confirm: "confirm", dismiss: "dismiss", content: "" } as const;

/** The detail of `camo-close`: the result the dialog was closed with, or `undefined` when it was dismissed. */
export interface CamoCloseDetail<T = unknown> {
  result: T | undefined;
}

/**
 * `<camo-dialog open title="Delete item?" message="This can't be undone.">`
 *
 * A native `<dialog>` shown as a modal in the top layer: focus is trapped, Escape and a click on the scrim dismiss
 * it, and the page behind is inert, all by the platform. The skin decides how the `confirm` and `dismiss` slots are
 * laid out (side by side in Minimal, stacked in Cupertino) from the same markup.
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
export class CamoDialog extends LitElement {
  static override properties: PropertyDeclarations = {
    title: { type: String },
    message: { type: String },
    open: { type: Boolean, reflect: true },
  };

  // The dialog frame (the base Overlays note: centering and focus are core's, the look is the skin's). A server-rendered
  // dialog arrives open but not yet modal, and the browser would put it at the top of the page; this centers it like the
  // modal it becomes, so first paint and hydrated paint match.
  static override styles: CSSResult = css`
    :host {
      display: contents;
    }
    dialog:focus {
      outline: none;
    }
    dialog[open]:not(:modal) {
      position: fixed;
      inset: 0;
      margin: auto;
      height: fit-content;
      max-height: calc(100% - 2em);
    }
  `;

  /** The heading, and the dialog's accessible name. Absent means no heading. */
  declare title: string;
  declare message: string;
  declare open: boolean;

  readonly #cx: CamouflageController = new CamouflageController(this);
  #result: unknown = undefined;
  #stripping = false;
  // Set while a server-rendered, non-modal dialog is closed only to be shown again as a modal.
  #reopening = false;

  constructor() {
    super();
    this.title = "";
    this.message = "";
    this.open = false;
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

  /** Closes the dialog with a result (`camo-close` fires once the platform has closed it). */
  close(result?: unknown): void {
    this.#result = result;
    this.open = false;
  }

  get #dialog(): HTMLDialogElement | null {
    return this.renderRoot.querySelector("dialog");
  }

  override updated(changed: PropertyValues<this>): void {
    if (!changed.has("open")) return;
    const dialog = this.#dialog;
    if (dialog === null) return;
    if (this.open && !dialog.matches(":modal")) {
      // A server-rendered dialog arrives open but not modal; showModal() moves it into the top layer.
      if (dialog.open) {
        // The `close` event this queues must not close the whole component (hydration of a server-rendered dialog).
        this.#reopening = true;
        dialog.close();
      }
      dialog.showModal();
      void this.#focusAction();
    } else if (!this.open && dialog.open) {
      dialog.close();
    }
  }

  /**
   * Native autofocus only sees the dialog's own subtree, and the actions are slotted from the light DOM, so focus would
   * stay on the dialog. Focus an action: one marked `autofocus`, else the dismiss action (the safe default), else the first.
   */
  async #focusAction(): Promise<void> {
    const target =
      this.querySelector<HTMLElement>("[autofocus]") ??
      this.querySelector<HTMLElement>('[slot="dismiss"]') ??
      this.querySelector<HTMLElement>('[slot="confirm"]');
    // An action that has not rendered yet has no tabindex, so wait for its first update.
    await (target as (HTMLElement & { updateComplete?: Promise<unknown> }) | null)?.updateComplete;
    target?.focus();
  }

  #onNativeClose = (): void => {
    if (this.#reopening) {
      this.#reopening = false;
      return;
    }
    // Escape, the scrim, `close()` and a form method all end here, once.
    this.open = false;
    const result = this.#result;
    this.#result = undefined;
    this.dispatchEvent(
      new CustomEvent<CamoCloseDetail>("camo-close", {
        detail: { result },
        bubbles: true,
        composed: true,
      }),
    );
  };

  #onClick = (event: MouseEvent): void => {
    // A click on the scrim has the dialog itself as its target; clicks on the content have a descendant.
    if (event.target === this.#dialog) this.close();
  };

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    const title = this.title === "" ? null : this.title;
    if (skin === undefined) {
      return html`<dialog ?open=${isServer && this.open} @close=${this.#onNativeClose}>
        ${title}
        <p>${this.message}</p>
        <slot></slot><slot name="dismiss"></slot><slot name="confirm"></slot>
      </dialog>`;
    }
    const renderer = skin.dialog;
    const style = renderer.defaults(tokens);
    const state: DialogState = {
      title,
      message: this.message,
      titleId: "title",
      messageId: "message",
    };
    return html`${cssBlock(renderer.styles)}
      <dialog
        aria-labelledby=${title === null ? nothing : "title"}
        aria-describedby="message"
        ?open=${isServer && this.open}
        @close=${this.#onNativeClose}
        @click=${this.#onClick}
      >
        ${renderer.render({ state, slots: SLOTS, theme: tokens, style, skin })}
      </dialog>`;
  }
}
