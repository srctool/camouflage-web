import { LitElement, css, html, isServer, nothing } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { planBreadcrumb } from "../behavior/fit.ts";
import { CamouflageController } from "../controller.ts";
import { resolveIcon } from "../icons.ts";
import { glyphPath } from "../skin/glyphs.ts";
import type { BreadcrumbEntry, BreadcrumbState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = { overflow: "overflow" } as const;

/**
 * `<camo-breadcrumb-item label="Documents">`
 *
 * One step of a `camo-breadcrumb`. It holds the data (the label, an icon) and is not drawn itself: the breadcrumb draws the
 * trail. A click on a step in the trail is a `click` on this element, so listen to it here (or give `href` to navigate). The
 * last item is the current location and is not a link.
 *
 * @tagname camo-breadcrumb-item
 * @attr {string} label - The text.
 * @attr {string} icon - The name of a registered icon, drawn before the label.
 * @attr {string} href - An address to go to when the step is chosen.
 */
export class CamoBreadcrumbItem extends LitElement {
  static override properties: PropertyDeclarations = {
    label: { type: String },
    icon: { type: String },
    href: { type: String },
  };

  static override styles: CSSResult = css`
    :host {
      display: none;
    }
  `;

  declare label: string;
  declare icon: string | null;
  declare href: string | null;

  constructor() {
    super();
    this.label = "";
    this.icon = null;
    this.href = null;
  }

  override render(): TemplateResult {
    return html``;
  }
}

/**
 * `<camo-breadcrumb label="Breadcrumb"><camo-breadcrumb-item label="Home"></…><camo-breadcrumb-item label="Documents"></…>…`
 *
 * The path to the current location, root first, the last item being the current one. When it does not fit (or has more
 * than `max-visible` items) the middle collapses into a "more" menu, keeping the first item and as many of the last as fit.
 * A navigation landmark named `label`; steps are buttons (links when they have an `href`), the current one is
 * `aria-current="page"` and not a button. Separators mirror in right-to-left. A server draws every item; collapsing needs a width.
 *
 * @tagname camo-breadcrumb
 * @slot - The `camo-breadcrumb-item`s.
 * @attr {number} max-visible - Collapse when there are more items than this, even when they fit.
 * @attr {string} label - The landmark's name; "Breadcrumb" by default.
 */
export class CamoBreadcrumb extends LitElement {
  static override properties: PropertyDeclarations = {
    maxVisible: { type: Number, attribute: "max-visible" },
    label: { type: String },
    folded: { state: true },
    revision: { state: true },
  };

  static override styles: CSSResult = css`
    :host {
      display: block;
    }
  `;

  declare maxVisible: number | null;
  declare label: string;
  declare protected folded: number[];
  declare protected revision: number;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  #observer: ResizeObserver | null = null;
  #widths: number[] = [];
  #mutations: MutationObserver | null = null;

  constructor() {
    super();
    this.maxVisible = null;
    this.label = "Breadcrumb";
    this.folded = [];
    this.revision = 0;
    this.addEventListener("click", this.#onClick);
  }

  #items(): CamoBreadcrumbItem[] {
    // A server has no children to read: it draws the trail on the client, after hydration.
    if (isServer) return [];
    return [...this.querySelectorAll<CamoBreadcrumbItem>(":scope > camo-breadcrumb-item")];
  }

  #entries(items: CamoBreadcrumbItem[]): BreadcrumbEntry[] {
    return items.map((item, key) => ({
      key,
      label: item.label,
      current: key === items.length - 1,
      link: key !== items.length - 1,
      icon: item.icon === null ? null : resolveIcon(item.icon),
    }));
  }

  /** A step chosen in the trail, or an entry of the more menu: the item itself is clicked, and an `href` is followed. */
  #activate(key: number): void {
    const item = this.#items()[key];
    if (item === undefined) return;
    item.click();
    if (item.href !== null && item.href !== "") location.href = item.href;
  }

  readonly #onClick = (event: Event): void => {
    const part = (event.composedPath() as HTMLElement[]).find(
      (n) => n instanceof HTMLElement && n.dataset?.["part"] === "item",
    );
    if (part === undefined || (event.target as Element).closest?.("camo-breadcrumb-item") !== null)
      return;
    this.#activate(Number(part.dataset["key"]));
  };

  /** Measures the whole trail once, then plans which items to show for the room there is. */
  #plan(): void {
    if (isServer) return;
    const items = this.#items();
    const nav = this.renderRoot.querySelector<HTMLElement>("nav");
    if (nav === null) return;
    const room = nav.getBoundingClientRect().width;
    if (this.#widths.length !== items.length) {
      // Natural widths come from a trial render of every item (a squeezed item clips, so its scroll width is its natural one).
      const rendered = [...nav.querySelectorAll<HTMLElement>("[data-part=item]")];
      if (rendered.length === items.length)
        this.#widths = rendered.map((el) =>
          Math.max(el.getBoundingClientRect().width, el.scrollWidth),
        );
      else return;
    }
    const sep = 20;
    const plan = planBreadcrumb(this.#widths, room, {
      maxVisible: this.maxVisible,
      separator: sep,
      overflow: 48,
    });
    const folded = plan.folded;
    if (folded.length !== this.folded.length || folded.some((k, i) => k !== this.folded[i]))
      this.folded = folded;
  }

  override firstUpdated(): void {
    this.renderRoot.addEventListener("slotchange", () => {
      this.#widths = [];
      this.folded = [];
      this.revision++;
    });
    if (isServer) return;
    this.#observer = new ResizeObserver(() => this.#plan());
    const nav = this.renderRoot.querySelector<HTMLElement>("nav");
    if (nav !== null) this.#observer.observe(nav);
    this.#mutations = new MutationObserver(() => {
      this.#widths = [];
      this.folded = [];
      this.revision++;
    });
    this.#mutations.observe(this, { subtree: true, attributes: true, childList: true });
    this.#plan();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#observer?.disconnect();
    this.#mutations?.disconnect();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, { role: "generic" });
  }

  override updated(changed: PropertyValues<this>): void {
    if (changed.has("maxVisible")) {
      this.folded = [];
    }
    queueMicrotask(() => this.#plan());
  }

  readonly #more = (entries: BreadcrumbEntry[]): TemplateResult => html`<camo-menu
    ><camo-icon-button slot="anchor" label="More" appearance="ghost"
      ><camo-icon
        ><svg viewBox="0 0 24 24" aria-hidden="true"><path d=${glyphPath("moreHorizontal")}></path></svg></camo-icon
    ></camo-icon-button>${entries.map(
      (e) =>
        html`<camo-menu-item text=${e.label} @click=${(): void => this.#activate(e.key)}></camo-menu-item>`,
    )}</camo-menu
  >`;

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    const items = this.#items();
    if (skin === undefined) return html`<slot></slot>`;
    const renderer = skin.breadcrumb;
    const all = this.#entries(items);
    const hidden = new Set(this.folded);
    const state: BreadcrumbState = {
      items: all.filter((e) => !hidden.has(e.key)),
      folded: all.filter((e) => hidden.has(e.key)),
      label: this.label,
      texts: { more: "More", current: "current page" },
    };
    return html`${cssBlock(renderer.styles)}<slot></slot>${renderer.render({
      state,
      slots: SLOTS,
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
      nodes: { overflow: state.folded.length > 0 ? this.#more(state.folded) : nothing },
    })}`;
  }
}
