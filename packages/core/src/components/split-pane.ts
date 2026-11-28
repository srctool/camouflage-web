import { LitElement, css, html, isServer, nothing } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { collapsePane, normalizeSizes, resizeSizes, restorePane } from "../behavior/split.ts";
import type { PaneLimits } from "../behavior/split.ts";
import { CamouflageController } from "../controller.ts";
import type { SplitAxis, SplitDividerState } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

/** What `camo-resize` carries: the panes' shares and which are shut. Plain data, for the app to save. */
export interface CamoResizeDetail {
  fractions: number[];
  collapsed: number[];
}

const MIN_SIZE = 80;

/**
 * `<camo-pane size="0.25" min-size="160" collapsible>…</camo-pane>`
 *
 * One pane of a `camo-split-pane`, with the divider after it. `size` is its share of the split (the shares of all
 * panes sum to 1); give it to every pane or to none, and a server draws the split without measuring.
 *
 * @tagname camo-pane
 * @slot - The pane's content, which scrolls inside the pane.
 * @attr {number} size - The pane's share of the split, 0 to 1.
 * @attr {number} min-size - The smallest the divider takes it, in pixels (80).
 * @attr {number} max-size - The largest, in pixels.
 * @attr {boolean} collapsible - Dragging it under half its minimum, or Enter on a divider beside it, shuts it.
 * @attr {string} label - The name of the divider after it ("Resize panel").
 */
export class CamoPane extends LitElement {
  static override properties: PropertyDeclarations = {
    size: { type: Number, reflect: true },
    minSize: { type: Number, attribute: "min-size" },
    maxSize: { type: Number, attribute: "max-size" },
    collapsible: { type: Boolean, reflect: true },
    label: { type: String },
    dragging: { state: true },
    scrolls: { state: true },
  };

  static override styles: CSSResult = css`
    :host {
      display: flex;
      flex-direction: var(--camo-split-flow, row);
      flex-shrink: 1;
      flex-basis: 0;
      min-inline-size: 0;
      min-block-size: 0;
    }
    .content {
      flex: 1 1 0;
      min-inline-size: 0;
      min-block-size: 0;
      overflow: auto;
    }
    .content.shut {
      display: none;
    }
    .divider {
      flex: 0 0 var(--sd-thickness);
      position: relative;
      z-index: 1;
      cursor: var(--camo-split-cursor, col-resize);
      touch-action: none;
      outline: none;
      --sd-hit: var(--sd-hit-size);
      --sd-spill: calc((var(--sd-thickness) - var(--sd-hit)) / 2);
    }
    @media (pointer: coarse) {
      .divider {
        --sd-hit: max(var(--sd-hit-size), 24px);
      }
    }
    /* The grab area, wider than the line, across the flow. */
    .divider::before {
      content: "";
      position: absolute;
      z-index: 1;
      inset-inline: calc(var(--camo-split-row, 1) * var(--sd-spill));
      inset-block: calc((1 - var(--camo-split-row, 1)) * var(--sd-spill));
    }
    .divider:focus-visible {
      outline: 2px solid var(--sd-focus);
      outline-offset: 1px;
    }
    :host(:last-child) .divider {
      display: none;
    }
  `;

  declare size: number | null;
  declare minSize: number;
  declare maxSize: number | null;
  declare collapsible: boolean;
  declare label: string;
  declare dragging: boolean;
  // The content is longer than the pane, so it takes focus and a keyboard can scroll it.
  declare scrolls: boolean;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  // The size the first render had: the server draws it, and later sizes are written on the host.
  #drawn: number | null | undefined;
  #observer: ResizeObserver | undefined;

  constructor() {
    super();
    this.size = null;
    this.minSize = MIN_SIZE;
    this.maxSize = null;
    this.collapsible = false;
    this.label = "Resize panel";
    this.dragging = false;
    this.scrolls = false;
  }

