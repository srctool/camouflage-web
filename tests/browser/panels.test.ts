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
const gb = (text: string, extra = ""): string =>
  `<camo-group-button text="${text}"${extra}></camo-group-button>`;

describe.each(["minimal", "cupertino"])("camo-button-group under %s", (skin) => {
  it("is a named group of buttons, each with its place, and one Tab stop", async () => {
    const root = await page(
      skin,
      `<camo-button-group label="Clipboard">${gb("Cut")}${gb("Copy")}${gb("Paste")}</camo-button-group>`,
    );
    expect(inspectAria(q(root, "camo-button-group"))).toMatchObject({
      role: "group",
      label: "Clipboard",
    });
    const buttons = all(root, "camo-group-button");
    expect(inspectAria(buttons[1]!)).toMatchObject({
      role: "button",
      label: "Copy",
      position: { index: 2, size: 3 },
    });
    expect(buttons.map((b) => b.tabIndex)).toEqual([0, -1, -1]);
    expect(buttons.map((b) => b.position)).toEqual(["first", "middle", "last"]);
  });

  it("fires click for a command, from the keyboard too, and not when disabled", async () => {
    const root = await page(
      skin,
      `<camo-button-group label="x">${gb("A")}${gb("B", " disabled")}</camo-button-group>`,
    );
    const [a, b] = all(root, "camo-group-button");
    let clicks = 0;
    for (const el of [a!, b!]) el.addEventListener("click", () => clicks++);
    a!.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    b!.click();
    expect(clicks).toBe(2);
  });

  it("moves between enabled buttons with the arrows, wrapping, and does not press", async () => {
    const root = await page(
      skin,
      `<camo-button-group label="x">${gb("A")}${gb("B", " disabled")}${gb("C")}</camo-button-group>`,
    );
    const [a, , c] = all(root, "camo-group-button");
    let clicks = 0;
    for (const el of all(root, "camo-group-button")) el.addEventListener("click", () => clicks++);
    a!.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(c);
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(a);
    expect(clicks).toBe(0);
  });

  it("is a toggle with the app's selected state, drawn differently when on", async () => {
    const root = await page(
      skin,
      `<camo-button-group label="Format">${gb("Bold", " toggle selected")}${gb("Italic", " toggle")}</camo-button-group>`,
    );
    const [bold, italic] = all(root, "camo-group-button");
    expect(inspectAria(bold!)).toMatchObject({ pressed: true });
    expect(inspectAria(italic!)).toMatchObject({ pressed: false });
    const fill = (el: El): string => getComputedStyle(inner(el, ".camo-surface")).backgroundColor;
    expect(fill(bold!)).not.toBe(fill(italic!));
    // The app flips `selected` from click; the group does not.
    italic!.click();
    expect(italic!.selected).toBe(false);
  });

  it("joins the buttons when connected (outer corners only) and separates them when spaced", async () => {
    const root = await page(
      skin,
      `<camo-button-group id="c" label="x">${gb("A")}${gb("B")}${gb("C")}</camo-button-group><camo-button-group id="s" label="x" spaced>${gb("A")}${gb("B")}</camo-button-group>`,
    );
    const radius = (el: El, corner: string): string =>
      getComputedStyle(inner(el, ".b"))[corner as "borderStartStartRadius"];
    const [a, b, c] = all(q(root, "#c"), "camo-group-button");
    expect(radius(a!, "borderStartStartRadius")).not.toBe("0px");
    expect(radius(a!, "borderStartEndRadius")).toBe("0px");
    expect(radius(b!, "borderStartStartRadius")).toBe("0px");
    expect(radius(c!, "borderEndEndRadius")).not.toBe("0px");
    const gap = (id: string): number => {
      const [x, y] = all(q(root, id), "camo-group-button").map((el) => el.getBoundingClientRect());
      return y!.left - x!.right;
    };
    expect(gap("#c")).toBeLessThanOrEqual(0);
    expect(gap("#s")).toBeGreaterThan(0);
  });

  it("mirrors the corners in right-to-left, and names an icon-only button", async () => {
    const root = await page(
      skin,
      `<camo-button-group label="x"><camo-group-button icon="bold" content-description="Bold"></camo-group-button>${gb("B")}</camo-button-group>`,
      "rtl",
    );
    const [first] = all(root, "camo-group-button");
    expect(inspectAria(first!)).toMatchObject({ label: "Bold" });
    const box = inner(first!, ".b").getBoundingClientRect();
    expect(box.left).toBeGreaterThan(
      all(root, "camo-group-button")[1]!.getBoundingClientRect().left,
    );
    expect(getComputedStyle(inner(first!, ".b")).borderStartStartRadius).not.toBe("0px");
  });

  it("disables every button with the group", async () => {
    const root = await page(
      skin,
      `<camo-button-group label="x" disabled>${gb("A")}${gb("B")}</camo-button-group>`,
    );
    let clicks = 0;
    for (const el of all(root, "camo-group-button")) el.addEventListener("click", () => clicks++);
    all(root, "camo-group-button")[0]!.click();
    expect(clicks).toBe(0);
    expect(inspectAria(all(root, "camo-group-button")[0]!)).toMatchObject({ disabled: true });
  });
});

