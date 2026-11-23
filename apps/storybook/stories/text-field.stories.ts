import { displayFormats, inputFilters } from "@srctool/camouflage-core";
import type { CamoTextField } from "@srctool/camouflage-core";
import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { ref } from "lit/directives/ref.js";
import type { Meta, StoryObj } from "@storybook/web-components-vite";

const meta: Meta = {
  title: "Inputs/Text field",
  component: "camo-text-field",
  argTypes: { "label-placement": { control: "select", options: ["above", "floating"] } },
  args: {
    label: "Email",
    value: "",
    placeholder: "",
    "supporting-text": "",
    error: "",
    "label-placement": "above",
  },
  render: (a) => html`<camo-text-field
    name="email"
    label=${a["label"]}
    value=${a["value"]}
    placeholder=${a["placeholder"]}
    supporting-text=${a["supporting-text"]}
    error=${ifDefined(a["error"] || undefined)}
    label-placement=${a["label-placement"]}
  ></camo-text-field>`,
};
export default meta;
type Story = StoryObj;

export const Default: Story = {};
export const Floating: Story = { args: { "label-placement": "floating" } };
export const WithError: Story = { args: { value: "ada@", error: "Enter a valid email" } };
export const Secure: Story = {
  render: () => html`<camo-text-field label="Password" secure value="hunter2"></camo-text-field>`,
};
export const Multiline: Story = {
  render: () => html`<camo-text-field label="Notes" multiline></camo-text-field>`,
};
export const PhoneNumber: Story = {
  render: () => html`<camo-text-field
    label="Phone"
    prefix-text="+62"
    inputmode="numeric"
    supporting-text="Digits only, shown as 0812-3456-7890"
    ${ref((el?: Element) => {
      if (el === undefined) return;
      const field = el as CamoTextField;
      field.inputFilter = inputFilters.digitsOnly(12);
      field.displayFormat = displayFormats.pattern("####-####-####");
    })}
  ></camo-text-field>`,
};
export const Controlled: Story = {
  name: "Controlled (rejects digits)",
  render: () => html`<camo-text-field
    label="Letters only"
    supporting-text="camo-before-change is cancelled for digits"
    @camo-before-change=${(e: CustomEvent<{ value: string }>) => {
      if (/\d/.test(e.detail.value)) e.preventDefault();
    }}
  ></camo-text-field>`,
};
