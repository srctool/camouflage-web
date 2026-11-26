import { inspectAria, messengerOf } from "@srctool/camouflage-core";
import type { CamoMessenger } from "@srctool/camouflage-core";
import { describe, expect, it } from "vitest";
import { registerDemoIcons } from "../../scenarios/icons.ts";
import { mount, settled, SKINS, traits } from "./helpers.ts";

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
const tick = (ms = 50): Promise<void> => new Promise((r) => setTimeout(r, ms));

describe.each(SKINS)("camo-progress-bar under %s", (skin) => {
  it("draws the fraction, clamps it, and is a progressbar with a percentage", async () => {
    const root = await page(
      skin,
      `<camo-progress-bar id="a" progress="0.4" label="Uploading"></camo-progress-bar><camo-progress-bar id="b" progress="3"></camo-progress-bar><camo-progress-bar id="c" progress="-1"></camo-progress-bar>`,
    );
    const bar = q(root, "#a");
    const fill = inner(bar, ".fill");
    expect(
      fill.getBoundingClientRect().width / inner(bar, ".bar").getBoundingClientRect().width,
    ).toBeCloseTo(0.4, 1);
    expect(inspectAria(bar)).toMatchObject({
      role: "progressbar",
      label: "Uploading",
      value: { now: 40, min: 0, max: 100, text: "40%" },
    });
    expect(inspectAria(q(root, "#b"))?.value?.now).toBe(100);
    expect(inspectAria(q(root, "#c"))?.value?.now).toBe(0);
    // A full bar has no track left to draw.
    expect(inner(q(root, "#b"), ".track")).toBeNull();
  });

  it("animates when there is no progress, with no value for a screen reader", async () => {
    const root = await page(skin, `<camo-progress-bar label="Loading"></camo-progress-bar>`);
    const bar = q(root, "camo-progress-bar");
    expect(inspectAria(bar)?.value).toBeUndefined();
    const fill = inner(bar, ".fill");
    expect(fill.getAnimations().length).toBe(1);
    expect(inner(bar, ".bar").classList.contains("indeterminate")).toBe(true);
    // Setting a fraction later stops the sweep and fills.
    bar.progress = 0.5;
    await bar.updateComplete;
    expect(inner(bar, ".fill").getAnimations().length).toBe(0);
  });

  it("takes the tone's colors, and fills from the right in right-to-left", async () => {
    const root = await page(
      skin,
      `<camo-progress-bar id="a" progress="0.5"></camo-progress-bar><camo-progress-bar id="b" progress="0.5" tone="error"></camo-progress-bar>`,
      "rtl",
    );
    const color = (id: string): string =>
      getComputedStyle(inner(q(root, id), ".fill")).backgroundColor;
    expect(color("#a")).not.toBe(color("#b"));
    const fill = inner(q(root, "#a"), ".fill").getBoundingClientRect();
    const bar = inner(q(root, "#a"), ".bar").getBoundingClientRect();
    expect(Math.abs(fill.right - bar.right)).toBeLessThan(1);
  });
});

describe.each(SKINS)("camo-progress-circle under %s", (skin) => {
  it("draws sizes, a ring for a fraction, and the same accessibility as the bar", async () => {
    const root = await page(
      skin,
      `<camo-progress-circle id="s" size="small" progress="0.25" label="Loading"></camo-progress-circle><camo-progress-circle id="m" progress="0.5"></camo-progress-circle><camo-progress-circle id="l" size="large" progress="1"></camo-progress-circle>`,
    );
    const w = (id: string): number => inner(q(root, id), "svg").getBoundingClientRect().width;
    expect(w("#s")).toBeLessThan(w("#m"));
    expect(w("#m")).toBeLessThan(w("#l"));
    expect(inspectAria(q(root, "#s"))).toMatchObject({
      role: "progressbar",
      label: "Loading",
      value: { now: 25 },
    });
    // The arc is the fraction of the circumference.
    const arc = inner(q(root, "#m"), ".arc");
    expect(Number.parseFloat(getComputedStyle(arc).strokeDashoffset)).toBeCloseTo(0.5, 2);
    expect((arc as unknown as SVGGraphicsElement).getBBox().width).toBeGreaterThan(20);
  });

  it("spins or fades spokes while the amount is unknown", async () => {
    const root = await page(skin, `<camo-progress-circle label="Loading"></camo-progress-circle>`);
    const circle = q(root, "camo-progress-circle");
    const animated = circle.shadowRoot!.querySelectorAll("svg, line, svg *");
    expect([...animated].some((n) => (n as Element).getAnimations().length > 0)).toBe(true);
    // Under Cupertino the spokes are real SVG lines (a template nested in an <svg> must be an `svg` template).
    if (skin === "cupertino") {
      const lines = circle.shadowRoot!.querySelectorAll("line");
      expect(lines).toHaveLength(12);
      expect(lines[0]).toBeInstanceOf(SVGLineElement);
      expect(lines[0]!.getBoundingClientRect().height).toBeGreaterThan(2);
    }
    expect(inspectAria(circle)?.value).toBeUndefined();
  });
});

