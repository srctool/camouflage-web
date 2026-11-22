import { surfaceBase } from "@srctool/camouflage-core";
import type { Renderer, SurfaceSlots, SurfaceState, SurfaceStyle } from "@srctool/camouflage-core";

const field = (name: string, fallback: string): string =>
  `var(--camo-surface-${name}, ${fallback})`;

/** Minimal's surface: flat, with a one-pixel outline in `outlineVariant` when asked. */
export const minimalSurface: Renderer<SurfaceState, SurfaceSlots, SurfaceStyle> = {
  ...surfaceBase,
  defaults(theme) {
    return {
      borderWidth: field("border-width", "1px"),
      borderColor: field("border-color", theme.colors.outlineVariant),
    };
  },
};
