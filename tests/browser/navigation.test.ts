import { inspectAria } from "@srctool/camouflage-core";
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
const all = (root: ParentNode, selector: string): El[] => [...root.querySelectorAll<El>(selector)];
const inner = (el: Element, selector: string): HTMLElement =>
  el.shadowRoot!.querySelector<HTMLElement>(selector)!;
const tick = (ms = 50): Promise<void> => new Promise((r) => setTimeout(r, ms));
const tab = (value: string, label: string, extra = ""): string =>
  `<camo-tab value="${value}" label="${label}"${extra}></camo-tab>`;
const three = `${tab("a", "Overview")}${tab("b", "Reviews")}${tab("c", "Specs")}`;

describe.each(["minimal", "cupertino"])("camo-tabs under %s", (skin) => {
  it("is a tablist of tabs, each with its place and selection", async () => {
    const root = await page(skin, `<camo-tabs label="Product" value="b">${three}</camo-tabs>`);
    expect(inspectAria(q(root, "camo-tabs"))).toMatchObject({
      role: "tablist",
      label: "Product",
      orientation: "horizontal",
    });
    const tabs = all(root, "camo-tab");
    expect(inspectAria(tabs[1]!)).toMatchObject({
      role: "tab",
      label: "Reviews",
      selected: true,
      position: { index: 2, size: 3 },
    });
    expect(inspectAria(tabs[0]!)).toMatchObject({
      selected: false,
      position: { index: 1, size: 3 },
    });
    expect(tabs.map((t) => t.tabIndex)).toEqual([-1, 0, -1]); // one tab stop
  });

  it("selects on a click, asking first with a cancelable event, then firing change", async () => {
    const root = await page(skin, `<camo-tabs label="x" value="a">${three}</camo-tabs>`);
    const tabs = q(root, "camo-tabs");
    const seen: string[] = [];
    tabs.addEventListener("camo-before-change", (e: Event) =>
      seen.push(`before:${(e as CustomEvent).detail.value}`),
    );
    tabs.addEventListener("change", () => seen.push(`change:${tabs.value}`));
    all(root, "camo-tab")[2]!.click();
    expect(tabs.value).toBe("c");
    expect(seen).toEqual(["before:c", "change:c"]);
    // A cancelled change keeps the tab.
    tabs.addEventListener("camo-before-change", (e: Event) => e.preventDefault());
    all(root, "camo-tab")[0]!.click();
    expect(tabs.value).toBe("c");
    // The current tab again is not a change.
    seen.length = 0;
    all(root, "camo-tab")[2]!.click();
    expect(seen).toEqual([]);
  });

  it("moves focus and selects with the arrow keys, Home and End, and mirrors them in right-to-left", async () => {
    const root = await page(skin, `<camo-tabs label="x" value="a">${three}</camo-tabs>`);
    const tabs = q(root, "camo-tabs");
    all(root, "camo-tab")[0]!.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(tabs.value).toBe("b");
    await userEvent.keyboard("{End}");
    expect(tabs.value).toBe("c");
    await userEvent.keyboard("{Home}");
    expect(tabs.value).toBe("a");
    const rtl = await page(skin, `<camo-tabs label="x" value="a">${three}</camo-tabs>`, "rtl");
    all(rtl, "camo-tab")[0]!.focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(q(rtl, "camo-tabs").value).toBe("b");
  });

  it("skips a disabled tab, and ignores a click on it", async () => {
    const root = await page(
      skin,
      `<camo-tabs label="x" value="a">${tab("a", "A")}${tab("b", "B", " disabled")}${tab("c", "C")}</camo-tabs>`,
    );
    all(root, "camo-tab")[0]!.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(q(root, "camo-tabs").value).toBe("c");
    all(root, "camo-tab")[1]!.click();
    expect(q(root, "camo-tabs").value).toBe("c");
  });

  it("slides one indicator under the selected tab, and measures it again when the tab changes", async () => {
    const root = await page(skin, `<camo-tabs label="x" value="a">${three}</camo-tabs>`);
    const tabs = q(root, "camo-tabs");
    const indicator = inner(tabs, ".indicator");
    const where = (): DOMRect => indicator.getBoundingClientRect();
    expect(getComputedStyle(indicator).opacity).toBe("1");
    const first = all(root, "camo-tab")[0]!.getBoundingClientRect();
    expect(where().left).toBeGreaterThanOrEqual(first.left - 1);
    expect(where().right).toBeLessThanOrEqual(first.right + 1);
    tabs.value = "c";
    await tabs.updateComplete;
    await tick(700); // the slide
    const last = all(root, "camo-tab")[2]!.getBoundingClientRect();
    expect(where().left).toBeGreaterThanOrEqual(last.left - 1);
    expect(where().right).toBeLessThanOrEqual(last.right + 1);
    // The tabs hand over: they draw no indicator of their own.
    expect(all(root, "camo-tab").every((t) => t.indicated)).toBe(true);
    expect(root.querySelectorAll("camo-tab").length).toBe(3);
  });

  it("puts the indicator at the start edge in right-to-left", async () => {
    const root = await page(skin, `<camo-tabs label="x" value="a">${three}</camo-tabs>`, "rtl");
    await tick(100);
    const indicator = inner(q(root, "camo-tabs"), ".indicator").getBoundingClientRect();
    const first = all(root, "camo-tab")[0]!.getBoundingClientRect();
    // The first tab is the rightmost one.
    expect(
      Math.abs((indicator.left + indicator.right) / 2 - (first.left + first.right) / 2),
    ).toBeLessThan(first.width / 2);
    expect(first.left).toBeGreaterThan(all(root, "camo-tab")[2]!.getBoundingClientRect().left);
  });

  it("shares the width in a fixed bar, and keeps natural widths and scrolls when scrollable", async () => {
    const six = ["a", "b", "c", "d", "e", "f"]
      .map((k) => tab(k, `Section ${k.toUpperCase()}`))
      .join("");
    const root = await page(
      skin,
      `<div style="width:300px"><camo-tabs id="fixed" label="x" value="a">${three}</camo-tabs><camo-tabs id="scroll" label="x" value="a" scrollable>${six}</camo-tabs></div>`,
    );
    const fixed = all(q(root, "#fixed"), "camo-tab").map((t) =>
      Math.round(t.getBoundingClientRect().width),
    );
    expect(Math.max(...fixed) - Math.min(...fixed)).toBeLessThanOrEqual(1);
    const row = inner(q(root, "#scroll"), ".row");
    expect(row.scrollWidth).toBeGreaterThan(row.clientWidth);
    // Selecting a tab out of sight scrolls it into view.
    q(root, "#scroll").value = "f";
    await q(root, "#scroll").updateComplete;
    await tick(300);
    expect(row.scrollLeft).toBeGreaterThan(0);
  });

  it("draws the skin's look: a pill behind the tab under Cupertino, a line under Minimal; scrolling falls back to a line", async () => {
    const root = await page(
      skin,
      `<camo-tabs id="a" label="x" value="a">${three}</camo-tabs><camo-tabs id="b" label="x" value="a" scrollable>${three}</camo-tabs>`,
    );
    const height = (id: string): number =>
      inner(q(root, id), ".indicator").getBoundingClientRect().height;
    if (skin === "cupertino") {
      expect(inner(q(root, "#a"), ".tabs").classList.contains("segmented")).toBe(true);
      expect(height("#a")).toBeGreaterThan(20); // a pill the height of the bar
      expect(inner(q(root, "#b"), ".tabs").classList.contains("underline")).toBe(true);
      expect(height("#b")).toBeLessThan(5);
    } else {
      expect(height("#a")).toBeLessThan(5);
      expect(inner(q(root, "#a"), ".divider")).not.toBeNull();
    }
  });

  it("takes an icon, a badge and custom content, and names an icon-only tab", async () => {
    const root = await page(
      skin,
      `<camo-tabs label="x" value="a"><camo-tab value="a" label="Inbox" icon="inbox"><camo-badge slot="badge" count="4"></camo-badge></camo-tab><camo-tab value="b" icon="star" content-description="Starred"></camo-tab></camo-tabs>`,
    );
    const [a, b] = all(root, "camo-tab");
    expect(inner(a!, ".icon svg")).not.toBeNull();
    expect((inner(a!, "slot[name=badge]") as HTMLSlotElement).assignedNodes()).toHaveLength(1);
    expect(inspectAria(b!)).toMatchObject({ role: "tab", label: "Starred" });
    expect(inner(b!, ".label")).toBeNull();
  });
});

