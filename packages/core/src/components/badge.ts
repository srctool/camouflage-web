import { LitElement, css, html, isServer } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { CamouflageController } from "../controller.ts";
import type { Appearance, BadgeState, Tone } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const NO_SLOTS = {} as const;

const count = {
  fromAttribute(value: string | null): number | null {
    if (value === null || value.trim() === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  toAttribute(value: number | null): string | null {
    return value === null ? null : String(value);
  },
};

/**
 * `<camo-badge count="3">` or `<camo-badge>` (a dot)
 *
 * A small mark: a count ("3", "99+" above `max`) or, with no count, a dot for something new. A count of 0 (or less)
 * draws nothing. The tone defaults to the skin's attention family (error). On its own it is an image with a description;
 * inside a `camo-badged-box` it is hidden from assistive technology and its description joins the anchor's.
 *
 * @tagname camo-badge
 * @attr {number} count - The number to show; absent means a dot.
 * @attr {number} max - The largest number shown as itself; above it the badge says "99+".
 * @attr {"default"|"error"|"success"|"warning"|"info"} tone - Absent means the skin's default (`error`).
 * @attr {"solid"|"soft"|"raised"|"outline"|"ghost"|"link"} appearance - Absent means the skin's default (`solid`).
 * @attr {string} content-description - What a screen reader says ("3 unread messages"); absent is "3 new" or "New".
 */
export class CamoBadge extends LitElement {
  static override properties: PropertyDeclarations = {
    count: { converter: count, reflect: true },
    max: { type: Number },
    tone: { type: String, reflect: true },
    appearance: { type: String, reflect: true },
    contentDescription: { type: String, attribute: "content-description" },
  };

  static override styles: CSSResult = css`
    :host([data-empty]) {
      display: none;
    }
  `;

  declare count: number | null;
  declare max: number;
  declare tone: Tone | null;
  declare appearance: Appearance | null;
  declare contentDescription: string | null;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);

  constructor() {
    super();
    this.count = null;
    this.max = 99;
    this.tone = null;
    this.appearance = null;
    this.contentDescription = null;
  }

  /** Nothing to show: a count of 0 or less. */
  get empty(): boolean {
    return this.count !== null && this.count <= 0;
  }

  /** The text drawn, or null for a dot. */
  get text(): string | null {
    if (this.count === null) return null;
    return this.count > this.max ? `${this.max}+` : String(Math.floor(this.count));
  }

  /** What assistive technology is told: the app's description, else "3 new" or "New". */
  get description(): string {
    if (this.contentDescription !== null && this.contentDescription !== "")
      return this.contentDescription;
    return this.count === null
      ? "New"
      : `${Math.min(this.count, this.max)}${this.count > this.max ? "+" : ""} new`;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    this.toggleAttribute("data-empty", this.empty);
    const inBox = !isServer && this.closest("camo-badged-box") !== null;
    applyAria(this, this.#internals, {
      role: "img",
      label: this.description,
      hidden: this.empty || inBox,
    });
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`${this.text}`;
    const renderer = skin.badge;
    const style = renderer.defaults(tokens);
    const state: BadgeState = {
      text: this.text,
      tone: this.tone || style.defaultTone,
      appearance: this.appearance || style.defaultAppearance,
    };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: NO_SLOTS,
      theme: tokens,
      style,
      skin,
    })}`;
  }
}

/**
 * `<camo-badged-box><camo-icon-button label="Notifications">…</…><camo-badge slot="badge" count="3"></camo-badge></camo-badged-box>`
 *
 * Anchors a badge on the top-end corner of an icon, an icon button or an avatar (it mirrors in right-to-left). The badge's
 * description becomes the anchor's accessible description ("Notifications, 3 new"); the badge is never focusable and a
 * change of count is not announced.
 *
 * @tagname camo-badged-box
 * @slot - The anchor: an icon, an icon button, an avatar.
 * @slot badge - A `camo-badge`.
 */
export class CamoBadgedBox extends LitElement {
  static override styles: CSSResult = css`
    :host {
      position: relative;
      display: inline-flex;
      vertical-align: middle;
    }
    .b {
      position: absolute;
      inset-block-start: var(--camo-badge-offset, var(--camo-spacing-xs));
      inset-inline-end: var(--camo-badge-offset, var(--camo-spacing-xs));
      translate: 50% -50%;
      pointer-events: none;
      z-index: 1;
    }
    :host(:dir(rtl)) .b {
      translate: -50% -50%;
    }
    slot {
      display: contents;
    }
  `;

  override firstUpdated(): void {
    this.renderRoot.addEventListener("slotchange", () => this.#describe());
    this.#describe();
  }

  override updated(): void {
    this.#describe();
  }

  /** The anchor's description is the badge's, so a screen reader says "Notifications, 3 new". */
  #describe(): void {
    const badge = this.querySelector<HTMLElement & { description?: string; empty?: boolean }>(
      ":scope > [slot=badge]",
    );
    const anchor = [...this.children].find((c) => c.getAttribute("slot") !== "badge") as
      (HTMLElement & { ariaDescription: string | null }) | undefined;
    if (anchor === undefined) return;
    anchor.ariaDescription =
      badge === null || badge.empty === true ? null : (badge.description ?? null);
  }

  override render(): TemplateResult {
    return html`<slot></slot><span class="b"><slot name="badge"></slot></span>`;
  }
}
