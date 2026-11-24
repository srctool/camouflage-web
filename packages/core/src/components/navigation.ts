import { LitElement, css, html, isServer } from "lit";
import type {
  CSSResult,
  CSSResultGroup,
  PropertyDeclarations,
  PropertyValues,
  TemplateResult,
} from "lit";
import { attachActivation } from "../behavior/activation.ts";
import { applyAria } from "../behavior/aria.ts";
import { CamoModal } from "../behavior/modal.ts";
import { NAV_PICK, NavigationController } from "../behavior/navigation.ts";
import { PressController } from "../behavior/press.ts";
import { CamouflageController } from "../controller.ts";
import { resolveIcon } from "../icons.ts";
import type { NavPlacement } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const ITEM_SLOTS = { icon: "icon", "selected-icon": "selected-icon", badge: "badge" } as const;
const BAR_SLOTS = { content: "" } as const;
const CHROME_SLOTS = { header: "header", content: "" } as const;

/**
 * `<camo-nav-item value="home" label="Home" icon="home" selected-icon="home-filled"><camo-badge slot="badge" count="3">…`
 *
 * One destination of a navigation bar, rail or drawer. The `icon` (and `selected-icon`, the filled variant when
 * selected) are registered icon names; an element in the `icon`, `selected-icon` or `badge` slot replaces them. It is a
 * link in a navigation landmark and the selected one is `aria-current="page"`. Its look (labels below or beside the icon,
 * the indicator) comes from the chrome around it.
 *
 * @tagname camo-nav-item
 * @slot icon - The icon, when the `icon` attribute is not used.
 * @slot selected-icon - The icon while selected.
 * @slot badge - A `camo-badge` (a count or a dot).
 * @attr {string} value - What the chrome's value becomes when this item is picked.
 * @attr {string} label - The text, and the accessible name.
 * @attr {string} icon - The name of a registered icon.
 * @attr {string} selected-icon - The name of a registered icon shown while selected.
 * @attr {boolean} disabled - Blocks picking and focus (the contract's `enabled`, inverted).
 */
export class CamoNavItem extends LitElement {
  static override properties: PropertyDeclarations = {
    value: { type: String },
    label: { type: String },
    icon: { type: String },
    selectedIcon: { type: String, attribute: "selected-icon" },
    disabled: { type: Boolean, reflect: true },
    selected: { type: Boolean, reflect: true },
    placement: { type: String, attribute: false },
  };

  static override styles: CSSResult = css``;

  declare value: string;
  declare label: string;
  declare icon: string | null;
  declare selectedIcon: string | null;
  declare disabled: boolean;
  /** Set by the chrome. */
  declare selected: boolean;
  declare placement: NavPlacement;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  readonly #press: PressController = new PressController(this, () => this.disabled);