const items = (extra = ""): string =>
  `<camo-nav-item value="home" label="Home" icon="home" selected-icon="home-filled"></camo-nav-item><camo-nav-item value="inbox" label="Inbox" icon="inbox"><camo-badge slot="badge" count="3"></camo-badge></camo-nav-item><camo-nav-item value="saved" label="Saved" icon="star"${extra}></camo-nav-item>`;

describe.each(["minimal", "cupertino"])("camo-navigation-bar under %s", (skin) => {
  it("is a navigation landmark of links, the selected one the current page", async () => {
    const root = await page(
      skin,
      `<camo-navigation-bar label="Main" value="inbox">${items()}</camo-navigation-bar>`,
    );
    expect(inspectAria(q(root, "camo-navigation-bar"))).toMatchObject({
      role: "navigation",
      label: "Main",
    });
    const [home, inbox] = all(root, "camo-nav-item");
    expect(inspectAria(inbox!)).toMatchObject({ role: "link", label: "Inbox", current: "page" });
    expect(inspectAria(home!)?.current).toBeNull();
    expect(all(root, "camo-nav-item").map((i) => i.tabIndex)).toEqual([-1, 0, -1]);
  });

  it("selects on a click or a key, fires before-change and change, and reports a reselect", async () => {
    const root = await page(
      skin,
      `<camo-navigation-bar label="Main" value="home">${items()}</camo-navigation-bar>`,
    );
    const bar = q(root, "camo-navigation-bar");
    const seen: string[] = [];
    bar.addEventListener("camo-before-change", (e: Event) =>
      seen.push(`before:${(e as CustomEvent).detail.value}`),
    );
    bar.addEventListener("change", () => seen.push(`change:${bar.value}`));
    bar.addEventListener("camo-reselect", () => seen.push("reselect"));
    all(root, "camo-nav-item")[2]!.click();
    expect(bar.value).toBe("saved");
    all(root, "camo-nav-item")[1]!.focus();
    await userEvent.keyboard("{Enter}");
    expect(bar.value).toBe("inbox");
    all(root, "camo-nav-item")[1]!.click();
    expect(seen).toEqual([
      "before:saved",
      "change:saved",
      "before:inbox",
      "change:inbox",
      "reselect",
    ]);
    bar.addEventListener("camo-before-change", (e: Event) => e.preventDefault());
    all(root, "camo-nav-item")[0]!.click();
    expect(bar.value).toBe("inbox");
  });

  it("moves between items with the arrow keys (it does not select), and mirrors them in right-to-left", async () => {
    const root = await page(
      skin,
      `<camo-navigation-bar label="Main" value="home">${items()}</camo-navigation-bar>`,
    );
    all(root, "camo-nav-item")[0]!.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(all(root, "camo-nav-item")[1]);
    expect(q(root, "camo-navigation-bar").value).toBe("home");
    const rtl = await page(
      skin,
      `<camo-navigation-bar label="Main" value="home">${items()}</camo-navigation-bar>`,
      "rtl",
    );
    all(rtl, "camo-nav-item")[0]!.focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(all(rtl, "camo-nav-item")[1]);
  });

  it("skips and ignores a disabled item", async () => {
    const root = await page(
      skin,
      `<camo-navigation-bar label="Main" value="home">${items(" disabled")}</camo-navigation-bar>`,
    );
    const last = all(root, "camo-nav-item")[2]!;
    last.click();
    expect(q(root, "camo-navigation-bar").value).toBe("home");
    expect(inspectAria(last)).toMatchObject({ disabled: true });
  });

  it("shares the width between items, draws the selected icon and labels, and places the badge on the icon", async () => {
    const root = await page(
      skin,
      `<camo-navigation-bar label="Main" value="home">${items()}</camo-navigation-bar>`,
    );
    const widths = all(root, "camo-nav-item").map((i) =>
      Math.round(i.getBoundingClientRect().width),
    );
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
    const [home, inbox, saved] = all(root, "camo-nav-item");
    // The selected item draws its filled icon.
    const d = (el: El): string => inner(el, ".icon path")?.getAttribute("d") ?? "";
    expect(d(home!)).not.toBe("");
    expect(inner(inbox!, ".label").textContent).toBe("Inbox");
    const color = (el: El): string => getComputedStyle(inner(el, ".label")).color;
    expect(color(home!)).not.toBe(color(saved!)); // selected and not
    const badge = q(inbox!, "camo-badge").getBoundingClientRect();
    const icon = inner(inbox!, ".box").getBoundingClientRect();
    expect(badge.top).toBeLessThan(icon.top + icon.height / 2);
  });

  it("slides out when hidden, and a hidden bar takes no focus", async () => {
    const root = await page(
      skin,
      `<camo-navigation-bar label="Main" value="home">${items()}</camo-navigation-bar>`,
    );
    const bar = q(root, "camo-navigation-bar");
    bar.hidden = true;
    await bar.updateComplete;
    await tick(500);
    expect(getComputedStyle(bar).visibility).toBe("hidden");
    all(root, "camo-nav-item")[0]!.focus();
    expect(document.activeElement).not.toBe(all(root, "camo-nav-item")[0]);
    bar.hidden = false;
    await bar.updateComplete;
    await tick(500);
    expect(getComputedStyle(bar).visibility).toBe("visible");
  });
});

