import { dividerBase } from "@srctool/camouflage-core";
import type { DividerSlots, DividerState, DividerStyle, Renderer } from "@srctool/camouflage-core";

const field = (name: string, fallback: string): string =>
  `var(--camo-divider-${name}, ${fallback})`;

/** Cupertino's divider: a half-pixel `outlineVariant` hairline, inset by the large spacing. */
export const cupertinoDivider: Renderer<DividerState, DividerSlots, DividerStyle> = {
  ...dividerBase,
  defaults(theme) {
    return {
      thickness: field("thickness", "0.5px"),
      color: field("color", theme.colors.outlineVariant),
      startInset: field("start-inset", theme.spacing.l),
      endInset: field("end-inset", theme.spacing.l),
    };
  },
};
