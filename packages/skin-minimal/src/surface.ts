import { html } from "lit";
import type { SurfaceTreatment } from "@srctool/camouflage-core";

/** Minimal's surface: flat. A color, a shape, a hairline when asked, and no shadow. */
export const flat: SurfaceTreatment = {
  decorate({ child, color, shape, border }) {
    const style =
      `display: inline-flex; flex: 1 1 auto; align-items: center; justify-content: center; box-sizing: border-box;` +
      ` background: ${color}; border-radius: ${shape};${border === undefined ? "" : ` border: ${border};`}`;
    return html`<span class="camo-surface" style=${style}>${child}</span>`;
  },
};
