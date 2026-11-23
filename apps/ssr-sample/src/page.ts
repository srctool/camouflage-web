import { html } from "lit";
import type { TemplateResult } from "lit";

const APPEARANCES = ["solid", "soft", "raised", "outline", "ghost", "link"] as const;
const TONES = ["default", "error", "success", "warning", "info"] as const;

const arrow = html`<svg slot="suffix-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6" /></svg>`;

function buttons(): TemplateResult {
  return html`
    <div class="row">
      ${APPEARANCES.map((a) => html`<camo-button text=${a} appearance=${a}></camo-button>`)}
    </div>
    <div class="row">
      ${TONES.map((t) => html`<camo-button text=${t} tone=${t}></camo-button>`)}
    </div>
    <div class="row">
      <camo-button text="Next" appearance="outline">${arrow}</camo-button>
      <camo-button text="Saving" loading></camo-button>
      <camo-button text="Unavailable" disabled></camo-button>
    </div>`;
}

function confirmation(): TemplateResult {
  return html`
    <camo-dialog open title="Delete item?" message="This can't be undone.">
      <camo-button slot="confirm" text="Delete" tone="error"></camo-button>
      <camo-button slot="dismiss" text="Cancel" appearance="ghost"></camo-button>
    </camo-dialog>`;
}

/**
 * The spike page: a Minimal provider with a nested Cupertino provider in the dark scheme, each with the same buttons.
 * Rendered on the server and left as is: the page's own markup needs no hydration, only the elements in it do.
 */
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

/**
 * The inputs page: every W3 input once, server-rendered and then hydrated, to show that hydration moves nothing and keeps
 * what the server wrote (values, labels, state).
 */
export function inputsPage(skin: string, scheme: string): TemplateResult {
  return html`<camo-provider skin=${skin} scheme=${scheme} class="page">
    <form style="display:grid;gap:16px;max-inline-size:420px">
      <camo-text-field name="email" label="Email" value="ada@example.com" supporting-text="We never share it"></camo-text-field>
      <camo-text-field name="bad" label="Floating" label-placement="floating" error="Something is wrong"></camo-text-field>
      <camo-search-field value="camouflage"></camo-search-field>
      <camo-checkbox name="terms" label="I accept" description="Required" checked></camo-checkbox>
      <camo-switch name="wifi" label="Wi-Fi" checked></camo-switch>
      <camo-radio-group name="plan" label="Plan" value="pro">
        <camo-radio value="free" label="Free"></camo-radio>
        <camo-radio value="pro" label="Pro" checked></camo-radio>
      </camo-radio-group>
      <camo-segmented-control name="range" label="Range" value="week">
        <camo-segment value="day" label="Day"></camo-segment>
        <camo-segment value="week" label="Week" selected></camo-segment>
      </camo-segmented-control>
      <camo-slider name="volume" label="Volume" min="0" max="100" step="10" value="30"></camo-slider>
      <camo-stepper name="qty" label="Quantity" min="1" max="10" value="3"></camo-stepper>
      <camo-date-picker name="when" label="Date" value="2026-11-18" locale="en-US"></camo-date-picker>
      <camo-time-picker name="at" label="Time" value="14:30" locale="en-US"></camo-time-picker>
      <camo-calendar value="2026-11-18" today="2026-11-22" locale="en-US"></camo-calendar>
    </form>
  </camo-provider>`;
}

/** A dialog page: the same dialog markup under both skins, one after the other (the server renders them open). */
export function dialogPage(skin: string, scheme: string): TemplateResult {
  return html`<camo-provider skin=${skin} scheme=${scheme} class="page">${confirmation()}</camo-provider>`;
}
