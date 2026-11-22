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
  internals.ariaPressed =
    aria.pressed === undefined || aria.pressed === null ? null : String(aria.pressed);
  const attributes: Record<string, string | null> = {
    role: aria.role,
    "aria-label": aria.label ?? null,
    "aria-disabled": aria.disabled ? "true" : null,
    "aria-busy": aria.busy ? "true" : null,
    "aria-hidden": aria.hidden ? "true" : null,
    "aria-pressed":
      aria.pressed === undefined || aria.pressed === null ? null : String(aria.pressed),
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
