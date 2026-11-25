import { LitElement, css, html, isServer, nothing } from "lit";
import type {
  CSSResult,
  CSSResultGroup,
  PropertyDeclarations,
  PropertyValues,
  TemplateResult,
} from "lit";
import { applyAria } from "../behavior/aria.ts";
import { CamoModal } from "../behavior/modal.ts";
import { CamouflageController } from "../controller.ts";
import { closeIcon } from "../skin/status.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = { content: "", actions: "actions" } as const;

/** The close button core builds for both sheets: a labelled button, the same node whatever the skin draws around it. */
function closeNode(onClose: () => void): TemplateResult {
  return html`<button class="close" type="button" part="close" aria-label="Close" @click=${onClose}>
    ${closeIcon}
  </button>`;
}

/**
 * `<camo-side-sheet title="Properties" closable>…</camo-side-sheet>`
 *
 * A docked panel on the end edge for secondary content next to the main screen: properties of the selected item, filters,
 * a help pane. It is part of the layout (put it beside the content in a flex row) and non-modal: the main content stays
 * usable. The content scrolls while the title and the `actions` stay. It is a complementary region named by its title.
 * For a narrow window use `camo-modal-side-sheet` with the same content.
 *
 * @tagname camo-side-sheet
 * @slot - The content; it scrolls.
 * @slot actions - Buttons pinned at the bottom.
 * @attr {string} title - The heading, and the region's accessible name.
 * @attr {boolean} closable - Shows a close button (the contract's non-null `onClose`).
 * @fires camo-close - The close button was pressed.
 */
export class CamoSideSheet extends LitElement {
  static override properties: PropertyDeclarations = {
    title: { type: String },
    closable: { type: Boolean, reflect: true },
  };

  static override styles: CSSResult = css``;

  declare title: string;
  declare closable: boolean;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  #stripping = false;

  constructor() {
    super();
    this.title = "";
    this.closable = false;
  }

  /** A `title` attribute would also show the browser's tooltip over the whole sheet, so it is read and removed. */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (name === "title" && value === null && this.#stripping) return;
    super.attributeChangedCallback(name, old, value);
    if (name === "title" && value !== null && !isServer) {
      this.#stripping = true;
      this.removeAttribute("title");
      this.#stripping = false;
    }
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, {
      role: "complementary",
      label: this.title === "" ? null : this.title,
    });
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined)
      return html`<h2>${this.title}</h2><slot></slot><slot name="actions"></slot>`;
    const renderer = skin.sideSheet;
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state: {
        modal: false,
        title: this.title === "" ? null : this.title,
        closable: this.closable,
      },
      slots: SLOTS,
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
      nodes: {
        close: this.closable
          ? closeNode(() =>
              this.dispatchEvent(new CustomEvent("camo-close", { bubbles: true, composed: true })),
            )
          : nothing,
      },
    })}`;
  }
}

/**
 * `<camo-modal-side-sheet open title="Filters" closable>…</camo-modal-side-sheet>`
 *
 * The side sheet for a narrow window: it slides in from the end edge over the content, in the overlay frame (a native modal
 * `<dialog>`: top layer, a scrim, focus trapped and returned to the opener, Escape). The scrim, Escape, the close button and
 * a drag toward the end edge all close it; it is never drag-only. Visibility is state (`open`), not a route.
 *
 * @tagname camo-modal-side-sheet
 * @slot - The content; it scrolls.
 * @slot actions - Buttons pinned at the bottom.
 * @attr {boolean} open - Shown as a modal in the top layer.
 * @attr {string} title - The heading, and the pane's accessible name.
 * @attr {boolean} closable - Shows a close button.
 * @fires {CustomEvent<CamoCloseDetail>} camo-close - Once, when it has closed.
 */
export class CamoModalSideSheet extends CamoModal {
  static override properties: PropertyDeclarations = {
    title: { type: String },
    closable: { type: Boolean, reflect: true },
    drag: { state: true },
  };

  static override styles: CSSResultGroup = [
    CamoModal.styles,
    css`
      dialog {
        border: 0;
        padding: 0;
        margin: 0;
        margin-inline-start: auto;
        background: transparent;
        color: inherit;
        overflow: visible;
        inset-block: 0;
        block-size: 100dvh;
        max-block-size: 100dvh;
        max-inline-size: 80vw;
        translate: calc(var(--ms-drag, 0) * var(--ms-out, 100%));
      }
      dialog[open] {
        animation: camo-sheet-in var(--camo-motion-duration-medium) var(--camo-motion-easing-emphasized);
      }
      :host(:dir(rtl)) dialog {
        --ms-out: -100%;
      }
      @keyframes camo-sheet-in {
        from {
          translate: var(--ms-out, 100%);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        dialog[open] {
          animation: none;
        }
      }
      dialog[open]:not(:modal) {
        inset-block: 0;
        inset-inline-end: 0;
        inset-inline-start: auto;
        margin: 0;
        height: 100%;
        max-height: none;
      }
    `,
  ];

  declare title: string;
  declare closable: boolean;
  declare protected drag: number;

  #stripping = false;
  #startX: number | null = null;
  #width = 1;

  constructor() {
    super();
    this.title = "";
    this.closable = false;
    this.drag = 0;
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (name === "title" && value === null && this.#stripping) return;
    super.attributeChangedCallback(name, old, value);
    if (name === "title" && value !== null && !isServer) {
      this.#stripping = true;
      this.removeAttribute("title");
      this.#stripping = false;
    }
  }

  protected override frameAttributes(): { label: string } {
    return { label: this.title === "" ? "Panel" : this.title };
  }

  protected override initialFocus(): HTMLElement | null {
    return (
      super.initialFocus() ??
      this.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
    );
  }

  override firstUpdated(): void {
    const dialog = this.dialog;
    dialog?.addEventListener("pointerdown", this.#onDown as EventListener);
    dialog?.addEventListener("pointermove", this.#onMove as EventListener);
    dialog?.addEventListener("pointerup", this.#onUp as EventListener);
    dialog?.addEventListener("pointercancel", this.#onUp as EventListener);
  }

  // A drag toward the end edge closes it; it starts only once the move is mostly horizontal, so a tap still reaches content.
  readonly #onDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    this.#startX = event.clientX;
    this.#width = Math.max(this.dialog?.getBoundingClientRect().width ?? 1, 1);
  };

  readonly #onMove = (event: PointerEvent): void => {
    if (this.#startX === null) return;
    const rtl = getComputedStyle(this).direction === "rtl";
    const dx = (event.clientX - this.#startX) * (rtl ? -1 : 1);
    if (dx > 10) {
      this.dialog?.setPointerCapture(event.pointerId);
      this.drag = Math.min(Math.max(dx / this.#width, 0), 1);
      this.dialog?.style.setProperty("--ms-drag", String(this.drag));
    }
  };

  readonly #onUp = (): void => {
    if (this.#startX === null) return;
    this.#startX = null;
    const dragged = this.drag;
    this.drag = 0;
    this.dialog?.style.removeProperty("--ms-drag");
    if (dragged > 0.3) this.close();
  };

  protected override renderFrame(): TemplateResult {
    const skin = this.cx.skin;
    if (skin === undefined)
      return html`<h2>${this.title}</h2><slot></slot><slot name="actions"></slot>`;
    const renderer = skin.sideSheet;
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state: { modal: true, title: this.title === "" ? null : this.title, closable: this.closable },
      slots: SLOTS,
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
      nodes: { close: this.closable ? closeNode(() => this.close()) : nothing },
    })}`;
  }

  override render(): TemplateResult {
    return this.renderDialog();
  }
}