describe.each(SKINS)("camo-banner under %s", (skin) => {
  it("is a status for info and success and an alert for warning and error", async () => {
    const root = await page(
      skin,
      ["info", "success", "warning", "error"]
        .map((t) => `<camo-banner id="${t}" tone="${t}" message="m"></camo-banner>`)
        .join(""),
    );
    expect(inspectAria(q(root, "#info"))?.role).toBe("status");
    expect(inspectAria(q(root, "#success"))?.role).toBe("status");
    expect(inspectAria(q(root, "#warning"))?.role).toBe("alert");
    expect(inspectAria(q(root, "#error"))?.role).toBe("alert");
  });

  it("draws a default status icon per tone, and the icon slot replaces it", async () => {
    const root = await page(
      skin,
      `<camo-banner id="a" tone="success" message="m"></camo-banner><camo-banner id="b" tone="error" message="m"></camo-banner><camo-banner id="c" message="m"><span slot="icon" id="mine">!</span></camo-banner>`,
    );
    const path = (id: string): string =>
      inner(q(root, id), ".icon svg path").getAttribute("d") ?? "";
    expect(path("#a")).not.toBe("");
    expect(path("#a")).not.toBe(path("#b"));
    const slot = inner(q(root, "#c"), "slot[name=icon]") as HTMLSlotElement;
    expect(slot.assignedNodes()[0]).toBe(q(root, "#mine"));
  });

  it("shows the title and message, places actions below them, and tints by tone and appearance", async () => {
    const root = await page(
      skin,
      `<camo-banner id="a" tone="warning" title="Storage" message="Almost full"><camo-button slot="actions" text="Manage" appearance="ghost"></camo-button></camo-banner><camo-banner id="b" tone="warning" appearance="solid" message="x"></camo-banner><camo-banner id="c" tone="info" message="x"></camo-banner>`,
    );
    const a = q(root, "#a");
    expect(inner(a, ".title").textContent).toBe("Storage");
    expect(inner(a, ".message").textContent).toBe("Almost full");
    expect(a.hasAttribute("title")).toBe(false); // no browser tooltip over the banner
    const actions = inner(a, ".actions").getBoundingClientRect();
    expect(actions.top).toBeGreaterThanOrEqual(
      inner(a, ".message").getBoundingClientRect().bottom - 1,
    );
    const bg = (id: string): string =>
      getComputedStyle(inner(q(root, id), ".camo-surface")).backgroundColor;
    expect(new Set([bg("#a"), bg("#b"), bg("#c")]).size).toBe(3);
  });

  it("fires camo-dismiss from its button, and has the button only when dismissible", async () => {
    const root = await page(
      skin,
      `<camo-banner id="a" message="m" dismissible></camo-banner><camo-banner id="b" message="m"></camo-banner>`,
    );
    let dismissed = 0;
    q(root, "#a").addEventListener("camo-dismiss", () => dismissed++);
    expect(inner(q(root, "#b"), ".dismiss")).toBeNull();
    const button = inner(q(root, "#a"), ".dismiss") as HTMLButtonElement;
    expect(button.getAttribute("aria-label")).toBe("Dismiss");
    button.click();
    expect(dismissed).toBe(1);
  });
});

