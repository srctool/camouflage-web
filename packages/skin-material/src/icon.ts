import { iconBase } from "@srctool/camouflage-core";
import type { IconSlots, IconState, IconStyle, Renderer } from "@srctool/camouflage-core";

/** Material's icon. */
export const materialIcon: Renderer<IconState, IconSlots, IconStyle> = {
  ...iconBase,
  defaults() {
    return { defaultSize: "24px" };
  },
};
