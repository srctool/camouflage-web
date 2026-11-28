// W9's desktop foundations: menu submenus, the split pane, the scrollbar and densities.
import "./helpers.ts";
import { inspectAria } from "@srctool/camouflage-core";
import type {
  CamoMenu,
  CamoMenuSubmenu,
  CamoPane,
  CamoResizeDetail,
  CamoScrollbar,
  CamoSplitPane,
} from "@srctool/camouflage-core";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { box, mount, settled, SKINS } from "./helpers.ts";

const tick = (ms: number = 50): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function page(skin: string, body: string, dir = "ltr"): Promise<HTMLElement> {
  const root = mount(
    `<div dir="${dir}"><camo-provider skin="${skin}" scheme="light"><div style="padding:24px">${body}</div></camo-provider></div>`,
  );
  await settled(root);
  return root;
}

const q = <T extends Element = HTMLElement>(root: ParentNode, selector: string): T =>
  root.querySelector<T>(selector)!;
const inner = <T extends Element = HTMLElement>(host: Element, selector: string): T =>
  host.shadowRoot!.querySelector<T>(selector)!;

const MENU = `<camo-menu><camo-button slot="anchor" text="Actions"></camo-button>
  <camo-menu-item id="copy" text="Copy"></camo-menu-item>
  <camo-menu-submenu id="reset" text="Reset"><camo-menu-item id="soft" text="Soft"></camo-menu-item><camo-menu-item id="hard" text="Hard"></camo-menu-item>
    <camo-menu-submenu id="more" text="More"><camo-menu-item id="deep" text="Deep"></camo-menu-item></camo-menu-submenu></camo-menu-submenu>
  <camo-menu-item id="paste" text="Paste"></camo-menu-item></camo-menu>`;

async function menu(skin: string, dir = "ltr") {
  const root = await page(skin, MENU, dir);
  const m = q<CamoMenu>(root, "camo-menu");
  await m.show();
  await tick();
  const sub = q<CamoMenuSubmenu>(root, "#reset");
  const popup = (host: Element): HTMLElement => inner(host, ".camo-popup");
  const shown = (host: Element): boolean => popup(host).matches(":popover-open");
  return { root, m, sub, popup, shown };
}

describe.each(SKINS)("menu submenus under %s", (skin) => {
  it("say they open a menu, and walk one level at a time", async () => {
    const { root, sub, shown } = await menu(skin);
    expect(inspectAria(sub)).toMatchObject({
      role: "menuitem",
      label: "Reset",
      hasPopup: "menu",
      expanded: false,
    });
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(sub);
    // Down passes over the closed child to the next entry of this level.
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(q(root, "#paste"));
    expect(shown(sub)).toBe(false);
  });

  it("open with Right, close with Left and Escape one level each, and focus their row", async () => {
    const { root, m, sub, shown } = await menu(skin);
    sub.focus();
    await userEvent.keyboard("{ArrowRight}");
    await settled(root);
    expect(shown(sub)).toBe(true);
    expect(document.activeElement).toBe(q(root, "#soft"));
    expect(inspectAria(sub)).toMatchObject({ expanded: true });
    await userEvent.keyboard("{End}");
    const deeper = q<CamoMenuSubmenu>(root, "#more");
    expect(document.activeElement).toBe(deeper);
    await userEvent.keyboard("{Enter}");
    await settled(root);
    expect(document.activeElement).toBe(q(root, "#deep"));
    expect(shown(sub) && shown(deeper)).toBe(true);
    await userEvent.keyboard("{Escape}");
    expect(shown(deeper)).toBe(false);
    expect(shown(sub)).toBe(true);
    expect(document.activeElement).toBe(deeper);
    await userEvent.keyboard("{ArrowLeft}");
    expect(shown(sub)).toBe(false);
    expect(m.open).toBe(true);
    expect(document.activeElement).toBe(sub);
    await userEvent.keyboard("{Escape}");
    await tick();
    expect(m.open).toBe(false);
  });

  it("close the whole chain when an entry is chosen", async () => {
    const { root, m, sub, shown } = await menu(skin);
    let chosen = 0;
    q(root, "#soft").addEventListener("click", () => chosen++);
    sub.click();
    await settled(root);
    await tick();
    q(root, "#soft").click();
    await tick();
    expect(chosen).toBe(1);
    expect(m.open).toBe(false);
    expect(shown(sub)).toBe(false);
  });

  it("open beside the row, level with it, and mirror in right-to-left", async () => {
    for (const dir of ["ltr", "rtl"]) {
      const { root, sub, popup } = await menu(skin, dir);
      sub.focus();
      await userEvent.keyboard(dir === "rtl" ? "{ArrowLeft}" : "{ArrowRight}");
      await settled(root);
      await tick();
      const row = box(sub);
      const child = box(popup(sub));
      // Beside the row where there is room (a wide menu in a narrow window is only kept inside it).
      const room = dir === "ltr" ? window.innerWidth - row.right - 4 : row.left - 4;
      if (room >= child.width) {
        if (dir === "ltr") expect(child.left).toBeGreaterThanOrEqual(row.right - 1);
        else expect(child.right).toBeLessThanOrEqual(row.left + 1);
      }
      expect(child.left).toBeGreaterThanOrEqual(0);
      expect(child.right).toBeLessThanOrEqual(window.innerWidth);
      expect(Math.abs(box(q(root, "#soft")).top - row.top)).toBeLessThan(3);
      q<CamoMenu>(root, "camo-menu").hide();
      await tick();
    }
  });
});

