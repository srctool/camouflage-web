/**
 * Places a shown popover next to an anchor, in the top layer, without CSS anchor positioning (which not every engine
 * has): below the anchor, or above when there is no room below, aligned to the anchor's start edge (its right edge in
 * right-to-left), kept inside the window. Call it right after `showPopover()`, when the popover has a size.
 */
export function placePopover(
  popup: HTMLElement,
  anchor: DOMRect,
  options: { rtl: boolean; gap?: number; matchWidth?: boolean; side?: "block" | "inline" } = {
    rtl: false,
  },
): void {
  const gap = options.gap ?? 4;
  if (options.matchWidth === true) popup.style.minInlineSize = `${anchor.width}px`;
  const width = popup.offsetWidth;
  const height = popup.offsetHeight;
  const margin = 4;
  if (options.side === "inline") {
    // Beside the anchor, at its end, for a submenu.
    let left = options.rtl ? anchor.left - width - gap : anchor.right + gap;
    if (left < margin || left + width > window.innerWidth - margin)
      left = options.rtl ? anchor.right + gap : anchor.left - width - gap;
    popup.style.left = `${Math.min(Math.max(left, margin), Math.max(window.innerWidth - width - margin, margin))}px`;
    popup.style.top = `${Math.min(Math.max(anchor.top, margin), Math.max(window.innerHeight - height - margin, margin))}px`;
    return;
  }
  let left = options.rtl ? anchor.right - width : anchor.left;
  left = Math.min(Math.max(left, margin), Math.max(window.innerWidth - width - margin, margin));
  let top = anchor.bottom + gap;
  if (top + height > window.innerHeight - margin && anchor.top - height - gap > margin)
    top = anchor.top - height - gap;
  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
}
