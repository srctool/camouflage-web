import { css } from "lit";
import { scrollbarBase, splitPaneBase } from "@srctool/camouflage-core";
import type { CamoSkin } from "@srctool/camouflage-core";

/** A component-theme field as a custom property with the skin's default: `--camo-scrollbar-thickness`. */
const field = (component: string, name: string, fallback: string): string =>
  `var(--camo-${component}-${name}, ${fallback})`;

// A divider that thickens on hover; a 2 px line that becomes a 12 px thumb.

/** Fluent's split pane divider. */
export const fluentSplitPane: CamoSkin["splitPane"] = {
  ...splitPaneBase,
  styles: [
    splitPaneBase.styles ?? [],
    css`
      .divider:hover .line {
        inset: calc(var(--camo-spacing-xxs) / -2);
      }
    `,
  ],
  defaults(theme) {
    const c = theme.colors;
    return {
      thickness: field("split-pane", "thickness", "1px"),
      hitSize: field("split-pane", "hit-size", "8px"),
      keyStep: field("split-pane", "key-step", "16px"),
      keyStepLarge: field("split-pane", "key-step-large", "64px"),
      line: `var(--fluent-neutral-stroke2, ${c.outlineVariant})`,
      hover: c.outline,
      dragging: c.primary,
      focus: c.primary,
      grip: false,
    };
  },
};

/** Fluent's scrollbar. */
export const fluentScrollbar: CamoSkin["scrollbar"] = {
  ...scrollbarBase,
  defaults(theme) {
    const c = theme.colors;
    const veil = (share: string): string =>
      `color-mix(in srgb, ${c.onSurfaceVariant} ${share}, transparent)`;
    return {
      thickness: field("scrollbar", "thickness", "2px"),
      hoverThickness: field("scrollbar", "hover-thickness", "12px"),
      minThumb: field("scrollbar", "min-thumb", "32px"),
      visibility: "on-scroll",
      hideDelay: field("scrollbar", "hide-delay", "1200ms"),
      thumb: veil("45%"),
      thumbHover: veil("70%"),
      thumbDrag: c.onSurfaceVariant,
      track: c.surfaceContainer,
    };
  },
};
