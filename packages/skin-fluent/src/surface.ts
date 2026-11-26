import type { SurfaceTreatment } from "@srctool/camouflage-core";
import { html } from "lit";

const FILL =
  "display: inline-flex; flex: 1 1 auto; align-items: center; justify-content: center; box-sizing: border-box;";
const BLOCK = "display: block; box-sizing: border-box; inline-size: 100%; overflow: hidden;";

// Fluent's grain: 2% noise over the tint (a data URI, so the skin ships no asset). Reduce Transparency removes it.
const NOISE = `url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22120%22 height=%22120%22 filter=%22url(%23n)%22 opacity=%220.02%22/%3E%3C/svg%3E')`;

/** Fluent's shadow ramp: an ambient layer and a key layer half the level down; level 0 casts none. */
function shadow(elevation: string): string {
  if (/level0/.test(elevation)) return "none";
  return `0 0 2px var(--fluent-shadow-ambient, rgb(0 0 0 / 0.12)), 0 calc(${elevation} / 2) ${elevation} var(--fluent-shadow-key, rgb(0 0 0 / 0.14))`;
}

function paint(
  args: Parameters<SurfaceTreatment["decorate"]>[0],
  background: string,
): ReturnType<SurfaceTreatment["decorate"]> {
  const { child, shape, elevation, border, block } = args;
  const style =
    `${block === true ? BLOCK : FILL} ${background} border-radius: ${shape}; box-shadow: ${shadow(elevation)};` +
    (border === undefined ? "" : ` border: ${border};`);
  return html`<span class="camo-surface" style=${style}>${child}</span>`;
}

/** Solid (the default): neutral fills with Fluent's shadows. */
export const solid: SurfaceTreatment = {
  decorate: (args) => paint(args, `background: ${args.color};`),
};

/**
 * Acrylic: flyouts, menus, dialogs and sheets (level 3 and up) are a 75% tint with grain over a 30 px blur of what is
 * behind. Without `backdropBlur` the tint is opaque and keeps the grain; with Reduce Transparency it is the Solid
 * surface (ADR-42). Everything lower is Solid.
 */
export const acrylic: SurfaceTreatment = {
  decorate(args) {
    if (!/level[345]/.test(args.elevation)) return solid.decorate(args);
    const tint = `color-mix(in srgb, ${args.color} calc(100% - var(--camo-blur-supported, 0) * 25%), transparent)`;
    const blur = "blur(calc(var(--camo-blur-supported, 0) * 30px))";
    return paint(
      args,
      `background: var(--camo-material-texture, ${NOISE}), ${tint}; -webkit-backdrop-filter: ${blur}; backdrop-filter: ${blur};`,
    );
  },
};

/**
 * Mica: where the window itself draws a material (a desktop shell reports `windowMaterial`), the base layers (the
 * window background and the navigation chrome, level 0 blocks) draw nothing so it shows through. A web page never
 * does, so there it is Solid (ADR-42).
 */
export const mica: SurfaceTreatment = {
  decorate(args) {
    if (!/level0/.test(args.elevation) || args.block !== true) return solid.decorate(args);
    return paint(args, `background: var(--camo-window-material, ${args.color});`);
  },
};
