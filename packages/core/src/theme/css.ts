import { varName } from "./tokens.ts";
import type { CamoTheme, PartialTheme } from "./types.ts";

/** The `--camo-*` declarations for a theme (complete or partial), one per line. */
export function themeDeclarations(theme: PartialTheme<CamoTheme>): string {
  const lines: string[] = [];
  const walk = (value: unknown, path: readonly string[]): void => {
    if (typeof value === "string") {
      lines.push(`${varName(path)}: ${value};`);
    } else if (value !== null && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) walk(child, [...path, key]);
    }
  };
  walk(theme, []);
  return lines.join("\n");
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
    `@media (prefers-reduced-motion: reduce) { :host { --camo-motion-duration-short: 0ms !important; --camo-motion-duration-medium: 0ms !important; } }`,
  ].join("\n");
}
