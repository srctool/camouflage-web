import { inspectAria, showCamoDialog } from "@srctool/camouflage-core";
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
const tick = (ms = 60): Promise<void> => new Promise((r) => setTimeout(r, ms));
const modal = (el: Element): boolean => inner(el, "dialog").matches(":modal");
const popupOpen = (el: Element): boolean => inner(el, ".camo-popup").matches(":popover-open");

describe.each(["minimal", "cupertino"])(
  "the overlay frame, dialog and bottom sheet under %s",
  (skin) => {
    const sheet = `<camo-bottom-sheet id="s" title="Share"><camo-list-item id="first" headline="Message" clickable></camo-list-item><camo-list-item headline="Mail" clickable></camo-list-item></camo-bottom-sheet>`;

    it("a bottom sheet is a modal in the top layer, named by its title, with focus moved in", async () => {
      const root = await page(skin, `<button id="opener">open</button>${sheet}`);
      q(root, "#opener").focus();
      const s = q(root, "#s");
      s.open = true;
      await settled(root);
      await tick();
      expect(modal(s)).toBe(true);
      expect(inner(s, "dialog").getAttribute("aria-labelledby")).toBe("title");
      expect(inner(s, "#title").textContent).toBe("Share");
      expect(document.activeElement).toBe(q(root, "#first"));
    });

    it("closes on Escape and on the scrim, fires camo-close once, and returns focus to the opener", async () => {
      const root = await page(skin, `<button id="opener">open</button>${sheet}`);
      const s = q(root, "#s");
      const closes: unknown[] = [];
      s.addEventListener("camo-close", (e: Event) => closes.push((e as CustomEvent).detail));
      for (const how of ["escape", "scrim"]) {
        q(root, "#opener").focus();
        s.open = true;
        await settled(root);
        await tick();
        if (how === "escape") await userEvent.keyboard("{Escape}");
        else inner(s, "dialog").click();
        await tick();
        expect(s.open).toBe(false);
        expect(document.activeElement).toBe(q(root, "#opener"));
      }
      expect(closes).toEqual([{ result: undefined }, { result: undefined }]);
    });

    it("a persistent sheet ignores Escape and the scrim, and close(result) still closes it", async () => {
      const root = await page(
        skin,
        sheet.replace("<camo-bottom-sheet", "<camo-bottom-sheet persistent"),
      );
      const s = q(root, "#s");
      s.open = true;
      await settled(root);
      await tick();
      await userEvent.keyboard("{Escape}");
      inner(s, "dialog").click();
      await tick();
      expect(s.open).toBe(true);
      let result: unknown;
      s.addEventListener("camo-close", (e: Event) => (result = (e as CustomEvent).detail.result));
      s.close("done");
      await tick();
      expect(s.open).toBe(false);
      expect(result).toBe("done");
    });

    it("dismisses by dragging the handle down, and goes from medium to large by dragging up", async () => {
      const root = await page(
        skin,
        sheet.replace("<camo-bottom-sheet", '<camo-bottom-sheet detent="medium"'),
      );
      const s = q(root, "#s");
      s.open = true;
      await settled(root);
      await tick();
      const dialog = inner(s, "dialog");
      const handle = inner(s, ".drag").getBoundingClientRect();
      const fire = (type: string, y: number): void =>
        void dialog.dispatchEvent(
          new PointerEvent(type, {
            pointerId: 1,
            clientY: y,
            button: 0,
            bubbles: true,
            composed: true,
          }),
        );
      const down = (path: HTMLElement, type: string, y: number): void =>
        void path.dispatchEvent(
          new PointerEvent(type, {
            pointerId: 1,
            clientY: y,
            button: 0,
            bubbles: true,
            composed: true,
          }),
        );
      down(inner(s, ".handle"), "pointerdown", handle.top + 4);
      fire("pointermove", handle.top - 120);
      fire("pointerup", handle.top - 120);
      await settled(root);
      expect(s.detent).toBe("large");
      expect(s.open).toBe(true);
      down(inner(s, ".handle"), "pointerdown", handle.top + 4);
      fire("pointermove", handle.top + 600);
      fire("pointerup", handle.top + 600);
      await tick();
      expect(s.open).toBe(false);
    });

    it("a dialog inside a dialog is on top, and Escape closes only the top one, then the other", async () => {
      const root = await page(
        skin,
        `<button id="opener">open</button>
       <camo-dialog id="outer" title="Outer" message="First"><camo-button slot="confirm" text="Next" id="next"></camo-button>
         <camo-dialog id="inner" title="Inner" message="Second"><camo-button slot="confirm" text="OK"></camo-button></camo-dialog>
       </camo-dialog>`,
      );
      q(root, "#opener").focus();
      const [outer, innerDialog] = [q(root, "#outer"), q(root, "#inner")];
      outer.open = true;
      await settled(root);
      await tick();
      expect(modal(outer)).toBe(true);
      // Opened by a click, as in use: a browser closes overlays opened with no user gesture between together.
      q(root, "#next").addEventListener("click", () => (innerDialog.open = true));
      await userEvent.click(q(root, "#next"));
      await tick();
      expect(modal(innerDialog)).toBe(true);
      // Both are modal; the later one is above (the top layer is a stack). Escape goes to the top one only.
      await userEvent.keyboard("{Escape}");
      await tick();
      expect(innerDialog.open).toBe(false);
      expect(outer.open).toBe(true);
      expect(modal(outer)).toBe(true);
      await userEvent.keyboard("{Escape}");
      await tick();
      expect(outer.open).toBe(false);
      expect(document.activeElement).toBe(q(root, "#opener"));
    });

    it("traps focus inside a dialog: Tab cycles through its actions and never reaches the page", async () => {
      const root = await page(
        skin,
        `<button id="behind">behind</button><camo-dialog id="d" title="T" message="M"><camo-button slot="confirm" text="Yes" id="yes"></camo-button><camo-button slot="dismiss" text="No" id="no"></camo-button></camo-dialog>`,
      );
      const d = q(root, "#d");
      d.open = true;
      await settled(root);
      await tick();
      const seen = new Set<string>();
      for (let i = 0; i < 6; i++) {
        await userEvent.tab();
        seen.add((document.activeElement as HTMLElement).id || document.activeElement!.tagName);
      }
      // Which actions Tab stops on differs by engine (Safari skips custom elements unless the user turns that on); that it
      // never reaches the page behind does not.
      expect(seen.has("behind")).toBe(false);
      d.close();
    });

    it("the imperative dialog attaches to the nearest provider and draws with its skin", async () => {
      const root = await page(skin, `<div id="host"></div>`);
      const promise = showCamoDialog<boolean>({
        title: "Delete?",
        message: "Sure?",
        confirm: { text: "Delete", tone: "error", result: true },
        dismiss: { text: "Cancel", appearance: "ghost", result: false },
        host: q(root, "#host"),
      });
      await settled(root);
      await tick();
      const d = root.querySelector("camo-dialog") as El;
      expect(d.parentElement).toBe(q(root, "#host"));
      expect(d.shadowRoot!.querySelector("dialog")!.querySelector("h2")!.textContent).toBe(
        "Delete?",
      );
      q(d, "[slot=confirm]").click();
      expect(await promise).toBe(true);
    });

    it("a sheet and a dialog both draw their content from the skin and fall back to slots with no provider", async () => {
      const root = mount(
        `<camo-bottom-sheet id="s" title="Plain" open><p>Hi</p></camo-bottom-sheet>`,
      );
      await settled(root);
      expect(q(root, "#s").shadowRoot!.querySelector("dialog")).not.toBeNull();
      q(root, "#s").close();
    });
  },
);

