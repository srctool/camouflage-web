import { CamoRules } from "@srctool/camouflage-core";
import type { CamoForm } from "@srctool/camouflage-core";
import { createElement, useState } from "react";
import type { ReactElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { userEvent } from "vitest/browser";
import { createApp, h, nextTick, ref } from "vue";
import { describe, expect, it } from "vitest";
import { mount, settled } from "./helpers.ts";

type El = HTMLElement & Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const q = (root: ParentNode, selector: string): El => root.querySelector(selector) as El;
const input = (field: Element): HTMLInputElement =>
  field.shadowRoot!.querySelector<HTMLInputElement>(".camo-input")!;
const tick = (ms = 30): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function form(
  skin: string,
  body: string,
  attrs = "",
): Promise<{ root: HTMLElement; form: CamoForm & HTMLElement }> {
  const root = mount(
    `<camo-provider skin="${skin}" scheme="light" style="display:block;padding:24px"><camo-form ${attrs}>${body}</camo-form></camo-provider>`,
  );
  await settled(root);
  const f = q(root, "camo-form") as unknown as CamoForm & HTMLElement;
  return { root, form: f };
}

const SIGN_UP = `
  <camo-text-field name="email" label="Email"></camo-text-field>
  <camo-text-field name="password" label="Password" secure></camo-text-field>
  <camo-text-field name="confirm" label="Confirm" secure></camo-text-field>
  <camo-checkbox name="terms" label="I accept"></camo-checkbox>
  <camo-button type="submit" text="Create"></camo-button>
  <camo-button type="reset" text="Reset"></camo-button>`;

const RULES = {
  email: [CamoRules.required("Email is required"), CamoRules.email("Enter a valid email")],
  password: [
    CamoRules.required("Password is required"),
    CamoRules.minLength(8, "Use at least 8 characters"),
  ],
  confirm: [CamoRules.matches("password", "The passwords do not match")],
  terms: [CamoRules.requiredTrue("You must accept the terms")],
};

const errorOf = (root: ParentNode, name: string): string | null => q(root, `[name=${name}]`).error;

describe.each(["minimal", "cupertino"])("camo-form under %s", (skin) => {
  it("finds the named inputs inside it, and reads their values the way rules see them", async () => {
    const { root, form: f } = await form(
      skin,
      `<camo-text-field name="a" value="x"></camo-text-field><camo-checkbox name="b" checked></camo-checkbox>
       <camo-text-field value="nameless"></camo-text-field>`,
    );
    expect(f.controls.map((c) => c.name)).toEqual(["a", "b"]);
    expect(f.values).toEqual({ a: "x", b: true });
    expect(root.querySelector("camo-form")).toBe(f);
  });

  it("validates on submit only by default: nothing is shown until then, then the first failure of each field", async () => {
    const { root, form: f } = await form(skin, SIGN_UP);
    f.rules = RULES;
    expect(errorOf(root, "email")).toBeNull();
    const seen: unknown[] = [];
    f.addEventListener("camo-invalid", (e) => seen.push((e as CustomEvent).detail));
    q(root, "camo-button[type=submit]").click();
    await settled(root);
    expect(errorOf(root, "email")).toBe("Email is required"); // the first failure wins
    expect(errorOf(root, "password")).toBe("Password is required");
    expect(errorOf(root, "confirm")).toBeNull();
    expect(errorOf(root, "terms")).toBe("You must accept the terms");
    expect(f.valid).toBe(false);
    expect(seen).toHaveLength(1);
    expect((seen[0] as { errors: Record<string, string> }).errors).toEqual({
      email: "Email is required",
      password: "Password is required",
      terms: "You must accept the terms",
    });
  });

  it("focuses the first invalid input", async () => {
    const { root, form: f } = await form(skin, SIGN_UP);
    f.rules = RULES;
    f.validate();
    await settled(root);
    expect(q(root, "[name=email]").shadowRoot!.activeElement).toBe(input(q(root, "[name=email]")));
    expect(q(root, "[name=email]").shadowRoot!.querySelector("#error")!.textContent).toBe(
      "Email is required",
    );
  });

  it("fires camo-submit with the values and the FormData, and cancels the native submit when asked", async () => {
    const { root, form: f } = await form(skin, SIGN_UP);
    f.rules = RULES;
    for (const [name, value] of [
      ["email", "ada@example.com"],
      ["password", "longenough"],
      ["confirm", "longenough"],
    ] as const)
      q(root, `[name=${name}]`).value = value;
    q(root, "[name=terms]").checked = true;
    await settled(root);
    let detail: { values: Record<string, unknown>; formData: FormData } | undefined;
    f.addEventListener("camo-submit", (e) => {
      detail = (e as CustomEvent).detail;
      e.preventDefault();
    });
    q(root, "camo-button[type=submit]").click();
    await settled(root);
    expect(f.valid).toBe(true);
    expect(detail!.values).toEqual({
      email: "ada@example.com",
      password: "longenough",
      confirm: "longenough",
      terms: true,
    });
    expect([...detail!.formData.entries()]).toEqual([
      ["email", "ada@example.com"],
      ["password", "longenough"],
      ["confirm", "longenough"],
      ["terms", "on"],
    ]);
  });

  it("validates a field after the user first edits it, with on-user-interaction", async () => {
    const { root, form: f } = await form(skin, SIGN_UP, 'validate-mode="on-user-interaction"');
    f.rules = RULES;
    expect(errorOf(root, "email")).toBeNull();
    await userEvent.click(input(q(root, "[name=email]")));
    await userEvent.keyboard("ada");
    expect(errorOf(root, "email")).toBe("Enter a valid email");
    await userEvent.keyboard("@example.com");
    expect(errorOf(root, "email")).toBeNull();
    expect(errorOf(root, "password")).toBeNull(); // untouched fields stay quiet
  });

  it("validates a field when it loses focus, with on-unfocus", async () => {
    const { root, form: f } = await form(skin, SIGN_UP, 'validate-mode="on-unfocus"');
    f.rules = RULES;
    await userEvent.click(input(q(root, "[name=email]")));
    await userEvent.keyboard("ada");
    expect(errorOf(root, "email")).toBeNull();
    await userEvent.tab();
    expect(errorOf(root, "email")).toBe("Enter a valid email");
  });

  it("validates every field on every change with always, and clears a form error the user fixes in other modes", async () => {
    const { root, form: f } = await form(skin, SIGN_UP, 'validate-mode="always"');
    f.rules = RULES;
    await userEvent.click(input(q(root, "[name=email]")));
    await userEvent.keyboard("a");
    expect(errorOf(root, "password")).toBe("Password is required");
    const second = await form(skin, SIGN_UP);
    second.form.rules = RULES;
    second.form.validate();
    await settled(second.root);
    expect(errorOf(second.root, "email")).toBe("Email is required");
    await userEvent.click(input(q(second.root, "[name=email]")));
    await userEvent.keyboard("a");
    expect(errorOf(second.root, "email")).toBeNull(); // stale once the user edits it
  });

  it("checks `matches` against the other field, and the required attribute without a rule", async () => {
    const { root, form: f } = await form(
      skin,
      `<camo-text-field name="password" value="secret123"></camo-text-field>
       <camo-text-field name="confirm" value="secret12"></camo-text-field>
       <camo-text-field name="nick" required></camo-text-field>`,
    );
    f.rules = { confirm: CamoRules.matches("password", "Differs") };
    expect(f.validate()).toBe(false);
    expect(errorOf(root, "confirm")).toBe("Differs");
    expect(errorOf(root, "nick")).toBe("This field is required.");
    f.requiredMessage = "Needed";
    q(root, "[name=confirm]").value = "secret123";
    f.validate();
    expect(errorOf(root, "nick")).toBe("Needed");
    expect(errorOf(root, "confirm")).toBeNull();
  });

  it("skips disabled and hidden inputs", async () => {
    const { root, form: f } = await form(
      skin,
      `<camo-text-field name="a" disabled></camo-text-field><div hidden><camo-text-field name="b"></camo-text-field></div>`,
    );
    f.rules = { a: CamoRules.required("A"), b: CamoRules.required("B") };
    expect(f.validate()).toBe(true);
    expect(errorOf(root, "a")).toBeNull();
    expect(errorOf(root, "b")).toBeNull();
  });

  it("shows server errors by name, and clears them when the user edits", async () => {
    const { root, form: f } = await form(
      skin,
      `<camo-text-field name="email" value="ada@example.com"></camo-text-field>`,
    );
    f.setErrors({ email: "Already registered" });
    await settled(root);
    expect(errorOf(root, "email")).toBe("Already registered");
    expect(q(root, "camo-text-field").validity.customError).toBe(true);
    await userEvent.click(input(q(root, "camo-text-field")));
    await userEvent.keyboard("x");
    expect(errorOf(root, "email")).toBeNull();
  });

  it("resets every input and its errors, and tracks what is dirty", async () => {
    const { root, form: f } = await form(skin, SIGN_UP);
    f.rules = RULES;
    expect(f.dirty).toBe(false);
    q(root, "[name=email]").value = "changed";
    await settled(root);
    expect(f.dirty).toBe(true);
    f.validate();
    q(root, "camo-button[type=reset]").click();
    await settled(root);
    expect(q(root, "[name=email]").value).toBe("");
    expect(errorOf(root, "email")).toBeNull();
    expect(f.valid).toBe(true);
    expect(f.dirty).toBe(false);
  });

  it("fires camo-changed for any input change, and submits from Enter in a field", async () => {
    const { root, form: f } = await form(
      skin,
      `<camo-text-field name="q" label="Q"></camo-text-field>`,
    );
    let changed = 0;
    let submitted = 0;
    f.addEventListener("camo-changed", () => changed++);
    f.addEventListener("camo-submit", (e) => {
      submitted++;
      e.preventDefault();
    });
    await userEvent.click(input(q(root, "camo-text-field")));
    await userEvent.keyboard("ab{Enter}");
    expect(changed).toBe(2);
    expect(submitted).toBe(1);
  });

  it("works with a native <form> around it: FormData has every input, and the form's own submit is validated", async () => {
    const root = mount(
      `<camo-provider skin="${skin}" scheme="light"><form id="f"><camo-form>
        <camo-text-field name="email" label="Email"></camo-text-field>
        <camo-checkbox name="terms" label="Terms"></camo-checkbox>
      </camo-form></form></camo-provider>`,
    );
    await settled(root);
    const f = q(root, "camo-form") as unknown as CamoForm & HTMLElement;
    f.rules = { email: CamoRules.required("Email is required") };
    const native = q(root, "#f") as unknown as HTMLFormElement;
    const log: string[] = [];
    f.addEventListener("camo-invalid", () => log.push("invalid"));
    f.addEventListener("camo-submit", (e) => {
      log.push("submit");
      e.preventDefault();
    });
    native.requestSubmit();
    await settled(root);
    expect(log).toEqual(["invalid"]);
    // The user edits the field: the form's stale message goes, and the browser's own validity check passes.
    await userEvent.click(input(q(root, "[name=email]")));
    await userEvent.keyboard("ada@example.com");
    q(root, "[name=terms]").checked = true;
    await settled(root);
    expect([...new FormData(native).entries()]).toEqual([
      ["email", "ada@example.com"],
      ["terms", "on"],
    ]);
    native.requestSubmit();
    await settled(root);
    expect(log).toEqual(["invalid", "submit"]);
  });
});

describe("camo-form with other inputs", () => {
  it("validates a radio group, a slider, a stepper, a segmented control and a date together", async () => {
    const { root, form: f } = await form(
      "minimal",
      `<camo-radio-group name="plan" label="Plan"><camo-radio value="a" label="A"></camo-radio></camo-radio-group>
       <camo-slider name="vol" label="Vol" value="0"></camo-slider>
       <camo-stepper name="qty" label="Qty" value="0"></camo-stepper>
       <camo-segmented-control name="size" label="Size"><camo-segment value="s" label="S"></camo-segment></camo-segmented-control>
       <camo-date-picker name="when" label="When" locale="en-US"></camo-date-picker>`,
    );
    f.rules = {
      plan: CamoRules.required("Choose a plan"),
      vol: CamoRules.min(0.5, "Too quiet"),
      qty: CamoRules.min(1, "At least one"),
      size: CamoRules.required("Pick a size"),
      when: CamoRules.required("Pick a date"),
    };
    expect(f.validate()).toBe(false);
    expect(Object.keys((f as unknown as { values: object }).values)).toEqual([
      "plan",
      "vol",
      "qty",
      "size",
      "when",
    ]);
    expect(["plan", "vol", "qty", "size", "when"].map((n) => errorOf(root, n))).toEqual([
      "Choose a plan",
      "Too quiet",
      "At least one",
      "Pick a size",
      "Pick a date",
    ]);
  });
});

describe("framework forms", () => {
  it("React: a controlled input follows state, and camo-before-change keeps it controlled", async () => {
    const root = mount(
      `<camo-provider skin="minimal" scheme="light"><div id="app"></div></camo-provider>`,
    );
    const host = q(root, "#app");
    const log: string[] = [];
    function App(): ReactElement {
      const [value, setValue] = useState("ab");
      return createElement(
        "div",
        null,
        createElement("camo-text-field", {
          id: "tf",
          label: "Letters",
          value,
          ref: (el: El | null) => {
            if (el === null || el.__bound) return;
            el.__bound = true;
            el.addEventListener("camo-before-change", (e: Event) => {
              if (/\d/.test((e as CustomEvent<{ value: string }>).detail.value)) e.preventDefault();
            });
            el.addEventListener("input", () => {
              log.push(el.value);
              setValue(el.value);
            });
          },
        }),
        createElement("output", { id: "out" }, value),
      );
    }
    const reactRoot = createRoot(host);
    flushSync(() => reactRoot.render(createElement(App)));
    await settled(root);
    const field = q(root, "#tf");
    expect(field.value).toBe("ab"); // React set the property, not an attribute
    await userEvent.click(input(field));
    await userEvent.keyboard("c1d");
    expect(field.value).toBe("abcd"); // the digit was rejected
    await tick();
    expect(q(root, "#out").textContent).toBe("abcd");
    expect(log).toEqual(["abc", "abcd"]);
    flushSync(() => reactRoot.unmount());
  });

  it("React: a camo-form with rules set as a property, submitted from a camo-button", async () => {
    const root = mount(
      `<camo-provider skin="minimal" scheme="light"><div id="app"></div></camo-provider>`,
    );
    const submitted: unknown[] = [];
    function App(): ReactElement {
      return createElement(
        "camo-form",
        {
          ref: (el: (El & CamoForm) | null) => {
            if (el === null || el.__bound) return;
            el.__bound = true;
            el.rules = { email: CamoRules.email("Enter a valid email") };
            el.addEventListener("camo-submit", (e: Event) => {
              submitted.push((e as CustomEvent).detail.values);
              e.preventDefault();
            });
          },
        },
        createElement("camo-text-field", {
          name: "email",
          label: "Email",
          value: "ada@example.com",
        }),
        createElement("camo-button", { type: "submit", text: "Save" }),
      );
    }
    const reactRoot = createRoot(q(root, "#app"));
    flushSync(() => reactRoot.render(createElement(App)));
    await settled(root);
    q(root, "camo-button").click();
    await settled(root);
    expect(submitted).toEqual([{ email: "ada@example.com" }]);
    q(root, "camo-text-field").value = "nope";
    await settled(root);
    q(root, "camo-button").click();
    await settled(root);
    expect(submitted).toHaveLength(1);
    expect(q(root, "camo-text-field").error).toBe("Enter a valid email");
    flushSync(() => reactRoot.unmount());
  });

  it("Vue: v-model-style binding with a property, an event, and a checkbox, switch and stepper", async () => {
    const root = mount(
      `<camo-provider skin="cupertino" scheme="light"><div id="app"></div></camo-provider>`,
    );
    const name = ref("ada");
    const agree = ref(false);
    const qty = ref(2);
    const app = createApp({
      render: () =>
        h("div", [
          h("camo-text-field", {
            id: "tf",
            label: "Name",
            value: name.value,
            onInput: (e: Event) => (name.value = (e.target as El).value),
          }),
          h("camo-checkbox", {
            id: "cb",
            label: "Agree",
            checked: agree.value,
            onChange: (e: Event) => (agree.value = (e.target as El).checked),
          }),
          h("camo-stepper", {
            id: "st",
            label: "Qty",
            min: 0,
            max: 5,
            value: qty.value,
            onChange: (e: Event) => (qty.value = (e.target as El).value),
          }),
        ]),
    });
    app.mount(q(root, "#app"));
    await nextTick();
    await settled(root);
    expect(q(root, "#tf").value).toBe("ada");
    expect(q(root, "#st").value).toBe(2);
    await userEvent.click(input(q(root, "#tf")));
    await userEvent.keyboard("m");
    expect(name.value).toBe("adam");
    q(root, "#cb").click();
    expect(agree.value).toBe(true);
    await nextTick();
    expect(q(root, "#cb").checked).toBe(true);
    name.value = "grace";
    await nextTick();
    await settled(root);
    expect(input(q(root, "#tf")).value).toBe("grace");
    q(root, "#st").focus();
    input(q(root, "#st")).focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(qty.value).toBe(3);
    app.unmount();
  });
});
