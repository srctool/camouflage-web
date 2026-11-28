import { LitElement, css, html, isServer } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { attachActivation } from "../behavior/activation.ts";
import { applyAria } from "../behavior/aria.ts";
import { PressController } from "../behavior/press.ts";
import { placePopover } from "../behavior/popover.ts";
import { CamouflageController } from "../controller.ts";
import type { MenuItemState, Tone } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const ITEM_SLOTS = { "leading-icon": "leading-icon" } as const;
const MENU_SLOTS = { entries: "" } as const;
const ITEMS = "camo-menu-item:not([disabled]), camo-menu-submenu:not([disabled])";
/** The hover that opens a submenu, and the grace before one closes (base CamoMenu note, submenus). */
const OPEN_DELAY = 250;
const CLOSE_GRACE = 120;

type Entry = HTMLElement & { text: string };

/** The entries of one level: those whose nearest submenu is `level` itself (none, for the root). */
function levelItems(root: ParentNode, level: Element | null): Entry[] {
  return [...root.querySelectorAll<Entry>(ITEMS)].filter((item) => {
    const owner = item.parentElement?.closest("camo-menu-submenu") ?? null;
    return owner === level;
  });
}

/** The keys that move within a level: arrows, Home, End and typing the start of a label. */
class Walk {
  #typed = "";
  #typedAt = 0;

