import { cssBlock } from "@srctool/camouflage-core";
import type { InteractionFeedback } from "@srctool/camouflage-core";
import { html } from "lit";

const PRESSED = [":host(:active:not([disabled]):not([loading]))", ":host([data-camo-pressed])"];
const whenPressed = (target: string): string => PRESSED.map((s) => `${s} ${target}`).join(", ");

// Hover 8% and press 20% of the content color, and an inset focus border (2 px of the focus color with a 1 px surface
// line inside, so a filled button still shows it) that never changes the layout.
const STYLES = `
.camo-feedback { position: relative; display: inline-flex; flex: 1 1 auto; border-radius: inherit; }
.camo-feedback-content { display: inline-flex; flex: 1 1 auto; border-radius: inherit; }
.camo-feedback-veil {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: var(--camo-veil, currentColor); opacity: 0;
  transition: opacity var(--camo-motion-duration-short);
}
:host(:hover:not([disabled]):not([loading])) .camo-feedback-veil { opacity: 0.08; }
${whenPressed(".camo-feedback-veil")} { opacity: 0.2; }
:host(:focus-visible) .camo-feedback-veil {
  opacity: 1; background: transparent;
  box-shadow: inset 0 0 0 2px var(--camo-color-primary), inset 0 0 0 3px var(--camo-color-surface);
}
`;

/** CarbonStates: hover and active overlays, an inset focus border. */
export const carbonStates: InteractionFeedback = {
  wrap({ child, contentColor }) {
    return html`${cssBlock(STYLES)}<span class="camo-feedback" style="--camo-veil: ${contentColor}"
        ><span class="camo-feedback-content">${child}</span><span class="camo-feedback-veil"></span
      ></span>`;
  },
};
