import { textBase } from "@srctool/camouflage-core";
import type { Renderer, TextSlots, TextState, TextStyle } from "@srctool/camouflage-core";

/** Fluent's text. */
export const fluentText: Renderer<TextState, TextSlots, TextStyle> = {
  ...textBase,
  defaults(theme) {
    return { linkColor: theme.colors.primary, linkDecoration: "underline" };
  },
};
