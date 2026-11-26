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
const inner = (el: Element, selector: string): HTMLElement =>
  el.shadowRoot!.querySelector<HTMLElement>(selector)!;
const tick = (ms = 50): Promise<void> => new Promise((r) => setTimeout(r, ms));
const bg = (el: Element): string => getComputedStyle(inner(el, ".camo-surface")).backgroundColor;

describe.each(["minimal", "cupertino"])("camo-card under %s", (skin) => {
  it("has no role of its own unless it is clickable, and then it is one button", async () => {
    const root = await page(
      skin,
      `<camo-card id="a">Plain</camo-card><camo-card id="b" clickable>Open</camo-card>`,
    );
    expect(inspectAria(q(root, "#a"))).toMatchObject({ role: "generic" });
    expect(q(root, "#a").hasAttribute("tabindex")).toBe(false);
    expect(inspectAria(q(root, "#b"))).toMatchObject({ role: "button" });
    expect(q(root, "#b").tabIndex).toBe(0);
  });

  it("fires click from the keyboard, and not when disabled or not clickable", async () => {
    const root = await page(
      skin,
      `<camo-card id="a" clickable>Open</camo-card><camo-card id="b" clickable disabled>Off</camo-card><camo-card id="c">Plain</camo-card>`,
    );
    let clicks = 0;
    for (const id of ["#a", "#b", "#c"]) q(root, id).addEventListener("click", () => clicks++);
    q(root, "#a").focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(clicks).toBe(2);
    q(root, "#b").click();
    expect(clicks).toBe(2);
    expect(q(root, "#b").tabIndex).toBe(-1);
  });

  it("is a toggle with pressed state when selectable, and draws the selection", async () => {
    const root = await page(
      skin,
      `<camo-card id="a" clickable selectable>Plan</camo-card><camo-card id="b" clickable selectable selected>Plan</camo-card>`,
    );
    expect(inspectAria(q(root, "#a"))).toMatchObject({ pressed: false });
    expect(inspectAria(q(root, "#b"))).toMatchObject({ pressed: true });
    expect(getComputedStyle(inner(q(root, "#b"), ".camo-surface")).borderTopWidth).toBe("2px");
    expect(getComputedStyle(inner(q(root, "#a"), ".camo-surface")).borderTopWidth).not.toBe("2px");
  });

  it("draws appearances and tones differently, and puts its content inside", async () => {
    const root = await page(
      skin,
      `<camo-card id="raised">x</camo-card><camo-card id="soft" appearance="soft">x</camo-card><camo-card id="err" appearance="soft" tone="error">x</camo-card><camo-card id="solid" appearance="solid">x</camo-card>`,
    );
    const colors = ["#raised", "#soft", "#err", "#solid"].map((id) => bg(q(root, id)));
    expect(new Set(colors).size).toBe(4);
    expect(q(root, "#raised").shadowRoot!.querySelector("slot")!.assignedNodes().length).toBe(1);
  });
});

