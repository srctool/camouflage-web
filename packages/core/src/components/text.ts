import { LitElement, css, html } from "lit";
import type { CSSResult, PropertyDeclarations, TemplateResult } from "lit";
import { CamouflageController } from "../controller.ts";
import type { TextAlign, TextOverflow, TextState, TextVariant } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = { content: "" } as const;

/**
 * `<camo-text variant="title-medium" max-lines="2" overflow="ellipsis">Hello</camo-text>`
 *
 * Text in one of the theme's 15 type roles, in the content color of whatever contains it. Plain text comes from the
 * `text` attribute or the element's content; rich text is ordinary markup in the content (`<strong>`, `<em>`, `<a href>`),
 * which the skin styles (a link is the primary color, underlined or not). Each link stays a real, focusable link.
 *
 * @tagname camo-text
 * @slot - The text, or rich text: `<strong>`, `<em>` and `<a>` inside it.
 * @attr {string} text - The content, when it is plain text.
 * @attr {"display-large"|"display-medium"|"display-small"|"headline-large"|"headline-medium"|"headline-small"|"title-large"|"title-medium"|"title-small"|"body-large"|"body-medium"|"body-small"|"label-large"|"label-medium"|"label-small"} variant - The type role (the contract's `style`, which HTML reserves).
 * @attr {string} color - A CSS color; absent means the content color of the container.
 * @attr {number} max-lines - Truncates after this many lines; 0 is unlimited.
 * @attr {"clip"|"ellipsis"} overflow - What a truncated last line shows.
 * @attr {"start"|"center"|"end"} text-align - Alignment in the text's own box; start and end mirror in right-to-left.
 */
export class CamoText extends LitElement {
  static override properties: PropertyDeclarations = {
    text: { type: String },
    variant: { type: String, reflect: true },
    color: { type: String },
    maxLines: { type: Number, attribute: "max-lines" },
    overflow: { type: String, reflect: true },
    textAlign: { type: String, attribute: "text-align", reflect: true },
  };

  static override styles: CSSResult = css`
    :host {
      display: block;
    }
  `;

  declare text: string;
  declare variant: TextVariant;
  declare color: string | null;
  declare maxLines: number;
  declare overflow: TextOverflow;
  declare textAlign: TextAlign;

  readonly #cx: CamouflageController = new CamouflageController(this);

  constructor() {
    super();
    this.text = "";
    this.variant = "body-medium";
    this.color = null;
    this.maxLines = 0;
    this.overflow = "clip";
    this.textAlign = "start";
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`${this.text}<slot></slot>`;
    const renderer = skin.text;
    const state: TextState = {
      text: this.text,
      variant: this.variant,
      color: this.color,
      maxLines: this.maxLines,
      overflow: this.overflow,
      textAlign: this.textAlign,
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
