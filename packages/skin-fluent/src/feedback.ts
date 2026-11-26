import { cssBlock } from "@srctool/camouflage-core";
import type { InteractionFeedback } from "@srctool/camouflage-core";
import { html } from "lit";

const PRESSED = [":host(:active:not([disabled]):not([loading]))", ":host([data-camo-pressed])"];
const whenPressed = (target: string): string => PRESSED.map((s) => `${s} ${target}`).join(", ");

// A quiet step of the content color for hover and press, and Fluent's double stroke for keyboard focus: 2 px dark
// outside, 1 px light inside (reversed in the dark scheme by the tokens).
const STYLES = `
.camo-feedback { position: relative; display: inline-flex; flex: 1 1 auto; border-radius: inherit; }
.camo-feedback-content { display: inline-flex; flex: 1 1 auto; border-radius: inherit; }
.camo-feedback-veil {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: var(--camo-veil, currentColor); opacity: 0;
  transition: opacity var(--camo-motion-duration-short);
}
:host(:hover:not([disabled]):not([loading])) .camo-feedback-veil { opacity: 0.05; }
${whenPressed(".camo-feedback-veil")} { opacity: 0.1; }
:host(:focus-visible) .camo-feedback-veil {
  opacity: 1; background: transparent;
  box-shadow: 0 0 0 2px var(--fluent-stroke-focus2, var(--camo-color-on-surface)),
    inset 0 0 0 1px var(--fluent-stroke-focus1, var(--camo-color-surface));
}
`;

/** Subtle (Fluent): hover and press are a quiet step, keyboard focus the double stroke. */
export const subtle: InteractionFeedback = {
  wrap({ child, contentColor }) {
    return html`${cssBlock(STYLES)}<span class="camo-feedback" style="--camo-veil: ${contentColor}"
        ><span class="camo-feedback-content">${child}</span><span class="camo-feedback-veil"></span
      ></span>`;
  },
};
