// The server DOM shim must be installed before any element class is defined.
import "@lit-labs/ssr/lib/install-global-dom-shim.js";
import { LitElementRenderer, render } from "@lit-labs/ssr";
import type { TemplateResult } from "lit";

let configured = false;

/** Renders a template to a string with declarative shadow DOM, calling `connectedCallback` so context resolves. */
export function renderToString(page: TemplateResult): string {
  if (!configured) {
    // Context (skin, theme, environment) needs connectedCallback on the server (lit-labs/ssr 4: renderOptions).
    LitElementRenderer.renderOptions.push(() => ({ connectedCallback: true }));
    configured = true;
  }
  let out = "";
  for (const chunk of render(page)) out += chunk;
  return out;
}

/** Collapses whitespace so assertions don't depend on template formatting. */
export function squash(html: string): string {
  return html.replace(/\s+/g, " ");
}
