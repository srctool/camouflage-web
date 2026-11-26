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
const all = (root: ParentNode, selector: string): El[] => [...root.querySelectorAll<El>(selector)];
const inner = (el: Element, selector: string): HTMLElement =>
  el.shadowRoot!.querySelector<HTMLElement>(selector)!;
const innerAll = (el: Element, selector: string): HTMLElement[] => [
  ...el.shadowRoot!.querySelectorAll<HTMLElement>(selector),
];
const tick = (ms = 50): Promise<void> => new Promise((r) => setTimeout(r, ms));

const columns = [
  { key: "name", header: "Name", sortable: true },
  { key: "role", header: "Role" },
  { key: "score", header: "Score", align: "end", sortable: true },
];
const people = [
  { id: "1", name: "Ada Lovelace", role: "Analyst", score: 98 },
  { id: "2", name: "Grace Hopper", role: "Admiral", score: 95 },
  { id: "3", name: "Katherine Johnson", role: "Mathematician", score: 99 },
];

async function table(
  skin: string,
  attrs = "",
  init: Record<string, unknown> = {},
): Promise<{ root: HTMLElement; t: El }> {
  const root = await page(
    skin,
    `<div style="height:300px"><camo-data-table caption="People" ${attrs}><span slot="empty">No people</span></camo-data-table></div>`,
  );
  const t = q(root, "camo-data-table");
  Object.assign(t, { columns, rows: people }, init);
  await t.updateComplete;
  return { root, t };
}
const rowEls = (t: El): HTMLElement[] => innerAll(t, "tbody tr");

