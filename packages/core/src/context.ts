import { createContext } from "@lit/context";
import type { Context } from "@lit/context";
import type { CamoSkin, CamoEnvironment } from "./skin/types.ts";
import type { CamoScheme, CamoThemeSet } from "./theme/types.ts";

/** What the nearest provider tells its subtree about the skin. */
export interface SkinInfo {
  skin: CamoSkin;
}

/**
 * The effective theme, as data: a nested provider merges its own on top of this, and decides whether a skin switch
 * brings its starter theme (`explicit: false`) or keeps the outer one (`explicit: true`, the base inheritance rows).
 */
export interface ThemeInfo {
  theme: CamoThemeSet;
  explicit: boolean;
  /** The scheme in force, or `null` to follow `prefers-color-scheme`; a nested provider inherits it. */
  scheme: CamoScheme | null;
}

// Symbol.for keys, so two copies of core on one page share their contexts (Provider note, edge cases).
export const skinContext: Context<symbol, SkinInfo> = createContext<SkinInfo, symbol>(
  Symbol.for("@srctool/camouflage-core/skin"),
);
export const themeContext: Context<symbol, ThemeInfo> = createContext<ThemeInfo, symbol>(
  Symbol.for("@srctool/camouflage-core/theme"),
);
export const environmentContext: Context<symbol, CamoEnvironment> = createContext<
  CamoEnvironment,
  symbol
>(Symbol.for("@srctool/camouflage-core/environment"));