describe.each(["minimal", "cupertino"])("camo-list-item and camo-list-section under %s", (skin) => {
  it("shows the texts, sizes by how many there are, and is one button when clickable", async () => {
    const root = await page(
      skin,
      `<camo-list-item id="a" headline="One"></camo-list-item>
       <camo-list-item id="b" headline="Two" supporting="Line"></camo-list-item>
       <camo-list-item id="c" headline="Three" supporting="Line" overline="Over" clickable></camo-list-item>`,
    );
    const h = (id: string): number => inner(q(root, id), ".row").getBoundingClientRect().height;
    expect(h("#b")).toBeGreaterThan(h("#a"));
    expect(h("#c")).toBeGreaterThan(h("#b"));
    expect(inner(q(root, "#c"), ".headline").textContent).toBe("Three");
    expect(inspectAria(q(root, "#c"))).toMatchObject({
      role: "button",
      label: "Over, Three, Line",
    });
    expect(inspectAria(q(root, "#a"))).toMatchObject({ role: "generic" });
  });

  it("fires click, marks selected, and ignores a disabled row", async () => {
    const root = await page(
      skin,
      `<camo-list-item id="a" headline="A" clickable selected></camo-list-item><camo-list-item id="b" headline="B" clickable disabled></camo-list-item>`,
    );
    let clicks = 0;
    q(root, "#a").addEventListener("click", () => clicks++);
    q(root, "#b").addEventListener("click", () => clicks++);
    q(root, "#a").focus();
    await userEvent.keyboard("{Enter}");
    q(root, "#b").click();
    expect(clicks).toBe(1);
    expect(inspectAria(q(root, "#a"))).toMatchObject({ pressed: true });
  });

  it("slots a leading and a trailing widget, and hides an empty slot's space", async () => {
    const root = await page(
      skin,
      `<camo-list-item id="a" headline="A"><camo-icon slot="leading" name="search"></camo-icon><camo-icon slot="trailing" name="add"></camo-icon></camo-list-item><camo-list-item id="b" headline="B"></camo-list-item>`,
    );
    const left = (id: string): number =>
      inner(q(root, id), ".headline").getBoundingClientRect().left;
    const row = (id: string): number => inner(q(root, id), ".row").getBoundingClientRect().left;
    // A row with no leading widget starts its text at the padding, with no gap left over; one with a widget is pushed.
    expect(left("#b") - row("#b")).toBeLessThan(left("#a") - row("#a"));
    expect(left("#b") - row("#b")).toBeLessThanOrEqual(24);
  });

  it("a section names its group, makes the title a heading, and draws dividers between rows but not after the last", async () => {
    const root = await page(
      skin,
      `<camo-list-section id="s" title="Network" footer="Notes"><camo-list-item headline="A"></camo-list-item><camo-list-item headline="B"></camo-list-item></camo-list-section>`,
    );
    const s = q(root, "#s");
    expect(inspectAria(s)).toMatchObject({ role: "group", label: "Network" });
    expect(inner(s, "h2").textContent).toBe("Network");
    expect(s.hasAttribute("title")).toBe(false);
    expect(inner(s, ".footer").textContent).toBe("Notes");
    const items = [...root.querySelectorAll("camo-list-item")];
    const after = (i: number): CSSStyleDeclaration =>
      getComputedStyle(inner(items[i]!, ".row"), "::after");
    expect(after(0).display).not.toBe("none");
    expect(after(0).borderBlockEndWidth).toBe("1px");
    expect(after(1).display).toBe("none");
  });

  it("is edge to edge in Minimal and an inset rounded panel in Cupertino", async () => {
    const root = await page(
      skin,
      `<camo-list-section title="T"><camo-list-item headline="A"></camo-list-item></camo-list-section>`,
    );
    const panel = inner(q(root, "camo-list-section"), ".panel");
    const sec = inner(q(root, "camo-list-section"), ".sec");
    if (skin === "minimal") {
      expect(parseFloat(getComputedStyle(panel).borderStartStartRadius)).toBe(0);
      expect(getComputedStyle(sec).marginInlineStart).toBe("0px");
    } else {
      expect(parseFloat(getComputedStyle(panel).borderStartStartRadius)).toBeGreaterThan(0);
      expect(parseFloat(getComputedStyle(sec).marginInlineStart)).toBeGreaterThan(0);
    }
  });
});

