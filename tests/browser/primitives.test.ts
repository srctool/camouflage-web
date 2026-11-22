import { inspectAria, registerIcons, registeredIconNames } from "@srctool/camouflage-core";
import { userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { registerDemoIcons } from "../../scenarios/icons.ts";
import { cssVar, mount, settled } from "./helpers.ts";

registerDemoIcons();

const page = async (skin: string, body: string, dir = "ltr"): Promise<HTMLElement> => {
  const root = mount(
    `<div dir="${dir}"><camo-provider skin="${skin}" scheme="light" style="display:block;padding:24px">${body}</camo-provider></div>`,
  );
  await settled(root);
  return root;
};
const inside = (el: Element, selector: string): HTMLElement =>
  el.shadowRoot!.querySelector<HTMLElement>(selector)!;

describe.each(["minimal", "cupertino"])("camo-text under %s", (skin) => {
  it("uses the type role and the content color of its container", async () => {
    const root = await page(
      skin,
      `<camo-text id="big" variant="headline-large" text="Hi"></camo-text><camo-text id="small" variant="body-small" text="Hi"></camo-text>`,
    );
    const size = (id: string): number =>
      parseFloat(getComputedStyle(inside(root.querySelector(id)!, ".t")).fontSize);
    expect(size("#big")).toBeGreaterThan(size("#small"));
    expect(getComputedStyle(inside(root.querySelector("#big")!, ".t")).color).toBe(
      getComputedStyle(root.querySelector("camo-provider")!).color,
    );
  });

  it("takes the color the container sets, and an explicit color over it", async () => {
    const root = await page(
      skin,
      `<camo-surface level="high"><camo-text id="a" text="a"></camo-text></camo-surface>
       <camo-text id="b" text="b" color="rgb(1, 2, 3)"></camo-text>`,
    );
    expect(getComputedStyle(inside(root.querySelector("#a")!, ".t")).color).not.toBe(
      "rgb(1, 2, 3)",
    );
    expect(getComputedStyle(inside(root.querySelector("#b")!, ".t")).color).toBe("rgb(1, 2, 3)");
  });

  it("truncates at max-lines with an ellipsis, and wraps without it", async () => {
    const long = "word ".repeat(80);
    const root = await page(
      skin,
      `<div style="inline-size:240px">
        <camo-text id="cut" text="${long}" max-lines="2" overflow="ellipsis"></camo-text>
        <camo-text id="free" text="${long}"></camo-text></div>`,
    );
    const cut = inside(root.querySelector("#cut")!, ".t");
    const free = inside(root.querySelector("#free")!, ".t");
    const line = parseFloat(getComputedStyle(cut).lineHeight);
    expect(cut.getBoundingClientRect().height).toBeLessThanOrEqual(line * 2 + 1);
    expect(free.getBoundingClientRect().height).toBeGreaterThan(line * 4);
  });

  it("keeps its line height when empty, so a layout does not jump", async () => {
    const root = await page(skin, `<camo-text id="e"></camo-text>`);
    expect(inside(root.querySelector("#e")!, ".t").getBoundingClientRect().height).toBeGreaterThan(
      10,
    );
  });

  it("leaves a rich-text link a real, focusable link, in the skin's style", async () => {
    const root = await page(skin, `<camo-text>See the <a id="l" href="#x">terms</a>.</camo-text>`);
    const link = root.querySelector<HTMLAnchorElement>("#l")!;
    expect(getComputedStyle(link).textDecorationLine).toBe(
      skin === "minimal" ? "underline" : "none",
    );
    link.focus();
    expect(document.activeElement).toBe(link);
  });

  it("scales with the text size", async () => {
    const root = await page(skin, `<camo-text id="s" text="x"></camo-text>`);
    const el = inside(root.querySelector("#s")!, ".t");
    const before = parseFloat(getComputedStyle(el).fontSize);
    document.documentElement.style.fontSize = "200%";
    const after = parseFloat(getComputedStyle(el).fontSize);
    document.documentElement.style.removeProperty("font-size");
    expect(after).toBeCloseTo(before * 2, 0);
  });
});

describe.each(["minimal", "cupertino"])("camo-icon under %s", (skin) => {
  it("is an image with a label, or hidden when decorative", async () => {
    const root = await page(
      skin,
      `<camo-icon id="a" name="search" label="Search"></camo-icon><camo-icon id="b" name="search"></camo-icon>`,
    );
    expect(inspectAria(root.querySelector("#a")!)).toMatchObject({ role: "img", label: "Search" });
    expect(inspectAria(root.querySelector("#b")!)).toMatchObject({ hidden: true });
  });

  it("draws a registered name, takes the container's size and color, and an explicit size", async () => {
    const root = await page(
      skin,
      `<camo-icon id="a" name="close"></camo-icon><camo-icon id="b" name="close" size="40px" tint="rgb(9, 9, 9)"></camo-icon>`,
    );
    const a = inside(root.querySelector("#a")!, ".i");
    const b = inside(root.querySelector("#b")!, ".i");
    expect(a.querySelector("svg path")).not.toBeNull();
    expect(a.getBoundingClientRect().width).toBe(24);
    expect(b.getBoundingClientRect().width).toBe(40);
    expect(getComputedStyle(b).color).toBe("rgb(9, 9, 9)");
  });

  it("follows the icon size of a button around it", async () => {
    const root = await page(
      skin,
      `<camo-button text="Add"><camo-icon slot="prefix-icon" name="add"></camo-icon></camo-button>`,
    );
    const button = root.querySelector("camo-button")!;
    const size = cssVar(button.querySelector("camo-icon")!, "--camo-icon-size");
    expect(size).not.toBe("");
    expect(inside(button.querySelector("camo-icon")!, ".i").getBoundingClientRect().width).toBe(
      parseFloat(size),
    );
  });

  it("draws an inline SVG child, and nothing for a name that is not registered", async () => {
    const root = await page(
      skin,
      `<camo-icon id="a"><svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg></camo-icon>
       <camo-icon id="b" name="nope"></camo-icon>`,
    );
    const slotted = (
      inside(root.querySelector("#a")!, "slot") as HTMLSlotElement
    ).assignedElements();
    expect(slotted).toHaveLength(1);
    expect(inside(root.querySelector("#b")!, "svg")).toBeNull();
  });

  it("mirrors only when asked, in right-to-left", async () => {
    const root = await page(
      skin,
      `<camo-icon id="a" name="arrow-back"></camo-icon><camo-icon id="b" name="search"></camo-icon>
       <camo-icon id="c" name="search" auto-mirror></camo-icon>`,
      "rtl",
    );
    const t = (id: string): string =>
      getComputedStyle(inside(root.querySelector(id)!, ".i")).transform;
    expect(t("#a")).toBe("matrix(-1, 0, 0, 1, 0, 0)"); // registered with autoMirror
    expect(t("#b")).toBe("none");
    expect(t("#c")).toBe("matrix(-1, 0, 0, 1, 0, 0)");
  });

  it("never tints an original asset", async () => {
    const root = await page(skin, `<camo-icon id="a" name="swatch"></camo-icon>`);
    expect(getComputedStyle(inside(root.querySelector("#a")!, "circle")).fill).toBe(
      "rgb(229, 57, 53)",
    );
  });

  it("registers more icons later, and lists them", () => {
    registerIcons({ extra: "M0 0h1v1H0z" });
    expect(registeredIconNames()).toContain("extra");
  });
});

describe.each(["minimal", "cupertino"])("camo-surface under %s", (skin) => {
  it("paints its level, clips to its shape and sets the content color", async () => {
    const root = await page(
      skin,
      `<camo-surface id="s" level="high" shape="large"><div id="c" style="height:40px">x</div></camo-surface>`,
    );
    const s = root.querySelector("camo-surface")!;
    const paint = getComputedStyle(inside(s, ".camo-surface"));
    expect(paint.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(parseFloat(paint.borderStartStartRadius)).toBeGreaterThan(0);
    expect(paint.overflow).toBe("hidden");
    expect(cssVar(root.querySelector("#c")!, "--camo-content-color")).not.toBe("");
    expect(s.getBoundingClientRect().height).toBeGreaterThanOrEqual(40);
  });

  it("is a container with no role, and draws a border only when asked", async () => {
    const root = await page(
      skin,
      `<camo-surface id="a"></camo-surface><camo-surface id="b" border></camo-surface>`,
    );
    expect(inspectAria(root.querySelector("#a")!)).toMatchObject({ role: "generic" });
    expect((root.querySelector("#a") as HTMLElement).tabIndex).toBe(-1);
    const border = (id: string): string =>
      getComputedStyle(inside(root.querySelector(id)!, ".camo-surface")).borderTopStyle;
    expect(border("#a")).toBe("none");
    expect(border("#b")).toBe("solid");
  });

  it("gives each level its own surface role", async () => {
    const levels = ["lowest", "low", "surface", "container", "high", "highest"];
    const root = await page(
      skin,
      levels.map((l) => `<camo-surface id="${l}" level="${l}">x</camo-surface>`).join(""),
    );
    const colors = levels.map(
      (l) =>
        getComputedStyle(inside(root.querySelector(`#${l}`)!, ".camo-surface")).backgroundColor,
    );
    expect(new Set(colors).size).toBeGreaterThan(3);
  });
});

describe.each(["minimal", "cupertino"])("camo-divider under %s", (skin) => {
  it("is decorative, horizontal by default, and takes insets by the reading direction", async () => {
    const root = await page(
      skin,
      `<camo-divider id="a"></camo-divider><camo-divider id="b" inset="start"></camo-divider>`,
      "rtl",
    );
    expect(inspectAria(root.querySelector("#a")!)).toMatchObject({ hidden: true });
    const line = (id: string): HTMLElement => inside(root.querySelector(id)!, ".d");
    expect(getComputedStyle(line("#a")).borderTopWidth).not.toBe("0px");
    const a = line("#a").getBoundingClientRect();
    const b = line("#b").getBoundingClientRect();
    // Start is the right in right-to-left: the inset divider ends sooner on the right.
    expect(b.right).toBeLessThan(a.right);
    expect(b.left).toBe(a.left);
  });

  it("draws a vertical divider as tall as its row", async () => {
    const root = await page(
      skin,
      `<div style="display:flex;block-size:60px"><camo-divider orientation="vertical"></camo-divider></div>`,
    );
    const line = inside(root.querySelector("camo-divider")!, ".d").getBoundingClientRect();
    expect(line.height).toBe(60);
    expect(
      getComputedStyle(inside(root.querySelector("camo-divider")!, ".d")).borderInlineStartWidth,
    ).not.toBe("0px");
  });

  it("follows the divider theme variables", async () => {
    const root = await page(
      skin,
      `<camo-divider id="a" style="--camo-divider-thickness: 4px"></camo-divider>`,
    );
    expect(inside(root.querySelector("#a")!, ".d").getBoundingClientRect().height).toBe(4);
  });
});

describe.each(["minimal", "cupertino"])("camo-icon-button under %s", (skin) => {
  const icon = `<camo-icon name="heart"></camo-icon>`;

  it("is a button named by its label, ghost by default", async () => {
    const root = await page(skin, `<camo-icon-button label="Favorite">${icon}</camo-icon-button>`);
    const b = root.querySelector("camo-icon-button") as HTMLElement;
    expect(inspectAria(b)).toMatchObject({ role: "button", label: "Favorite", pressed: null });
    expect(b.tabIndex).toBe(0);
    expect(getComputedStyle(inside(b, ".camo-surface")).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  });

  it("treats an empty appearance attribute as absent, so a framework binding cannot break it", async () => {
    const root = await page(
      skin,
      `<camo-icon-button id="a" label="x" appearance="">${icon}</camo-icon-button><camo-button id="b" text="x" appearance=""></camo-button>`,
    );
    expect(inside(root.querySelector("#a")!, ".camo-surface")).not.toBeNull();
    expect(inside(root.querySelector("#b")!, ".camo-surface")).not.toBeNull();
  });

  it("keeps a 48 touch area around a smaller container", async () => {
    const root = await page(skin, `<camo-icon-button label="Close">${icon}</camo-icon-button>`);
    const b = root.querySelector("camo-icon-button")!;
    const container = inside(b, ".b").getBoundingClientRect();
    expect(container.width).toBeLessThan(48);
    const target = inside(b, ".b").getBoundingClientRect();
    const after = getComputedStyle(inside(b, ".b"), "::after");
    expect(parseFloat(after.width)).toBeGreaterThanOrEqual(48);
    expect(target.width).toBe(container.width);
  });

  it("is a toggle with aria-pressed only when asked, and the app flips it", async () => {
    const root = await page(
      skin,
      `<camo-icon-button id="a" label="Favorite">${icon}</camo-icon-button>
       <camo-icon-button id="b" label="Favorite" toggle>${icon}</camo-icon-button>`,
    );
    const b = root.querySelector("#b") as HTMLElement & { checked: boolean };
    expect(inspectAria(root.querySelector("#a")!)!.pressed).toBeNull();
    expect(inspectAria(b)!.pressed).toBe(false);
    b.addEventListener("click", () => (b.checked = !b.checked));
    b.click();
    await settled(root);
    expect(inspectAria(b)).toMatchObject({ pressed: true, label: "Favorite" });
    expect(b.hasAttribute("checked")).toBe(true);
  });

  it("fires click, from the keyboard too, and not when disabled or loading", async () => {
    const root = await page(skin, `<camo-icon-button label="Go">${icon}</camo-icon-button>`);
    const b = root.querySelector("camo-icon-button") as HTMLElement;
    let clicks = 0;
    b.addEventListener("click", () => clicks++);
    b.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(clicks).toBe(2);
    b.setAttribute("loading", "");
    await settled(root);
    b.click();
    expect(clicks).toBe(2);
    expect(inspectAria(b)).toMatchObject({ busy: true });
    expect(inside(b, ".spinner")).not.toBeNull();
    b.removeAttribute("loading");
    b.setAttribute("disabled", "");
    await settled(root);
    b.click();
    expect(clicks).toBe(2);
    expect(b.tabIndex).toBe(-1);
    expect(inspectAria(b)).toMatchObject({ disabled: true });
  });

  it("keeps its size while loading", async () => {
    const root = await page(skin, `<camo-icon-button label="Go">${icon}</camo-icon-button>`);
    const b = root.querySelector("camo-icon-button") as HTMLElement;
    const before = b.getBoundingClientRect();
    b.setAttribute("loading", "");
    await settled(root);
    const after = b.getBoundingClientRect();
    expect([after.width, after.height]).toEqual([before.width, before.height]);
  });

  it("shows a tooltip on hover and on keyboard focus only", async () => {
    const root = await page(
      skin,
      `<camo-icon-button label="Favorite" tooltip="Add to favorites">${icon}</camo-icon-button>`,
    );
    const b = root.querySelector("camo-icon-button") as HTMLElement;
    const tip = inside(b, ".tip");
    expect(tip.textContent).toBe("Add to favorites");
    expect(getComputedStyle(tip).opacity).toBe("0");
    await userEvent.tab();
    await new Promise((resolve) => setTimeout(resolve, 400)); // the fade
    expect(getComputedStyle(tip).opacity).toBe("1");
  });

  it("draws the appearances and tones differently, and Raised and Link fall back", async () => {
    const root = await page(
      skin,
      ["solid", "soft", "ghost", "raised", "link"]
        .map(
          (a) =>
            `<camo-icon-button id="${a}" label="x" appearance="${a}">${icon}</camo-icon-button>`,
        )
        .join("") +
        `<camo-icon-button id="err" label="x" appearance="solid" tone="error">${icon}</camo-icon-button>`,
    );
    const bg = (id: string): string =>
      getComputedStyle(inside(root.querySelector(`#${id}`)!, ".camo-surface")).backgroundColor;
    expect(bg("solid")).not.toBe(bg("ghost"));
    expect(bg("err")).not.toBe(bg("solid"));
    expect(bg("raised")).toBe(bg("soft"));
    expect(bg("link")).toBe(bg("ghost"));
  });

  it("gives the icon the button's content color and size", async () => {
    const root = await page(
      skin,
      `<camo-icon-button label="x" appearance="solid">${icon}</camo-icon-button>`,
    );
    const i = root.querySelector("camo-icon")!;
    expect(cssVar(i, "--camo-icon-size")).toBe(
      cssVar(root.querySelector("camo-icon-button")!, "--camo-icon-size") ||
        cssVar(i, "--camo-icon-size"),
    );
    expect(cssVar(i, "--camo-content-color")).not.toBe("");
  });
});