describe("a submenu under the pointer", () => {
  it("opens after a delay, and closes after a grace once another row is reached", async () => {
    const { root, sub, shown } = await menu("minimal");
    await userEvent.hover(sub);
    await tick(80);
    expect(shown(sub)).toBe(false);
    await tick(350);
    expect(shown(sub)).toBe(true);
    // Into the child: it stays.
    await userEvent.hover(q(root, "#soft"));
    await tick(250);
    expect(shown(sub)).toBe(true);
    await userEvent.hover(q(root, "#paste"));
    await tick(300);
    expect(shown(sub)).toBe(false);
  });
});

const SPLIT = (attrs = "", panes = ""): string =>
  `<camo-split-pane ${attrs} style="inline-size:409px;block-size:200px">${
    panes ||
    `<camo-pane id="a" min-size="50" collapsible>A</camo-pane><camo-pane id="b" min-size="100">B</camo-pane>`
  }</camo-split-pane>`;

async function split(skin = "minimal", markup = SPLIT(), dir = "ltr") {
  const root = await page(skin, markup, dir);
  const s = q<CamoSplitPane>(root, "camo-split-pane");
  await settled(root);
  const pane = (id: string): CamoPane => q<CamoPane>(root, `#${id}`);
  const divider = (id = "a"): HTMLElement => inner(pane(id), ".divider");
  const log: CamoResizeDetail[] = [];
  s.addEventListener("camo-resize", (e) => log.push((e as CustomEvent<CamoResizeDetail>).detail));
  return { root, s, pane, divider, log };
}

function drag(handle: HTMLElement, dx: number, dy = 0): void {
  const r = handle.getBoundingClientRect();
  const at = (type: string, x: number, y: number): void =>
    void handle.dispatchEvent(
      new PointerEvent(type, {
        pointerId: 1,
        button: 0,
        clientX: x,
        clientY: y,
        bubbles: true,
        composed: true,
      }),
    );
  at("pointerdown", r.x, r.y);
  at("pointermove", r.x + dx, r.y + dy);
  at("pointerup", r.x + dx, r.y + dy);
}

describe.each(SKINS)("camo-split-pane under %s", (skin) => {
  it("shares its width equally, with a separator that says where it is", async () => {
    const { pane, divider } = await split(skin);
    expect(Math.abs(box(pane("a")).width - box(pane("b")).width)).toBeLessThan(3);
    const d = divider();
    expect(d.getAttribute("role")).toBe("separator");
    expect(d.getAttribute("aria-orientation")).toBe("vertical");
    expect(d.getAttribute("aria-valuenow")).toBe("50");
    expect(d.getAttribute("aria-label")).toBe("Resize panel");
    expect(getComputedStyle(d).cursor).toBe("col-resize");
    // The last pane has no divider.
    expect(getComputedStyle(divider("b")).display).toBe("none");
  });

  it("is dragged, within both minimums, and reports the sizes", async () => {
    const { root, s, pane, divider, log } = await split(skin);
    drag(divider(), 40);
    await settled(root);
    expect(box(pane("a")).width).toBeGreaterThan(box(pane("b")).width + 60);
    expect(log).toHaveLength(1);
    expect(log[0]!.fractions[0]! + log[0]!.fractions[1]!).toBeCloseTo(1, 3);
    drag(divider(), 900);
    await settled(root);
    expect(box(pane("b")).width).toBeCloseTo(100, 0);
    expect(s.fractions[0]).toBeGreaterThan(0.7);
  });
});

