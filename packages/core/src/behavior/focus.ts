/** What a keyboard can reach: native controls that are not disabled, links, and anything with a non-negative tabindex. */
export const TABBABLE: string =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), ' +
  'textarea:not([disabled]), summary, [contenteditable="true"], [tabindex]:not([tabindex^="-"])';

/** The tabbable elements under `root`, in document order, skipping hidden ones. */
export function tabbables(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (el) => el.closest('[hidden], [inert], [aria-hidden="true"]') === null,
  );
}

/**
 * Where focus should land when something opens, by the rule every Camouflage overlay uses: the first element matching
 * the first selector that has a match (typically `[autofocus]`, then the safe action, then the confirming one).
 */
export function initialFocusTarget(
  root: ParentNode,
  selectors: readonly string[],
): HTMLElement | null {
  for (const selector of selectors) {
    const match = root.querySelector<HTMLElement>(selector);
    if (match !== null) return match;
  }
  return null;
}

/**
 * Remembers the element that has focus now and returns a function that gives it back, when it is still on the page.
 * For overlays that are not native `<dialog>`s (a popover, a side sheet); a native dialog restores focus itself.
 */
export function rememberFocus(): () => void {
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  return () => {
    if (previous?.isConnected === true) previous.focus({ preventScroll: true });
  };
}

/** Whether keyboard focus is on `element` (the `:focus-visible` the feedback rings), not a mouse click's focus. */
export function hasVisibleFocus(element: Element): boolean {
  return element.matches(":focus-visible");
}

/** The CSS of the focus ring every feedback draws: 2px in the primary color, outside the control. */
export const FOCUS_RING: string =
  "outline: 2px solid var(--camo-color-primary); outline-offset: 2px;";
