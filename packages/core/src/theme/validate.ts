import { contrastRatio, parseColor } from "./color.ts";
import type { Rgb } from "./color.ts";
import {
  COLOR_ROLES,
  ELEVATION_ROLES,
  MOTION_ROLES,
  SHAPE_ROLES,
  SPACING_ROLES,
} from "./schema.ts";
import { tokenSetVar } from "./css.ts";
import type { CamoColors, CamoTheme } from "./types.ts";

/** A problem `validateTheme` found. It reports; it never throws and never corrects a brand's colors. */
export type ThemeIssue =
  /** A color role is empty or missing (a generated theme). */
  | { kind: "MissingRole"; role: string }
  /** `pair` is `"onX/x"`; WCAG 2.2 AA asks for 4.5:1 for text and 3:1 for non-text. */
  | { kind: "LowContrast"; pair: string; ratio: number; required: number }
  /** A negative radius, spacing, elevation or duration, or a value that is not a length or a time. */
  | { kind: "InvalidValue"; token: string; value: string }
  /** Two token sets that write the same custom property: the later one shadows the other. */
  | { kind: "DuplicateTokenSet"; key: string };

const TEXT = 4.5;
const NON_TEXT = 3;

// Every `onX` on its `x`, as the Kotlin validator lists them.
const PAIRS: readonly (readonly [keyof CamoColors, keyof CamoColors])[] = [
  ["onPrimary", "primary"],
  ["onPrimaryContainer", "primaryContainer"],
  ["onSecondary", "secondary"],
  ["onSecondaryContainer", "secondaryContainer"],
  ["onTertiary", "tertiary"],
  ["onTertiaryContainer", "tertiaryContainer"],
  ["onError", "error"],
  ["onErrorContainer", "errorContainer"],
  ["onSuccess", "success"],
  ["onSuccessContainer", "successContainer"],
  ["onWarning", "warning"],
  ["onWarningContainer", "warningContainer"],
  ["onInfo", "info"],
  ["onInfoContainer", "infoContainer"],
  ["inverseOnSurface", "inverseSurface"],
];

const SURFACES: readonly (keyof CamoColors)[] = [
  "surface",
  "surfaceContainerLowest",
  "surfaceContainerLow",
  "surfaceContainer",
  "surfaceContainerHigh",
  "surfaceContainerHighest",
];

/** The value of `var(--name)` or `var(--name, fallback)` when the name is one of the theme's own token-set variables. */
function resolveColor(value: string, vars: ReadonlyMap<string, string>, depth = 0): Rgb | null {
  const direct = parseColor(value);
  if (direct !== null || depth > 4) return direct;
  const ref = /^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/.exec(value.trim());
  if (ref === null) return null;
  const target = vars.get(ref[1]!) ?? ref[2];
  return target === undefined ? null : resolveColor(target, vars, depth + 1);
}

/** A CSS length or time as a number, or `null` for anything that is not a plain one (`var()`, `calc()`, a keyword). */
function plainNumber(value: string): number | null {
  const m = /^\s*(-?\d+(?:\.\d+)?|-?\.\d+)\s*(px|rem|em|ms|s|%|vh|vw|vmin|vmax)?\s*$/.exec(value);
  return m === null ? null : Number(m[1]);
}

/**
 * Reports contrast and value problems, the same checks as `validate()` in Kotlin and Dart (base Theme §3.13).
 * A color that is a `var()` of one of the theme's own token sets is resolved; one that cannot be resolved here
 * (the page defines it) is skipped, because its value is not known before the page runs.
 */
export function validateTheme(theme: CamoTheme): ThemeIssue[] {
  const issues: ThemeIssue[] = [];

  // Token set variables, and any that two sets both write.
  const vars = new Map<string, string>();
  for (const [set, entries] of Object.entries(theme.tokenSets ?? {})) {
    for (const [name, value] of Object.entries(entries)) {
      const key = tokenSetVar(set, name);
      if (vars.has(key)) issues.push({ kind: "DuplicateTokenSet", key });
      vars.set(key, value);
    }
  }

  // Missing roles come first: the pairs below cannot be checked without them.
  const missing = new Set<string>();
  for (const role of COLOR_ROLES) {
    const value = (theme.colors as unknown as Partial<Record<string, string>>)[role];
    if (value === undefined || value.trim() === "") {
      missing.add(role);
      issues.push({ kind: "MissingRole", role: `colors.${role}` });
    }
  }

  const color = (role: keyof CamoColors): Rgb | null =>
    missing.has(role) ? null : resolveColor(theme.colors[role], vars);
  const check = (
    pair: string,
    content: Rgb | null,
    background: Rgb | null,
    required: number,
  ): void => {
    if (content === null || background === null) return;
    const ratio = contrastRatio(content, background);
    if (ratio < required) issues.push({ kind: "LowContrast", pair, ratio, required });
  };

  for (const [on, base] of PAIRS) check(`${on}/${base}`, color(on), color(base), TEXT);
  for (const name of SURFACES) {
    check(`onSurface/${name}`, color("onSurface"), color(name), TEXT);
    check(`onSurfaceVariant/${name}`, color("onSurfaceVariant"), color(name), TEXT);
  }
  check("outline/surface", color("outline"), color("surface"), NON_TEXT);

  // Values that cannot be negative; the order is the Kotlin one (spacing, elevation, motion, shapes).
  const negative = (group: string, names: readonly string[], values: object): void => {
    for (const name of names) {
      const value = (values as Record<string, string | undefined>)[name];
      if (value === undefined) continue;
      const n = plainNumber(value);
      if (n !== null && n < 0)
        issues.push({ kind: "InvalidValue", token: `${group}.${name}`, value });
    }
  };
  negative("spacing", SPACING_ROLES, theme.spacing);
  negative("elevation", ELEVATION_ROLES, theme.elevation);
  negative(
    "motion",
    MOTION_ROLES.filter((r) => r.startsWith("duration")),
    theme.motion,
  );
  negative("shapes", SHAPE_ROLES, theme.shapes);
  return issues;
}
