import { css, html } from "lit";
import type { CSSResultGroup, PropertyDeclarations, TemplateResult } from "lit";
import { CamoModal } from "../behavior/modal.ts";
import type { BottomSheetState, Detent } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = { content: "" } as const;

/**
 * `<camo-bottom-sheet open title="Share" detent="medium">…</camo-bottom-sheet>`
 *
 * A modal panel docked to the bottom (the overlay frame: a native `<dialog>` in the top layer, a scrim, focus trapped
 * and returned, Escape). Drag the handle or the header down to dismiss, or up to go from `medium` to `large`; dragging is
 * never the only way: the scrim, Escape and a close button (where the skin shows one) always close it. `persistent`
 * turns scrim and Escape dismissal off, for a sheet that must be answered. On a wide window it keeps the skin's maximum
 * width, centered.
 *
 * @tagname camo-bottom-sheet
 * @slot - The content: a list, a form, actions.
 * @attr {string} title - The header text; the sheet's accessible name.
 * @attr {boolean} open - Shown as a modal in the top layer.
 * @attr {"auto"|"medium"|"large"} detent - How tall it opens: its content, half the window, or nearly all of it.
 * @attr {boolean} persistent - Escape and the scrim do not dismiss it.
 * @fires {CustomEvent<CamoCloseDetail>} camo-close - Once, when it has closed; `detail.result` is the result or `undefined`.
 */
export class CamoBottomSheet extends CamoModal {
  static override properties: PropertyDeclarations = {
    title: { type: String },
    detent: { type: String, reflect: true },
    persistent: { type: Boolean, reflect: true },
    drag: { state: true },
  };

  static override styles: CSSResultGroup = [
    CamoModal.styles,
    css`
      dialog[open]:not(:modal) {
        inset: auto 0 0 0;
        margin: auto auto 0;
        inline-size: 100%;
      }
    `,
  ];

  declare title: string;
  declare detent: Detent;
  declare persistent: boolean;
  /** How far the sheet is dragged down, 0 to 1. */
  declare protected drag: number;

  #startY: number | null = null;
  #height = 1;

  constructor() {
    super();
    this.title = "";
    this.detent = "auto";
    this.persistent = false;
    this.drag = 0;
  }

  protected override dismissible(): boolean {
    return !this.persistent;
  }

  /** An `autofocus` element, else the first focusable thing in the content, else the sheet. */
  protected override initialFocus(): HTMLElement | null {
    return (
      super.initialFocus() ??
      this.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
    );
  }

  protected override frameAttributes(): { labelledBy?: string; label?: string } {
    return this.title === "" ? { label: "Sheet" } : { labelledBy: "title" };
  }

  override firstUpdated(): void {
    const dialog = this.dialog;
    dialog?.addEventListener("pointerdown", this.#onDown as EventListener);
    dialog?.addEventListener("pointermove", this.#onMove as EventListener);
    dialog?.addEventListener("pointerup", this.#onUp as EventListener);
    dialog?.addEventListener("pointercancel", this.#onUp as EventListener);
  }

  // Only the handle and the header start a drag; the content scrolls on its own.
  readonly #onDown = (event: PointerEvent): void => {
    if (!this.dismissible() || event.button !== 0) return;
    const path = event.composedPath();
    if (!path.some((n) => n instanceof HTMLElement && n.classList.contains("drag"))) return;
    if (path.some((n) => n instanceof HTMLElement && n.classList.contains("close"))) return;
    this.#startY = event.clientY;
    this.#height = Math.max(this.dialog?.getBoundingClientRect().height ?? 1, 1);
    this.dialog?.setPointerCapture(event.pointerId);
  };

  readonly #onMove = (event: PointerEvent): void => {
    if (this.#startY === null) return;
    const dy = event.clientY - this.#startY;
    this.drag = Math.min(Math.max(dy / this.#height, 0), 1);
  };

  readonly #onUp = (event: PointerEvent): void => {
    if (this.#startY === null) return;
    const dy = event.clientY - this.#startY;
    this.#startY = null;
    if (this.drag > 0.3) this.close();
    else if (dy < -60 && this.detent === "medium") this.detent = "large";
    this.drag = 0;
  };

  protected override renderFrame(): TemplateResult {
    const skin = this.cx.skin;
    if (skin === undefined) {
      return html`<h2 id="title">${this.title}</h2>
        <slot></slot>`;
    }
    const renderer = skin.bottomSheet;
    const state: BottomSheetState = {
      title: this.title === "" ? null : this.title,
      dismissible: !this.persistent,
      dragProgress: this.drag,
      detent: this.detent,
      actions: { close: () => this.close() },
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