describe.each(SKINS)("camo-data-table under %s", (skin) => {
  it("is a grid with a caption, column headers, and a row for each record", async () => {
    const { t } = await table(skin);
    const grid = inner(t, "table");
    expect(grid.getAttribute("role")).toBe("grid");
    expect(grid.getAttribute("aria-label")).toBe("People");
    expect(grid.getAttribute("aria-rowcount")).toBe("4");
    expect(innerAll(t, "thead th").map((h) => h.textContent!.trim())).toEqual([
      "Name",
      "Role",
      "Score",
    ]);
    expect(rowEls(t).map((r) => r.children[0]!.textContent!.trim())).toEqual([
      "Ada Lovelace",
      "Grace Hopper",
      "Katherine Johnson",
    ]);
    expect(rowEls(t)[1]!.getAttribute("aria-rowindex")).toBe("3");
    expect(innerAll(t, "tbody td")[2]!.classList.contains("end")).toBe(true);
  });

  it("takes a function as a cell, a custom row key, and shows text by default", async () => {
    const { t } = await table(skin, "", {
      columns: [{ key: "name", header: "Name", cell: (r: { name: string }) => `${r.name}!` }],
      rowKey: (r: { name: string }) => r.name.toLowerCase(),
    });
    expect(innerAll(t, "tbody td")[0]!.textContent!.trim()).toBe("Ada Lovelace!");
    expect(rowEls(t)[0]!.dataset["key"]).toBe("ada lovelace");
  });

  it("shows the sort arrow and aria-sort for the sorted column, and none elsewhere", async () => {
    const { t } = await table(skin, "", { sort: { columnKey: "score", ascending: false } });
    const [name, role, score] = innerAll(t, "thead th");
    expect(score!.getAttribute("aria-sort")).toBe("descending");
    expect(name!.getAttribute("aria-sort")).toBe("none");
    expect(role!.hasAttribute("aria-sort")).toBe(false);
    expect(role!.querySelector("button")).toBeNull();
    expect(getComputedStyle(score!.querySelector("svg")!).rotate).toBe("180deg");
  });

  it("asks the app to sort: a new column ascending, the sorted one flips, and the rows stay the app's", async () => {
    const { t } = await table(skin);
    const seen: unknown[] = [];
    t.addEventListener("camo-sort-change", (e: Event) => seen.push((e as CustomEvent).detail));
    (inner(t, "[data-part=sort][data-key=name]") as HTMLButtonElement).click();
    t.sort = { columnKey: "name", ascending: true };
    await t.updateComplete;
    (inner(t, "[data-part=sort][data-key=name]") as HTMLButtonElement).click();
    (inner(t, "[data-part=sort][data-key=score]") as HTMLButtonElement).click();
    expect(seen).toEqual([
      { columnKey: "name", ascending: true },
      { columnKey: "name", ascending: false },
      { columnKey: "score", ascending: true },
    ]);
    expect(rowEls(t).map((r) => r.dataset["key"])).toEqual(["1", "2", "3"]); // unchanged: the app sorts
  });

  it("selects rows with checkboxes, asks first, and selects all, with a mixed header", async () => {
    const { t } = await table(skin, "selectable");
    const seen: string[] = [];
    t.addEventListener("camo-before-change", () => seen.push("before"));
    t.addEventListener("change", () => seen.push("change"));
    const boxes = (): HTMLInputElement[] => innerAll(t, "[data-part=select]") as HTMLInputElement[];
    boxes()[1]!.click();
    await t.updateComplete;
    expect([...t.selection]).toEqual(["2"]);
    expect(seen).toEqual(["before", "change"]);
    expect(rowEls(t)[1]!.getAttribute("aria-selected")).toBe("true");
    expect(rowEls(t)[0]!.getAttribute("aria-selected")).toBe("false");
    const head = inner(t, "[data-part=select-all]") as HTMLInputElement;
    expect(head.indeterminate).toBe(true);
    head.click();
    await t.updateComplete;
    expect([...t.selection].sort()).toEqual(["1", "2", "3"]);
    expect((inner(t, "[data-part=select-all]") as HTMLInputElement).checked).toBe(true);
    (inner(t, "[data-part=select-all]") as HTMLInputElement).click();
    await t.updateComplete;
    expect([...t.selection]).toEqual([]);
    t.addEventListener("camo-before-change", (e: Event) => e.preventDefault());
    boxes()[0]!.click();
    await t.updateComplete;
    expect([...t.selection]).toEqual([]);
  });

  it("takes a list of keys as the selection (JSON, a binding), and the checkboxes are named", async () => {
    const { t } = await table(skin, "selectable", { selection: ["3"] });
    expect(rowEls(t)[2]!.getAttribute("aria-selected")).toBe("true");
    expect(inner(t, "[data-part=select-all]").getAttribute("aria-label")).toBe("Select all rows");
    expect(inner(t, "[data-part=select]").getAttribute("aria-label")).toBe("Select row");
    expect(inner(t, "table").getAttribute("aria-multiselectable")).toBe("true");
  });

  it("has one Tab stop into the body; Up, Down, Home and End move between rows; Space selects; Enter and a click say so", async () => {
    const { t } = await table(skin, "selectable");
    const rows = rowEls(t);
    expect(rows.map((r) => r.tabIndex)).toEqual([0, -1, -1]);
    rows[0]!.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(t.shadowRoot!.activeElement).toBe(rows[1]);
    await userEvent.keyboard("{End}");
    expect(t.shadowRoot!.activeElement).toBe(rows[2]);
    await userEvent.keyboard("{Home}");
    expect(t.shadowRoot!.activeElement).toBe(rows[0]);
    await userEvent.keyboard(" ");
    await t.updateComplete;
    expect([...t.selection]).toEqual(["1"]);
    const clicks: string[] = [];
    t.addEventListener("camo-row-click", (e: Event) => clicks.push((e as CustomEvent).detail.key));
    await userEvent.keyboard("{Enter}");
    await t.updateComplete;
    expect(clicks).toEqual(["1"]);
    expect([...t.selection]).toEqual([]); // Enter on a selectable table also toggles, unless the app cancels
  });

  it("lets the app keep a row click from selecting, by cancelling camo-row-click", async () => {
    const { t } = await table(skin, "selectable");
    t.addEventListener("camo-row-click", (e: Event) => e.preventDefault());
    rowEls(t)[0]!.click();
    await t.updateComplete;
    expect([...t.selection]).toEqual([]);
    const free = await table(skin, "selectable");
    rowEls(free.t)[0]!.click();
    await free.t.updateComplete;
    expect([...free.t.selection]).toEqual(["1"]);
  });

  it("shows the empty slot with no rows, a progress circle while loading, and is busy", async () => {
    const { t } = await table(skin, "", { rows: [] });
    expect(inner(t, ".empty")).not.toBeNull();
    expect(
      ((inner(t, ".empty slot") as HTMLSlotElement).assignedNodes()[0] as HTMLElement).textContent,
    ).toBe("No people");
    t.loading = true;
    await t.updateComplete;
    expect(inner(t, ".loading camo-progress-circle")).not.toBeNull();
    expect(inner(t, ".empty")).toBeNull();
    expect(inner(t, "table").getAttribute("aria-busy")).toBe("true");
  });

  it("keeps the header in view while the rows scroll, and highlights the selected row", async () => {
    const many = Array.from({ length: 60 }, (_, i) => ({
      id: String(i),
      name: `Person ${i}`,
      role: "x",
      score: i,
    }));
    const { t } = await table(skin, "selectable", { rows: many, selection: ["1"] });
    const scroller = inner(t, ".scroller");
    expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);
    scroller.scrollTop = 400;
    await tick(50);
    const head = innerAll(t, "thead th")[0]!.getBoundingClientRect();
    expect(Math.abs(head.top - scroller.getBoundingClientRect().top)).toBeLessThan(2);
    scroller.scrollTop = 0;
    const bg = (i: number): string => getComputedStyle(rowEls(t)[i]!).backgroundColor;
    expect(bg(1)).not.toBe(bg(2));
  });

  it("keeps 1000 rows in a table that still lays out, and mirrors in right-to-left", async () => {
    const many = Array.from({ length: 1000 }, (_, i) => ({
      id: String(i),
      name: `P ${i}`,
      role: "x",
      score: i,
    }));
    const { t } = await table(skin, "", { rows: many });
    expect(rowEls(t)).toHaveLength(1000);
    const rtl = await page(
      skin,
      `<div style="height:200px"><camo-data-table caption="x"></camo-data-table></div>`,
      "rtl",
    );
    const tr = q(rtl, "camo-data-table");
    Object.assign(tr, { columns, rows: people });
    await tr.updateComplete;
    const ths = innerAll(tr, "thead th").map((h) => h.getBoundingClientRect().left);
    expect(ths[0]).toBeGreaterThan(ths[2]!);
  });
});

