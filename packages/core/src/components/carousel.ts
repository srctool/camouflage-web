import { LitElement, css, html, isServer } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { CamouflageController } from "../controller.ts";
import type { CarouselLayout, CarouselState, ShowButtons } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = { content: "" } as const;

/** The detail of `camo-page-change`. */
export interface CamoPageChangeDetail {
  page: number;
}

/**
 * `<camo-carousel caption="Photos"><img …><img …></camo-carousel>`
 *
 * A row of items you swipe or step through, one at a time (`paged`) or with the next one peeking (`peek`). Any element is
 * an item. It is a scroll-snap strip, so touch, the wheel and the keyboard scroll it natively; previous and next buttons (on
 * pointer devices by default) and page dots sit on top. The scrolling strip is the one Tab stop (a scrollable region must be focusable); the region is named by `caption` and each item announces "2 of 5";
 * items out of sight are inert, so Tab never reaches them. Left and Right (in reading direction), Home and End move it. Under
 * reduced motion a step is instant. One item has no buttons or dots. `autoplay` (a delay in ms) is opt-in, never runs under
 * reduced motion, pauses while hovered or focused and stops for good once the user steps through it: use it rarely. A server
 * cannot read the items, so their "2 of 5" names and the dots arrive when it hydrates.
 *
 * @tagname camo-carousel
 * @slot - The items.
 * @attr {string} caption - The carousel's accessible name (required).
 * @attr {"paged"|"peek"} layout - One item at a time, or the next one showing at the edge.
 * @attr {"auto"|"always"|"never"} show-buttons - Previous and next buttons: `auto` shows them on pointer devices.
 * @attr {boolean} hide-indicator - Hides the page dots (the contract's `showIndicator`, inverted).
 * @attr {number} page - The current item, from 0; set it to move there.
 * @attr {number} autoplay - Steps on by itself every this many milliseconds; absent is off.
 * @fires {CustomEvent<CamoPageChangeDetail>} camo-page-change - The page changed.
 */
export class CamoCarousel extends LitElement {
  static override properties: PropertyDeclarations = {
    caption: { type: String },
    layout: { type: String, reflect: true },
    showButtons: { type: String, attribute: "show-buttons" },
    hideIndicator: { type: Boolean, attribute: "hide-indicator", reflect: true },
    page: { type: Number, reflect: true },
    autoplay: { type: Number },
    count: { state: true },
    fine: { state: true },
  };

  static override styles: CSSResult = css``;

  declare caption: string;
  declare layout: CarouselLayout;
  declare showButtons: ShowButtons;
  declare hideIndicator: boolean;
  declare page: number;
  declare autoplay: number | null;
  declare protected count: number;
  declare protected fine: boolean;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  #observer: IntersectionObserver | null = null;
  #settle: ReturnType<typeof setTimeout> | undefined;
  #timer: ReturnType<typeof setInterval> | undefined;
  #held = false;
  #stopped = false;
  #scrolling = false;
  /** The page the last scroll read, which must not be scrolled to again (it would interrupt a smooth scroll on its way). */
  #reported = 0;

