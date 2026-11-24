import { LitElement, css, html, isServer, nothing } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { CamouflageController } from "../controller.ts";
import { toneIcon } from "../icons-tone.ts";
import { closeIcon } from "../skin/status.ts";
import type { SnackbarState, Tone } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

/** How a snackbar ended: its action was pressed, or it was dismissed (the ✕, a swipe, a timeout, `dismissCurrent()`). */
export type SnackbarResult = "action" | "dismissed";

/**
 * `<camo-snackbar message="Message archived" action="Undo"></camo-snackbar>`
 *
 * One message at the bottom (or top) of the window, with at most one action: "Message archived · Undo". Apps rarely write
 * the element: they call the messenger (`messengerOf(el).show("Message archived", { action: "Undo" })`), which queues
 * messages, shows one at a time in the top layer and resolves a promise with the result. The element is announced as it
 * appears: politely, and for `error` and `warning` assertively. `with-dismiss` adds a ✕; absent follows the skin.
 *
 * @tagname camo-snackbar
 * @attr {string} message - The text.
 * @attr {string} action - The label of the one action; absent means none.
 * @attr {"default"|"error"|"success"|"warning"|"info"} tone - The colour family; `error` tints the snackbar.
 * @attr {boolean} with-dismiss - Shows a ✕ button; absent follows the skin's default.
 * @fires camo-action - The action was pressed.
 * @fires camo-dismiss - The ✕ was pressed.
 */
export class CamoSnackbar extends LitElement {
  static override properties: PropertyDeclarations = {
    message: { type: String },
    action: { type: String },
    tone: { type: String, reflect: true },
    withDismiss: {
      attribute: "with-dismiss",
      converter: {
        fromAttribute: (value: string | null): boolean | null =>
          value === null ? null : value !== "false",
        toAttribute: (value: boolean | null): string | null => (value === null ? null : ""),
      },
    },
  };

  static override styles: CSSResult = css``;

