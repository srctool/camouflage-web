import { LitElement, css, html } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { CamouflageController } from "../controller.ts";
import type { PaginationState, PaginationVariant } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";
import type { CamoPageChangeDetail } from "./carousel.ts";
import { pageItems } from "./pagination-items.ts";

const NO_SLOTS = {} as const;

/**
 * `<camo-pagination page-count="20" page="3" label="Results">`
 *
 * Page controls for a long list or table. `page` counts from 0 (the contract's `page`; the label shows it from 1).
 * `numbered` shows the first and last page, the current page with its `siblings`, and folds the rest into gaps, at a fixed
 * length so nothing shifts as the page changes; `compact` says "Page 3 of 9" between the arrows; `dots` is a page control for a
 * short, swipeable set (it is one adjustable value). A change fires `camo-page-change` with `{ page }` and the element
 * follows it, so it works uncontrolled; set `page` again to override. A navigation landmark named `label`; the current page
 * is `aria-current="page"`. One Tab stop; Left and Right move between the parts without choosing, Enter or Space picks, Home
 * and End jump to the first and last page. One page, or none, draws nothing. Switching to `compact` on a narrow window is the
 * app's choice (the window size is in the provider's environment).
 *
 * @tagname camo-pagination
 * @attr {number} page-count - How many pages there are.
 * @attr {number} page - The current page, from 0.
 * @attr {"numbered"|"compact"|"dots"} variant - The form.
 * @attr {number} siblings - Pages shown on each side of the current one; 1 by default.
 * @attr {string} label - The landmark's name; "Pagination" by default.
 * @attr {boolean} disabled - Blocks every control (the contract's `enabled`, inverted).
 * @fires {CustomEvent<CamoPageChangeDetail>} camo-page-change - A page was chosen.
 */
export class CamoPagination extends LitElement {
  static override properties: PropertyDeclarations = {
    pageCount: { type: Number, attribute: "page-count" },
    page: { type: Number, reflect: true },
    variant: { type: String, reflect: true },
    siblings: { type: Number },
    label: { type: String },
    disabled: { type: Boolean, reflect: true },
  };

  static override styles: CSSResult = css``;

  declare pageCount: number;
  declare page: number;
  declare variant: PaginationVariant;
  declare siblings: number;
  declare label: string;
  declare disabled: boolean;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);

  constructor() {
    super();
    this.pageCount = 0;
    this.page = 0;
    this.variant = "numbered";
    this.siblings = 1;
    this.label = "Pagination";
    this.disabled = false;
    this.addEventListener("click", this.#onClick);
    this.addEventListener("keydown", this.#onKey);
  }

  get #current(): number {
    return Math.min(Math.max(Math.floor(this.page), 0), Math.max(this.pageCount - 1, 0));
  }

  #go(page: number): void {
    if (this.disabled || this.pageCount < 1) return;
    const next = Math.min(Math.max(page, 0), this.pageCount - 1);
    if (next === this.#current) return;
    this.page = next;
    this.dispatchEvent(
      new CustomEvent<CamoPageChangeDetail>("camo-page-change", {
        detail: { page: next },
        bubbles: true,
        composed: true,
      }),
    );
  }

  readonly #onClick = (event: Event): void => {
    const part = (event.composedPath() as HTMLElement[]).find(
      (n) => n instanceof HTMLElement && n.dataset?.["part"] !== undefined,
    );
    if (part === undefined) return;
    switch (part.dataset["part"]) {
      case "prev":
        this.#go(this.#current - 1);
        break;
      case "next":
        this.#go(this.#current + 1);
        break;
      case "page":
        this.#go(Number(part.dataset["index"]));
        break;
    }
  };

  #buttons(): HTMLButtonElement[] {
    return [...this.renderRoot.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
  }

  // Left and Right move focus among the parts without choosing (choosing on each arrow would shift the items under it).
  readonly #onKey = (event: KeyboardEvent): void => {
    const buttons = this.#buttons();
    const at = buttons.indexOf(event.composedPath()[0] as HTMLButtonElement);
    if (at < 0) return;
    const rtl = getComputedStyle(this).direction === "rtl";
    let next: number | null = null;
    if (event.key === (rtl ? "ArrowLeft" : "ArrowRight"))
      next = Math.min(at + 1, buttons.length - 1);
    else if (event.key === (rtl ? "ArrowRight" : "ArrowLeft")) next = Math.max(at - 1, 0);
    else if (event.key === "Home") {
      event.preventDefault();
      this.#go(0);
      return;
    } else if (event.key === "End") {
      event.preventDefault();
      this.#go(this.pageCount - 1);
      return;
    }
    if (next === null) return;
    event.preventDefault();
    buttons[next]?.focus();
  };

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, {
      role: "generic",
      hidden: this.pageCount < 2,
    });
  }

  override updated(): void {
    // One part is in the tab order: the current page, else the first control.
    const buttons = this.#buttons();
    const current =
      this.renderRoot.querySelector<HTMLElement>('[aria-current="page"]') ?? buttons[0];
    buttons.forEach((b) => b.setAttribute("tabindex", b === current ? "0" : "-1"));
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined || this.pageCount < 2) return html``;
    const renderer = skin.pagination;
    const page = this.#current;
    const state: PaginationState = {
      pageCount: this.pageCount,
      page,
      variant: this.variant,
      items: this.variant === "numbered" ? pageItems(this.pageCount, page, this.siblings) : [],
      disabled: this.disabled,
      texts: {
        previous: "Previous page",
        next: "Next page",
        summary: `Page ${page + 1} of ${this.pageCount}`,
        page: "Page",
      },
    };
    return html`${cssBlock(renderer.styles)}<nav aria-label=${this.label}>${renderer.render({
      state,
      slots: NO_SLOTS,
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
    })}</nav>`;
  }
}
