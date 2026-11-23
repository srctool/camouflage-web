import { css, html, nothing } from "lit";
import type { CSSResult, PropertyDeclarations, TemplateResult } from "lit";
import { CamouflageController } from "../controller.ts";
import type { SearchFieldState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";
import { CamoTextInput } from "./text-input.ts";

const SLOTS = { leading: "leading", trailing: "trailing" } as const;

/** What `camo-search` carries. */
export interface CamoSearchDetail {
  query: string;
}

/**
 * `<camo-search-field placeholder="Search" clear-label="Clear search"></camo-search-field>`
 *
 * The text-input engine drawn as a search bar: a leading icon (the skin's magnifier unless you slot your own), the
 * query, an automatic clear button while it is not empty, and a trailing slot. Enter fires `camo-search`; debouncing
 * is the app's. The name is the placeholder ("Search"), as the base note says.
 *
 * @tagname camo-search-field
 * @slot leading - Replaces the magnifier (a back action when the search is active).
 * @slot trailing - A microphone, an avatar.
 * @attr {string} value - The query.
 * @attr {string} placeholder - Hint text and the accessible name; "Search" by default.
 * @attr {string} clear-label - The clear button's name; "Clear search" by default.
 * @attr {boolean} disabled - Blocks editing and focus (the contract's `enabled`, inverted).
 * @attr {string} name - The name the value is submitted under.
 * @fires {CustomEvent<{query: string}>} camo-search - Enter was pressed.
 * @fires {CustomEvent<CamoBeforeChangeDetail>} camo-before-change - Cancelable, before the query changes.
 * @fires input - The query changed while the user is typing.
 */
export class CamoSearchField extends CamoTextInput {
  static override properties: PropertyDeclarations = {
    clearLabel: { type: String, attribute: "clear-label" },
  };

  static override styles: CSSResult = css`
    :host {
      display: inline-block;
    }
    .camo-clear {
      all: unset;
      box-sizing: border-box;
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: calc(var(--s-icon-size, 20px) + var(--camo-spacing-s));
      block-size: calc(var(--s-icon-size, 20px) + var(--camo-spacing-s));
      border-radius: 50%;
      cursor: pointer;
      color: var(--camo-color-on-surface-variant);
    }
    .camo-clear:focus-visible {
      outline: 2px solid var(--camo-color-primary);
    }
    .camo-clear::before,
    .camo-clear::after {
      content: "";
      position: absolute;
      inline-size: 12px;
      block-size: 2px;
      border-radius: 1px;
      background: currentColor;
      rotate: 45deg;
    }
    .camo-clear::after {
      rotate: -45deg;
    }
  `;

  declare clearLabel: string;

  readonly #cx: CamouflageController = new CamouflageController(this);

  constructor() {
    super();
    this.placeholder = "Search";
    this.clearLabel = "Clear search";
    this.autocomplete = "off";
  }

  protected override inputType(): string {
    return "search";
  }
  protected override keyHint(): string {
    return "search";
  }
  protected override accessibleName(): string | null {
    return this.placeholder;
  }
  protected override submitted(): void {
    this.dispatchEvent(
      new CustomEvent<CamoSearchDetail>("camo-search", {
        detail: { query: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #clear(): void {
    if (this.value === "" || !this.beforeChange("")) return;
    this.value = "";
    this.fireInput();
    this.fireChange();
    this.focus();
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`${this.renderInput()}`;
    const renderer = skin.searchField;
    const state: SearchFieldState = {
      disabled: this.isDisabled,
      focused: this.focused,
      isEmpty: this.value === "",
    };
    const clear =
      this.value === "" || this.isDisabled
        ? nothing
        : html`<button
            class="camo-clear"
            type="button"
            aria-label=${this.clearLabel}
            @click=${(): void => this.#clear()}
          ></button>`;
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: SLOTS,
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
      nodes: { input: this.renderInput(), clear },
    })}`;
  }
}
