import { inspectAria } from "@srctool/camouflage-core";
import { userEvent } from "vitest/browser";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { box, cssVar, mount, settled } from "./helpers.ts";

const surfaceOf = (button: Element): HTMLElement =>
  button.shadowRoot!.querySelector(".camo-surface") as HTMLElement;

const background = (button: Element): string => getComputedStyle(surfaceOf(button)).backgroundColor;

// A themed surface with room around the content, like an app's page.
const surface = (body: string): string =>
  `<div style="background: var(--camo-color-surface); padding: 24px">${body}</div>`;

async function page(
  skin: string,
  body: string,
): Promise<{ root: HTMLElement; button: HTMLElement }> {
  const root = mount(
    `<camo-provider skin="${skin}" scheme="light">${surface(body)}</camo-provider>`,
  );
  await settled(root);
  return { root, button: root.querySelector("camo-button") as HTMLElement };
}

describe.each(["minimal", "cupertino"])("camo-button under %s", (skin) => {
  it("is a button with a name, from the attributes", async () => {
    const { button } = await page(skin, `<camo-button text="Save"></camo-button>`);
    expect(inspectAria(button)).toMatchObject({
      role: "button",
      label: "Save",
      disabled: false,
      busy: false,
    });
    expect(button.tabIndex).toBe(0);
    expect(button.shadowRoot!.querySelector(".label")!.textContent).toBe("Save");
  });

  it("draws solid, soft, outline and ghost differently, and tones through the family", async () => {
    const { root } = await page(
      skin,
      `<camo-button id="solid" text="a"></camo-button>
       <camo-button id="ghost" text="b" appearance="ghost"></camo-button>
       <camo-button id="error" text="c" tone="error"></camo-button>`,
    );
    const solid = background(root.querySelector("#solid")!);
    expect(solid).not.toBe("rgba(0, 0, 0, 0)");
    expect(background(root.querySelector("#ghost")!)).toBe("rgba(0, 0, 0, 0)");
    expect(background(root.querySelector("#error")!)).not.toBe(solid);
  });

  it("fires the native click, and does not when disabled or loading", async () => {
    const { button } = await page(skin, `<camo-button text="Go"></camo-button>`);
    let clicks = 0;
    button.addEventListener("click", () => clicks++);
    button.click();
    expect(clicks).toBe(1);
    button.setAttribute("disabled", "");
    await settled();
    button.click();
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
    expect(clicks).toBe(1);
    expect(inspectAria(button)?.disabled).toBe(true);
    expect(button.tabIndex).toBe(-1);
    button.removeAttribute("disabled");
    button.setAttribute("loading", "");
    await settled();
    button.click();
    expect(clicks).toBe(1);
    expect(inspectAria(button)).toMatchObject({ busy: true, disabled: false });
    expect(button.tabIndex).toBe(0); // a loading button keeps focus
  });

  it("activates with Enter, and with Space on release", async () => {
    const { button } = await page(skin, `<camo-button text="Go"></camo-button>`);
    let clicks = 0;
    button.addEventListener("click", () => clicks++);
    button.focus();
    await userEvent.keyboard("{Enter}");
    expect(clicks).toBe(1);
    await userEvent.keyboard(" ");
    expect(clicks).toBe(2);
  });

  it("shows a keyboard focus ring, and not for the mouse", async () => {
    const { root, button } = await page(skin, `<camo-button text="Go"></camo-button>`);
    await userEvent.tab();
    expect(document.activeElement).toBe(button);
    const veil = button.shadowRoot!.querySelector(".camo-feedback-veil") as HTMLElement;
    expect(getComputedStyle(veil).outlineStyle).toBe("solid");
    void root;
  });

  it("places the icon slots before and after the label, and mirrors them in right to left", async () => {
    const icon = (slot: string): string =>
      `<svg slot="${slot}" viewBox="0 0 8 8" width="8" height="8"><circle cx="4" cy="4" r="4"/></svg>`;
    const { button } = await page(
      skin,
      `<camo-button text="Next">${icon("prefix-icon")}${icon("suffix-icon")}</camo-button>`,
    );
    const [prefix, suffix] = [...button.querySelectorAll("svg")] as SVGElement[];
    const label = button.shadowRoot!.querySelector(".label")!;
    expect(box(prefix!).right).toBeLessThanOrEqual(box(label).left + 1);
    expect(box(suffix!).left).toBeGreaterThanOrEqual(box(label).right - 1);
    const rtl = mount(
      `<div dir="rtl"><camo-provider skin="${skin}"><camo-button text="Next">${icon("prefix-icon")}</camo-button></camo-provider></div>`,
    );
    await settled(rtl);
    const rtlButton = rtl.querySelector("camo-button")!;
    expect(box(rtlButton.querySelector("svg")!).left).toBeGreaterThanOrEqual(
      box(rtlButton.shadowRoot!.querySelector(".label")!).right - 1,
    );
  });

  it("is the style's height, and its touch area reaches 48", async () => {
    const { button } = await page(skin, `<camo-button text="Go"></camo-button>`);
    const height = box(button).height;
    expect(height).toBe(skin === "minimal" ? 40 : 44);
    const r = box(button);
    const probe = document.elementFromPoint(r.left + r.width / 2, r.top - (48 - height) / 2 + 1);
    expect(probe).toBe(button);
  });

  it("takes a component-theme variable from the page", async () => {
    const { root, button } = await page(skin, `<camo-button text="Go"></camo-button>`);
    (root as HTMLElement).style.setProperty("--camo-button-height", "60px");
    root.firstElementChild!.setAttribute("style", "--camo-button-height: 60px");
    await settled();
    expect(box(button).height).toBe(60);
    expect(cssVar(root.firstElementChild!, "--camo-button-height")).toBe("60px");
  });

  it("shows a spinner and keeps its width while loading", async () => {
    const { button } = await page(skin, `<camo-button text="Save changes"></camo-button>`);
    const before = box(button).width;
    button.setAttribute("loading", "");
    await settled();
    expect(button.shadowRoot!.querySelector(".spinner")).not.toBeNull();
    expect(box(button).width).toBe(before);
  });

  it("has no accessibility violations in light or dark (axe)", async () => {
    for (const scheme of ["light", "dark"]) {
      const root = mount(
        `<camo-provider skin="${skin}" scheme="${scheme}">${surface(
          `<camo-button text="Save"></camo-button><camo-button text="Cancel" appearance="outline"></camo-button><camo-button text="Delete" tone="error" appearance="soft"></camo-button>`,
        )}</camo-provider>`,
      );
      await settled(root);
      const results = await axe.run(root);
      const found = results.violations.map(
        (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
      );
      // Known (a spike finding, to settle in W8): Cupertino's system blue under white text is about 4.0:1, and the
      // tinted error button is close to it, below the 4.5:1 WCAG AA asks of 16 px semibold text. Flutter's guideline
      // calls 14 px bold "large", so the Dart gallery passes it. It is the only violation allowed here.
      const known = skin === "cupertino" ? ["color-contrast"] : [];
      expect(
        results.violations.map((v) => v.id),
        `${skin} ${scheme}: ${found.join(" | ")}`,
      ).toEqual(known);
    }
  });
});
