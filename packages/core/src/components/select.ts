import { themedScrollbar } from "../style.ts";
import { LitElement, css, html, isServer, nothing } from "lit";
import type {
  CSSResult,
  CSSResultGroup,
  PropertyDeclarations,
  PropertyValues,
  TemplateResult,
} from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { ControlValue } from "../behavior/control.ts";
import { CamoPickerField } from "./picker-field.ts";

const CHEVRON = "M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z";

/** One choice of a select. */
export interface SelectOption {
  value: string;
  label: string;
  /** A second line under the label. */
  supporting?: string;
  disabled?: boolean;
}

/**
 * `<camo-option value="id" label="Indonesia" supporting="+62">`: one choice, declared as a child of a `camo-select`. It
 * draws nothing itself.
 *
 * @tagname camo-option
 * @attr {string} value - What the select's value becomes.
 * @attr {string} label - The text.
 * @attr {string} supporting - A second line.
 * @attr {boolean} disabled - Cannot be chosen (the contract's `enabled`, inverted).
 */
export class CamoOption extends LitElement {
  static override properties: PropertyDeclarations = {
    value: { type: String },
    label: { type: String },
    supporting: { type: String },
    disabled: { type: Boolean, reflect: true },
  };
  static override styles: CSSResult = css`
    :host {
      display: none;
    }
  `;
  declare value: string;
  declare label: string;
  declare supporting: string | null;
  declare disabled: boolean;
  constructor() {
    super();
    this.value = "";
    this.label = "";
    this.supporting = null;
    this.disabled = false;
  }
  override render(): TemplateResult {
    return html``;
  }
}

/** What `camo-query` carries. */
export interface CamoQueryDetail {
  query: string;
}

/**
 * `<camo-select name="country" label="Country" value="id"><camo-option value="id" label="Indonesia"></camo-option>…</camo-select>`
 *
 * A field that opens a list of options. On a wide window the list is a menu under the field (as wide as the field); on a
 * compact window, or for a long list, a sheet from the bottom (`presentation`). The options are `camo-option` children, or
 * the `options` property (a list of `{ value, label, supporting, disabled }`); `searchable` adds a search field, and the
 * async form is the same element: set `options` as pages arrive, `loading` while a request runs, and listen for `camo-open`
 * (load the first page), `camo-query` (debounced, for the search), `camo-load-more` and `camo-retry`; `selected-label` names
 * the current value before its option has loaded. The field announces itself as a pop-up button. Enter, Space and Down
 * open it; in the list Up and Down, Home and End move, typing jumps to a matching option, Enter chooses, Escape closes
 * without changing. Form-associated.
 *
 * @tagname camo-select
 * @slot - The `camo-option`s.
 * @attr {string} value - The chosen option's value.
 * @attr {string} label - The field's label.
 * @attr {string} placeholder - Hint text while nothing is chosen.
 * @attr {string} supporting-text - Helper text below the field.
 * @attr {string} error - A message: the field is in the error state, and invalid to its form.
 * @attr {"auto"|"menu"|"sheet"} presentation - A menu under the field, a sheet from the bottom, or by window width and option count.
 * @attr {boolean} searchable - A search field at the top of the list.
 * @attr {string} selected-label - The text for the current value while its option is not loaded.
 * @attr {boolean} loading - Options are being loaded: shows a loading row.
 * @attr {number} search-debounce - How long `camo-query` waits after typing, in ms; 500 by default.
 * @attr {number} auto-menu-max-options - The longest list `auto` shows as a menu; 7 by default.
 * @attr {boolean} disabled - Blocks use and focus (the contract's `enabled`, inverted).
 * @attr {boolean} required - Invalid to its form until an option is chosen.
 * @attr {string} name - The name the value is submitted under.
 * @fires camo-open - The list opened (load the first page now).
 * @fires {CustomEvent<CamoQueryDetail>} camo-query - The search text changed, after the debounce.
 * @fires camo-load-more - The user reached the end of the loaded options.
 * @fires {CustomEvent<CamoBeforeChangeDetail>} camo-before-change - Cancelable, before the value changes.
 */
export class CamoSelect extends CamoPickerField {
  static override properties: PropertyDeclarations = {
    value: { type: String },
    options: { attribute: false },
    searchable: { type: Boolean },
    selectedLabel: { type: String, attribute: "selected-label" },
    loading: { type: Boolean },
    searchDebounce: { type: Number, attribute: "search-debounce" },
    autoMenuMaxOptions: { type: Number, attribute: "auto-menu-max-options" },
    query: { state: true },
    found: { state: true },
  };

