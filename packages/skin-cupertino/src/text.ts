import { textBase } from "@srctool/camouflage-core";
import type { Renderer, TextSlots, TextState, TextStyle } from "@srctool/camouflage-core";

/** cupertino's text: the theme's type roles, links in the primary color (none). */
export const cupertinoText: Renderer<TextState, TextSlots, TextStyle> = {
  ...textBase,
  defaults(theme) {
    return { linkColor: theme.colors.primary, linkDecoration: "none" };
  },
};
