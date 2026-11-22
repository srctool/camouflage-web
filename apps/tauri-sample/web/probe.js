// The platform features the plan relies on, probed in the engine that runs this script. Plain JavaScript on purpose:
// the same file runs in Playwright (Chromium, Firefox, WebKit) and in the Tauri webviews, and reports one JSON object.
// Each probe answers "does this engine do it", by using the feature, not by reading a version number.
globalThis.__camoProbeRun = async () => {
  const css = (property, value) => typeof CSS !== "undefined" && CSS.supports(property, value);
  const selector = (text) => typeof CSS !== "undefined" && CSS.supports(`selector(${text})`);
  const probes = {
    // The documented detection: a parser that supports declarative shadow DOM exposes `shadowRootMode` on templates.
    declarativeShadowDom: () => "shadowRootMode" in HTMLTemplateElement.prototype,
    elementInternals: () => typeof HTMLElement.prototype.attachInternals === "function",
    elementInternalsAria: () =>
      "ariaDisabled" in ElementInternals.prototype && "role" in ElementInternals.prototype,
    formAssociated: () => {
      class A extends HTMLElement {
        static formAssociated = true;
      }
      customElements.define("probe-form-assoc", A);
      return "form" in new A().attachInternals();
    },
    dialogModal: () =>
      typeof HTMLDialogElement !== "undefined" &&
      typeof HTMLDialogElement.prototype.showModal === "function",
    dialogModalPseudo: () => selector(":modal"),
    popoverApi: () => "popover" in HTMLElement.prototype,
    anchorPositioning: () => css("anchor-name", "--a") && css("position-anchor", "--a"),
    backdropFilter: () =>
      css("backdrop-filter", "blur(4px)") || css("-webkit-backdrop-filter", "blur(4px)"),
    svgFilterInBackdrop: () => css("backdrop-filter", "url(#f)"),
    constructableStylesheets: () => {
      try {
        new CSSStyleSheet().replaceSync("a{}");
        return "adoptedStyleSheets" in Document.prototype;
      } catch {
        return false;
      }
    },
    has: () => selector(":has(a)"),
    colorMix: () => css("color", "color-mix(in srgb, red, blue)"),
    containerQueries: () => css("container-type", "inline-size"),
    prefersReducedTransparency: () =>
      matchMedia("(prefers-reduced-transparency)").media !== "not all",
    prefersReducedMotion: () => matchMedia("(prefers-reduced-motion)").media !== "not all",
    prefersColorScheme: () => matchMedia("(prefers-color-scheme: dark)").media !== "not all",
    lightDark: () => css("color", "light-dark(red, blue)"),
    cssNesting: () => typeof CSSNestedDeclarations !== "undefined" || css("selector(&)", ""),
    logicalProperties: () => css("margin-inline-start", "1px"),
    dialogClosedby: () => "closedBy" in HTMLDialogElement.prototype,
    scrollbarStyling: () => css("scrollbar-width", "thin") && css("scrollbar-color", "red blue"),
    viewTransitions: () => typeof document.startViewTransition === "function",
    importMapsAndModules: () => HTMLScriptElement.supports?.("importmap") === true,
    cssLayers: () => typeof CSSLayerBlockRule !== "undefined",
  };
  const result = { userAgent: navigator.userAgent, features: {} };
  for (const [name, probe] of Object.entries(probes)) {
    try {
      result.features[name] = Boolean(await probe());
    } catch (error) {
      result.features[name] = false;
      result.features[`${name}Error`] = String(error);
    }
  }
  return result;
};
