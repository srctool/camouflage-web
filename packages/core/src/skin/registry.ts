import type { CamoThemeSet } from "../theme/types.ts";
import type { CamoSkin } from "./types.ts";

/** What a skin brings when it is registered: its starter theme, and whether it is the fallback. */
export interface SkinRegistration {
  /** The starter theme (light and dark); a provider with this skin and no theme of its own uses it. */
  theme: CamoThemeSet;
  /** Use this skin for a component with no provider (the Minimal fallback of the Provider note). */
  fallback?: boolean;
}

interface Entry extends SkinRegistration {
  skin: CamoSkin;
}

// A Symbol.for key, so two copies of core on one page share one registry.
const KEY = Symbol.for("@srctool/camouflage-core/registry");

interface Registry {
  skins: Map<string, Entry>;
  fallback: string | undefined;
}

function registry(): Registry {
  const holder = globalThis as unknown as Record<symbol, Registry | undefined>;
  return (holder[KEY] ??= { skins: new Map(), fallback: undefined });
}

/** Registers a skin by name, so `<camo-provider skin="cupertino">` can find it (the skin's `register` entry calls this). */
export function registerSkin(skin: CamoSkin, registration: SkinRegistration): void {
  const r = registry();
  r.skins.set(skin.name, { skin, ...registration });
  if (registration.fallback) r.fallback = skin.name;
}

/** The registered skin with this name, or `undefined`. */
export function resolveSkin(name: string): CamoSkin | undefined {
  return registry().skins.get(name)?.skin;
}

/** The starter theme of a registered skin. */
export function starterTheme(skin: CamoSkin): CamoThemeSet | undefined {
  return registry().skins.get(skin.name)?.theme;
}

/** The fallback skin for a component with no provider, if one is registered. */
export function fallbackSkin(): CamoSkin | undefined {
  const r = registry();
  return r.fallback === undefined ? undefined : r.skins.get(r.fallback)?.skin;
}

/** The names of the registered skins (for error messages). */
export function registeredSkinNames(): string[] {
  return [...registry().skins.keys()];
}
