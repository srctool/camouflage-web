import { LitElement, css, html, isServer } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { CamouflageController } from "../controller.ts";
import type { ShapeName, SkeletonLeading, SkeletonState, SkeletonVariant } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

/** The length of one shimmer cycle the elements keep in step with, in ms. */
const CYCLE_MS = 1500;

/**
 * `<camo-skeleton height="12rem">`, `<camo-skeleton variant="text" lines="3">`, `variant="circle" size="48px"` or
 * `variant="list-item" lines="2"`
 *
 * A placeholder while content loads. A block, text lines (the last shorter), an avatar circle, or a whole list row sized
 * like a real `camo-list-item`, so rows line up when the content arrives. Every skeleton on the page shimmers in step (they
 * start the cycle at the same moment), however late each mounted. They are hidden from assistive technology: the container
 * that shows them says "Loading" once. The animation stops under reduced motion.
 *
 * @tagname camo-skeleton
 * @attr {"block"|"text"|"circle"|"list-item"} variant - What it imitates.
 * @attr {"none"|"extra-small"|"small"|"medium"|"large"|"extra-large"|"full"} shape - A block's corners.
 * @attr {string} width - A block's width, a CSS length; it fills by default.
 * @attr {string} height - A block's height, a CSS length.
 * @attr {number} lines - The lines of text, or of a list row's text.
 * @attr {number} last-line-fraction - How long the last line is, 0 to 1.
 * @attr {string} size - A circle's diameter, a CSS length.
 * @attr {"circle"|"square"|"none"} leading - A list row's leading shape.
 */
export class CamoSkeleton extends LitElement {
  static override properties: PropertyDeclarations = {
    variant: { type: String, reflect: true },
    shape: { type: String },
    width: { type: String },
    height: { type: String },
    lines: { type: Number },
    lastLineFraction: { type: Number, attribute: "last-line-fraction" },
    size: { type: String },
    leading: { type: String },
  };

  static override styles: CSSResult = css``;

  declare variant: SkeletonVariant;
  declare shape: ShapeName;
  declare width: string | null;
  declare height: string | null;
  declare lines: number;
  declare lastLineFraction: number;
  declare size: string | null;
  declare leading: SkeletonLeading;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  #phase = 0;

  constructor() {
    super();
    this.variant = "block";
    this.shape = "small";
    this.width = null;
    this.height = null;
    this.lines = 1;
    this.lastLineFraction = 0.6;
    this.size = null;
    this.leading = "circle";
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // The page's clock modulo the cycle: every skeleton starts the same moment of the animation.
    // A server has no clock worth keeping (and its bytes must not depend on the time): it starts at 0.
    this.#phase = isServer ? 0 : performance.now() % CYCLE_MS;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, { role: "presentation", hidden: true });
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html``;
    const renderer = skin.skeleton;
    const state: SkeletonState = {
      variant: this.variant,
      shape: this.shape,
      width: this.width,
      height: this.height,
      lines: this.lines,
      lastLineFraction: this.lastLineFraction,
      size: this.size,
      leading: this.leading,
      phase: this.#phase,
    };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: {},
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
    })}`;
  }
}
