import { LitElement, css, html, isServer } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { CamouflageController } from "../controller.ts";
import type { ImageFit, ImagePhase, ImageState, ShapeName } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const NO_SLOTS = {} as const;

/**
 * `<camo-image src="photo.jpg" content-description="A lake at dawn" shape="large" aspect-ratio="1.5">`
 *
 * An image in a frame the skin draws: a placeholder while it loads, the image fading in (not under reduced motion), and an
 * error mark when it fails. The frame fills the size it is given, so give it a width and an `aspect-ratio` (or a height).
 * Core loads nothing itself beyond the browser's own `<img>`, and takes no library. `content-description` names the image;
 * absent, the image is decorative and hidden from assistive technology. A failed image keeps its description and adds
 * "could not load". It is not focusable. A server renders the image as loaded, so it paints with no placeholder flash.
 *
 * @tagname camo-image
 * @attr {string} src - The image's address.
 * @attr {string} content-description - What the image shows; absent means decorative.
 * @attr {"none"|"extra-small"|"small"|"medium"|"large"|"extra-large"|"full"} shape - The frame's corners; `medium` by default.
 * @attr {"cover"|"contain"|"fill"|"none"|"scale-down"} fit - How the image fills the frame; `cover` by default (the contract's `contentScale`).
 * @attr {number} aspect-ratio - Width over height, for a frame with no height of its own.
 * @attr {string} position - Which part of the image stays in view: an `object-position`, `center` by default.
 * @fires load - The image loaded.
 * @fires error - The image failed.
 */
export class CamoImage extends LitElement {
  static override properties: PropertyDeclarations = {
    src: { type: String },
    contentDescription: { type: String, attribute: "content-description" },
    shape: { type: String, reflect: true },
    fit: { type: String, reflect: true },
    aspectRatio: { type: Number, attribute: "aspect-ratio" },
    position: { type: String },
    phase: { state: true },
  };

  static override styles: CSSResult = css``;

  declare src: string | null;
  declare contentDescription: string | null;
  declare shape: ShapeName;
  declare fit: ImageFit;
  declare aspectRatio: number | null;
  declare position: string | null;
  declare protected phase: ImagePhase;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);

  constructor() {
    super();
    this.src = null;
    this.contentDescription = null;
    this.shape = "medium";
    this.fit = "cover";
    this.aspectRatio = null;
    this.position = null;
    // A server cannot know, so it paints the image as loaded; the client checks as soon as it has the element.
    this.phase = "loaded";
  }

  get #img(): HTMLImageElement | null {
    return this.renderRoot?.querySelector<HTMLImageElement>("img") ?? null;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    const described = this.contentDescription !== null && this.contentDescription !== "";
    applyAria(
      this,
      this.#internals,
      described
        ? {
            role: "img",
            label:
              this.phase === "failed"
                ? `${this.contentDescription}, could not load`
                : this.contentDescription,
          }
        : { role: "img", hidden: true },
    );
    if (changed.has("src") && !isServer && this.hasUpdated) this.phase = "loading";
  }

  override firstUpdated(): void {
    this.#check();
  }

  override updated(changed: PropertyValues<this>): void {
    if (changed.has("src") && this.hasUpdated) queueMicrotask(() => this.#check());
  }

  /** Reads the real state of the `<img>`: it may have loaded before the element was ready. */
  #check(): void {
    const img = this.#img;
    if (img === null || this.src === null || this.src === "") {
      this.phase = this.src === null || this.src === "" ? "loading" : this.phase;
      return;
    }
    if (img.complete) this.phase = img.naturalWidth > 0 ? "loaded" : "failed";
    else this.phase = "loading";
  }

  readonly #onLoad = (): void => {
    this.phase = "loaded";
    this.dispatchEvent(new Event("load"));
  };

  readonly #onError = (): void => {
    this.phase = "failed";
    this.dispatchEvent(new Event("error"));
  };

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    const decorative = this.contentDescription === null || this.contentDescription === "";
    const img =
      this.src === null || this.src === ""
        ? html``
        : html`<img
            class="img"
            src=${this.src}
            alt=${decorative ? "" : (this.contentDescription ?? "")}
            style="--im-fit: ${this.fit}; ${this.position === null ? "" : `--im-position: ${this.position}`}"
            @load=${this.#onLoad}
            @error=${this.#onError}
          />`;
    if (skin === undefined) return img;
    const renderer = skin.image;
    const state: ImageState = {
      phase: this.src === null || this.src === "" ? "loading" : this.phase,
      shape: this.shape,
      aspectRatio: this.aspectRatio,
    };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: NO_SLOTS,
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
      nodes: { image: img },
    })}`;
  }
}
