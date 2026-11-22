import type { CamoTheme, PartialTheme } from "./types.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function mergeInto(base: unknown, partial: unknown, path: string): unknown {
  if (partial === undefined) return base;
  if (typeof base === "string") {
    if (typeof partial !== "string")
      throw new TypeError(`Theme value at "${path}" must be a string.`);
    return partial;
  }
  if (!isRecord(base) || !isRecord(partial))
    throw new TypeError(`Theme path "${path}" has the wrong shape.`);
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(partial)) {
    if (!(key in base)) throw new TypeError(`Unknown theme key "${path ? `${path}.` : ""}${key}".`);
    out[key] = mergeInto(base[key], value, path ? `${path}.${key}` : key);
  }
  return out;
}

/**
 * Deep-merges a partial theme onto a complete one (`createCamoTheme` in the notes). An unknown key is an error that
 * names its path, never silently ignored.
 */
export function createCamoTheme(base: CamoTheme, partial: PartialTheme<CamoTheme>): CamoTheme {
  return mergeInto(base, partial, "") as CamoTheme;
}
