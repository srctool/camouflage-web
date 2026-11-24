import { LitElement, css, html, nothing } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { CamouflageController } from "../controller.ts";
import type { PagedListState, PagedLoad } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = { empty: "empty", error: "error" } as const;

/** What the app tells the list: the items, and what is happening to them (the contract's `CamoPagedListState`). */
export interface CamoPagedState<T = unknown> {
  items: readonly T[];
  /** `initial`, `refresh` or `more` while a request is in flight; `none` otherwise. */
  loading?: PagedLoad;
  /** There is no next page: `camo-load-more` never fires. */
  endReached?: boolean;
  /** The last request failed: for the first page (a full error state) or the next one (a retry row). */
  error?: { message: string; scope: "first-page" | "next-page" } | null;
}

/**
 * `list.state = { items, loading: "more", endReached: false }; list.renderItem = (item) => html\`…\``
 *
 * A list of data that arrives in pages, controlled by one plain `state` object: the app builds it, the list only reads it.
 * It draws skeleton rows for the first page and for the next, an empty state, a first-page error with a Retry button, a
 * retry row for a failed next page, and a pull-to-refresh on touch. It fires `camo-load-more` once when the user nears the
 * end (`prefetch-distance` items before it, only when nothing is loading, there is a next page and no next-page error, and
 * again only after the state changes), `camo-retry` and `camo-refresh`. Items are keyed (`itemKey`), so a refresh or a new
 * page keeps the scroll and does not re-render the rows that stay. Virtualization is not needed for the page sizes an API
 * returns; the list keeps every loaded row in the page. It is announced as a list; skeletons are hidden and one live
 * region says "Loading" (and "Loading more" politely, once).
 *
 * @tagname camo-paged-list
 * @slot empty - Replaces the skin's empty state.
 * @slot error - Replaces the skin's first-page error.
 * @attr {string} label - The list's accessible name.
 * @attr {boolean} refreshable - Enables pull to refresh on touch devices (`camo-refresh`).
 * @attr {number} prefetch-distance - How many items before the end `camo-load-more` fires; 5 by default.
 * @attr {number} initial-skeleton-count - Skeleton rows for the first page and a refresh; 10 by default.
 * @attr {number} more-skeleton-count - Skeleton rows appended while the next page loads; 3 by default.
 * @attr {string} empty-title - The default empty state's title.
 * @attr {string} empty-message - The default empty state's message.
 * @attr {string} error-title - The default error's title.
 * @attr {string} retry-label - The retry button's text.
 * @attr {string} loading-label - What the live region says while the first page loads.
 * @attr {string} loading-more-label - What the live region says while the next page loads.
 * @fires camo-load-more - The user neared the end of the loaded items.
 * @fires camo-retry - The user asked to retry the failed page.
 * @fires camo-refresh - The user pulled to refresh.
 */
export class CamoPagedList<T = unknown> extends LitElement {
  static override properties: PropertyDeclarations = {
    state: { attribute: false },
    renderItem: { attribute: false },
    itemKey: { attribute: false },
    renderSkeleton: { attribute: false },
    label: { type: String },
    refreshable: { type: Boolean },
    prefetchDistance: { type: Number, attribute: "prefetch-distance" },
    initialSkeletonCount: { type: Number, attribute: "initial-skeleton-count" },
    moreSkeletonCount: { type: Number, attribute: "more-skeleton-count" },
    emptyTitle: { type: String, attribute: "empty-title" },
    emptyMessage: { type: String, attribute: "empty-message" },
    errorTitle: { type: String, attribute: "error-title" },
    retryLabel: { type: String, attribute: "retry-label" },
    loadingLabel: { type: String, attribute: "loading-label" },
    loadingMoreLabel: { type: String, attribute: "loading-more-label" },
    pull: { state: true },
  };

  static override styles: CSSResult = css`
    :host {
      display: block;
    }
    .sentinel {
      block-size: 0;
      inline-size: 0;
    }
    .item {
      display: block;
    }
  `;

  /** The items and what is happening to them; a property, since it is an object. */
  declare state: CamoPagedState<T>;
  /** Draws one item; a property, since it is a function. */
  declare renderItem: (item: T, index: number) => unknown;
  /** A stable identity per item; the item itself when absent. */
  declare itemKey: ((item: T) => unknown) | null;
  /** Draws one skeleton row; a `list-item` skeleton when absent. */
  declare renderSkeleton: (() => unknown) | null;
  declare label: string | null;
  declare refreshable: boolean;
  declare prefetchDistance: number;
  declare initialSkeletonCount: number;
  declare moreSkeletonCount: number;
  declare emptyTitle: string;
  declare emptyMessage: string;
  declare errorTitle: string;
  declare retryLabel: string;
  declare loadingLabel: string;
  declare loadingMoreLabel: string;
  declare protected pull: number;

  readonly #cx: CamouflageController = new CamouflageController(this);
  #observer: IntersectionObserver | undefined;
  // `camo-load-more` fires once per state: armed when the state changes, spent when it fires.
  #armed = true;
  #touchStart: number | null = null;