  static override styles: CSSResultGroup = [
    CamoPickerField.styles,
    themedScrollbar(".panel"),
    css`
      .panel {
        align-items: stretch;
        padding: var(--camo-spacing-s);
        gap: var(--camo-spacing-s);
        max-block-size: min(60vh, 24rem);
        overflow: auto;
        box-sizing: border-box;
      }
      .q {
        box-sizing: border-box;
        inline-size: 100%;
        padding: var(--camo-spacing-s) var(--camo-spacing-m);
        border: 1px solid var(--camo-color-outline);
        border-radius: var(--camo-shape-medium);
        background: var(--camo-color-surface);
        color: var(--camo-color-on-surface);
        font: inherit;
      }
      .list {
        display: flex;
        flex-direction: column;
        outline: none;
      }
      .opt {
        display: block;
        border-radius: var(--camo-shape-small);
        cursor: pointer;
        outline: none;
      }
      .opt[aria-disabled="true"] {
        cursor: default;
        opacity: 0.38;
      }
      .opt:focus-visible {
        outline: 2px solid var(--camo-color-primary);
        outline-offset: -2px;
      }
      .opt .tick {
        inline-size: 20px;
        block-size: 20px;
        fill: var(--camo-color-primary);
      }
      .note {
        padding: var(--camo-spacing-m);
        color: var(--camo-color-on-surface-variant);
        text-align: center;
      }
      .retry {
        all: unset;
        cursor: pointer;
        color: var(--camo-color-primary);
        padding: var(--camo-spacing-s) var(--camo-spacing-m);
      }
    `,
  ];

  declare value: string;
  /** The options; a property, since it is a list. Replaces the `camo-option` children when set. */
  declare options: readonly SelectOption[] | null;
  declare searchable: boolean;
  declare selectedLabel: string | null;
  declare loading: boolean;
  declare searchDebounce: number;
  declare autoMenuMaxOptions: number;
  declare protected query: string;
  declare protected found: readonly SelectOption[];

  #defaultValue = "";
  #debounce: ReturnType<typeof setTimeout> | undefined;
  #typed = "";
  #typedAt = 0;
  #observer: MutationObserver | undefined;
  #end: IntersectionObserver | undefined;
  #armed = true;

