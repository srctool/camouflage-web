import { iconBase } from "@srctool/camouflage-core";
import type { IconSlots, IconState, IconStyle, Renderer } from "@srctool/camouflage-core";

/** Carbon's icon. */
export const carbonIcon: Renderer<IconState, IconSlots, IconStyle> = {
  ...iconBase,
  defaults() {
    return { defaultSize: "24px" };
  },
};
