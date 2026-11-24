import { LitElement, css, html, isServer } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import type { CSSResultGroup, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { CamouflageController } from "../controller.ts";

/** The detail of `camo-close`: the result the overlay was closed with, or `undefined` when it was dismissed. */
export interface CamoCloseDetail<T = unknown> {
  result: T | undefined;
}

/**
 * The overlay frame of every modal overlay (the base Overlays note): a native `<dialog>` shown with `showModal()`, so the
 * top layer, the scrim, the focus trap, the inert page behind it, Escape, and focus returning to the opener are the
 * platform's. This class adds what the platform leaves: dismissal by a click on the scrim, a promise-free `close(result)`
 * and the one `camo-close` event, a focus target inside slotted content, and a server-rendered overlay that arrives open
 * and becomes modal on hydration. A subclass draws what is inside (`renderFrame`) and says whether it can be dismissed.
 */
export abstract class CamoModal extends LitElement {
  static override properties: PropertyDeclarations = {
    open: { type: Boolean, reflect: true },
  };

  // A server-rendered overlay arrives open but not yet modal, and the browser would put it at the top of the page; this
  // centers it like the modal it becomes, so first paint and hydrated paint match.
  static override styles: CSSResultGroup = css`
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

  /** Shown as a modal in the top layer. */
  declare open: boolean;

  protected readonly cx: CamouflageController = new CamouflageController(this);
  #result: unknown = undefined;
  // Set while a server-rendered, non-modal dialog is closed only to be shown again as a modal.
  #reopening = false;

  constructor() {
    super();
    this.open = false;
  }

  /** Whether Escape and a click on the scrim may close it. */
  protected dismissible(): boolean {
    return true;
  }

  /** Where focus goes when it opens: an element the author marked `autofocus`, else the subclass's choice. */
  protected initialFocus(): HTMLElement | null {
    return this.querySelector<HTMLElement>("[autofocus]");
  }

  /** What the `<dialog>` holds: the renderer's output. */
  protected abstract renderFrame(): TemplateResult;

  /** The attributes the `<dialog>` carries (its accessible name and description). */
  protected frameAttributes(): { labelledBy?: string; describedBy?: string; label?: string } {
    return {};
  }

  /** Closes it with a result (`camo-close` fires once the platform has closed it). */
  close(result?: unknown): void {
    this.#result = result;
    this.open = false;
  }

  protected get dialog(): HTMLDialogElement | null {
    return this.renderRoot.querySelector("dialog");
  }

  override updated(changed: PropertyValues<this>): void {
    if (!changed.has("open")) return;
    const dialog = this.dialog;
    if (dialog === null) return;
    if (this.open && !dialog.matches(":modal")) {
      // A server-rendered dialog arrives open but not modal; showModal() moves it into the top layer.
      if (dialog.open) {
        // The `close` event this queues must not close the whole component (hydration of a server-rendered dialog).
        this.#reopening = true;
        dialog.close();
      }
      dialog.showModal();
      void this.#focus();
    } else if (!this.open && dialog.open) {
      dialog.close();
    }
  }

  /**
   * Native autofocus only sees the dialog's own subtree, and slotted content lives in the light DOM, so focus would stay
   * on the dialog. Focus the target the subclass names.
   */
  async #focus(): Promise<void> {
    const target = this.initialFocus();
    // An element that has not rendered yet has no tabindex, so wait for its first update.
    await (target as (HTMLElement & { updateComplete?: Promise<unknown> }) | null)?.updateComplete;
    target?.focus();
  }

  readonly #onNativeClose = (): void => {
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

  readonly #onCancel = (event: Event): void => {
    // Escape: a persistent overlay stays.
    if (!this.dismissible()) event.preventDefault();
  };

  readonly #onClick = (event: MouseEvent): void => {
    // A click on the scrim has the dialog itself as its target; clicks on the content have a descendant.
    if (event.target === this.dialog && this.dismissible()) this.close();
  };

  /** The `<dialog>` around the frame. */
  protected renderDialog(): TemplateResult {
    const a = this.frameAttributes();
    return html`<dialog
      aria-labelledby=${ifDefined(a.labelledBy)}
      aria-describedby=${ifDefined(a.describedBy)}
      aria-label=${ifDefined(a.label)}
      ?open=${isServer && this.open}
      @close=${this.#onNativeClose}
      @cancel=${this.#onCancel}
      @click=${this.#onClick}
    >
      ${this.renderFrame()}
    </dialog>`;
  }
}
