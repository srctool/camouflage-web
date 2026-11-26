import { defineSkin, progressBarBase } from "@srctool/camouflage-core";
import type { CamoSkin } from "@srctool/camouflage-core";
import { css, unsafeCSS } from "lit";
import { materialSkin } from "./index.ts";
import { materialProgressBar } from "./status.ts";

/** The looks only this dialect draws; anything a brand could want on any skin is a theme field instead (ADR-28). */
export interface MaterialSkinOptions {
  /** M3 Expressive's wavy linear progress indicator. */
  expressiveProgress?: boolean;
}

// A wave cut out of the active bar: one period, repeated along it.
const WAVE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='10'%3E%3Cpath d='M0 5 Q10 0 20 5 T40 5' fill='none' stroke='black' stroke-width='4'/%3E%3C/svg%3E")`;

const wavy: CamoSkin["progressBar"] = {
  ...materialProgressBar,
  styles: [
    progressBarBase.styles ?? [],
    css`
      :host {
        --camo-progress-bar-bar-height: var(--camo-progress-bar-wave-height, 10px);
      }
      .fill {
        mask: ${unsafeCSS(WAVE)} repeat-x left center / var(--camo-progress-bar-wave-length, 40px)
          var(--camo-progress-bar-wave-height, 10px);
      }
    `,
  ],
};

/** The Material skin with options; with none it is `materialSkin`. */
export function createMaterialSkin(options: MaterialSkinOptions = {}): CamoSkin {
  return options.expressiveProgress === true
    ? defineSkin({ ...materialSkin, progressBar: wavy })
    : materialSkin;
}
