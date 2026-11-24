import { LitElement, css, html, isServer } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { attachActivation } from "../behavior/activation.ts";
import { applyAria } from "../behavior/aria.ts";
import type { CamoBeforeChangeDetail } from "../behavior/control.ts";
import { PressController } from "../behavior/press.ts";
import { RovingTabindexController } from "../behavior/roving.ts";
import { CamouflageController } from "../controller.ts";
import { resolveIcon } from "../icons.ts";
import type { Appearance, TabState, TabsState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const TAB_SLOTS = { badge: "badge", content: "" } as const;
const TABS_SLOTS = { content: "" } as const;
const PICK = "camo-tab-pick";

/**
 * `<camo-tab value="reviews" label="Reviews"><camo-badge slot="badge" count="3"></camo-badge></camo-tab>`
 *
 * One tab of a `camo-tabs`. It needs a `label` or an `icon`; an icon-only tab needs `content-description`. A badge goes in
 * the `badge` slot, other content in the default slot. Its place ("Reviews, tab, 2 of 3") and its selection come from the
 * `camo-tabs` around it.
 *
 * @tagname camo-tab
 * @slot - Custom content, after the label.
 * @slot badge - A `camo-badge`.
 * @attr {string} value - What the bar's value becomes when this tab is picked.
 * @attr {string} label - The text.
 * @attr {string} icon - The name of a registered icon.
 * @attr {string} content-description - The accessible name of an icon-only tab.
 * @attr {boolean} disabled - Blocks picking and focus (the contract's `enabled`, inverted).
 */
export class CamoTab extends LitElement {
  static override properties: PropertyDeclarations = {
    value: { type: String },
    label: { type: String },
    icon: { type: String },
    contentDescription: { type: String, attribute: "content-description" },
    disabled: { type: Boolean, reflect: true },
    selected: { type: Boolean, reflect: true },
    scrollable: { type: Boolean, attribute: false },
    appearance: { type: String, attribute: false },
    indicated: { type: Boolean, attribute: false },
    position: { attribute: false },
  };

  static override styles: CSSResult = css``;

  declare value: string;
  declare label: string | null;
  declare icon: string | null;
  declare contentDescription: string | null;
  declare disabled: boolean;
  /** Set by the bar. */
  declare selected: boolean;
  declare scrollable: boolean;
  declare appearance: Appearance | null;
  /** The bar draws one sliding indicator, so the tab does not draw its own. */
  declare indicated: boolean;
  declare position: { index: number; size: number } | null;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  readonly #press: PressController = new PressController(this, () => this.disabled);

  constructor() {
    super();
    this.value = "";
    this.label = null;
    this.icon = null;
    this.contentDescription = null;
    this.disabled = false;
    this.selected = false;
    this.scrollable = false;
    this.appearance = null;
    this.indicated = false;
    this.position = null;
    this.addEventListener("click", () => {
      if (!this.disabled)
        this.dispatchEvent(new CustomEvent(PICK, { bubbles: true, composed: true }));
    });
    attachActivation(this, () => this.disabled);
    void this.#press;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, {
      role: "tab",
      label: this.contentDescription ?? (this.label === "" ? null : this.label),
      disabled: this.disabled,
      selected: this.selected,
      ...(this.position === null ? {} : { position: this.position }),
    });
    if (!isServer && this.closest("camo-tabs") === null)
      this.setAttribute("tabindex", this.disabled ? "-1" : "0");
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`${this.label}<slot></slot>`;
    const renderer = skin.tab;
    const style = renderer.defaults(tokens);
    const state: TabState = {
      selected: this.selected,
      disabled: this.disabled,
      label: this.label,
      icon: this.icon === null ? null : resolveIcon(this.icon),
      scrollable: this.scrollable,
      appearance: this.appearance || style.defaultAppearance,
      indicated: this.indicated,
    };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: TAB_SLOTS,
      theme: tokens,
      style,
      skin,
    })}`;
  }
}

/**
 * `<camo-tabs value="overview" label="Product"><camo-tab value="overview" label="Overview">…</camo-tabs>`
 *
 * The tab bar only (the content below is your layout): the selected `value` in, a `change` event out. Arrow keys move
 * focus and select, Home and End jump, Tab leaves the bar. `scrollable` keeps tabs at their natural width and scrolls the
 * row, keeping the selected tab in view; otherwise they share the width. One indicator slides between tabs (a pill behind
 * the tab under Cupertino's segmented look). Label the content area with the selected tab from your own layout.
 *
 * @tagname camo-tabs
 * @slot - The `camo-tab`s.
 * @attr {string} value - The selected tab's value.
 * @attr {boolean} scrollable - Tabs keep their width and the row scrolls.
 * @attr {"solid"|"soft"|"raised"|"outline"|"ghost"|"link"} appearance - `solid` is the prominent bar (top-level views), `ghost` the quiet one (sub-views); absent means the skin's.
 * @attr {string} label - The bar's accessible name.
 * @attr {boolean} disabled - Disables every tab (the contract's `enabled`, inverted).
 * @fires {CustomEvent<CamoBeforeChangeDetail>} camo-before-change - Cancelable, before the selection changes.
 * @fires change - The user picked another tab; read `value`.
 */
export class CamoTabs extends LitElement {
  static override properties: PropertyDeclarations = {
    value: { type: String },
    scrollable: { type: Boolean, reflect: true },
    appearance: { type: String, reflect: true },
    label: { type: String },
    disabled: { type: Boolean, reflect: true },
  };

  static override styles: CSSResult = css``;

  declare value: string;
  declare scrollable: boolean;
  declare appearance: Appearance | null;
  declare label: string | null;
  declare disabled: boolean;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  readonly #roving: RovingTabindexController = new RovingTabindexController(this, {
    items: () => this.#tabs(),
    orientation: "horizontal",
  });
  #observer: ResizeObserver | null = null;

  constructor() {
    super();
    this.value = "";
    this.scrollable = false;
    this.appearance = null;
    this.label = null;
    this.disabled = false;
    this.addEventListener(PICK, this.#onPick as EventListener);
    this.addEventListener("focusin", this.#onFocusIn);
  }

  #tabs(): CamoTab[] {
    return [...this.querySelectorAll<CamoTab>(":scope > camo-tab")];
  }

  #pick(tab: CamoTab): void {
    if (tab.disabled || this.disabled || tab.value === this.value) return;
    const proceed = this.dispatchEvent(
      new CustomEvent<CamoBeforeChangeDetail<string>>("camo-before-change", {
        detail: { value: tab.value },
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
    if (!proceed) return;
    this.value = tab.value;
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  readonly #onPick = (event: Event): void => {
    event.stopPropagation();
    this.#pick(event.target as CamoTab);
  };

  // As the arrow keys move focus the tab is selected too (automatic activation).
  readonly #onFocusIn = (event: FocusEvent): void => {
    const tab = (event.target as Element).closest<CamoTab>("camo-tab");
    if (tab !== null && tab.matches(":focus-visible")) this.#pick(tab);
  };

  #sync(): void {
    const tabs = this.#tabs();
    const appearance = this.appearance ?? this.#style()?.defaultAppearance ?? "solid";
    tabs.forEach((tab, i) => {
      tab.selected = tab.value === this.value;
      tab.scrollable = this.scrollable;
      tab.appearance = appearance;
      tab.disabled = tab.hasAttribute("disabled") || this.disabled;
      tab.position = { index: i + 1, size: tabs.length };
    });
    const at = tabs.findIndex((t) => t.selected && !t.disabled);
    this.#roving.setActive(at >= 0 ? at : 0);
    this.#roving.update();
    if (at >= 0) this.#roving.setActive(at);
  }

  #style(): { defaultAppearance: Appearance; indicatorWidth: "content" | "tab" } | undefined {
    return this.#cx.skin?.tabs.defaults(tokens);
  }

  /** Measures the selected tab and puts the one indicator under it (or behind it): a start and a width in the row's own space. */
  #measure(): void {
    if (isServer) return;
    const row = this.renderRoot.querySelector<HTMLElement>(".row");
    const tabs = this.#tabs();
    const selected = tabs.find((t) => t.selected);
    if (row === null || selected === undefined) {
      this.style.setProperty("--camo-tabs-ready", "0");
      tabs.forEach((t) => (t.indicated = false));
      return;
    }
    const style = this.#style();
    const rowBox = row.getBoundingClientRect();
    const tabBox = selected.getBoundingClientRect();
    const content = selected.shadowRoot?.querySelector<HTMLElement>(".content");
    const box =
      style?.indicatorWidth === "content" && content !== null && content !== undefined
        ? content.getBoundingClientRect()
        : tabBox;
    const rtl = getComputedStyle(this).direction === "rtl";
    const start = rtl
      ? rowBox.right - row.scrollLeft - box.right
      : box.left - rowBox.left + row.scrollLeft;
    this.style.setProperty("--camo-tabs-x", `${start}px`);
    this.style.setProperty("--camo-tabs-w", `${box.width}px`);
    this.style.setProperty("--camo-tabs-ready", "1");
    tabs.forEach((t) => (t.indicated = true));
  }

  override firstUpdated(): void {
    this.renderRoot.addEventListener("slotchange", () => {
      this.#sync();
      this.#measure();
    });
    this.#sync();
    if (isServer) return;
    this.#observer = new ResizeObserver(() => this.#measure());
    const row = this.renderRoot.querySelector<HTMLElement>(".row");
    if (row !== null) this.#observer.observe(row);
    for (const tab of this.#tabs()) this.#observer.observe(tab);
    // Fonts arriving change widths.
    void document.fonts?.ready.then(() => this.#measure());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#observer?.disconnect();
    this.#observer = null;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, {
      role: "tablist",
      label: this.label === "" ? null : this.label,
      disabled: this.disabled,
      orientation: "horizontal",
    });
  }

  override updated(changed: PropertyValues<this>): void {
    this.#sync();
    this.#measure();
    if (changed.has("value") && this.scrollable && !isServer)
      this.#tabs()
        .find((t) => t.selected)
        ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`<slot></slot>`;
    const renderer = skin.tabs;
    const style = renderer.defaults(tokens);
    const state: TabsState = {
      scrollable: this.scrollable,
      appearance: this.appearance || style.defaultAppearance,
      count: isServer ? 0 : this.#tabs().length,
    };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: TABS_SLOTS,
      theme: tokens,
      style,
      skin,
    })}`;
  }
}