describe.each(["minimal", "cupertino"])("camo-menu under %s", (skin) => {
  const menu = `<camo-menu id="m">
    <camo-button slot="anchor" id="anchor" text="Actions"></camo-button>
    <camo-menu-item id="copy" text="Copy" trailing-text="⌘C"></camo-menu-item>
    <camo-menu-item id="paste" text="Paste"></camo-menu-item>
    <camo-menu-divider></camo-menu-divider>
    <camo-menu-group exclusive>
      <camo-menu-item id="new" text="Newest" checkable checked></camo-menu-item>
      <camo-menu-item id="old" text="Oldest" checkable></camo-menu-item>
    </camo-menu-group>
    <camo-menu-item id="off" text="Archive" disabled></camo-menu-item>
    <camo-menu-item id="del" text="Delete" tone="error"></camo-menu-item>
  </camo-menu>`;

  it("the anchor says it has a popup, and opens it, with the first item focused", async () => {
    const root = await page(skin, menu);
    const m = q(root, "#m");
    expect(q(root, "#anchor").getAttribute("aria-haspopup")).toBe("menu");
    expect(q(root, "#anchor").getAttribute("aria-expanded")).toBe("false");
    q(root, "#anchor").click();
    await settled(root);
    await tick();
    expect(popupOpen(m)).toBe(true);
    expect(m.open).toBe(true);
    expect(q(root, "#anchor").getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(q(root, "#copy"));
    expect(inner(m, ".menu").getAttribute("role")).toBe("menu");
  });

  it("is placed below the anchor, or above when there is no room", async () => {
    const root = await page(skin, menu);
    const m = q(root, "#m");
    q(root, "#anchor").click();
    await settled(root);
    await tick();
    const a = q(root, "#anchor").getBoundingClientRect();
    const p = inner(m, ".camo-popup").getBoundingClientRect();
    expect(p.top).toBeGreaterThanOrEqual(a.bottom);
    await userEvent.keyboard("{Escape}");
  });

  it("opens from the keyboard on the anchor: Down focuses the first item, Up the last", async () => {
    const root = await page(skin, menu);
    q(root, "#anchor").focus();
    await userEvent.keyboard("{ArrowDown}");
    await tick();
    expect(document.activeElement).toBe(q(root, "#copy"));
    await userEvent.keyboard("{Escape}");
    await tick();
    q(root, "#anchor").focus();
    await userEvent.keyboard("{ArrowUp}");
    await tick();
    expect(document.activeElement).toBe(q(root, "#del"));
    await userEvent.keyboard("{Escape}");
  });

  it("moves with Up, Down, Home and End, skipping disabled items, and wraps", async () => {
    const root = await page(skin, menu);
    q(root, "#anchor").click();
    await settled(root);
    await tick();
    const order = ["copy", "paste", "new", "old", "del"];
    for (const id of order.slice(1)) {
      await userEvent.keyboard("{ArrowDown}");
      expect((document.activeElement as HTMLElement).id).toBe(id);
    }
    await userEvent.keyboard("{ArrowDown}");
    expect((document.activeElement as HTMLElement).id).toBe("copy");
    await userEvent.keyboard("{End}");
    expect((document.activeElement as HTMLElement).id).toBe("del");
    await userEvent.keyboard("{Home}");
    expect((document.activeElement as HTMLElement).id).toBe("copy");
    await userEvent.keyboard("{Escape}");
  });

  it("jumps to the next item starting with the typed letters", async () => {
    const root = await page(skin, menu);
    q(root, "#anchor").click();
    await settled(root);
    await tick();
    await userEvent.keyboard("o");
    expect((document.activeElement as HTMLElement).id).toBe("old");
    await tick(800); // a pause ends the prefix
    await userEvent.keyboard("d");
    expect((document.activeElement as HTMLElement).id).toBe("del");
    await tick(800);
    await userEvent.keyboard("p");
    expect((document.activeElement as HTMLElement).id).toBe("paste");
    await userEvent.keyboard("{Escape}");
  });

  it("selects with Enter, Space or a click: runs the item's click handler and closes, returning focus", async () => {
    const root = await page(skin, menu);
    const m = q(root, "#m");
    const clicks: string[] = [];
    for (const id of ["#copy", "#paste", "#off"])
      q(root, id).addEventListener("click", () => clicks.push(id));
    q(root, "#anchor").focus();
    q(root, "#anchor").click();
    await settled(root);
    await tick();
    await userEvent.keyboard("{Enter}");
    await tick();
    expect(clicks).toEqual(["#copy"]);
    expect(popupOpen(m)).toBe(false);
    expect(document.activeElement).toBe(q(root, "#anchor"));
    q(root, "#anchor").click();
    await settled(root);
    await tick();
    q(root, "#paste").click();
    await tick();
    expect(clicks).toEqual(["#copy", "#paste"]);
    expect(popupOpen(m)).toBe(false);
    q(root, "#anchor").click();
    await settled(root);
    await tick();
    q(root, "#off").click();
    expect(clicks).toEqual(["#copy", "#paste"]); // disabled
    expect(popupOpen(m)).toBe(true);
    await userEvent.keyboard("{Escape}");
  });

  it("announces menu items, checkboxes and an exclusive group's radios with their state", async () => {
    const root = await page(
      skin,
      `${menu}<camo-menu><camo-button slot="anchor" text="b"></camo-button><camo-menu-item id="chk" text="Hidden files" checkable checked></camo-menu-item></camo-menu>`,
    );
    expect(inspectAria(q(root, "#copy"))).toMatchObject({ role: "menuitem", label: "Copy" });
    expect(inspectAria(q(root, "#new"))).toMatchObject({ role: "menuitemradio", checked: true });
    expect(inspectAria(q(root, "#old"))).toMatchObject({ role: "menuitemradio", checked: false });
    expect(inspectAria(q(root, "#chk"))).toMatchObject({ role: "menuitemcheckbox", checked: true });
    expect(inspectAria(q(root, "#off"))).toMatchObject({ disabled: true });
  });

  it("an exclusive group checks the chosen item and unchecks the others", async () => {
    const root = await page(skin, menu);
    q(root, "#anchor").click();
    await settled(root);
    await tick();
    q(root, "#old").click();
    await settled(root);
    expect([q(root, "#new").checked, q(root, "#old").checked]).toEqual([false, true]);
  });

  it("opens declaratively with the open attribute and closes when it is removed; fires camo-open and camo-close", async () => {
    const root = await page(skin, menu.replace("<camo-menu ", "<camo-menu open "));
    const m = q(root, "#m");
    await settled(root);
    await tick();
    expect(popupOpen(m)).toBe(true);
    m.open = false;
    await settled(root);
    expect(popupOpen(m)).toBe(false);
  });

  it("closes when the user clicks outside, and the Tab key leaves it closed", async () => {
    const root = await page(skin, `${menu}<button id="out">out</button>`);
    const m = q(root, "#m");
    q(root, "#anchor").click();
    await settled(root);
    await tick();
    await userEvent.click(q(root, "#out"));
    await tick();
    expect(popupOpen(m)).toBe(false);
    expect(m.open).toBe(false);
  });
});

describe.each(["minimal", "cupertino"])("camo-tooltip under %s", (skin) => {
  const tip = (attrs = ""): string =>
    `<camo-tooltip id="t" text="Save the file" ${attrs}><camo-button id="btn" text="Save"></camo-button></camo-tooltip>`;

  it("shows after the delay on hover, hides when the pointer leaves, and is the anchor's description", async () => {
    const root = await page(skin, tip('show-delay="80" hide-delay="40"'));
    const t = q(root, "#t");
    // Firefox has no `ariaDescription`; where it exists, the text is the anchor's description and not its name.
    if ("ariaDescription" in q(root, "#btn"))
      expect(q(root, "#btn").ariaDescription).toBe("Save the file");
    t.dispatchEvent(new PointerEvent("pointerenter"));
    await tick(30);
    expect(popupOpen(t)).toBe(false);
    await tick(150);
    expect(popupOpen(t)).toBe(true);
    expect(inner(t, ".tip").textContent).toBe("Save the file");
    expect(inner(t, ".camo-popup").getAttribute("role")).toBe("tooltip");
    t.dispatchEvent(new PointerEvent("pointerleave"));
    await tick(150);
    expect(popupOpen(t)).toBe(false);
  });

  it("shows at once on keyboard focus, hides on blur and on Escape, and never takes focus", async () => {
    const root = await page(skin, `${tip()}<button id="other">other</button>`);
    const t = q(root, "#t");
    // Keyboard modality: a real Tab (Firefox ignores a lone modifier key) so the focus counts as :focus-visible.
    await userEvent.keyboard("{Tab}");
    if (document.activeElement !== q(root, "#btn")) q(root, "#btn").focus();
    await tick(30);
    expect(document.activeElement).toBe(q(root, "#btn"));
    // WebKit does not call a script's focus() after a key press keyboard focus; the rest is the same everywhere.
    if (/Chrome|Firefox/.test(navigator.userAgent)) expect(popupOpen(t)).toBe(true);
    expect(t.shadowRoot!.activeElement).toBeNull();
    await userEvent.keyboard("{Escape}");
    await tick(30);
    expect(popupOpen(t)).toBe(false);
    q(root, "#btn").focus();
    await tick(30);
    q(root, "#other").focus();
    await tick(30);
    expect(popupOpen(t)).toBe(false);
  });

  it("stays while the pointer moves onto the tooltip (hoverable), and does not show when disabled", async () => {
    const root = await page(skin, tip('show-delay="0" hide-delay="200"'));
    const t = q(root, "#t");
    t.dispatchEvent(new PointerEvent("pointerenter"));
    await tick(60);
    expect(popupOpen(t)).toBe(true);
    t.dispatchEvent(new PointerEvent("pointerleave"));
    inner(t, ".camo-popup").dispatchEvent(new PointerEvent("pointerenter"));
    await tick(300);
    expect(popupOpen(t)).toBe(true);
    inner(t, ".camo-popup").dispatchEvent(new PointerEvent("pointerleave"));
    await tick(300);
    expect(popupOpen(t)).toBe(false);
    t.disabled = true;
    t.dispatchEvent(new PointerEvent("pointerenter"));
    await tick(80);
    expect(popupOpen(t)).toBe(false);
  });

  it("open shows it whatever the pointer does, below the anchor", async () => {
    const root = await page(skin, tip("open"));
    const t = q(root, "#t");
    await tick(100);
    expect(popupOpen(t)).toBe(true);
    expect(inner(t, ".camo-popup").getBoundingClientRect().top).toBeGreaterThanOrEqual(
      q(root, "#btn").getBoundingClientRect().bottom,
    );
  });
});

describe.each(["minimal", "cupertino"])("camo-top-bar under %s", (skin) => {
  const bar = (attrs = "", extra = ""): string =>
    `<camo-top-bar id="b" title="Inbox" ${attrs}><camo-icon-button slot="navigation" label="Back"><camo-icon name="arrow-back"></camo-icon></camo-icon-button><camo-icon-button slot="actions" label="Search"><camo-icon name="search"></camo-icon></camo-icon-button>${extra}</camo-top-bar>`;

  it("exposes the title as a heading and keeps the slotted buttons' own semantics", async () => {
    const root = await page(skin, bar());
    const b = q(root, "#b");
    expect(b.hasAttribute("title")).toBe(false);
    const headings = [...b.shadowRoot!.querySelectorAll("h1")].filter(
      (h) => h.getAttribute("aria-hidden") !== "true",
    );
    expect(headings).toHaveLength(1);
    expect(headings[0]!.textContent).toBe("Inbox");
    expect(inspectAria(q(root, "[slot=navigation]"))).toMatchObject({
      role: "button",
      label: "Back",
    });
  });

  it("orders navigation, title and actions in the reading direction", async () => {
    for (const dir of ["ltr", "rtl"]) {
      const root = await page(skin, bar(), dir);
      const b = q(root, "#b");
      const nav = inner(b, ".nav").getBoundingClientRect();
      const act = inner(b, ".actions").getBoundingClientRect();
      if (dir === "ltr") expect(nav.left).toBeLessThan(act.left);
      else expect(nav.left).toBeGreaterThan(act.left);
    }
  });

  it("shows a hairline or a tint once content has scrolled under it", async () => {
    const root = await page(
      skin,
      bar('scroll-offset="0"') + bar('scroll-offset="30"').replace('id="b"', 'id="c"'),
    );
    const rule = (id: string): string =>
      getComputedStyle(inner(q(root, id), ".bar")).borderBlockEndWidth;
    expect(rule("#b")).toBe("0px");
    expect(rule("#c")).toBe("1px");
  });

  it("collapses a large title as the offset grows in Cupertino, and draws no large title in Minimal", async () => {
    const root = await page(
      skin,
      bar('scroll-offset="0"') + bar('scroll-offset="80"').replace('id="b"', 'id="c"'),
    );
    const large = (id: string): HTMLElement | null =>
      q(root, id).shadowRoot!.querySelector<HTMLElement>(".large");
    if (skin === "minimal") {
      expect(large("#b")).toBeNull();
      return;
    }
    expect(large("#b")!.getBoundingClientRect().height).toBeGreaterThan(30);
    expect(large("#c")!.getBoundingClientRect().height).toBe(0);
    expect(getComputedStyle(inner(q(root, "#c"), ".title")).opacity).toBe("1");
    expect(getComputedStyle(inner(q(root, "#b"), ".title")).opacity).toBe("0");
  });

  it("follows a scroller with scroll-target, in both directions", async () => {
    const root = await page(
      skin,
      `<div id="scroller" style="block-size:120px;overflow:auto"><div style="block-size:600px">tall</div></div>${bar('scroll-target="#scroller"')}`,
    );
    const b = q(root, "#b");
    const scroller = q(root, "#scroller");
    // The target is a selector looked up in the document, and the bar follows the scroller it names.
    b.scrollTarget = "#scroller";
    await settled(root);
    scroller.scrollTop = 70;
    scroller.dispatchEvent(new Event("scroll"));
    await settled(root);
    expect(b.scrollOffset).toBe(70);
    scroller.scrollTop = 0;
    scroller.dispatchEvent(new Event("scroll"));
    expect(b.scrollOffset).toBe(0);
  });

  it("keeps the heading when a custom title replaces the drawn one, and slides away when hidden", async () => {
    const root = await page(
      skin,
      bar("", `<camo-search-field slot="title-content"></camo-search-field>`),
    );
    const b = q(root, "#b");
    await settled(root);
    expect(b.hasAttribute("data-camo-title-content")).toBe(true);
    const h1 = b.shadowRoot!.querySelector<HTMLElement>(
      skin === "minimal" ? "h1.title" : ".title",
    )!;
    expect(h1.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    b.hidden = true;
    await settled(root);
    expect(getComputedStyle(b).translate).not.toBe("none");
  });
});

describe.each(["minimal", "cupertino"])("camo-select under %s", (skin) => {
  const sel = (attrs = ""): string => `<camo-select id="s" name="country" label="Country" ${attrs}>
    <camo-option value="id" label="Indonesia" supporting="+62"></camo-option>
    <camo-option value="nl" label="Netherlands"></camo-option>
    <camo-option value="no" label="Norway" disabled></camo-option>
    <camo-option value="nz" label="New Zealand"></camo-option>
  </camo-select>`;
  const field = (s: Element): HTMLInputElement =>
    s.shadowRoot!.querySelector<HTMLInputElement>(".camo-input")!;
  const opts = (s: Element): HTMLElement[] => [
    ...s.shadowRoot!.querySelectorAll<HTMLElement>(".opt"),
  ];

  it("announces itself as a pop-up and shows the chosen option's label", async () => {
    const root = await page(skin, sel('value="nl"'));
    const s = q(root, "#s");
    expect(field(s).value).toBe("Netherlands");
    expect(field(s).getAttribute("aria-haspopup")).toBe("dialog");
    expect(field(s).getAttribute("aria-labelledby")).toBe("label");
  });

  it("opens a listbox of options, with the current one selected and a disabled one marked", async () => {
    const root = await page(skin, sel('value="nl" presentation="menu"'));
    const s = q(root, "#s");
    await s.show();
    await tick();
    expect(inner(s, ".list").getAttribute("role")).toBe("listbox");
    expect(opts(s)).toHaveLength(4);
    expect(opts(s).map((o) => o.getAttribute("aria-selected"))).toEqual([
      "false",
      "true",
      "false",
      "false",
    ]);
    expect(opts(s)[2]!.getAttribute("aria-disabled")).toBe("true");
    expect(opts(s)[0]!.querySelector("camo-list-item")!.getAttribute("supporting")).toBe("+62");
    await userEvent.keyboard("{Escape}");
  });

  it("chooses by click or keyboard: sets the value, fires input and change, closes, and keeps the field's focus", async () => {
    const root = await page(skin, sel('presentation="menu"'));
    const s = q(root, "#s");
    const log: string[] = [];
    for (const t of ["camo-before-change", "input", "change"])
      s.addEventListener(t, () => log.push(t));
    await s.show();
    await tick();
    opts(s)[0]!.click();
    await tick();
    expect(s.value).toBe("id");
    expect(log).toEqual(["camo-before-change", "input", "change"]);
    expect(field(s).value).toBe("Indonesia");
    expect(popupOpen(s)).toBe(false);
    await s.show();
    await tick();
    expect(s.shadowRoot!.activeElement).toBe(opts(s)[0]); // the selected option holds the tab stop
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Enter}");
    await tick();
    expect(s.value).toBe("nl");
  });

  it("skips a disabled option with the keys, jumps by typed letters, and Escape closes without changing", async () => {
    const root = await page(skin, sel('value="nl" presentation="menu"'));
    const s = q(root, "#s");
    await s.show();
    await tick();
    opts(s)[1]!.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect((s.shadowRoot!.activeElement as HTMLElement).dataset["label"]).toBe("New Zealand"); // Norway is disabled
    await userEvent.keyboard("i");
    expect((s.shadowRoot!.activeElement as HTMLElement).dataset["label"]).toBe("Indonesia");
    await userEvent.keyboard("{Escape}");
    await tick();
    expect(s.value).toBe("nl");
    expect(popupOpen(s)).toBe(false);
  });

  it("is cancelable, form-associated, required and resettable", async () => {
    const root = await page(skin, `<form>${sel('required presentation="menu"')}</form>`);
    const s = q(root, "#s");
    const form = q(root, "form") as unknown as HTMLFormElement;
    expect(form.checkValidity()).toBe(false);
    s.addEventListener("camo-before-change", (e: Event) => e.preventDefault());
    await s.show();
    await tick();
    opts(s)[0]!.click();
    await tick();
    expect(s.value).toBe("");
    s.removeEventListener("camo-before-change", () => {});
    s.value = "nz";
    await settled(root);
    expect([...new FormData(form).entries()]).toEqual([["country", "nz"]]);
    expect(form.checkValidity()).toBe(true);
    form.reset();
    await settled(root);
    expect(s.value).toBe("");
  });

  it("a searchable select filters its own options, and takes options set as a property", async () => {
    const root = await page(skin, sel('searchable presentation="menu"'));
    const s = q(root, "#s");
    await s.show();
    await tick();
    const q1 = inner(s, ".q") as HTMLInputElement;
    q1.value = "new";
    q1.dispatchEvent(new Event("input"));
    await settled(root);
    expect(opts(s).map((o) => o.dataset["label"])).toEqual(["New Zealand"]);
    await userEvent.keyboard("{Escape}");
    const root2 = await page(
      skin,
      `<camo-select id="p" label="Pick" presentation="menu"></camo-select>`,
    );
    const p = q(root2, "#p");
    p.options = [
      { value: "a", label: "Alpha" },
      { value: "b", label: "Beta" },
    ];
    p.value = "b";
    await settled(root2);
    expect(field(p).value).toBe("Beta");
  });

  it("async: fires camo-open, debounces camo-query, shows the selected label before its option loads, and a loading row", async () => {
    const root = await page(
      skin,
      `<camo-select id="s" label="User" value="u9" selected-label="Ada (loaded earlier)" searchable search-debounce="80" presentation="menu"></camo-select>`,
    );
    const s = q(root, "#s");
    expect(field(s).value).toBe("Ada (loaded earlier)");
    const log: string[] = [];
    s.addEventListener("camo-open", () => log.push("open"));
    s.addEventListener("camo-query", (e: Event) =>
      log.push(`q:${(e as CustomEvent<{ query: string }>).detail.query}`),
    );
    s.loading = true;
    s.options = [];
    await s.show();
    await tick();
    expect(inner(s, "[role=status]")).not.toBeNull();
    const input = inner(s, ".q") as HTMLInputElement;
    for (const v of ["a", "ad", "ada"]) {
      input.value = v;
      input.dispatchEvent(new Event("input"));
      await tick(20);
    }
    await tick(200);
    expect(log).toEqual(["open", "q:ada"]); // one query, after the pause
    s.loading = false;
    s.options = [{ value: "u9", label: "Ada Lovelace" }];
    await settled(root);
    expect(field(s).value).toBe("Ada Lovelace");
    await userEvent.keyboard("{Escape}");
  });

  it("uses a sheet on a compact window and for a long list in auto, and a menu otherwise", async () => {
    const many = Array.from(
      { length: 9 },
      (_, i) => `<camo-option value="${i}" label="Option ${i}"></camo-option>`,
    ).join("");
    const root = await page(
      skin,
      `<camo-select id="few" label="A"><camo-option value="1" label="One"></camo-option></camo-select>
       <camo-select id="many" label="B">${many}</camo-select>
       <camo-select id="menu" label="C" presentation="menu">${many}</camo-select>
       <camo-select id="sheet" label="D" presentation="sheet"><camo-option value="1" label="One"></camo-option></camo-select>`,
    );
    const sheet = (id: string): boolean =>
      inner(q(root, id), ".camo-popup").classList.contains("sheet");
    const compact = window.innerWidth < 600;
    const expected: Record<string, boolean> = {
      "#few": compact,
      "#many": true,
      "#menu": false,
      "#sheet": true,
    };
    for (const id of Object.keys(expected)) {
      await q(root, id).show();
      await tick();
      expect(sheet(id), id).toBe(expected[id]);
      await userEvent.keyboard("{Escape}");
      await tick();
    }
  });

  it("makes the menu at least as wide as the field", async () => {
    const root = await page(
      skin,
      `<div style="inline-size:360px">${sel('presentation="menu"')}</div>`,
    );
    const s = q(root, "#s");
    await s.show();
    await tick();
    expect(inner(s, ".camo-popup").getBoundingClientRect().width).toBeGreaterThanOrEqual(
      s.getBoundingClientRect().width - 1,
    );
    await userEvent.keyboard("{Escape}");
  });
});