  declare message: string;
  declare action: string | null;
  declare tone: Tone;
  declare withDismiss: boolean | null;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);

  constructor() {
    super();
    this.message = "";
    this.action = null;
    this.tone = "default";
    this.withDismiss = null;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Shown in the top layer, above whatever is open; `manual` so nothing but the messenger closes it.
    if (!this.hasAttribute("popover")) this.setAttribute("popover", "manual");
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    const urgent = this.tone === "error" || this.tone === "warning";
    applyAria(this, this.#internals, {
      role: urgent ? "alert" : "status",
      live: urgent ? "assertive" : "polite",
    });
    // Position and alignment are the skin's (a brand choice); the host carries them for its `:host([…])` rules.
    const skin = this.#cx.skin;
    if (skin !== undefined) {
      const style = skin.snackbar.defaults(tokens);
      this.setAttribute("data-position", style.position);
      this.setAttribute("data-alignment", style.alignment);
    }
  }

  override firstUpdated(): void {
    if (!isServer) {
      try {
        if (this.matches(":not(:popover-open)")) this.showPopover();
      } catch {
        // Not connected or popovers unsupported: it stays an ordinary element.
      }
    }
  }

  #fire(name: string): void {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true }));
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`${this.message}`;
    const renderer = skin.snackbar;
    const style = renderer.defaults(tokens);
    const withDismiss = this.withDismiss ?? style.showDismiss;
    const state: SnackbarState = {
      message: this.message,
      action: this.action,
      tone: this.tone,
      withDismiss,
      showToneIcon: style.showToneIcon,
      position: style.position,
      toneIcon: toneIcon(this.tone),
    };
    const action =
      this.action === null || this.action === ""
        ? nothing
        : html`<button class="action" type="button" part="action" @click=${() => this.#fire("camo-action")}>
            ${this.action}
          </button>`;
    const dismiss = withDismiss
      ? html`<button
          class="dismiss"
          type="button"
          part="dismiss"
          aria-label="Dismiss"
          @click=${() => this.#fire("camo-dismiss")}
        >
          ${closeIcon}
        </button>`
      : nothing;
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: {},
      theme: tokens,
      style,
      skin,
      nodes: { action, dismiss },
    })}`;
  }
}

/** What `show` takes besides the message. */
export interface SnackbarOptions {
  /** The label of the one action. */
  action?: string | null;
  /** `error` tints the snackbar and announces it assertively. */
  tone?: Tone;
  /** How long it stays: 4 s (`short`), 10 s (`long`), until dismissed, or a number of milliseconds. `auto` is `short`, or `long` with an action. */
  duration?: "auto" | "short" | "long" | "indefinite" | number;
  /** A ✕ button; absent follows the skin. */
  withDismiss?: boolean;
}

interface Entry {
  message: string;
  options: SnackbarOptions;
  resolve: (result: SnackbarResult) => void;
  element: CamoSnackbar | null;
  timer: ReturnType<typeof setTimeout> | undefined;
  remaining: number;
  startedAt: number;
  paused: boolean;
}

const DURATIONS = { short: 4000, long: 10000 } as const;

/**
 * The queue behind every snackbar of one provider (or of the document, with none): `show` returns a promise that
 * resolves with `"action"` or `"dismissed"`, one message is visible at a time, and the timer stands still while the
 * pointer or focus is on it (WCAG 2.2.1: time to reach the action). It is `messengerOf(element)`; apps never construct it.
 */
export class CamoMessenger {
  readonly #root: () => HTMLElement;
  readonly #queue: Entry[] = [];
  #current: Entry | null = null;

  constructor(root: () => HTMLElement) {
    this.#root = root;
  }

  /** Queues a message and resolves with how it ended. */
  show(message: string, options: SnackbarOptions = {}): Promise<SnackbarResult> {
    return new Promise((resolve) => {
      this.#queue.push({
        message,
        options,
        resolve,
        element: null,
        timer: undefined,
        remaining: 0,
        startedAt: 0,
        paused: false,
      });
      if (this.#current === null) this.#next();
    });
  }

  /** Ends the message on screen (an outdated one) with `"dismissed"`; the next in the queue follows. */
  dismissCurrent(): void {
    if (this.#current !== null) this.#finish(this.#current, "dismissed");
  }

  /** The number of messages waiting, not counting the one on screen. */
  get pending(): number {
    return this.#queue.length;
  }

  #duration(entry: Entry): number {
    const d = entry.options.duration ?? "auto";
    if (typeof d === "number") return d;
    if (d === "indefinite") return Number.POSITIVE_INFINITY;
    if (d === "auto") {
      const action = entry.options.action;
      return action !== undefined && action !== null && action !== ""
        ? DURATIONS.long
        : DURATIONS.short;
    }
    return DURATIONS[d];
  }

  #next(): void {
    const entry = this.#queue.shift();
    if (entry === undefined) {
      this.#current = null;
      return;
    }
    this.#current = entry;
    const el = document.createElement("camo-snackbar") as CamoSnackbar;
    el.message = entry.message;
    el.action = entry.options.action ?? null;
    el.tone = entry.options.tone ?? "default";
    if (entry.options.withDismiss !== undefined) el.withDismiss = entry.options.withDismiss;
    el.addEventListener("camo-action", () => this.#finish(entry, "action"));
    el.addEventListener("camo-dismiss", () => this.#finish(entry, "dismissed"));
    // The timer stands still while the message is hovered or has focus.
    el.addEventListener("pointerenter", () => this.#hold(entry));
    el.addEventListener("pointerleave", () => this.#release(entry));
    el.addEventListener("focusin", () => this.#hold(entry));
    el.addEventListener("focusout", () => this.#release(entry));
    this.#swipe(el, entry);
    entry.element = el;
    this.#root().append(el);
    entry.remaining = this.#duration(entry);
    this.#arm(entry);
  }

  #arm(entry: Entry): void {
    clearTimeout(entry.timer);
    entry.startedAt = Date.now();
    if (Number.isFinite(entry.remaining))
      entry.timer = setTimeout(() => this.#finish(entry, "dismissed"), entry.remaining);
  }

  #hold(entry: Entry): void {
    if (entry.paused || this.#current !== entry) return;
    entry.paused = true;
    clearTimeout(entry.timer);
    entry.remaining = Math.max(entry.remaining - (Date.now() - entry.startedAt), 1000);
  }

  #release(entry: Entry): void {
    if (!entry.paused || this.#current !== entry) return;
    // Focus may still be inside, or the pointer still over it.
    if (entry.element?.matches(":hover, :focus-within")) return;
    entry.paused = false;
    this.#arm(entry);
  }

  /** A horizontal swipe (up for a top snackbar) dismisses it. */
  #swipe(el: CamoSnackbar, entry: Entry): void {
    let start: { x: number; y: number } | null = null;
    el.addEventListener("pointerdown", (e) => {
      start = { x: e.clientX, y: e.clientY };
    });
    el.addEventListener("pointerup", (e) => {
      if (start === null) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      start = null;
      const up =
        el.getAttribute("data-position") === "top" && dy < -48 && Math.abs(dy) > Math.abs(dx);
      if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 2) this.#finish(entry, "dismissed");
      else if (up) this.#finish(entry, "dismissed");
    });
    el.addEventListener("pointercancel", () => {
      start = null;
    });
  }

  #finish(entry: Entry, result: SnackbarResult): void {
    if (this.#current !== entry) return;
    clearTimeout(entry.timer);
    try {
      entry.element?.hidePopover();
    } catch {
      // Already hidden.
    }
    entry.element?.remove();
    this.#current = null;
    entry.resolve(result);
    this.#next();
  }
}

const messengers = new WeakMap<Element | Document, CamoMessenger>();

/**
 * The messenger for the provider around `host` (or the first `camo-provider` on the page, or the page itself), so a
 * snackbar takes that provider's skin and theme. One messenger per provider: every call returns the same one, so
 * snackbars queue instead of stacking. Call it from a handler on the client.
 */
export function messengerOf(host?: Element | null): CamoMessenger {
  const provider =
    host?.closest("camo-provider") ?? document.querySelector("camo-provider") ?? document;
  let messenger = messengers.get(provider);
  if (messenger === undefined) {
    messenger = new CamoMessenger(() =>
      provider instanceof Document ? provider.body : (provider as HTMLElement),
    );
    messengers.set(provider, messenger);
  }
  return messenger;
}
