import { LitElement, css, html } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { isServer } from "lit";
import { CamouflageController } from "../controller.ts";
import type { AccordionState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = { leading: "leading", content: "" } as const;

/** What `camo-expanded-change` carries. */
export interface CamoExpandedDetail {
  expanded: boolean;
}

/**
 * `<camo-accordion title="Shipping" subtitle="2 to 4 days" expanded>…</camo-accordion>`
 *
 * A section that opens and closes. The header is a real button (`aria-expanded`, Enter and Space), the title is also a
 * heading, and the content stays in the page while it is closed (it keeps its state) but is hidden from assistive
 * technology, not focusable and takes no space. A toggle asks first with a cancelable `camo-before-change`, then flips
 * `expanded` and fires `camo-expanded-change`, so the app can keep it controlled. Put several in a
 * `camo-accordion-group` for the one-open-at-a-time rule.
 *
 * @tagname camo-accordion
 * @slot - The content.
 * @slot leading - An icon before the title.
 * @attr {string} title - The header's text.
 * @attr {string} subtitle - A second line in the header.
 * @attr {boolean} expanded - Whether the content is shown.
 * @attr {boolean} disabled - Blocks toggling (the contract's `enabled`, inverted).
 * @fires {CustomEvent<CamoBeforeChangeDetail>} camo-before-change - Cancelable, before it toggles (`{ value }`).
 * @fires {CustomEvent<CamoExpandedDetail>} camo-expanded-change - It toggled.
 */
export class CamoAccordion extends LitElement {
  static override properties: PropertyDeclarations = {
    title: { type: String },
    subtitle: { type: String },
    expanded: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  static override styles: CSSResult = css``;

  declare title: string;
  declare subtitle: string | null;
  declare expanded: boolean;
  declare disabled: boolean;

  readonly #cx: CamouflageController = new CamouflageController(this);
  #stripping = false;

  constructor() {
    super();
    this.title = "";
    this.subtitle = null;
    this.expanded = false;
    this.disabled = false;
  }

  /** A `title` attribute would also show the browser's tooltip over the whole section, so it is read and removed. */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (name === "title" && value === null && this.#stripping) return;
    super.attributeChangedCallback(name, old, value);
    if (name === "title" && value !== null && !isServer) {
      this.#stripping = true;
      this.removeAttribute("title");
      this.#stripping = false;
    }
  }

  /** Toggles, if the app lets it. */
  toggle(): void {
    if (this.disabled) return;
    const next = !this.expanded;
    const go = this.dispatchEvent(
      new CustomEvent("camo-before-change", {
        detail: { value: next },
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
    if (!go) return;
    this.expanded = next;
    this.dispatchEvent(
      new CustomEvent<CamoExpandedDetail>("camo-expanded-change", {
        detail: { expanded: next },
        bubbles: true,
        composed: true,
      }),
    );
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`<slot></slot>`;
    const renderer = skin.accordion;
    const state: AccordionState = {
      title: this.title,
      subtitle: this.subtitle === "" ? null : this.subtitle,
      expanded: this.expanded,
      disabled: this.disabled,
      actions: { toggle: () => this.toggle() },
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

/**
 * `<camo-accordion-group single-expand>`: the accordions inside, with the one-open-at-a-time rule. With `single-expand`,
 * opening one closes the others (an FAQ). The header buttons are one group for arrow-key navigation: Up and Down move
 * between headers, Home and End jump to the first and last.
 *
 * @tagname camo-accordion-group
 * @slot - The `camo-accordion`s.
 * @attr {boolean} single-expand - Opening one accordion closes the others.
 */
export class CamoAccordionGroup extends LitElement {
  static override properties: PropertyDeclarations = {
    singleExpand: { type: Boolean, attribute: "single-expand", reflect: true },
  };

  declare singleExpand: boolean;

  constructor() {
    super();
    this.singleExpand = false;
    this.addEventListener("camo-expanded-change", this.#onChange as EventListener);
    this.addEventListener("keydown", this.#onKey);
  }

  #items(): CamoAccordion[] {
    return [...this.querySelectorAll<CamoAccordion>("camo-accordion")];
  }

  readonly #onChange = (event: CustomEvent<CamoExpandedDetail>): void => {
    if (!this.singleExpand || !event.detail.expanded) return;
    for (const item of this.#items()) if (item !== event.target) item.expanded = false;
  };

  // The headers are inside each accordion's shadow root: move between them with the arrow keys.
  readonly #onKey = (event: KeyboardEvent): void => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const heads = this.#items()
      .map((a) => a.shadowRoot?.querySelector<HTMLElement>(".head"))
      .filter((h): h is HTMLElement => h !== undefined && h !== null);
    const at = heads.findIndex(
      (h) => h.getRootNode() === (event.composedPath()[0] as Node).getRootNode(),
    );
    if (at < 0) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? heads.length - 1
          : (at + (event.key === "ArrowDown" ? 1 : -1) + heads.length) % heads.length;
    heads[next]?.focus();
  };

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
