// The order matters, and it is a finding of the spike. The server DOM shim and `@lit-labs/ssr` must be loaded first,
// and the elements defined afterwards, with dynamic imports: defined from the same static import graph, they are
// evaluated before the server's `customElements` registry is usable, and the page is rendered with no shadow DOM at all.
import "@lit-labs/ssr/lib/install-global-dom-shim.js";
import { LitElementRenderer, render } from "@lit-labs/ssr";
import type { TemplateResult } from "lit";

await import("@srctool/camouflage-core/define");
await import("@srctool/camouflage-skin-minimal/register");
await import("@srctool/camouflage-skin-cupertino/register");

// Context (skin, theme, environment) needs the elements' connectedCallback on the server (@lit-labs/ssr 4).
LitElementRenderer.renderOptions.push(() => ({ connectedCallback: true }));

/** Renders a template to a string; the server streams the same iterable. */
export function renderToString(template: TemplateResult): string {
  let out = "";
  for (const chunk of render(template)) out += chunk;
  return out;
}

export { render };
