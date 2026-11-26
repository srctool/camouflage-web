import { inspectAria } from "@srctool/camouflage-core";
import { userEvent } from "vitest/browser";
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
const bg = (el: Element): string => getComputedStyle(inner(el, ".camo-surface")).backgroundColor;

describe.each(SKINS)("camo-chip under %s", (skin) => {
  it("is a tag, an action, a filter or an input chip by what it is given", async () => {
    const root = await page(
      skin,
      `<camo-chip id="tag" label="Paid"></camo-chip><camo-chip id="act" label="Add" clickable></camo-chip><camo-chip id="fil" label="Open" selectable></camo-chip><camo-chip id="inp" label="ada" removable></camo-chip>`,
    );
    expect(["#tag", "#act", "#fil", "#inp"].map((id) => q(root, id).kind)).toEqual([
      "tag",
      "action",
      "filter",
      "input",
    ]);
    expect(inspectAria(q(root, "#tag"))?.role).toBe("generic");
    expect(inspectAria(q(root, "#act"))).toMatchObject({ role: "button", label: "Add" });
    expect(inspectAria(q(root, "#fil"))).toMatchObject({ role: "button", pressed: false });
    expect(q(root, "#tag").hasAttribute("tabindex")).toBe(false);
    expect(q(root, "#act").tabIndex).toBe(0);
    expect(q(root, "#inp").hasAttribute("tabindex")).toBe(false);
  });

  it("fires click from the keyboard, and not when disabled; a filter reports its state", async () => {
    const root = await page(
      skin,
      `<camo-chip id="a" label="Add" clickable></camo-chip><camo-chip id="b" label="Off" clickable disabled></camo-chip><camo-chip id="c" label="Open" selectable selected></camo-chip>`,
    );
    let clicks = 0;
    for (const id of ["#a", "#b"]) q(root, id).addEventListener("click", () => clicks++);
    q(root, "#a").focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(clicks).toBe(2);
    q(root, "#b").click();
    expect(clicks).toBe(2);
    expect(q(root, "#b").tabIndex).toBe(-1);
    expect(inspectAria(q(root, "#c"))).toMatchObject({ pressed: true });
  });

  it("removes an input chip by its button, and by Delete or Backspace on the chip", async () => {
    const root = await page(
      skin,
      `<camo-chip id="a" label="ada@example.com" removable></camo-chip>`,
    );
    const chip = q(root, "#a");
    let removed = 0;
    chip.addEventListener("camo-remove", () => removed++);
    const button = inner(chip, ".remove") as HTMLButtonElement;
    expect(button.getAttribute("aria-label")).toBe("Remove ada@example.com");
    button.click();
    expect(removed).toBe(1);
    chip.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete", bubbles: true }));
    chip.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", bubbles: true }));
    expect(removed).toBe(3);
  });

  it("makes the remove button pointer-only inside an interactive chip, so no button nests in a button", async () => {
    const root = await page(
      skin,
      `<camo-chip id="a" label="Open" selectable removable></camo-chip>`,
    );
    const chip = q(root, "#a");
    const button = inner(chip, ".remove") as HTMLButtonElement;
    expect(button.getAttribute("aria-hidden")).toBe("true");
    expect(button.tabIndex).toBe(-1);
    let clicks = 0;
    let removed = 0;
    chip.addEventListener("click", () => clicks++);
    chip.addEventListener("camo-remove", () => removed++);
    button.click();
    expect([clicks, removed]).toEqual([0, 1]); // the ✕ does not also toggle the chip
  });

  it("draws appearances, tones and the selected state differently, and keeps a 48 px touch area", async () => {
    const root = await page(
      skin,
      `<camo-chip id="a" label="x" selectable></camo-chip><camo-chip id="b" label="x" selectable selected></camo-chip><camo-chip id="c" label="x" appearance="soft" tone="success"></camo-chip><camo-chip id="d" label="x" appearance="solid"></camo-chip>`,
    );
    const colors = ["#a", "#b", "#c", "#d"].map((id) => bg(q(root, id)));
    expect(new Set(colors).size).toBeGreaterThanOrEqual(3);
    expect(bg(q(root, "#a"))).not.toBe(bg(q(root, "#b")));
    const chip = q(root, "#a").getBoundingClientRect();
    expect(inner(q(root, "#a"), ".c").getBoundingClientRect().height).toBeLessThan(48);
    // A pointer 23 px above the visual center still hits it.
    const hit = document.elementFromPoint(
      chip.left + chip.width / 2,
      chip.top + chip.height / 2 - 22,
    );
    expect(hit === q(root, "#a") || q(root, "#a").contains(hit)).toBe(true);
  });

  it("puts a long label on one line with an ellipsis, and the leading slot before it", async () => {
    const root = await page(
      skin,
      `<div style="width:120px"><camo-chip id="a" label="A very long chip label that cannot fit" clickable><camo-icon slot="leading" name="heart"></camo-icon></camo-chip></div>`,
    );
    const label = inner(q(root, "#a"), ".label");
    expect(getComputedStyle(label).textOverflow).toBe("ellipsis");
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    expect(q(root, "#a").getBoundingClientRect().width).toBeLessThanOrEqual(121);
    const slot = inner(q(root, "#a"), "slot[name=leading]") as HTMLSlotElement;
    expect(slot.assignedNodes()).toHaveLength(1);
  });
});

