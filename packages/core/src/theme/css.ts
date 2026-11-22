import { kebab, varName } from "./tokens.ts";
import type { CamoTheme, PartialTheme } from "./types.ts";

/**
 * The custom property for one entry of a brand's token set, in the brand's own naming and unprefixed:
 * `("brand", "600")` is `--brand-600`, `("radius", "card")` is `--radius-card`.
 */
export function tokenSetVar(set: string, name: string): string {
  return `--${kebab(set)}-${kebab(name)}`;
}

/** The custom property of one component-theme field: `("button", "paddingWithIcon")` is `--camo-button-padding-with-icon`. */
export function componentVar(component: string, field: string): string {
  return `--camo-${kebab(component)}-${kebab(field)}`;
}

/** The `[name, value]` pairs of a theme (complete or partial): the one place a theme becomes custom properties. */
export function themeEntries(theme: PartialTheme<CamoTheme>): [string, string][] {
  const out: [string, string][] = [];
  for (const [group, value] of Object.entries(theme)) {
    if (value === undefined || value === null || typeof value !== "object") continue;
    if (group === "tokenSets") {
      for (const [set, entries] of Object.entries(value as Record<string, Record<string, string>>))
        for (const [name, v] of Object.entries(entries)) out.push([tokenSetVar(set, name), v]);
    } else if (group === "components") {
      for (const [component, fields] of Object.entries(
        value as Record<string, Record<string, string>>,
      ))
        for (const [field, v] of Object.entries(fields))
          out.push([componentVar(component, field), v]);
    } else {
      const walk = (node: unknown, path: readonly string[]): void => {
        if (typeof node === "string") out.push([varName(path), node]);
        else if (node !== null && typeof node === "object")
          for (const [key, child] of Object.entries(node)) walk(child, [...path, key]);
      };
      walk(value, [group]);
    }
  }
  return out;
}

/** The `--camo-*` declarations for a theme (complete or partial), one per line. */
export function themeDeclarations(theme: PartialTheme<CamoTheme>): string {
  return themeEntries(theme)
    .map(([name, value]) => `${name}: ${value};`)
    .join("\n");
}

/**
 * Writes a theme's variables on an element (`applyTheme(element, theme)`), so a theme applies without a provider and
 * a nested element changes only the variables it is given. Nothing is removed: a partial theme adds to what the
 * element already carries. The server side of the same thing is `themeDeclarations` and `schemeStylesheet`.
 */
export function applyTheme(element: HTMLElement, theme: PartialTheme<CamoTheme>): void {
  for (const [name, value] of themeEntries(theme)) element.style.setProperty(name, value);
}

/**
 * The stylesheet a provider carries: the light block on the host, the dark block when the effective scheme
 * (`data-camo-scheme`, set by the provider from its own `scheme` or the one above) is dark, and the dark block again
 * under `prefers-color-scheme: dark` when no scheme is set anywhere. Everything here is a custom property, so it
 * crosses shadow roots and is correct on the first byte of server-rendered HTML.
 */
export function schemeStylesheet(light: string, dark: string): string {
  return [
    `:host { ${light} }`,
    `:host([data-camo-scheme="dark"]) { ${dark} }`,
    `@media (prefers-color-scheme: dark) { :host(:not([data-camo-scheme])) { ${dark} } }`,
    // Reduced motion zeroes the durations for the subtree (Provider note: system adjustments).
    `@media (prefers-reduced-motion: reduce) { :host { --camo-motion-duration-short: 0ms !important; --camo-motion-duration-medium: 0ms !important; --camo-motion-duration-long: 0ms !important; } }`,
  ].join("\n");
}

/**
 * What a provider resets for its subtree (Provider note, section 2): the content color text and icons use when no
 * container sets one, and the icon size. Containers (a solid button, a card) set these two variables for their own
 * content, and text reads `color`, so nothing outside a container is unreadable.
 */
export const CONTENT_RESET =
  ":host { color: var(--camo-content-color); --camo-content-color: var(--camo-color-on-surface); --camo-icon-size: 24px; }";
