// The main entry: types, the registry and the element classes. Importing it defines nothing and touches no browser
// API, so it is safe on a server and for type-only use. Import "@srctool/camouflage-core/define" to register elements.
export { CamoProvider } from "./provider/camo-provider.ts";
export { CamoButton } from "./components/button.ts";
export { CamoDialog } from "./components/dialog.ts";
export type { CamoCloseDetail } from "./components/dialog.ts";
export { showCamoDialog } from "./components/overlay.ts";
export type { DialogAction, ShowDialogOptions } from "./components/overlay.ts";
export { defineElement } from "./define-element.ts";
export { inspectAria } from "./behavior/aria.ts";
export type { AriaState } from "./behavior/aria.ts";
export { CamouflageController, defaultEnvironment, warnOnce } from "./controller.ts";
export { skinContext, themeContext, environmentContext } from "./context.ts";
export type { SkinInfo, ThemeInfo } from "./context.ts";
export {
  registerSkin,
  resolveSkin,
  starterTheme,
  fallbackSkin,
  registeredSkinNames,
} from "./skin/registry.ts";
export type { SkinRegistration } from "./skin/registry.ts";
export { cssBlock, cssText, textStyleCss } from "./style.ts";
export { buttonColorsFor } from "./skin/colors.ts";
export { createCamoTheme } from "./theme/merge.ts";
export { themeDeclarations, schemeStylesheet } from "./theme/css.ts";
export { tokens } from "./theme/shape.ts";
export { kebab, varName, createTokens } from "./theme/tokens.ts";
export type * from "./theme/types.ts";
export type * from "./skin/types.ts";