  constructor() {
    super();
    this.value = "";
    this.label = "";
    this.icon = null;
    this.selectedIcon = null;
    this.disabled = false;
    this.selected = false;
    this.placement = "bar";
    this.addEventListener("click", () => {
      if (!this.disabled)
        this.dispatchEvent(new CustomEvent(NAV_PICK, { bubbles: true, composed: true }));
    });
    attachActivation(this, () => this.disabled);
    void this.#press;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, {
      role: "link",
      label: this.label === "" ? null : this.label,
      disabled: this.disabled,
      current: this.selected ? "page" : null,
    });
    if (
      !isServer &&
      this.closest(
        "camo-navigation-bar, camo-navigation-rail, camo-navigation-drawer, camo-modal-drawer",
      ) === null
    )
      this.setAttribute("tabindex", this.disabled ? "-1" : "0");
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`${this.label}`;
    const renderer = skin.navItem;
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state: {
        selected: this.selected,
        disabled: this.disabled,
        label: this.label,
        placement: this.placement,
        icon: this.icon === null ? null : resolveIcon(this.icon),
        selectedIcon: this.selectedIcon === null ? null : resolveIcon(this.selectedIcon),
      },
      slots: ITEM_SLOTS,
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
    })}`;
  }
}

/** The shared parts of the bar, the rail and the drawer. */
abstract class NavigationChrome extends LitElement {
  static override properties: PropertyDeclarations = {
    value: { type: String },
    label: { type: String },
    disabled: { type: Boolean, reflect: true },
  };

  declare value: string;
  declare label: string | null;
  declare disabled: boolean;

  protected readonly internals: ElementInternals = this.attachInternals();
  protected readonly cx: CamouflageController = new CamouflageController(this);
  protected abstract readonly nav: NavigationController;

  constructor() {
    super();
    this.value = "";
    this.label = null;
    this.disabled = false;
  }

  override firstUpdated(): void {
    this.renderRoot.addEventListener("slotchange", () => this.nav.sync());
    this.nav.sync();
  }

  override updated(): void {
    this.nav.sync();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.internals, {
      role: "navigation",
      label: this.label === "" ? null : this.label,
    });
  }
}

/**
 * `<camo-navigation-bar value="home" label="Main"><camo-nav-item value="home" label="Home" icon="home">…</camo-navigation-bar>`
 *
 * The bar of a phone's top-level destinations (3 to 5 `camo-nav-item`s), at the bottom of the window. It shows and
 * reports the selection; routing stays with your router. Arrow keys move between items, Tab leaves the bar. Picking the
 * current item again fires `camo-reselect`. `hidden` slides it out (hide on scroll). It respects the bottom inset
 * (the gesture bar).
 *
 * @tagname camo-navigation-bar
 * @slot - The `camo-nav-item`s.
 * @attr {string} value - The selected item's value.
 * @attr {string} label - The landmark's name ("Main").
 * @attr {boolean} hidden - Slides the bar out (the contract's `visible`, inverted).
 * @attr {boolean} disabled - Disables every item (the contract's `enabled`, inverted).
 * @fires {CustomEvent<CamoBeforeChangeDetail>} camo-before-change - Cancelable, before the selection changes.
 * @fires change - The user picked another item; read `value`.
 * @fires camo-reselect - The user picked the current item again.
 */
export class CamoNavigationBar extends NavigationChrome {
  static override properties: PropertyDeclarations = {
    ...NavigationChrome.properties,
    hidden: { type: Boolean, reflect: true },
  };
  static override styles: CSSResult = css``;
  declare hidden: boolean;
  protected readonly nav: NavigationController = new NavigationController(this, "bar");

  constructor() {
    super();
    this.hidden = false;
  }

  override render(): TemplateResult {
    const skin = this.cx.skin;
    if (skin === undefined) return html`<slot></slot>`;
    const renderer = skin.navigationBar;
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state: { visible: !this.hidden },
      slots: BAR_SLOTS,
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
    })}`;
  }
}

/**
 * `<camo-navigation-rail value="home"><camo-fab slot="header" …></camo-fab><camo-nav-item …>`
 *
 * The vertical rail of top-level destinations on a medium window (3 to 7 items), at the start edge (the right in
 * right-to-left). The `header` slot (a FAB, a menu button) stays fixed above the items; the items scroll when they do not fit.
 * Up and Down move between items.
 *
 * @tagname camo-navigation-rail
 * @slot header - A FAB or a menu button.
 * @slot - The `camo-nav-item`s.
 * @attr {string} value - The selected item's value.
 * @attr {string} label - The landmark's name.
 * @attr {boolean} disabled - Disables every item (the contract's `enabled`, inverted).
 * @fires {CustomEvent<CamoBeforeChangeDetail>} camo-before-change - Cancelable, before the selection changes.
 * @fires change - The user picked another item; read `value`.
 * @fires camo-reselect - The user picked the current item again.
 */
export class CamoNavigationRail extends NavigationChrome {
  static override styles: CSSResult = css``;
  protected readonly nav: NavigationController = new NavigationController(this, "rail");

