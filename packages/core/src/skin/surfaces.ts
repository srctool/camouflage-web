import { html } from "lit";
import type { SurfaceTreatment } from "./types.ts";

const FILL =
  "display: inline-flex; flex: 1 1 auto; align-items: center; justify-content: center; box-sizing: border-box;";

const BLOCK = "display: block; box-sizing: border-box; overflow: hidden;";

/** Flat: a color, a shape, a hairline when asked, and no shadow (Minimal, Carbon). */
export const flat: SurfaceTreatment = {
  decorate({ child, color, shape, border, block }) {
    const style = `${block === true ? BLOCK : FILL} background: ${color}; border-radius: ${shape};${border === undefined ? "" : ` border: ${border};`}`;
    return html`<span class="camo-surface" style=${style}>${child}</span>`;
  },
};

/** Classic: an opaque fill with a soft shadow that grows with elevation (Cupertino Classic, Material's paper). */
export const classic: SurfaceTreatment = {
  decorate({ child, color, shape, elevation, border, block, theme }) {
    const shadow = `0 calc(${elevation} / 2) calc(${elevation} * 3) color-mix(in srgb, ${theme.colors.scrim} 30%, transparent)`;
    const style =
      `${block === true ? BLOCK : FILL} background: ${color}; border-radius: ${shape}; box-shadow: ${shadow};` +
      (border === undefined ? "" : ` border: ${border};`);
    return html`<span class="camo-surface" style=${style}>${child}</span>`;
  },
};
