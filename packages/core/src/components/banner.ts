import { LitElement, css, html, isServer, nothing } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { CamouflageController } from "../controller.ts";
import { toneIcon } from "../icons-tone.ts";
import { closeIcon } from "../skin/status.ts";
import type { Appearance, BannerState, Tone } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = { icon: "icon", actions: "actions" } as const;

/**
 * `<camo-banner tone="warning" title="Trial ends soon" message="3 days left." dismissible><camo-button slot="actions" appearance="ghost" text="Upgrade">…`
 *
 * An inline message that stays in the layout until it is resolved: a trial notice, a sync error, a form-level error
 * summary. The tone is carried by the colors, by the status icon and by the words, never by color alone. The icon is the
 * skin's for the tone (a brand registers `tone-info`, `tone-success`, `tone-warning` and `tone-error` icons to change
 * them); an element in the `icon` slot replaces it, and an empty one removes it. Actions are usually ghost buttons
 * (two at most). A banner that appears after the page loaded is announced: `status` for info and success, `alert` for
 * warning and error. `dismissible` adds a ✕ that fires `camo-dismiss`; the app removes the banner.
 *
 * @tagname camo-banner
 * @slot icon - Replaces the status icon.
 * @slot actions - Buttons, below the text.
 * @attr {string} message - The text.
 * @attr {string} title - A bold line above the message.
 * @attr {"default"|"error"|"success"|"warning"|"info"} tone - The colour family; `info` by default.
 * @attr {"solid"|"soft"|"raised"|"outline"|"ghost"|"link"} appearance - Absent means the skin's default (`soft`); solid and outline are the others.
 * @attr {boolean} dismissible - Shows a ✕ button (the contract's non-null `onDismiss`).
 * @fires camo-dismiss - The ✕ was pressed.
 */
export class CamoBanner extends LitElement {
  static override properties: PropertyDeclarations = {
    message: { type: String },
    title: { type: String },
    tone: { type: String, reflect: true },
    appearance: { type: String, reflect: true },
    dismissible: { type: Boolean, reflect: true },
  };

  static override styles: CSSResult = css``;

  declare message: string;
  declare title: string;
  declare tone: Tone;
  declare appearance: Appearance | null;
  declare dismissible: boolean;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  #stripping = false;

  constructor() {
    super();
    this.message = "";
    this.title = "";
    this.tone = "info";
    this.appearance = null;
    this.dismissible = false;
  }

  /** A `title` attribute would also show the browser's tooltip over the whole banner, so it is read and removed. */
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
    const alert = this.tone === "warning" || this.tone === "error";
    applyAria(this, this.#internals, {
      role: alert ? "alert" : "status",
      label: this.title === "" ? null : this.title,
    });
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined)
      return html`<strong>${this.title}</strong> ${this.message}<slot name="actions"></slot>`;
    const renderer = skin.banner;
    const style = renderer.defaults(tokens);
    const state: BannerState = {
      title: this.title === "" ? null : this.title,
      message: this.message,
      tone: this.tone,
      appearance: this.appearance || style.defaultAppearance,
      dismissible: this.dismissible,
      toneIcon: toneIcon(this.tone === "default" ? "info" : this.tone)!,
    };
    const dismiss = this.dismissible
      ? html`<button
          class="dismiss"
          type="button"
          part="dismiss"
          aria-label="Dismiss"
          @click=${(): boolean =>
            this.dispatchEvent(new CustomEvent("camo-dismiss", { bubbles: true, composed: true }))}
        >
          ${closeIcon}
        </button>`
      : undefined;
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: SLOTS,
      theme: tokens,
      style,
      skin,
      nodes: { dismiss: dismiss ?? nothing },
    })}`;
  }
}