describe.each(SKINS)("camo-chip-group under %s", (skin) => {
  const chips = `<camo-chip value="a" label="A"></camo-chip><camo-chip value="b" label="B"></camo-chip><camo-chip value="c" label="C"></camo-chip>`;

  it("is a radio group of chips for one choice, with one tab stop", async () => {
    const root = await page(
      skin,
      `<camo-chip-group label="Sort" value="b">${chips}</camo-chip-group>`,
    );
    const group = q(root, "camo-chip-group");
    expect(inspectAria(group)).toMatchObject({ role: "radiogroup", label: "Sort" });
    const [a, b, c] = [...root.querySelectorAll<El>("camo-chip")];
    expect(inspectAria(b!)).toMatchObject({ role: "radio", checked: true });
    expect(inspectAria(a!)).toMatchObject({ role: "radio", checked: false });
    expect([a!.tabIndex, b!.tabIndex, c!.tabIndex]).toEqual([-1, 0, -1]);
  });

  it("moves and selects with the arrow keys, and fires before-change, input and change once", async () => {
    const root = await page(
      skin,
      `<camo-chip-group label="Sort" value="a">${chips}</camo-chip-group>`,
    );
    const group = q(root, "camo-chip-group");
    const seen: string[] = [];
    for (const name of ["camo-before-change", "input", "change"])
      group.addEventListener(name, () => seen.push(name));
    root.querySelector<El>("camo-chip")!.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(group.value).toBe("b");
    expect(seen).toEqual(["camo-before-change", "input", "change"]);
    expect(document.activeElement).toBe(root.querySelectorAll("camo-chip")[1]);
  });

  it("keeps the last chip on when required, and turns it off when not", async () => {
    const root = await page(
      skin,
      `<camo-chip-group id="r" label="x" value="a" required>${chips}</camo-chip-group><camo-chip-group id="o" label="x" value="a">${chips}</camo-chip-group>`,
    );
    q(root, "#r camo-chip").click();
    expect(q(root, "#r").value).toBe("a");
    q(root, "#o camo-chip").click();
    expect(q(root, "#o").value).toBe("");
  });

  it("is any number of toggle buttons when multiple, submits one entry each, and resets", async () => {
    const root = await page(
      skin,
      `<form><camo-chip-group name="f" label="Filters" multiple>${chips}</camo-chip-group></form>`,
    );
    const group = q(root, "camo-chip-group");
    const [a, b] = [...root.querySelectorAll<El>("camo-chip")];
    expect(inspectAria(group)?.role).toBe("group");
    a!.click();
    b!.click();
    await group.updateComplete;
    await a!.updateComplete;
    expect(group.values).toEqual(["a", "b"]);
    expect(inspectAria(a!)).toMatchObject({ role: "button", pressed: true });
    expect(new FormData(root.querySelector("form")!).getAll("f")).toEqual(["a", "b"]);
    root.querySelector("form")!.reset();
    expect(group.values).toEqual([]);
  });

  it("lets the app cancel a change, and scrolls a focused chip into view in a scrolling row", async () => {
    const root = await page(
      skin,
      `<div style="width:160px"><camo-chip-group id="g" label="x" layout="scroll" multiple>${chips}<camo-chip value="d" label="Delta chip"></camo-chip><camo-chip value="e" label="Echo chip"></camo-chip></camo-chip-group></div>`,
    );
    const group = q(root, "#g");
    group.addEventListener("camo-before-change", (e: Event) => e.preventDefault());
    root.querySelector<El>("camo-chip")!.click();
    expect(group.values).toEqual([]);
    const row = inner(group, ".row");
    expect(row.scrollWidth).toBeGreaterThan(row.clientWidth);
    const last = root.querySelector<El>("camo-chip:last-child")!;
    last.focus();
    await tick(100);
    expect(row.scrollLeft).toBeGreaterThan(0);
  });
});

