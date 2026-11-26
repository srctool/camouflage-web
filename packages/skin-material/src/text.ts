import { textBase } from "@srctool/camouflage-core";
import type { Renderer, TextSlots, TextState, TextStyle } from "@srctool/camouflage-core";

/** Material's text. */
export const materialText: Renderer<TextState, TextSlots, TextStyle> = {
  ...textBase,
  defaults(theme) {
    return { linkColor: theme.colors.primary, linkDecoration: "underline" };
  },
};