describe.each(["minimal", "cupertino"])("camo-accordion under %s", (skin) => {
  const body = `<camo-accordion id="a" title="Shipping" subtitle="2 days"><div id="c"><button id="inside">Track</button></div></camo-accordion>`;

  it("is a button with expanded state, whose title is a heading, with the content hidden while closed", async () => {
    const root = await page(skin, body);
    const a = q(root, "#a");
    const head = inner(a, ".head");
    expect(head.getAttribute("aria-expanded")).toBe("false");
    expect(head.closest("h3")).not.toBeNull();
    expect(getComputedStyle(inner(a, ".panel")).display).toBe("none");
    expect(a.hasAttribute("title")).toBe(false);
    expect(inner(a, ".subtitle").textContent).toBe("2 days");
    a.expanded = true;
    await settled(root);
    expect(head.getAttribute("aria-expanded")).toBe("true");
    expect(getComputedStyle(inner(a, ".panel")).display).not.toBe("none");
    expect(inner(a, ".panel").getAttribute("role")).toBe("region");
  });

  it("toggles by click, Enter and Space, asks first, fires camo-expanded-change, and keeps the content alive", async () => {
    const root = await page(skin, body);
    const a = q(root, "#a");
    const log: string[] = [];
    a.addEventListener("camo-before-change", () => log.push("before"));
    a.addEventListener("camo-expanded-change", (e: Event) =>
      log.push(`now:${(e as CustomEvent<{ expanded: boolean }>).detail.expanded}`),
    );
    inner(a, ".head").click();
    expect(a.expanded).toBe(true);
    inner(a, ".head").focus();
    await userEvent.keyboard("{Enter}");
    expect(a.expanded).toBe(false);
    await userEvent.keyboard(" ");
    expect(a.expanded).toBe(true);
    expect(log).toEqual(["before", "now:true", "before", "now:false", "before", "now:true"]);
    a.addEventListener("camo-before-change", (e: Event) => e.preventDefault());
    inner(a, ".head").click();
    expect(a.expanded).toBe(true);
    expect(q(root, "#c").isConnected).toBe(true); // alive while closed
  });

  it("does not toggle when disabled, and the group opens one at a time", async () => {
    const root = await page(
      skin,
      `<camo-accordion-group single-expand>
        <camo-accordion id="a" title="A" expanded>a</camo-accordion><camo-accordion id="b" title="B">b</camo-accordion><camo-accordion id="c" title="C" disabled>c</camo-accordion>
      </camo-accordion-group>`,
    );
    inner(q(root, "#b"), ".head").click();
    await settled(root);
    expect([q(root, "#a").expanded, q(root, "#b").expanded]).toEqual([false, true]);
    inner(q(root, "#c"), ".head").click();
    expect(q(root, "#c").expanded).toBe(false);
  });

  it("moves between the headers of a group with the arrow keys", async () => {
    const root = await page(
      skin,
      `<camo-accordion-group><camo-accordion id="a" title="A">a</camo-accordion><camo-accordion id="b" title="B">b</camo-accordion><camo-accordion id="c" title="C">c</camo-accordion></camo-accordion-group>`,
    );
    inner(q(root, "#a"), ".head").focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(q(root, "#b").shadowRoot!.activeElement).toBe(inner(q(root, "#b"), ".head"));
    await userEvent.keyboard("{End}");
    expect(q(root, "#c").shadowRoot!.activeElement).toBe(inner(q(root, "#c"), ".head"));
    await userEvent.keyboard("{ArrowDown}");
    expect(q(root, "#a").shadowRoot!.activeElement).toBe(inner(q(root, "#a"), ".head"));
  });
});