describe.each(["minimal", "cupertino"])("camo-navigation-rail under %s", (skin) => {
  it("stacks its items, moves with Up and Down, and keeps the header fixed above them", async () => {
    const root = await page(
      skin,
      `<div style="height:400px"><camo-navigation-rail label="Main" value="home"><camo-fab slot="header" content-description="Compose"><camo-icon slot="icon" name="edit"></camo-icon></camo-fab>${items()}</camo-navigation-rail></div>`,
    );
    const list = all(root, "camo-nav-item").map((i) => i.getBoundingClientRect());
    expect(list[1]!.top).toBeGreaterThan(list[0]!.bottom - 1);
    const fab = q(root, "camo-fab").getBoundingClientRect();
    expect(fab.bottom).toBeLessThanOrEqual(list[0]!.top + 1);
    all(root, "camo-nav-item")[0]!.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(all(root, "camo-nav-item")[1]);
    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(all(root, "camo-nav-item")[0]);
    expect(inspectAria(q(root, "camo-navigation-rail"))?.role).toBe("navigation");
  });

  it("sits on the start edge in right-to-left, and selects like the bar", async () => {
    const root = await page(
      skin,
      `<div style="height:300px;display:flex"><camo-navigation-rail label="Main" value="home">${items()}</camo-navigation-rail><div style="flex:1">content</div></div>`,
      "rtl",
    );
    const rail = q(root, "camo-navigation-rail").getBoundingClientRect();
    expect(rail.left).toBeGreaterThan(window.innerWidth / 2);
    all(root, "camo-nav-item")[2]!.click();
    expect(q(root, "camo-navigation-rail").value).toBe("saved");
  });
});