  constructor() {
    super();
    this.caption = "";
    this.layout = "paged";
    this.showButtons = "auto";
    this.hideIndicator = false;
    this.page = 0;
    this.autoplay = null;
    this.count = 0;
    // A server assumes a pointer, like the environment's default.
    this.fine = true;
    this.addEventListener("keydown", this.#onKey);
    this.addEventListener("pointerenter", () => (this.#held = true));
    this.addEventListener("pointerleave", () => (this.#held = false));
    this.addEventListener("focusin", () => (this.#held = true));
    this.addEventListener("focusout", () => (this.#held = false));
    this.addEventListener("pointerdown", () => (this.#stopped = true));
  }

  get #strip(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>(".strip") ?? null;
  }

  #items(): HTMLElement[] {
    return [...this.children].filter((c): c is HTMLElement => c instanceof HTMLElement);
  }

  /** How far an item's start is from the strip's start edge, in the reading direction. */
  #offset(item: HTMLElement, strip: HTMLElement): number {
    const a = item.getBoundingClientRect();
    const b = strip.getBoundingClientRect();
    return getComputedStyle(this).direction === "rtl" ? b.right - a.right : a.left - b.left;
  }

  /** Moves to an item, with the smooth scroll the platform offers, or at once under reduced motion. */
  goTo(page: number): void {
    const strip = this.#strip;
    const items = this.#items();
    const target = items[Math.min(Math.max(page, 0), items.length - 1)];
    if (strip === null || target === undefined) return;
    const rtl = getComputedStyle(this).direction === "rtl";
    const delta = this.#offset(target, strip) * (rtl ? -1 : 1);
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    strip.scrollBy({ left: delta, behavior: calm ? "auto" : "smooth" });
  }

  #step(by: number): void {
    this.#stopped = true;
    this.goTo(this.page + by);
  }

  /** The page now: the item whose start is nearest the strip's start. */
  #read(): void {
    const strip = this.#strip;
    if (strip === null) return;
    const items = this.#items();
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    items.forEach((item, i) => {
      const distance = Math.abs(this.#offset(item, strip));
      if (distance < bestDistance) {
        best = i;
        bestDistance = distance;
      }
    });
    if (best !== this.page) {
      this.#reported = best;
      this.page = best;
      this.dispatchEvent(
        new CustomEvent<CamoPageChangeDetail>("camo-page-change", {
          detail: { page: best },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  #label(): void {
    const items = this.#items();
    items.forEach((item, i) => {
      item.setAttribute("role", "group");
      item.setAttribute("aria-roledescription", "slide");
      item.setAttribute("aria-label", `${i + 1} of ${items.length}`);
    });
    if (items.length !== this.count) this.count = items.length;
  }

  readonly #onKey = (event: KeyboardEvent): void => {
    if (event.target !== this) return;
    const rtl = getComputedStyle(this).direction === "rtl";
    if (event.key === (rtl ? "ArrowLeft" : "ArrowRight")) this.#step(1);
    else if (event.key === (rtl ? "ArrowRight" : "ArrowLeft")) this.#step(-1);
    else if (event.key === "Home") this.#step(-this.page);
    else if (event.key === "End") this.#step(this.count - 1 - this.page);
    else return;
    event.preventDefault();
  };

  readonly #onClick = (event: Event): void => {
    const part = (event.target as HTMLElement).closest<HTMLElement>("[data-part]")?.dataset["part"];
    if (part === "prev") this.#step(-1);
    else if (part === "next") this.#step(1);
  };

  // The page is read when the scroll has settled (`scrollend`, or a pause in the scroll events where it is missing), so a
  // swipe or a smooth step through several items reports one change, not one per item it passes.
  readonly #onScroll = (): void => {
    this.#scrolling = true;
    clearTimeout(this.#settle);
    this.#settle = setTimeout(this.#settled, 120);
  };

  readonly #settled = (): void => {
    clearTimeout(this.#settle);
    this.#scrolling = false;
    this.#read();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    if (!isServer) this.fine = matchMedia("(pointer: fine)").matches;
  }

  override firstUpdated(): void {
    const strip = this.#strip;
    this.renderRoot.addEventListener("slotchange", () => {
      this.#label();
      this.#watch();
    });
    this.renderRoot.addEventListener("click", this.#onClick);
    strip?.addEventListener("scroll", this.#onScroll, { passive: true });
    strip?.addEventListener("scrollend", this.#settled);
    this.#label();
    this.#watch();
    if (this.page > 0) requestAnimationFrame(() => this.goTo(this.page));
  }

  /** An item that is out of sight takes no focus: it is inert until it scrolls into view. */
  #watch(): void {
    const strip = this.#strip;
    this.#observer?.disconnect();
    if (strip === null || typeof IntersectionObserver === "undefined") return;
    this.#observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) (entry.target as HTMLElement).inert = !entry.isIntersecting;
      },
      { root: strip, threshold: 0.01 },
    );
    for (const item of this.#items()) this.#observer.observe(item);
  }

  override updated(changed: PropertyValues<this>): void {
    // The app set `page`: scroll there (a scroll the user made already set it, and there is nothing to do).
    if (
      changed.has("page") &&
      changed.get("page") !== undefined &&
      !this.#scrolling &&
      this.page !== this.#reported
    ) {
      const strip = this.#strip;
      const items = this.#items();
      const target = items[this.page];
      if (strip !== null && target !== undefined && Math.abs(this.#offset(target, strip)) > 2)
        this.goTo(this.page);
    }
    if (changed.has("autoplay")) this.#autoplay();
  }

  #autoplay(): void {
    clearInterval(this.#timer);
    if (isServer || this.autoplay === null || this.autoplay <= 0) return;
    this.#timer = setInterval(() => {
      const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (this.#held || this.#stopped || calm || document.hidden || this.count < 2) return;
      this.goTo(this.page + 1 >= this.count ? 0 : this.page + 1);
    }, this.autoplay);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    clearInterval(this.#timer);
    this.#observer?.disconnect();
    clearTimeout(this.#settle);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, {
      role: "region",
      label: this.caption === "" ? null : this.caption,
    });
    this.setAttribute("aria-roledescription", "carousel");
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`<slot></slot>`;
    const renderer = skin.carousel;
    const buttons = this.showButtons === "always" || (this.showButtons === "auto" && this.fine);
    const count = Math.max(this.count, 0);
    const state: CarouselState = {
      page: this.page,
      pageCount: count,
      layout: this.layout,
      buttons: buttons && count > 1,
      indicator: !this.hideIndicator,
      hasPrevious: this.page > 0,
      hasNext: this.page < count - 1,
      caption: this.caption,
      texts: { previous: "Previous", next: "Next" },
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