const items = `<camo-menu-item text="Save as…"></camo-menu-item><camo-menu-item text="Save a copy"></camo-menu-item>`;

describe.each(["minimal", "cupertino"])("camo-split-button under %s", (skin) => {
  it("runs the main action on a click and opens the menu on the arrow", async () => {
    const root = await page(skin, `<camo-split-button text="Save">${items}</camo-split-button>`);
    const split = q(root, "camo-split-button");
    let saved = 0;
    split.addEventListener("click", () => saved++);
    inner(split, "[data-part=main]").click();
    expect(saved).toBe(1);
    expect(split.shadowRoot!.querySelector("camo-menu")!.open).toBeFalsy();
    inner(split, "[data-part=arrow]").click();
    await tick(100);
    expect(inner(split, "camo-menu").hasAttribute("open")).toBe(true);
    expect(saved).toBe(1); // the arrow is not the action
  });

  it("names the arrow, says it has a menu and whether it is open", async () => {
    const root = await page(
      skin,
      `<camo-split-button text="Save" menu-content-description="More save options">${items}</camo-split-button>`,
    );
    const arrow = inner(q(root, "camo-split-button"), "[data-part=arrow]");
    expect(arrow.getAttribute("aria-label")).toBe("More save options");
    expect(arrow.getAttribute("aria-haspopup")).toBe("menu");
    expect(arrow.getAttribute("aria-expanded")).toBe("false");
    arrow.click();
    await tick(100);
    expect(
      inner(q(root, "camo-split-button"), "[data-part=arrow]").getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("opens with Down, focuses the first entry, closes with Escape and returns focus", async () => {
    const root = await page(skin, `<camo-split-button text="Save">${items}</camo-split-button>`);
    const split = q(root, "camo-split-button");
    inner(split, "[data-part=main]").focus();
    await userEvent.keyboard("{ArrowDown}");
    await tick(100);
    expect(document.activeElement).toBe(all(root, "camo-menu-item")[0]);
    await userEvent.keyboard("{Escape}");
    await tick(100);
    expect(inner(split, "camo-menu").hasAttribute("open")).toBe(false);
    expect(split.shadowRoot!.activeElement).toBe(inner(split, "[data-part=main]"));
  });

  it("is one part that opens the menu as a menu button", async () => {
    const root = await page(
      skin,
      `<camo-split-button text="Sort" menu-only>${items}</camo-split-button>`,
    );
    const split = q(root, "camo-split-button");
    expect(inner(split, "[data-part=arrow]")).toBeNull();
    let clicks = 0;
    split.addEventListener("click", () => clicks++);
    inner(split, "[data-part=main]").click();
    await tick(100);
    expect(clicks).toBe(0); // there is no action to run
    expect(inner(split, "camo-menu").hasAttribute("open")).toBe(true);
    expect(inner(split, "[data-part=main]").getAttribute("aria-haspopup")).toBe("menu");
  });

  it("opens the menu below the whole button, and choosing an entry closes it", async () => {
    const root = await page(skin, `<camo-split-button text="Save">${items}</camo-split-button>`);
    const split = q(root, "camo-split-button");
    inner(split, "[data-part=arrow]").click();
    await tick(150);
    const popup = inner(inner(split, "camo-menu"), ".camo-popup");
    const button = inner(split, ".split").getBoundingClientRect();
    expect(popup.getBoundingClientRect().top).toBeGreaterThanOrEqual(button.bottom - 1);
    expect(Math.abs(popup.getBoundingClientRect().left - button.left)).toBeLessThan(2);
    all(root, "camo-menu-item")[1]!.click();
    await tick(100);
    expect(inner(split, "camo-menu").hasAttribute("open")).toBe(false);
  });

  it("is inert when disabled, both parts", async () => {
    const root = await page(
      skin,
      `<camo-split-button text="Save" disabled>${items}</camo-split-button>`,
    );
    const split = q(root, "camo-split-button");
    let clicks = 0;
    split.addEventListener("click", () => clicks++);
    expect((inner(split, "[data-part=main]") as HTMLButtonElement).disabled).toBe(true);
    expect((inner(split, "[data-part=arrow]") as HTMLButtonElement).disabled).toBe(true);
    split.click();
    expect(clicks).toBe(0);
  });
});

describe.each(["minimal", "cupertino"])("camo-popover under %s", (skin) => {
  const body = (attrs = ""): string =>
    `<camo-popover title="Rename"${attrs}><camo-button slot="anchor" text="Rename"></camo-button><input id="name" /><camo-button slot="actions" text="Save"></camo-button></camo-popover>`;

  it("opens by a click on the anchor, a group named by its title, and the anchor says so", async () => {
    const root = await page(skin, body());
    const pop = q(root, "camo-popover");
    const anchor = q(root, "camo-button");
    expect(anchor.getAttribute("aria-expanded")).toBe("false");
    anchor.click();
    await tick(100);
    expect(pop.open).toBe(true);
    const popup = inner(pop, ".camo-popup");
    expect(popup.matches(":popover-open")).toBe(true);
    expect(popup.getAttribute("role")).toBe("group");
    expect(popup.getAttribute("aria-label")).toBe("Rename");
    expect(anchor.getAttribute("aria-haspopup")).toBe("dialog");
    expect(anchor.getAttribute("aria-expanded")).toBe("true");
    expect(pop.hasAttribute("title")).toBe(false);
  });

  it("moves focus into the panel, closes on Escape and returns it to the anchor, firing camo-close once", async () => {
    const root = await page(skin, body());
    const pop = q(root, "camo-popover");
    let closed = 0;
    pop.addEventListener("camo-close", () => closed++);
    q(root, "camo-button").click();
    await tick(100);
    expect(document.activeElement).toBe(q(root, "#name"));
    await userEvent.keyboard("{Escape}");
    await tick(100);
    expect(pop.open).toBe(false);
    expect(closed).toBe(1);
    expect(document.activeElement).toBe(q(root, "camo-button"));
  });

  it("closes on a click outside, and is controlled by open", async () => {
    const root = await page(
      skin,
      `${body(" open")}<p id="outside" style="position:fixed;inset-block-end:0;inset-inline-end:0;margin:0">elsewhere</p>`,
    );
    const pop = q(root, "camo-popover");
    await tick(100);
    expect(inner(pop, ".camo-popup").matches(":popover-open")).toBe(true);
    await userEvent.click(q(root, "#outside"));
    await tick(100);
    expect(pop.open).toBe(false);
    pop.open = true;
    await pop.updateComplete;
    await tick(100);
    expect(inner(pop, ".camo-popup").matches(":popover-open")).toBe(true);
  });

  it("opens below the anchor, centered on it, and flips above when there is no room", async () => {
    const root = await page(
      skin,
      `<div style="margin-block-start:200px">${body(' open placement="bottom"')}</div>`,
    );
    const pop = q(root, "camo-popover");
    await tick(200);
    const anchor = q(root, "camo-button").getBoundingClientRect();
    let box = inner(pop, ".camo-popup").getBoundingClientRect();
    expect(box.top).toBeGreaterThanOrEqual(anchor.bottom);
    expect(pop.side).toBe("bottom");
    pop.open = false;
    await pop.updateComplete;
    const low = await page(
      skin,
      `<div style="position:fixed;inset-block-end:8px;inset-inline-start:200px">${body(' open placement="bottom"')}</div>`,
    );
    await tick(200);
    const lowPop = q(low, "camo-popover");
    box = inner(lowPop, ".camo-popup").getBoundingClientRect();
    expect(box.bottom).toBeLessThanOrEqual(q(low, "camo-button").getBoundingClientRect().top + 1);
    expect(lowPop.side).toBe("top");
  });

  it("places a side popover beside the anchor, and points the arrow at its center where the skin has one", async () => {
    const root = await page(
      skin,
      `<div style="margin:120px 0 0 10px">${body(' open placement="end"')}</div>`,
    );
    const pop = q(root, "camo-popover");
    await tick(200);
    const anchor = q(root, "camo-button").getBoundingClientRect();
    const panel = inner(pop, ".camo-popup").getBoundingClientRect();
    expect(panel.left).toBeGreaterThanOrEqual(anchor.right);
    expect(pop.side).toBe("right");
    const arrow = inner(pop, ".arrow");
    if (skin === "cupertino") {
      expect(arrow).not.toBeNull();
      const a = arrow.getBoundingClientRect();
      expect(Math.abs(a.top + a.height / 2 - (anchor.top + anchor.height / 2))).toBeLessThan(3);
    } else expect(arrow).toBeNull();
  });
});

describe.each(["minimal", "cupertino"])(
  "camo-side-sheet and camo-modal-side-sheet under %s",
  (skin) => {
    const content = `<camo-list-item headline="Name" supporting="report.pdf"></camo-list-item><camo-button slot="actions" text="Apply"></camo-button>`;

    it("is a docked complementary region with the title, content and pinned actions", async () => {
      const root = await page(
        skin,
        `<div style="display:flex;height:300px"><div id="main" style="flex:1">main</div><camo-side-sheet title="Properties">${content}</camo-side-sheet></div>`,
      );
      const sheet = q(root, "camo-side-sheet");
      expect(inspectAria(sheet)).toMatchObject({ role: "complementary", label: "Properties" });
      expect(inner(sheet, ".title").textContent).toBe("Properties");
      const box = sheet.getBoundingClientRect();
      expect(box.width).toBeGreaterThan(200);
      // It takes part of the layout: the main content is beside it, and still usable.
      expect(q(root, "#main").getBoundingClientRect().right).toBeLessThanOrEqual(box.left + 1);
      expect(sheet.hasAttribute("title")).toBe(false);
      const actions = (inner(sheet, "slot[name=actions]") as HTMLSlotElement).assignedNodes();
      expect(actions).toHaveLength(1);
    });

    it("scrolls the content while the title and actions stay", async () => {
      const long = Array.from({ length: 30 }, (_, i) => `<p>line ${i}</p>`).join("");
      const root = await page(
        skin,
        `<div style="height:240px"><camo-side-sheet title="Long">${long}<camo-button slot="actions" text="Apply"></camo-button></camo-side-sheet></div>`,
      );
      const sheet = q(root, "camo-side-sheet");
      const body = inner(sheet, ".body");
      expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
      expect(inner(sheet, ".title").getBoundingClientRect().top).toBeGreaterThanOrEqual(
        sheet.getBoundingClientRect().top - 1,
      );
      expect(inner(sheet, ".actions").getBoundingClientRect().bottom).toBeLessThanOrEqual(
        sheet.getBoundingClientRect().bottom + 1,
      );
    });

    it("has a close button only when closable, which fires camo-close", async () => {
      const root = await page(
        skin,
        `<camo-side-sheet id="a" title="A" closable>x</camo-side-sheet><camo-side-sheet id="b" title="B">x</camo-side-sheet>`,
      );
      expect(inner(q(root, "#b"), ".close")).toBeNull();
      let closed = 0;
      q(root, "#a").addEventListener("camo-close", () => closed++);
      const button = inner(q(root, "#a"), ".close") as HTMLButtonElement;
      expect(button.getAttribute("aria-label")).toBe("Close");
      button.click();
      expect(closed).toBe(1);
    });

    it("is a modal dialog from the end edge: named, scrim, Escape and the close button, once", async () => {
      for (const how of ["escape", "close", "scrim"] as const) {
        const root = await page(
          skin,
          `<camo-modal-side-sheet open title="Filters" closable>${content}</camo-modal-side-sheet>`,
        );
        const sheet = q(root, "camo-modal-side-sheet");
        let closed = 0;
        sheet.addEventListener("camo-close", () => closed++);
        await tick(100);
        const dialog = inner(sheet, "dialog") as HTMLDialogElement;
        expect(dialog.matches(":modal")).toBe(true);
        expect(dialog.getAttribute("aria-label")).toBe("Filters");
        expect(dialog.getBoundingClientRect().right).toBeGreaterThan(window.innerWidth - 2);
        if (how === "escape") await userEvent.keyboard("{Escape}");
        else if (how === "close") (inner(sheet, ".close") as HTMLButtonElement).click();
        else
          dialog.dispatchEvent(
            new MouseEvent("click", { bubbles: true, clientX: 4, clientY: 100 }),
          );
        await tick(100);
        expect(sheet.open, how).toBe(false);
        expect(closed, how).toBe(1);
      }
    });

    it("slides in from the left in right-to-left, and closes on a drag toward the end edge", async () => {
      const rtl = await page(
        skin,
        `<camo-modal-side-sheet open title="Filters">${content}</camo-modal-side-sheet>`,
        "rtl",
      );
      await tick(100);
      expect(
        inner(q(rtl, "camo-modal-side-sheet"), "dialog").getBoundingClientRect().left,
      ).toBeLessThan(2);
      const root = await page(
        skin,
        `<camo-modal-side-sheet open title="Filters">${content}</camo-modal-side-sheet>`,
      );
      const sheet = q(root, "camo-modal-side-sheet");
      await tick(100);
      const dialog = inner(sheet, "dialog") as HTMLDialogElement;
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
      fire("pointerdown", box.left + 20);
      fire("pointermove", box.left + 40);
      fire("pointerup", box.left + 40);
      expect(sheet.open).toBe(true);
      fire("pointerdown", box.left + 20);
      fire("pointermove", box.left + box.width * 0.6);
      fire("pointerup", box.left + box.width * 0.6);
      await tick(100);
      expect(sheet.open).toBe(false);
    });
  },
);

const ib = (label: string, icon: string, extra = ""): string =>
  `<camo-icon-button label="${label}"${extra}><camo-icon name="${icon}"></camo-icon></camo-icon-button>`;
const eight = [
  ib("Bold", "bold", " toggle checked"),
  ib("Italic", "italic", " toggle"),
  ib("Underline", "underline", " toggle"),
  ib("Share", "share"),
  ib("Search", "search"),
  ib("Add", "add", " disabled"),
  ib("Favorite", "heart", " toggle"),
  ib("Delete", "delete", ' tone="error"'),
].join("");

describe.each(["minimal", "cupertino"])("camo-toolbar under %s", (skin) => {
  it("is a named toolbar with one Tab stop, and the arrows move between actions", async () => {
    const root = await page(
      skin,
      `<camo-toolbar label="Editor" style="width:400px">${eight.slice(0, (3 * eight.length) / 8)}</camo-toolbar>`,
    );
    const bar = q(root, "camo-toolbar");
    expect(inspectAria(bar)).toMatchObject({
      role: "toolbar",
      label: "Editor",
      orientation: "horizontal",
    });
    const buttons = all(root, "camo-icon-button");
    expect(buttons.map((b) => b.tabIndex)).toEqual([0, -1, -1]);
    buttons[0]!.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(buttons[1]);
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(buttons[2]);
  });

  it("shows every action that fits and no more button", async () => {
    const root = await page(
      skin,
      `<camo-toolbar label="x" style="width:600px">${eight}</camo-toolbar>`,
    );
    const bar = q(root, "camo-toolbar");
    await tick(100);
    expect(
      all(root, "camo-icon-button").every((b) => !b.hasAttribute("data-camo-overflowed")),
    ).toBe(true);
    expect(inner(bar, ".more")).toBeNull();
  });

  it("folds the actions that do not fit, in order, into a more menu with their labels, tones and states", async () => {
    const root = await page(
      skin,
      `<camo-toolbar label="x" style="width:240px">${eight}</camo-toolbar>`,
    );
    const bar = q(root, "camo-toolbar");
    await tick(200);
    const buttons = all(root, "camo-icon-button");
    const folded = buttons.filter((b) => b.hasAttribute("data-camo-overflowed"));
    expect(folded.length).toBeGreaterThan(0);
    // The ones that show are the first ones: nothing out of order.
    const firstFolded = buttons.indexOf(folded[0]!);
    expect(
      buttons.slice(0, firstFolded).every((b) => !b.hasAttribute("data-camo-overflowed")),
    ).toBe(true);
    for (const b of folded) expect(getComputedStyle(b).display).toBe("none");
    const more = inner(bar, ".more");
    expect(more.getAttribute("label") ?? (more as El).label).toBe("More");
    const entries = [...bar.shadowRoot!.querySelectorAll<El>("camo-menu-item")];
    expect(entries.map((e) => e.text)).toEqual(folded.map((b) => b.label));
    // The delete action is destructive, add is disabled, favorite is a toggle: the menu says so.
    const by = (label: string): El | undefined => entries.find((e) => e.text === label);
    if (by("Delete") !== undefined) expect(by("Delete")!.tone).toBe("error");
    if (by("Add") !== undefined) expect(by("Add")!.disabled).toBe(true);
    if (by("Favorite") !== undefined) expect(by("Favorite")!.checkable).toBe(true);
  });

  it("presses the real action when its menu item is chosen, and follows a toggle's state", async () => {
    const root = await page(
      skin,
      `<camo-toolbar label="x" style="width:160px">${eight}</camo-toolbar>`,
    );
    const bar = q(root, "camo-toolbar");
    await tick(200);
    let pressed = "";
    for (const b of all(root, "camo-icon-button"))
      b.addEventListener("click", () => (pressed = b.label));
    const items = [...bar.shadowRoot!.querySelectorAll<El>("camo-menu-item")];
    const share = items.find((i) => i.text === "Share")!;
    share.click();
    expect(pressed).toBe("Share");
    // The app flips a toggle from its click: the menu's checkmark follows.
    const bold = all(root, "camo-icon-button")[0]!;
    bold.checked = false;
    await tick(100);
    const boldItem = [...bar.shadowRoot!.querySelectorAll<El>("camo-menu-item")].find(
      (i) => i.text === "Bold",
    );
    if (boldItem !== undefined) expect(boldItem.checked).toBe(false);
  });

  it("gives everything back when it grows, and keeps the leading and trailing controls", async () => {
    const root = await page(
      skin,
      `<div id="box" style="width:160px"><camo-toolbar label="x">${eight}${ib("Back", "arrow-back", ' slot="leading"')}</camo-toolbar></div>`,
    );
    await tick(200);
    expect(all(root, "camo-icon-button[data-camo-overflowed]").length).toBeGreaterThan(0);
    q(root, "#box").style.width = "700px";
    await tick(300);
    expect(all(root, "camo-icon-button[data-camo-overflowed]")).toHaveLength(0);
    expect(inner(q(root, "camo-toolbar"), ".more")).toBeNull();
    expect(q(root, '[slot="leading"]').getBoundingClientRect().width).toBeGreaterThan(0);
  });

  it("is docked or floating, and the floating one is detached with a margin", async () => {
    const root = await page(
      skin,
      `<camo-toolbar id="a" label="x" style="width:300px">${ib("Bold", "bold")}</camo-toolbar><camo-toolbar id="b" label="x" placement="floating" style="width:300px">${ib("Bold", "bold")}</camo-toolbar>`,
    );
    const margin = (id: string): string => getComputedStyle(inner(q(root, id), ".bar")).marginTop;
    expect(margin("#a")).toBe("0px");
    expect(margin("#b")).not.toBe("0px");
  });
});
