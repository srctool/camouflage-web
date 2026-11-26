import type { SurfaceTreatment } from "@srctool/camouflage-core";
import { html } from "lit";

const FILL =
  "display: inline-flex; flex: 1 1 auto; align-items: center; justify-content: center; box-sizing: border-box;";
const BLOCK = "display: block; box-sizing: border-box; inline-size: 100%; overflow: hidden;";

/**
 * Layered: every level is an opaque layer color with no shadow, except overlays (level 3 and up), which get Carbon's
 * one overlay shadow. No materials, so no capability is read (ADR-42).
 */
export const layered: SurfaceTreatment = {
  decorate({ child, color, shape, elevation, border, block }) {
    const shadow = /level[345]/.test(elevation)
      ? " box-shadow: 0 2px 6px color-mix(in srgb, var(--camo-color-scrim) 30%, transparent);"
      : "";
    const style =
      `${block === true ? BLOCK : FILL} background: ${color}; border-radius: ${shape};${shadow}` +
      (border === undefined ? "" : ` border: ${border};`);
    return html`<span class="camo-surface" style=${style}>${child}</span>`;
  },
};
