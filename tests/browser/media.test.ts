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
const svg = (fill: string): string =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><rect width="30" height="20" fill="${fill}"/></svg>`,
  );

describe.each(["minimal", "cupertino"])("camo-image under %s", (skin) => {
  it("shows the image once it has loaded, after a placeholder, and keeps its description as the name", async () => {
    const root = await page(
      skin,
      `<div style="width:300px"><camo-image src="${svg("teal")}" content-description="A lake" aspect-ratio="1.5"></camo-image></div>`,
    );
    await tick(200);
    const image = q(root, "camo-image");
    expect(inspectAria(image)).toMatchObject({ role: "img", label: "A lake" });
    expect(inner(image, ".frame").classList.contains("loaded")).toBe(true);
    expect(Number(getComputedStyle(inner(image, ".img")).opacity)).toBeGreaterThan(0.95);
    expect(inner(image, ".fallback")).toBeNull();
    expect((inner(image, ".img") as HTMLImageElement).alt).toBe("A lake");
  });

  it("holds the aspect ratio of a frame with no height", async () => {
    const root = await page(
      skin,
      `<div style="width:300px"><camo-image src="${svg("teal")}" aspect-ratio="2"></camo-image></div>`,
    );
    const box = q(root, "camo-image").getBoundingClientRect();
    expect(box.width / box.height).toBeCloseTo(2, 1);
  });

  it("shows the placeholder while loading, then the error mark with 'could not load' for a failed image", async () => {
    const root = await page(
      skin,
      `<div style="width:300px"><camo-image src="data:image/png;base64,AAAA" content-description="A lake" aspect-ratio="1.5"></camo-image><camo-image id="none" aspect-ratio="1.5"></camo-image></div>`,
    );
    await tick(200);
    const failed = q(root, "camo-image:not(#none)");
    expect(inner(failed, ".frame").classList.contains("failed")).toBe(true);
    expect(inner(failed, ".fallback svg")).not.toBeNull();
    expect(inspectAria(failed)).toMatchObject({ label: "A lake, could not load" });
    expect(getComputedStyle(inner(failed, ".img")).display).toBe("none");
    // No source is the placeholder.
    expect(inner(q(root, "#none"), ".frame").classList.contains("loading")).toBe(true);
    expect(inner(q(root, "#none"), ".fallback")).not.toBeNull();
  });

  it("is decorative with no description, and fires load and error", async () => {
    const root = await page(
      skin,
      `<div style="width:300px"><camo-image id="a" src="${svg("red")}" aspect-ratio="1"></camo-image></div>`,
    );
    await tick(200);
    expect(inspectAria(q(root, "#a"))?.hidden).toBe(true);
    expect((inner(q(root, "#a"), ".img") as HTMLImageElement).alt).toBe("");
    const el = q(root, "#a");
    const seen: string[] = [];
    el.addEventListener("load", () => seen.push("load"));
    el.addEventListener("error", () => seen.push("error"));
    el.src = svg("blue");
    await tick(200);
    el.src = "data:image/png;base64,AAAA";
    await tick(200);
    expect(seen).toEqual(["load", "error"]);
  });

  it("takes its shape and its fit", async () => {
    const root = await page(
      skin,
      `<div style="width:200px"><camo-image id="r" src="${svg("teal")}" shape="full" aspect-ratio="1"></camo-image><camo-image id="s" src="${svg("teal")}" shape="none" aspect-ratio="1" fit="contain"></camo-image></div>`,
    );
    expect(getComputedStyle(inner(q(root, "#r"), ".frame")).borderTopLeftRadius).not.toBe("0px");
    expect(getComputedStyle(inner(q(root, "#s"), ".frame")).borderTopLeftRadius).toBe("0px");
    expect(getComputedStyle(inner(q(root, "#s"), ".img")).objectFit).toBe("contain");
    expect(getComputedStyle(inner(q(root, "#r"), ".img")).objectFit).toBe("cover");
  });
});

describe.each(["minimal", "cupertino"])("camo-rating under %s", (skin) => {
  const stars = (el: El): number[] =>
    [...el.shadowRoot!.querySelectorAll<HTMLElement>(".fill")].map(
      (f) => Math.round(Number.parseFloat(f.style.inlineSize) * 10) / 10,
    );

  it("draws the value as filled stars, half a star for half a step", async () => {
    const root = await page(
      skin,
      `<camo-rating label="Quality" value="3.5" step="half"></camo-rating>`,
    );
    expect(stars(q(root, "camo-rating"))).toEqual([100, 100, 100, 50, 0]);
  });

  it("is an adjustable value announcing 'n of m stars', and an image when read-only", async () => {
    const root = await page(
      skin,
      `<camo-rating id="a" label="Quality" value="3.5" step="half"></camo-rating><camo-rating id="b" label="Quality" value="4" readonly></camo-rating>`,
    );
    expect(inspectAria(q(root, "#a"))).toMatchObject({
      role: "slider",
      label: "Quality",
      value: { now: 3.5, min: 0, max: 5, text: "3.5 of 5 stars" },
    });
    expect(inspectAria(q(root, "#b"))).toMatchObject({
      role: "img",
      label: "Quality, 4 of 5 stars",
    });
    expect(q(root, "#a").tabIndex).toBe(0);
    expect(q(root, "#b").hasAttribute("tabindex")).toBe(false);
  });

  it("changes with the keyboard by a step, raising on Up and Right, with Home and End", async () => {
    const root = await page(
      skin,
      `<camo-rating label="Quality" value="2" step="half"></camo-rating>`,
    );
    const rating = q(root, "camo-rating");
    const seen: string[] = [];
    for (const name of ["camo-before-change", "input", "change"])
      rating.addEventListener(name, () => seen.push(name));
    rating.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(rating.value).toBe(2.5);
    await userEvent.keyboard("{ArrowRight}");
    expect(rating.value).toBe(3);
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowLeft}");
    expect(rating.value).toBe(2);
    await userEvent.keyboard("{End}");
    expect(rating.value).toBe(5);
    await userEvent.keyboard("{ArrowUp}");
    expect(rating.value).toBe(5); // never above the maximum
    await userEvent.keyboard("{Home}");
    expect(rating.value).toBe(0);
    expect(seen.slice(0, 3)).toEqual(["camo-before-change", "input", "change"]);
  });

  it("mirrors Left and Right in right-to-left", async () => {
    const root = await page(skin, `<camo-rating label="Quality" value="2"></camo-rating>`, "rtl");
    const rating = q(root, "camo-rating");
    rating.focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(rating.value).toBe(3);
    await userEvent.keyboard("{ArrowRight}");
    expect(rating.value).toBe(2);
  });

  it("sets the value from a click or a drag along the stars, and fills from the right in right-to-left", async () => {
    const root = await page(
      skin,
      `<camo-rating label="Quality" value="1" step="half"></camo-rating>`,
    );
    const rating = q(root, "camo-rating");
    const row = inner(rating, ".rating").getBoundingClientRect();
    const at = (fraction: number): [number, number] => [
      row.left + row.width * fraction,
      row.top + row.height / 2,
    ];
    const fire = (type: string, [x, y]: [number, number]): void => {
      rating.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          clientX: x,
          clientY: y,
          button: 0,
          pointerId: 1,
          pointerType: "mouse",
        }),
      );
    };
    fire("pointerdown", at(0.7));
    fire("pointerup", at(0.7));
    expect(rating.value).toBe(3.5);
    fire("pointerdown", at(0.3));
    fire("pointermove", at(0.9));
    expect(rating.value).toBe(4.5);
    fire("pointerup", at(0.9));
    const rtl = await page(skin, `<camo-rating label="Quality" value="0"></camo-rating>`, "rtl");
    const r2 = q(rtl, "camo-rating");
    const box = inner(r2, ".rating").getBoundingClientRect();
    r2.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientX: box.right - box.width * 0.1,
        clientY: box.top + 5,
        button: 0,
        pointerId: 1,
      }),
    );
    r2.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1 }));
    expect(r2.value).toBe(1);
  });

  it("does not clear on a click of the current value, shows a hover preview for the mouse, and can be cancelled", async () => {
    const root = await page(skin, `<camo-rating label="Quality" value="2"></camo-rating>`);
    const rating = q(root, "camo-rating");
    const row = inner(rating, ".rating").getBoundingClientRect();
    const x = row.left + (row.width * 1.9) / 5;
    rating.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: x,
        clientY: row.top + 5,
        pointerType: "mouse",
      }),
    );
    await rating.updateComplete;
    expect(stars(rating)).toEqual([100, 100, 0, 0, 0]);
    rating.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientX: x,
        clientY: row.top + 5,
        button: 0,
        pointerId: 1,
      }),
    );
    rating.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1 }));
    expect(rating.value).toBe(2);
    rating.addEventListener("camo-before-change", (e: Event) => e.preventDefault());
    rating.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(rating.value).toBe(2);
  });

  it("ignores read-only and disabled ratings, and is a form field that resets", async () => {
    const root = await page(
      skin,
      `<form><camo-rating id="a" name="q" label="Quality" value="3"></camo-rating><camo-rating id="b" label="B" value="3" readonly></camo-rating><camo-rating id="c" label="C" value="3" disabled></camo-rating></form>`,
    );
    for (const id of ["#b", "#c"]) {
      q(root, id).focus();
      await userEvent.keyboard("{ArrowUp}");
      expect(q(root, id).value).toBe(3);
    }
    expect(new FormData(root.querySelector("form")!).get("q")).toBe("3");
    const a = q(root, "#a");
    a.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(new FormData(root.querySelector("form")!).get("q")).toBe("4");
    root.querySelector("form")!.reset();
    expect(a.value).toBe(3);
  });

  it("has sizes", async () => {
    const root = await page(
      skin,
      `<camo-rating id="s" label="x" value="1" size="small"></camo-rating><camo-rating id="l" label="x" value="1" size="large"></camo-rating>`,
    );
    expect(q(root, "#s").getBoundingClientRect().height).toBeLessThan(
      q(root, "#l").getBoundingClientRect().height,
    );
  });
});

const slides = (n = 3): string =>
  Array.from(
    { length: n },
    (_, i) => `<div style="height:80px;background:#${i}${i}${i}">${i + 1}</div>`,
  ).join("");

describe.each(["minimal", "cupertino"])("camo-carousel under %s", (skin) => {
  const open = async (attrs = "", n = 3, dir = "ltr"): Promise<{ root: HTMLElement; car: El }> => {
    const root = await page(
      skin,
      `<div style="width:300px"><camo-carousel caption="Photos" ${attrs}>${slides(n)}</camo-carousel></div>`,
      dir,
    );
    await tick(100);
    return { root, car: q(root, "camo-carousel") };
  };

  it("is a named region of slides, each announcing its place, with one Tab stop on the strip", async () => {
    const { root, car } = await open();
    expect(inspectAria(car)).toMatchObject({ role: "region", label: "Photos" });
    expect(car.getAttribute("aria-roledescription")).toBe("carousel");
    const items = [...car.children] as HTMLElement[];
    expect(items.map((i) => i.getAttribute("aria-label"))).toEqual(["1 of 3", "2 of 3", "3 of 3"]);
    expect(items[0]!.getAttribute("aria-roledescription")).toBe("slide");
    expect(inner(car, ".strip").tabIndex).toBe(0);
    void root;
  });

  it("shows one item at a time, and the next one peeking in the peek layout", async () => {
    const { car } = await open();
    const items = [...car.children] as HTMLElement[];
    expect(items[0]!.getBoundingClientRect().width).toBeCloseTo(300, -1);
    const peek = await open('layout="peek"');
    const widths = [...peek.car.children].map(
      (c) => (c as HTMLElement).getBoundingClientRect().width,
    );
    expect(widths[0]).toBeLessThan(300);
    const second = (peek.car.children[1] as HTMLElement).getBoundingClientRect();
    const strip = inner(peek.car, ".strip").getBoundingClientRect();
    expect(second.left).toBeLessThan(strip.right); // the next one shows at the edge
  });

  it("steps with the buttons, the keyboard and Home and End, and reports the page once per change", async () => {
    const { car } = await open('show-buttons="always"');
    const pages: number[] = [];
    car.addEventListener("camo-page-change", (e: Event) =>
      pages.push((e as CustomEvent).detail.page),
    );
    (inner(car, "[data-part=next]") as HTMLButtonElement).click();
    await tick(1000);
    expect(car.page).toBe(1);
    inner(car, ".strip").focus();
    await userEvent.keyboard("{ArrowRight}");
    await tick(1000);
    expect(car.page).toBe(2);
    await userEvent.keyboard("{Home}");
    await tick(1000);
    expect(car.page).toBe(0);
    await userEvent.keyboard("{End}");
    await tick(1000);
    expect(car.page).toBe(2);
    expect(pages).toEqual([1, 2, 0, 2]);
  });

  it("follows a swipe: the page comes from where it scrolled to", async () => {
    const { car } = await open();
    const strip = inner(car, ".strip");
    strip.scrollTo({ left: 300, behavior: "instant" as ScrollBehavior });
    await tick(300);
    expect(car.page).toBe(1);
    expect(inner(car, ".dot.active")).toBe(inner(car, ".dots").children[1]);
  });

  it("moves when the app sets page, and mirrors in right-to-left", async () => {
    const { car } = await open();
    car.page = 2;
    await car.updateComplete;
    await tick(600);
    expect(inner(car, ".strip").scrollLeft).toBeGreaterThan(300);
    const rtl = await open("", 3, "rtl");
    inner(rtl.car, ".strip").focus();
    await userEvent.keyboard("{ArrowLeft}");
    await tick(600);
    expect(rtl.car.page).toBe(1);
  });

  it("shows the buttons on request, disables the one that cannot move, and none for one item", async () => {
    const { car } = await open('show-buttons="always"');
    expect((inner(car, "[data-part=prev]") as HTMLButtonElement).disabled).toBe(true);
    expect((inner(car, "[data-part=next]") as HTMLButtonElement).disabled).toBe(false);
    expect(inner(car, "[data-part=next]").getAttribute("aria-label")).toBe("Next");
    const never = await open('show-buttons="never"');
    expect(inner(never.car, "[data-part=next]")).toBeNull();
    const one = await open('show-buttons="always"', 1);
    expect(inner(one.car, "[data-part=next]")).toBeNull();
    expect(inner(one.car, ".dots")).toBeNull();
  });

  it("makes an item out of sight inert, and hides the dots on request", async () => {
    const { car } = await open("hide-indicator");
    const items = [...car.children] as HTMLElement[];
    expect(items[0]!.inert).toBe(false);
    expect(items[2]!.inert).toBe(true);
    expect(inner(car, ".dots")).toBeNull();
  });

  it("autoplays only when asked, stops once the user steps, and never under reduced motion's rule while held", async () => {
    const { car } = await open('autoplay="150" show-buttons="always"');
    let changes = 0;
    car.addEventListener("camo-page-change", () => changes++);
    await tick(1500);
    expect(changes).toBeGreaterThan(0);
    // A step by the user stops it for good: after the step settles, nothing more moves it.
    // The user takes hold of it (a touch, a click or a key): from then on it stays where they put it.
    car.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await tick(2500);
    const after = changes;
    await tick(1200);
    expect(changes).toBe(after);
    const still = await open("", 3);
    await tick(400);
    expect(still.car.page).toBe(0);
  });
});

describe.each(["minimal", "cupertino"])("camo-file-uploader under %s", (skin) => {
  const rows = [
    { id: "1", name: "report.pdf", sizeBytes: 1048576, progress: 0.45, status: "uploading" },
    { id: "2", name: "photo.png", sizeBytes: 204800, status: "done" },
    { id: "3", name: "video.mov", sizeBytes: 9437184, status: "failed", message: "Too large" },
  ];

  it("is one button zone with the hint as its description, and fires a cancelable camo-pick", async () => {
    const root = await page(
      skin,
      `<camo-file-uploader label="Upload files" hint="PNG or JPG, up to 5 MB"></camo-file-uploader>`,
    );
    const up = q(root, "camo-file-uploader");
    const zone = inner(up, "[data-part=zone]") as HTMLButtonElement;
    expect(zone.getAttribute("aria-describedby")).toBe("hint");
    expect(inner(up, "#hint").textContent).toBe("PNG or JPG, up to 5 MB");
    let picks = 0;
    up.addEventListener("camo-pick", (e: Event) => {
      picks++;
      e.preventDefault(); // the app opens its own picker
    });
    zone.focus();
    await userEvent.keyboard("{Enter}");
    zone.click();
    expect(picks).toBe(2);
  });

  it("draws each row with its name, size and state, and a progress bar", async () => {
    const root = await page(skin, `<camo-file-uploader label="Upload files"></camo-file-uploader>`);
    const up = q(root, "camo-file-uploader");
    up.files = rows;
    await up.updateComplete;
    await tick(100);
    const items = [...up.shadowRoot!.querySelectorAll<HTMLElement>(".row")];
    expect(items.map((i) => i.querySelector(".name")!.textContent)).toEqual([
      "report.pdf",
      "photo.png",
      "video.mov",
    ]);
    expect(items[0]!.querySelector(".info")!.textContent).toBe("1.0 MB · 45%");
    expect(items[1]!.querySelector(".info")!.textContent).toBe("200.0 KB · Done");
    expect(items[2]!.querySelector(".info")!.textContent).toBe("9.0 MB · Too large");
    expect(items[0]!.querySelector("camo-progress-bar")!.progress).toBe(0.45);
    expect(items[1]!.querySelector("camo-progress-bar")).toBeNull();
    expect(items[2]!.querySelector("camo-progress-bar")!.tone).toBe("error");
    // A failed row is announced once, as an alert.
    expect(items[2]!.querySelector(".info")!.getAttribute("role")).toBe("alert");
    expect(items[0]!.querySelector(".info")!.getAttribute("role")).toBeNull();
  });

  it("fires camo-remove and camo-retry with the row's id, from named buttons", async () => {
    const root = await page(skin, `<camo-file-uploader label="Upload files"></camo-file-uploader>`);
    const up = q(root, "camo-file-uploader");
    up.files = rows;
    await up.updateComplete;
    const seen: string[] = [];
    up.addEventListener("camo-remove", (e: Event) =>
      seen.push(`remove:${(e as CustomEvent).detail.id}`),
    );
    up.addEventListener("camo-retry", (e: Event) =>
      seen.push(`retry:${(e as CustomEvent).detail.id}`),
    );
    const retry = up.shadowRoot!.querySelector<HTMLButtonElement>("[data-part=retry]")!;
    expect(retry.getAttribute("aria-label")).toBe("Retry video.mov");
    retry.click();
    const remove = up.shadowRoot!.querySelectorAll<HTMLButtonElement>("[data-part=remove]")[0]!;
    expect(remove.getAttribute("aria-label")).toBe("Remove report.pdf");
    remove.click();
    expect(seen).toEqual(["retry:3", "remove:1"]);
    expect(up.shadowRoot!.querySelectorAll("[data-part=retry]")).toHaveLength(1);
  });

  it("takes files from a drop, shows the drag-over state, and keeps them as its form value", async () => {
    const root = await page(
      skin,
      `<form><camo-file-uploader name="docs" label="Upload files" multiple></camo-file-uploader></form>`,
    );
    const up = q(root, "camo-file-uploader");
    const file = new File(["hello"], "a.txt", { type: "text/plain" });
    const data = new DataTransfer();
    data.items.add(file);
    up.dispatchEvent(
      new DragEvent("dragenter", { bubbles: true, cancelable: true, dataTransfer: data }),
    );
    await up.updateComplete;
    expect(inner(up, "[data-part=zone]").classList.contains("drag")).toBe(true);
    let dropped: File[] = [];
    up.addEventListener(
      "camo-files-dropped",
      (e: Event) => (dropped = (e as CustomEvent).detail.files),
    );
    up.dispatchEvent(
      new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: data }),
    );
    await up.updateComplete;
    expect(dropped.map((f) => f.name)).toEqual(["a.txt"]);
    expect(inner(up, "[data-part=zone]").classList.contains("drag")).toBe(false);
    expect((new FormData(root.querySelector("form")!).get("docs") as File).name).toBe("a.txt");
    root.querySelector("form")!.reset();
    await up.updateComplete;
    expect(new FormData(root.querySelector("form")!).get("docs")).toBeNull();
  });

  it("does nothing when disabled, and a single-file zone keeps the last file", async () => {
    const root = await page(
      skin,
      `<camo-file-uploader id="d" label="Upload files" disabled></camo-file-uploader><camo-file-uploader id="s" label="Upload files"></camo-file-uploader>`,
    );
    const zone = inner(q(root, "#d"), "[data-part=zone]") as HTMLButtonElement;
    expect(zone.disabled).toBe(true);
    const one = new File(["1"], "one.txt");
    const two = new File(["2"], "two.txt");
    const data = new DataTransfer();
    data.items.add(one);
    q(root, "#d").dispatchEvent(
      new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: data }),
    );
    expect(q(root, "#d").chosen).toHaveLength(0);
    const s = q(root, "#s");
    const d1 = new DataTransfer();
    d1.items.add(one);
    s.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: d1 }));
    const d2 = new DataTransfer();
    d2.items.add(two);
    s.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: d2 }));
    expect(s.chosen.map((f: File) => f.name)).toEqual(["two.txt"]);
  });
});
