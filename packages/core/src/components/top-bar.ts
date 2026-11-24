import { LitElement, css, html, isServer } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { CamouflageController } from "../controller.ts";
import type { TopBarState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = {
  navigation: "navigation",
  actions: "actions",
  "title-content": "title-content",
} as const;

/**
 * `<camo-top-bar title="Inbox" scroll-target="#list"><camo-icon-button slot="navigation" label="Back">…</…></camo-top-bar>`
 *
 * The header of a page or a section: a navigation slot, the title, and actions. `scroll-offset` is how far the content has
 * scrolled under it (a distance, so a flat skin only checks it is above zero for a hairline or a tint, while Cupertino
 * collapses a large title with it); `scroll-target` (a selector, or `window`) lets the bar follow a scroller itself.
 * `titleContent` (the `title-content` slot) replaces the drawn title, a search field or a logo, while `title` stays the
 * bar's heading for screen readers. `hidden` slides it away (hide on scroll). It sticks to the top of its container.
 *
 * @tagname camo-top-bar
 * @slot navigation - Usually a back `camo-icon-button`.
 * @slot actions - Usually `camo-icon-button`s.
 * @slot title-content - Replaces the drawn title.
 * @attr {string} title - The title, and the bar's heading.
 * @attr {number} scroll-offset - How far the content has scrolled under the bar, in px; 0 at the top.
 * @attr {string} scroll-target - A selector or `window`: the bar sets `scroll-offset` from that scroller.
 * @attr {boolean} hidden - Slides the bar out of view (the contract's `visible`, inverted).
 */
export class CamoTopBar extends LitElement {
  static override properties: PropertyDeclarations = {
    title: { type: String },
    scrollOffset: { type: Number, attribute: "scroll-offset" },
    scrollTarget: { type: String, attribute: "scroll-target" },
    hidden: { type: Boolean, reflect: true },
  };

  static override styles: CSSResult = css``;

  declare title: string;
  declare scrollOffset: number;
  declare scrollTarget: string | null;
  declare hidden: boolean;

  readonly #cx: CamouflageController = new CamouflageController(this);
  #stripping = false;
  #watched: EventTarget | null = null;

  constructor() {
    super();
    this.title = "";
    this.scrollOffset = 0;
    this.scrollTarget = null;
    this.hidden = false;
  }

  /** A `title` attribute would also show the browser's tooltip over the whole bar, so it is read and removed. */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (name === "title" && value === null && this.#stripping) return;
    super.attributeChangedCallback(name, old, value);
    if (name === "title" && value !== null && !isServer) {
      this.#stripping = true;
      this.removeAttribute("title");
      this.#stripping = false;
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#unwatch();
  }

  #unwatch(): void {
    this.#watched?.removeEventListener("scroll", this.#onScroll);
    this.#watched = null;
  }

  readonly #onScroll = (): void => {
    const t = this.#watched;
    this.scrollOffset =
      t instanceof Window ? t.scrollY : ((t as HTMLElement | null)?.scrollTop ?? 0);
  };

  // The host cannot select on slotted content (`:host(:has())` is not in every engine), so it says it.
  override firstUpdated(): void {
    const sync = (): void => {
      this.toggleAttribute(
        "data-camo-title-content",
        this.querySelector(':scope > [slot="title-content"]') !== null,
      );
    };
    sync();
    this.renderRoot.addEventListener("slotchange", sync);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (!changed.has("scrollTarget") || typeof document === "undefined") return;
    this.#unwatch();
    if (this.scrollTarget === null || this.scrollTarget === "") return;
    const target =
      this.scrollTarget === "window" ? window : document.querySelector(this.scrollTarget);
    if (target === null) return;
    this.#watched = target;
    target.addEventListener("scroll", this.#onScroll, { passive: true });
    this.#onScroll();
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`<h1>${this.title}</h1><slot></slot>`;
    const renderer = skin.topBar;
    const state: TopBarState = {
      title: this.title,
      scrollOffset: this.scrollOffset,
      scrolled: this.scrollOffset > 0,
      visible: !this.hidden,
    };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: SLOTS,
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
    })}`;
  }
}
