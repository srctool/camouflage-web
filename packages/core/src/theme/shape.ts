import {
  COLOR_ROLES,
  ELEVATION_ROLES,
  MOTION_ROLES,
  SHAPE_ROLES,
  SPACING_ROLES,
  TEXT_STYLE_FIELDS,
  TYPE_ROLES,
} from "./schema.ts";
import { createTokens } from "./tokens.ts";
import type { CamoTheme } from "./types.ts";

const blank = <K extends string>(names: readonly K[]): Record<K, string> =>
  Object.fromEntries(names.map((n) => [n, ""])) as Record<K, string>;

/** A complete theme with empty values: the shape the token references are derived from. */
const shape = {
  colors: blank(COLOR_ROLES),
  typography: Object.fromEntries(TYPE_ROLES.map((t) => [t, blank(TEXT_STYLE_FIELDS)])),
  components: {},
  shapes: blank(SHAPE_ROLES),
  spacing: blank(SPACING_ROLES),
  elevation: blank(ELEVATION_ROLES),
  motion: blank(MOTION_ROLES),
  tokenSets: {},
} as unknown as CamoTheme;

/**
 * The theme as references: `tokens.colors.primary` is `"var(--camo-color-primary)"`. A renderer's `theme` argument is
 * this object, so its CSS reads the live theme without any theme value passing through JavaScript.
 */
export const tokens: CamoTheme = createTokens(shape);
