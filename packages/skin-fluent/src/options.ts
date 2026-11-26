import { defineSkin } from "@srctool/camouflage-core";
import type { CamoSkin } from "@srctool/camouflage-core";
import { fluentSkin } from "./index.ts";
import { acrylic, mica, solid } from "./surface.ts";

/** Fluent's surface materials. */
export type FluentSurface = "solid" | "acrylic" | "mica";

/** What `createFluentSkin` takes. */
export interface FluentSkinOptions {
  surface?: FluentSurface;
}

const SURFACES = { solid, acrylic, mica } as const;

/** The Fluent skin with a surface material; with none (or `solid`) it is `fluentSkin`. */
export function createFluentSkin(options: FluentSkinOptions = {}): CamoSkin {
  const surface = options.surface ?? "solid";
  return surface === "solid"
    ? fluentSkin
    : defineSkin({ ...fluentSkin, surfaceTreatment: SURFACES[surface] });
}
