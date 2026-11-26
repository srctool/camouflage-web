import { LitElement, html } from "lit";
import type { TemplateResult } from "lit";
import {
  FOCUS_RING,
  PRESSED_ATTRIBUTE,
  PressController,
  RovingTabindexController,
  contentVariables,
  hasVisibleFocus,
  initialFocusTarget,
  rememberFocus,
  reportFormState,
  setCustomState,
  tabbables,
} from "@srctool/camouflage-core";
import { describe, expect, it } from "vitest";
import { mount, settled, SKINS } from "./helpers.ts";

class PressProbe extends LitElement {
  static override properties = { blocked: { type: Boolean } };
  declare blocked: boolean;
  readonly press = new PressController(this, () => this.blocked);
  constructor() {
    super();
    this.blocked = false;
    this.tabIndex = 0;
  }
  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
customElements.define("camo-test-press", PressProbe);

class Tabs extends LitElement {
  static override properties = { orientation: { type: String }, wrap: { type: Boolean } };
  declare orientation: "horizontal" | "vertical" | "both";
  declare wrap: boolean;
  readonly roving = new RovingTabindexController(this, {
    items: () => [...this.querySelectorAll<HTMLElement>("[role=tab]")],
    orientation: "horizontal",
    get wrap() {
      return true;
    },
  });
  constructor() {
    super();
    this.orientation = "horizontal";
    this.wrap = true;
  }
  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
customElements.define("camo-test-tabs", Tabs);

class Field extends LitElement {
  static formAssociated = true;
  readonly internals = this.attachInternals();
  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
customElements.define("camo-test-field", Field);

const key = (target: Element, name: string, type = "keydown"): void => {
  target.dispatchEvent(
    new KeyboardEvent(type, { key: name, bubbles: true, cancelable: true, composed: true }),
  );
};

describe("press", () => {
  it("is pressed while the pointer is down, and released when it is let go anywhere", async () => {
    const root = mount(`<camo-test-press></camo-test-press>`);
    const el = root.firstElementChild as PressProbe;
    await settled(root);
    el.dispatchEvent(new PointerEvent("pointerdown", { button: 0, bubbles: true }));
    expect(el.hasAttribute(PRESSED_ATTRIBUTE)).toBe(true);
    expect(el.press.pressed).toBe(true);
    window.dispatchEvent(new PointerEvent("pointerup"));
    expect(el.hasAttribute(PRESSED_ATTRIBUTE)).toBe(false);
  });

  it("ignores a right click", async () => {
    const root = mount(`<camo-test-press></camo-test-press>`);
    const el = root.firstElementChild as PressProbe;
    await settled(root);
    el.dispatchEvent(new PointerEvent("pointerdown", { button: 2, bubbles: true }));
    expect(el.press.pressed).toBe(false);
  });

  it("is pressed by Space and Enter, and released on key up or blur", async () => {
    const root = mount(`<camo-test-press></camo-test-press>`);
    const el = root.firstElementChild as PressProbe;
    await settled(root);
    key(el, " ");
    expect(el.hasAttribute(PRESSED_ATTRIBUTE)).toBe(true);
    key(el, " ", "keyup");
    expect(el.hasAttribute(PRESSED_ATTRIBUTE)).toBe(false);
    key(el, "Enter");
    expect(el.press.pressed).toBe(true);
    el.dispatchEvent(new FocusEvent("blur"));
    expect(el.press.pressed).toBe(false);
    key(el, "a");
    expect(el.press.pressed).toBe(false);
  });

  it("never presses a blocked host, and clears when it leaves the page", async () => {
    const root = mount(`<camo-test-press blocked></camo-test-press>`);
    const el = root.firstElementChild as PressProbe;
    await settled(root);
    el.dispatchEvent(new PointerEvent("pointerdown", { button: 0, bubbles: true }));
    expect(el.press.pressed).toBe(false);
    el.blocked = false;
    el.dispatchEvent(new PointerEvent("pointerdown", { button: 0, bubbles: true }));
    expect(el.press.pressed).toBe(true);
    el.remove();
    expect(el.hasAttribute(PRESSED_ATTRIBUTE)).toBe(false);
  });

  it("presses a camo-button with the keyboard, so the skin's feedback shows it", async () => {
    const root = mount(
      `<camo-provider skin="minimal"><camo-button text="Go"></camo-button></camo-provider>`,
    );
    await settled(root);
    const button = root.querySelector("camo-button")!;
    key(button, " ");
    expect(button.hasAttribute(PRESSED_ATTRIBUTE)).toBe(true);
    key(button, " ", "keyup");
    expect(button.hasAttribute(PRESSED_ATTRIBUTE)).toBe(false);
    button.setAttribute("disabled", "");
    await settled(root);
    key(button, "Enter");
    expect(button.hasAttribute(PRESSED_ATTRIBUTE)).toBe(false);
  });
});

describe("focus", () => {
  it("lists what a keyboard can reach, in order, and skips what it cannot", () => {
    const root = mount(`
      <a href="#a" id="a">a</a><button id="b">b</button><button id="c" disabled>c</button>
      <input id="d"><input id="e" type="hidden"><div id="f" tabindex="0">f</div>
      <div id="g" tabindex="-1">g</div><span id="h" hidden><button id="i">i</button></span>
      <div inert><button id="j">j</button></div>`);
    expect(tabbables(root).map((e) => e.id)).toEqual(["a", "b", "d", "f"]);
  });

  it("finds the first target by priority", () => {
    const root = mount(`<button id="x"></button><button id="y" autofocus></button>`);
    expect(initialFocusTarget(root, ["[autofocus]", "button"])?.id).toBe("y");
    expect(initialFocusTarget(root, ["#nope", "#x"])?.id).toBe("x");
    expect(initialFocusTarget(root, ["#nope"])).toBeNull();
  });

  it("gives focus back to where it was", () => {
    const root = mount(`<button id="from">from</button><button id="to">to</button>`);
    const from = root.querySelector<HTMLElement>("#from")!;
    from.focus();
    const restore = rememberFocus();
    root.querySelector<HTMLElement>("#to")!.focus();
    restore();
    expect(document.activeElement).toBe(from);
    from.remove();
    expect(() => restore()).not.toThrow();
  });

  it("reports keyboard focus apart from a mouse focus, and ships the ring", () => {
    const root = mount(`<button id="b">b</button>`);
    const b = root.querySelector<HTMLElement>("#b")!;
    expect(hasVisibleFocus(b)).toBe(false);
    expect(FOCUS_RING).toContain("outline: 2px solid var(--camo-color-primary)");
  });

  it("rings a focused camo-button in both skins", async () => {
    for (const skin of SKINS) {
      const root = mount(
        `<camo-provider skin="${skin}"><camo-button text="Go"></camo-button></camo-provider>`,
      );
      await settled(root);
      const button = root.querySelector("camo-button")!;
      // A key press moves focus by keyboard, which is what `:focus-visible` follows.
      button.focus({ focusVisible: true } as FocusOptions);
      const ring = [...button.shadowRoot!.querySelectorAll("style")]
        .map((style) => style.textContent)
        .join("");
      expect(ring).toContain(":host(:focus-visible)");
      expect(ring).toMatch(/outline:|box-shadow:/);
    }
  });
});

describe("roving tabindex", () => {
  const tabs = `<camo-test-tabs>
    <button role="tab" id="t1">1</button><button role="tab" id="t2">2</button>
    <button role="tab" id="t3" disabled>3</button><button role="tab" id="t4">4</button>
  </camo-test-tabs>`;
  const setup = async (
    markup = tabs,
  ): Promise<{ root: HTMLElement; tab: (n: number) => HTMLElement; host: Tabs }> => {
    const root = mount(markup);
    const host = root.firstElementChild as Tabs;
    await settled(root);
    host.roving.update();
    return { root, tab: (n) => root.querySelector<HTMLElement>(`#t${n}`)!, host };
  };

  it("puts one item in the tab order", async () => {
    const { tab } = await setup();
    expect([1, 2, 3, 4].map((n) => tab(n).getAttribute("tabindex"))).toEqual([
      "0",
      "-1",
      "-1",
      "-1",
    ]);
  });

  it("moves with the arrow keys, skipping a disabled item, and wraps", async () => {
    const { tab } = await setup();
    tab(1).focus();
    key(tab(1), "ArrowRight");
    expect(document.activeElement).toBe(tab(2));
    key(tab(2), "ArrowRight");
    expect(document.activeElement).toBe(tab(4)); // 3 is disabled
    key(tab(4), "ArrowRight");
    expect(document.activeElement).toBe(tab(1)); // wraps
    key(tab(1), "ArrowLeft");
    expect(document.activeElement).toBe(tab(4));
    expect(tab(4).getAttribute("tabindex")).toBe("0");
    expect(tab(1).getAttribute("tabindex")).toBe("-1");
  });

  it("goes to the first and the last with Home and End, and ignores other keys", async () => {
    const { tab } = await setup();
    tab(2).focus();
    key(tab(2), "End");
    expect(document.activeElement).toBe(tab(4));
    key(tab(4), "Home");
    expect(document.activeElement).toBe(tab(1));
    const event = new KeyboardEvent("keydown", { key: "a", bubbles: true, cancelable: true });
    tab(1).dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    key(tab(1), "ArrowDown"); // vertical keys do nothing in a horizontal group
    expect(document.activeElement).toBe(tab(1));
  });

  it("mirrors the arrows in right-to-left", async () => {
    const { tab, root } = await setup();
    root.setAttribute("dir", "rtl");
    tab(1).focus();
    key(tab(1), "ArrowLeft");
    expect(document.activeElement).toBe(tab(2));
    key(tab(2), "ArrowRight");
    expect(document.activeElement).toBe(tab(1));
  });

  it("follows focus that arrives by click, and repairs itself when items change", async () => {
    const { tab, host } = await setup();
    tab(4).focus();
    expect(tab(4).getAttribute("tabindex")).toBe("0");
    expect(tab(1).getAttribute("tabindex")).toBe("-1");
    tab(4).setAttribute("disabled", "");
    host.roving.update();
    expect(tab(1).getAttribute("tabindex")).toBe("0");
    expect(host.roving.index).toBe(0);
  });
});

describe("element internals", () => {
  it("sets a custom state, as :state() or as an attribute", async () => {
    const root = mount(`<camo-test-field></camo-test-field>`);
    const el = root.firstElementChild as Field;
    await settled(root);
    setCustomState(el, el.internals, "pressed", true);
    const viaStates = el.matches(":state(pressed)") || el.hasAttribute("data-camo-state-pressed");
    expect(viaStates).toBe(true);
    setCustomState(el, el.internals, "pressed", false);
    expect(el.matches(":state(pressed)")).toBe(false);
    expect(el.hasAttribute("data-camo-state-pressed")).toBe(false);
  });

  it("reports value and validity to the form", async () => {
    const root = mount(`<form><camo-test-field name="f"></camo-test-field></form>`);
    const el = root.querySelector("camo-test-field") as Field;
    const form = root.querySelector("form")!;
    await settled(root);
    reportFormState(el.internals, { value: "", required: true, message: "Say something" });
    expect(el.internals.validity.valueMissing).toBe(true);
    expect(el.internals.validationMessage).toBe("Say something");
    expect(form.checkValidity()).toBe(false);
    reportFormState(el.internals, { value: "hi", required: true });
    expect(form.checkValidity()).toBe(true);
    reportFormState(el.internals, { value: "no", valid: false, message: "No." });
    expect(el.internals.validity.customError).toBe(true);
    reportFormState(el.internals, { value: "ok" });
    expect(el.internals.validity.valid).toBe(true);
  });

  it("does not touch the host's attributes when internals carry the state", async () => {
    const root = mount(`<camo-button text="Go"></camo-button>`);
    await settled(root);
    expect(root.firstElementChild!.hasAttribute("aria-label")).toBe(false);
  });
});

describe("content color and icon style", () => {
  it("writes the two variables a container sets", () => {
    expect(contentVariables({ color: "red", iconSize: "20px" })).toBe(
      "--camo-content-color: red; --camo-icon-size: 20px;",
    );
    expect(contentVariables({ color: "red" })).toBe("--camo-content-color: red;");
    expect(contentVariables({})).toBe("");
  });

  it("sets both on a slotted icon, so text and icons inside a solid button follow it", async () => {
    const root = mount(
      `<camo-provider skin="minimal"><camo-button text="Go"><span slot="prefix-icon" id="i">*</span></camo-button></camo-provider>`,
    );
    await settled(root);
    const icon = root.querySelector<HTMLElement>("#i")!;
    expect(getComputedStyle(icon).getPropertyValue("--camo-content-color").trim()).toBe("#ffffff");
    expect(getComputedStyle(icon).getPropertyValue("--camo-icon-size").trim()).toBe("16px");
  });
});