const drawerBody = `<camo-nav-section title="Mail"><camo-nav-item value="inbox" label="Inbox" icon="inbox"></camo-nav-item><camo-nav-item value="saved" label="Saved" icon="star"></camo-nav-item></camo-nav-section><camo-nav-section title="Account"><camo-nav-item value="profile" label="Profile" icon="person"></camo-nav-item></camo-nav-section>`;

describe.each(["minimal", "cupertino"])("camo-navigation-drawer under %s", (skin) => {
  it("groups items under headings, and the arrows cross the groups", async () => {
    const root = await page(
      skin,
      `<camo-navigation-drawer label="Mail" value="inbox">${drawerBody}</camo-navigation-drawer>`,
    );
    const sections = all(root, "camo-nav-section");
    expect(inspectAria(sections[0]!)).toMatchObject({ role: "group", label: "Mail" });
    expect(inner(sections[1]!, ".title").textContent).toBe("Account");
    expect(sections[0]!.hasAttribute("title")).toBe(false);
    all(root, "camo-nav-item")[1]!.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(all(root, "camo-nav-item")[2]);
    all(root, "camo-nav-item")[2]!.click();
    expect(q(root, "camo-navigation-drawer").value).toBe("profile");
  });

  it("lays each item out with its label beside the icon, and fills the selected row", async () => {
    const root = await page(
      skin,
      `<camo-navigation-drawer label="Mail" value="inbox">${drawerBody}</camo-navigation-drawer>`,
    );
    const [inbox, saved] = all(root, "camo-nav-item");
    const icon = inner(inbox!, ".icon").getBoundingClientRect();
    const label = inner(inbox!, ".label").getBoundingClientRect();
    expect(label.left).toBeGreaterThan(icon.right - 1);
    expect(Math.abs(label.top + label.height / 2 - (icon.top + icon.height / 2))).toBeLessThan(4);
    const fill = (el: El): string => getComputedStyle(inner(el, ".i")).backgroundColor;
    expect(fill(inbox!)).not.toBe(fill(saved!));
  });
});

