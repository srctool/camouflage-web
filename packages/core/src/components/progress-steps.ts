import { LitElement, css, html, isServer } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { attachActivation } from "../behavior/activation.ts";
import { applyAria } from "../behavior/aria.ts";
import { PressController } from "../behavior/press.ts";
import { RovingTabindexController } from "../behavior/roving.ts";
import { CamouflageController } from "../controller.ts";
import type { StepState, StepStatus, StepsOrientation } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const NO_SLOTS = {} as const;
const TEXTS = {
  step: "Step",
  complete: "complete",
  current: "current",
  upcoming: "upcoming",
  error: "error",
} as const;

/**
 * `<camo-step label="Shipping" description="Where it goes" clickable>`
 *
 * One step of `camo-progress-steps`. Its state (complete, current or upcoming) comes from the steps' `current`; set `state`
 * to `error` to flag a step. `clickable` makes it a button the app can use to go back or jump ahead. It announces "Step 2 of
 * 4, Shipping, current".
 *
 * @tagname camo-step
 * @attr {string} label - The step's name.
 * @attr {string} description - A line under the label ("Optional").
 * @attr {"complete"|"current"|"upcoming"|"error"} state - Overrides the state derived from `current`.
 * @attr {boolean} clickable - The step is a button.
 * @attr {number} index - The step's place, from 0: the steps set it, and a server render needs it written (a server cannot read siblings).
 * @attr {number} count - How many steps there are: the same.
 * @attr {"horizontal"|"vertical"} orientation - Set by the steps; written for a server render.
 */
export class CamoStep extends LitElement {
  static override properties: PropertyDeclarations = {
    label: { type: String },
    description: { type: String },
    state: { type: String, reflect: true },
    clickable: { type: Boolean, reflect: true },
    status: { type: String, attribute: false },
    index: { type: Number, reflect: true },
    count: { type: Number, reflect: true },
    orientation: { type: String, reflect: true },
  };

  static override styles: CSSResult = css``;

  declare label: string;
  declare description: string | null;
  declare state: StepStatus | null;
  declare clickable: boolean;
  /** Set by the steps. */
  declare status: StepStatus;
  declare index: number;
  declare count: number;
  declare orientation: StepsOrientation;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  readonly #press: PressController = new PressController(this, () => !this.clickable);

  constructor() {
    super();
    this.label = "";
    this.description = null;
    this.state = null;
    this.clickable = false;
    this.status = "upcoming";
    this.index = 0;
    this.count = 1;
    this.orientation = "horizontal";
    attachActivation(this, () => !this.clickable);
    void this.#press;
  }

  get resolved(): StepStatus {
    return this.state ?? this.status;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    const status = this.resolved;
    const label = `${TEXTS.step} ${this.index + 1} of ${this.count}, ${this.label}, ${TEXTS[status]}`;
    applyAria(this, this.#internals, {
      role: this.clickable ? "button" : "listitem",
      label,
      ...(this.clickable ? {} : {}),
      ...(status === "current" ? { current: "page" as const } : {}),
    });
    if (!isServer && this.closest("camo-progress-steps") === null)
      this.setAttribute("tabindex", this.clickable ? "0" : "-1");
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`${this.label}`;
    const renderer = skin.progressSteps;
    const state: StepState = {
      index: this.index,
      count: this.count,
      label: this.label,
      description: this.description === "" ? null : this.description,
      status: this.resolved,
      clickable: this.clickable,
      last: this.index === this.count - 1,
      orientation: this.orientation,
      texts: TEXTS,
    };
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
 * `<camo-progress-steps current="1" label="Checkout"><camo-step label="Cart"></camo-step>…</camo-progress-steps>`
 *
 * A row (or column) of steps for a multi-step flow: the steps before `current` are complete, `current` is current, the rest
 * upcoming; a step can be flagged `error`. It is a list named `label`; each step announces "Step 2 of 4, Shipping, current";
 * the current one is marked. Only steps with `clickable` are buttons, and one Tab stop crosses them: Left and Right (Up and
 * Down when vertical) move. The state change is not a live region: the app's content change is. Horizontal steps share the
 * width equally except the last. Right to left mirrors the order. A server draws every step as upcoming until it hydrates, so
 * give the steps their `state` when that matters.
 *
 * @tagname camo-progress-steps
 * @slot - The `camo-step`s.
 * @attr {number} current - The current step, from 0; earlier steps are complete.
 * @attr {"horizontal"|"vertical"} orientation - Left to right, or top to bottom.
 * @attr {string} label - The list's accessible name; "Progress" by default.
 */
export class CamoProgressSteps extends LitElement {
  static override properties: PropertyDeclarations = {
    current: { type: Number, reflect: true },
    orientation: { type: String, reflect: true },
    label: { type: String },
  };

  static override styles: CSSResult = css`
    :host {
      display: flex;
    }
    :host([orientation="horizontal"]) {
      flex-direction: row;
    }
    :host([orientation="vertical"]) {
      flex-direction: column;
    }
    ::slotted(camo-step) {
      flex: 1 1 0;
      min-inline-size: 0;
    }
    :host([orientation="horizontal"]) ::slotted(camo-step:last-child) {
      flex: 0 0 auto;
    }
    slot {
      display: contents;
    }
  `;

  declare current: number;
  declare orientation: StepsOrientation;
  declare label: string;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #roving: RovingTabindexController = new RovingTabindexController(this, {
    items: () => this.#steps().filter((s) => s.clickable),
    orientation: "both",
    wrap: false,
  });

  constructor() {
    super();
    this.current = 0;
    this.orientation = "horizontal";
    this.label = "Progress";
  }

  #steps(): CamoStep[] {
    return [...this.querySelectorAll<CamoStep>(":scope > camo-step")];
  }

  #sync(): void {
    const steps = this.#steps();
    steps.forEach((step, i) => {
      step.index = i;
      step.count = steps.length;
      step.orientation = this.orientation;
      step.status = i < this.current ? "complete" : i === this.current ? "current" : "upcoming";
    });
    this.#roving.update();
  }

  override firstUpdated(): void {
    this.renderRoot.addEventListener("slotchange", () => this.#sync());
    this.#sync();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, {
      role: "list",
      label: this.label === "" ? null : this.label,
    });
  }

  override updated(): void {
    this.#sync();
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
