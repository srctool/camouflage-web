import type { CamoSkin } from "@srctool/camouflage-core";
import { cupertinoButton } from "./button.ts";
import { cupertinoDialog } from "./dialog.ts";
import { opacity } from "./feedback.ts";
import { classic } from "./surface.ts";

/**
 * The Cupertino skin (Classic material; Liquid Glass arrives in W8): Apple's system colors, 44 pt controls, a dimming
 * press, and alerts whose actions stack. The main entry has no side effects.
 */
export const cupertinoSkin: CamoSkin = {
  name: "cupertino",
  surfaceTreatment: classic,
  feedback: opacity,
  button: cupertinoButton,
  dialog: cupertinoDialog,
} satisfies CamoSkin;

export { cupertinoButton, cupertinoDialog, classic, opacity };
export { cupertinoThemes } from "./theme.ts";
