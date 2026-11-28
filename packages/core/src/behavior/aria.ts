import { isServer } from "lit";

/** What a component says about itself to assistive technology. */
export interface AriaState {
  role: string;
  label?: string | null;
  disabled?: boolean;
  busy?: boolean;
  /** Decorative: left out of the accessibility tree (an icon with no label, a divider). */
  hidden?: boolean;
  /** A toggle button's state: `true` or `false` makes it a toggle, `null` or absent does not. */
  pressed?: boolean | null;
  /** A checkbox, radio or switch: `true`, `false`, or `"mixed"` for a checkbox that is neither. */
  checked?: boolean | "mixed" | null;
  /** The control's value fails its rules. */
  invalid?: boolean;
  required?: boolean;
  /** What activating it opens, and whether that is open now (a submenu's row). */
  hasPopup?: "menu" | null;
  expanded?: boolean | null;
  /** A second line of help: a description, a supporting text (not part of the name). */
  description?: string | null;
  /** A slider or spinbutton's value, range and its text. */
  value?: { now: number; min: number; max: number; text?: string | null };
  orientation?: "horizontal" | "vertical";
  /** Place in a set: "2 of 3". */
  position?: { index: number; size: number };
  /** A tab or option's selection (`aria-selected`). */
  selected?: boolean | null;
  /** The item that is the current page in a navigation (`aria-current="page"`). */
  current?: "page" | null;
  /** A live region: `status` and `alert` roles imply it; this sets the politeness explicitly. */
  live?: "polite" | "assertive" | null;
}

const MARKER = "data-camo-ssr-aria";

// What each host last said about itself. `ElementInternals` is invisible to axe and to Playwright's role engine
// (they read attributes), so tests and the Storybook accessibility panel read this instead.
const applied = new WeakMap<HTMLElement, AriaState>();

/** The role, name and state a component set through `ElementInternals` (a testing and tooling aid). */
export function inspectAria(host: HTMLElement): Readonly<AriaState> | undefined {
  return applied.get(host);
}

/**
 * Applies role, name and state through `ElementInternals` (so no id has to cross a shadow root), and on the server
 * also as real attributes, because the server renderer mirrors only what a constructor sets. The client removes the
 * mirrored attributes at its first update, so the internals take over and a later change can't be shadowed by a
 * stale attribute (an author attribute always wins over `ElementInternals`).
 */
export function applyAria(host: HTMLElement, internals: ElementInternals, aria: AriaState): void {
  applied.set(host, aria);
  internals.role = aria.role;
  internals.ariaLabel = aria.label ?? null;
  internals.ariaDisabled = aria.disabled ? "true" : null;
  internals.ariaBusy = aria.busy ? "true" : null;
  internals.ariaHidden = aria.hidden ? "true" : null;
  internals.ariaChecked =
    aria.checked === undefined || aria.checked === null ? null : String(aria.checked);
  internals.ariaInvalid = aria.invalid ? "true" : null;
  internals.ariaHasPopup = aria.hasPopup ?? null;
  internals.ariaExpanded =
    aria.expanded === undefined || aria.expanded === null ? null : String(aria.expanded);
  internals.ariaRequired = aria.required ? "true" : null;
  internals.ariaDescription = aria.description ?? null;
  internals.ariaValueNow = aria.value === undefined ? null : String(aria.value.now);
  internals.ariaValueMin = aria.value === undefined ? null : String(aria.value.min);
  internals.ariaValueMax = aria.value === undefined ? null : String(aria.value.max);
  internals.ariaValueText = aria.value?.text ?? null;
  internals.ariaOrientation = aria.orientation ?? null;
  internals.ariaPosInSet = aria.position === undefined ? null : String(aria.position.index);
  internals.ariaSetSize = aria.position === undefined ? null : String(aria.position.size);
  internals.ariaPressed =
    aria.pressed === undefined || aria.pressed === null ? null : String(aria.pressed);
  internals.ariaSelected =
    aria.selected === undefined || aria.selected === null ? null : String(aria.selected);
  internals.ariaCurrent = aria.current ?? null;
  internals.ariaLive = aria.live ?? null;
  const attributes: Record<string, string | null> = {
    role: aria.role,
    "aria-label": aria.label ?? null,
    "aria-disabled": aria.disabled ? "true" : null,
    "aria-busy": aria.busy ? "true" : null,
    "aria-hidden": aria.hidden ? "true" : null,
    "aria-checked":
      aria.checked === undefined || aria.checked === null ? null : String(aria.checked),
    "aria-invalid": aria.invalid ? "true" : null,
    "aria-haspopup": aria.hasPopup ?? null,
    "aria-expanded":
      aria.expanded === undefined || aria.expanded === null ? null : String(aria.expanded),
    "aria-required": aria.required ? "true" : null,
    "aria-description": aria.description ?? null,
    "aria-valuenow": aria.value === undefined ? null : String(aria.value.now),
    "aria-valuemin": aria.value === undefined ? null : String(aria.value.min),
    "aria-valuemax": aria.value === undefined ? null : String(aria.value.max),
    "aria-valuetext": aria.value?.text ?? null,
    "aria-orientation": aria.orientation ?? null,
    "aria-posinset": aria.position === undefined ? null : String(aria.position.index),
    "aria-setsize": aria.position === undefined ? null : String(aria.position.size),
    "aria-pressed":
      aria.pressed === undefined || aria.pressed === null ? null : String(aria.pressed),
    "aria-selected":
      aria.selected === undefined || aria.selected === null ? null : String(aria.selected),
    "aria-current": aria.current ?? null,
    "aria-live": aria.live ?? null,
  };
  if (isServer) {
    const mirrored: string[] = [];
    for (const [name, value] of Object.entries(attributes)) {
      if (value === null) continue;
      host.setAttribute(name, value);
      mirrored.push(name);
    }
    host.setAttribute(MARKER, mirrored.join(" "));
  } else {
    const mirrored = host.getAttribute(MARKER);
    if (mirrored !== null) {
      for (const name of mirrored.split(" ")) host.removeAttribute(name);
      host.removeAttribute(MARKER);
    }
  }
}
