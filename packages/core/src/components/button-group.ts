import { LitElement, css, html, isServer } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { attachActivation } from "../behavior/activation.ts";
import { applyAria } from "../behavior/aria.ts";
import { PressController } from "../behavior/press.ts";
import { RovingTabindexController } from "../behavior/roving.ts";
import { CamouflageController } from "../controller.ts";
import { resolveIcon } from "../icons.ts";
import type { CamoMenu } from "./menu.ts";
import type {
  Appearance,
  ButtonGroupState,
  GroupButtonState,
  GroupPosition,
  SplitButtonState,
  Tone,
} from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const GROUP_SLOTS = { content: "" } as const;
const BUTTON_SLOTS = { icon: "icon" } as const;
const SPLIT_SLOTS = { "prefix-icon": "prefix-icon" } as const;

/**
 * `<camo-group-button text="Bold" toggle selected>` or `<camo-group-button icon="heart" content-description="Like">`
 *
 * One button of a `camo-button-group`: a command (it fires `click`), or a toggle (`toggle`, with `selected` that the app
 * flips from `click`). An icon-only button needs `content-description`. Its place in the group ("2 of 3"), its shape and its
 * colors come from the group.
 *
 * @tagname camo-group-button
 * @slot icon - An icon, when the `icon` attribute is not used.
 * @attr {string} text - The label.
 * @attr {string} icon - The name of a registered icon.
 * @attr {string} content-description - The accessible name of an icon-only button.
 * @attr {boolean} toggle - A toggle button with `aria-pressed` (the contract's non-null `selected`).
 * @attr {boolean} selected - Whether a toggle is on.
 * @attr {boolean} disabled - Blocks clicks and focus (the contract's `enabled`, inverted).
 */
export class CamoGroupButton extends LitElement {
  static override properties: PropertyDeclarations = {
    text: { type: String },
    icon: { type: String },
    contentDescription: { type: String, attribute: "content-description" },
    toggle: { type: Boolean, reflect: true },
    selected: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    position: { attribute: false },
    connected: { type: Boolean, attribute: false },
    appearance: { type: String, attribute: false },
    tone: { type: String, attribute: false },
    index: { attribute: false },
  };

  static override styles: CSSResult = css``;

  declare text: string | null;
  declare icon: string | null;
  declare contentDescription: string | null;
  declare toggle: boolean;
  declare selected: boolean;
  declare disabled: boolean;
  /** Set by the group. */
  declare position: GroupPosition;
  declare connected: boolean;
  declare appearance: Appearance | null;
  declare tone: Tone;
  declare index: { index: number; size: number } | null;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  readonly #press: PressController = new PressController(this, () => this.disabled);

