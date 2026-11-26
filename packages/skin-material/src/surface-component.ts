import { surfaceBase } from "@srctool/camouflage-core";
import type { Renderer, SurfaceSlots, SurfaceState, SurfaceStyle } from "@srctool/camouflage-core";

const field = (name: string, fallback: string): string =>
  `var(--camo-surface-${name}, ${fallback})`;

/** Material's surface. */
export const materialSurface: Renderer<SurfaceState, SurfaceSlots, SurfaceStyle> = {
  ...surfaceBase,
  defaults(theme) {
    return {
      borderWidth: field("border-width", "1px"),
      borderColor: field("border-color", theme.colors.outlineVariant),
    };
  },
};
