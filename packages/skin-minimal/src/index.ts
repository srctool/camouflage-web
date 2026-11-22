import { defineSkin } from "@srctool/camouflage-core";
import type { CamoSkin } from "@srctool/camouflage-core";
import { minimalButton } from "./button.ts";
import { minimalDialog } from "./dialog.ts";
import { fade } from "./feedback.ts";
import { flat } from "./surface.ts";

/**
 * The Minimal skin: flat, hairlines, an ink primary. The main entry has no side effects (`register` is the opt-in
 * one); every renderer is exported on its own so another skin can borrow it.
 */
export const minimalSkin: CamoSkin = defineSkin({
  name: "minimal",
  surfaceTreatment: flat,
  feedback: fade,
  button: minimalButton,
  dialog: minimalDialog,
});

export { minimalButton, minimalDialog, flat, fade };
export { minimalThemes } from "./theme.ts";
