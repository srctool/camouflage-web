import { writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import type { Browser, Page } from "@playwright/test";

/** How many pixels differ between two screenshots (small colour differences below the threshold are not counted). */
function differing(a: Buffer, b: Buffer): number {
  const [x, y] = [PNG.sync.read(a), PNG.sync.read(b)];
  return pixelmatch(x.data, y.data, undefined, x.width, x.height, { threshold: 0.1 });
}

// Reduced motion is on (the config), so the loading spinner holds still and two renders of one page can be compared.

async function shot(
  browser: Browser,
  path: string,
  javaScriptEnabled: boolean,
): Promise<{ png: Buffer; page: Page }> {
  const context = await browser.newContext({
    javaScriptEnabled,
    reducedMotion: "reduce",
    viewport: { width: 800, height: 600 },
  });
  const page = await context.newPage();
  await page.goto(path);
  if (javaScriptEnabled) {
    // Hydrated: every camo element has upgraded and finished its first update.
    await page.evaluate(async () => {
      await Promise.all(
        ["camo-provider", "camo-button", "camo-dialog"].map((t) => customElements.whenDefined(t)),
      );
      const all = [...document.querySelectorAll("*")].filter(
        (e): e is Element & { updateComplete: Promise<boolean> } => "updateComplete" in e,
      );
      await Promise.all(all.map((e) => e.updateComplete));
    });
  }
  return { png: await page.screenshot(), page };
}

test("the server-rendered page has its skin, theme and scheme with scripts off", async ({
  browser,
}) => {
  const { page } = await shot(browser, "/", false);
  // Declarative shadow DOM was attached by the parser, with no script involved.
  const result = await page.evaluate(() => ({
    shadow: [...document.querySelectorAll("camo-button")].every((b) => b.shadowRoot !== null),
    surface: getComputedStyle(document.querySelectorAll("camo-provider")[1]!).backgroundColor,
    solid: getComputedStyle(
      document.querySelector("camo-button")!.shadowRoot!.querySelector(".camo-surface")!,
    ).backgroundColor,
    schemes: [...document.querySelectorAll("camo-provider")].map((p) =>
      p.getAttribute("data-camo-scheme"),
    ),
  }));
  expect(result.shadow).toBe(true);
  expect(result.schemes).toEqual(["light", "dark"]);
  expect(result.solid).toBe("rgb(27, 27, 27)"); // Minimal's ink primary
  expect(result.surface).toBe("rgb(0, 0, 0)"); // Cupertino dark's surface
});

test("the page carries role and name in its HTML", async ({ request }) => {
  const html = await (await request.get("/")).text();
  expect(html).toMatch(/<camo-button[^>]*role="button"[^>]*aria-label="solid"/);
  expect(html).toMatch(/<camo-button[^>]*aria-label="Unavailable"[^>]*aria-disabled="true"/);
});

test("hydration does not move anything: the page looks the same before and after", async ({
  browser,
}) => {
  const before = await shot(browser, "/", false);
  const after = await shot(browser, "/", true);
  const count = differing(before.png, after.png);
  expect(
    count,
    `${count} pixels differ between the server render and the hydrated page`,
  ).toBeLessThan(50);
});

for (const skin of ["minimal", "cupertino"]) {
  test(`a server-rendered ${skin} dialog paints where the modal does`, async ({
    browser,
  }, testInfo) => {
    const before = await shot(browser, `/dialog?skin=${skin}&scheme=light`, false);
    const after = await shot(browser, `/dialog?skin=${skin}&scheme=light`, true);
    // After hydration the dialog is modal (top layer); before, it was open but not modal. They must match.
    const modal = await after.page.evaluate(() =>
      document.querySelector("camo-dialog")!.shadowRoot!.querySelector("dialog")!.matches(":modal"),
    );
    expect(modal).toBe(true);
    writeFileSync(testInfo.outputPath("server-render.png"), before.png);
    writeFileSync(testInfo.outputPath("hydrated.png"), after.png);
    await testInfo.attach("server-render", { body: before.png, contentType: "image/png" });
    await testInfo.attach("hydrated", { body: after.png, contentType: "image/png" });
    // A box-shadow scrim stands in for the modal's backdrop before hydration, so a few anti-aliased pixels may differ,
    // but nothing may move.
    const count = differing(before.png, after.png);
    expect(count, `${count} pixels differ when the dialog became modal`).toBeLessThan(50);
  });
}
