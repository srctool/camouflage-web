import { scrollbarBase, splitPaneBase } from "@srctool/camouflage-core";
import type { CamoSkin } from "@srctool/camouflage-core";

/** A component-theme field as a custom property with the skin's default: `--camo-scrollbar-thickness`. */
const field = (component: string, name: string, fallback: string): string =>
  `var(--camo-${component}-${name}, ${fallback})`;

// A hairline divider and an overlay thumb with no track.

/** Cupertino's split pane divider. */
export const cupertinoSplitPane: CamoSkin["splitPane"] = {
  ...splitPaneBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      thickness: field("split-pane", "thickness", "1px"),
      hitSize: field("split-pane", "hit-size", "8px"),
      keyStep: field("split-pane", "key-step", "16px"),
      keyStepLarge: field("split-pane", "key-step-large", "64px"),
      line: c.outlineVariant,
      hover: c.outline,
      dragging: c.primary,
      focus: c.primary,
      grip: false,
    };
  },
};

/** Cupertino's scrollbar. */
export const cupertinoScrollbar: CamoSkin["scrollbar"] = {
  ...scrollbarBase,
  defaults(theme) {
    const c = theme.colors;
    const veil = (share: string): string =>
      `color-mix(in srgb, ${c.onSurfaceVariant} ${share}, transparent)`;
    return {
      thickness: field("scrollbar", "thickness", "6px"),
      hoverThickness: field("scrollbar", "hover-thickness", "8px"),
      minThumb: field("scrollbar", "min-thumb", "32px"),
      visibility: "on-scroll",
      hideDelay: field("scrollbar", "hide-delay", "1200ms"),
      thumb: veil("45%"),
      thumbHover: veil("70%"),
      thumbDrag: c.onSurfaceVariant,
      track: "transparent",
    };
  },
};
