import { html } from "lit";
import type { SurfaceTreatment } from "@srctool/camouflage-core";

/** Cupertino Classic's surface: an opaque fill with a soft shadow for raised levels. (Liquid Glass arrives in W8.) */
export const classic: SurfaceTreatment = {
  decorate({ child, color, shape, elevation, border, theme }) {
    const shadow = `0 calc(${elevation} / 2) calc(${elevation} * 3) color-mix(in srgb, ${theme.colors.scrim} 30%, transparent)`;
    const style =
      `display: inline-flex; flex: 1 1 auto; align-items: center; justify-content: center; box-sizing: border-box;` +
      ` background: ${color}; border-radius: ${shape}; box-shadow: ${shadow};` +
      (border === undefined ? "" : ` border: ${border};`);
    return html`<span class="camo-surface" style=${style}>${child}</span>`;
  },
};
