import { html } from "lit";
import type { TemplateResult } from "lit";

const APPEARANCES = ["solid", "soft", "raised", "outline", "ghost", "link"] as const;
const TONES = ["default", "error", "success", "warning", "info"] as const;

function buttons(): TemplateResult {
  return html`
    <div class="row">${APPEARANCES.map((a) => html`<camo-button text=${a} appearance=${a}></camo-button>`)}</div>
    <div class="row">${TONES.map((t) => html`<camo-button text=${t} tone=${t}></camo-button>`)}</div>
    <div class="row">
      <camo-button text="Saving" loading></camo-button>
      <camo-button text="Unavailable" disabled></camo-button>
    </div>`;
}

/** The same page as the Node sample: a Minimal provider with a nested Cupertino provider in the dark scheme. */
export function spikePage(): TemplateResult {
  return html`
    <camo-provider skin="minimal" scheme="light" class="page">
      <h1>Minimal</h1>
      ${buttons()}
      <camo-provider skin="cupertino" scheme="dark" class="panel">
        <h1>Cupertino, dark</h1>
        ${buttons()}
      </camo-provider>
    </camo-provider>`;
}

export function dialogPage(skin: string, scheme: string): TemplateResult {
  return html`<camo-provider skin=${skin} scheme=${scheme} class="page">
    <camo-dialog open title="Delete item?" message="This can't be undone.">
      <camo-button slot="confirm" text="Delete" tone="error"></camo-button>
      <camo-button slot="dismiss" text="Cancel" appearance="ghost"></camo-button>
    </camo-dialog>
  </camo-provider>`;
}