  readonly #measure = (): void => {
    const content = this.renderRoot.querySelector<HTMLElement>(".content");
    if (content === null) return;
    this.scrolls =
      content.scrollHeight - content.clientHeight > 1 ||
      content.scrollWidth - content.clientWidth > 1;
  };

  override connectedCallback(): void {
    super.connectedCallback();
    if (isServer || typeof ResizeObserver === "undefined") return;
    this.#observer = new ResizeObserver(this.#measure);
    this.#observer.observe(this);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#observer?.disconnect();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, { role: "group" });
  }

  override updated(): void {
    // After the first render the share lives on the host, so a drag does not make a new stylesheet each move.
    if (this.size !== this.#drawn) this.style.flexGrow = String(this.size ?? 1);
    else this.style.removeProperty("flex-grow");
  }

  get #split(): CamoSplitPane | null {
    return this.parentElement instanceof CamoSplitPane ? this.parentElement : null;
  }

  override render(): TemplateResult {
    if (this.#drawn === undefined) this.#drawn = this.size;
    const skin = this.#cx.skin;
    const content = html`<div
      class="content ${this.size === 0 ? "shut" : ""}"
      part="content"
      tabindex=${this.scrolls ? "0" : nothing}
    >
      <slot @slotchange=${this.#measure}></slot>
    </div>`;
    const grow = cssBlock(`:host { flex-grow: ${this.#drawn ?? 1}; }`);
    if (skin === undefined) return html`${grow}${content}`;
    const renderer = skin.splitPane;
    const style = renderer.defaults(tokens);
    const siblings = this.#split?.panes ?? [];
    const after = siblings[siblings.indexOf(this) + 1];
    const state: SplitDividerState = {
      dragging: this.dragging,
      collapsedBefore: this.size === 0,
      collapsedAfter: after?.size === 0,
    };
    const percent = this.size === null ? 50 : Math.round(this.size * 100);
    return html`${grow}${cssBlock(renderer.styles)}${content}
      <div
        class="divider"
        part="divider"
        role="separator"
        tabindex="0"
        aria-label=${this.label}
        aria-orientation=${!isServer && this.#split?.axis === "vertical" ? "horizontal" : "vertical"}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${percent}
        aria-valuetext="${percent} percent"
        style="--sd-thickness: ${style.thickness}; --sd-hit-size: ${style.hitSize}; --sd-focus: ${style.focus}; --sd-key: ${style.keyStep}; --sd-key-large: ${style.keyStepLarge}"
        @pointerdown=${(e: PointerEvent) => this.#split?.startDrag(this, e)}
        @keydown=${(e: KeyboardEvent) => this.#split?.onDividerKey(this, e)}
        @dblclick=${() => this.#split?.resetPair(this)}
      >
        ${renderer.render({ state, slots: {}, theme: tokens, style, skin })}
      </div>`;
  }
}

/**
 * `<camo-split-pane axis="horizontal"><camo-pane size="0.3">list</camo-pane><camo-pane size="0.7">detail</camo-pane></camo-split-pane>`
 *
 * Two or more panes side by side or stacked, with a divider the user can drag. A divider moves space between its two
 * neighbours only, within both panes' `min-size` and `max-size`. Arrow keys move it (Shift for a larger step), Home
 * and End go to the minimum and maximum, Enter shuts or restores a collapsible neighbour, a double click puts the two
 * panes back as they began. `fractions` reads and writes the sizes, so an app can save and restore them; nest splits
 * by putting one inside a pane. Give a vertical split a height.
 *
 * @tagname camo-split-pane
 * @slot - The `camo-pane`s.
 * @attr {"horizontal"|"vertical"} axis - `horizontal` (the default) puts the panes side by side.
 * @attr {string} fractions - The sizes as a JSON array of shares, the same as the property.
 * @fires camo-resize - The user moved a divider: `{ fractions, collapsed }`.
 */
export class CamoSplitPane extends LitElement {
  static override properties: PropertyDeclarations = {
    axis: { type: String, reflect: true },
    fractions: { type: Array },
  };

  static override styles: CSSResult = css`
    :host {
      display: flex;
      flex-direction: row;
      inline-size: 100%;
      block-size: 100%;
      min-inline-size: 0;
      min-block-size: 0;
      --camo-split-flow: row;
      --camo-split-row: 1;
      --camo-split-cursor: col-resize;
    }
    :host([axis="vertical"]) {
      flex-direction: column;
      --camo-split-flow: column;
      --camo-split-row: 0;
      --camo-split-cursor: row-resize;
    }
    slot {
      display: contents;
    }
  `;

