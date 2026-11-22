import { iconBase } from "@srctool/camouflage-core";
import type { IconSlots, IconState, IconStyle, Renderer } from "@srctool/camouflage-core";

/** minimal's icon: 24px unless the container says otherwise, in the content color. */
export const minimalIcon: Renderer<IconState, IconSlots, IconStyle> = {
  ...iconBase,
  defaults() {
    return { defaultSize: "24px" };
  },
};
