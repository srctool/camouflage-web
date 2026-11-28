import { LitElement, css, html, isServer, nothing } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { offsetOfThumb, pageFor, thumbOf } from "../behavior/scroll-geometry.ts";
import type { Thumb } from "../behavior/scroll-geometry.ts";
import { CamouflageController } from "../controller.ts";
import type { ScrollbarShow, ScrollbarState, ScrollOrientation } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

type Axis = "vertical" | "horizontal";

/**
 * `<camo-scrollbar style="block-size: 20rem">…long content…</camo-scrollbar>`
 *
 * A scroll area with the skin's scrollbar over its content. With a mouse or trackpad the platform's bar is hidden and
 * the skin draws one that can be dragged, and pages when its track is pressed; touch keeps the platform's own. The
 * wheel and the keys scroll the content as always. The drawn bar is not a focus stop and is left out of the
 * accessibility tree; the area itself takes focus, so a keyboard can scroll it.
 *
 * @tagname camo-scrollbar
 * @slot - What scrolls.
 * @attr {"vertical"|"horizontal"|"both"} orientation - Which ways it scrolls (`vertical`).
 * @attr {"auto"|"on-scroll"|"always"} visibility - When the bar shows; `auto` is the skin's choice.
 * @attr {string} label - Names the area, which then is a region.
 */
export class CamoScrollbar extends LitElement {
  static override properties: PropertyDeclarations = {
    orientation: { type: String, reflect: true },
    visibility: { type: String },
    label: { type: String },
    thumbs: { state: true },
    scrolling: { state: true },
    dragged: { state: true },
  };

  static override styles: CSSResult = css`
    :host {
      display: flex;
      flex-direction: column;
      position: relative;
      min-block-size: 0;
      min-inline-size: 0;
    }
    .viewport {
      flex: 1 1 auto;
      min-block-size: 0;
      overflow: hidden auto;
    }
    :host([orientation="horizontal"]) .viewport {
      overflow: auto hidden;
    }
    :host([orientation="both"]) .viewport {
      overflow: auto;
    }
    .viewport:focus-visible {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: -2px;
    }
    .bars {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }
    /* A mouse gets the skin's bar. Without scripting, or with fingers, the platform's stays. */
    @media (pointer: fine) and (scripting: enabled) {
      .viewport {
        scrollbar-width: none;
      }
      .viewport::-webkit-scrollbar {
        display: none;
      }
    }
    @media (pointer: coarse) {
      .bars {
        display: none;
      }
    }
  `;

