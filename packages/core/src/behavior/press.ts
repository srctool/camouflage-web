import type { ReactiveController, ReactiveControllerHost } from "lit";

/** The attribute the controller sets while the host is pressed; feedback styles select it (`:host([data-camo-pressed])`). */
export const PRESSED_ATTRIBUTE = "data-camo-pressed";

/**
 * Tracks whether a host is being pressed, by pointer or by key, and reflects it as `data-camo-pressed`. CSS `:active`
 * covers the pointer only; a key press on a custom element has no `:active`, so Space and Enter would give no
 * feedback. A blocked host (disabled, busy) never shows as pressed.
 */
export class PressController implements ReactiveController {
  readonly #host: ReactiveControllerHost & HTMLElement;
  readonly #blocked: () => boolean;
  #pressed = false;

  constructor(host: ReactiveControllerHost & HTMLElement, blocked: () => boolean = () => false) {
    this.#host = host;
    this.#blocked = blocked;
    host.addController(this);
  }

  /** Whether the host is pressed now. */
  get pressed(): boolean {
    return this.#pressed;
  }

  hostConnected(): void {
    const host = this.#host;
    host.addEventListener("pointerdown", this.#pointerDown);
    host.addEventListener("keydown", this.#keyDown);
    host.addEventListener("keyup", this.#release);
    host.addEventListener("blur", this.#release);
    host.addEventListener("pointercancel", this.#release);
    host.addEventListener("lostpointercapture", this.#release);
    // A release anywhere ends the press: the pointer may be let go outside the host.
    globalThis.addEventListener?.("pointerup", this.#release);
  }

  hostDisconnected(): void {
    const host = this.#host;
    host.removeEventListener("pointerdown", this.#pointerDown);
    host.removeEventListener("keydown", this.#keyDown);
    host.removeEventListener("keyup", this.#release);
    host.removeEventListener("blur", this.#release);
    host.removeEventListener("pointercancel", this.#release);
    host.removeEventListener("lostpointercapture", this.#release);
    globalThis.removeEventListener?.("pointerup", this.#release);
    this.#set(false);
  }

  readonly #pointerDown = (event: PointerEvent): void => {
    // The primary button only: a right click opens a menu, it is not a press.
    if (event.button === 0) this.#set(!this.#blocked());
  };

  readonly #keyDown = (event: KeyboardEvent): void => {
    if (event.target !== this.#host || (event.key !== " " && event.key !== "Enter")) return;
    this.#set(!this.#blocked());
  };

  readonly #release = (): void => this.#set(false);

  #set(value: boolean): void {
    if (this.#pressed === value) return;
    this.#pressed = value;
    this.#host.toggleAttribute(PRESSED_ATTRIBUTE, value);
  }
}