  declare axis: SplitAxis;

  readonly #internals: ElementInternals = this.attachInternals();
  #given: number[] | null = null;
  #initial: number[] | null = null;
  readonly #remembered = new WeakMap<CamoPane, number>();
  #resizer: ResizeObserver | undefined;

  constructor() {
    super();
    this.axis = "horizontal";
  }

  /** The panes, in order. */
  get panes(): CamoPane[] {
    return [...this.children].filter((c): c is CamoPane => c instanceof CamoPane);
  }

  /** The panes' shares of the split, summing to 1. Setting them restores a saved layout. */
  get fractions(): number[] {
    return normalizeSizes(this.panes.map((p) => p.size ?? 1 / this.panes.length));
  }

  set fractions(value: number[] | null) {
    this.#given = value;
    this.#apply();
  }

  /** Shuts pane `index`, giving its space to its neighbour. */
  collapse(index: number): void {
    const sizes = this.fractions;
    const pane = this.panes[index];
    if (pane === undefined || sizes[index] === 0) return;
    this.#remembered.set(pane, sizes[index]!);
    this.#write(collapsePane(sizes, index));
  }

  /** Opens a shut pane to what it had. */
  restore(index: number): void {
    const pane = this.panes[index];
    if (pane === undefined || this.fractions[index] !== 0) return;
    const had = this.#remembered.get(pane) ?? 1 / this.panes.length;
    this.#write(restorePane(this.fractions, index, had));
  }

  /** Puts every pane back as it began. */
  reset(): void {
    if (this.#initial !== null) this.#write(this.#initial);
  }

  /** What an app saves to come back to this layout. */
  snapshot(): CamoResizeDetail {
    const fractions = this.fractions;
    return { fractions, collapsed: fractions.flatMap((f, i) => (f === 0 ? [i] : [])) };
  }

  #apply(): void {
    const panes = this.panes;
    if (this.#given === null || this.#given.length !== panes.length) return;
    this.#write(normalizeSizes(this.#given));
  }

  #write(sizes: number[]): void {
    this.panes.forEach((pane, i) => {
      pane.size = Math.round(sizes[i]! * 10_000) / 10_000;
    });
    // A pane's divider says whether the next one is shut.
    for (const pane of this.panes) pane.requestUpdate();
  }