const nodes = [
  {
    key: "docs",
    label: "Documents",
    icon: ["folder", "folder"],
    children: [
      { key: "a", label: "Alpha.txt", icon: "file" },
      { key: "sub", label: "Archive", children: [{ key: "b", label: "Beta.txt" }] },
    ],
  },
  { key: "pics", label: "Pictures", hasChildren: true },
  { key: "readme", label: "README.md" },
];

async function tree(
  skin: string,
  attrs = "",
  init: Record<string, unknown> = {},
  dir = "ltr",
): Promise<{ root: HTMLElement; t: El }> {
  const root = await page(skin, `<camo-tree caption="Files" ${attrs}></camo-tree>`, dir);
  const t = q(root, "camo-tree");
  Object.assign(t, { nodes }, init);
  await t.updateComplete;
  return { root, t };
}
const items = (t: El): HTMLElement[] => innerAll(t, "li[role=treeitem]");
const labels = (t: El): string[] => items(t).map((i) => i.querySelector(".label")!.textContent!);

describe.each(SKINS)("camo-tree under %s", (skin) => {
  it("is a tree whose items announce level, place and expanded state", async () => {
    const { t } = await tree(skin, "", { expanded: ["docs"] });
    expect(inner(t, "ul").getAttribute("role")).toBe("tree");
    expect(inner(t, "ul").getAttribute("aria-label")).toBe("Files");
    expect(labels(t)).toEqual(["Documents", "Alpha.txt", "Archive", "Pictures", "README.md"]);
    const [docs, alpha, , pics, readme] = items(t);
    expect(docs!.getAttribute("aria-level")).toBe("1");
    expect(alpha!.getAttribute("aria-level")).toBe("2");
    expect(docs!.getAttribute("aria-expanded")).toBe("true");
    expect(pics!.getAttribute("aria-expanded")).toBe("false");
    expect(readme!.hasAttribute("aria-expanded")).toBe(false);
    expect(alpha!.getAttribute("aria-posinset")).toBe("1");
    expect(alpha!.getAttribute("aria-setsize")).toBe("2");
    expect(items(t).map((i) => i.tabIndex)).toEqual([0, -1, -1, -1, -1]);
  });

  it("expands and collapses with the chevron, and says so with the keys now", async () => {
    const { t } = await tree(skin);
    const seen: string[][] = [];
    t.addEventListener("camo-expanded-change", (e: Event) =>
      seen.push((e as CustomEvent).detail.keys),
    );
    (inner(t, "[data-part=toggle]") as HTMLElement).click();
    await t.updateComplete;
    expect(labels(t)).toContain("Alpha.txt");
    (inner(t, "[data-part=toggle]") as HTMLElement).click();
    await t.updateComplete;
    expect(labels(t)).not.toContain("Alpha.txt");
    expect(seen).toEqual([["docs"], []]);
  });

  it("indents by level, and mirrors the chevron in right-to-left", async () => {
    const { t } = await tree(skin, "", { expanded: ["docs", "sub"] });
    const pad = (i: number): number =>
      Number.parseFloat(
        getComputedStyle(items(t)[i]!.querySelector<HTMLElement>(".row")!).paddingInlineStart,
      );
    expect(pad(0)).toBe(0);
    expect(pad(1)).toBeGreaterThan(pad(0));
    expect(pad(3)).toBeGreaterThan(pad(1)); // a child of a child
    expect(pad(3)).toBeCloseTo(2 * pad(1), 0);
    const rtl = await tree(skin, "", { expanded: ["docs"] }, "rtl");
    const toggle = (i: number): DOMRect =>
      items(rtl.t)[i]!.querySelector<HTMLElement>(".toggle")!.getBoundingClientRect();
    expect(toggle(1).right).toBeLessThan(toggle(0).right); // the child is indented from the right
    expect(getComputedStyle(items(rtl.t)[0]!.querySelector(".toggle svg")!).scale).not.toBe("none");
  });

  it("selects one node on a click or Enter, and any number when multi-select, asking the app to hear it", async () => {
    const { t } = await tree(skin, "", { expanded: ["docs"] });
    const seen: string[][] = [];
    t.addEventListener("camo-selected-change", (e: Event) =>
      seen.push((e as CustomEvent).detail.keys),
    );
    items(t)[1]!.click();
    items(t)[2]!.click();
    await t.updateComplete;
    expect([...t.selected]).toEqual(["sub"]);
    expect(items(t)[2]!.getAttribute("aria-selected")).toBe("true");
    expect(seen).toEqual([["a"], ["sub"]]);
    const multi = await tree(skin, "multi-select", { expanded: ["docs"] });
    items(multi.t)[1]!.click();
    items(multi.t)[2]!.click();
    items(multi.t)[1]!.click();
    await multi.t.updateComplete;
    expect([...multi.t.selected]).toEqual(["sub"]);
    expect(inner(multi.t, "ul").getAttribute("aria-multiselectable")).toBe("true");
  });

  it("moves with Up, Down, Home and End, expands with Right and goes to the first child, collapses with Left and goes to the parent", async () => {
    const { t } = await tree(skin);
    items(t)[0]!.focus();
    await userEvent.keyboard("{ArrowRight}");
    await t.updateComplete;
    expect([...t.expanded]).toEqual(["docs"]);
    await userEvent.keyboard("{ArrowRight}");
    await tick(50);
    expect(t.shadowRoot!.activeElement).toBe(items(t)[1]);
    await userEvent.keyboard("{ArrowDown}");
    expect(t.shadowRoot!.activeElement).toBe(items(t)[2]);
    await userEvent.keyboard("{ArrowLeft}"); // a collapsed (never opened) child: go to its parent
    await tick(50);
    expect(t.shadowRoot!.activeElement).toBe(items(t)[0]);
    await userEvent.keyboard("{End}");
    await tick(50);
    expect(t.shadowRoot!.activeElement).toBe(items(t).at(-1));
    await userEvent.keyboard("{Home}");
    await userEvent.keyboard("{ArrowLeft}");
    await t.updateComplete;
    expect([...t.expanded]).toEqual([]);
  });

  it("swaps Left and Right in right-to-left", async () => {
    const { t } = await tree(skin, "", {}, "rtl");
    items(t)[0]!.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await t.updateComplete;
    expect([...t.expanded]).toEqual(["docs"]);
  });

  it("jumps to the next label that starts with the letters typed", async () => {
    const { t } = await tree(skin, "", { expanded: ["docs"] });
    items(t)[0]!.focus();
    await userEvent.keyboard("p");
    await tick(50);
    expect(t.shadowRoot!.activeElement!.querySelector(".label")!.textContent).toBe("Pictures");
    await userEvent.keyboard("{Home}");
    await userEvent.keyboard("ar");
    await tick(50);
    expect(t.shadowRoot!.activeElement!.querySelector(".label")!.textContent).toBe("Archive");
  });

  it("asks once for the children of a node that is not loaded, shows a spinner, and takes them when set", async () => {
    const { t } = await tree(skin);
    const asked: string[] = [];
    t.addEventListener("camo-load-children", (e: Event) =>
      asked.push((e as CustomEvent).detail.node.key),
    );
    items(t)[1]!.focus();
    await userEvent.keyboard("{ArrowRight}");
    await t.updateComplete;
    expect(asked).toEqual(["pics"]);
    expect(items(t)[1]!.getAttribute("aria-busy")).toBe("true");
    expect(items(t)[1]!.querySelector("camo-progress-circle")).not.toBeNull();
    await userEvent.keyboard("{ArrowLeft}");
    await userEvent.keyboard("{ArrowRight}");
    await t.updateComplete;
    expect(asked).toEqual(["pics"]); // once
    t.nodes = nodes.map((n) =>
      n.key === "pics" ? { ...n, children: [{ key: "p1", label: "Photo.png" }] } : n,
    );
    await t.updateComplete;
    expect(labels(t)).toContain("Photo.png");
    expect(items(t)[1]!.hasAttribute("aria-busy")).toBe(false);
  });

  it("ignores a stale key, draws icons by name, and its open icon when expanded", async () => {
    const { t } = await tree(skin, "", { expanded: ["gone", "docs"], selected: ["nothing"] });
    expect(labels(t)).toHaveLength(5);
    expect(items(t)[0]!.querySelector(".icon svg")).not.toBeNull();
    expect(items(t)[1]!.querySelector(".icon svg")).not.toBeNull();
    expect(items(t)[2]!.querySelector(".icon")).toBeNull();
  });
});

