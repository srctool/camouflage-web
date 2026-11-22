import { nothing } from "lit";
import type { TemplateResult } from "lit";

/**
 * Flattens a template (and the templates, arrays and strings inside it) to text, with `${…}` values inlined. Used to
 * look at what a pure renderer produced without a DOM.
 */
export function flatten(value: unknown): string {
  if (value === nothing || value === null || value === undefined || value === false) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(flatten).join("");
  const result = value as TemplateResult;
  if (Array.isArray(result.strings)) {
    let out = "";
    result.strings.forEach((part, i) => {
      out += part;
      if (i < result.values.length) out += flatten(result.values[i]);
    });
    return out;
  }
  if (typeof (value as { cssText?: unknown }).cssText === "string")
    return (value as { cssText: string }).cssText;
  return String(value);
}