describe.each(SKINS)("camo-badge and camo-badged-box under %s", (skin) => {
  it("shows a count, 99+ above max, a dot with no count, and nothing for zero", async () => {
    const root = await page(
      skin,
      `<camo-badge id="a" count="3"></camo-badge><camo-badge id="b" count="120"></camo-badge><camo-badge id="c"></camo-badge><camo-badge id="d" count="0"></camo-badge><camo-badge id="e" count="-2"></camo-badge><camo-badge id="f" count="12" max="9"></camo-badge>`,
    );
    expect(inner(q(root, "#a"), ".text").textContent).toBe("3");
    expect(inner(q(root, "#b"), ".text").textContent).toBe("99+");
    expect(inner(q(root, "#f"), ".text").textContent).toBe("9+");
    expect(inner(q(root, "#c"), ".dot")).not.toBeNull();
    expect(inner(q(root, "#c"), ".text")).toBeNull();
    for (const id of ["#d", "#e"]) {
      expect(getComputedStyle(q(root, id)).display).toBe("none");
      expect(inspectAria(q(root, id))?.hidden).toBe(true);
    }
  });

  it("is an image with a description on its own: the count or the app's text", async () => {
    const root = await page(
      skin,
      `<camo-badge id="a" count="3"></camo-badge><camo-badge id="b"></camo-badge><camo-badge id="c" count="3" content-description="3 unread messages"></camo-badge>`,
    );
    expect(inspectAria(q(root, "#a"))).toMatchObject({ role: "img", label: "3 new" });
    expect(inspectAria(q(root, "#b"))).toMatchObject({ label: "New" });
    expect(inspectAria(q(root, "#c"))).toMatchObject({ label: "3 unread messages" });
  });

  it("defaults to the error tone, and takes another", async () => {
    const root = await page(
      skin,
      `<camo-badge id="a" count="1"></camo-badge><camo-badge id="b" count="1" tone="info"></camo-badge>`,
    );
    expect(bg(q(root, "#a"))).not.toBe(bg(q(root, "#b")));
  });

  it("sits on the anchor's top-end corner, mirrors in right-to-left, and describes the anchor", async () => {
    const body = `<camo-badged-box id="b"><camo-icon-button label="Notifications"><camo-icon name="heart"></camo-icon></camo-icon-button><camo-badge slot="badge" count="3"></camo-badge></camo-badged-box>`;
    const ltr = await page(skin, body);
    const anchor = q(ltr, "camo-icon-button").getBoundingClientRect();
    const badge = q(ltr, "camo-badge").getBoundingClientRect();
    expect(badge.left + badge.width / 2).toBeGreaterThan(anchor.left + anchor.width / 2);
    expect(badge.top + badge.height / 2).toBeLessThan(anchor.top + anchor.height / 2);
    // The badge's text is the anchor's description, and the badge itself is hidden from assistive technology.
    expect(q(ltr, "camo-icon-button").ariaDescription).toBe("3 new");
    expect(inspectAria(q(ltr, "camo-badge"))?.hidden).toBe(true);
    const rtl = await page(skin, body, "rtl");
    const a2 = q(rtl, "camo-icon-button").getBoundingClientRect();
    const b2 = q(rtl, "camo-badge").getBoundingClientRect();
    expect(b2.left + b2.width / 2).toBeLessThan(a2.left + a2.width / 2);
  });

  it("drops the anchor's description when the count is zero", async () => {
    const root = await page(
      skin,
      `<camo-badged-box><camo-icon-button label="Notifications"><camo-icon name="heart"></camo-icon></camo-icon-button><camo-badge slot="badge" count="3"></camo-badge></camo-badged-box>`,
    );
    const badge = q(root, "camo-badge");
    badge.count = 0;
    await badge.updateComplete;
    q(root, "camo-badged-box").requestUpdate();
    await q(root, "camo-badged-box").updateComplete;
    expect(q(root, "camo-icon-button").ariaDescription).toBeNull();
  });
});