describe.each(SKINS)("camo-pagination under %s", (skin) => {
  const make = async (attrs: string, dir = "ltr"): Promise<{ root: HTMLElement; p: El }> => {
    const root = await page(skin, `<camo-pagination ${attrs}></camo-pagination>`, dir);
    return { root, p: q(root, "camo-pagination") };
  };
  const shown = (p: El): string[] =>
    innerAll(p, ".pg > *").map((el) =>
      el.classList.contains("gap")
        ? "…"
        : el.getAttribute("data-part") === "page"
          ? el.textContent!.trim()
          : el.getAttribute("data-part")!,
    );

  it("is a navigation landmark with the current page marked, and pages named", async () => {
    const { p } = await make('page-count="20" page="9" label="Results"');
    expect(inner(p, "nav").getAttribute("aria-label")).toBe("Results");
    expect(shown(p)).toEqual(["prev", "1", "…", "9", "10", "11", "…", "20", "next"]);
    const current = inner(p, '[aria-current="page"]');
    expect(current.textContent!.trim()).toBe("10");
    expect(current.getAttribute("aria-label")).toBe("Page 10");
    expect(inner(p, "[data-part=prev]").getAttribute("aria-label")).toBe("Previous page");
  });

  it("changes page by a button, an arrow, or a page, firing camo-page-change and following it", async () => {
    const { p } = await make('page-count="20" page="9"');
    const seen: number[] = [];
    p.addEventListener("camo-page-change", (e: Event) => seen.push((e as CustomEvent).detail.page));
    (inner(p, "[data-part=next]") as HTMLButtonElement).click();
    await p.updateComplete;
    expect(p.page).toBe(10);
    (inner(p, "[data-part=prev]") as HTMLButtonElement).click();
    (inner(p, '[data-index="19"]') as HTMLButtonElement).click();
    await p.updateComplete;
    expect(p.page).toBe(19);
    expect(seen).toEqual([10, 9, 19]);
    (inner(p, '[data-index="19"]') as HTMLButtonElement).click(); // the current page again is no change
    expect(seen).toHaveLength(3);
  });

  it("disables the arrows at the ends, and has a fixed length so nothing shifts", async () => {
    const { p } = await make('page-count="20" page="0"');
    expect((inner(p, "[data-part=prev]") as HTMLButtonElement).disabled).toBe(true);
    expect((inner(p, "[data-part=next]") as HTMLButtonElement).disabled).toBe(false);
    const counts = new Set<number>();
    for (const page of [0, 5, 10, 15, 19]) {
      p.page = page;
      await p.updateComplete;
      counts.add(shown(p).length);
    }
    expect([...counts]).toEqual([9]);
  });

  it("has one Tab stop, moves focus with the arrows without choosing, and Home and End go to the first and last page", async () => {
    const { p } = await make('page-count="20" page="9"');
    const buttons = innerAll(p, "button:not(:disabled)");
    expect(buttons.filter((b) => b.tabIndex === 0)).toHaveLength(1);
    expect(inner(p, '[aria-current="page"]').tabIndex).toBe(0);
    inner(p, '[aria-current="page"]').focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(p.page).toBe(9); // moved focus only
    expect((p.shadowRoot!.activeElement as HTMLElement).textContent!.trim()).toBe("11");
    await userEvent.keyboard("{End}");
    await p.updateComplete;
    expect(p.page).toBe(19);
    await userEvent.keyboard("{Home}");
    await p.updateComplete;
    expect(p.page).toBe(0);
  });

  it("is a summary for compact, adjustable dots for dots, and nothing for one page", async () => {
    const compact = await make('page-count="9" page="2" variant="compact"');
    expect(inner(compact.p, ".summary").textContent).toBe("Page 3 of 9");
    const dots = await make('page-count="5" page="1" variant="dots"');
    expect(innerAll(dots.p, ".dot")).toHaveLength(5);
    expect(inner(dots.p, ".dot.cur")).toBe(innerAll(dots.p, ".dot")[1]);
    const one = await make('page-count="1"');
    expect(one.p.shadowRoot!.querySelector("nav")).toBeNull();
    expect(inspectAria(one.p)?.hidden).toBe(true);
  });

  it("mirrors the arrows in right-to-left, and blocks everything when disabled", async () => {
    const rtl = await make('page-count="20" page="9"', "rtl");
    expect(getComputedStyle(inner(rtl.p, ".nav svg")).scale).not.toBe("none");
    const off = await make('page-count="20" page="9" disabled');
    expect(innerAll(off.p, "button").every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
  });
});

const crumb = (label: string, extra = ""): string =>
  `<camo-breadcrumb-item label="${label}"${extra}></camo-breadcrumb-item>`;

describe.each(SKINS)("camo-breadcrumb under %s", (skin) => {
  const make = async (
    width: number,
    items: string[],
    attrs = "",
    dir = "ltr",
  ): Promise<{ root: HTMLElement; b: El }> => {
    const root = await page(
      skin,
      `<div id="box" style="width:${width}px"><camo-breadcrumb label="Path" ${attrs}>${items.map((l) => crumb(l)).join("")}</camo-breadcrumb></div>`,
      dir,
    );
    await tick(250);
    return { root, b: q(root, "camo-breadcrumb") };
  };
  const trail = (b: El): string[] =>
    innerAll(b, "[data-part=item], camo-menu").map((el) =>
      el.tagName === "CAMO-MENU" ? "…" : el.textContent!.trim(),
    );

  it("is a navigation landmark: links are buttons, the current page is not", async () => {
    const { b } = await make(600, ["Home", "Docs", "Report"]);
    expect(inner(b, "nav").getAttribute("aria-label")).toBe("Path");
    expect(trail(b)).toEqual(["Home", "Docs", "Report"]);
    const items = innerAll(b, "[data-part=item]");
    expect(items[0]!.tagName).toBe("BUTTON");
    expect(items[2]!.tagName).toBe("SPAN");
    expect(items[2]!.getAttribute("aria-current")).toBe("page");
    expect(inner(b, "ol").children).toHaveLength(3);
  });

  it("runs the item's own click, so the app listens on the item", async () => {
    const { root, b } = await make(600, ["Home", "Docs", "Report"]);
    const clicks: string[] = [];
    for (const item of all(root, "camo-breadcrumb-item"))
      item.addEventListener("click", () => clicks.push(item.label));
    (innerAll(b, "[data-part=item]")[1] as HTMLButtonElement).click();
    expect(clicks).toEqual(["Docs"]);
  });

  it("folds the middle into a more menu when it does not fit, keeping the first and the last", async () => {
    const { b } = await make(260, [
      "Home",
      "Documents and settings",
      "Projects and ideas",
      "Camouflage library",
      "Web port notes",
    ]);
    const shown = trail(b);
    expect(shown[0]).toBe("Home");
    expect(shown.at(-1)).toBe("Web port notes");
    expect(shown).toContain("…");
    const entries = [...b.shadowRoot!.querySelectorAll<El>("camo-menu-item")].map((e) => e.text);
    expect(entries.length + shown.length - 1).toBe(5);
    expect(inner(b, "camo-menu camo-icon-button").getAttribute("label")).toBe("More");
  });

  it("opens the more menu, and choosing an entry runs that item's click", async () => {
    const { root, b } = await make(260, [
      "Home",
      "Documents and settings",
      "Projects and ideas",
      "Camouflage library",
      "Web port notes",
    ]);
    const clicks: string[] = [];
    for (const item of all(root, "camo-breadcrumb-item"))
      item.addEventListener("click", () => clicks.push(item.label));
    const entry = b.shadowRoot!.querySelectorAll<El>("camo-menu-item")[0]!;
    entry.click();
    expect(clicks).toEqual([entry.text]);
  });

  it("collapses at max-visible even when it fits, and gives it all back when it grows", async () => {
    const { root, b } = await make(800, ["Home", "Docs", "Projects", "Report"], 'max-visible="3"');
    expect(trail(b)).toEqual(["Home", "…", "Projects", "Report"]); // three items and the more menu
    const wide = await make(800, ["Home", "Docs", "Projects", "Report"]);
    expect(trail(wide.b)).toEqual(["Home", "Docs", "Projects", "Report"]);
    const small = await make(200, [
      "Home",
      "Documents and settings",
      "Projects and ideas",
      "Report",
    ]);
    expect(trail(small.b)).toContain("…");
    q(small.root, "#box").style.width = "900px";
    await tick(400);
    expect(trail(small.b)).not.toContain("…");
    void root;
  });

  it("shows only the current item for one, never folds two, and mirrors separators in right-to-left", async () => {
    const one = await make(300, ["Home"]);
    expect(trail(one.b)).toEqual(["Home"]);
    expect(inner(one.b, ".sep")).toBeNull();
    const two = await make(60, ["Home", "A very long current location"]);
    expect(trail(two.b)).not.toContain("…");
    const rtl = await make(600, ["Home", "Docs"], "", "rtl");
    expect(getComputedStyle(inner(rtl.b, ".sep svg")).scale).not.toBe("none");
    const items = innerAll(rtl.b, "[data-part=item]").map((i) => i.getBoundingClientRect().left);
    expect(items[0]).toBeGreaterThan(items[1]!);
  });
});

const steps = (): string =>
  `<camo-step label="Cart"></camo-step><camo-step label="Shipping" description="Where it goes"></camo-step><camo-step label="Payment"></camo-step><camo-step label="Done"></camo-step>`;

describe.each(SKINS)("camo-progress-steps under %s", (skin) => {
  const make = async (
    attrs: string,
    body = steps(),
    dir = "ltr",
  ): Promise<{ root: HTMLElement; s: El }> => {
    const root = await page(
      skin,
      `<camo-progress-steps label="Checkout" style="width:400px" ${attrs}>${body}</camo-progress-steps>`,
      dir,
    );
    return { root, s: q(root, "camo-progress-steps") };
  };

  it("is a list: earlier steps complete, the current one marked, the rest upcoming, each announcing its place", async () => {
    const { root, s } = await make('current="1"');
    expect(inspectAria(s)).toMatchObject({ role: "list", label: "Checkout" });
    const stepEls = all(root, "camo-step");
    expect(stepEls.map((e) => e.resolved)).toEqual(["complete", "current", "upcoming", "upcoming"]);
    expect(inspectAria(stepEls[1]!)).toMatchObject({
      role: "listitem",
      label: "Step 2 of 4, Shipping, current",
      current: "page",
    });
    expect(inspectAria(stepEls[0]!)?.label).toBe("Step 1 of 4, Cart, complete");
    expect(inspectAria(stepEls[3]!)?.label).toBe("Step 4 of 4, Done, upcoming");
  });

  it("draws a check for complete, numbers for the rest, and an error mark for a flagged step", async () => {
    const { root } = await make(
      'current="1"',
      `<camo-step label="A"></camo-step><camo-step label="B" state="error"></camo-step><camo-step label="C"></camo-step>`,
    );
    const [a, b, c] = all(root, "camo-step");
    expect(inner(a!, ".marker svg")).not.toBeNull();
    expect(inner(b!, ".marker svg")).not.toBeNull();
    expect(inspectAria(b!)?.label).toBe("Step 2 of 3, B, error");
    expect(inner(c!, ".marker").textContent!.trim()).toBe(traits(skin).stepNumbers ? "3" : "");
    const color = (el: El): string => getComputedStyle(inner(el, ".marker")).backgroundColor;
    expect(new Set([color(a!), color(b!), color(c!)]).size).toBe(3);
  });

  it("shares the width between steps, the last one taking only what it needs, and mirrors in right-to-left", async () => {
    const { root } = await make('current="1"');
    const widths = all(root, "camo-step").map((e) => Math.round(e.getBoundingClientRect().width));
    expect(Math.abs(widths[0]! - widths[1]!)).toBeLessThanOrEqual(1);
    expect(widths[3]!).toBeLessThan(widths[0]!);
    const rtl = await make('current="1"', steps(), "rtl");
    const left = all(rtl.root, "camo-step").map((e) => e.getBoundingClientRect().left);
    expect(left[0]).toBeGreaterThan(left[1]!);
  });

  it("stacks vertically, with the connector running down between markers", async () => {
    const { root } = await make('current="1" orientation="vertical"');
    const stepEls = all(root, "camo-step");
    expect(stepEls[1]!.getBoundingClientRect().top).toBeGreaterThan(
      stepEls[0]!.getBoundingClientRect().bottom - 2,
    );
    const connector = inner(stepEls[0]!, ".connector").getBoundingClientRect();
    expect(connector.height).toBeGreaterThan(connector.width);
    expect(inner(stepEls[3]!, ".connector")).toBeNull(); // the last has none
  });

  it("makes only clickable steps buttons, with one Tab stop and arrows between them", async () => {
    const { root } = await make(
      'current="2"',
      `<camo-step label="Cart" clickable></camo-step><camo-step label="Shipping" clickable></camo-step><camo-step label="Payment"></camo-step>`,
    );
    const [a, b, c] = all(root, "camo-step");
    expect(inspectAria(a!)?.role).toBe("button");
    expect(inspectAria(c!)?.role).toBe("listitem");
    expect([a!.tabIndex, b!.tabIndex]).toEqual([0, -1]);
    let clicks = 0;
    for (const el of [a!, b!, c!]) el.addEventListener("click", () => clicks++);
    a!.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(b);
    await userEvent.keyboard("{Enter}");
    c!.click();
    expect(clicks).toBe(1); // the plain step is not a button: a click on it is ignored
  });

  it("follows the app: moving `current` moves the states", async () => {
    const { root, s } = await make('current="0"');
    s.current = 3;
    await s.updateComplete;
    await tick(50);
    expect(all(root, "camo-step").map((e) => e.resolved)).toEqual([
      "complete",
      "complete",
      "complete",
      "current",
    ]);
  });
});
