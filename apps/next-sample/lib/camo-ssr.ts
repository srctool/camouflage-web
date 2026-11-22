// Server only. Renders a Lit template to HTML with declarative shadow DOM, for a React Server Component to place in the
// page. Same order as the Node sample (the spike finding): the DOM shim and `@lit-labs/ssr` first, the elements defined
// afterwards with dynamic imports.
import "@lit-labs/ssr/lib/install-global-dom-shim.js";
import { LitElementRenderer, render } from "@lit-labs/ssr";
import type { TemplateResult } from "lit";

let ready: Promise<void> | undefined;

function prepare(): Promise<void> {
  ready ??= (async () => {
    await import("@srctool/camouflage-core/define");
    await import("@srctool/camouflage-skin-minimal/register");
    await import("@srctool/camouflage-skin-cupertino/register");
    LitElementRenderer.renderOptions.push(() => ({ connectedCallback: true }));
  })();
  return ready;
}

export async function renderCamo(template: TemplateResult): Promise<string> {
  await prepare();
  let out = "";
  for (const chunk of render(template)) out += chunk;
  return out;
}