  constructor() {
    super();
    this.state = { items: [] };
    // The usual row: an object with a headline is a list item; anything else is its text.
    this.renderItem = (item) =>
      typeof item === "object" && item !== null && "headline" in item
        ? html`<camo-list-item
            headline=${String((item as { headline: unknown }).headline)}
            supporting=${String((item as { supporting?: unknown }).supporting ?? "")}
          ></camo-list-item>`
        : String(item);
    this.itemKey = null;
    this.renderSkeleton = null;
    this.label = null;
    this.refreshable = false;
    this.prefetchDistance = 5;
    this.initialSkeletonCount = 10;
    this.moreSkeletonCount = 3;
    this.emptyTitle = "Nothing here yet";
    this.emptyMessage = "";
    this.errorTitle = "Something went wrong";
    this.retryLabel = "Retry";
    this.loadingLabel = "Loading";
    this.loadingMoreLabel = "Loading more";
    this.pull = 0;
    this.addEventListener("touchstart", this.#onTouchStart, { passive: true });
    this.addEventListener("touchmove", this.#onTouchMove, { passive: true });
    this.addEventListener("touchend", this.#onTouchEnd);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#observer?.disconnect();
    this.#observer = undefined;
  }

  #fire(name: string): void {
    this.dispatchEvent(new Event(name, { bubbles: true, composed: true }));
  }

  get #canLoadMore(): boolean {
    const s = this.state;
    return (
      (s.loading ?? "none") === "none" &&
      s.endReached !== true &&
      s.error?.scope !== "next-page" &&
      s.error?.scope !== "first-page"
    );
  }

  // Pull to refresh: a pull of about 80 px from the very top, on touch.
  #scrollTop(): number {
    return this.scrollTop > 0 ? this.scrollTop : window.scrollY;
  }
  readonly #onTouchStart = (event: TouchEvent): void => {
    if (this.refreshable && this.#scrollTop() <= 0)
      this.#touchStart = event.touches[0]?.clientY ?? null;
  };
  readonly #onTouchMove = (event: TouchEvent): void => {
    if (this.#touchStart === null) return;
    const dy = (event.touches[0]?.clientY ?? 0) - this.#touchStart;
    this.pull = Math.min(Math.max(dy / 80, 0), 1);
  };
  readonly #onTouchEnd = (): void => {
    if (this.#touchStart === null) return;
    this.#touchStart = null;
    const done = this.pull >= 1;
    this.pull = 0;
    if (done && (this.state.loading ?? "none") === "none") this.#fire("camo-refresh");
  };

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("state")) this.#armed = true;
  }

  override updated(): void {
    if (typeof IntersectionObserver === "undefined") return;
    this.#observer ??= new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || !this.#armed || !this.#canLoadMore) return;
        this.#armed = false;
        this.#fire("camo-load-more");
      },
      { rootMargin: "0px 0px 120px 0px" },
    );
    this.#observer.disconnect();
    const sentinel = this.renderRoot.querySelector(".sentinel");
    if (sentinel !== null) this.#observer.observe(sentinel);
  }

  #skeletons(count: number): unknown[] {
    return Array.from({ length: count }, () =>
      this.renderSkeleton === null
        ? html`<camo-skeleton variant="list-item" lines="2"></camo-skeleton>`
        : this.renderSkeleton(),
    );
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    const s = this.state;
    const items = s.items;
    const loading = s.loading ?? "none";
    const at = Math.max(items.length - this.prefetchDistance, 0);
    const key = this.itemKey ?? ((item: T): unknown => item);
    const rows = html`${repeat(
      items,
      (item) => key(item),
      (item, i) =>
        html`${i === at && this.#canLoadMore ? html`<div class="sentinel"></div>` : nothing}<div class="item" role="listitem">
            ${this.renderItem(item, i)}
          </div>`,
    )}${items.length === 0 && this.#canLoadMore ? html`<div class="sentinel"></div>` : nothing}`;
    if (skin === undefined) return rows;
    const renderer = skin.pagedList;
    const firstLoading = loading === "initial" || (loading === "refresh" && items.length === 0);
    const state: PagedListState = {
      label: this.label === "" ? null : this.label,
      loading,
      endReached: s.endReached === true,
      errorScope: s.error?.scope ?? null,
      errorMessage: s.error?.message ?? null,
      isEmpty: items.length === 0,
      refreshing: loading === "refresh" && items.length > 0,
      pull: this.pull,
      texts: {
        emptyTitle: this.emptyTitle,
        emptyMessage: this.emptyMessage,
        errorTitle: this.errorTitle,
        retryLabel: this.retryLabel,
        loadingLabel: this.loadingLabel,
        loadingMoreLabel: this.loadingMoreLabel,
      },
      actions: { retry: () => this.#fire("camo-retry") },
    };
    const skeletons = html`${this.#skeletons(firstLoading ? this.initialSkeletonCount : this.moreSkeletonCount)}`;
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: SLOTS,
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
      nodes: { items: rows, skeletons },
    })}`;
  }
}