  /** The entry to focus for a key, or `undefined` when the key does not move. */
  next(event: KeyboardEvent, items: Entry[]): Entry | undefined {
    const at = items.indexOf(event.target as Entry);
    switch (event.key) {
      case "ArrowDown":
        return items[(at + 1) % items.length];
      case "ArrowUp":
        return items[(at - 1 + items.length) % items.length];
      case "Home":
        return items[0];
      case "End":
        return items.at(-1);
    }
    if (
      event.key.length !== 1 ||
      event.key === " " ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return undefined;
    // Typeahead: letters typed in quick succession make a prefix.
    const now = performance.now();
    this.#typed =
      now - this.#typedAt > 700 ? event.key.toLowerCase() : this.#typed + event.key.toLowerCase();
    this.#typedAt = now;
    return [...items.slice(at + 1), ...items.slice(0, at + 1)].find((i) =>
      i.text.toLowerCase().startsWith(this.#typed),
    );
  }
}

/** The pointer reached a row of this level: other open submenus start to close, its own stays. */
function hovered(items: Entry[], target: EventTarget | null): void {
  if (!items.includes(target as Entry)) return;
  for (const item of items)
    if (item instanceof CamoMenuSubmenu) {
      if (item === target) item.cancelClose();
      else item.scheduleClose();
    }
}

/**
 * `<camo-menu-item text="Copy" trailing-text="⌘C"><camo-icon slot="leading-icon" name="…"></…></camo-menu-item>`
 *
 * One entry of a `camo-menu`. A click (or Enter or Space) runs the app's `click` handler and the menu closes. `checkable`
 * makes it a menu item checkbox with `checked`; inside a `camo-menu-group exclusive` it is a radio item. A destructive
 * entry takes `tone="error"`.
 *
 * @tagname camo-menu-item
 * @slot leading-icon - An icon before the text.
 * @attr {string} text - The label.
 * @attr {string} trailing-text - Secondary text at the end, such as a shortcut.
 * @attr {"default"|"error"|"success"|"warning"|"info"} tone - `error` for a destructive entry.
 * @attr {boolean} checkable - A checkable item (`checked` says whether it is on).
 * @attr {boolean} checked - Whether a checkable item is on.
 * @attr {boolean} disabled - Blocks activation and focus (the contract's `enabled`, inverted).
 */
export class CamoMenuItem extends LitElement {
  static override properties: PropertyDeclarations = {
    text: { type: String },
    trailingText: { type: String, attribute: "trailing-text" },
    tone: { type: String, reflect: true },
    checkable: { type: Boolean, reflect: true },
    checked: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  static override styles: CSSResult = css``;

  declare text: string;
  declare trailingText: string | null;
  declare tone: Tone;
  declare checkable: boolean;
  declare checked: boolean;
  declare disabled: boolean;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  readonly #press: PressController = new PressController(this, () => this.disabled);

  constructor() {
    super();
    this.text = "";
    this.trailingText = null;
    this.tone = "default";
    this.checkable = false;
    this.checked = false;
    this.disabled = false;
    attachActivation(this, () => this.disabled);
    void this.#press;
  }

  get #kind(): MenuItemState["kind"] {
    if (!this.checkable) return "menuitem";
    return !isServer && this.closest("camo-menu-group[exclusive]") !== null ? "radio" : "checkbox";
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    const kind = this.#kind;
    applyAria(this, this.#internals, {
      role:
        kind === "menuitem" ? "menuitem" : kind === "radio" ? "menuitemradio" : "menuitemcheckbox",
      label: this.text === "" ? null : this.text,
      disabled: this.disabled,
      ...(kind === "menuitem" ? {} : { checked: this.checked }),
    });
    this.setAttribute("tabindex", "-1");
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`${this.text}`;
    const renderer = skin.menuItem;
    const state: MenuItemState = {
      text: this.text,
      trailingText: this.trailingText === "" ? null : this.trailingText,
      tone: this.tone,
      disabled: this.disabled,
      kind: this.#kind,
      checked: this.checked,
      hasSubmenu: false,
      submenuOpen: false,
    };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: ITEM_SLOTS,
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
    })}`;
  }
}

/**
 * `<camo-menu-divider>`: a line between groups of entries.
 *
 * @tagname camo-menu-divider
 */
export class CamoMenuDivider extends LitElement {
  static override styles: CSSResult = css`
    :host {
      display: block;
      block-size: 1px;
      margin-block: var(--camo-spacing-xs);
      background: var(--camo-color-outline-variant);
    }
  `;
  readonly #internals: ElementInternals = this.attachInternals();
  override willUpdate(): void {
    applyAria(this, this.#internals, { role: "separator" });
  }
  override render(): TemplateResult {
    return html``;
  }
}

/**
 * `<camo-menu-group exclusive>`: items that go together. With `exclusive` the checkable items are radio items: choosing
 * one unchecks the others ("Sort by: Newest").
 *
 * @tagname camo-menu-group
 * @slot - The `camo-menu-item`s.
 * @attr {boolean} exclusive - The checkable items are radio items, one of which is on.
 */
export class CamoMenuGroup extends LitElement {
  static override properties: PropertyDeclarations = {
    exclusive: { type: Boolean, reflect: true },
  };
  static override styles: CSSResult = css`
    :host {
      display: contents;
    }
  `;
  declare exclusive: boolean;
  readonly #internals: ElementInternals = this.attachInternals();
  constructor() {
    super();
    this.exclusive = false;
    this.addEventListener("click", (event) => {
      if (!this.exclusive) return;
      const item = (event.target as Element).closest<CamoMenuItem>("camo-menu-item");
      if (item === null || item.disabled || !item.checkable) return;
      for (const other of this.querySelectorAll<CamoMenuItem>("camo-menu-item"))
        other.checked = other === item;
    });
  }
  override willUpdate(): void {
    applyAria(this, this.#internals, { role: "group" });
  }
  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}

/**
 * `<camo-menu><camo-button slot="anchor" text="Actions"></camo-button><camo-menu-item text="Copy"></camo-menu-item>…</camo-menu>`
 *
 * A menu opened from an anchor (the `anchor` slot). The anchor announces "has popup" and expanded. The menu is a popover
 * (the top layer, Escape and a click outside close it) placed below the anchor, or above when there is no room. Enter,
 * Space or Down on the anchor opens it with the first item focused; Up and Down move, Home and End jump, typing a letter
 * jumps to the next item starting with it, Enter selects, Escape closes and returns focus to the anchor. Choosing an item
 * closes the menu, checkable items too (the app flips `checked` or the group does).
 *
 * @tagname camo-menu
 * @slot anchor - The element that opens the menu (a button).
 * @slot - The entries: `camo-menu-item`, `camo-menu-divider`, `camo-menu-group`.
 * @attr {boolean} open - Whether the menu is shown.
 * @fires camo-open - The menu opened.
 * @fires camo-close - The menu closed.
 */
export class CamoMenu extends LitElement {
  static override properties: PropertyDeclarations = {
    open: { type: Boolean, reflect: true },
    manual: { type: Boolean, attribute: false },
    anchorElement: { attribute: false },
    itemsRoot: { attribute: false },
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
    }
    slot[name="anchor"] {
      display: contents;
    }
  `;

  declare open: boolean;
  /**
   * For a component that builds on the menu (a split button, a toolbar's overflow): the element the menu is placed
   * under, which need not be in the `anchor` slot; whether the component opens it itself (`manual`: the menu then adds no
   * handlers and no "has popup" state to the anchor); and where the entries are, when they are not its own children.
   */
  declare anchorElement: HTMLElement | null;
  declare manual: boolean;
  declare itemsRoot: ParentNode | null;

  readonly #cx: CamouflageController = new CamouflageController(this);
  readonly #walk = new Walk();
  #returnFocus = false;

  constructor() {
    super();
    this.open = false;
    this.anchorElement = null;
    this.manual = false;
    this.itemsRoot = null;
    this.addEventListener("keydown", this.#onKey);
    this.addEventListener("click", this.#onClick);
    this.addEventListener("pointerover", (event) => hovered(this.#items(), event.target));
  }

  get #popup(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>(".camo-popup") ?? null;
  }

  get #anchor(): HTMLElement | null {
    return this.anchorElement ?? this.querySelector<HTMLElement>(':scope > [slot="anchor"]');
  }

  #items(): Entry[] {
    return levelItems(this.itemsRoot ?? this, null);
  }

  /** Opens it and focuses the first or last item (or none). `open` does the same declaratively. */
  async show(focus: "first" | "last" | "none" = "first"): Promise<void> {
    this.open = true;
    await this.updateComplete;
    const items = this.#items();
    (focus === "last" ? items.at(-1) : focus === "first" ? items[0] : undefined)?.focus();
  }

  hide(): void {
    this.#returnFocus = true;
    this.#popup?.hidePopover?.();
  }

  override updated(changed: PropertyValues<this>): void {
    const anchor = this.#anchor;
    const popup = this.#popup;
    if (
      changed.has("open") &&
      popup !== null &&
      anchor !== null &&
      typeof popup.showPopover === "function"
    ) {
      if (this.open && !popup.matches(":popover-open")) {
        popup.showPopover();
        const place = (): void =>
          placePopover(popup, anchor.getBoundingClientRect(), {
            rtl: getComputedStyle(this).direction === "rtl",
          });
        place();
        // A declarative `open` can come before the anchor has drawn: place it again once it has a size.
        requestAnimationFrame(place);
        this.dispatchEvent(new Event("camo-open", { bubbles: true, composed: true }));
      } else if (!this.open && popup.matches(":popover-open")) popup.hidePopover();
    }
    if (anchor === null || this.manual) return;
    // The anchor says what it opens, and whether it is open.
    anchor.setAttribute("aria-haspopup", "menu");
    anchor.setAttribute("aria-expanded", this.open ? "true" : "false");
    (anchor as HTMLElement & { ariaHasPopup: string | null }).ariaHasPopup = "menu";
  }

  override firstUpdated(): void {
    if (this.manual) return;
    this.#anchor?.addEventListener("click", this.#onAnchorClick);
    this.#anchor?.addEventListener("keydown", this.#onAnchorKey as EventListener);
    this.renderRoot.querySelector("slot[name=anchor]")?.addEventListener("slotchange", () => {
      this.#anchor?.addEventListener("click", this.#onAnchorClick);
      this.#anchor?.addEventListener("keydown", this.#onAnchorKey as EventListener);
    });
  }

  readonly #onAnchorClick = (): void => {
    if (this.open) this.hide();
    else void this.show("first");
  };

  readonly #onAnchorKey = (event: KeyboardEvent): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      void this.show("first");
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      void this.show("last");
    }
  };

  readonly #onToggle = (event: Event): void => {
    const state = (event as ToggleEvent).newState;
    this.open = state === "open";
    if (state === "closed") {
      if (this.#returnFocus) this.#anchor?.focus({ preventScroll: true });
      this.#returnFocus = false;
      this.dispatchEvent(new Event("camo-close", { bubbles: true, composed: true }));
    }
  };

  readonly #onKey = (event: KeyboardEvent): void => {
    if (!this.open || (event.target as Element).closest?.("[slot=anchor]") !== null) return;
    if (event.key === "Escape") {
      event.preventDefault();
      this.hide();
      return;
    }
    if (event.key === "Tab") {
      this.hide();
      return;
    }
    const next = this.#walk.next(event, this.#items());
    if (next === undefined) return;
    event.preventDefault();
    next.focus();
  };

  // A click on an entry runs the app's handler (already, it is the click) and closes the menu.
  readonly #onClick = (event: Event): void => {
    const item = (event.target as Element).closest?.("camo-menu-item");
    if (item !== null && item !== undefined && !(item as CamoMenuItem).disabled && this.open)
      this.hide();
  };

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    const anchor = html`<slot name="anchor"></slot>`;
    if (skin === undefined)
      return html`${anchor}<div class="camo-popup" popover="auto"><slot></slot></div>`;
    const renderer = skin.menu;
    return html`${anchor}${cssBlock(renderer.styles)}
      <div class="camo-popup" popover="auto" @toggle=${this.#onToggle}>
        ${renderer.render({
          state: { open: this.open },
          slots: MENU_SLOTS,
          theme: tokens,
          style: renderer.defaults(tokens),
          skin,
        })}
      </div>`;
  }
}

