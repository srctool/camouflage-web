import type { CSSResult, CSSResultGroup, TemplateResult } from "lit";
import { html as staticHtml, unsafeStatic } from "lit/static-html.js";
import type { CamoTextStyle } from "./theme/types.ts";

/** The CSS text of a (possibly nested) group of results. */
export function cssText(group: CSSResultGroup | undefined): string {
  if (group === undefined) return "";
  if (Array.isArray(group)) return group.map((g) => cssText(g)).join("\n");
  return (group as CSSResult).cssText;
}

/**
 * A `<style>` element holding CSS that is part of the template's static strings, not a binding. That keeps server
 * rendering and hydration simple (a binding inside `<style>` has no comment markers to hydrate), and the same CSS
 * string reuses one compiled template.
 */
export function cssBlock(...parts: (CSSResultGroup | string | undefined)[]): TemplateResult {
  const text = parts.map((p) => (typeof p === "string" ? p : cssText(p))).join("\n");
  return staticHtml`<style>${unsafeStatic(text)}</style>`;
}

/** The `font` declarations for a text style (token references, so the live theme applies). */
export function textStyleCss(text: CamoTextStyle): string {
  return `font: ${text.weight} ${text.size}/${text.lineHeight} ${text.family}; letter-spacing: ${text.letterSpacing};`;
}
