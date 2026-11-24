import { LitElement, css, html } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { CamouflageController } from "../controller.ts";
import { progressText } from "../skin/status.ts";
import type { ProgressSize, ProgressState, Tone } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const NO_SLOTS = {} as const;

/** An absent or empty `progress` attribute is "unknown" (null); a number is the fraction, clamped to 0..1. */
const fraction = {
  fromAttribute(value: string | null): number | null {
    if (value === null || value.trim() === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  toAttribute(value: number | null): string | null {
    return value === null ? null : String(value);
  },
};

function describe(
  host: HTMLElement,
  internals: ElementInternals,
  progress: number | null,
  label: string | null,
): void {
  const p = progress === null ? null : Math.min(Math.max(progress, 0), 1);
  applyAria(host, internals, {
    role: "progressbar",
    label,
    // Unknown amount: no value, which is how a screen reader hears "in progress".
    ...(p === null
      ? {}
      : { value: { now: Math.round(p * 100), min: 0, max: 100, text: progressText(p) } }),
  });
}

/**
 * `<camo-progress-bar progress="0.4" label="Uploading photo">` or `<camo-progress-bar label="Loading">`
 *
 * A horizontal progress bar: determinate with `progress` (0 to 1), indeterminate without it. It fills the width it is
 * given. Value changes are not announced continuously (apps announce milestones); an indeterminate bar sweeps, and under
 * reduced motion it pulses slowly instead. In right-to-left it fills from the right.
 *
 * @tagname camo-progress-bar
 * @attr {number} progress - 0 to 1, clamped; absent means indeterminate.
 * @attr {"default"|"error"|"success"|"warning"|"info"} tone - The colour family, e.g. `error` for a failed upload.
 * @attr {string} label - The accessible name ("Uploading photo").
 */
export class CamoProgressBar extends LitElement {
  static override properties: PropertyDeclarations = {
    progress: { converter: fraction, reflect: true },
    tone: { type: String, reflect: true },
    label: { type: String },
  };

  static override styles: CSSResult = css``;

  declare progress: number | null;
  declare tone: Tone;
  declare label: string | null;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);

  constructor() {
    super();
    this.progress = null;
    this.tone = "default";
    this.label = null;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    describe(this, this.#internals, this.progress, this.label);
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`<progress .value=${this.progress ?? 0} max="1"></progress>`;
    const renderer = skin.progressBar;
    const state: ProgressState = { progress: this.progress, tone: this.tone };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: NO_SLOTS,
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
    })}`;
  }
}

/**
 * `<camo-progress-circle size="large">` or `<camo-progress-circle progress="0.6" tone="success">`
 *
 * A circular progress indicator: a ring that fills with `progress` (0 to 1), or spins when there is none (a ring of
 * fading spokes under Cupertino). Sizes are small (24), medium (48) and large (64). Under reduced motion an
 * indeterminate circle pulses instead of spinning.
 *
 * @tagname camo-progress-circle
 * @attr {number} progress - 0 to 1, clamped; absent means indeterminate.
 * @attr {"default"|"error"|"success"|"warning"|"info"} tone - The colour family.
 * @attr {"small"|"medium"|"large"} size - The diameter.
 * @attr {string} label - The accessible name ("Loading").
 */
export class CamoProgressCircle extends LitElement {
  static override properties: PropertyDeclarations = {
    progress: { converter: fraction, reflect: true },
    tone: { type: String, reflect: true },
    size: { type: String, reflect: true },
    label: { type: String },
  };

  static override styles: CSSResult = css``;

  declare progress: number | null;
  declare tone: Tone;
  declare size: ProgressSize;
  declare label: string | null;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);

  constructor() {
    super();
    this.progress = null;
    this.tone = "default";
    this.size = "medium";
    this.label = null;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    describe(this, this.#internals, this.progress, this.label);
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`<progress .value=${this.progress ?? 0} max="1"></progress>`;
    const renderer = skin.progressCircle;
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state: { progress: this.progress, tone: this.tone, size: this.size },
      slots: NO_SLOTS,
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
    })}`;
  }
}
