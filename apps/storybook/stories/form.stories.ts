import { CamoRules } from "@srctool/camouflage-core";
import type { CamoForm } from "@srctool/camouflage-core";
import { html } from "lit";
import { ref } from "lit/directives/ref.js";
import type { Meta, StoryObj } from "@storybook/web-components-vite";

const meta: Meta = { title: "Inputs/Form" };
export default meta;

export const SignUp: StoryObj = {
  render: () => html`<camo-form
    validate-mode="on-user-interaction"
    style="display:grid;gap:16px;max-inline-size:360px"
    @camo-submit=${(e: CustomEvent) => console.warn("submit", e.detail.values)}
    ${ref((el?: Element) => {
      if (el === undefined) return;
      (el as CamoForm).rules = {
        email: [CamoRules.required("Email is required"), CamoRules.email("Enter a valid email")],
        password: [
          CamoRules.required("Password is required"),
          CamoRules.minLength(8, "Use at least 8 characters"),
        ],
        confirm: [CamoRules.matches("password", "The passwords do not match")],
        terms: [CamoRules.requiredTrue("You must accept the terms")],
      };
    })}
  >
    <camo-text-field name="email" label="Email" type="email"></camo-text-field>
    <camo-text-field name="password" label="Password" secure></camo-text-field>
    <camo-text-field name="confirm" label="Confirm password" secure></camo-text-field>
    <camo-checkbox name="terms" label="I accept the terms"></camo-checkbox>
    <div style="display:flex;gap:8px">
      <camo-button type="submit" text="Create account"></camo-button>
      <camo-button type="reset" text="Reset" appearance="ghost"></camo-button>
    </div>
  </camo-form>`,
};
