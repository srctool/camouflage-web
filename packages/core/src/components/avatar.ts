import { LitElement, css, html, nothing } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { CamouflageController } from "../controller.ts";
import type { AvatarShape, AvatarSize, AvatarState, Presence } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";
import { avatarColorSeed, avatarInitials } from "./avatar-name.ts";

const SLOTS = { image: "image" } as const;
const PRESENCE_WORDS: Record<Presence, string> = {
  online: "online",
  away: "away",
  busy: "busy",
  offline: "offline",
};

/**
 * `<camo-avatar name="Dwiki Riyadi" presence="online"><img slot="image" src="…" alt=""></camo-avatar>`
 *
 * A person or an entity as a photo, initials or an icon. The photo is yours: put your image element in the `image` slot
 * (core loads no images). Until it has loaded, and if it fails, the initials show ("Dwiki Riyadi" is "DR", on a color that
 * the name always picks); a missing name or one that does not start with a letter shows the person icon. The accessible
 * name is the name plus the presence ("Dwiki Riyadi, online"); with neither the avatar is decorative. Inside a
 * `camo-list-item`'s leading slot give it no name, so the row says the name once.
 *
 * @tagname camo-avatar
 * @slot image - Your image element.
 * @attr {string} name - Used for the initials, the color and the accessible name.
 * @attr {string} initials - Letters to show instead of the name's (a group's "+2").
 * @attr {"small"|"medium"|"large"} size - 24, 40 or 56 px in Material, set by the skin.
 * @attr {"circle"|"rounded"|"square"} shape - Absent means the skin's shape.
 * @attr {"online"|"away"|"busy"|"offline"} presence - A small status dot.
 */
export class CamoAvatar extends LitElement {
  static override properties: PropertyDeclarations = {
    name: { type: String },
    initials: { type: String },
    size: { type: String, reflect: true },
    shape: { type: String, reflect: true },
    presence: { type: String, reflect: true },
    loaded: { state: true },
  };

  static override styles: CSSResult = css``;

  declare name: string | null;
  declare initials: string | null;
  declare size: AvatarSize;
  declare shape: AvatarShape | null;
  declare presence: Presence | null;
  declare protected loaded: boolean;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  #watching: HTMLElement | null = null;

  constructor() {
    super();
    this.name = null;
    this.initials = null;
    this.size = "medium";
    this.shape = null;
    this.presence = null;
    this.loaded = false;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    const label = [this.name, this.presence === null ? null : PRESENCE_WORDS[this.presence]]
      .filter((x): x is string => x !== null && x !== "")
      .join(", ");
    applyAria(
      this,
      this.#internals,
      label === ""
        ? // An avatar with a plain "+2" says it; one with nothing to say is decorative.
          this.initials !== null && this.initials !== ""
          ? { role: "img", label: this.initials }
          : { role: "img", hidden: true }
        : { role: "img", label },
    );
  }

  override firstUpdated(): void {
    this.renderRoot.addEventListener("slotchange", () => this.#watch());
    this.#watch();
  }

  /** The initials show until the slotted image reports success. */
  #watch(): void {
    const image = this.querySelector<HTMLElement>(":scope > [slot=image]");
    if (this.#watching !== null && this.#watching !== image) {
      this.#watching.removeEventListener("load", this.#onLoad);
      this.#watching.removeEventListener("error", this.#onError);
    }
    this.#watching = image;
    if (image === null) {
      this.loaded = false;
      return;
    }
    if (image instanceof HTMLImageElement) {
      image.addEventListener("load", this.#onLoad);
      image.addEventListener("error", this.#onError);
      this.loaded = image.complete && image.naturalWidth > 0;
    } else {
      this.loaded = true; // another element is the app's own placeholder behavior
    }
  }

  readonly #onLoad = (): void => {
    this.loaded = true;
  };
  readonly #onError = (): void => {
    this.loaded = false;
  };

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined)
      return html`${this.initials ?? avatarInitials(this.name)}<slot name="image"></slot>`;
    const renderer = skin.avatar;
    const style = renderer.defaults(tokens);
    const derived = avatarInitials(this.name);
    const explicit = this.initials !== null && this.initials !== "";
    const state: AvatarState = {
      initials: explicit ? this.initials : derived,
      colorSeed: explicit || derived === null ? null : avatarColorSeed(this.name ?? ""),
      size: this.size,
      shape: this.shape || style.shape,
      presence: this.presence,
      imageLoaded: this.loaded,
    };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: SLOTS,
      theme: tokens,
      style,
      skin,
    })}`;
  }
}

/**
 * `<camo-avatar-group max="3" size="small"><camo-avatar name="Ada Lovelace"></…>…</camo-avatar-group>`
 *
 * An overlapping stack of avatars. Those past `max` are hidden (by CSS, so a server render hides them too) and a "+N"
 * avatar says how many. The "+N" needs the number of children, so it appears when the element hydrates. Right to left it
 * overlaps toward the other side.
 *
 * @tagname camo-avatar-group
 * @slot - The `camo-avatar`s.
 * @attr {number} max - How many show before "+N"; 3 by default.
 * @attr {"small"|"medium"|"large"} size - The size of the "+N" avatar (give the avatars the same).
 */
export class CamoAvatarGroup extends LitElement {
  static override properties: PropertyDeclarations = {
    max: { type: Number },
    size: { type: String, reflect: true },
    total: { state: true },
  };

  static override styles: CSSResult = css`
    :host {
      display: inline-flex;
      align-items: center;
      vertical-align: middle;
    }
    ::slotted(camo-avatar:not(:first-child)),
    camo-avatar.more {
      margin-inline-start: calc(var(--camo-avatar-group-overlap, var(--camo-spacing-s)) * -1);
    }
    slot {
      display: contents;
    }
  `;

  declare max: number;
  declare size: AvatarSize;
  declare protected total: number;

  readonly #internals: ElementInternals = this.attachInternals();

  constructor() {
    super();
    this.max = 3;
    this.size = "medium";
    this.total = 0;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, { role: "group" });
  }

  override firstUpdated(): void {
    this.renderRoot.addEventListener("slotchange", () => this.#count());
    this.#count();
  }

  #count(): void {
    this.total = this.querySelectorAll(":scope > camo-avatar").length;
  }

  override render(): TemplateResult {
    const max = Math.max(Math.floor(this.max), 1);
    const extra = this.total - max;
    return html`${cssBlock(`::slotted(*:nth-child(n + ${max + 1})) { display: none; }`)}<slot></slot
      >${
        extra > 0
          ? html`<camo-avatar class="more" size=${this.size} initials=${`+${extra}`}></camo-avatar>`
          : nothing
      }`;
  }
}
