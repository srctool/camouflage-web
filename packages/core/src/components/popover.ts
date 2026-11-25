import { LitElement, css, html, isServer } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { TABBABLE } from "../behavior/focus.ts";
import { placePanel } from "../behavior/popover.ts";
import { CamouflageController } from "../controller.ts";
import type { PopoverPlacement, PopoverSide, PopoverState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = { content: "", actions: "actions" } as const;

/**
 * `<camo-popover title="Rename" placement="bottom"><camo-button slot="anchor" text="Rename"></camo-button>…<camo-button slot="actions" text="Save">`
 *
 * A non-modal panel anchored to a control, for content richer than a menu and lighter than a dialog: a few lines, a small
 * form, an inline picker, one or two actions. It does not dim the page. It is a popover in the top layer, placed on the
 * side asked for (`auto` is below, flipping above when there is no room; `start` and `end` follow the writing direction)
 * and kept inside the window, with an arrow where the skin draws one. A click on the anchor toggles it; an outside click and
 * Escape close it and focus returns to the anchor. Opening moves focus to the first focusable thing inside, or the panel.
 * The anchor announces "has popup" and expanded or collapsed; the panel is a non-modal group named by its title.
 *
 * @tagname camo-popover
 * @slot anchor - The element the popover points at; it stays in the layout (a button).
 * @slot - The content: arbitrary markup.
 * @slot actions - Buttons at the bottom end.
 * @attr {boolean} open - Whether the popover is shown.
 * @attr {string} title - A heading, and the panel's accessible name.
 * @attr {"auto"|"bottom"|"top"|"start"|"end"} placement - Which side of the anchor; `auto` is below, then above.
 * @fires camo-open - The popover opened.
 * @fires camo-close - The popover closed, by the anchor, an outside click or Escape.
 */
export class CamoPopover extends LitElement {
  static override properties: PropertyDeclarations = {
    open: { type: Boolean, reflect: true },
    title: { type: String },
    placement: { type: String, reflect: true },
    side: { state: true },
    arrow: { state: true },
  };

  static override styles: CSSResult = css`
    :host {
      display: inline-block;
    }
    .camo-popup {
      position: fixed;
      inset: auto;
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
      overflow: visible;
      color: inherit;
    }
    .camo-popup:focus {
      outline: none;
    }
    slot[name="anchor"] {
      display: contents;
    }
  `;

  declare open: boolean;
  declare title: string;
  declare placement: PopoverPlacement;
  declare protected side: PopoverSide;
  declare protected arrow: number | null;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  #stripping = false;
  #returnFocus = false;

  constructor() {
    super();
    this.open = false;
    this.title = "";
    this.placement = "auto";
    this.side = "bottom";
    this.arrow = null;
  }

  /** A `title` attribute would also show the browser's tooltip over the anchor, so it is read and removed. */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (name === "title" && value === null && this.#stripping) return;
    super.attributeChangedCallback(name, old, value);
    if (name === "title" && value !== null && !isServer) {
      this.#stripping = true;
      this.removeAttribute("title");
      this.#stripping = false;
    }
  }

  get #popup(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>(".camo-popup") ?? null;
  }

  get #anchor(): HTMLElement | null {
    return this.querySelector<HTMLElement>(':scope > [slot="anchor"]');
  }

  override connectedCallback(): void {
    super.connectedCallback();
    globalThis.addEventListener?.("resize", this.#place);
    globalThis.addEventListener?.("scroll", this.#place, true);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    globalThis.removeEventListener?.("resize", this.#place);
    globalThis.removeEventListener?.("scroll", this.#place, true);
  }

  override firstUpdated(): void {
    const wire = (): void => this.#anchor?.addEventListener("click", this.#onAnchorClick);
    wire();
    this.renderRoot.querySelector("slot[name=anchor]")?.addEventListener("slotchange", wire);
  }

  readonly #onAnchorClick = (): void => {
    this.open = !this.open;
    if (!this.open) this.#returnFocus = true;
  };

  /** Puts the panel by the anchor and tells the renderer where the arrow goes. Called again once the arrow has made room. */
  readonly #place = (): void => {
    const popup = this.#popup;
    const anchor = this.#anchor;
    if (!this.open || popup === null || anchor === null || !popup.matches(":popover-open")) return;
    const skin = this.#cx.skin;
    const style = skin?.popover.defaults(tokens);
    // The gap is measured in the page's own pixels; a CSS length from a variable is read where it applies.
    const gap = style === undefined ? 8 : (this.#px(style.gap) ?? 8);
    const arrow = style?.showArrow === true ? (this.#px(style.arrowHeight) ?? 0) : 0;
    const a = anchor.getBoundingClientRect();
    const placed = placePanel(
      { left: a.left, top: a.top, width: a.width, height: a.height },
      { width: popup.offsetWidth, height: popup.offsetHeight },
      { width: window.innerWidth, height: window.innerHeight },
      this.placement,
      { rtl: getComputedStyle(this).direction === "rtl", gap: gap + arrow },
    );
    popup.style.left = `${placed.left}px`;
    popup.style.top = `${placed.top}px`;
    if (placed.side !== this.side || placed.arrowOffset !== this.arrow) {
      this.side = placed.side;
      this.arrow = placed.arrowOffset;
    }
  };

  /** A length in px: "8px" now, or a `var(...)` resolved by the element's own style. */
  #px(length: string): number | null {
    const probe = document.createElement("span");
    probe.style.cssText = `position:absolute;visibility:hidden;inline-size:${length}`;
    this.renderRoot.append(probe);
    const px = probe.getBoundingClientRect().width;
    probe.remove();
    return Number.isFinite(px) ? px : null;
  }

  readonly #onToggle = (event: Event): void => {
    const state = (event as ToggleEvent).newState;
    this.open = state === "open";
    if (state === "open") return;
    if (this.#returnFocus) this.#anchor?.focus({ preventScroll: true });
    this.#returnFocus = false;
    this.dispatchEvent(new Event("camo-close", { bubbles: true, composed: true }));
  };

  // Escape closes the popover natively; this notes that focus goes back to the anchor.
  readonly #onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") this.#returnFocus = true;
  };

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, { role: "generic" });
  }

  override updated(changed: PropertyValues<this>): void {
    const popup = this.#popup;
    const anchor = this.#anchor;
    if (anchor !== null) {
      anchor.setAttribute("aria-haspopup", "dialog");
      anchor.setAttribute("aria-expanded", this.open ? "true" : "false");
      (anchor as HTMLElement & { ariaHasPopup: string | null }).ariaHasPopup = "dialog";
    }
    if (popup === null || typeof popup.showPopover !== "function") return;
    if (changed.has("open")) {
      if (this.open && !popup.matches(":popover-open")) {
        popup.showPopover();
        this.#place();
        // The arrow makes room around the panel, which changes its size: place again.
        requestAnimationFrame(this.#place);
        this.dispatchEvent(new Event("camo-open", { bubbles: true, composed: true }));
        const first = [...this.querySelectorAll<HTMLElement>(`${TABBABLE}, [autofocus]`)].find(
          (el) => el.closest('[slot="anchor"]') === null,
        );
        (first ?? popup).focus({ preventScroll: true });
      } else if (!this.open && popup.matches(":popover-open")) popup.hidePopover();
    } else if (
      (changed as Map<PropertyKey, unknown>).has("side") ||
      (changed as Map<PropertyKey, unknown>).has("arrow")
    ) {
      requestAnimationFrame(this.#place);
    }
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    const anchor = html`<slot name="anchor"></slot>`;
    if (skin === undefined)
      return html`${anchor}<div class="camo-popup" popover="auto"><slot></slot></div>`;
    const renderer = skin.popover;
    const state: PopoverState = {
      title: this.title === "" ? null : this.title,
      side: this.side,
      arrowOffset: this.arrow,
    };
    return html`${anchor}${cssBlock(renderer.styles)}
      <div
        class="camo-popup"
        popover="auto"
        role="group"
        tabindex="-1"
        aria-label=${this.title === "" ? "Popover" : this.title}
        @toggle=${this.#onToggle}
        @keydown=${this.#onKeyDown}
      >
        ${renderer.render({
          state,
          slots: SLOTS,
          theme: tokens,
          style: renderer.defaults(tokens),
          skin,
        })}
      </div>`;
  }
}
