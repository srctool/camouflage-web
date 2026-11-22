import type { CamoSkin, InProgressSkin, SkinComponents } from "./types.ts";

type ComponentName = keyof SkinComponents;

// Every key of `SkinComponents`, once. The type below fails to compile when a component is added to the interface and
// not to this list, so the runtime check can never fall behind the contract.
const names = ["button", "dialog"] as const satisfies readonly ComponentName[];
type Missing = Exclude<ComponentName, (typeof names)[number]>;
const _complete: [Missing] extends [never] ? true : never = true;
void _complete;

/** The component names a complete skin provides a renderer for, in contract order. */
export const COMPONENT_NAMES: readonly ComponentName[] = names;

/** The renderers a skin lacks, by name (empty for a complete skin). */
export function missingRenderers(skin: InProgressSkin | CamoSkin): ComponentName[] {
  const have = skin as Partial<Record<ComponentName, unknown>>;
  return COMPONENT_NAMES.filter((name) => have[name] === undefined);
}

/** Throws, naming the missing renderers, unless `skin` is complete; a JavaScript skin has no compiler to say so. */
export function assertCompleteSkin(skin: InProgressSkin | CamoSkin): asserts skin is CamoSkin {
  const parts = ["surfaceTreatment", "feedback"] as const;
  const absent = [
    ...parts.filter((p) => (skin as unknown as Record<string, unknown>)[p] === undefined),
    ...missingRenderers(skin),
  ];
  if (typeof skin.name !== "string" || skin.name === "") absent.unshift("name" as never);
  if (absent.length > 0) {
    throw new TypeError(
      `Skin "${skin.name || "(unnamed)"}" is incomplete: missing ${absent.join(", ")}.`,
    );
  }
}

/**
 * Declares a complete skin. A missing renderer is a compile error naming it (the object does not satisfy
 * `CamoSkin`), and, for a caller without types, a thrown error naming the same. Returns the skin unchanged.
 *
 * ```ts
 * export const brandSkin = defineSkin({ ...minimalSkin, name: "brand", button: brandButton });
 * ```
 */
export function defineSkin<const S extends CamoSkin>(skin: S): S {
  assertCompleteSkin(skin);
  return skin;
}

/** Declares a skin that is still being written; see `InProgressSkin`. */
export function inProgressSkin<const S extends InProgressSkin>(skin: S): S {
  return skin;
}