  override render(): TemplateResult {
    const skin = this.cx.skin;
    if (skin === undefined) return html`<slot name="header"></slot><slot></slot>`;
    const renderer = skin.navigationRail;
    const style = renderer.defaults(tokens);
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state: { alignment: style.alignment },
      slots: CHROME_SLOTS,
      theme: tokens,
      style,
      skin,
    })}`;
  }
}

/**
 * `<camo-nav-section title="Library"><camo-nav-item …></camo-nav-section>`
 *
 * A titled group of items inside a `camo-navigation-drawer`: the title is a heading and the group is named by it.
 *
 * @tagname camo-nav-section
 * @slot - The `camo-nav-item`s.
 * @attr {string} title - The heading; without it the group is untitled.
 */
export class CamoNavSection extends LitElement {
  static override properties: PropertyDeclarations = {
    title: { type: String },
  };

  static override styles: CSSResult = css`
    :host {
      display: block;
    }
    .title {
      margin: 0;
      padding: var(--camo-spacing-l) var(--camo-spacing-l) var(--camo-spacing-s);
      color: var(--camo-color-on-surface-variant);
      font: var(--camo-type-title-small-weight) var(--camo-type-title-small-size) / var(--camo-type-title-small-line-height) var(--camo-type-title-small-family);
    }
    .items {
      display: flex;
      flex-direction: column;
      gap: var(--camo-spacing-xxs);
    }
    slot {
      display: contents;
    }
  `;

  declare title: string;

  readonly #internals: ElementInternals = this.attachInternals();
  #stripping = false;

  constructor() {
    super();
    this.title = "";
  }

  /** A `title` attribute would also show the browser's tooltip over the whole group, so it is read and removed. */
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
      role: "group",
      label: this.title === "" ? null : this.title,
    });
  }

  override render(): TemplateResult {
    return html`${this.title === "" ? html`` : html`<h2 class="title" part="title" aria-hidden="true">${this.title}</h2>`}<div class="items"><slot></slot></div>`;
  }
}

/**
 * `<camo-navigation-drawer value="inbox"><camo-nav-section title="Mail"><camo-nav-item …>`
 *
 * The permanent drawer for a wide window: full labels, titled sections (`camo-nav-section`) and a fixed `header` (a logo,
 * an account switcher) above the scrolling items. Up and Down move between items. For a phone use `camo-modal-drawer`.
 *
 * @tagname camo-navigation-drawer
 * @slot header - A logo or an account switcher.
 * @slot - `camo-nav-item`s and `camo-nav-section`s.
 * @attr {string} value - The selected item's value.
 * @attr {string} label - The landmark's name.
 * @attr {boolean} disabled - Disables every item (the contract's `enabled`, inverted).
 * @fires {CustomEvent<CamoBeforeChangeDetail>} camo-before-change - Cancelable, before the selection changes.
 * @fires change - The user picked another item; read `value`.
 * @fires camo-reselect - The user picked the current item again.
 */
export class CamoNavigationDrawer extends NavigationChrome {
  static override styles: CSSResult = css``;
  protected readonly nav: NavigationController = new NavigationController(this, "drawer");

  override render(): TemplateResult {
    const skin = this.cx.skin;
    if (skin === undefined) return html`<slot name="header"></slot><slot></slot>`;
    const renderer = skin.navigationDrawer;
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state: { modal: false },
      slots: CHROME_SLOTS,
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
    })}`;
  }
}

/**
 * `<camo-modal-drawer open value="inbox" label="Navigation"><camo-nav-item …></camo-modal-drawer>`
 *
 * The drawer for a phone: it slides in from the start edge over the content, in the overlay frame (a native modal
 * `<dialog>`: top layer, a scrim, focus trapped and returned to the menu button, Escape). The scrim, Escape, a drag toward
 * the start edge and picking an item all close it. Its visibility is state (`open`), not a route: a menu button toggles it.
 * An edge swipe to open is not built (it conflicts with the system's back gesture).
 *
 * @tagname camo-modal-drawer
 * @slot header - A logo or an account switcher.
 * @slot - `camo-nav-item`s and `camo-nav-section`s.
 * @attr {boolean} open - Shown as a modal in the top layer.
 * @attr {string} value - The selected item's value.
 * @attr {string} label - The pane's accessible name; "Navigation" by default.
 * @fires {CustomEvent<CamoCloseDetail>} camo-close - Once, when it has closed.
 * @fires {CustomEvent<CamoBeforeChangeDetail>} camo-before-change - Cancelable, before the selection changes.
 * @fires change - The user picked another item; read `value`.
 * @fires camo-reselect - The user picked the current item again.
 */