  constructor() {
    super();
    this.text = null;
    this.icon = null;
    this.contentDescription = null;
    this.toggle = false;
    this.selected = false;
    this.disabled = false;
    this.position = "only";
    this.connected = true;
    this.appearance = null;
    this.tone = "default";
    this.index = null;
    attachActivation(this, () => this.disabled);
    void this.#press;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, {
      role: "button",
      label: this.contentDescription ?? (this.text === "" ? null : this.text),
      disabled: this.disabled,
      ...(this.toggle ? { pressed: this.selected } : {}),
      ...(this.index === null ? {} : { position: this.index }),
    });
    if (!isServer && this.closest("camo-button-group") === null)
      this.setAttribute("tabindex", this.disabled ? "-1" : "0");
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`${this.text}<slot name="icon"></slot>`;
    const renderer = skin.groupButton;
    const style = renderer.defaults(tokens);
    const state: GroupButtonState = {
      text: this.text,
      icon: this.icon === null ? null : resolveIcon(this.icon),
      toggle: this.toggle,
      selected: this.selected,
      disabled: this.disabled,
      position: this.position,
      connected: this.connected,
      appearance: this.appearance || style.defaultAppearance,
      tone: this.tone,
    };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: BUTTON_SLOTS,
      theme: tokens,
      style,
      skin,
    })}`;
  }
}

/**
 * `<camo-button-group label="Formatting"><camo-group-button text="Bold" toggle>…</camo-button-group>`
 *
 * Related buttons as one control: a set of commands (Cut, Copy, Paste) or independent toggles (Bold, Italic, Underline).
 * Not a segmented control, which chooses one value for a setting. Connected by default (shared borders, only the outer
 * corners fully rounded); `spaced` keeps a gap. One Tab stop; the arrow keys move between the enabled buttons (wrapping) and
 * do not press; Space and Enter press. A toggle announces "Bold, toggle button, pressed" and its place ("2 of 3").
 *
 * @tagname camo-button-group
 * @slot - The `camo-group-button`s.
 * @attr {boolean} spaced - A gap between independent buttons (the contract's `connected`, inverted).
 * @attr {"solid"|"soft"|"raised"|"outline"|"ghost"|"link"} appearance - Absent means the skin's default (`outline`).
 * @attr {"default"|"error"|"success"|"warning"|"info"} tone - The colour family.
 * @attr {string} label - The group's accessible name.
 * @attr {boolean} disabled - Disables every button (the contract's `enabled`, inverted).
 */
export class CamoButtonGroup extends LitElement {
  static override properties: PropertyDeclarations = {
    spaced: { type: Boolean, reflect: true },
    appearance: { type: String, reflect: true },
    tone: { type: String, reflect: true },
    label: { type: String },
    disabled: { type: Boolean, reflect: true },
  };

  static override styles: CSSResult = css``;

  declare spaced: boolean;
  declare appearance: Appearance | null;
  declare tone: Tone;
  declare label: string | null;
  declare disabled: boolean;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  readonly #roving: RovingTabindexController = new RovingTabindexController(this, {
    items: () => this.#buttons(),
    orientation: "horizontal",
  });

  constructor() {
    super();
    this.spaced = false;
    this.appearance = null;
    this.tone = "default";
    this.label = null;
    this.disabled = false;
  }

  #buttons(): CamoGroupButton[] {
    return [...this.querySelectorAll<CamoGroupButton>(":scope > camo-group-button")];
  }

  #sync(): void {
    const buttons = this.#buttons();
    const appearance =
      this.appearance ?? this.#cx.skin?.buttonGroup.defaults(tokens).defaultAppearance ?? "outline";
    buttons.forEach((button, i) => {
      button.connected = !this.spaced;
      button.appearance = appearance;
      button.tone = this.tone;
      button.disabled = button.hasAttribute("disabled") || this.disabled;
      button.position =
        buttons.length === 1
          ? "only"
          : i === 0
            ? "first"
            : i === buttons.length - 1
              ? "last"
              : "middle";
      button.index = { index: i + 1, size: buttons.length };
    });
    this.#roving.update();
  }

  override firstUpdated(): void {
    this.renderRoot.addEventListener("slotchange", () => this.#sync());
    this.#sync();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, {
      role: "group",
      label: this.label === "" ? null : this.label,
      disabled: this.disabled,
    });
  }

  override updated(): void {
    this.#sync();
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`<slot></slot>`;
    const renderer = skin.buttonGroup;
    const style = renderer.defaults(tokens);
    const state: ButtonGroupState = {
      count: isServer ? 0 : this.#buttons().length,
      connected: !this.spaced,
      appearance: this.appearance || style.defaultAppearance,
      tone: this.tone,
      disabled: this.disabled,
    };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: GROUP_SLOTS,
      theme: tokens,
      style,
      skin,
    })}`;
  }
}

/**
 * `<camo-split-button text="Save"><camo-menu-item text="Save as…"></camo-menu-item>…</camo-split-button>`
 *
 * A primary action with a menu of related ones. The main part fires `click`; the arrow part opens the menu below the whole
 * button. `menu-only` is a menu button: one part that opens the menu. Enter or Space runs the focused part; Down (or Alt+Down)
 * on either part opens the menu with the first entry focused; Escape closes it and returns focus. The entries are
 * `camo-menu-item`s, dividers and groups, as in `camo-menu`; choosing one closes the menu.
 *
 * @tagname camo-split-button
 * @slot - The menu's entries: `camo-menu-item`, `camo-menu-divider`, `camo-menu-group`.
 * @slot prefix-icon - An icon before the label.
 * @attr {string} text - The label.
 * @attr {boolean} menu-only - No main action: the whole button opens the menu (the contract's null `onClick`).
 * @attr {"solid"|"soft"|"raised"|"outline"|"ghost"|"link"} appearance - Absent means the skin's default (`solid`).
 * @attr {"default"|"error"|"success"|"warning"|"info"} tone - The colour family.
 * @attr {string} menu-content-description - The arrow's accessible name; "More options" by default.
 * @attr {boolean} disabled - Disables both parts (the contract's `enabled`, inverted).
 */