/**
 * `<camo-menu-submenu text="Reset"><camo-menu-item text="Soft"></camo-menu-item>…</camo-menu-submenu>`
 *
 * An entry that opens another menu beside it; submenus nest. Hovering opens it after 250 ms; a click, Enter, Space or
 * Right (Left in right-to-left) open it at once and focus its first entry. Left (Right) and Escape close it and return
 * focus to its row. The child opens at the end side, or the start side when there is no room.
 *
 * @tagname camo-menu-submenu
 * @slot leading-icon - An icon before the text.
 * @slot - The entries of the submenu: `camo-menu-item`, `camo-menu-divider`, `camo-menu-group`, `camo-menu-submenu`.
 * @attr {string} text - The label.
 * @attr {boolean} open - Whether its menu is shown (inside an open menu).
 * @attr {boolean} disabled - Blocks opening and focus (the contract's `enabled`, inverted).
 */
export class CamoMenuSubmenu extends LitElement {
  static override properties: PropertyDeclarations = {
    text: { type: String },
    disabled: { type: Boolean, reflect: true },
    open: { type: Boolean, reflect: true },
  };

  static override styles: CSSResult = css`
    :host {
      display: block;
    }
    .camo-popup {
      position: fixed;
      inset: auto;
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
      overflow: visible;
    }
  `;

