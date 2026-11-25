import { LitElement, css, html, isServer, nothing } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { fitCount } from "../behavior/fit.ts";
import { RovingTabindexController } from "../behavior/roving.ts";
import { CamouflageController } from "../controller.ts";
import { glyphPath } from "../skin/glyphs.ts";
import type { ToolbarPlacement } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = {
  leading: "leading",
  trailing: "trailing",
  content: "",
  overflow: "overflow",
} as const;
const OVERFLOWED = "data-camo-overflowed";

type IconButton = HTMLElement & {
  label: string;
  toggle: boolean;
  checked: boolean;
  disabled: boolean;
  tone: string;
};

/**
 * `<camo-toolbar label="Editor"><camo-icon-button label="Bold" toggle>…</camo-icon-button>…</camo-toolbar>`
 *
 * A row of actions for the current context (not navigation, and not a title bar). The actions are `camo-icon-button`s,
 * each named by its `label`; a `toggle` one is a pressed state (Bold, Italic). Actions that do not fit fold, in order,
 * into a trailing "more" menu whose items carry their labels, tones, enabled state and a checkmark for a toggle; choosing
 * one presses the real button. `leading` and `trailing` hold other controls (a menu button, a primary action), which do
 * not fold; a `camo-button-group` or `camo-split-button` fits there. It is a `toolbar`: one Tab stop, the arrow keys move
 * between the actions and the more button, Home and End jump. A server renders every action: folding needs a width.
 *
 * @tagname camo-toolbar
 * @slot - The actions: `camo-icon-button`s.
 * @slot leading - A menu button or a title.
 * @slot trailing - A primary action.
 * @attr {"docked"|"floating"} placement - Edge to edge, or a detached floating bar; absent means the skin's.
 * @attr {string} label - The toolbar's accessible name.
 * @attr {string} overflow-label - The more button's name; "More" by default.
 */
export class CamoToolbar extends LitElement {
  static override properties: PropertyDeclarations = {
    placement: { type: String, reflect: true },
    label: { type: String },
    overflowLabel: { type: String, attribute: "overflow-label" },
    folded: { state: true },
  };

  static override styles: CSSResult = css``;

  declare placement: ToolbarPlacement | null;
  declare label: string | null;
  declare overflowLabel: string;
  declare protected folded: IconButton[];

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  readonly #roving: RovingTabindexController = new RovingTabindexController(this, {
    items: () => this.#focusable(),
    orientation: "horizontal",
    wrap: false,
  });
  #observer: ResizeObserver | null = null;
  #mutations: MutationObserver | null = null;

  constructor() {
    super();
    this.placement = null;
    this.label = null;
    this.overflowLabel = "More";
    this.folded = [];
  }

  #actions(): IconButton[] {
    return [...this.querySelectorAll<IconButton>(":scope > camo-icon-button:not([slot])")];
  }

  /** The actions that show, and the more button when there is one. */
  #focusable(): HTMLElement[] {
    const shown = this.#actions().filter(
      (a) => !a.hasAttribute(OVERFLOWED) && !a.hasAttribute("disabled"),
    );
    const more = this.renderRoot?.querySelector<HTMLElement>(".more") ?? null;
    return more === null ? shown : [...shown, more];
  }

  /** The width in px of a CSS length from a skin's style, read where it applies. */
  #px(length: string): number {
    const probe = document.createElement("span");
    probe.style.cssText = `position:absolute;visibility:hidden;inline-size:${length}`;
    this.renderRoot.append(probe);
    const px = probe.getBoundingClientRect().width;
    probe.remove();
    return px;
  }

  /** Decides which actions fit beside a more button; the rest are folded and hidden. */
  #measure(): void {
    if (isServer) return;
    const skin = this.#cx.skin;
    const track = this.renderRoot.querySelector<HTMLElement>(".actions");
    const actions = this.#actions();
    if (skin === undefined || track === null) return;
    const style = skin.toolbar.defaults(tokens);
    const unit = this.#px(style.actionSize) + this.#px(style.actionSpacing);
    // The track also holds the more button, which is part of the room it takes when anything folds.
    const room = track.getBoundingClientRect().width;
    const count = fitCount(room, unit, actions.length, unit);
    actions.forEach((action, i) => action.toggleAttribute(OVERFLOWED, i >= count));
    const folded = actions.slice(count);
    if (folded.length !== this.folded.length || folded.some((a, i) => a !== this.folded[i]))
      this.folded = folded;
    this.#roving.update();
  }

  override firstUpdated(): void {
    this.renderRoot.addEventListener("slotchange", () => this.#measure());
    const track = this.renderRoot.querySelector<HTMLElement>(".actions");
    if (!isServer && track !== null) {
      this.#observer = new ResizeObserver(() => this.#measure());
      this.#observer.observe(track);
      // A toggle flips and an action is disabled or relabelled: the menu's items follow.
      this.#mutations = new MutationObserver(() => {
        this.requestUpdate();
        this.#measure();
      });
      this.#mutations.observe(this, {
        attributes: true,
        subtree: true,
        attributeFilter: ["checked", "disabled", "label", "tone"],
        childList: true,
      });
    }
    this.#measure();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#observer?.disconnect();
    this.#mutations?.disconnect();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, {
      role: "toolbar",
      label: this.label === "" ? null : this.label,
      orientation: "horizontal",
    });
  }

  override updated(): void {
    this.#measure();
  }

  readonly #more = (): TemplateResult => html`<camo-menu class="more-menu"
    ><camo-icon-button class="more" slot="anchor" label=${this.overflowLabel} appearance="ghost"
      ><camo-icon
        ><svg viewBox="0 0 24 24" aria-hidden="true"><path d=${glyphPath("more")}></path></svg></camo-icon
      ></camo-icon-button
    >${this.folded.map(
      (action) => html`<camo-menu-item
        text=${action.label}
        tone=${action.tone}
        ?checkable=${action.toggle}
        ?checked=${action.checked}
        ?disabled=${action.disabled}
        @click=${(): void => action.click()}
      ></camo-menu-item>`,
    )}</camo-menu
  >`;

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined)
      return html`<slot name="leading"></slot><slot></slot><slot name="trailing"></slot>`;
    const renderer = skin.toolbar;
    const style = renderer.defaults(tokens);
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state: {
        placement: this.placement ?? style.placement,
        count: isServer ? 0 : this.#actions().length,
      },
      slots: SLOTS,
      theme: tokens,
      style,
      skin,
      nodes: { overflow: this.folded.length > 0 ? this.#more() : nothing },
    })}`;
  }
}