describe.each(["minimal", "cupertino"])("camo-skeleton under %s", (skin) => {
  it("is hidden from assistive technology, in each of its forms", async () => {
    const root = await page(
      skin,
      `<camo-skeleton id="b" height="3rem"></camo-skeleton><camo-skeleton id="t" variant="text" lines="3"></camo-skeleton>
       <camo-skeleton id="c" variant="circle" size="48px"></camo-skeleton><camo-skeleton id="l" variant="list-item" lines="2"></camo-skeleton>`,
    );
    for (const id of ["#b", "#t", "#c", "#l"])
      expect(inspectAria(q(root, id))).toMatchObject({ hidden: true });
    expect(inner(q(root, "#b"), ".sk").getBoundingClientRect().height).toBe(48);
    expect(q(root, "#t").shadowRoot!.querySelectorAll(".lines .sk")).toHaveLength(3);
    expect(inner(q(root, "#c"), ".sk").getBoundingClientRect().width).toBe(48);
    expect(q(root, "#l").shadowRoot!.querySelectorAll(".row .sk").length).toBe(3); // the leading shape and two lines
  });

  it("makes the last text line shorter, and sizes a list row's text like a real row's", async () => {
    const root = await page(
      skin,
      `<div style="inline-size:300px"><camo-skeleton variant="text" lines="2" last-line-fraction="0.5"></camo-skeleton></div>`,
    );
    const [first, last] = [
      ...q(root, "camo-skeleton").shadowRoot!.querySelectorAll<HTMLElement>(".lines .sk"),
    ];
    expect(
      Math.round(
        (last!.getBoundingClientRect().width / first!.getBoundingClientRect().width) * 10,
      ) / 10,
    ).toBe(0.5);
  });

  it("starts every skeleton at the same moment of the animation, however late it mounted", async () => {
    const root = await page(skin, `<camo-skeleton id="a" height="1rem"></camo-skeleton>`);
    await tick(130);
    root.insertAdjacentHTML("beforeend", `<camo-skeleton id="b" height="1rem"></camo-skeleton>`);
    await settled(root);
    const progress = (id: string): number | null =>
      inner(q(root, id), ".sk").getAnimations()[0]?.effect?.getComputedTiming().progress ?? null;
    const [a, b] = [progress("#a"), progress("#b")];
    // Under reduced motion there is nothing to keep in step; otherwise the two are at the same point of the cycle.
    if (a === null) expect(b).toBeNull();
    else expect(Math.abs(a - (b ?? 0))).toBeLessThan(0.08);
  });
});