  declare orientation: ScrollOrientation;
  declare visibility: ScrollbarShow;
  declare label: string | null;
  declare thumbs: Partial<Record<Axis, Thumb & { track: number }>>;
  declare scrolling: boolean;
  declare dragged: Axis | null;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  #observer: ResizeObserver | undefined;
  #hiding: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    super();
    this.orientation = "vertical";
    this.visibility = "auto";
    this.label = null;
    this.thumbs = {};
    this.scrolling = false;
    this.dragged = null;
  }

  /** The element that scrolls. */
  get viewport(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>(".viewport") ?? null;
  }

  get #axes(): Axis[] {
    return this.orientation === "both" ? ["vertical", "horizontal"] : [this.orientation];
  }

  /** Reads the content and places the thumbs. The area does it by itself when it scrolls or changes size. */
  measure(): void {
    const view = this.viewport;
    if (view === null || this.#cx.skin === undefined) return;
    const minimum =
      Number.parseFloat(
        getComputedStyle(this).getPropertyValue("--camo-scrollbar-min-thumb") || "",
      ) ||
      Number.parseFloat(this.#cx.skin.scrollbar.defaults(tokens).minThumb.replace(/^.*,\s*/, ""));
    const next: CamoScrollbar["thumbs"] = {};
    for (const axis of this.#axes) {
      const vertical = axis === "vertical";
      const size = vertical ? view.clientHeight : view.clientWidth;
      const content = vertical ? view.scrollHeight : view.scrollWidth;
      // Right-to-left scrolls from zero into negative numbers.
      const offset = vertical ? view.scrollTop : Math.abs(view.scrollLeft);
      const thumb = thumbOf(size, content, offset, size, minimum || 32);
      if (thumb !== null) next[axis] = { ...thumb, track: size };
    }
    if (JSON.stringify(next) !== JSON.stringify(this.thumbs)) this.thumbs = next;
  }

  #setOffset(axis: Axis, offset: number): void {
    const view = this.viewport!;
    if (axis === "vertical") view.scrollTop = offset;
    else view.scrollLeft = getComputedStyle(this).direction === "rtl" ? -offset : offset;
  }

  #offset(axis: Axis): number {
    const view = this.viewport!;
    return axis === "vertical" ? view.scrollTop : Math.abs(view.scrollLeft);
  }

  readonly #onScroll = (): void => {
    this.measure();
    this.#show();
  };

  #show(): void {
    this.scrolling = true;
    clearTimeout(this.#hiding);
    const delay = this.#cx.skin?.scrollbar.defaults(tokens).hideDelay ?? "1200ms";
    this.#hiding = setTimeout(
      () => (this.scrolling = false),
      Number.parseFloat(delay.replace(/^.*,\s*/, "")) || 1200,
    );
  }

  // A press on the thumb drags it; a press on the track goes a page towards it.
  readonly #onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    const path = event.composedPath() as Element[];
    const track = path.find((n) => n instanceof Element && n.getAttribute("data-part") === "track");
    if (track === undefined) return;
    event.preventDefault();
    const axis = track.getAttribute("data-key") as Axis;
    const thumb = this.thumbs[axis];
    const view = this.viewport;
    if (thumb === undefined || view === null) return;
    const vertical = axis === "vertical";
    const rtl = !vertical && getComputedStyle(this).direction === "rtl";
    const box = track.getBoundingClientRect();
    const along = (e: PointerEvent): number =>
      vertical ? e.clientY - box.top : rtl ? box.right - e.clientX : e.clientX - box.left;
    const size = vertical ? view.clientHeight : view.clientWidth;
    const content = vertical ? view.scrollHeight : view.scrollWidth;
    if (!path.some((n) => n instanceof Element && n.getAttribute("data-part") === "thumb")) {
      this.#setOffset(axis, pageFor(along(event), thumb, size, this.#offset(axis)));
      return;
    }
    const grabbed = along(event) - thumb.start;
    const target = event.target as Element;
    try {
      target.setPointerCapture(event.pointerId);
    } catch {
      // A synthetic event has no active pointer.
    }
    this.dragged = axis;
    const move = (e: PointerEvent): void =>
      this.#setOffset(
        axis,
        offsetOfThumb(along(e) - grabbed, size, content, thumb.track, thumb.length),
      );
    const end = (): void => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      this.dragged = null;
      this.#show();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  // The bar lies over the content, so a wheel on it is passed on.
  readonly #onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.viewport?.scrollBy(event.deltaX, event.deltaY);
  };

  override connectedCallback(): void {
    super.connectedCallback();
    if (isServer || typeof ResizeObserver === "undefined") return;
    this.#observer = new ResizeObserver(() => this.measure());
    this.#observer.observe(this);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#observer?.disconnect();
    clearTimeout(this.#hiding);
  }

  readonly #onSlot = (event: Event): void => {
    for (const child of (event.target as HTMLSlotElement).assignedElements())
      this.#observer?.observe(child);
    this.measure();
  };

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, { role: "group" });
  }

  override updated(changed: PropertyValues<this>): void {
    if (changed.has("orientation")) this.measure();
  }

  override firstUpdated(): void {
    this.measure();
  }

  #bar(axis: Axis): TemplateResult | typeof nothing {
    const skin = this.#cx.skin!;
    const thumb = this.thumbs[axis];
    if (thumb === undefined) return nothing;
    const renderer = skin.scrollbar;
    const style = renderer.defaults(tokens);
    const when = this.visibility === "auto" ? style.visibility : this.visibility;
    const state: ScrollbarState = {
      orientation: axis,
      thumbStart: thumb.start / thumb.track,
      thumbLength: thumb.length / thumb.track,
      dragging: this.dragged === axis,
      visible: when === "always" || this.scrolling || this.dragged === axis,
    };
    return renderer.render({ state, slots: {}, theme: tokens, style, skin });
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    return html`<div
        class="viewport"
        part="viewport"
        tabindex="0"
        role=${this.label === null ? nothing : "region"}
        aria-label=${this.label ?? nothing}
        @scroll=${this.#onScroll}
      >
        <slot @slotchange=${this.#onSlot}></slot>
      </div>
      ${
        skin === undefined
          ? nothing
          : html`${cssBlock(skin.scrollbar.styles)}
              <div
                class="bars"
                aria-hidden="true"
                @pointerdown=${this.#onPointerDown}
                @wheel=${this.#onWheel}
              >
                ${this.#axes.map((axis) => this.#bar(axis))}
              </div>`
      }`;
  }
}