describe("camo-split-pane keys and state", () => {
  it("moves by the key step, to the ends, and the other way in right-to-left", async () => {
    for (const dir of ["ltr", "rtl"]) {
      const { root, pane, divider } = await split("minimal", SPLIT(), dir);
      const before = box(pane("a")).width;
      divider().focus();
      await userEvent.keyboard(dir === "rtl" ? "{ArrowLeft}" : "{ArrowRight}");
      await settled(root);
      expect(box(pane("a")).width - before).toBeCloseTo(16, 0);
      await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
      await settled(root);
      expect(box(pane("a")).width - before).toBeCloseTo(dir === "rtl" ? -48 : 80, 0);
      await userEvent.keyboard("{Home}");
      await settled(root);
      // Home goes to the minimum and does not shut a collapsible pane.
      expect(box(pane("a")).width).toBeCloseTo(50, 0);
      await userEvent.keyboard("{End}");
      await settled(root);
      expect(box(pane("b")).width).toBeCloseTo(100, 0);
    }
  });

  it("shuts and restores a collapsible neighbour with Enter, hiding its content", async () => {
    const { root, s, pane, divider } = await split();
    divider().focus();
    await userEvent.keyboard("{Enter}");
    await settled(root);
    expect(s.snapshot()).toEqual({ fractions: [0, 1], collapsed: [0] });
    expect(getComputedStyle(inner(pane("a"), ".content")).display).toBe("none");
    await userEvent.keyboard("{Enter}");
    await settled(root);
    expect(s.fractions[0]).toBeCloseTo(0.5, 2);
  });

  it("keeps a shut pane shut when the split changes size", async () => {
    const { root, s } = await split(
      "minimal",
      SPLIT(
        "",
        `<camo-pane id="a" size="0" collapsible>A</camo-pane><camo-pane id="b" size="1">B</camo-pane>`,
      ),
    );
    s.style.inlineSize = "300px";
    await tick(100);
    await settled(root);
    expect(s.snapshot().collapsed).toEqual([0]);
  });

  it("saves and restores its shares, and a double click puts the pair back", async () => {
    const { root, s, divider } = await split();
    s.fractions = [0.25, 0.75];
    await settled(root);
    expect(s.fractions).toEqual([0.25, 0.75]);
    divider().dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    await settled(root);
    expect(s.fractions).toEqual([0.5, 0.5]);
  });

  it("takes the shares from the attribute, stacks vertically and nests", async () => {
    const nested = `<camo-pane id="a" size="0.25" min-size="20">A</camo-pane><camo-pane id="b" size="0.75"><camo-split-pane><camo-pane id="c">C</camo-pane><camo-pane id="d">D</camo-pane></camo-split-pane></camo-pane>`;
    const { pane, divider } = await split("minimal", SPLIT('axis="vertical"', nested));
    expect(box(pane("b")).height).toBeGreaterThan(box(pane("a")).height * 2.5);
    expect(getComputedStyle(divider()).cursor).toBe("row-resize");
    expect(divider().getAttribute("aria-orientation")).toBe("horizontal");
    expect(box(pane("c")).width).toBeCloseTo(box(pane("d")).width, -1);
    expect(getComputedStyle(divider("c")).cursor).toBe("col-resize");
  });
});

const lines = Array.from({ length: 40 }, (_, i) => `<div style="height:20px">row ${i}</div>`).join(
  "",
);

async function scroller(skin = "minimal", attrs = 'visibility="always"', dir = "ltr") {
  const root = await page(
    skin,
    `<camo-scrollbar ${attrs} label="Log" style="block-size:200px;inline-size:200px">${lines}</camo-scrollbar>`,
    dir,
  );
  const bar = q<CamoScrollbar>(root, "camo-scrollbar");
  await tick(80);
  await settled(root);
  return { root, bar, view: bar.viewport!, thumb: () => inner(bar, ".thumb") };
}