describe.each(SKINS)("camo-avatar under %s", (skin) => {
  it("shows initials, a person icon for no name, and is an image named by name and presence", async () => {
    const root = await page(
      skin,
      `<camo-avatar id="a" name="Dwiki Riyadi"></camo-avatar><camo-avatar id="b"></camo-avatar><camo-avatar id="c" name="Ada Lovelace" presence="online"></camo-avatar><camo-avatar id="d" name="😀 Smile"></camo-avatar>`,
    );
    expect(inner(q(root, "#a"), ".initials").textContent).toBe("DR");
    expect(inner(q(root, "#b"), ".person")).not.toBeNull();
    expect(inner(q(root, "#d"), ".person")).not.toBeNull();
    expect(inspectAria(q(root, "#a"))).toMatchObject({ role: "img", label: "Dwiki Riyadi" });
    expect(inspectAria(q(root, "#c"))).toMatchObject({ label: "Ada Lovelace, online" });
    expect(inspectAria(q(root, "#b"))?.hidden).toBe(true);
    expect(inner(q(root, "#c"), ".presence")).not.toBeNull();
    expect(inner(q(root, "#a"), ".presence")).toBeNull();
  });

  it("gives the same name the same color, and different names usually different ones", async () => {
    const root = await page(
      skin,
      `<camo-avatar id="a" name="Ada Lovelace"></camo-avatar><camo-avatar id="b" name="Ada Lovelace"></camo-avatar><camo-avatar id="c" name="Grace Hopper"></camo-avatar><camo-avatar id="d" name="Katherine Johnson"></camo-avatar><camo-avatar id="e" name="Alan Turing"></camo-avatar>`,
    );
    const color = (id: string): string =>
      getComputedStyle(inner(q(root, id), ".a")).backgroundColor;
    expect(color("#a")).toBe(color("#b"));
    expect(new Set(["#a", "#c", "#d", "#e"].map(color)).size).toBeGreaterThan(1);
  });

  it("has three sizes and three shapes", async () => {
    const root = await page(
      skin,
      `<camo-avatar id="s" name="A B" size="small"></camo-avatar><camo-avatar id="m" name="A B"></camo-avatar><camo-avatar id="l" name="A B" size="large"></camo-avatar><camo-avatar id="sq" name="A B" shape="square"></camo-avatar><camo-avatar id="r" name="A B" shape="rounded"></camo-avatar>`,
    );
    const w = (id: string): number => inner(q(root, id), ".a").getBoundingClientRect().width;
    expect(w("#s")).toBeLessThan(w("#m"));
    expect(w("#m")).toBeLessThan(w("#l"));
    const radius = (id: string): string =>
      getComputedStyle(inner(q(root, id), ".a")).borderTopLeftRadius;
    expect(radius("#sq")).toBe("0px");
    if (traits(skin).rounded) {
      expect(radius("#r")).not.toBe("0px");
      expect(radius("#r")).not.toBe(radius("#m"));
    }
  });

  it("shows the initials until a slotted image has loaded, and again if it fails", async () => {
    const svg =
      "data:image/svg+xml," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4"><rect width="4" height="4" fill="red"/></svg>',
      );
    const root = await page(
      skin,
      `<camo-avatar id="ok" name="Ada Lovelace"><img slot="image" src="${svg}" alt=""></camo-avatar><camo-avatar id="bad" name="Grace Hopper"><img slot="image" src="data:image/png;base64,AAAA" alt=""></camo-avatar>`,
    );
    await tick(200);
    const shown = (id: string): string => getComputedStyle(inner(q(root, id), ".img")).opacity;
    expect(shown("#ok")).toBe("1");
    expect(shown("#bad")).toBe("0");
    expect(inner(q(root, "#bad"), ".initials").textContent).toBe("GH");
  });

  it("takes a plain `initials` text (a group's +N), in the neutral color", async () => {
    const root = await page(skin, `<camo-avatar id="a" initials="+2"></camo-avatar>`);
    expect(inner(q(root, "#a"), ".initials").textContent).toBe("+2");
    expect(inspectAria(q(root, "#a"))).toMatchObject({ role: "img", label: "+2" });
  });
});

describe.each(SKINS)("camo-avatar-group under %s", (skin) => {
  const five = [
    "Ada Lovelace",
    "Grace Hopper",
    "Katherine Johnson",
    "Alan Turing",
    "Margaret Hamilton",
  ]
    .map((n) => `<camo-avatar name="${n}"></camo-avatar>`)
    .join("");

  it("shows max avatars, hides the rest, and adds a +N avatar", async () => {
    const root = await page(skin, `<camo-avatar-group max="3">${five}</camo-avatar-group>`);
    const group = q(root, "camo-avatar-group");
    await group.updateComplete;
    const avatars = [...root.querySelectorAll<El>("camo-avatar-group > camo-avatar")];
    const visible = avatars.filter((a) => getComputedStyle(a).display !== "none");
    expect(visible).toHaveLength(3);
    const more = inner(group, "camo-avatar.more") as El;
    expect(more).not.toBeNull();
    await more.updateComplete;
    expect(inner(more, ".initials").textContent).toBe("+2");
    expect(inspectAria(group)?.role).toBe("group");
  });

  it("overlaps its avatars, and has no +N when everyone fits", async () => {
    const root = await page(
      skin,
      `<camo-avatar-group max="3">${five.slice(0, 3 * 40)}</camo-avatar-group>`,
    );
    void root;
    const small = await page(
      skin,
      `<camo-avatar-group max="5"><camo-avatar name="Ada Lovelace"></camo-avatar><camo-avatar name="Grace Hopper"></camo-avatar></camo-avatar-group>`,
    );
    const [a, b] = [...small.querySelectorAll<El>("camo-avatar")];
    expect(b!.getBoundingClientRect().left).toBeLessThan(a!.getBoundingClientRect().right);
    expect(inner(q(small, "camo-avatar-group"), "camo-avatar.more")).toBeNull();
  });
});

