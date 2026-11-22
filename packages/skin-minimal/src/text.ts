import { textBase } from "@srctool/camouflage-core";
import type { Renderer, TextSlots, TextState, TextStyle } from "@srctool/camouflage-core";

/** minimal's text: the theme's type roles, links in the primary color (underline). */
export const minimalText: Renderer<TextState, TextSlots, TextStyle> = {
  ...textBase,
  defaults(theme) {
    return { linkColor: theme.colors.primary, linkDecoration: "underline" };
  },
};
