import { cssBlock } from "@srctool/camouflage-core";
import type { InteractionFeedback } from "@srctool/camouflage-core";
import { html } from "lit";

// Hover and press are a veil of the content color (4% and 8%); keyboard focus is a ring of the primary color.
const STYLES = `
.camo-feedback { position: relative; display: inline-flex; flex: 1 1 auto; border-radius: inherit; }
.camo-feedback-content { display: inline-flex; flex: 1 1 auto; border-radius: inherit; }
.camo-feedback-veil {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: var(--camo-veil, currentColor); opacity: 0;
  transition: opacity var(--camo-motion-duration-short);
}
:host(:hover:not([disabled]):not([loading])) .camo-feedback-veil { opacity: 0.04; }
:host(:active:not([disabled]):not([loading])) .camo-feedback-veil { opacity: 0.08; }
:host(:focus-visible) .camo-feedback-veil {
  opacity: 0; outline: 2px solid var(--camo-color-primary); outline-offset: 2px;
}
`;

/** Minimal's feedback: a fade (a veil over the content) and a ring for keyboard focus. */
export const fade: InteractionFeedback = {
  wrap({ child, contentColor }) {
    return html`${cssBlock(STYLES)}<span class="camo-feedback" style="--camo-veil: ${contentColor}"
        ><span class="camo-feedback-content">${child}</span><span class="camo-feedback-veil"></span
      ></span>`;
  },
};
