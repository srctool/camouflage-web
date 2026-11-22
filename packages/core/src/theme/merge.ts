import { COMPONENT_FIELDS } from "./schema.ts";
import type { CamoTheme, PartialTheme } from "./types.ts";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const at = (path: string, key: string): string => (path === "" ? key : `${path}.${key}`);

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
    const here = at(path, key);
    if (path === "components") {
      // A component theme is open at the component level only for the components the contract knows, and for the
      // fields each one has: the base has none of them until a brand sets one.
      const fields = (COMPONENT_FIELDS as Record<string, readonly string[] | undefined>)[key];
      if (fields === undefined) throw new TypeError(`Unknown theme key "${here}".`);
      out[key] = mergeFields(base[key], value, here, fields);
    } else if (path === "tokenSets") {
      // A token set is the brand's own: any name, any step, any CSS value.
      out[key] = mergeFields(base[key], value, here, undefined);
    } else if (!(key in base)) {
      throw new TypeError(`Unknown theme key "${here}".`);
    } else {
      out[key] = mergeInto(base[key], value, here);
    }
  }
  return out;
}

function mergeFields(
  base: unknown,
  partial: unknown,
  path: string,
  allowed: readonly string[] | undefined,
): Record<string, unknown> {
  if (!isRecord(partial)) throw new TypeError(`Theme path "${path}" has the wrong shape.`);
  const out: Record<string, unknown> = isRecord(base) ? { ...base } : {};
  for (const [key, value] of Object.entries(partial)) {
    const here = at(path, key);
    if (allowed !== undefined && !allowed.includes(key))
      throw new TypeError(`Unknown theme key "${here}".`);
    if (typeof value !== "string")
      throw new TypeError(`Theme value at "${here}" must be a string.`);
    out[key] = value;
  }
  return out;
}

/**
 * Deep-merges a partial theme onto a complete one. An unknown key is an error that names its path, never silently
 * ignored; the exceptions are the brand's own `tokenSets` (any name) and the fields of a known component theme.
 */
export function createCamoTheme(base: CamoTheme, partial: PartialTheme<CamoTheme>): CamoTheme {
  return mergeInto(base, partial, "") as CamoTheme;
}
