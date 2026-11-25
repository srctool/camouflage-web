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

/** A rectangle in the viewport: the anchor, or the room there is. */
export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Where a panel goes beside an anchor, and what the renderer needs to point an arrow at it. */
export interface Placed {
  left: number;
  top: number;
  /** The side of the anchor it opened on, after flipping, as a physical side (`start` and `end` were resolved by the writing direction). */
  side: "bottom" | "top" | "left" | "right";
  /** Where the anchor's center is along the facing edge of the panel: from the panel's left for `bottom` and `top`, from its top for `start` and `end`. */
  arrowOffset: number;
}

/**
 * The placement rule of a popover, as one pure function (so it is tested with no window): `auto` is below, then above;
 * a side asked for is tried, then the opposite, then below. The panel is centered on the anchor along the other axis and
 * kept inside the window; `gap` is the space between anchor and panel (the arrow's height is part of it). Side placements
 * follow the writing direction: `start` is the left in left-to-right and the right in right-to-left.
 */
export function placePanel(
  anchor: Box,
  panel: { width: number; height: number },
  room: { width: number; height: number },
  placement: "auto" | "bottom" | "top" | "start" | "end",
  options: { rtl: boolean; gap: number; margin?: number },
): Placed {
  const margin = options.margin ?? 4;
  const { gap } = options;
  const fits = {
    bottom: anchor.top + anchor.height + gap + panel.height <= room.height - margin,
    top: anchor.top - gap - panel.height >= margin,
    left: anchor.left - gap - panel.width >= margin,
    right: anchor.left + anchor.width + gap + panel.width <= room.width - margin,
  };
  const physical = (side: "start" | "end"): "left" | "right" =>
    (side === "start") !== options.rtl ? "left" : "right";
  let side: Placed["side"];
  if (placement === "start" || placement === "end") {
    const first = physical(placement);
    const opposite = first === "left" ? "right" : "left";
    side = fits[first] ? first : fits[opposite] ? opposite : "bottom";
  } else if (placement === "top") side = fits.top ? "top" : "bottom";
  else side = fits.bottom || !fits.top ? "bottom" : "top";

  const clamp = (value: number, size: number, limit: number): number =>
    Math.min(Math.max(value, margin), Math.max(limit - size - margin, margin));
  let left: number;
  let top: number;
  if (side === "bottom" || side === "top") {
    left = clamp(anchor.left + anchor.width / 2 - panel.width / 2, panel.width, room.width);
    top = side === "bottom" ? anchor.top + anchor.height + gap : anchor.top - gap - panel.height;
    top = clamp(top, panel.height, room.height);
    return { left, top, side, arrowOffset: anchor.left + anchor.width / 2 - left };
  }
  const right = side === "right";
  left = right ? anchor.left + anchor.width + gap : anchor.left - gap - panel.width;
  left = clamp(left, panel.width, room.width);
  top = clamp(anchor.top + anchor.height / 2 - panel.height / 2, panel.height, room.height);
  return { left, top, side, arrowOffset: anchor.top + anchor.height / 2 - top };
}
