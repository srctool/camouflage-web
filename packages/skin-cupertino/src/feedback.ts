import { cssBlock } from "@srctool/camouflage-core";
import type { InteractionFeedback } from "@srctool/camouflage-core";
import { html } from "lit";

// iOS dims the content while it is pressed (to 35%), shows a light veil on hover, and rings keyboard focus.
const STYLES = `
.camo-feedback { position: relative; display: inline-flex; flex: 1 1 auto; border-radius: inherit; }
.camo-feedback-content {
  display: inline-flex; flex: 1 1 auto; border-radius: inherit;
  transition: opacity var(--camo-motion-duration-short);
}
.camo-feedback-veil {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: var(--camo-veil, currentColor); opacity: 0;
  transition: opacity var(--camo-motion-duration-short);
}
:host(:hover:not(:active):not([disabled]):not([loading])) .camo-feedback-veil { opacity: 0.04; }
:host(:active:not([disabled]):not([loading])) .camo-feedback-content { opacity: 0.35; }
:host(:focus-visible) .camo-feedback-veil { outline: 3px solid var(--camo-color-primary); }
`;

/** Cupertino's feedback: the content dims while pressed, a faint veil on hover, a ring for keyboard focus. */
export const opacity: InteractionFeedback = {
  wrap({ child, contentColor }) {
    return html`${cssBlock(STYLES)}<span class="camo-feedback" style="--camo-veil: ${contentColor}"
        ><span class="camo-feedback-content">${child}</span><span class="camo-feedback-veil"></span
      ></span>`;
  },
};