export class CamoSplitButton extends LitElement {
  static override properties: PropertyDeclarations = {
    text: { type: String },
    menuOnly: { type: Boolean, attribute: "menu-only", reflect: true },
    appearance: { type: String, reflect: true },
    tone: { type: String, reflect: true },
    menuContentDescription: { type: String, attribute: "menu-content-description" },
    disabled: { type: Boolean, reflect: true },
    expanded: { state: true },
  };

  static override styles: CSSResult = css`
    camo-menu {
      display: block;
    }
    .anchor {
      display: contents;
    }
  `;

  declare text: string;
  declare menuOnly: boolean;
  declare appearance: Appearance | null;
  declare tone: Tone;
  declare menuContentDescription: string;
  declare disabled: boolean;
  declare protected expanded: boolean;

  readonly #cx: CamouflageController = new CamouflageController(this);
  readonly #press: PressController = new PressController(this, () => this.disabled);

  constructor() {
    super();
    this.text = "";
    this.menuOnly = false;
    this.appearance = null;
    this.tone = "default";
    this.menuContentDescription = "More options";
    this.disabled = false;
    this.expanded = false;
    void this.#press;
    // The main part's click is the host's own `click`; the part markers tell the two apart.
    this.addEventListener("click", this.#onClick);
    this.addEventListener("keydown", this.#onKey);
  }

  get #menu(): CamoMenu | null {
    return this.renderRoot?.querySelector<CamoMenu>("camo-menu") ?? null;
  }

  readonly #onClick = (event: Event): void => {
    const part = (
      event
        .composedPath()
        .find((n) => n instanceof HTMLElement && n.dataset["part"] !== undefined) as
        HTMLElement | undefined
    )?.dataset["part"];
    if (this.disabled) {
      event.stopImmediatePropagation();
      return;
    }
    if (part === "arrow" || (part === "main" && this.menuOnly)) {
      event.stopImmediatePropagation();
      this.#toggle();
    }
    // Otherwise it is the main action: the click goes on to the app's handlers.
  };

  readonly #onKey = (event: KeyboardEvent): void => {
    const part = (
      event
        .composedPath()
        .find((n) => n instanceof HTMLElement && n.dataset["part"] !== undefined) as
        HTMLElement | undefined
    )?.dataset["part"];
    if (part === undefined || this.disabled) return;
    if (event.key === "ArrowDown" || (event.altKey && event.key === "ArrowDown")) {
      event.preventDefault();
      void this.#menu?.show("first");
    }
  };

  #toggle(): void {
    const menu = this.#menu;
    if (menu === null) return;
    if (menu.open) menu.hide();
    else void menu.show("first");
  }

  override firstUpdated(): void {
    this.#wire();
  }

  override updated(): void {
    this.#wire();
  }

  /** The menu is placed under the whole button, and its entries are this element's own children. */
  #wire(): void {
    const menu = this.#menu;
    const split = this.renderRoot.querySelector<HTMLElement>(".split");
    if (menu === null || split === null) return;
    menu.manual = true;
    menu.anchorElement = split;
    menu.itemsRoot = this;
  }

  /** Focus returns to the part that had it, which is the first part. */
  readonly #onClose = (): void => {
    this.expanded = false;
    this.renderRoot.querySelector<HTMLElement>("[data-part=main]")?.focus({ preventScroll: true });
  };

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`<button>${this.text}</button><slot></slot>`;
    const renderer = skin.splitButton;
    const style = renderer.defaults(tokens);
    const state: SplitButtonState = {
      text: this.text,
      hasAction: !this.menuOnly,
      expanded: this.expanded,
      appearance: this.appearance || style.defaultAppearance,
      tone: this.tone,
      disabled: this.disabled,
      menuLabel: this.menuContentDescription,
    };
    return html`${cssBlock(renderer.styles)}<camo-menu
        @camo-open=${(): void => {
          this.expanded = true;
        }}
        @camo-close=${this.#onClose}
        ><span slot="anchor" class="anchor"
          >${renderer.render({
            state,
            slots: SPLIT_SLOTS,
            theme: tokens,
            style,
            skin,
          })}</span
        ><slot></slot
      ></camo-menu>`;
  }
}