  declare text: string;
  declare disabled: boolean;
  declare open: boolean;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  readonly #press: PressController = new PressController(this, () => this.disabled);
  readonly #walk = new Walk();
  #opening: ReturnType<typeof setTimeout> | undefined;
  #closing: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    super();
    this.text = "";
    this.disabled = false;
    this.open = false;
    void this.#press;
    attachActivation(this, () => this.disabled, { container: () => !this.disabled });
    this.addEventListener("click", (event) => {
      // A click on the row itself, not on an entry of the child (those close the whole chain, from the root).
      if (event.composedPath()[0] === this || this.#onRow(event)) void this.show();
    });
    this.addEventListener("keydown", this.#onKey);
    this.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch" || this.disabled) return;
      this.cancelClose();
      this.#opening = setTimeout(() => void this.show("none"), OPEN_DELAY);
    });
    this.addEventListener("pointerleave", () => clearTimeout(this.#opening));
    this.addEventListener("pointerover", (event) => {
      this.cancelClose();
      hovered(this.#items(), event.target);
    });
  }

  #onRow(event: Event): boolean {
    const first = event.composedPath()[0];
    return first instanceof Node && this.renderRoot.querySelector(".row")?.contains(first) === true;
  }

  get #popup(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>(".camo-popup") ?? null;
  }