export class CamoModalDrawer extends CamoModal {
  static override properties: PropertyDeclarations = {
    value: { type: String },
    label: { type: String },
    drag: { state: true },
  };

  static override styles: CSSResultGroup = [
    CamoModal.styles,
    css`
      dialog {
        border: 0;
        padding: 0;
        margin: 0;
        margin-inline-end: auto;
        background: transparent;
        color: inherit;
        overflow: visible;
        inset-block: 0;
        inset-inline-start: 0;
        block-size: 100dvh;
        max-block-size: 100dvh;
        max-inline-size: 80vw;
        translate: calc(var(--md-drag, 0) * var(--md-out, -100%));
      }
      dialog[open] {
        animation: camo-drawer-in var(--camo-motion-duration-medium)
          var(--camo-motion-easing-emphasized);
      }
      /* Logical insets put it at the start edge; only the way it slides in and out depends on the direction. */
      :host(:dir(rtl)) dialog {
        --md-out: 100%;
      }
      @keyframes camo-drawer-in {
        from {
          translate: var(--md-out, -100%);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        dialog[open] {
          animation: none;
        }
      }
      dialog[open]:not(:modal) {
        inset-block: 0;
        inset-inline-start: 0;
        inset-inline-end: auto;
        margin: 0;
        height: 100%;
        max-height: none;
      }
    `,
  ];

  declare value: string;
  declare label: string | null;
  declare protected drag: number;

  protected readonly nav: NavigationController = new NavigationController(this, "drawer");
  #startX: number | null = null;
  #width = 1;

  constructor() {
    super();
    this.value = "";
    this.label = null;
    this.drag = 0;
    // Choosing a destination closes the drawer: it is chrome, not a destination.
    this.addEventListener("change", () => this.close());
    this.addEventListener("camo-reselect", () => this.close());
  }

  protected override initialFocus(): HTMLElement | null {
    return (
      super.initialFocus() ??
      this.querySelector<HTMLElement>("camo-nav-item[selected]") ??
      this.querySelector<HTMLElement>("camo-nav-item")
    );
  }

  protected override frameAttributes(): { label: string } {
    return { label: this.label === null || this.label === "" ? "Navigation" : this.label };
  }

  override firstUpdated(): void {
    this.renderRoot.addEventListener("slotchange", () => this.nav.sync());
    this.nav.sync();
    const dialog = this.dialog;
    dialog?.addEventListener("pointerdown", this.#onDown as EventListener);
    dialog?.addEventListener("pointermove", this.#onMove as EventListener);
    dialog?.addEventListener("pointerup", this.#onUp as EventListener);
    dialog?.addEventListener("pointercancel", this.#onUp as EventListener);
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    this.nav.sync();
  }

  // A drag toward the start edge closes it: it starts only once the move is mostly horizontal, so a tap still reaches an item.
  readonly #onDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    this.#startX = event.clientX;
    this.#width = Math.max(this.dialog?.getBoundingClientRect().width ?? 1, 1);
  };

  readonly #onMove = (event: PointerEvent): void => {
    if (this.#startX === null) return;
    const rtl = getComputedStyle(this).direction === "rtl";
    const dx = (event.clientX - this.#startX) * (rtl ? -1 : 1);
    if (dx < -10) {
      this.dialog?.setPointerCapture(event.pointerId);
      this.drag = Math.min(Math.max(-dx / this.#width, 0), 1);
      this.dialog?.style.setProperty("--md-drag", String(this.drag));
    }
  };

  readonly #onUp = (): void => {
    if (this.#startX === null) return;
    this.#startX = null;
    const dragged = this.drag;
    this.drag = 0;
    this.dialog?.style.removeProperty("--md-drag");
    if (dragged > 0.3) this.close();
  };

  protected override renderFrame(): TemplateResult {
    const skin = this.cx.skin;
    if (skin === undefined) return html`<slot name="header"></slot><slot></slot>`;
    const renderer = skin.navigationDrawer;
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state: { modal: true },
      slots: CHROME_SLOTS,
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
    })}`;
  }

  override render(): TemplateResult {
    return this.renderDialog();
  }
}
