import { textBase } from "@srctool/camouflage-core";
import type { Renderer, TextSlots, TextState, TextStyle } from "@srctool/camouflage-core";

/** Carbon's text. */
export const carbonText: Renderer<TextState, TextSlots, TextStyle> = {
  ...textBase,
  defaults(theme) {
    return { linkColor: theme.colors.primary, linkDecoration: "underline" };
  },
};
