import { surfaceBase } from "@srctool/camouflage-core";
import type { Renderer, SurfaceSlots, SurfaceState, SurfaceStyle } from "@srctool/camouflage-core";

const field = (name: string, fallback: string): string =>
  `var(--camo-surface-${name}, ${fallback})`;

/** Cupertino's surface: Classic material, a hairline outline in `outlineVariant` when asked. */
export const cupertinoSurface: Renderer<SurfaceState, SurfaceSlots, SurfaceStyle> = {
  ...surfaceBase,
  defaults(theme) {
    return {
      borderWidth: field("border-width", "0.5px"),
      borderColor: field("border-color", theme.colors.outlineVariant),
    };
  },
};
