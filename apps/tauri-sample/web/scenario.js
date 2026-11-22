// The spike's scenario, checked in whatever engine runs it: the page hydrated, a button is focusable and has its skin,
// and a dialog (when the page has one) is a modal in the top layer with focus on an action.
globalThis.__camoScenarioRun = async () => {
  await Promise.all(
    ["camo-provider", "camo-button", "camo-dialog"].map((t) => customElements.whenDefined(t)),
  );
  const all = [...document.querySelectorAll("*")].filter((e) => "updateComplete" in e);
  await Promise.all(all.map((e) => e.updateComplete));
  const button = document.querySelector("camo-button");
  const dialog = document.querySelector("camo-dialog");
  const native = dialog?.shadowRoot?.querySelector("dialog");
  return {
    url: location.href,
    hydrated: all.length > 0,
    buttonFocusable: button?.getAttribute("tabindex") === "0",
    buttonSurface: button?.shadowRoot?.querySelector(".camo-surface")
      ? getComputedStyle(button.shadowRoot.querySelector(".camo-surface")).backgroundColor
      : null,
    dialogModal: native ? native.matches(":modal") : null,
    dialogFocusOnAction: dialog ? document.activeElement?.getAttribute("slot") === "dismiss" : null,
  };
};
