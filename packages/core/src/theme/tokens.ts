import type { CamoTheme } from "./types.ts";

/** `onPrimaryContainer` → `on-primary-container`. */
export function kebab(name: string): string {
  return name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/** The custom property for a path in the theme: `["colors", "onPrimary"]` → `--camo-color-on-primary`. */
export function varName(path: readonly string[]): string {
  const [group, ...rest] = path;
  // The Figma path names: colors → color, shapes → shape, typography → type (Theme §3.1 of the web notes).
  const head =
    group === "colors"
      ? "color"
      : group === "shapes"
        ? "shape"
        : group === "typography"
          ? "type"
          : (group ?? "");
  return `--camo-${[head, ...rest].map(kebab).join("-")}`;
}

function buildTokens(value: unknown, path: readonly string[]): unknown {
  if (typeof value === "string") return `var(${varName(path)})`;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    out[key] = buildTokens(child, [...path, key]);
  }
  return out;
}

/**
 * The theme's shape with every value replaced by a `var(--camo-…)` reference, built from a complete theme.
 * Renderers receive this as their `theme` argument and compose CSS from it; no color or size is ever a literal.
 */
export function createTokens(shape: CamoTheme): CamoTheme {
  return buildTokens(shape, []) as CamoTheme;
}
