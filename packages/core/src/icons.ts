import type { IconArtwork } from "./skin/types.ts";

/**
 * An icon as an app registers it: a string of path data (the `d` of one `<path>` in a 24 by 24 box), or an object with
 * the inside of an `<svg>`. The markup is trusted, like any markup the app ships; never register user input.
 */
export type IconDefinition =
  | string
  | {
      /** The inside of an `<svg>`: paths and shapes. */
      svg: string;
      /** The drawing box, `"0 0 24 24"` when absent. */
      viewBox?: string;
      /** Flip in right-to-left: a back arrow, a chevron. A `camo-icon`'s own `auto-mirror` attribute also does. */
      autoMirror?: boolean;
      /** A multicolor asset, never tinted. */
      original?: boolean;
    };

const DEFAULT_VIEW_BOX = "0 0 24 24";
// Per module, so two copies of the library each keep their own; the `Symbol.for` key shares one list between them.
const KEY = Symbol.for("@srctool/camouflage-core/icons");
type Registry = Map<string, IconDefinition>;
const registry: Registry = ((globalThis as { [KEY]?: Registry })[KEY] ??= new Map());

/** Registers icons by name, so `<camo-icon name="close">` draws them. A later registration of a name replaces the earlier. */
export function registerIcons(icons: Readonly<Record<string, IconDefinition>>): void {
  for (const [name, definition] of Object.entries(icons)) registry.set(name, definition);
}

/** The registered names, in registration order. */
export function registeredIconNames(): string[] {
  return [...registry.keys()];
}

/** The artwork for a name, or null when it is not registered. */
export function resolveIcon(name: string): (IconArtwork & ResolvedFlags) | null {
  const definition = registry.get(name);
  if (definition === undefined) return null;
  if (typeof definition === "string") {
    return { svg: `<path d="${escapeAttribute(definition)}"/>`, viewBox: DEFAULT_VIEW_BOX };
  }
  return {
    svg: definition.svg,
    viewBox: definition.viewBox ?? DEFAULT_VIEW_BOX,
    ...(definition.autoMirror === true ? { autoMirror: true } : {}),
    ...(definition.original === true ? { original: true } : {}),
  };
}

/** The flags an object definition carries; the element ORs them with its own attributes. */
export interface ResolvedFlags {
  autoMirror?: boolean;
  original?: boolean;
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