describe.each(SKINS)("camo-scrollbar under %s", (skin) => {
  it("draws a thumb for the share in view, hidden from assistive technology", async () => {
    const { bar, view, thumb } = await scroller(skin);
    // 200 of 800: a quarter.
    expect(box(thumb()).height).toBeCloseTo(50, 0);
    expect(inner(bar, ".bars").getAttribute("aria-hidden")).toBe("true");
    expect(view.getAttribute("role")).toBe("region");
    expect(view.tabIndex).toBe(0);
    expect(getComputedStyle(view).scrollbarWidth).toBe("none");
    // The bar sits on the end edge.
    expect(box(thumb()).right).toBeCloseTo(box(bar).right, 0);
  });
});

describe("camo-scrollbar interaction", () => {
  it("follows the content, is dragged, and pages from its track", async () => {
    const { root, bar, view, thumb } = await scroller();
    view.scrollTop = 600;
    await tick(80);
    await settled(root);
    expect(box(thumb()).bottom).toBeCloseTo(box(bar).bottom, 0);
    const handle = thumb();
    const r = box(handle);
    handle.dispatchEvent(
      new PointerEvent("pointerdown", {
        pointerId: 1,
        button: 0,
        clientY: r.top + 5,
        bubbles: true,
        composed: true,
      }),
    );
    window.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientY: r.top - 70 }));
    window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
    await tick(80);
    expect(view.scrollTop).toBeCloseTo(300, -1);
    const track = inner(bar, ".track");
    track.dispatchEvent(
      new PointerEvent("pointerdown", {
        pointerId: 1,
        button: 0,
        clientY: box(bar).top + 2,
        bubbles: true,
        composed: true,
      }),
    );
    expect(view.scrollTop).toBeCloseTo(100, -1);
  });

  it("shows while scrolling and hides after the delay", async () => {
    const root = await page(
      "minimal",
      `<camo-scrollbar style="block-size:200px;--camo-scrollbar-hide-delay:200ms">${lines}</camo-scrollbar>`,
    );
    const bar = q<CamoScrollbar>(root, "camo-scrollbar");
    await tick(80);
    const visible = (): boolean => inner(bar, ".track").classList.contains("visible");
    expect(visible()).toBe(false);
    bar.viewport!.scrollTop = 100;
    await tick(60);
    expect(visible()).toBe(true);
    await tick(1400);
    expect(visible()).toBe(false);
  });

  it("sits on the left in right-to-left, and draws nothing when all is in view", async () => {
    const { bar, thumb } = await scroller("minimal", 'visibility="always"', "rtl");
    expect(box(thumb()).left).toBeCloseTo(box(bar).left, 0);
    const root = await page(
      "minimal",
      `<camo-scrollbar style="block-size:200px">short</camo-scrollbar>`,
    );
    await tick(80);
    expect(q(root, "camo-scrollbar").shadowRoot!.querySelector(".track")).toBeNull();
  });
});

describe("the provider's density", () => {
  it.each([
    ["xs", 24],
    ["sm", 32],
    ["md", 40],
    ["lg", 48],
  ])("%s is %ipx in Carbon and Fluent, and nothing in Minimal", async (density, height) => {
    for (const skin of ["carbon", "fluent", "minimal"]) {
      const root = mount(
        `<camo-provider skin="${skin}" density="${density}"><camo-button text="Go"></camo-button></camo-provider>`,
      );
      await settled(root);
      expect(box(q(root, "camo-button")).height).toBe(skin === "minimal" ? 40 : height);
    }
  });

  it("sizes rows, menu items and fields too, never below their content", async () => {
    const measure = async (density: string): Promise<number[]> => {
      const root = mount(
        `<camo-provider skin="carbon" density="${density}"><camo-list-item headline="main" clickable></camo-list-item><camo-text-field label="Branch"></camo-text-field></camo-provider>`,
      );
      await settled(root);
      return [
        box(inner(q(root, "camo-list-item"), ".row")).height,
        box(inner(q(root, "camo-text-field"), ".box")).height,
      ];
    };
    const [xsRow, xsField] = await measure("xs");
    const [lgRow, lgField] = await measure("lg");
    expect(lgRow).toBe(48);
    expect(xsRow).toBeLessThanOrEqual(36);
    expect(lgField).toBeCloseTo(48, -0.5);
    expect(xsField).toBeLessThanOrEqual(28);
  });
});
