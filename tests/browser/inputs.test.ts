import { displayFormats, inputFilters, inspectAria } from "@srctool/camouflage-core";
import type { CamoTextField } from "@srctool/camouflage-core";
import { userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { registerDemoIcons } from "../../scenarios/icons.ts";
import { mount, settled } from "./helpers.ts";

registerDemoIcons();

type El = HTMLElement & Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

async function page(skin: string, body: string, dir = "ltr"): Promise<HTMLElement> {
  const root = mount(
    `<div dir="${dir}"><camo-provider skin="${skin}" scheme="light" style="display:block;padding:24px">${body}</camo-provider></div>`,
  );
  await settled(root);
  return root;
}
const q = (root: ParentNode, selector: string): El => root.querySelector(selector) as El;
const inner = (el: Element, selector: string): HTMLElement =>
  el.shadowRoot!.querySelector<HTMLElement>(selector)!;
/** The form data of a native `<form>` around the inputs. */
const data = (form: HTMLFormElement): [string, string][] =>
  [...new FormData(form).entries()].map(([k, v]) => [k, String(v)]);

describe.each(["minimal", "cupertino"])("camo-text-field under %s", (skin) => {
  it("names its input by the label, and links the helper text and the error", async () => {
    const root = await page(
      skin,
      `<camo-text-field id="a" label="Email" supporting-text="We never share it"></camo-text-field>
       <camo-text-field id="b" label="Email" error="Enter a valid email"></camo-text-field>`,
    );
    const a = inner(q(root, "#a"), ".camo-input");
    expect(a.getAttribute("aria-labelledby")).toBe("label");
    expect(a.getAttribute("aria-describedby")).toBe("supporting");
    expect(inner(q(root, "#a"), "#label").textContent).toContain("Email");
    const b = inner(q(root, "#b"), ".camo-input");
    expect(b.getAttribute("aria-describedby")).toBe("error");
    expect(b.getAttribute("aria-invalid")).toBe("true");
    expect(inner(q(root, "#b"), "#error").textContent).toBe("Enter a valid email");
  });

  it("types into the value, fires input once per edit and change on commit", async () => {
    const root = await page(skin, `<camo-text-field label="Name"></camo-text-field>`);
    const field = q(root, "camo-text-field");
    const events: string[] = [];
    for (const type of ["input", "change", "camo-before-change"])
      field.addEventListener(type, () => events.push(type));
    await userEvent.click(inner(field, ".camo-input"));
    await userEvent.keyboard("ada");
    expect(field.value).toBe("ada");
    expect(events.filter((e) => e === "input")).toHaveLength(3);
    expect(events.filter((e) => e === "camo-before-change")).toHaveLength(3);
    expect(events).not.toContain("change");
    await userEvent.tab();
    expect(events).toContain("change");
    expect(events.filter((e) => e === "change")).toHaveLength(1);
  });

  it("is controlled: a cancelled camo-before-change keeps the previous value", async () => {
    const root = await page(skin, `<camo-text-field label="Letters"></camo-text-field>`);
    const field = q(root, "camo-text-field");
    field.addEventListener("camo-before-change", (e) => {
      if (/\d/.test((e as CustomEvent<{ value: string }>).detail.value)) e.preventDefault();
    });
    await userEvent.click(inner(field, ".camo-input"));
    await userEvent.keyboard("ab1c");
    expect(field.value).toBe("abc");
    expect((inner(field, ".camo-input") as HTMLInputElement).value).toBe("abc");
  });

  it("filters and formats without moving the cursor", async () => {
    const root = await page(skin, `<camo-text-field label="Phone"></camo-text-field>`);
    const field = q(root, "camo-text-field") as CamoTextField;
    field.inputFilter = inputFilters.digitsOnly(12);
    field.displayFormat = displayFormats.pattern("####-####-####");
    await settled(root);
    const input = inner(field, ".camo-input") as HTMLInputElement;
    await userEvent.click(input);
    await userEvent.keyboard("08123abc456");
    expect(field.value).toBe("08123456");
    expect(input.value).toBe("0812-3456");
    // Type in the middle: the cursor stays after what was typed.
    input.setSelectionRange(6, 6);
    await userEvent.keyboard("9");
    expect(field.value).toBe("081239456");
    expect(input.value).toBe("0812-3945-6");
    expect(input.selectionStart).toBe(7);
  });

  it("takes part in a native form: FormData, required, disabled, reset and validity", async () => {
    const root = await page(
      skin,
      `<form><camo-text-field name="email" label="Email" value="ada@example.com"></camo-text-field>
        <camo-text-field name="nick" label="Nick" required></camo-text-field>
        <camo-text-field name="off" label="Off" value="x" disabled></camo-text-field></form>`,
    );
    const form = q(root, "form") as unknown as HTMLFormElement;
    // Like a native text input, an empty one submits an empty string; a disabled one submits nothing.
    expect(data(form)).toEqual([
      ["email", "ada@example.com"],
      ["nick", ""],
    ]);
    const nick = q(root, "[name=nick]") as CamoTextField;
    expect(form.checkValidity()).toBe(false);
    expect(nick.validity.valueMissing).toBe(true);
    await userEvent.click(inner(nick, ".camo-input"));
    await userEvent.keyboard("ada");
    expect(form.checkValidity()).toBe(true);
    expect(data(form)).toEqual([
      ["email", "ada@example.com"],
      ["nick", "ada"],
    ]);
    form.reset();
    await settled(root);
    expect(nick.value).toBe("");
    expect((inner(nick, ".camo-input") as HTMLInputElement).value).toBe("");
    expect(q(root, "[name=email]").value).toBe("ada@example.com");
    expect(form.checkValidity()).toBe(false);
  });

  it("an error makes it invalid to its form, and clearing it makes it valid again", async () => {
    const root = await page(
      skin,
      `<form><camo-text-field name="a" label="A" value="x"></camo-text-field></form>`,
    );
    const form = q(root, "form") as unknown as HTMLFormElement;
    const field = q(root, "camo-text-field");
    expect(form.checkValidity()).toBe(true);
    field.error = "Taken";
    await settled(root);
    expect(form.checkValidity()).toBe(false);
    expect(field.validationMessage).toBe("Taken");
    field.error = null;
    await settled(root);
    expect(form.checkValidity()).toBe(true);
  });

  it("focus() reaches the input, and a click on the label focuses it", async () => {
    const root = await page(skin, `<camo-text-field label="Name"></camo-text-field>`);
    const field = q(root, "camo-text-field");
    field.focus();
    expect(field.shadowRoot!.activeElement).toBe(inner(field, ".camo-input"));
    (document.activeElement as HTMLElement).blur();
    await userEvent.click(inner(field, "#label"));
    expect(field.shadowRoot!.activeElement).toBe(inner(field, ".camo-input"));
  });

  it("obscures a secure field, becomes a textarea when multiline, and shows prefix and suffix text", async () => {
    const root = await page(
      skin,
      `<camo-text-field id="p" label="P" secure value="hunter2"></camo-text-field>
       <camo-text-field id="m" label="M" multiline></camo-text-field>
       <camo-text-field id="x" label="X" prefix-text="+62" suffix-text="kg" value="1"></camo-text-field>`,
    );
    expect(inner(q(root, "#p"), ".camo-input").getAttribute("type")).toBe("password");
    expect(inner(q(root, "#m"), ".camo-input").tagName).toBe("TEXTAREA");
    const affixes = [...q(root, "#x").shadowRoot!.querySelectorAll(".affix")].map(
      (a) => a.textContent,
    );
    expect(affixes).toEqual(["+62", "kg"]);
  });

  it("hides prefix text until it is focused or filled, so it never collides with a floating label", async () => {
    const root = await page(
      skin,
      `<camo-text-field id="e" label="Phone" label-placement="floating" prefix-text="+62"></camo-text-field>`,
    );
    const affix = inner(q(root, "#e"), ".affix");
    expect(getComputedStyle(affix).visibility).toBe("hidden");
    await userEvent.click(inner(q(root, "#e"), ".camo-input"));
    expect(getComputedStyle(affix).visibility).toBe("visible");
  });

  it("floats the label up when focused or filled, and leaves it in the field when empty", async () => {
    const root = await page(
      skin,
      `<camo-text-field id="e" label="Email" label-placement="floating"></camo-text-field>
       <camo-text-field id="f" label="Email" label-placement="floating" value="x"></camo-text-field>`,
    );
    const top = (id: string): number => inner(q(root, id), "#label").getBoundingClientRect().top;
    const boxTop = (id: string): number => inner(q(root, id), ".box").getBoundingClientRect().top;
    expect(top("#e")).toBeGreaterThan(boxTop("#e") + 4);
    expect(top("#f")).toBeLessThan(boxTop("#f") + 4);
  });

  it("puts a suffix action after the input, as its own button", async () => {
    const root = await page(
      skin,
      `<camo-text-field label="Password" secure value="x">
         <camo-field-action slot="suffix-icon" label="Show password"><camo-icon name="search"></camo-icon></camo-field-action>
       </camo-text-field>`,
    );
    const action = q(root, "camo-field-action");
    expect(inspectAria(action)).toMatchObject({ role: "button", label: "Show password" });
    let clicks = 0;
    action.addEventListener("click", () => clicks++);
    action.focus();
    await userEvent.keyboard("{Enter}");
    action.click();
    expect(clicks).toBe(2);
    expect(action.getBoundingClientRect().height).toBeLessThan(40);
  });
});

describe.each(["minimal", "cupertino"])("camo-search-field under %s", (skin) => {
  it("is a search input named by its placeholder, with a clear button only while it has a query", async () => {
    const root = await page(skin, `<camo-search-field></camo-search-field>`);
    const field = q(root, "camo-search-field");
    const input = inner(field, ".camo-input") as HTMLInputElement;
    expect(input.type).toBe("search");
    expect(input.getAttribute("aria-label")).toBe("Search");
    expect(inner(field, ".camo-clear")).toBeNull();
    await userEvent.click(input);
    await userEvent.keyboard("cam");
    const clear = inner(field, ".camo-clear");
    expect(clear.getAttribute("aria-label")).toBe("Clear search");
    await userEvent.click(clear);
    expect(field.value).toBe("");
    expect(field.shadowRoot!.activeElement).toBe(input); // the clear keeps focus
    expect(inner(field, ".camo-clear")).toBeNull();
  });

  it("fires camo-search on Enter with the query", async () => {
    const root = await page(skin, `<camo-search-field value="abc"></camo-search-field>`);
    const field = q(root, "camo-search-field");
    const seen: string[] = [];
    field.addEventListener("camo-search", (e) =>
      seen.push((e as CustomEvent<{ query: string }>).detail.query),
    );
    await userEvent.click(inner(field, ".camo-input"));
    await userEvent.keyboard("{Enter}");
    expect(seen).toEqual(["abc"]);
  });

  it("draws the skin's magnifier unless a leading icon is slotted", async () => {
    const root = await page(
      skin,
      `<camo-search-field id="a"></camo-search-field>
       <camo-search-field id="b"><camo-icon slot="leading" name="arrow-back"></camo-icon></camo-search-field>`,
    );
    expect(inner(q(root, "#a"), ".glyph")).not.toBeNull();
    const slot = inner(q(root, "#b"), 'slot[name="leading"]') as HTMLSlotElement;
    expect(slot.assignedElements()).toHaveLength(1);
  });
});

describe.each(["minimal", "cupertino"])("camo-checkbox and camo-switch under %s", (skin) => {
  it("announce role and state: checked, mixed, and on for a switch", async () => {
    const root = await page(
      skin,
      `<camo-checkbox id="a" label="Remember"></camo-checkbox><camo-checkbox id="b" label="All" indeterminate></camo-checkbox>
       <camo-switch id="c" label="Wi-Fi" checked></camo-switch>`,
    );
    expect(inspectAria(q(root, "#a"))).toMatchObject({
      role: "checkbox",
      label: "Remember",
      checked: false,
    });
    expect(inspectAria(q(root, "#b"))).toMatchObject({ checked: "mixed" });
    expect(inspectAria(q(root, "#c"))).toMatchObject({ role: "switch", checked: true });
  });

  it("toggle by click and Space (not Enter), fire change once, and clear indeterminate", async () => {
    const root = await page(skin, `<camo-checkbox label="All" indeterminate></camo-checkbox>`);
    const box = q(root, "camo-checkbox");
    let changes = 0;
    box.addEventListener("change", () => changes++);
    box.focus();
    await userEvent.keyboard("{Enter}");
    expect(box.checked).toBe(false);
    await userEvent.keyboard(" ");
    expect(box.checked).toBe(true);
    expect(box.indeterminate).toBe(false);
    box.click();
    expect(box.checked).toBe(false);
    expect(changes).toBe(2);
  });

  it("are controlled by camo-before-change", async () => {
    const root = await page(skin, `<camo-switch label="Locked"></camo-switch>`);
    const sw = q(root, "camo-switch");
    sw.addEventListener("camo-before-change", (e) => e.preventDefault());
    sw.click();
    expect(sw.checked).toBe(false);
  });

  it("do nothing while disabled, and leave a rich label's formatting alone", async () => {
    const root = await page(
      skin,
      `<camo-checkbox id="a" label="X" disabled></camo-checkbox>
       <camo-checkbox id="b">I agree to the <strong>terms</strong></camo-checkbox>`,
    );
    q(root, "#a").click();
    expect(q(root, "#a").checked).toBe(false);
    expect(q(root, "#a").tabIndex).toBe(-1);
    expect(inspectAria(q(root, "#b"))).toMatchObject({ label: "I agree to the terms" });
  });

  it("submit their value only while on, and are invalid while required and off", async () => {
    const root = await page(
      skin,
      `<form><camo-checkbox name="tos" value="yes" label="Terms" required></camo-checkbox>
        <camo-switch name="wifi" label="Wi-Fi" checked></camo-switch></form>`,
    );
    const form = q(root, "form") as unknown as HTMLFormElement;
    expect(data(form)).toEqual([["wifi", "on"]]);
    expect(form.checkValidity()).toBe(false);
    q(root, "camo-checkbox").click();
    await settled(root);
    expect(data(form)).toEqual([
      ["tos", "yes"],
      ["wifi", "on"],
    ]);
    expect(form.checkValidity()).toBe(true);
    form.reset();
    await settled(root);
    expect(q(root, "camo-checkbox").checked).toBe(false);
  });

  it("describe themselves with a description and show an error below the row", async () => {
    const root = await page(
      skin,
      `<camo-checkbox label="News" description="Monthly" error="Required"></camo-checkbox>`,
    );
    const box = q(root, "camo-checkbox");
    expect(inspectAria(box)).toMatchObject({ description: "Monthly", invalid: true });
    expect(inner(box, ".err").textContent).toBe("Required");
    expect(inner(box, ".desc").textContent).toBe("Monthly");
  });

  it("put the label on the right side of the row by the skin: Minimal after the box, Cupertino's checkmark list before", async () => {
    const root = await page(skin, `<camo-checkbox label="Label"></camo-checkbox>`);
    const box = q(root, "camo-checkbox");
    const control = inner(box, ".control").getBoundingClientRect();
    const label = inner(box, ".label").getBoundingClientRect();
    if (skin === "minimal") expect(label.left).toBeGreaterThan(control.left);
    else expect(label.left).toBeLessThan(control.left);
  });
});

describe.each(["minimal", "cupertino"])("camo-radio-group under %s", (skin) => {
  const group = (extra = ""): string => `<camo-radio-group name="plan" label="Plan" ${extra}>
    <camo-radio value="free" label="Free"></camo-radio>
    <camo-radio value="pro" label="Pro"></camo-radio>
    <camo-radio value="max" label="Max" disabled></camo-radio>
    <camo-radio value="team" label="Team"></camo-radio>
  </camo-radio-group>`;

  it("is a named radio group of radios announced as 2 of 4", async () => {
    const root = await page(skin, group('value="pro"'));
    expect(inspectAria(q(root, "camo-radio-group"))).toMatchObject({
      role: "radiogroup",
      label: "Plan",
    });
    const radios = [...root.querySelectorAll("camo-radio")] as El[];
    expect(inspectAria(radios[1]!)).toMatchObject({
      role: "radio",
      checked: true,
      position: { index: 2, size: 4 },
    });
    expect(inspectAria(radios[0]!)).toMatchObject({ checked: false });
  });

  it("puts the selected radio in the tab order, or the first when none is selected", async () => {
    const a = await page(skin, group('value="pro"'));
    expect([...a.querySelectorAll("camo-radio")].map((r) => r.getAttribute("tabindex"))).toEqual([
      "-1",
      "0",
      "-1",
      "-1",
    ]);
    const b = await page(skin, group());
    expect([...b.querySelectorAll("camo-radio")].map((r) => r.getAttribute("tabindex"))).toEqual([
      "0",
      "-1",
      "-1",
      "-1",
    ]);
  });

  it("moves and selects with the arrow keys, skips a disabled radio, and wraps", async () => {
    const root = await page(skin, group('value="free"'));
    const g = q(root, "camo-radio-group");
    const changes: string[] = [];
    g.addEventListener("change", () => changes.push(g.value));
    (root.querySelector("camo-radio") as HTMLElement).focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(g.value).toBe("pro");
    await userEvent.keyboard("{ArrowDown}");
    expect(g.value).toBe("team"); // "max" is disabled
    await userEvent.keyboard("{ArrowDown}");
    expect(g.value).toBe("free"); // wrapped
    await userEvent.keyboard("{ArrowUp}");
    expect(g.value).toBe("team");
    expect(changes).toEqual(["pro", "team", "free", "team"]);
  });

  it("selects by click, takes Tab out of the group in one step", async () => {
    const root = await page(skin, `${group()}<input id="after" aria-label="after" />`);
    const g = q(root, "camo-radio-group");
    (root.querySelectorAll("camo-radio")[1] as HTMLElement).click();
    expect(g.value).toBe("pro");
    (root.querySelectorAll("camo-radio")[1] as HTMLElement).focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(q(root, "#after"));
  });

  it("is controlled by camo-before-change", async () => {
    const root = await page(skin, group('value="free"'));
    const g = q(root, "camo-radio-group");
    g.addEventListener("camo-before-change", (e) => e.preventDefault());
    (root.querySelectorAll("camo-radio")[1] as HTMLElement).click();
    expect(g.value).toBe("free");
  });

  it("submits the selected value, is required-invalid until one is chosen, resets, and shows its error", async () => {
    const root = await page(skin, `<form>${group("required")}</form>`);
    const form = q(root, "form") as unknown as HTMLFormElement;
    expect(form.checkValidity()).toBe(false);
    (root.querySelectorAll("camo-radio")[3] as HTMLElement).click();
    await settled(root);
    expect(data(form)).toEqual([["plan", "team"]]);
    expect(form.checkValidity()).toBe(true);
    form.reset();
    await settled(root);
    expect(q(root, "camo-radio-group").value).toBe("");
    const g = q(root, "camo-radio-group");
    g.error = "Choose a plan";
    await settled(root);
    expect(g.shadowRoot!.querySelector(".err")!.textContent).toBe("Choose a plan");
    expect(inspectAria(g)).toMatchObject({ invalid: true });
  });
});

describe.each(["minimal", "cupertino"])("camo-segmented-control under %s", (skin) => {
  const seg = (attrs = ""): string => `<camo-segmented-control name="range" label="Range" ${attrs}>
    <camo-segment value="day" label="Day"></camo-segment>
    <camo-segment value="week" label="Week"></camo-segment>
    <camo-segment value="month" label="Month" disabled></camo-segment>
    <camo-segment value="year" label="Year"></camo-segment>
  </camo-segmented-control>`;

  it("is a radio group of segments with the first, middle and last position", async () => {
    const root = await page(skin, seg('value="week"'));
    expect(inspectAria(q(root, "camo-segmented-control"))).toMatchObject({
      role: "radiogroup",
      label: "Range",
    });
    const segs = [...root.querySelectorAll("camo-segment")] as El[];
    expect(segs.map((s) => s.position)).toEqual(["first", "middle", "middle", "last"]);
    expect(inspectAria(segs[1]!)).toMatchObject({ role: "radio", checked: true, label: "Week" });
  });

  it("selects by click and by arrow keys, skipping disabled, and fires change", async () => {
    const root = await page(skin, seg('value="day"'));
    const c = q(root, "camo-segmented-control");
    let changes = 0;
    c.addEventListener("change", () => changes++);
    (root.querySelectorAll("camo-segment")[1] as HTMLElement).click();
    expect(c.value).toBe("week");
    (root.querySelectorAll("camo-segment")[1] as HTMLElement).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(c.value).toBe("year");
    expect(changes).toBe(2);
  });

  it("allows several in multiple mode, as toggle buttons, and submits one entry each", async () => {
    const root = await page(skin, `<form>${seg("multiple")}</form>`);
    const c = q(root, "camo-segmented-control");
    expect(inspectAria(c)).toMatchObject({ role: "group" });
    const segs = [...root.querySelectorAll("camo-segment")] as El[];
    expect(inspectAria(segs[0]!)).toMatchObject({ role: "button", pressed: false });
    segs[0]!.click();
    segs[3]!.click();
    await settled(root);
    expect(c.values).toEqual(["day", "year"]);
    expect(inspectAria(segs[0]!)).toMatchObject({ pressed: true });
    expect(data(q(root, "form") as unknown as HTMLFormElement)).toEqual([
      ["range", "day"],
      ["range", "year"],
    ]);
    segs[0]!.click();
    expect(c.values).toEqual(["year"]);
  });

  it("names an icon-only segment by its content description", async () => {
    const root = await page(
      skin,
      `<camo-segmented-control label="View"><camo-segment value="l" icon="search" content-description="List"></camo-segment></camo-segmented-control>`,
    );
    expect(inspectAria(q(root, "camo-segment"))).toMatchObject({ label: "List" });
    expect(inner(q(root, "camo-segment"), "svg")).not.toBeNull();
  });
});

describe.each(["minimal", "cupertino"])("camo-slider under %s", (skin) => {
  it("is an adjustable element named by its label, with the value and a text for it", async () => {
    const root = await page(
      skin,
      `<camo-slider label="Volume" min="0" max="100" value="30"></camo-slider>`,
    );
    const s = q(root, "camo-slider");
    s.valueLabel = (v: number) => `${v} percent`;
    s.requestUpdate();
    await settled(root);
    expect(inspectAria(s)).toMatchObject({
      role: "slider",
      label: "Volume",
      value: { now: 30, min: 0, max: 100, text: "30 percent" },
    });
    expect(s.tabIndex).toBe(0);
  });

  it("moves with the keys: arrows one step, PageUp and PageDown 10%, Home and End, and RTL flips", async () => {
    const root = await page(
      skin,
      `<camo-slider label="V" min="0" max="100" step="5" value="50"></camo-slider>`,
    );
    const s = q(root, "camo-slider");
    const seen: string[] = [];
    s.addEventListener("change", () => seen.push(String(s.value)));
    s.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(s.value).toBe(55);
    await userEvent.keyboard("{ArrowDown}");
    expect(s.value).toBe(50);
    await userEvent.keyboard("{PageUp}");
    expect(s.value).toBe(60);
    await userEvent.keyboard("{Home}");
    expect(s.value).toBe(0);
    await userEvent.keyboard("{End}");
    expect(s.value).toBe(100);
    await userEvent.keyboard("{ArrowRight}");
    expect(s.value).toBe(100); // the end
    expect(seen).toEqual(["55", "50", "60", "0", "100"]);
    const rtl = await page(
      skin,
      `<camo-slider label="V" min="0" max="100" step="10" value="50"></camo-slider>`,
      "rtl",
    );
    const r = q(rtl, "camo-slider");
    r.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(r.value).toBe(40); // ArrowRight goes toward the start in right-to-left
  });

  it("snaps to the step and stays in the range, in fixed decimals", async () => {
    const root = await page(
      skin,
      `<camo-slider label="V" min="0" max="1" step="0.1" value="0.3"></camo-slider>`,
    );
    const s = q(root, "camo-slider");
    s.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(s.value).toBe(0.4);
    s.value = 0.34;
    await settled(root);
    await userEvent.keyboard("{ArrowRight}");
    expect(s.value).toBe(0.4);
    s.value = 5;
    await userEvent.keyboard("{ArrowLeft}");
    expect(s.value).toBe(0.9);
  });

  it("follows a drag on the track and fires input while dragging, change once at the end", async () => {
    const root = await page(
      skin,
      `<camo-slider label="V" min="0" max="100" value="0" style="inline-size:300px"></camo-slider>`,
    );
    const s = q(root, "camo-slider");
    const rail = inner(s, ".rail").getBoundingClientRect();
    const log: string[] = [];
    s.addEventListener("input", () => log.push("input"));
    s.addEventListener("change", () => log.push("change"));
    const fire = (type: string, x: number): void =>
      void s.dispatchEvent(
        new PointerEvent(type, {
          pointerId: 1,
          clientX: x,
          clientY: rail.top + 2,
          button: 0,
          bubbles: true,
          composed: true,
        }),
      );
    fire("pointerdown", rail.left + rail.width / 2);
    expect(Math.round(s.value)).toBeGreaterThan(40);
    expect(Math.round(s.value)).toBeLessThan(60);
    fire("pointermove", rail.right);
    expect(s.value).toBe(100);
    fire("pointerup", rail.right);
    expect(log.at(-1)).toBe("change");
    expect(log.filter((e) => e === "change")).toHaveLength(1);
    expect(log.filter((e) => e === "input").length).toBeGreaterThanOrEqual(2);
  });

  it("draws a stop mark per step, submits its value, resets, and ignores input when disabled", async () => {
    const root = await page(
      skin,
      `<form><camo-slider name="v" label="V" min="0" max="10" step="2" value="4"></camo-slider></form>`,
    );
    const s = q(root, "camo-slider");
    expect(s.shadowRoot!.querySelectorAll(".stop")).toHaveLength(6);
    const form = q(root, "form") as unknown as HTMLFormElement;
    expect(data(form)).toEqual([["v", "4"]]);
    s.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(data(form)).toEqual([["v", "6"]]);
    form.reset();
    await settled(root);
    expect(s.value).toBe(4);
    s.disabled = true;
    await settled(root);
    s.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(s.value).toBe(4);
    expect(s.tabIndex).toBe(-1);
  });
});

describe.each(["minimal", "cupertino"])("camo-stepper under %s", (skin) => {
  const buttons = (s: El): [HTMLButtonElement, HTMLButtonElement] => [
    inner(s, ".camo-decrease") as HTMLButtonElement,
    inner(s, ".camo-increase") as HTMLButtonElement,
  ];

  it("is a group with three stops: decrease, the value as a spinbutton, increase", async () => {
    const root = await page(
      skin,
      `<camo-stepper label="Quantity" min="1" max="3" value="2"></camo-stepper>`,
    );
    const s = q(root, "camo-stepper");
    expect(inspectAria(s)).toMatchObject({ role: "group", label: "Quantity" });
    const [dec, inc] = buttons(s);
    expect(dec.getAttribute("aria-label")).toBe("Decrease quantity");
    expect(inc.getAttribute("aria-label")).toBe("Increase quantity");
    const input = inner(s, ".camo-input") as HTMLInputElement;
    expect(input.getAttribute("role")).toBe("spinbutton");
    expect(input.getAttribute("aria-valuenow")).toBe("2");
    expect(input.getAttribute("aria-label")).toBe("Quantity");
  });

  it("steps by click and keyboard, fires change each time, and disables a button at its limit", async () => {
    const root = await page(
      skin,
      `<camo-stepper label="Q" min="1" max="3" value="2"></camo-stepper>`,
    );
    const s = q(root, "camo-stepper");
    const [dec, inc] = buttons(s);
    let changes = 0;
    s.addEventListener("change", () => changes++);
    inc.dispatchEvent(new PointerEvent("pointerdown", { button: 0, bubbles: true }));
    inc.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    await settled(root);
    expect(s.value).toBe(3);
    expect(inner(s, ".camo-increase").hasAttribute("disabled")).toBe(true);
    expect(dec.hasAttribute("disabled")).toBe(false);
    inner(s, ".camo-input").focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(s.value).toBe(1);
    await settled(root);
    expect(inner(s, ".camo-decrease").hasAttribute("disabled")).toBe(true);
    await userEvent.keyboard("{PageUp}");
    expect(s.value).toBe(3); // ten steps, held at the end
    await userEvent.keyboard("{Home}");
    expect(s.value).toBe(1);
    await userEvent.keyboard("{End}");
    expect(s.value).toBe(3);
    expect(changes).toBe(6);
  });

  it("repeats while a button is held, after a pause", async () => {
    const root = await page(
      skin,
      `<camo-stepper label="Q" min="0" max="100" value="0"></camo-stepper>`,
    );
    const s = q(root, "camo-stepper");
    const [, inc] = buttons(s);
    inc.dispatchEvent(new PointerEvent("pointerdown", { button: 0, bubbles: true }));
    expect(s.value).toBe(1);
    await new Promise((r) => setTimeout(r, 250));
    expect(s.value).toBe(1); // the pause before repeating
    await new Promise((r) => setTimeout(r, 700));
    inc.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    const held = s.value;
    expect(held).toBeGreaterThan(3);
    await new Promise((r) => setTimeout(r, 300));
    expect(s.value).toBe(held); // released
  });

  it("takes a typed value, clamped to the range and snapped to the step when focus leaves", async () => {
    const root = await page(
      skin,
      `<camo-stepper label="Q" min="0" max="20" step="5" value="5"></camo-stepper>`,
    );
    const s = q(root, "camo-stepper");
    const input = inner(s, ".camo-input") as HTMLInputElement;
    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.keyboard("12");
    expect(s.value).toBe(5); // still a draft
    await userEvent.tab();
    expect(s.value).toBe(10);
    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.keyboard("99");
    await userEvent.tab();
    expect(s.value).toBe(20);
    await settled(root);
    expect(input.value).toBe("20");
  });

  it("does not take typing when readonly, but its buttons still work", async () => {
    const root = await page(
      skin,
      `<camo-stepper label="Q" readonly value="1" max="5"></camo-stepper>`,
    );
    const s = q(root, "camo-stepper");
    expect((inner(s, ".camo-input") as HTMLInputElement).readOnly).toBe(true);
    s.value = 1;
    buttons(s)[1].dispatchEvent(new PointerEvent("pointerdown", { button: 0, bubbles: true }));
    buttons(s)[1].dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    expect(s.value).toBe(2);
  });

  it("adds decimals exactly: 0.1 + 0.2 is 0.3, and shows the digits it was given", async () => {
    const root = await page(
      skin,
      `<camo-stepper label="W" min="0" max="5" step="0.1" decimals="1" value="0.1"></camo-stepper>`,
    );
    const s = q(root, "camo-stepper");
    inner(s, ".camo-input").focus();
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    expect(s.value).toBe(0.3);
    await settled(root);
    expect((inner(s, ".camo-input") as HTMLInputElement).value).toBe("0.3");
  });

  it("uses the text a function gives for the value", async () => {
    const root = await page(skin, `<camo-stepper label="Nights" value="3"></camo-stepper>`);
    const s = q(root, "camo-stepper");
    s.valueText = (v: number) => `${v} nights`;
    await settled(root);
    s.requestUpdate();
    await settled(root);
    expect((inner(s, ".camo-input") as HTMLInputElement).value).toBe("3 nights");
    expect(inner(s, ".camo-input").getAttribute("aria-valuetext")).toBe("3 nights");
  });

  it("submits its value, is cancelable, and shows an error state", async () => {
    const root = await page(
      skin,
      `<form><camo-stepper name="qty" label="Q" value="2" error="Too many"></camo-stepper></form>`,
    );
    const s = q(root, "camo-stepper");
    expect(data(q(root, "form") as unknown as HTMLFormElement)).toEqual([["qty", "2"]]);
    expect(inner(s, ".camo-input").getAttribute("aria-invalid")).toBe("true");
    s.error = null;
    s.addEventListener("camo-before-change", (e) => e.preventDefault());
    s.focus();
    inner(s, ".camo-input").focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(s.value).toBe(2);
  });
});
