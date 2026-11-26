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
        [
          "camo-provider",
          "camo-button",
          "camo-dialog",
          "camo-text-field",
          "camo-checkbox",
          "camo-date-picker",
        ].map((t) => customElements.whenDefined(t)),
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
  const { page } = await shot(browser, "/?nojs", false);
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

test("the page carries role and name in its HTML, so it works without hydration", async ({
  request,
}) => {
  const html = await (await request.get("/?nojs")).text();
  expect(html).not.toContain("<script");
  expect(html).toMatch(/<camo-button[^>]*role="button"[^>]*aria-label="solid"/);
  expect(html).toMatch(/<camo-button[^>]*aria-label="Unavailable"[^>]*aria-disabled="true"/);
});

test("hydration does not move anything: the page looks the same before and after", async ({
  browser,
}) => {
  const before = await shot(browser, "/?nojs", false);
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
    const before = await shot(browser, `/dialog?skin=${skin}&scheme=light&nojs`, false);
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

for (const skin of ["minimal", "cupertino"]) {
  test(`the ${skin} inputs hydrate without moving, and keep their values`, async ({
    browser,
  }, testInfo) => {
    const before = await shot(browser, `/inputs?skin=${skin}&scheme=light&nojs`, false);
    // With scripts off the inputs are already there: values, labels and state, written by the server.
    const html = await before.page.content();
    expect(html).toContain('value="ada@example.com"');
    expect(html).toMatch(/<camo-checkbox[^>]*aria-checked="true"/);
    const after = await shot(browser, `/inputs?skin=${skin}&scheme=light`, true);
    const state = await after.page.evaluate(() => ({
      email: (document.querySelector("camo-text-field") as unknown as { value: string }).value,
      checked: (document.querySelector("camo-checkbox") as unknown as { checked: boolean }).checked,
      plan: (document.querySelector("camo-radio-group") as unknown as { value: string }).value,
      volume: (document.querySelector("camo-slider") as unknown as { value: number }).value,
      form: [...new FormData(document.querySelector("form")!).entries()].map(
        ([k, v]) => `${k}=${String(v)}`,
      ),
    }));
    expect(state).toMatchObject({
      email: "ada@example.com",
      checked: true,
      plan: "pro",
      volume: 30,
    });
    expect(state.form).toEqual(
      expect.arrayContaining([
        "email=ada@example.com",
        "terms=on",
        "wifi=on",
        "plan=pro",
        "volume=30",
        "qty=3",
        "when=2026-11-18",
        "at=14:30",
      ]),
    );
    writeFileSync(testInfo.outputPath("server-render.png"), before.png);
    writeFileSync(testInfo.outputPath("hydrated.png"), after.png);
    const count = differing(before.png, after.png);
    expect(
      count,
      `${count} pixels differ between the server render and the hydrated inputs`,
    ).toBeLessThan(50);
  });
}

for (const skin of ["minimal", "cupertino"]) {
  test(`the ${skin} structure hydrates without moving`, async ({ browser }, testInfo) => {
    const before = await shot(browser, `/structure?skin=${skin}&scheme=light&nojs`, false);
    const html = await before.page.content();
    expect(html).toMatch(/<camo-card[^>]*role="button"[^>]*aria-pressed="true"/);
    expect(html).toContain("Indonesia");
    const after = await shot(browser, `/structure?skin=${skin}&scheme=light`, true);
    writeFileSync(testInfo.outputPath("server-render.png"), before.png);
    writeFileSync(testInfo.outputPath("hydrated.png"), after.png);
    const count = differing(before.png, after.png);
    expect(
      count,
      `${count} pixels differ between the server render and the hydrated page`,
    ).toBeLessThan(50);
  });
}

for (const skin of ["minimal", "cupertino"]) {
  test(`the ${skin} feedback and navigation hydrates without moving`, async ({
    browser,
  }, testInfo) => {
    const before = await shot(browser, `/feedback?skin=${skin}&scheme=light&nojs`, false);
    const html = await before.page.content();
    expect(html).toMatch(/<camo-progress-bar[^>]*role="progressbar"[^>]*aria-valuenow="40"/);
    expect(html).toMatch(/<camo-nav-item[^>]*aria-current="page"/);
    expect(html).toContain("Dwiki Riyadi");
    const after = await shot(browser, `/feedback?skin=${skin}&scheme=light`, true);
    writeFileSync(testInfo.outputPath("server-render.png"), before.png);
    writeFileSync(testInfo.outputPath("hydrated.png"), after.png);
    const count = differing(before.png, after.png);
    expect(
      count,
      `${count} pixels differ between the server render and the hydrated page`,
    ).toBeLessThan(50);
  });
}

for (const skin of ["minimal", "cupertino"]) {
  test(`the ${skin} later components hydrate without moving`, async ({ browser }, testInfo) => {
    const before = await shot(browser, `/later?skin=${skin}&scheme=light&nojs`, false);
    const html = await before.page.content();
    expect(html).toMatch(/<camo-rating[^>]*role="slider"[^>]*aria-valuenow="3.5"/);
    const after = await shot(browser, `/later?skin=${skin}&scheme=light`, true);
    writeFileSync(testInfo.outputPath("server-render.png"), before.png);
    writeFileSync(testInfo.outputPath("hydrated.png"), after.png);
    const count = differing(before.png, after.png);
    expect(
      count,
      `${count} pixels differ between the server render and the hydrated page`,
    ).toBeLessThan(50);
  });
}

for (const skin of ["minimal", "cupertino"]) {
  test(`the ${skin} charts are drawn by the server and hydrate without moving`, async ({
    browser,
    request,
  }, testInfo) => {
    // The response itself: the DOM's serialization leaves shadow roots out.
    const html = await (await request.get(`/charts?skin=${skin}&scheme=light&nojs`)).text();
    const before = await shot(browser, `/charts?skin=${skin}&scheme=light&nojs`, false);
    expect(html).toContain("Line chart, 2 series, 4 categories");
    expect(html).toContain('class="slice"');
    const after = await shot(browser, `/charts?skin=${skin}&scheme=light`, true);
    writeFileSync(testInfo.outputPath("server-render.png"), before.png);
    writeFileSync(testInfo.outputPath("hydrated.png"), after.png);
    const count = differing(before.png, after.png);
    expect(
      count,
      `${count} pixels differ between the server render and the hydrated charts`,
    ).toBeLessThan(50);
  });
}
