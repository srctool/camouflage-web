import { iconBase } from "@srctool/camouflage-core";
import type { IconSlots, IconState, IconStyle, Renderer } from "@srctool/camouflage-core";

/** Fluent's icon. */
export const fluentIcon: Renderer<IconState, IconSlots, IconStyle> = {
  ...iconBase,
  defaults() {
    return { defaultSize: "24px" };
  },
};
