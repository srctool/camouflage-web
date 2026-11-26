import { cssBlock } from "@srctool/camouflage-core";
import type { InteractionFeedback } from "@srctool/camouflage-core";
import { html } from "lit";

const PRESSED = [":host(:active:not([disabled]):not([loading]))", ":host([data-camo-pressed])"];
const whenPressed = (target: string): string => PRESSED.map((s) => `${s} ${target}`).join(", ");

// State layers of the content color (hover 8%, focus and press 10%) and a ripple that spreads from the press point,
// which the press controller leaves in `--camo-press-x` and `--camo-press-y` (the middle for a key).
const STYLES = `
.camo-feedback { position: relative; display: inline-flex; flex: 1 1 auto; border-radius: inherit; }
.camo-feedback-content { display: inline-flex; flex: 1 1 auto; border-radius: inherit; }
.camo-feedback-veil, .camo-feedback-ripple {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
}
.camo-feedback-veil {
  background: var(--camo-veil, currentColor); opacity: 0;
  transition: opacity var(--camo-motion-duration-short);
}
/* The press point is measured from the left, so this layer lays out left to right in every language. */
.camo-feedback-ripple { overflow: hidden; direction: ltr; }
.camo-feedback-ripple::after {
  content: ""; position: absolute; inline-size: 200%; aspect-ratio: 1; border-radius: 50%;
  inset-inline-start: var(--camo-press-x, 50%); inset-block-start: var(--camo-press-y, 50%);
  translate: -50% -50%;
  background: var(--camo-veil, currentColor); opacity: 0; scale: 0;
  transition: opacity var(--camo-motion-duration-medium), scale 0s var(--camo-motion-duration-medium);
}
:host(:hover:not([disabled]):not([loading])) .camo-feedback-veil { opacity: 0.08; }
${whenPressed(".camo-feedback-ripple::after")} {
  opacity: 0.1; scale: 1;
  transition: scale var(--camo-motion-duration-medium) var(--camo-motion-easing-standard);
}
:host(:focus-visible) .camo-feedback-veil { opacity: 0.1; outline: 3px solid var(--camo-color-primary); outline-offset: 2px; }
`;

/** Ripple (Material): state layers on hover and focus, a ripple from the press point, a 3 px ring for the keyboard. */
export const ripple: InteractionFeedback = {
  wrap({ child, contentColor }) {
    return html`${cssBlock(STYLES)}<span class="camo-feedback" style="--camo-veil: ${contentColor}"
        ><span class="camo-feedback-content">${child}</span><span class="camo-feedback-veil"></span
        ><span class="camo-feedback-ripple"></span
      ></span>`;
  },
};