  #items(): Entry[] {
    return levelItems(this, this);
  }

  /** Opens the submenu and, unless `focus` is `none`, focuses its first entry. */
  async show(focus: "first" | "none" = "first"): Promise<void> {
    clearTimeout(this.#opening);
    this.cancelClose();
    const popup = this.#popup;
    if (this.disabled || popup === null || typeof popup.showPopover !== "function") return;
    if (!popup.matches(":popover-open")) {
      popup.showPopover();
      this.open = true;
      await this.updateComplete;
      this.#place(popup);
    }
    if (focus === "first") this.#items()[0]?.focus();
  }

  /** Closes the submenu (and any inside it). */
  hide(): void {
    clearTimeout(this.#opening);
    this.cancelClose();
    this.#popup?.hidePopover?.();
  }

  /** Closes after the grace, unless the pointer comes back. */
  scheduleClose(): void {
    clearTimeout(this.#opening);
    if (!this.open || this.#closing !== undefined) return;
    this.#closing = setTimeout(() => this.hide(), CLOSE_GRACE);
  }

  cancelClose(): void {
    clearTimeout(this.#closing);
    this.#closing = undefined;
  }

  // Beside the row, its first entry level with it.
  #place(popup: HTMLElement): void {
    const row = this.getBoundingClientRect();
    const first = this.#items()[0]?.getBoundingClientRect();
    const inset = first === undefined ? 0 : first.top - popup.getBoundingClientRect().top;
    placePopover(popup, new DOMRect(row.x, row.y - inset, row.width, row.height), {
      rtl: getComputedStyle(this).direction === "rtl",
      side: "inline",
      gap: 0,
    });
  }

  readonly #onKey = (event: KeyboardEvent): void => {
    const rtl = getComputedStyle(this).direction === "rtl";
    const [into, back] = rtl ? ["ArrowLeft", "ArrowRight"] : ["ArrowRight", "ArrowLeft"];
    const own = event.target === this;
    if (own && (event.key === into || event.key === "Enter")) {
      event.preventDefault();
      event.stopPropagation();
      void this.show();
      return;
    }
    // Left and Escape close this level only, from one of its entries or from its row while it is open.
    if (this.open && (event.key === back || event.key === "Escape")) {
      event.preventDefault();
      event.stopPropagation();
      this.hide();
      this.focus();
      return;
    }
    if (own) return;
    const items = this.#items();
    if (!items.includes(event.target as Entry)) return;
    const next = this.#walk.next(event, items);
    if (next === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    next.focus();
  };

  readonly #onToggle = (event: Event): void => {
    this.open = (event as ToggleEvent).newState === "open";
    // The nested toggle is this level's business only.
    event.stopPropagation();
  };

  // `open` set by the app (or in the markup) shows or hides it once its parent menu is up.
  override updated(changed: PropertyValues<this>): void {
    if (!changed.has("open")) return;
    const shown = this.#popup?.matches(":popover-open") === true;
    if (this.open && !shown) requestAnimationFrame(() => void this.show("none"));
    else if (!this.open && shown) this.hide();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTimeout(this.#opening);
    this.cancelClose();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, {
      role: "menuitem",
      label: this.text === "" ? null : this.text,
      disabled: this.disabled,
      hasPopup: "menu",
      expanded: this.open,
    });
    this.setAttribute("tabindex", "-1");
    if (!isServer) this.toggleAttribute("data-camo-open", this.open);
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined)
      return html`<div class="row">${this.text}</div>
        <div class="camo-popup" popover="auto" @toggle=${this.#onToggle}><slot></slot></div>`;
    const item = skin.menuItem;
    const menu = skin.menu;
    const state: MenuItemState = {
      text: this.text,
      trailingText: null,
      tone: "default",
      disabled: this.disabled,
      kind: "menuitem",
      checked: false,
      hasSubmenu: true,
      submenuOpen: this.open,
    };
    return html`${cssBlock(item.styles, menu.styles)}
      <div class="row">
        ${item.render({
          state,
          slots: ITEM_SLOTS,
          theme: tokens,
          style: item.defaults(tokens),
          skin,
        })}
      </div>
      <div class="camo-popup" popover="auto" @toggle=${this.#onToggle}>
        ${menu.render({
          state: { open: this.open },
          slots: MENU_SLOTS,
          theme: tokens,
          style: menu.defaults(tokens),
          skin,
        })}
      </div>`;
  }
}
