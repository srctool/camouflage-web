/**
 * Makes a host behave like a native button: Enter and Space activate it (Space on release, as native buttons do),
 * and a disabled or busy host never fires `click`. One copy of the rule for every button-like component.
 */
export function attachActivation(host: HTMLElement, blocked: () => boolean): void {
  host.addEventListener(
    "click",
    (event) => {
      if (blocked()) {
        // In the capture phase, before any listener the app added.
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true,
  );
  host.addEventListener("keydown", (event) => {
    if (blocked() || event.target !== host) return;
    if (event.key === "Enter") {
      event.preventDefault();
      host.click();
    } else if (event.key === " ") {
      // Keeps the page from scrolling; the click comes on keyup.
      event.preventDefault();
    }
  });
  host.addEventListener("keyup", (event) => {
    if (blocked() || event.target !== host) return;
    if (event.key === " ") {
      event.preventDefault();
      host.click();
    }
  });
}