  #announce(): void {
    this.dispatchEvent(
      new CustomEvent<CamoResizeDetail>("camo-resize", {
        detail: this.snapshot(),
        bubbles: true,
        composed: true,
      }),
    );
  }

  get #stacked(): boolean {
    return this.axis === "vertical";
  }

  // The length the shares are of: the split's, less its dividers.
  #length(): number {
    const box = this.getBoundingClientRect();
    const dividers = this.panes.reduce((sum, pane) => {
      const divider = pane.renderRoot.querySelector<HTMLElement>(".divider");
      const size = divider?.getBoundingClientRect();
      return sum + (size === undefined ? 0 : this.#stacked ? size.height : size.width);
    }, 0);
    return Math.max((this.#stacked ? box.height : box.width) - dividers, 1);
  }

  #limits(length: number): PaneLimits[] {
    return this.panes.map((pane) => ({
      min: Math.min(pane.minSize / length, 1),
      max: pane.maxSize === null ? 1 : Math.min(pane.maxSize / length, 1),
      collapsible: pane.collapsible,
    }));
  }

  // Moves the divider after `pane` by `delta` pixels.
  #move(index: number, delta: number, from: number[] = this.fractions, snap = true): void {
    const length = this.#length();
    const limits = this.#limits(length).map((l) => (snap ? l : { ...l, collapsible: false }));
    const before = this.fractions;
    const next = resizeSizes(from, limits, index, delta / length);
    next.forEach((size, i) => {
      if (size === 0 && before[i]! > 0) this.#remembered.set(this.panes[i]!, before[i]!);
    });
    this.#write(next);
  }

  /** A press on the divider after `pane`: it follows the pointer until released. */
  startDrag(pane: CamoPane, event: PointerEvent): void {
    if (event.button !== 0) return;
    event.preventDefault();
    const index = this.panes.indexOf(pane);
    const target = event.currentTarget as HTMLElement;
    const from = this.fractions;
    const origin = this.#stacked ? event.clientY : event.clientX;
    const sign = !this.#stacked && getComputedStyle(this).direction === "rtl" ? -1 : 1;
    target.focus({ preventScroll: true });
    try {
      target.setPointerCapture(event.pointerId);
    } catch {
      // A synthetic event has no active pointer.
    }
    pane.dragging = true;
    const move = (e: PointerEvent): void =>
      this.#move(index, sign * ((this.#stacked ? e.clientY : e.clientX) - origin), from);
    const end = (): void => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", end);
      target.removeEventListener("pointercancel", end);
      pane.dragging = false;
      this.#announce();
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", end);
    target.addEventListener("pointercancel", end);
  }

  /** A key on the divider after `pane`. */
  onDividerKey(pane: CamoPane, event: KeyboardEvent): void {
    const index = this.panes.indexOf(pane);
    const style = getComputedStyle(event.currentTarget as HTMLElement);
    const step = Number.parseFloat(
      style.getPropertyValue(event.shiftKey ? "--sd-key-large" : "--sd-key"),
    );
    const rtl = !this.#stacked && getComputedStyle(this).direction === "rtl";
    const [less, more] = this.#stacked
      ? ["ArrowUp", "ArrowDown"]
      : rtl
        ? ["ArrowRight", "ArrowLeft"]
        : ["ArrowLeft", "ArrowRight"];
    const length = this.#length();
    if (event.key === less) this.#move(index, -step, undefined, false);
    else if (event.key === more) this.#move(index, step, undefined, false);
    else if (event.key === "Home") this.#move(index, -length, undefined, false);
    else if (event.key === "End") this.#move(index, length, undefined, false);
    else if (event.key === "Enter") this.#toggle(index);
    else return;
    event.preventDefault();
    this.#announce();
  }

  // Enter: shut the collapsible neighbour of the divider, or open the one that is shut.
  #toggle(divider: number): void {
    const pair = [divider, divider + 1];
    const shut = pair.find((i) => this.fractions[i] === 0);
    if (shut !== undefined) return this.restore(shut);
    const open = pair.find((i) => this.panes[i]?.collapsible === true);
    if (open === undefined) return;
    const sizes = this.fractions;
    this.#remembered.set(this.panes[open]!, sizes[open]!);
    const next = [...sizes];
    const other = open === divider ? divider + 1 : divider;
    next[other] = next[other]! + next[open]!;
    next[open] = 0;
    this.#write(next);
  }

  /** A double click: the two panes beside the divider go back to how they began, within what they have together. */
  resetPair(pane: CamoPane): void {
    const i = this.panes.indexOf(pane);
    const began = this.#initial;
    if (began === null) return;
    const sizes = this.fractions;
    const pair = sizes[i]! + sizes[i + 1]!;
    sizes[i] = (pair * began[i]!) / (began[i]! + began[i + 1]! || 1);
    sizes[i + 1] = pair - sizes[i];
    this.#write(sizes);
    this.#announce();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (isServer || typeof ResizeObserver === "undefined") return;
    // The shares are kept when the split changes size; then each pane is held within its limits.
    this.#resizer = new ResizeObserver(() => {
      if (!this.hasUpdated) return;
      // A shut pane stays shut: only open neighbours are held to their limits.
      for (let i = 0; i < this.panes.length - 1; i++) {
        const sizes = this.fractions;
        if (sizes[i] !== 0 && sizes[i + 1] !== 0) this.#move(i, 0, undefined, false);
      }
    });
    this.#resizer.observe(this);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#resizer?.disconnect();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, { role: "group" });
  }

  readonly #onSlot = (): void => {
    this.#apply();
    this.#initial = this.fractions;
    this.#write(this.#initial);
  };

  override render(): TemplateResult {
    return html`<slot @slotchange=${this.#onSlot}></slot>`;
  }

  override firstUpdated(): void {
    if (this.panes.length > 0) this.#onSlot();
  }
}
