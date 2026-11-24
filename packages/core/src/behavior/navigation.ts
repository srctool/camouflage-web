import type { ReactiveController, ReactiveControllerHost } from "lit";
import { RovingTabindexController } from "./roving.ts";
import type { CamoBeforeChangeDetail } from "./control.ts";
import type { NavPlacement } from "../skin/types.ts";

/** The part of a `camo-nav-item` the controller reads and sets. */
export interface NavItemLike extends HTMLElement {
  value: string;
  selected: boolean;
  disabled: boolean;
  placement: NavPlacement;
}

export const NAV_PICK = "camo-nav-pick";

/** The host of a navigation chrome: it has a `value`, and the controller keeps its items in step. */
export interface NavHost extends ReactiveControllerHost, HTMLElement {
  value: string;
  disabled?: boolean;
}

/**
 * What the bar, the rail and the drawer share: the selected item, the items' place ("bar", "rail" or "drawer") and
 * selection, a roving tab stop with the arrow keys of the chrome's direction, and the events. A pick asks first with a
 * cancelable `camo-before-change`, then sets `value` and fires `change`; picking the current item again fires
 * `camo-reselect` (apps scroll to top). Routing stays with the app's router: the chrome only shows and reports the selection.
 */
export class NavigationController implements ReactiveController {
  readonly #host: NavHost;
  readonly #placement: NavPlacement;
  readonly #roving: RovingTabindexController;

  constructor(host: NavHost, placement: NavPlacement) {
    this.#host = host;
    this.#placement = placement;
    host.addController(this);
    this.#roving = new RovingTabindexController(host, {
      items: () => this.items(),
      orientation: placement === "bar" ? "horizontal" : "vertical",
      wrap: false,
    });
  }

  hostConnected(): void {
    this.#host.addEventListener(NAV_PICK, this.#onPick as EventListener);
  }

  hostDisconnected(): void {
    this.#host.removeEventListener(NAV_PICK, this.#onPick as EventListener);
  }

  /** Every `camo-nav-item` inside the host, in order (also those inside a `camo-nav-section`). */
  items(): NavItemLike[] {
    return [...this.#host.querySelectorAll<NavItemLike>("camo-nav-item")];
  }

  /** Puts the items' state in line with `value`; call it after every update and when the items change. */
  sync(): void {
    const items = this.items();
    for (const item of items) {
      item.placement = this.#placement;
      item.selected = item.value === this.#host.value;
      item.disabled = item.hasAttribute("disabled") || this.#host.disabled === true;
    }
    const at = items.findIndex((i) => i.selected && !i.disabled);
    this.#roving.setActive(at >= 0 ? at : 0);
    this.#roving.update();
    if (at >= 0) this.#roving.setActive(at);
  }

  readonly #onPick = (event: Event): void => {
    event.stopPropagation();
    const item = event.target as NavItemLike;
    if (item.disabled || this.#host.disabled === true) return;
    if (item.value === this.#host.value) {
      this.#host.dispatchEvent(
        new CustomEvent("camo-reselect", {
          detail: { value: item.value },
          bubbles: true,
          composed: true,
        }),
      );
      return;
    }
    const proceed = this.#host.dispatchEvent(
      new CustomEvent<CamoBeforeChangeDetail<string>>("camo-before-change", {
        detail: { value: item.value },
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
    if (!proceed) return;
    this.#host.value = item.value;
    this.#host.dispatchEvent(new Event("change", { bubbles: true }));
  };
}
