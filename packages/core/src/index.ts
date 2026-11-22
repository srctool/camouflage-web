// The main entry: types, the registry and the element classes. Importing it defines nothing and touches no browser
// API, so it is safe on a server and for type-only use. Import "@srctool/camouflage-core/define" to register elements.
// The global tag and event maps, generated from the manifest (`pnpm typings`).
export type {} from "./elements.ts";
export { CamoProvider } from "./provider/camo-provider.ts";
export { CamoButton } from "./components/button.ts";
export { CamoDialog } from "./components/dialog.ts";
export type { CamoCloseDetail } from "./components/dialog.ts";
export { showCamoDialog } from "./components/overlay.ts";
export type { DialogAction, ShowDialogOptions } from "./components/overlay.ts";
export { defineElement } from "./define-element.ts";
export { inspectAria } from "./behavior/aria.ts";
export { attachActivation } from "./behavior/activation.ts";
export { PRESSED_ATTRIBUTE, PressController } from "./behavior/press.ts";
export {
  FOCUS_RING,
  TABBABLE,
  hasVisibleFocus,
  initialFocusTarget,
  rememberFocus,
  tabbables,
} from "./behavior/focus.ts";
export { RovingTabindexController } from "./behavior/roving.ts";
export type { Orientation, RovingOptions } from "./behavior/roving.ts";
export { reportFormState, setCustomState } from "./behavior/internals.ts";
export type { FormState } from "./behavior/internals.ts";
export { contentVariables } from "./behavior/content.ts";
export type { AriaState } from "./behavior/aria.ts";
export { CamouflageController, camouflage, defaultEnvironment, warnOnce } from "./controller.ts";
export {
  BREAKPOINTS,
  browserSources,
  environmentSources,
  measure,
  setEnvironmentSources,
  watchEnvironment,
  windowSizeOf,
} from "./environment.ts";
export type { EnvironmentSources, Measured, WatchedQuery } from "./environment.ts";
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
export {
  applyTheme,
  componentVar,
  themeDeclarations,
  themeEntries,
  schemeStylesheet,
  tokenSetVar,
} from "./theme/css.ts";
export { validateTheme } from "./theme/validate.ts";
export type { ThemeIssue } from "./theme/validate.ts";
export { contrastRatio, parseColor } from "./theme/color.ts";
export {
  DEFAULT_ELEVATION,
  DEFAULT_MOTION,
  DEFAULT_SHAPES,
  DEFAULT_SPACING,
  SYSTEM_FONT,
  rem,
  systemTypography,
} from "./theme/system.ts";
export {
  COLOR_ROLES,
  COMPONENT_FIELDS,
  ELEVATION_ROLES,
  MOTION_ROLES,
  SHAPE_ROLES,
  SPACING_ROLES,
  TYPE_ROLES,
} from "./theme/schema.ts";
export { tokens } from "./theme/shape.ts";
export { kebab, varName, createTokens } from "./theme/tokens.ts";
export type * from "./theme/types.ts";
export {
  COMPONENT_NAMES,
  assertCompleteSkin,
  defineSkin,
  inProgressSkin,
  missingRenderers,
} from "./skin/define.ts";
export { classic, flat } from "./skin/surfaces.ts";
export { fade, opacity } from "./skin/feedback.ts";
export type * from "./skin/types.ts";