describe.each(["minimal", "cupertino"])("camo-paged-list under %s", (skin) => {
  const items = [{ headline: "Ada" }, { headline: "Grace" }, { headline: "Katherine" }];
  const make = async (state: object, attrs = ""): Promise<{ root: HTMLElement; list: El }> => {
    const root = await page(skin, `<camo-paged-list label="People" ${attrs}></camo-paged-list>`);
    const list = q(root, "camo-paged-list");
    list.state = state;
    await settled(root);
    return { root, list };
  };
  const rows = (list: El): string[] =>
    [...list.shadowRoot!.querySelectorAll(".item camo-list-item")].map((r) => (r as El).headline);

  it("draws the items as a named list, keyed, and keeps rows that stay when the state changes", async () => {
    const { root, list } = await make({ items, endReached: true });
    expect(rows(list)).toEqual(["Ada", "Grace", "Katherine"]);
    expect(inner(list, '[role="list"]').getAttribute("aria-label")).toBe("People");
    expect(list.shadowRoot!.querySelectorAll('[role="listitem"]')).toHaveLength(3);
    list.itemKey = (i: { headline: string }) => i.headline;
    list.state = { items, endReached: true };
    await settled(root);
    const first = list.shadowRoot!.querySelector(".item")!;
    list.state = { items: [...items, { headline: "Hedy" }], endReached: true };
    await settled(root);
    expect(rows(list)).toHaveLength(4);
    expect(list.shadowRoot!.querySelector(".item")).toBe(first);
  });

  it("shows skeletons for the first page, one Loading status, and hides them from assistive technology", async () => {
    const { list } = await make({ items: [], loading: "initial" }, 'initial-skeleton-count="4"');
    expect(list.shadowRoot!.querySelectorAll("camo-skeleton")).toHaveLength(4);
    expect(inner(list, '[role="status"]').textContent).toBe("Loading");
    expect(inner(list, '[role="list"]').getAttribute("aria-busy")).toBe("true");
  });

  it("appends skeletons and says Loading more while the next page loads", async () => {
    const { list } = await make({ items, loading: "more" }, 'more-skeleton-count="2"');
    expect(rows(list)).toHaveLength(3);
    expect(list.shadowRoot!.querySelectorAll("camo-skeleton")).toHaveLength(2);
    expect(inner(list, '[role="status"]').textContent).toBe("Loading more");
  });

  it("shows the empty state, and the app's own through the empty slot", async () => {
    const { list, root } = await make(
      { items: [], endReached: true },
      'empty-title="Nobody" empty-message="Invite someone"',
    );
    expect(inner(list, "[part=empty] .t").textContent).toBe("Nobody");
    expect(inner(list, "[part=empty] .m").textContent).toBe("Invite someone");
    list.insertAdjacentHTML("beforeend", `<p slot="empty" id="mine">Mine</p>`);
    await settled(root);
    expect((inner(list, 'slot[name="empty"]') as HTMLSlotElement).assignedElements()).toHaveLength(
      1,
    );
  });

  it("shows a first-page error with Retry, and a retry row for the next page; Retry fires camo-retry", async () => {
    const { list } = await make({
      items: [],
      error: { message: "Server down", scope: "first-page" },
    });
    let retries = 0;
    list.addEventListener("camo-retry", () => retries++);
    expect(inner(list, "[part=error] .m").textContent).toBe("Server down");
    inner(list, "[part=error] .retry").click();
    list.state = { items, error: { message: "Could not load more", scope: "next-page" } };
    await settled(list);
    expect(rows(list)).toHaveLength(3);
    inner(list, "[part=retry-row] .retry").click();
    expect(retries).toBe(2);
  });

  it("fires camo-load-more once when the end is near, and again only after the state changes", async () => {
    const { list, root } = await make({ items, endReached: false });
    let loads = 0;
    list.addEventListener("camo-load-more", () => loads++);
    list.state = { items: [...items], endReached: false }; // a new state re-arms it
    await settled(root);
    await tick(150);
    expect(loads).toBe(1);
    await tick(150);
    expect(loads).toBe(1);
    list.state = { items: [...items, { headline: "More" }], endReached: false };
    await settled(root);
    await tick(150);
    expect(loads).toBe(2);
  });

  it("does not ask for more while loading, after the end, or after a next-page error", async () => {
    const { list, root } = await make({ items, loading: "more" });
    let loads = 0;
    list.addEventListener("camo-load-more", () => loads++);
    for (const state of [
      { items, loading: "more" },
      { items, endReached: true },
      { items, error: { message: "x", scope: "next-page" } },
      { items: [], error: { message: "x", scope: "first-page" } },
    ]) {
      list.state = state;
      await settled(root);
      await tick(120);
    }
    expect(loads).toBe(0);
  });

  it("fires camo-refresh after a pull of 80 px from the top on touch, only when refreshable", async () => {
    const { list } = await make({ items, endReached: true }, "refreshable");
    let refreshes = 0;
    list.addEventListener("camo-refresh", () => refreshes++);
    // WebKit has no `Touch` constructor, so the events are plain events that carry the touch lists a handler reads.
    const touch = (type: string, y: number): void => {
      const event = new Event(type, { bubbles: true });
      const point = { clientY: y, clientX: 10 };
      Object.defineProperties(event, {
        touches: { value: type === "touchend" ? [] : [point] },
        changedTouches: { value: [point] },
      });
      list.dispatchEvent(event);
    };
    touch("touchstart", 10);
    touch("touchmove", 100);
    touch("touchend", 100);
    expect(refreshes).toBe(1);
    touch("touchstart", 10);
    touch("touchmove", 30);
    touch("touchend", 30);
    expect(refreshes).toBe(1); // too short
  });
});

describe("controls inside a card or a row that is not itself a button", () => {
  it.each(["camo-card", "camo-list-item"])(
    "work, while the %s fires no click of its own",
    async (tag) => {
      const slot = tag === "camo-card" ? "" : ' slot="trailing"';
      const root = mount(
        `<camo-provider skin="minimal"><${tag} headline="Row"><camo-button${slot} text="Go"></camo-button></${tag}></camo-provider>`,
      );
      await settled(root);
      const host = root.querySelector<HTMLElement>(tag)!;
      const button = root.querySelector<HTMLElement>("camo-button")!;
      let pressed = 0;
      button.addEventListener("click", () => pressed++);
      button.click();
      expect(pressed).toBe(1);
      await userEvent.click(button);
      expect(pressed).toBe(2);
      let own = 0;
      host.addEventListener("click", () => own++);
      host.click();
      expect(own).toBe(0);
      // A disabled one blocks everything inside it too.
      host.setAttribute("disabled", "");
      await settled(root);
      button.click();
      expect(pressed).toBe(2);
    },
  );
});