describe.each(SKINS)("the messenger and camo-snackbar under %s", (skin) => {
  const snackbars = (root: ParentNode): El[] => [...root.querySelectorAll<El>("camo-snackbar")];

  it("shows one message at a time, in order, and resolves with how each ended", async () => {
    const root = await page(skin, `<span id="host"></span>`);
    const messenger: CamoMessenger = messengerOf(q(root, "#host"));
    const first = messenger.show("One", { action: "Undo" });
    const second = messenger.show("Two", { duration: 400 });
    const third = messenger.show("Three", { duration: 400 });
    await tick();
    expect(snackbars(root).map((s) => s.message)).toEqual(["One"]);
    expect(messenger.pending).toBe(2);
    // The action ends the first with "action".
    (inner(snackbars(root)[0]!, ".action") as HTMLButtonElement).click();
    expect(await first).toBe("action");
    await tick();
    expect(snackbars(root).map((s) => s.message)).toEqual(["Two"]);
    // The second times out and the third follows.
    expect(await second).toBe("dismissed");
    await tick();
    expect(snackbars(root).map((s) => s.message)).toEqual(["Three"]);
    expect(await third).toBe("dismissed");
    await tick();
    expect(snackbars(root)).toHaveLength(0);
  });

  it("dismissCurrent replaces an outdated message, and the dismiss button dismisses", async () => {
    const root = await page(skin, `<span id="host"></span>`);
    const messenger = messengerOf(q(root, "#host"));
    const old = messenger.show("Old", { duration: "indefinite" });
    const next = messenger.show("New", { duration: "indefinite", withDismiss: true });
    await tick();
    messenger.dismissCurrent();
    expect(await old).toBe("dismissed");
    await tick();
    const current = snackbars(root)[0]!;
    expect(current.message).toBe("New");
    (inner(current, ".dismiss") as HTMLButtonElement).click();
    expect(await next).toBe("dismissed");
  });

  it("stays in the top layer, announces politely and an error assertively", async () => {
    const root = await page(skin, `<span id="host"></span>`);
    const messenger = messengerOf(q(root, "#host"));
    const a = messenger.show("Saved", { duration: "indefinite" });
    await tick();
    const calm = snackbars(root)[0]!;
    expect(calm.matches(":popover-open")).toBe(true);
    expect(inspectAria(calm)).toMatchObject({ role: "status", live: "polite" });
    messenger.dismissCurrent();
    await a;
    const b = messenger.show("Failed", { tone: "error", duration: "indefinite" });
    await tick();
    expect(inspectAria(snackbars(root)[0]!)).toMatchObject({ role: "alert", live: "assertive" });
    messenger.dismissCurrent();
    await b;
  });

  it("pauses its timer while hovered or focused, so there is time to reach the action", async () => {
    const root = await page(skin, `<span id="host"></span>`);
    const messenger = messengerOf(q(root, "#host"));
    const result = messenger.show("Hold", { action: "Undo", duration: 300 });
    await tick(20);
    const el = snackbars(root)[0]!;
    el.dispatchEvent(new PointerEvent("pointerenter"));
    await tick(1500); // well past the duration (a held timer is at least a second)
    expect(snackbars(root)).toHaveLength(1);
    (inner(el, ".action") as HTMLButtonElement).click();
    expect(await result).toBe("action");
  });

  it("uses the skin's position: the edge and the side its dialect puts it", async () => {
    const root = await page(skin, `<span id="host"></span>`);
    const messenger = messengerOf(q(root, "#host"));
    const done = messenger.show("Placed", { duration: "indefinite" });
    await tick(100);
    const box = snackbars(root)[0]!.getBoundingClientRect();
    const [edge, side] = traits(skin).snackbar;
    if (edge === "bottom") expect(box.bottom).toBeGreaterThan(window.innerHeight / 2);
    else expect(box.top).toBeLessThan(window.innerHeight / 2);
    // Centered along the edge, or at its end (a window at least medium wide).
    const off = box.left + box.width / 2 - window.innerWidth / 2;
    if (side === "center" || window.innerWidth < 600) expect(Math.abs(off)).toBeLessThan(2);
    else expect(off).toBeGreaterThan(0);
    messenger.dismissCurrent();
    await done;
  });

  it("is itself usable as an element: a message, an action, a tone and the camo-action event", async () => {
    const root = await page(
      skin,
      `<camo-snackbar message="Archived" action="Undo" tone="error" with-dismiss></camo-snackbar>`,
    );
    const el = q(root, "camo-snackbar");
    expect(inner(el, ".message").textContent).toBe("Archived");
    let fired = "";
    el.addEventListener("camo-action", () => (fired = "action"));
    (inner(el, ".action") as HTMLButtonElement).click();
    expect(fired).toBe("action");
    expect(inner(el, ".dismiss")).not.toBeNull();
  });
});