describe.each(["minimal", "cupertino"])("camo-modal-drawer under %s", (skin) => {
  const drawer = (attrs = ""): string =>
    `<button id="menu">Menu</button><camo-modal-drawer label="Navigation" value="inbox"${attrs}>${drawerBody}</camo-modal-drawer>`;

  it("is a modal dialog from the start edge, named, with the selected item focused", async () => {
    const root = await page(skin, drawer(" open"));
    const el = q(root, "camo-modal-drawer");
    const dialog = inner(el, "dialog") as HTMLDialogElement;
    expect(dialog.matches(":modal")).toBe(true);
    expect(dialog.getAttribute("aria-label")).toBe("Navigation");
    await tick(100);
    expect(document.activeElement).toBe(all(root, "camo-nav-item")[0]);
    const box = dialog.getBoundingClientRect();
    expect(box.left).toBeLessThan(2);
    expect(box.height).toBeGreaterThan(window.innerHeight - 2);
  });

  it("slides in from the right in right-to-left", async () => {
    const root = await page(skin, drawer(" open"), "rtl");
    await tick(100);
    const box = inner(q(root, "camo-modal-drawer"), "dialog").getBoundingClientRect();
    expect(box.right).toBeGreaterThan(window.innerWidth - 2);
  });

  it("closes with Escape, the scrim, and by choosing an item, and says so once with camo-close", async () => {
    for (const how of ["escape", "scrim", "item"] as const) {
      const root = await page(skin, drawer(" open"));
      const el = q(root, "camo-modal-drawer");
      let closed = 0;
      el.addEventListener("camo-close", () => closed++);
      await tick(100);
      if (how === "escape") await userEvent.keyboard("{Escape}");
      else if (how === "scrim") {
        const dialog = inner(el, "dialog") as HTMLDialogElement;
        const box = dialog.getBoundingClientRect();
        dialog.dispatchEvent(
          new MouseEvent("click", { bubbles: true, clientX: box.right + 20, clientY: 40 }),
        );
      } else all(root, "camo-nav-item")[1]!.click();
      await tick(100);
      expect(el.open, how).toBe(false);
      expect(closed, how).toBe(1);
      if (how === "item") expect(el.value).toBe("saved");
    }
  });

  it("closes when the current item is chosen again, and keeps its value when a change is cancelled", async () => {
    const root = await page(skin, drawer(" open"));
    const el = q(root, "camo-modal-drawer");
    await tick(100);
    all(root, "camo-nav-item")[0]!.click(); // the current one
    await tick(100);
    expect(el.open).toBe(false);
    el.open = true;
    await el.updateComplete;
    el.addEventListener("camo-before-change", (e: Event) => e.preventDefault());
    all(root, "camo-nav-item")[1]!.click();
    expect(el.value).toBe("inbox");
  });

  it("closes on a drag toward the start edge, and stays on a short one", async () => {
    const root = await page(skin, drawer(" open"));
    const el = q(root, "camo-modal-drawer");
    await tick(100);
    const dialog = inner(el, "dialog") as HTMLDialogElement;
    const box = dialog.getBoundingClientRect();
    const fire = (type: string, x: number): void => {
      dialog.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          clientX: x,
          clientY: 200,
          button: 0,
          pointerId: 1,
        }),
      );
    };
    fire("pointerdown", box.right - 20);
    fire("pointermove", box.right - 40);
    fire("pointerup", box.right - 40);
    expect(el.open).toBe(true);
    fire("pointerdown", box.right - 20);
    fire("pointermove", box.right - box.width * 0.6);
    fire("pointerup", box.right - box.width * 0.6);
    await tick(100);
    expect(el.open).toBe(false);
  });
});