  constructor() {
    super();
    this.value = "";
    this.options = null;
    this.searchable = false;
    this.selectedLabel = null;
    this.loading = false;
    this.searchDebounce = 500;
    this.autoMenuMaxOptions = 7;
    this.query = "";
    this.found = [];
    this.presentation = "auto";
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // A server has no light DOM to read: `selected-label` names the value there, and the options appear on hydration.
    if (isServer) return;
    this.#readOptions();
    this.#observer = new MutationObserver(() => this.#readOptions());
    this.#observer.observe(this, { childList: true, subtree: true, attributes: true });
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated();
    if (changed.has("options")) this.#armed = true;
    // `camo-load-more` once when the end of the loaded options scrolls into view, again after `options` changes.
    this.#end?.disconnect();
    const sentinel = this.shadowRoot?.querySelector(".sentinel");
    if (sentinel === null || sentinel === undefined || typeof IntersectionObserver === "undefined")
      return;
    this.#end ??= new IntersectionObserver((entries) => {
      if (this.#armed && !this.loading && entries.some((e) => e.isIntersecting)) {
        this.#armed = false;
        this.dispatchEvent(new Event("camo-load-more", { bubbles: true, composed: true }));
      }
    });
    this.#end.observe(sentinel);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#end?.disconnect();
    this.#observer?.disconnect();
    clearTimeout(this.#debounce);
  }

  #readOptions(): void {
    this.found = [...this.querySelectorAll<CamoOption>("camo-option")].map((o) => ({
      value: o.value,
      label: o.label,
      ...(o.supporting === null || o.supporting === "" ? {} : { supporting: o.supporting }),
      disabled: o.disabled,
    }));
  }

  get #all(): readonly SelectOption[] {
    return this.options ?? this.found;
  }

  /** The options the list shows: all of them, or, for options the select owns, those matching the search text. */
  get #shown(): readonly SelectOption[] {
    const q = this.query.trim().toLowerCase();
    // With an `options` list the app answers `camo-query` itself; with `camo-option` children the select filters.
    if (!this.searchable || q === "" || this.options !== null) return this.#all;
    return this.#all.filter((o) => o.label.toLowerCase().includes(q));
  }

  protected override usesSheet(): boolean {
    const p = this.presentation as string;
    if (p === "sheet") return true;
    if (p === "menu" || p === "popup") return false;
    return (
      this.cx.environment.windowSize === "compact" || this.#all.length > this.autoMenuMaxOptions
    );
  }
  protected override matchesFieldWidth(): boolean {
    return true;
  }

  protected override displayText(): string {
    const match = this.#all.find((o) => o.value === this.value);
    return match?.label ?? (this.value === "" ? "" : (this.selectedLabel ?? ""));
  }
  protected override panelLabel(): string {
    return this.label ?? "Options";
  }
  protected override iconPath(): string {
    return CHEVRON;
  }
  protected override formValue(): ControlValue {
    return this.value === "" ? null : this.value;
  }
  protected override isEmpty(): boolean {
    return this.value === "";
  }
  protected override captureDefault(): void {
    this.#defaultValue = this.value;
  }
  protected override resetToDefault(): void {
    this.value = this.#defaultValue;
  }
  protected override openDraft(): void {
    this.query = "";
    this.dispatchEvent(new Event("camo-open", { bubbles: true, composed: true }));
  }

  #choose(option: SelectOption): void {
    if (option.disabled === true) return;
    if (option.value !== this.value) {
      if (!this.beforeChange(option.value)) return;
      this.value = option.value;
      this.fireInput();
      this.fireChange();
    }
    this.hide();
  }

  #onQuery(event: Event): void {
    this.query = (event.target as HTMLInputElement).value;
    clearTimeout(this.#debounce);
    this.#debounce = setTimeout(() => {
      this.dispatchEvent(
        new CustomEvent<CamoQueryDetail>("camo-query", {
          detail: { query: this.query },
          bubbles: true,
          composed: true,
        }),
      );
    }, this.searchDebounce);
  }

  #optionEls(): HTMLElement[] {
    return [...this.shadowRoot!.querySelectorAll<HTMLElement>('.opt:not([aria-disabled="true"])')];
  }

  #onKey(event: KeyboardEvent): void {
    const els = this.#optionEls();
    const at = els.indexOf(event.composedPath()[0] as HTMLElement);
    let next: HTMLElement | undefined;
    switch (event.key) {
      case "ArrowDown":
        next = els[Math.min(at + 1, els.length - 1)];
        break;
      case "ArrowUp":
        if (at <= 0 && this.searchable) {
          event.preventDefault();
          this.shadowRoot!.querySelector<HTMLElement>(".q")?.focus();
          return;
        }
        next = els[Math.max(at - 1, 0)];
        break;
      case "Home":
        if ((event.composedPath()[0] as HTMLElement).classList.contains("q")) return;
        next = els[0];
        break;
      case "End":
        if ((event.composedPath()[0] as HTMLElement).classList.contains("q")) return;
        next = els.at(-1);
        break;
      default:
        if (
          event.key.length === 1 &&
          !this.searchable &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          const now = performance.now();
          this.#typed =
            now - this.#typedAt > 700
              ? event.key.toLowerCase()
              : this.#typed + event.key.toLowerCase();
          this.#typedAt = now;
          next = els.find((e) => (e.dataset["label"] ?? "").toLowerCase().startsWith(this.#typed));
          if (next === undefined) return;
        } else return;
    }
    event.preventDefault();
    next?.focus();
  }

  protected override renderPanel(): TemplateResult {
    const options = this.#shown;
    const note = this.loading
      ? html`<div class="note" role="status">…</div>`
      : options.length === 0
        ? html`<div class="note">—</div>`
        : nothing;
    return html`<div @keydown=${(e: KeyboardEvent) => this.#onKey(e)} style="display: contents">
      ${
        this.searchable
          ? html`<input
            class="q"
            type="search"
            role="searchbox"
            aria-label="Search"
            .value=${this.query}
            @input=${(e: Event) => this.#onQuery(e)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                this.#optionEls()[0]?.focus();
              }
            }}
          />`
          : nothing
      }
      <div class="list" role="listbox" aria-label=${this.panelLabel()}>
        ${repeat(
          options,
          (o) => o.value,
          (o) => html`<div
            class="opt"
            role="option"
            tabindex=${o.value === this.value ? 0 : -1}
            aria-selected=${o.value === this.value ? "true" : "false"}
            aria-disabled=${o.disabled === true ? "true" : "false"}
            data-label=${o.label}
            @click=${() => this.#choose(o)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                this.#choose(o);
              }
            }}
          >
            <camo-list-item headline=${o.label} supporting=${o.supporting ?? ""} ?selected=${o.value === this.value}>
              ${
                o.value === this.value
                  ? html`<svg slot="trailing" class="tick" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>`
                  : nothing
              }
            </camo-list-item>
          </div>`,
        )}
        ${note}
      </div>
      <div class="sentinel" style="block-size: 1px"></div>
    </div>`;
  }
}
