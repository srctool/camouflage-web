import { LitElement, css, html } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { placePopover } from "../behavior/popover.ts";
import { CamouflageController } from "../controller.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

/**
 * `<camo-tooltip text="Save the file"><camo-icon-button label="Save">…</camo-icon-button></camo-tooltip>`
 *
 * A short label for the element inside it (the anchor). It shows after a short delay when the pointer rests on the anchor,
 * at once when the anchor takes keyboard focus, and hides when the pointer or focus leaves, on Escape, and on press. The
 * pointer can move onto the tooltip without it going away (hoverable), and it never takes focus. The text is the anchor's
 * description, not its name: set on it as its accessible description, so screen readers read it without showing the popup.
 * Below the anchor, or above when there is no room.
 *
 * @tagname camo-tooltip
 * @slot - The anchor.
 * @attr {string} text - The tooltip's text.
 * @attr {number} show-delay - How long the pointer rests before it shows, in ms; 500 by default.
 * @attr {number} hide-delay - How long it stays after the pointer leaves, in ms; 100 by default.
 * @attr {boolean} disabled - Never shows (the contract's `enabled`, inverted).
 * @attr {boolean} open - Shown whatever the pointer and focus do.
 */
export class CamoTooltip extends LitElement {
  static override properties: PropertyDeclarations = {
    text: { type: String },
    showDelay: { type: Number, attribute: "show-delay" },
    hideDelay: { type: Number, attribute: "hide-delay" },
    disabled: { type: Boolean, reflect: true },
    open: { type: Boolean, reflect: true },
    visible: { state: true },
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
      pointer-events: auto;
    }
  `;

  declare text: string;
  declare showDelay: number;
  declare hideDelay: number;
  declare disabled: boolean;
  /** Shown whatever the pointer and focus do (for documentation and tests). */
  declare open: boolean;
  declare protected visible: boolean;

  readonly #cx: CamouflageController = new CamouflageController(this);
  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    super();
    this.text = "";
    this.showDelay = 500;
    this.hideDelay = 100;
    this.disabled = false;
    this.open = false;
    this.visible = false;
    this.addEventListener("pointerenter", this.#onEnter);
    this.addEventListener("pointerleave", this.#onLeave);
    this.addEventListener("focusin", this.#onFocus);
    this.addEventListener("focusout", this.#onBlur);
    this.addEventListener("pointerdown", () => this.#hide(0));
    this.addEventListener("keydown", (e) => e.key === "Escape" && this.#hide(0));
  }

  get #popup(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>(".camo-popup") ?? null;
  }

  get #anchor(): HTMLElement | null {
    return this.firstElementChild as HTMLElement | null;
  }

  #show(delay: number): void {
    clearTimeout(this.#timer);
    if (this.disabled || this.text === "") return;
    this.#timer = setTimeout(async () => {
      this.visible = true;
      await this.updateComplete;
      const popup = this.#popup;
      const anchor = this.#anchor;
      if (popup === null || anchor === null) return;
      popup.showPopover();
      const place = (): void =>
        placePopover(popup, anchor.getBoundingClientRect(), {
          rtl: getComputedStyle(this).direction === "rtl",
          gap: 8,
        });
      place();
      requestAnimationFrame(place);
    }, delay);
  }

  #hide(delay: number): void {
    if (this.open) return;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.#popup?.hidePopover?.();
      this.visible = false;
    }, delay);
  }

  readonly #onEnter = (): void => this.#show(this.showDelay);
  readonly #onLeave = (): void => this.#hide(this.hideDelay);
  // Keyboard focus shows at once; a mouse click's focus does not (pointerdown hid it).
  readonly #onFocus = (event: FocusEvent): void => {
    if ((event.target as Element).matches?.(":focus-visible")) this.#show(0);
  };
  readonly #onBlur = (): void => this.#hide(0);

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("open") && this.open) this.#show(0);
  }

  override updated(): void {
    // The tooltip is the anchor's description, not its name.
    const anchor = this.#anchor as (HTMLElement & { ariaDescription: string | null }) | null;
    if (anchor !== null) anchor.ariaDescription = this.text === "" ? null : this.text;
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    const anchor = html`<slot></slot>`;
    if (skin === undefined) return anchor;
    const renderer = skin.tooltip;
    return html`${anchor}${cssBlock(renderer.styles)}
      <div
        class="camo-popup"
        popover="manual"
        role="tooltip"
        @pointerenter=${(): void => clearTimeout(this.#timer)}
        @pointerleave=${this.#onLeave}
      >
        ${
          this.visible
            ? renderer.render({
                state: { text: this.text, visible: this.visible },
                slots: {},
                theme: tokens,
                style: renderer.defaults(tokens),
                skin,
              })
            : html``
        }
      </div>`;
  }
}
