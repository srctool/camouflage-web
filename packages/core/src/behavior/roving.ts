import type { ReactiveController, ReactiveControllerHost } from "lit";

/** Which arrow keys move between the items. */
export type Orientation = "horizontal" | "vertical" | "both";

/** What the controller needs to know about the group. */
export interface RovingOptions {
  /** The items now, in order (called on every keystroke, so it can follow slotted content). */
  items: () => HTMLElement[];
  orientation?: Orientation;
  /** Past the last item go to the first, and the other way round. */
  wrap?: boolean;
  /** An item that cannot take focus (disabled); it is skipped. */
  isDisabled?: (item: HTMLElement) => boolean;
}

/**
 * A roving tabindex: one item of the group is in the tab order (`tabindex="0"`), the others are not (`-1`), and the
 * arrow keys, Home and End move between them. Horizontal arrows follow the writing direction, so they mirror in
 * right-to-left. Tab then leaves the group in one step, as users of tabs, radio groups and toolbars expect.
 */
export class RovingTabindexController implements ReactiveController {
  readonly #host: ReactiveControllerHost & HTMLElement;
  readonly #options: Required<Omit<RovingOptions, "items">> & Pick<RovingOptions, "items">;
  #active = 0;

  constructor(host: ReactiveControllerHost & HTMLElement, options: RovingOptions) {
    this.#host = host;
    this.#options = {
      orientation: "horizontal",
      wrap: true,
      isDisabled: (item) =>
        item.hasAttribute("disabled") || item.getAttribute("aria-disabled") === "true",
      ...options,
    };
    host.addController(this);
  }

  /** The index of the item in the tab order. */
  get index(): number {
    return this.#active;
  }

  hostConnected(): void {
    this.#host.addEventListener("keydown", this.#keyDown);
    this.#host.addEventListener("focusin", this.#focusIn);
  }

  hostDisconnected(): void {
    this.#host.removeEventListener("keydown", this.#keyDown);
    this.#host.removeEventListener("focusin", this.#focusIn);
  }

  /** Puts item `index` in the tab order (and takes the others out). Call it after the items change. */
  setActive(index: number): void {
    const items = this.#options.items();
    if (items.length === 0) return;
    this.#active = Math.min(Math.max(index, 0), items.length - 1);
    items.forEach((item, i) => item.setAttribute("tabindex", i === this.#active ? "0" : "-1"));
  }

  /** Brings the tab order in line with the items now: the active one stays active if it still can. */
  update(): void {
    const items = this.#options.items();
    const usable = (i: number): boolean =>
      items[i] !== undefined && !this.#options.isDisabled(items[i]);
    const start = usable(this.#active) ? this.#active : items.findIndex((_, i) => usable(i));
    this.setActive(Math.max(start, 0));
  }

  readonly #focusIn = (event: FocusEvent): void => {
    const items = this.#options.items();
    const index = items.findIndex(
      (item) => item === event.target || item.contains(event.target as Node),
    );
    if (index >= 0 && index !== this.#active) this.setActive(index);
  };

  readonly #keyDown = (event: KeyboardEvent): void => {
    const step = this.#step(event.key);
    const items = this.#options.items();
    const usable = (i: number): boolean => !this.#options.isDisabled(items[i]!);
    let next: number | undefined;
    if (event.key === "Home") next = items.findIndex((_, i) => usable(i));
    else if (event.key === "End") next = items.findLastIndex((_, i) => usable(i));
    else if (step !== 0) {
      let i = this.#active;
      for (let n = 0; n < items.length; n++) {
        i += step;
        if (i < 0 || i >= items.length) {
          if (!this.#options.wrap) break;
          i = (i + items.length) % items.length;
        }
        if (usable(i)) {
          next = i;
          break;
        }
      }
    }
    if (next === undefined || next < 0 || next === this.#active) {
      if (next !== undefined || step !== 0 || event.key === "Home" || event.key === "End")
        event.preventDefault();
      return;
    }
    event.preventDefault();
    this.setActive(next);
    items[next]!.focus();
  };

  /** -1 or +1 for an arrow key this group handles, else 0. */
  #step(key: string): number {
    const { orientation } = this.#options;
    const rtl = getComputedStyle(this.#host).direction === "rtl";
    if (
      (orientation === "horizontal" || orientation === "both") &&
      (key === "ArrowRight" || key === "ArrowLeft")
    ) {
      const forward = (key === "ArrowRight") !== rtl;
      return forward ? 1 : -1;
    }
    if (
      (orientation === "vertical" || orientation === "both") &&
      (key === "ArrowDown" || key === "ArrowUp")
    )
      return key === "ArrowDown" ? 1 : -1;
    return 0;
  }
}