describe.each(SKINS)("camo-fab under %s", (skin) => {
  const icon = `<camo-icon slot="icon" name="edit"></camo-icon>`;

  it("is a button named by its description, or by its text when extended, in both states", async () => {
    const root = await page(
      skin,
      `<camo-fab id="a" content-description="Compose">${icon}</camo-fab><camo-fab id="b" content-description="Compose mail" text="Compose">${icon}</camo-fab>`,
    );
    expect(inspectAria(q(root, "#a"))).toMatchObject({ role: "button", label: "Compose" });
    expect(inspectAria(q(root, "#b"))).toMatchObject({ role: "button", label: "Compose" });
    expect(q(root, "#a").tabIndex).toBe(0);
    q(root, "#b").collapsed = true;
    await q(root, "#b").updateComplete;
    expect(inspectAria(q(root, "#b"))?.label).toBe("Compose"); // the name does not change when it folds
  });

  it("folds to the icon and unfolds again", async () => {
    const root = await page(
      skin,
      `<camo-fab id="a" content-description="Compose" text="Compose">${icon}</camo-fab>`,
    );
    const fab = q(root, "#a");
    const wide = fab.getBoundingClientRect().width;
    fab.collapsed = true;
    await fab.updateComplete;
    await tick(500);
    expect(fab.getBoundingClientRect().width).toBeLessThan(wide - 20);
    fab.collapsed = false;
    await fab.updateComplete;
    await expect
      .poll(() => fab.getBoundingClientRect().width, { timeout: 3000 })
      .toBeGreaterThan(wide - 2);
  });

  it("fires click from the keyboard, and not when disabled or hidden", async () => {
    const root = await page(
      skin,
      `<camo-fab id="a" content-description="A">${icon}</camo-fab><camo-fab id="b" content-description="B" disabled>${icon}</camo-fab><camo-fab id="c" content-description="C" hidden>${icon}</camo-fab>`,
    );
    let clicks = 0;
    for (const id of ["#a", "#b", "#c"]) q(root, id).addEventListener("click", () => clicks++);
    q(root, "#a").focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(clicks).toBe(2);
    q(root, "#b").click();
    q(root, "#c").click();
    expect(clicks).toBe(2);
  });

  it("scales out when hidden, and a hidden FAB cannot be focused or read", async () => {
    const root = await page(
      skin,
      `<camo-fab id="a" content-description="Compose">${icon}</camo-fab>`,
    );
    const fab = q(root, "#a");
    expect(fab.tabIndex).toBe(0);
    fab.hidden = true;
    await fab.updateComplete;
    await tick(500);
    expect(fab.tabIndex).toBe(-1);
    expect(inspectAria(fab)?.hidden).toBe(true);
    expect(getComputedStyle(inner(fab, ".f")).visibility).toBe("hidden");
    fab.focus();
    expect(document.activeElement).not.toBe(fab);
    fab.hidden = false;
    await fab.updateComplete;
    await tick(500);
    expect(getComputedStyle(inner(fab, ".f")).visibility).toBe("visible");
  });

  it("keeps a 48 px touch area around a small FAB, and draws appearances and tones differently", async () => {
    const root = await page(
      skin,
      `<camo-fab id="a" content-description="A" appearance="raised">${icon}</camo-fab><camo-fab id="b" content-description="B" appearance="soft">${icon}</camo-fab><camo-fab id="c" content-description="C" appearance="solid" tone="error">${icon}</camo-fab>`,
    );
    expect(q(root, "#a").getBoundingClientRect().width).toBeGreaterThanOrEqual(48);
    expect(new Set(["#a", "#b", "#c"].map((id) => bg(q(root, id)))).size).toBe(3);
  });
});
