import { html } from "lit";
import { cssBlock } from "../style.ts";
import type { InteractionFeedback } from "./types.ts";

// `:active` covers the pointer; `[data-camo-pressed]` is set by the press controller, which also covers a key press, so
// Space and Enter feel like a click. Keyboard focus is always visible (WCAG 2.4.7).
const PRESSED = [":host(:active:not([disabled]):not([loading]))", ":host([data-camo-pressed])"];

/** The selector list that matches `target` while the host is pressed. */
const whenPressed = (target: string): string => PRESSED.map((s) => `${s} ${target}`).join(", ");

const BASE = `
.camo-feedback { position: relative; display: inline-flex; flex: 1 1 auto; border-radius: inherit; }
.camo-feedback-content { display: inline-flex; flex: 1 1 auto; border-radius: inherit; }
.camo-feedback-veil {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: var(--camo-veil, currentColor); opacity: 0;
  transition: opacity var(--camo-motion-duration-short);
}
`;

const FADE = `${BASE}
:host(:hover:not([disabled]):not([loading])) .camo-feedback-veil { opacity: 0.04; }
${whenPressed(".camo-feedback-veil")} { opacity: 0.08; }
:host(:focus-visible) .camo-feedback-veil {
  opacity: 0; outline: 2px solid var(--camo-color-primary); outline-offset: 2px;
}
`;

const OPACITY = `${BASE}
.camo-feedback-content { transition: opacity var(--camo-motion-duration-short); }
:host(:hover:not(:active):not([data-camo-pressed]):not([disabled]):not([loading])) .camo-feedback-veil { opacity: 0.04; }
${whenPressed(".camo-feedback-content")} { opacity: 0.35; }
:host(:focus-visible) .camo-feedback-veil { outline: 3px solid var(--camo-color-primary); }
`;

function veil(styles: string): InteractionFeedback {
  return {
    wrap({ child, contentColor }) {
      return html`${cssBlock(styles)}<span class="camo-feedback" style="--camo-veil: ${contentColor}"
          ><span class="camo-feedback-content">${child}</span><span class="camo-feedback-veil"></span
        ></span>`;
    },
  };
}

/** Fade: hover and press are a veil of the content color (4% and 8%), keyboard focus a ring (Minimal, Fluent, Carbon). */
export const fade: InteractionFeedback = veil(FADE);

/** Opacity: the content dims to 35% while pressed, a faint veil on hover, a ring for keyboard focus (Cupertino). */
export const opacity: InteractionFeedback = veil(OPACITY);
